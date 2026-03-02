import { z } from 'zod';
import { respondError } from './api';

// ─── Schemas ────────────────────────────────────────────────────

export const LoginSchema = z.object({
    email: z.string().email('Invalid email address'),
    password: z.string().min(1, 'Password is required'),
});

export const SignupSchema = z.object({
    name: z.string().min(2, 'Name must be at least 2 characters'),
    email: z.string().email('Invalid email address'),
    password: z.string().min(8, 'Password must be at least 8 characters'),
});

export const ChatMessagePartSchema = z.object({
    type: z.literal('text'),
    text: z.string(),
});

export const ChatMessageSchema = z.object({
    role: z.enum(['user', 'assistant', 'system']),
    content: z.string().optional(),
    parts: z.array(ChatMessagePartSchema).optional(),
});

export const ChatRequestSchema = z.object({
    messages: z.array(ChatMessageSchema).min(1, 'At least one message is required'),
    sessionId: z.number().int().positive().optional(),
});

export const UpdateProfileSchema = z.object({
    name: z.string().min(2, 'Name must be at least 2 characters').optional(),
    email: z.string().email('Invalid email address').optional(),
}).refine((d) => d.name !== undefined || d.email !== undefined, {
    message: 'At least one field (name or email) must be provided',
});

export const CreateSessionSchema = z.object({
    title: z.string().min(1).max(200).optional().default('New Chat'),
});

// ─── Helper ─────────────────────────────────────────────────────

/**
 * Parses and validates a request body against a Zod schema.
 * Throws a NextResponse with 400 + validation details on failure.
 */
export async function parseBody<T>(
    schema: z.ZodSchema<T>,
    req: Request
): Promise<T> {
    let body: unknown;
    try {
        body = await req.json();
    } catch {
        throw respondError('Invalid JSON body', 400);
    }

    const result = schema.safeParse(body);
    if (!result.success) {
        throw respondError('Validation failed', 400, result.error.flatten().fieldErrors);
    }
    return result.data;
}
