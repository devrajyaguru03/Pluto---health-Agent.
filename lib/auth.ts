import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';
import { cookies } from 'next/headers';

const JWT_SECRET = process.env.JWT_SECRET;

// Enforce a real secret in production
if (process.env.NODE_ENV === 'production' && !JWT_SECRET) {
    throw new Error('JWT_SECRET environment variable must be set in production.');
}

const SECRET = JWT_SECRET || 'dev-only-secret-change-in-production';

// ─── Types ───────────────────────────────────────────────────────

export interface UserPayload {
    id: number;
    email: string;
    name: string;
}

// ─── Password Helpers ────────────────────────────────────────────

export const hashPassword = async (password: string): Promise<string> => {
    return bcrypt.hash(password, 12);
};

export const comparePassword = async (
    password: string,
    hash: string
): Promise<boolean> => {
    return bcrypt.compare(password, hash);
};

// ─── JWT Helpers ─────────────────────────────────────────────────

export const signToken = (payload: UserPayload): string => {
    return jwt.sign(payload, SECRET, { expiresIn: '7d' });
};

export const verifyToken = (token: string): UserPayload | null => {
    try {
        return jwt.verify(token, SECRET) as UserPayload;
    } catch {
        return null;
    }
};

// ─── Cookie Session ──────────────────────────────────────────────

const COOKIE_NAME = 'pluto_auth';
const COOKIE_OPTIONS = {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'strict' as const,
    path: '/',
    maxAge: 60 * 60 * 24 * 7, // 7 days
};

export const setAuthCookie = async (payload: UserPayload): Promise<void> => {
    const token = signToken(payload);
    const cookieStore = await cookies();
    cookieStore.set(COOKIE_NAME, token, COOKIE_OPTIONS);
};

export const clearAuthCookie = async (): Promise<void> => {
    const cookieStore = await cookies();
    cookieStore.delete(COOKIE_NAME);
};

export const getSession = async (): Promise<UserPayload | null> => {
    const cookieStore = await cookies();
    const token = cookieStore.get(COOKIE_NAME)?.value;
    if (!token) return null;
    return verifyToken(token);
};
