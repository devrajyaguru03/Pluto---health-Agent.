import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { comparePassword, setAuthCookie } from '@/lib/auth';
import { parseBody, LoginSchema } from '@/lib/validate';
import { respondError, withErrorHandler } from '@/lib/api';

export const POST = withErrorHandler(async (req: Request) => {
    const { email, password } = await parseBody(LoginSchema, req);

    const result = await db.execute({
        sql: 'SELECT * FROM users WHERE email = ?',
        args: [email],
    });
    const user = result.rows[0] as any;

    if (!user || !(await comparePassword(password, user.password_hash as string))) {
        return respondError('Invalid email or password', 401);
    }

    await setAuthCookie({ id: Number(user.id), email: user.email as string, name: user.name as string });

    return NextResponse.json({
        user: { id: user.id, name: user.name, email: user.email, createdAt: user.created_at },
    });
});
