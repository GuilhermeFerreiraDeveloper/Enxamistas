import { z } from 'zod';
export declare enum UserRole {
    STAFF_ZANGAO = "STAFF_ZANGAO",
    ABELHA_RAINHA = "ABELHA_RAINHA",
    ABELHA_PRINCESA = "ABELHA_PRINCESA",
    ABELHA_PATRONO = "ABELHA_PATRONO",
    ABELHA_CONSELHEIRA_REAL = "ABELHA_CONSELHEIRA_REAL",
    ABELHA_OPERARIA = "ABELHA_OPERARIA",
    KAKUNA = "KAKUNA",
    CONVIDADO = "CONVIDADO"
}
export declare const RoleHierarchy: Record<UserRole, number>;
export declare const RoleLabels: Record<UserRole, string>;
export declare const registerSchema: z.ZodObject<{
    name: z.ZodString;
    passport: z.ZodString;
    password: z.ZodString;
    mainCourseId: z.ZodString;
}, "strip", z.ZodTypeAny, {
    name: string;
    passport: string;
    password: string;
    mainCourseId: string;
}, {
    name: string;
    passport: string;
    password: string;
    mainCourseId: string;
}>;
export declare const loginSchema: z.ZodObject<{
    passport: z.ZodString;
    password: z.ZodString;
}, "strip", z.ZodTypeAny, {
    passport: string;
    password: string;
}, {
    passport: string;
    password: string;
}>;
export type RegisterInput = z.infer<typeof registerSchema>;
export type LoginInput = z.infer<typeof loginSchema>;
export declare const updateProfileSchema: z.ZodObject<{
    avatar: z.ZodUnion<[z.ZodOptional<z.ZodString>, z.ZodLiteral<"">]>;
    bio: z.ZodOptional<z.ZodString>;
    description: z.ZodOptional<z.ZodString>;
    favoriteMusic: z.ZodOptional<z.ZodString>;
    musicGenre: z.ZodOptional<z.ZodString>;
    interests: z.ZodOptional<z.ZodString>;
    projects: z.ZodOptional<z.ZodString>;
}, "strip", z.ZodTypeAny, {
    avatar?: string | undefined;
    bio?: string | undefined;
    description?: string | undefined;
    favoriteMusic?: string | undefined;
    musicGenre?: string | undefined;
    interests?: string | undefined;
    projects?: string | undefined;
}, {
    avatar?: string | undefined;
    bio?: string | undefined;
    description?: string | undefined;
    favoriteMusic?: string | undefined;
    musicGenre?: string | undefined;
    interests?: string | undefined;
    projects?: string | undefined;
}>;
export type UpdateProfileInput = z.infer<typeof updateProfileSchema>;
export declare const postSchema: z.ZodObject<{
    content: z.ZodString;
    media: z.ZodOptional<z.ZodArray<z.ZodObject<{
        url: z.ZodString;
        type: z.ZodEnum<["IMAGE", "VIDEO"]>;
    }, "strip", z.ZodTypeAny, {
        type: "IMAGE" | "VIDEO";
        url: string;
    }, {
        type: "IMAGE" | "VIDEO";
        url: string;
    }>, "many">>;
}, "strip", z.ZodTypeAny, {
    content: string;
    media?: {
        type: "IMAGE" | "VIDEO";
        url: string;
    }[] | undefined;
}, {
    content: string;
    media?: {
        type: "IMAGE" | "VIDEO";
        url: string;
    }[] | undefined;
}>;
export declare const updatePostSchema: z.ZodObject<{
    content: z.ZodString;
}, "strip", z.ZodTypeAny, {
    content: string;
}, {
    content: string;
}>;
export declare const commentSchema: z.ZodObject<{
    content: z.ZodString;
    parentId: z.ZodOptional<z.ZodString>;
}, "strip", z.ZodTypeAny, {
    content: string;
    parentId?: string | undefined;
}, {
    content: string;
    parentId?: string | undefined;
}>;
export declare const reportSchema: z.ZodObject<{
    contentType: z.ZodDefault<z.ZodEnum<["POST", "COMMENT", "USER", "GUESTBOOK", "PROJECT"]>>;
    postId: z.ZodOptional<z.ZodString>;
    commentId: z.ZodOptional<z.ZodString>;
    targetUserId: z.ZodOptional<z.ZodString>;
    reason: z.ZodString;
    description: z.ZodOptional<z.ZodString>;
}, "strip", z.ZodTypeAny, {
    contentType: "POST" | "COMMENT" | "USER" | "GUESTBOOK" | "PROJECT";
    reason: string;
    description?: string | undefined;
    postId?: string | undefined;
    commentId?: string | undefined;
    targetUserId?: string | undefined;
}, {
    reason: string;
    description?: string | undefined;
    contentType?: "POST" | "COMMENT" | "USER" | "GUESTBOOK" | "PROJECT" | undefined;
    postId?: string | undefined;
    commentId?: string | undefined;
    targetUserId?: string | undefined;
}>;
export type PostInput = z.infer<typeof postSchema>;
export type CommentInput = z.infer<typeof commentSchema>;
export type ReportInput = z.infer<typeof reportSchema>;
export declare const eventSchema: z.ZodObject<{
    title: z.ZodString;
    description: z.ZodString;
    date: z.ZodString;
    endDate: z.ZodOptional<z.ZodString>;
    location: z.ZodString;
    category: z.ZodString;
    coverImage: z.ZodUnion<[z.ZodOptional<z.ZodString>, z.ZodLiteral<"">]>;
    attractions: z.ZodOptional<z.ZodString>;
    extraInfo: z.ZodOptional<z.ZodString>;
    visibility: z.ZodDefault<z.ZodEnum<["PUBLIC", "PRIVATE"]>>;
    limit: z.ZodOptional<z.ZodNumber>;
}, "strip", z.ZodTypeAny, {
    date: string;
    description: string;
    title: string;
    location: string;
    category: string;
    visibility: "PUBLIC" | "PRIVATE";
    endDate?: string | undefined;
    coverImage?: string | undefined;
    attractions?: string | undefined;
    extraInfo?: string | undefined;
    limit?: number | undefined;
}, {
    date: string;
    description: string;
    title: string;
    location: string;
    category: string;
    endDate?: string | undefined;
    coverImage?: string | undefined;
    attractions?: string | undefined;
    extraInfo?: string | undefined;
    visibility?: "PUBLIC" | "PRIVATE" | undefined;
    limit?: number | undefined;
}>;
export declare const eventUpdateSchema: z.ZodObject<{
    title: z.ZodOptional<z.ZodString>;
    description: z.ZodOptional<z.ZodString>;
    date: z.ZodOptional<z.ZodString>;
    endDate: z.ZodOptional<z.ZodOptional<z.ZodString>>;
    location: z.ZodOptional<z.ZodString>;
    category: z.ZodOptional<z.ZodString>;
    coverImage: z.ZodOptional<z.ZodUnion<[z.ZodOptional<z.ZodString>, z.ZodLiteral<"">]>>;
    attractions: z.ZodOptional<z.ZodOptional<z.ZodString>>;
    extraInfo: z.ZodOptional<z.ZodOptional<z.ZodString>>;
    visibility: z.ZodOptional<z.ZodDefault<z.ZodEnum<["PUBLIC", "PRIVATE"]>>>;
    limit: z.ZodOptional<z.ZodOptional<z.ZodNumber>>;
} & {
    status: z.ZodOptional<z.ZodEnum<["SCHEDULED", "CANCELLED", "COMPLETED"]>>;
}, "strip", z.ZodTypeAny, {
    status?: "SCHEDULED" | "CANCELLED" | "COMPLETED" | undefined;
    date?: string | undefined;
    description?: string | undefined;
    title?: string | undefined;
    endDate?: string | undefined;
    location?: string | undefined;
    category?: string | undefined;
    coverImage?: string | undefined;
    attractions?: string | undefined;
    extraInfo?: string | undefined;
    visibility?: "PUBLIC" | "PRIVATE" | undefined;
    limit?: number | undefined;
}, {
    status?: "SCHEDULED" | "CANCELLED" | "COMPLETED" | undefined;
    date?: string | undefined;
    description?: string | undefined;
    title?: string | undefined;
    endDate?: string | undefined;
    location?: string | undefined;
    category?: string | undefined;
    coverImage?: string | undefined;
    attractions?: string | undefined;
    extraInfo?: string | undefined;
    visibility?: "PUBLIC" | "PRIVATE" | undefined;
    limit?: number | undefined;
}>;
export declare const rsvpSchema: z.ZodObject<{
    status: z.ZodEnum<["CONFIRMED", "CANCELLED"]>;
}, "strip", z.ZodTypeAny, {
    status: "CANCELLED" | "CONFIRMED";
}, {
    status: "CANCELLED" | "CONFIRMED";
}>;
export declare const commitmentSchema: z.ZodObject<{
    title: z.ZodString;
    description: z.ZodOptional<z.ZodString>;
    type: z.ZodDefault<z.ZodEnum<["MEETING", "IMPORTANT_DATE", "COMMITMENT", "ACTIVITY"]>>;
    startAt: z.ZodString;
    endAt: z.ZodOptional<z.ZodString>;
    location: z.ZodOptional<z.ZodString>;
    visibility: z.ZodDefault<z.ZodEnum<["PUBLIC", "PRIVATE"]>>;
}, "strip", z.ZodTypeAny, {
    type: "MEETING" | "IMPORTANT_DATE" | "COMMITMENT" | "ACTIVITY";
    title: string;
    visibility: "PUBLIC" | "PRIVATE";
    startAt: string;
    description?: string | undefined;
    location?: string | undefined;
    endAt?: string | undefined;
}, {
    title: string;
    startAt: string;
    type?: "MEETING" | "IMPORTANT_DATE" | "COMMITMENT" | "ACTIVITY" | undefined;
    description?: string | undefined;
    location?: string | undefined;
    visibility?: "PUBLIC" | "PRIVATE" | undefined;
    endAt?: string | undefined;
}>;
export type EventInput = z.infer<typeof eventSchema>;
export type CommitmentInput = z.infer<typeof commitmentSchema>;
export declare const enrollSchema: z.ZodObject<{
    courseId: z.ZodString;
    type: z.ZodDefault<z.ZodEnum<["MAIN", "SECONDARY"]>>;
}, "strip", z.ZodTypeAny, {
    type: "MAIN" | "SECONDARY";
    courseId: string;
}, {
    courseId: string;
    type?: "MAIN" | "SECONDARY" | undefined;
}>;
export declare const sessionSchema: z.ZodObject<{
    title: z.ZodString;
    description: z.ZodOptional<z.ZodString>;
    date: z.ZodString;
    startTime: z.ZodOptional<z.ZodString>;
    status: z.ZodDefault<z.ZodEnum<["SCHEDULED", "COMPLETED", "CANCELLED"]>>;
    teacherNote: z.ZodOptional<z.ZodString>;
}, "strip", z.ZodTypeAny, {
    status: "SCHEDULED" | "CANCELLED" | "COMPLETED";
    date: string;
    title: string;
    description?: string | undefined;
    startTime?: string | undefined;
    teacherNote?: string | undefined;
}, {
    date: string;
    title: string;
    status?: "SCHEDULED" | "CANCELLED" | "COMPLETED" | undefined;
    description?: string | undefined;
    startTime?: string | undefined;
    teacherNote?: string | undefined;
}>;
export declare const materialSchema: z.ZodObject<{
    title: z.ZodString;
    url: z.ZodString;
    type: z.ZodEnum<["PDF", "LINK", "IMAGE"]>;
}, "strip", z.ZodTypeAny, {
    type: "IMAGE" | "PDF" | "LINK";
    url: string;
    title: string;
}, {
    type: "IMAGE" | "PDF" | "LINK";
    url: string;
    title: string;
}>;
export declare const proofSchema: z.ZodObject<{
    sessionId: z.ZodString;
    imageUrl: z.ZodString;
    observation: z.ZodOptional<z.ZodString>;
}, "strip", z.ZodTypeAny, {
    sessionId: string;
    imageUrl: string;
    observation?: string | undefined;
}, {
    sessionId: string;
    imageUrl: string;
    observation?: string | undefined;
}>;
export declare const validateProofSchema: z.ZodObject<{
    status: z.ZodEnum<["VALIDATED", "REJECTED"]>;
    feedback: z.ZodOptional<z.ZodString>;
}, "strip", z.ZodTypeAny, {
    status: "VALIDATED" | "REJECTED";
    feedback?: string | undefined;
}, {
    status: "VALIDATED" | "REJECTED";
    feedback?: string | undefined;
}>;
export declare const courseCompletionSchema: z.ZodObject<{
    profileId: z.ZodString;
    status: z.ZodDefault<z.ZodEnum<["APPROVED", "REJECTED"]>>;
    notes: z.ZodOptional<z.ZodString>;
    emitMedal: z.ZodDefault<z.ZodBoolean>;
}, "strip", z.ZodTypeAny, {
    status: "REJECTED" | "APPROVED";
    profileId: string;
    emitMedal: boolean;
    notes?: string | undefined;
}, {
    profileId: string;
    status?: "REJECTED" | "APPROVED" | undefined;
    notes?: string | undefined;
    emitMedal?: boolean | undefined;
}>;
export type ProofInput = z.infer<typeof proofSchema>;
export declare const messageSchema: z.ZodObject<{
    content: z.ZodString;
    attachments: z.ZodOptional<z.ZodArray<z.ZodObject<{
        url: z.ZodString;
        type: z.ZodString;
    }, "strip", z.ZodTypeAny, {
        type: string;
        url: string;
    }, {
        type: string;
        url: string;
    }>, "many">>;
}, "strip", z.ZodTypeAny, {
    content: string;
    attachments?: {
        type: string;
        url: string;
    }[] | undefined;
}, {
    content: string;
    attachments?: {
        type: string;
        url: string;
    }[] | undefined;
}>;
export type MessageInput = z.infer<typeof messageSchema>;
export declare const announcementSchema: z.ZodObject<{
    title: z.ZodString;
    content: z.ZodString;
    category: z.ZodDefault<z.ZodEnum<["GENERAL", "ACADEMIC", "EVENT", "INSTITUTIONAL", "ADMIN"]>>;
    priority: z.ZodDefault<z.ZodNumber>;
    isPinned: z.ZodDefault<z.ZodBoolean>;
    expiresAt: z.ZodNullable<z.ZodOptional<z.ZodString>>;
    courseId: z.ZodNullable<z.ZodOptional<z.ZodString>>;
}, "strip", z.ZodTypeAny, {
    content: string;
    title: string;
    category: "GENERAL" | "ACADEMIC" | "EVENT" | "INSTITUTIONAL" | "ADMIN";
    priority: number;
    isPinned: boolean;
    courseId?: string | null | undefined;
    expiresAt?: string | null | undefined;
}, {
    content: string;
    title: string;
    category?: "GENERAL" | "ACADEMIC" | "EVENT" | "INSTITUTIONAL" | "ADMIN" | undefined;
    courseId?: string | null | undefined;
    priority?: number | undefined;
    isPinned?: boolean | undefined;
    expiresAt?: string | null | undefined;
}>;
export declare const projectSchema: z.ZodObject<{
    title: z.ZodString;
    description: z.ZodString;
    imageUrl: z.ZodUnion<[z.ZodOptional<z.ZodString>, z.ZodLiteral<"">]>;
    category: z.ZodString;
    link: z.ZodUnion<[z.ZodOptional<z.ZodString>, z.ZodLiteral<"">]>;
    status: z.ZodDefault<z.ZodEnum<["ACTIVE", "COMPLETED", "PAUSED"]>>;
}, "strip", z.ZodTypeAny, {
    status: "COMPLETED" | "ACTIVE" | "PAUSED";
    description: string;
    title: string;
    category: string;
    link?: string | undefined;
    imageUrl?: string | undefined;
}, {
    description: string;
    title: string;
    category: string;
    link?: string | undefined;
    status?: "COMPLETED" | "ACTIVE" | "PAUSED" | undefined;
    imageUrl?: string | undefined;
}>;
export declare const guestbookSchema: z.ZodObject<{
    content: z.ZodString;
    authorName: z.ZodOptional<z.ZodString>;
}, "strip", z.ZodTypeAny, {
    content: string;
    authorName?: string | undefined;
}, {
    content: string;
    authorName?: string | undefined;
}>;
export declare const monthlyHighlightSchema: z.ZodObject<{
    profileId: z.ZodString;
    month: z.ZodNumber;
    year: z.ZodNumber;
    description: z.ZodOptional<z.ZodString>;
    reason: z.ZodString;
    contributions: z.ZodOptional<z.ZodString>;
    imageUrl: z.ZodUnion<[z.ZodOptional<z.ZodString>, z.ZodLiteral<"">]>;
}, "strip", z.ZodTypeAny, {
    reason: string;
    profileId: string;
    month: number;
    year: number;
    description?: string | undefined;
    imageUrl?: string | undefined;
    contributions?: string | undefined;
}, {
    reason: string;
    profileId: string;
    month: number;
    year: number;
    description?: string | undefined;
    imageUrl?: string | undefined;
    contributions?: string | undefined;
}>;
export declare const mansionKeyRequestSchema: z.ZodObject<{
    reason: z.ZodString;
}, "strip", z.ZodTypeAny, {
    reason: string;
}, {
    reason: string;
}>;
export declare const radioTrackSchema: z.ZodObject<{
    title: z.ZodString;
    artist: z.ZodString;
    url: z.ZodString;
    coverUrl: z.ZodUnion<[z.ZodOptional<z.ZodString>, z.ZodLiteral<"">]>;
    duration: z.ZodOptional<z.ZodNumber>;
    playlistId: z.ZodOptional<z.ZodString>;
}, "strip", z.ZodTypeAny, {
    url: string;
    title: string;
    artist: string;
    coverUrl?: string | undefined;
    duration?: number | undefined;
    playlistId?: string | undefined;
}, {
    url: string;
    title: string;
    artist: string;
    coverUrl?: string | undefined;
    duration?: number | undefined;
    playlistId?: string | undefined;
}>;
export declare const roleChangeSchema: z.ZodObject<{
    role: z.ZodNativeEnum<typeof UserRole>;
    reason: z.ZodOptional<z.ZodString>;
}, "strip", z.ZodTypeAny, {
    role: UserRole;
    reason?: string | undefined;
}, {
    role: UserRole;
    reason?: string | undefined;
}>;
export declare const suspendUserSchema: z.ZodObject<{
    isSuspended: z.ZodBoolean;
    reason: z.ZodOptional<z.ZodString>;
}, "strip", z.ZodTypeAny, {
    isSuspended: boolean;
    reason?: string | undefined;
}, {
    isSuspended: boolean;
    reason?: string | undefined;
}>;
