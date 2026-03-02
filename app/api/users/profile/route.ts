import { getSession } from '@/lib/auth';
import db from '@/lib/db';
import { parseBody, UpdateProfileSchema } from '@/lib/validate';
import { respond, respondError, withErrorHandler } from '@/lib/api';

// GET /api/users/profile
export async function GET() {
    const session = await getSession();
    if (!session) return respondError('Unauthorized', 401);

    const user = db
        .prepare('SELECT id, name, email, bio, created_at, updated_at FROM users WHERE id = ?')
        .get(session.id) as any;

    if (!user) return respondError('User not found', 404);

    return respond({
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

// PATCH /api/users/profile
export const PATCH = withErrorHandler(async (req: Request) => {
    const session = await getSession();
    if (!session) return respondError('Unauthorized', 401);

    const data = await parseBody(UpdateProfileSchema, req);

    // Check email uniqueness if changing email
    if (data.email) {
        const existing = db
            .prepare('SELECT id FROM users WHERE email = ? AND id != ?')
            .get(data.email, session.id);
        if (existing) {
            return respondError('Email is already taken by another account', 409);
        }
    }

    // Build dynamic update query
    const fields: string[] = [];
    const values: any[] = [];

    if (data.name) { fields.push('name = ?'); values.push(data.name); }
    if (data.email) { fields.push('email = ?'); values.push(data.email); }
    fields.push('updated_at = CURRENT_TIMESTAMP');
    values.push(session.id);

    db.prepare(`UPDATE users SET ${fields.join(', ')} WHERE id = ?`).run(...values);

    const updated = db
        .prepare('SELECT id, name, email, bio, created_at, updated_at FROM users WHERE id = ?')
        .get(session.id) as any;

    return respond({
        user: {
            id: updated.id,
            name: updated.name,
            email: updated.email,
            bio: updated.bio ?? null,
            createdAt: updated.created_at,
            updatedAt: updated.updated_at,
        },
    });
});
