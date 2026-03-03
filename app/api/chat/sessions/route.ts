import { NextResponse } from 'next/server';
import { getSession } from '@/lib/auth';
import { db } from '@/lib/db';
import { parseBody, CreateSessionSchema } from '@/lib/validate';
import { respond, respondError, withErrorHandler } from '@/lib/api';

// GET /api/chat/sessions — list all sessions for the current user
export async function GET() {
    const session = await getSession();
    if (!session) return respondError('Unauthorized', 401);

    const result = await db.execute({
        sql: 'SELECT id, title, created_at, updated_at FROM chat_sessions WHERE user_id = ? ORDER BY updated_at DESC',
        args: [session.id],
    });

    return respond({ sessions: result.rows });
}

// POST /api/chat/sessions — create a new chat session
export const POST = withErrorHandler(async (req: Request) => {
    const session = await getSession();
    if (!session) return respondError('Unauthorized', 401);

    const body = await parseBody(CreateSessionSchema, req);
    const title: string = body.title ?? 'New Chat';

    const inserted = await db.execute({
        sql: 'INSERT INTO chat_sessions (user_id, title) VALUES (?, ?)',
        args: [session.id, title],
    });

    const newSessionResult = await db.execute({
        sql: 'SELECT id, title, created_at, updated_at FROM chat_sessions WHERE id = ?',
        args: [Number(inserted.lastInsertRowid)],
    });

    return NextResponse.json({ session: newSessionResult.rows[0] }, { status: 201 });
});
