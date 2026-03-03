import { getSession } from '@/lib/auth';
import { db } from '@/lib/db';
import { respond, respondError } from '@/lib/api';

interface Params {
    params: Promise<{ sessionId: string }>;
}

// GET /api/chat/sessions/[sessionId] — get a session with all its messages
export async function GET(_req: Request, { params }: Params) {
    const session = await getSession();
    if (!session) return respondError('Unauthorized', 401);

    const { sessionId } = await params;
    const id = parseInt(sessionId, 10);
    if (isNaN(id)) return respondError('Invalid session ID', 400);

    const sessionResult = await db.execute({
        sql: 'SELECT id, title, created_at, updated_at FROM chat_sessions WHERE id = ? AND user_id = ?',
        args: [id, session.id],
    });
    const chatSession = sessionResult.rows[0] as any;

    if (!chatSession) return respondError('Session not found', 404);

    const messagesResult = await db.execute({
        sql: 'SELECT id, role, content, created_at FROM chat_messages WHERE session_id = ? ORDER BY created_at ASC',
        args: [id],
    });

    return respond({
        session: {
            id: chatSession.id,
            title: chatSession.title,
            createdAt: chatSession.created_at,
            updatedAt: chatSession.updated_at,
            messages: messagesResult.rows,
        },
    });
}

// DELETE /api/chat/sessions/[sessionId] — delete a session and all its messages
export async function DELETE(_req: Request, { params }: Params) {
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

    // Messages cascade-delete due to FK + ON DELETE CASCADE
    await db.execute({
        sql: 'DELETE FROM chat_sessions WHERE id = ?',
        args: [id],
    });

    return respond({ success: true });
}
