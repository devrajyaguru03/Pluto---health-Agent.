import { NextResponse } from 'next/server';
import { clearAuthCookie } from '@/lib/auth';

async function handler() {
    await clearAuthCookie();
    return NextResponse.json({ success: true });
}

// Support both POST (fetch) and GET (browser redirect)
export const POST = handler;
export const GET = handler;
