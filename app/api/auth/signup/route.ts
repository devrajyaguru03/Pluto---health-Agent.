import { NextResponse } from 'next/server';
import db from '@/lib/db';
import { hashPassword, signToken } from '@/lib/auth';
import { cookies } from 'next/headers';

export async function POST(req: Request) {
    try {
        const { name, email, password } = await req.json();

        if (!name || !email || !password) {
            return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
        }

        // Check if user exists
        const existingUser = db.prepare('SELECT id FROM users WHERE email = ?').get(email);
        if (existingUser) {
            return NextResponse.json({ error: 'User already exists' }, { status: 409 });
        }

        const hashedPassword = await hashPassword(password);

        // Insert user
        const stmt = db.prepare('INSERT INTO users (name, email, password_hash) VALUES (?, ?, ?)');
        const info = stmt.run(name, email, hashedPassword);
        const userId = Number(info.lastInsertRowid);

        // Create session
        const token = signToken({ id: userId, email, name });
        const cookieStore = await cookies();
        cookieStore.set('auth_token', token, {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            sameSite: 'strict',
            maxAge: 60 * 60 * 24 * 7 // 1 week
        });

        return NextResponse.json({
            user: { id: userId, name, email }
        });

    } catch (error) {
        console.error('Signup error:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}
