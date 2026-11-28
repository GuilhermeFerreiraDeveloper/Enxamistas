import { z } from 'zod';

export enum UserRole {
  STAFF_ZANGAO = 'STAFF_ZANGAO',
  ABELHA_RAINHA = 'ABELHA_RAINHA',
  ABELHA_PRINCESA = 'ABELHA_PRINCESA',
  ABELHA_PATRONO = 'ABELHA_PATRONO',
  ABELHA_CONSELHEIRA_REAL = 'ABELHA_CONSELHEIRA_REAL',
  ABELHA_OPERARIA = 'ABELHA_OPERARIA',
  KAKUNA = 'KAKUNA',
  CONVIDADO = 'CONVIDADO',
}

export const RoleHierarchy: Record<UserRole, number> = {
  [UserRole.STAFF_ZANGAO]: 100,
  [UserRole.ABELHA_RAINHA]: 90,
  [UserRole.ABELHA_PRINCESA]: 80,
  [UserRole.ABELHA_PATRONO]: 70,
  [UserRole.ABELHA_CONSELHEIRA_REAL]: 60,
  [UserRole.ABELHA_OPERARIA]: 50,
  [UserRole.KAKUNA]: 20,
  [UserRole.CONVIDADO]: 10,
};

export const RoleLabels: Record<UserRole, string> = {
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
export const registerSchema = z.object({
  name: z.string().trim().min(3, 'Nome muito curto').max(80, 'Nome muito longo'),
  passport: z.string().trim().min(1, 'Passaporte obrigatório').max(32, 'Passaporte inválido'),
  password: z.string().min(6, 'Senha deve ter no mínimo 6 caracteres').max(128),
  mainCourseId: z.string().min(1, 'Curso principal obrigatório'),
});

export const loginSchema = z.object({
  passport: z.string().trim().min(1, 'Passaporte obrigatório'),
  password: z.string().min(1, 'Senha obrigatória'),
});

export type RegisterInput = z.infer<typeof registerSchema>;
export type LoginInput = z.infer<typeof loginSchema>;

// --- PROFILE ---
const profileImageSchema = z.union([
  z.string().url('URL de imagem inválida'),
  z.string().regex(/^uploads\/(avatars|profile)\/[0-9a-f-]{36}\/[0-9a-f-]{36}\.(jpg|png|webp)$/i, 'Caminho de imagem inválido'),
  z.literal(''),
]);

export const updateProfileSchema = z.object({
  avatar: profileImageSchema.optional(),
  banner: profileImageSchema.optional(),
  nickname: z.string().trim().max(40).optional(),
  age: z.number().int().min(1).max(120).nullable().optional(),
  zodiac: z.string().trim().max(30).optional(),
  bio: z.string().max(500).optional(),
  description: z.string().max(2000).optional(),
  favoriteMusic: z.string().max(150).optional(),
  favoriteFilm: z.string().max(150).optional(),
  personalQuote: z.string().max(250).optional(),
  socialLinks: z.string().max(800).optional(),
  formationArea: z.string().max(150).optional(),
  honors: z.string().max(500).optional(),
  musicGenre: z.string().max(100).optional(),
  interests: z.string().max(500).optional(),
  projects: z.string().max(1000).optional(),
});

export type UpdateProfileInput = z.infer<typeof updateProfileSchema>;

// --- FEED ---
export const postSchema = z.object({
  content: z.string().trim().min(1, 'Conteúdo não pode ser vazio').max(3000),
  media: z
    .array(
      z.object({
        url: z.string().min(1),
        type: z.enum(['IMAGE', 'VIDEO']),
      })
    )
    .max(6)
    .optional(),
});

export const updatePostSchema = z.object({
  content: z.string().trim().min(1, 'Conteúdo não pode ser vazio').max(3000),
});

export const commentSchema = z.object({
  content: z.string().trim().min(1, 'Comentário não pode ser vazio').max(1500),
  parentId: z.string().uuid().optional(),
});

export const reportSchema = z.object({
  contentType: z.enum(['POST', 'COMMENT', 'USER', 'GUESTBOOK', 'PROJECT']).default('POST'),
  postId: z.string().uuid().optional(),
  commentId: z.string().uuid().optional(),
  targetUserId: z.string().uuid().optional(),
  reason: z.string().trim().min(3, 'Informe o motivo').max(120),
  description: z.string().trim().max(1000).optional(),
});

export type PostInput = z.infer<typeof postSchema>;
export type CommentInput = z.infer<typeof commentSchema>;
export type ReportInput = z.infer<typeof reportSchema>;

// --- EVENTS & CALENDAR ---
export const eventSchema = z.object({
  title: z.string().trim().min(3, 'Título muito curto').max(120),
  description: z.string().trim().min(10, 'Descrição muito curta').max(3000),
  date: z.string().min(1, 'Data obrigatória'),
  endDate: z.string().optional(),
  location: z.string().trim().min(3, 'Localização obrigatória').max(160),
  category: z.string().trim().min(2).max(60),
  coverImage: z.string().url().optional().or(z.literal('')),
  attractions: z.string().max(1000).optional(),
  extraInfo: z.string().max(1000).optional(),
  visibility: z.enum(['PUBLIC', 'PRIVATE']).default('PRIVATE'),
  limit: z.number().int().positive().optional(),
});

export const eventUpdateSchema = eventSchema.partial().extend({
  status: z.enum(['SCHEDULED', 'CANCELLED', 'COMPLETED']).optional(),
});

export const rsvpSchema = z.object({
  status: z.enum(['CONFIRMED', 'CANCELLED']),
});

export const commitmentSchema = z.object({
  title: z.string().trim().min(3).max(120),
  description: z.string().max(2000).optional(),
  type: z.enum(['MEETING', 'IMPORTANT_DATE', 'COMMITMENT', 'ACTIVITY']).default('MEETING'),
  startAt: z.string().min(1),
  endAt: z.string().optional(),
  location: z.string().max(160).optional(),
  visibility: z.enum(['PUBLIC', 'PRIVATE']).default('PRIVATE'),
});

export type EventInput = z.infer<typeof eventSchema>;
export type CommitmentInput = z.infer<typeof commitmentSchema>;

// --- ACADEMIC ---
export const enrollSchema = z.object({
  courseId: z.string().uuid('Curso inválido'),
  type: z.enum(['MAIN', 'SECONDARY']).default('SECONDARY'),
});

export const sessionSchema = z.object({
  title: z.string().trim().min(3).max(120),
  description: z.string().max(1500).optional(),
  date: z.string().min(1),
  startTime: z.string().max(10).optional(),
  status: z.enum(['SCHEDULED', 'COMPLETED', 'CANCELLED']).default('SCHEDULED'),
  teacherNote: z.string().max(1000).optional(),
});

export const materialSchema = z.object({
  title: z.string().trim().min(2).max(120),
  url: z.string().min(1),
  type: z.enum(['PDF', 'LINK', 'IMAGE']),
});

export const proofSchema = z.object({
  sessionId: z.string().uuid(),
  imageUrl: z.string().min(1),
  observation: z.string().max(1000).optional(),
});

export const validateProofSchema = z.object({
  status: z.enum(['VALIDATED', 'REJECTED']),
  feedback: z.string().max(1000).optional(),
});

export const courseCompletionSchema = z.object({
  profileId: z.string().uuid(),
  status: z.enum(['APPROVED', 'REJECTED']).default('APPROVED'),
  notes: z.string().max(1000).optional(),
  emitMedal: z.boolean().default(true),
});

export type ProofInput = z.infer<typeof proofSchema>;

// --- MESSAGING ---
export const messageSchema = z.object({
  content: z.string().trim().min(1).max(4000),
  attachments: z
    .array(
      z.object({
        url: z.string().min(1),
        type: z.string(),
      })
    )
    .optional(),
});

export type MessageInput = z.infer<typeof messageSchema>;

// --- INSTITUTIONAL / ADMIN ---
export const announcementSchema = z.object({
  title: z.string().trim().min(3).max(140),
  content: z.string().trim().min(5).max(5000),
  category: z.enum(['GENERAL', 'ACADEMIC', 'EVENT', 'INSTITUTIONAL', 'ADMIN']).default('GENERAL'),
  priority: z.number().int().min(0).max(10).default(0),
  isPinned: z.boolean().default(false),
  expiresAt: z.string().optional().nullable(),
  courseId: z.string().uuid().optional().nullable(),
});

export const projectSchema = z.object({
  title: z.string().trim().min(3).max(120),
  description: z.string().trim().min(10).max(3000),
  imageUrl: z.string().url().optional().or(z.literal('')),
  category: z.string().trim().min(2).max(60),
  link: z.string().url().optional().or(z.literal('')),
  status: z.enum(['ACTIVE', 'COMPLETED', 'PAUSED']).default('ACTIVE'),
});

export const guestbookSchema = z.object({
  content: z.string().trim().min(3, 'Mensagem muito curta').max(400, 'Máximo de 400 caracteres'),
  authorName: z.string().trim().min(2).max(60).optional(),
});

export const monthlyHighlightSchema = z.object({
  profileId: z.string().uuid(),
  month: z.number().int().min(1).max(12),
  year: z.number().int().min(2024).max(2100),
  description: z.string().max(1500).optional(),
  reason: z.string().trim().min(5).max(500),
  contributions: z.string().max(1500).optional(),
  imageUrl: z.string().url().optional().or(z.literal('')),
});

export const mansionKeyRequestSchema = z.object({
  reason: z.string().trim().min(5, 'Explique o motivo da solicitação').max(500),
});

export const radioTrackSchema = z.object({
  title: z.string().trim().min(2).max(120),
  artist: z.string().trim().min(2).max(120),
  sourceType: z.enum(['AUDIO', 'YOUTUBE']).default('AUDIO'),
  url: z.string().url().optional().or(z.literal('')),
  youtubeUrl: z.string().url().optional().or(z.literal('')),
  duration: z.number().int().positive().optional(),
  playlistId: z.string().uuid().optional(),
});

// --- RÁDIO: ÁUDIO ENVIADO DO DISPOSITIVO ---

export const AUDIO_MIME_TYPES = [
  'audio/mpeg',
  'audio/ogg',
  'audio/wav',
  'audio/mp4',
  'audio/aac',
] as const;

export function audioMimeToExt(mime: string): string {
  switch (mime) {
    case 'audio/mpeg':
      return 'mp3';
    case 'audio/ogg':
      return 'ogg';
    case 'audio/wav':
      return 'wav';
    case 'audio/mp4':
      return 'm4a';
    case 'audio/aac':
      return 'aac';
    default:
      return 'bin';
  }
}

export const radioAudioMetadataSchema = z.object({
  title: z.string().trim().min(2, 'Título muito curto').max(120, 'Título muito longo'),
  artist: z.string().trim().min(2, 'Artista muito curto').max(120, 'Artista muito longo'),
  duration: z.number().int().positive().optional(),
});

export type RadioAudioMetadataInput = z.infer<typeof radioAudioMetadataSchema>;

export const roleChangeSchema = z.object({
  role: z.nativeEnum(UserRole),
  reason: z.string().max(500).optional(),
});

export const suspendUserSchema = z.object({
  isSuspended: z.boolean(),
  reason: z.string().max(500).optional(),
});

// --- CINEMATICS & FRATERNITY RULES ---
export const cinematicYoutubeSchema = z.object({
  title: z.string().trim().min(2, 'Informe um título para a cinemática').max(140),
  description: z.string().trim().max(1500).optional().or(z.literal('')),
  category: z.string().trim().min(2).max(60).default('Fraternidade'),
  youtubeUrl: z.string().trim().min(8, 'Informe uma URL válida do YouTube').max(500),
});

export type CinematicYoutubeInput = z.infer<typeof cinematicYoutubeSchema>;

export function extractYoutubeId(rawUrl: string): string | null {
  try {
    const parsed = new URL(rawUrl.trim());
    const host = parsed.hostname.replace(/^www\./, '').toLowerCase();

    let candidate: string | null = null;
    if (host === 'youtu.be') {
      candidate = parsed.pathname.split('/').filter(Boolean)[0] || null;
    } else if (host === 'youtube.com' || host === 'm.youtube.com' || host === 'music.youtube.com') {
      if (parsed.pathname === '/watch') {
        candidate = parsed.searchParams.get('v');
      } else {
        const segments = parsed.pathname.split('/').filter(Boolean);
        if (['embed', 'shorts', 'live', 'v'].includes(segments[0])) {
          candidate = segments[1] || null;
        }
      }
    }

    if (candidate && /^[a-zA-Z0-9_-]{11}$/.test(candidate)) {
      return candidate;
    }
    return null;
  } catch {
    return null;
  }
}

export function isLeadershipOrStaff(role?: string | null): boolean {
  if (!role) return false;
  return (RoleHierarchy[role as UserRole] ?? 0) >= RoleHierarchy[UserRole.ABELHA_PRINCESA];
}

export const FRATERNITY_RULES: ReadonlyArray<{ number: number; title: string; text: string }> = [
  {
    number: 1,
    title: 'Zero Preconceito e Bullying',
    text: 'Não será tolerado nenhum tipo de preconceito, discriminação ou bullying entre os membros e não membros da fraternidade.',
  },
  {
    number: 2,
    title: 'Uniforme no Campus e Eventos',
    text: 'No campus da Universidade de RUA2, será obrigatório o uso do uniforme da fraternidade, e também durante eventos oficiais e atividades organizadas.',
  },
  {
    number: 3,
    title: 'Diretrizes da Universidade',
    text: 'Todos os membros devem respeitar e seguir as diretrizes e regulamentos estabelecidos pela universidade.',
  },
  {
    number: 4,
    title: 'Serviço Comunitário',
    text: 'A participação em atividades comunitárias e de serviço é encorajada para todos os membros da fraternidade.',
  },
  {
    number: 5,
    title: 'Álcool e Substâncias Controladas',
    text: 'O consumo de álcool e outras substâncias controladas é estritamente proibido nas instalações da fraternidade, a menos que autorizado em eventos específicos.',
  },
  {
    number: 6,
    title: 'Limpeza e Organização',
    text: 'Manter as áreas comuns da fraternidade limpas e organizadas é responsabilidade de todos os membros.',
  },
  {
    number: 7,
    title: 'Privacidade e Espaço Pessoal',
    text: 'Respeitar a privacidade e o espaço pessoal dos colegas de fraternidade é fundamental.',
  },
  {
    number: 8,
    title: 'Segurança e Bem-Estar',
    text: 'Qualquer comportamento que coloque em risco a segurança ou bem-estar dos membros será punido de acordo com as regras estabelecidas.',
  },
  {
    number: 9,
    title: 'Proibição de Atividades Ilegais',
    text: 'A participação em atividades ilegais é estritamente proibida e resultará em expulsão imediata da fraternidade.',
  },
  {
    number: 10,
    title: 'Ambiente Livre de Conteúdo Impróprio',
    text: 'Não será permitido nenhum tipo de conteúdo adulto ou de cunho preconceituoso nem que seja por "brincadeira" neste Discord e portal.',
  },
  {
    number: 11,
    title: 'Diversidade e Inclusão',
    text: 'Respeitar e promover a diversidade e inclusão é um princípio fundamental da fraternidade.',
  },
  {
    number: 12,
    title: 'Apoio Mútuo e Camaradagem',
    text: 'Promover um ambiente de apoio mútuo e camaradagem entre os membros é essencial.',
  },
  {
    number: 13,
    title: 'Linguagem Respeitosa',
    text: 'O uso de linguagem ofensiva ou inadequada não será tolerado em nenhum contexto.',
  },
  {
    number: 14,
    title: 'Respeito às Propriedades',
    text: 'Respeitar os espaços e propriedades dos outros membros da fraternidade é obrigatório.',
  },
  {
    number: 15,
    title: 'Conduta Ética e Moral',
    text: 'Manter uma conduta ética e moral em todas as interações é esperado de cada membro.',
  },
  {
    number: 16,
    title: 'Participação em Reuniões e Eventos',
    text: 'Participar ativamente das reuniões e eventos da fraternidade é encorajado.',
  },
  {
    number: 17,
    title: 'Liderança e Responsabilidade',
    text: 'Demonstrar liderança e responsabilidade em todas as atividades relacionadas à fraternidade é valorizado.',
  },
  {
    number: 18,
    title: 'Apoio à Liderança da Colmeia',
    text: 'Respeitar e apoiar as decisões e iniciativas dos líderes da fraternidade é importante para manter a coesão do grupo.',
  },
  {
    number: 19,
    title: 'Aprendizado e Crescimento',
    text: 'Promover um ambiente de aprendizado e crescimento pessoal é um objetivo compartilhado por todos os membros.',
  },
  {
    number: 20,
    title: 'Resolução Pacífica de Conflitos',
    text: 'Sempre buscar resolver conflitos de forma pacífica e construtiva, priorizando a harmonia e o bem-estar da fraternidade como um todo.',
  },
];
