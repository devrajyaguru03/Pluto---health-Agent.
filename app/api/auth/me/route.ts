import { NextResponse } from 'next/server';
import { getSession } from '@/lib/auth';
import { db } from '@/lib/db';
import { respondError } from '@/lib/api';

export async function GET() {
    const session = await getSession();

    if (!session) {
        return NextResponse.json({ user: null });
    }

    // Return live data from DB instead of stale JWT payload
    const result = await db.execute({
        sql: 'SELECT id, name, email, bio, created_at, updated_at FROM users WHERE id = ?',
        args: [session.id],
    });
    const user = result.rows[0] as any;

    if (!user) {
        return respondError('User not found', 404);
    }

    return NextResponse.json({
        user: {
            id: user.id,
            name: user.name,
            email: user.email,
            bio: user.bio ?? null,
            createdAt: user.created_at,
            updatedAt: user.updated_at,
        },
    });
}
