"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.suspendUserSchema = exports.roleChangeSchema = exports.radioTrackSchema = exports.mansionKeyRequestSchema = exports.monthlyHighlightSchema = exports.guestbookSchema = exports.projectSchema = exports.announcementSchema = exports.messageSchema = exports.courseCompletionSchema = exports.validateProofSchema = exports.proofSchema = exports.materialSchema = exports.sessionSchema = exports.enrollSchema = exports.commitmentSchema = exports.rsvpSchema = exports.eventUpdateSchema = exports.eventSchema = exports.reportSchema = exports.commentSchema = exports.updatePostSchema = exports.postSchema = exports.updateProfileSchema = exports.loginSchema = exports.registerSchema = exports.RoleLabels = exports.RoleHierarchy = exports.UserRole = void 0;
const zod_1 = require("zod");
var UserRole;
(function (UserRole) {
    UserRole["STAFF_ZANGAO"] = "STAFF_ZANGAO";
    UserRole["ABELHA_RAINHA"] = "ABELHA_RAINHA";
    UserRole["ABELHA_PRINCESA"] = "ABELHA_PRINCESA";
    UserRole["ABELHA_PATRONO"] = "ABELHA_PATRONO";
    UserRole["ABELHA_CONSELHEIRA_REAL"] = "ABELHA_CONSELHEIRA_REAL";
    UserRole["ABELHA_OPERARIA"] = "ABELHA_OPERARIA";
    UserRole["KAKUNA"] = "KAKUNA";
    UserRole["CONVIDADO"] = "CONVIDADO";
})(UserRole || (exports.UserRole = UserRole = {}));
exports.RoleHierarchy = {
    [UserRole.STAFF_ZANGAO]: 100,
    [UserRole.ABELHA_RAINHA]: 90,
    [UserRole.ABELHA_PRINCESA]: 80,
    [UserRole.ABELHA_PATRONO]: 70,
    [UserRole.ABELHA_CONSELHEIRA_REAL]: 60,
    [UserRole.ABELHA_OPERARIA]: 50,
    [UserRole.KAKUNA]: 20,
    [UserRole.CONVIDADO]: 10,
};
exports.RoleLabels = {
    [UserRole.STAFF_ZANGAO]: 'Staff Zangão',
    [UserRole.ABELHA_RAINHA]: 'Abelha Rainha',
    [UserRole.ABELHA_PRINCESA]: 'Abelha Princesa',
    [UserRole.ABELHA_PATRONO]: 'Abelha Patrono',
    [UserRole.ABELHA_CONSELHEIRA_REAL]: 'Abelha Conselheira Real',
    [UserRole.ABELHA_OPERARIA]: 'Abelhas Operárias',
    [UserRole.KAKUNA]: 'Kakunas (Novatos)',
    [UserRole.CONVIDADO]: 'Convidados',
};
// --- AUTH ---
exports.registerSchema = zod_1.z.object({
    name: zod_1.z.string().trim().min(3, 'Nome muito curto').max(80, 'Nome muito longo'),
    passport: zod_1.z.string().trim().min(1, 'Passaporte obrigatório').max(32, 'Passaporte inválido'),
    password: zod_1.z.string().min(6, 'Senha deve ter no mínimo 6 caracteres').max(128),
    mainCourseId: zod_1.z.string().min(1, 'Curso principal obrigatório'),
});
exports.loginSchema = zod_1.z.object({
    passport: zod_1.z.string().trim().min(1, 'Passaporte obrigatório'),
    password: zod_1.z.string().min(1, 'Senha obrigatória'),
});
// --- PROFILE ---
exports.updateProfileSchema = zod_1.z.object({
    avatar: zod_1.z.string().url('URL de avatar inválida').optional().or(zod_1.z.literal('')),
    bio: zod_1.z.string().max(500).optional(),
    description: zod_1.z.string().max(2000).optional(),
    favoriteMusic: zod_1.z.string().max(150).optional(),
    musicGenre: zod_1.z.string().max(100).optional(),
    interests: zod_1.z.string().max(500).optional(),
    projects: zod_1.z.string().max(1000).optional(),
});
// --- FEED ---
exports.postSchema = zod_1.z.object({
    content: zod_1.z.string().trim().min(1, 'Conteúdo não pode ser vazio').max(3000),
    media: zod_1.z
        .array(zod_1.z.object({
        url: zod_1.z.string().min(1),
        type: zod_1.z.enum(['IMAGE', 'VIDEO']),
    }))
        .max(6)
        .optional(),
});
exports.updatePostSchema = zod_1.z.object({
    content: zod_1.z.string().trim().min(1, 'Conteúdo não pode ser vazio').max(3000),
});
exports.commentSchema = zod_1.z.object({
    content: zod_1.z.string().trim().min(1, 'Comentário não pode ser vazio').max(1500),
    parentId: zod_1.z.string().uuid().optional(),
});
exports.reportSchema = zod_1.z.object({
    contentType: zod_1.z.enum(['POST', 'COMMENT', 'USER', 'GUESTBOOK', 'PROJECT']).default('POST'),
    postId: zod_1.z.string().uuid().optional(),
    commentId: zod_1.z.string().uuid().optional(),
    targetUserId: zod_1.z.string().uuid().optional(),
    reason: zod_1.z.string().trim().min(3, 'Informe o motivo').max(120),
    description: zod_1.z.string().trim().max(1000).optional(),
});
// --- EVENTS & CALENDAR ---
exports.eventSchema = zod_1.z.object({
    title: zod_1.z.string().trim().min(3, 'Título muito curto').max(120),
    description: zod_1.z.string().trim().min(10, 'Descrição muito curta').max(3000),
    date: zod_1.z.string().min(1, 'Data obrigatória'),
    endDate: zod_1.z.string().optional(),
    location: zod_1.z.string().trim().min(3, 'Localização obrigatória').max(160),
    category: zod_1.z.string().trim().min(2).max(60),
    coverImage: zod_1.z.string().url().optional().or(zod_1.z.literal('')),
    attractions: zod_1.z.string().max(1000).optional(),
    extraInfo: zod_1.z.string().max(1000).optional(),
    visibility: zod_1.z.enum(['PUBLIC', 'PRIVATE']).default('PRIVATE'),
    limit: zod_1.z.number().int().positive().optional(),
});
exports.eventUpdateSchema = exports.eventSchema.partial().extend({
    status: zod_1.z.enum(['SCHEDULED', 'CANCELLED', 'COMPLETED']).optional(),
});
exports.rsvpSchema = zod_1.z.object({
    status: zod_1.z.enum(['CONFIRMED', 'CANCELLED']),
});
exports.commitmentSchema = zod_1.z.object({
    title: zod_1.z.string().trim().min(3).max(120),
    description: zod_1.z.string().max(2000).optional(),
    type: zod_1.z.enum(['MEETING', 'IMPORTANT_DATE', 'COMMITMENT', 'ACTIVITY']).default('MEETING'),
    startAt: zod_1.z.string().min(1),
    endAt: zod_1.z.string().optional(),
    location: zod_1.z.string().max(160).optional(),
    visibility: zod_1.z.enum(['PUBLIC', 'PRIVATE']).default('PRIVATE'),
});
// --- ACADEMIC ---
exports.enrollSchema = zod_1.z.object({
    courseId: zod_1.z.string().uuid('Curso inválido'),
    type: zod_1.z.enum(['MAIN', 'SECONDARY']).default('SECONDARY'),
});
exports.sessionSchema = zod_1.z.object({
    title: zod_1.z.string().trim().min(3).max(120),
    description: zod_1.z.string().max(1500).optional(),
    date: zod_1.z.string().min(1),
    startTime: zod_1.z.string().max(10).optional(),
    status: zod_1.z.enum(['SCHEDULED', 'COMPLETED', 'CANCELLED']).default('SCHEDULED'),
    teacherNote: zod_1.z.string().max(1000).optional(),
});
exports.materialSchema = zod_1.z.object({
    title: zod_1.z.string().trim().min(2).max(120),
    url: zod_1.z.string().min(1),
    type: zod_1.z.enum(['PDF', 'LINK', 'IMAGE']),
});
exports.proofSchema = zod_1.z.object({
    sessionId: zod_1.z.string().uuid(),
    imageUrl: zod_1.z.string().min(1),
    observation: zod_1.z.string().max(1000).optional(),
});
exports.validateProofSchema = zod_1.z.object({
    status: zod_1.z.enum(['VALIDATED', 'REJECTED']),
    feedback: zod_1.z.string().max(1000).optional(),
});
exports.courseCompletionSchema = zod_1.z.object({
    profileId: zod_1.z.string().uuid(),
    status: zod_1.z.enum(['APPROVED', 'REJECTED']).default('APPROVED'),
    notes: zod_1.z.string().max(1000).optional(),
    emitMedal: zod_1.z.boolean().default(true),
});
// --- MESSAGING ---
exports.messageSchema = zod_1.z.object({
    content: zod_1.z.string().trim().min(1).max(4000),
    attachments: zod_1.z
        .array(zod_1.z.object({
        url: zod_1.z.string().min(1),
        type: zod_1.z.string(),
    }))
        .optional(),
});
// --- INSTITUTIONAL / ADMIN ---
exports.announcementSchema = zod_1.z.object({
    title: zod_1.z.string().trim().min(3).max(140),
    content: zod_1.z.string().trim().min(5).max(5000),
    category: zod_1.z.enum(['GENERAL', 'ACADEMIC', 'EVENT', 'INSTITUTIONAL', 'ADMIN']).default('GENERAL'),
    priority: zod_1.z.number().int().min(0).max(10).default(0),
    isPinned: zod_1.z.boolean().default(false),
    expiresAt: zod_1.z.string().optional().nullable(),
    courseId: zod_1.z.string().uuid().optional().nullable(),
});
exports.projectSchema = zod_1.z.object({
    title: zod_1.z.string().trim().min(3).max(120),
    description: zod_1.z.string().trim().min(10).max(3000),
    imageUrl: zod_1.z.string().url().optional().or(zod_1.z.literal('')),
    category: zod_1.z.string().trim().min(2).max(60),
    link: zod_1.z.string().url().optional().or(zod_1.z.literal('')),
    status: zod_1.z.enum(['ACTIVE', 'COMPLETED', 'PAUSED']).default('ACTIVE'),
});
exports.guestbookSchema = zod_1.z.object({
    content: zod_1.z.string().trim().min(3, 'Mensagem muito curta').max(400, 'Máximo de 400 caracteres'),
    authorName: zod_1.z.string().trim().min(2).max(60).optional(),
});
exports.monthlyHighlightSchema = zod_1.z.object({
    profileId: zod_1.z.string().uuid(),
    month: zod_1.z.number().int().min(1).max(12),
    year: zod_1.z.number().int().min(2024).max(2100),
    description: zod_1.z.string().max(1500).optional(),
    reason: zod_1.z.string().trim().min(5).max(500),
    contributions: zod_1.z.string().max(1500).optional(),
    imageUrl: zod_1.z.string().url().optional().or(zod_1.z.literal('')),
});
exports.mansionKeyRequestSchema = zod_1.z.object({
    reason: zod_1.z.string().trim().min(5, 'Explique o motivo da solicitação').max(500),
});
exports.radioTrackSchema = zod_1.z.object({
    title: zod_1.z.string().trim().min(2).max(120),
    artist: zod_1.z.string().trim().min(2).max(120),
    url: zod_1.z.string().url(),
    coverUrl: zod_1.z.string().url().optional().or(zod_1.z.literal('')),
    duration: zod_1.z.number().int().positive().optional(),
    playlistId: zod_1.z.string().uuid().optional(),
});
exports.roleChangeSchema = zod_1.z.object({
    role: zod_1.z.nativeEnum(UserRole),
    reason: zod_1.z.string().max(500).optional(),
});
exports.suspendUserSchema = zod_1.z.object({
    isSuspended: zod_1.z.boolean(),
    reason: zod_1.z.string().max(500).optional(),
});
//# sourceMappingURL=index.js.map