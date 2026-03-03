import { getSession } from '@/lib/auth';
import { db } from '@/lib/db';
import { parseBody, UpdateProfileSchema } from '@/lib/validate';
import { respond, respondError, withErrorHandler } from '@/lib/api';

// GET /api/users/profile
export async function GET() {
    const session = await getSession();
    if (!session) return respondError('Unauthorized', 401);

    const result = await db.execute({
        sql: 'SELECT id, name, email, bio, created_at, updated_at FROM users WHERE id = ?',
        args: [session.id],
    });
    const user = result.rows[0] as any;

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
        const existing = await db.execute({
            sql: 'SELECT id FROM users WHERE email = ? AND id != ?',
            args: [data.email, session.id],
        });
        if (existing.rows.length > 0) {
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

    await db.execute({
        sql: `UPDATE users SET ${fields.join(', ')} WHERE id = ?`,
        args: values,
    });

    const updated = await db.execute({
        sql: 'SELECT id, name, email, bio, created_at, updated_at FROM users WHERE id = ?',
        args: [session.id],
    });
    const user = updated.rows[0] as any;

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
});
