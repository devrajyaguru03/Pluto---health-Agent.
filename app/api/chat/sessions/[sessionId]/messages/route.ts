import { getSession } from '@/lib/auth';
import { db } from '@/lib/db';
import { parseBody } from '@/lib/validate';
import { respond, respondError, withErrorHandler } from '@/lib/api';
import { z } from 'zod';

const AppendMessagesSchema = z.object({
    userMessage: z.string().min(1),
    assistantMessage: z.string().min(1),
});

interface Params {
    params: Promise<{ sessionId: string }>;
}

// POST /api/chat/sessions/[sessionId]/messages — append a user+assistant message pair
export const POST = withErrorHandler(async (req: Request, { params }: Params) => {
    const session = await getSession();
    if (!session) return respondError('Unauthorized', 401);

    const { sessionId } = await params;
    const id = parseInt(sessionId, 10);
    if (isNaN(id)) return respondError('Invalid session ID', 400);

    const sessionResult = await db.execute({
        sql: 'SELECT id FROM chat_sessions WHERE id = ? AND user_id = ?',
        args: [id, session.id],
    });
    if (sessionResult.rows.length === 0) return respondError('Session not found', 404);

    const { userMessage, assistantMessage } = await parseBody(AppendMessagesSchema, req);

    // Insert both messages and update session timestamp
    await db.batch([
        {
            sql: 'INSERT INTO chat_messages (session_id, role, content) VALUES (?, ?, ?)',
            args: [id, 'user', userMessage],
        },
        {
            sql: 'INSERT INTO chat_messages (session_id, role, content) VALUES (?, ?, ?)',
            args: [id, 'assistant', assistantMessage],
        },
        {
            sql: 'UPDATE chat_sessions SET updated_at = CURRENT_TIMESTAMP WHERE id = ?',
            args: [id],
        },
    ]);

    return respond({ success: true }, 201);
});
