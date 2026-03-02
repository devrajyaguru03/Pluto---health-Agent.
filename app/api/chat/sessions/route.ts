import { NextResponse } from 'next/server';
import { getSession } from '@/lib/auth';
import db from '@/lib/db';
import { parseBody, CreateSessionSchema } from '@/lib/validate';
import { respond, respondError, withErrorHandler } from '@/lib/api';

// GET /api/chat/sessions — list all sessions for the current user
export async function GET() {
    const session = await getSession();
    if (!session) return respondError('Unauthorized', 401);

    const sessions = db
        .prepare(
            'SELECT id, title, created_at, updated_at FROM chat_sessions WHERE user_id = ? ORDER BY updated_at DESC'
        )
        .all(session.id) as any[];

    return respond({ sessions });
}

// POST /api/chat/sessions — create a new chat session
export const POST = withErrorHandler(async (req: Request) => {
    const session = await getSession();
    if (!session) return respondError('Unauthorized', 401);

    const { title } = await parseBody(CreateSessionSchema, req);

    const { lastInsertRowid } = db
        .prepare('INSERT INTO chat_sessions (user_id, title) VALUES (?, ?)')
        .run(session.id, title);

    const newSession = db
        .prepare('SELECT id, title, created_at, updated_at FROM chat_sessions WHERE id = ?')
        .get(Number(lastInsertRowid)) as any;

    return respond({ session: newSession }, 201);
});
