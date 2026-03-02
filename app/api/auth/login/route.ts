import { NextResponse } from 'next/server';
import db from '@/lib/db';
import { comparePassword, setAuthCookie } from '@/lib/auth';
import { parseBody, LoginSchema } from '@/lib/validate';
import { respondError, withErrorHandler } from '@/lib/api';

export const POST = withErrorHandler(async (req: Request) => {
    const { email, password } = await parseBody(LoginSchema, req);

    const user = db.prepare('SELECT * FROM users WHERE email = ?').get(email) as any;

    if (!user || !(await comparePassword(password, user.password_hash))) {
        return respondError('Invalid email or password', 401);
    }

    await setAuthCookie({ id: user.id, email: user.email, name: user.name });

    return NextResponse.json({
        user: { id: user.id, name: user.name, email: user.email, createdAt: user.created_at },
    });
});
