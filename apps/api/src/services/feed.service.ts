import { prisma } from '../lib/prisma';
import { PostInput, CommentInput, ReportInput, RoleHierarchy, UserRole } from '@enxamistas/shared';
import { AppError } from '../errors/AppError';
import { AuditService } from './audit.service';
import { NotificationService } from './notification.service';

const notificationService = new NotificationService();

const authorSelect = {
  id: true,
  name: true,
  avatar: true,
  user: {
    select: {
      passport: true,
      role: true,
    },
  },
};

export class FeedService {
  async createPost(authorId: string, data: PostInput) {
    return prisma.post.create({
      data: {
        content: data.content,
        authorId,
        media: data.media?.length
          ? {
              create: data.media.map((m) => ({
                url: m.url,
                type: m.type,
              })),
            }
          : undefined,
      },
      include: {
        author: { select: authorSelect },
        media: true,
        _count: { select: { likes: true, comments: true } },
      },
    });
  }

  async getPosts(viewerProfileId: string, page = 1, limit = 10) {
    const pageNum = Math.max(1, page);
    const limitNum = Math.min(30, Math.max(1, limit));
    const skip = (pageNum - 1) * limitNum;

    const [posts, total] = await Promise.all([
      prisma.post.findMany({
        skip,
        take: limitNum,
        include: {
          author: { select: authorSelect },
          media: true,
          _count: { select: { likes: true, comments: true } },
          likes: {
            where: { authorId: viewerProfileId },
            select: { id: true },
          },
          comments: {
            where: { parentId: null },
            orderBy: { createdAt: 'asc' },
            include: {
              author: { select: authorSelect },
              _count: { select: { likes: true, replies: true } },
              likes: {
                where: { authorId: viewerProfileId },
                select: { id: true },
              },
              replies: {
                orderBy: { createdAt: 'asc' },
                include: {
                  author: { select: authorSelect },
                  _count: { select: { likes: true } },
                  likes: {
                    where: { authorId: viewerProfileId },
                    select: { id: true },
                  },
                },
              },
            },
          },
        },
        orderBy: { createdAt: 'desc' },
      }),
      prisma.post.count(),
    ]);

    const items = posts.map((post) => ({
      id: post.id,
      content: post.content,
      authorId: post.authorId,
      author: post.author,
      media: post.media,
      _count: post._count,
      likedByMe: post.likes.length > 0,
      createdAt: post.createdAt,
      updatedAt: post.updatedAt,
      comments: post.comments.map((c) => ({
        id: c.id,
        content: c.content,
        authorId: c.authorId,
        author: c.author,
        parentId: c.parentId,
        createdAt: c.createdAt,
        updatedAt: c.updatedAt,
        _count: c._count,
        likedByMe: c.likes.length > 0,
        replies: c.replies.map((r) => ({
          id: r.id,
          content: r.content,
          authorId: r.authorId,
          author: r.author,
          parentId: r.parentId,
          createdAt: r.createdAt,
          updatedAt: r.updatedAt,
          _count: r._count,
          likedByMe: r.likes.length > 0,
        })),
      })),
    }));

    return {
      items,
      total,
      page: pageNum,
      limit: limitNum,
      totalPages: Math.max(1, Math.ceil(total / limitNum)),
    };
  }

  async updatePost(postId: string, authorId: string, content: string) {
    const post = await prisma.post.findUnique({ where: { id: postId } });
    if (!post) throw new AppError('Publicação não encontrada', 404, 'POST_NOT_FOUND');
    if (post.authorId !== authorId) {
      throw new AppError('Você só pode editar suas próprias publicações', 403, 'FORBIDDEN');
    }

    return prisma.post.update({
      where: { id: postId },
      data: { content },
      include: {
        author: { select: authorSelect },
        media: true,
        _count: { select: { likes: true, comments: true } },
      },
    });
  }

  async deletePost(postId: string, actorProfileId: string, actorUserId: string, actorRole: string) {
    const post = await prisma.post.findUnique({ where: { id: postId } });
    if (!post) throw new AppError('Publicação não encontrada', 404, 'POST_NOT_FOUND');

    const isModerator =
      (RoleHierarchy[actorRole as UserRole] ?? 0) >= RoleHierarchy[UserRole.ABELHA_PRINCESA];

    if (post.authorId !== actorProfileId && !isModerator) {
      throw new AppError('Sem permissão para excluir esta publicação', 403, 'FORBIDDEN');
    }

    await prisma.post.delete({ where: { id: postId } });

    if (post.authorId !== actorProfileId) {
      await AuditService.log(actorUserId, 'FEED_MODERATE_DELETE_POST', 'Post', { postId });
    }
  }

  async likePost(postId: string, authorId: string) {
    const post = await prisma.post.findUnique({ where: { id: postId } });
    if (!post) throw new AppError('Publicação não encontrada', 404, 'POST_NOT_FOUND');

    await prisma.like.upsert({
      where: { postId_authorId: { postId, authorId } },
      update: {},
      create: { postId, authorId },
    });

    const likes = await prisma.like.count({ where: { postId } });
    return { likedByMe: true, likes };
  }

  async unlikePost(postId: string, authorId: string) {
    await prisma.like.deleteMany({
      where: { postId, authorId },
    });
    const likes = await prisma.like.count({ where: { postId } });
    return { likedByMe: false, likes };
  }

  async addComment(postId: string, authorId: string, data: CommentInput) {
    const post = await prisma.post.findUnique({ where: { id: postId } });
    if (!post) throw new AppError('Publicação não encontrada', 404, 'POST_NOT_FOUND');

    if (data.parentId) {
      const parent = await prisma.comment.findUnique({ where: { id: data.parentId } });
      if (!parent || parent.postId !== postId) {
        throw new AppError('Comentário pai inválido', 400, 'INVALID_PARENT_COMMENT');
      }
    }

    const comment = await prisma.comment.create({
      data: {
        content: data.content,
        postId,
        authorId,
        parentId: data.parentId,
      },
      include: {
        author: { select: authorSelect },
        _count: { select: { likes: true, replies: true } },
      },
    });

    if (post.authorId !== authorId) {
      await notificationService.createNotification(post.authorId, {
        title: 'Novo comentário no seu post',
        content: `${comment.author.name} comentou na sua publicação no feed.`,
        link: '/feed',
        type: 'FEED',
      });
    }

    return { ...comment, likedByMe: false, replies: [] };
  }

  async updateComment(commentId: string, authorId: string, content: string) {
    const comment = await prisma.comment.findUnique({ where: { id: commentId } });
    if (!comment) throw new AppError('Comentário não encontrado', 404, 'COMMENT_NOT_FOUND');
    if (comment.authorId !== authorId) {
      throw new AppError('Você só pode editar seus próprios comentários', 403, 'FORBIDDEN');
    }

    return prisma.comment.update({
      where: { id: commentId },
      data: { content },
      include: { author: { select: authorSelect } },
    });
  }

  async deleteComment(commentId: string, actorProfileId: string, actorUserId: string, actorRole: string) {
    const comment = await prisma.comment.findUnique({ where: { id: commentId } });
    if (!comment) throw new AppError('Comentário não encontrado', 404, 'COMMENT_NOT_FOUND');

    const isModerator =
      (RoleHierarchy[actorRole as UserRole] ?? 0) >= RoleHierarchy[UserRole.ABELHA_PRINCESA];

    if (comment.authorId !== actorProfileId && !isModerator) {
      throw new AppError('Sem permissão para excluir este comentário', 403, 'FORBIDDEN');
    }

    await prisma.comment.delete({ where: { id: commentId } });

    if (comment.authorId !== actorProfileId) {
      await AuditService.log(actorUserId, 'FEED_MODERATE_DELETE_COMMENT', 'Comment', { commentId });
    }
  }

  async likeComment(commentId: string, authorId: string) {
    await prisma.commentLike.upsert({
      where: { commentId_authorId: { commentId, authorId } },
      update: {},
      create: { commentId, authorId },
    });
    const likes = await prisma.commentLike.count({ where: { commentId } });
    return { likedByMe: true, likes };
  }

  async unlikeComment(commentId: string, authorId: string) {
    await prisma.commentLike.deleteMany({ where: { commentId, authorId } });
    const likes = await prisma.commentLike.count({ where: { commentId } });
    return { likedByMe: false, likes };
  }

  async report(reporterId: string, data: ReportInput) {
    if (!data.postId && !data.commentId && !data.targetUserId) {
      throw new AppError('Informe o alvo da denúncia.', 400, 'INVALID_REPORT_TARGET');
    }

    const report = await prisma.report.create({
      data: {
        reporterId,
        contentType: data.contentType,
        postId: data.postId,
        commentId: data.commentId,
        targetUserId: data.targetUserId,
        reason: data.reason,
        description: data.description,
      },
    });

    await notificationService.notifyRoles(
      [UserRole.STAFF_ZANGAO, UserRole.ABELHA_RAINHA, UserRole.ABELHA_PRINCESA],
      {
        title: 'Nova denúncia recebida',
        content: `Denúncia (${data.contentType}): ${data.reason}`,
        link: '/admin?tab=moderation',
        type: 'ADMIN',
      }
    );

    return report;
  }
}
