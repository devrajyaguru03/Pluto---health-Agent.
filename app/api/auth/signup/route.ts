import { NextResponse } from 'next/server';
import db from '@/lib/db';
import { hashPassword, setAuthCookie } from '@/lib/auth';
import { parseBody, SignupSchema } from '@/lib/validate';
import { respondError, withErrorHandler } from '@/lib/api';

export const POST = withErrorHandler(async (req: Request) => {
    const { name, email, password } = await parseBody(SignupSchema, req);

    // Check duplicate email
    const existing = db.prepare('SELECT id FROM users WHERE email = ?').get(email);
    if (existing) {
        return respondError('An account with this email already exists', 409);
    }

    const passwordHash = await hashPassword(password);

    const { lastInsertRowid } = db
        .prepare('INSERT INTO users (name, email, password_hash) VALUES (?, ?, ?)')
        .run(name, email, passwordHash);

    const userId = Number(lastInsertRowid);

    await setAuthCookie({ id: userId, email, name });

    return NextResponse.json(
        { user: { id: userId, name, email } },
        { status: 201 }
    );
});
