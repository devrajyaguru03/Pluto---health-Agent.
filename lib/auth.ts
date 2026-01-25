import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';
import { cookies } from 'next/headers';

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key-change-this-in-production';

export interface UserPayload {
    id: number;
    email: string;
    name: string;
}

export const hashPassword = async (password: string) => {
    return await bcrypt.hash(password, 10);
};

export const comparePassword = async (password: string, hash: string) => {
    return await bcrypt.compare(password, hash);
};

export const signToken = (payload: UserPayload) => {
    return jwt.sign(payload, JWT_SECRET, { expiresIn: '7d' });
};

export const verifyToken = (token: string): UserPayload | null => {
    try {
        return jwt.verify(token, JWT_SECRET) as UserPayload;
    } catch (error) {
        return null;
    }
};

export const getSession = async (): Promise<UserPayload | null> => {
    const cookieStore = await cookies();
    const token = cookieStore.get('auth_token')?.value;

    if (!token) return null;
    return verifyToken(token);
};
