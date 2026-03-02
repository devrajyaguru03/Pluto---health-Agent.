/**
 * Simple in-memory token-bucket rate limiter.
 * Good for single-process Next.js (dev + small prod deployments).
 * For multi-instance deployments, swap this for Redis-backed rate limiting.
 */

interface Bucket {
    tokens: number;
    lastRefill: number;
}

const buckets = new Map<string, Bucket>();

interface RateLimitOptions {
    /** Max requests allowed per window */
    limit: number;
    /** Window size in milliseconds */
    windowMs: number;
}

interface RateLimitResult {
    ok: boolean;
    remaining: number;
    retryAfter?: number; // seconds
}

export function rateLimit(
    ip: string,
    { limit, windowMs }: RateLimitOptions
): RateLimitResult {
    const now = Date.now();
    let bucket = buckets.get(ip);

    if (!bucket || now - bucket.lastRefill >= windowMs) {
        bucket = { tokens: limit, lastRefill: now };
    }

    if (bucket.tokens <= 0) {
        const retryAfter = Math.ceil((windowMs - (now - bucket.lastRefill)) / 1000);
        buckets.set(ip, bucket);
        return { ok: false, remaining: 0, retryAfter };
    }

    bucket.tokens -= 1;
    buckets.set(ip, bucket);
    return { ok: true, remaining: bucket.tokens };
}

/**
 * Extract an IP from a Next.js Request.
 */
export function getIp(req: Request): string {
    return (
        req.headers.get('x-forwarded-for')?.split(',')[0].trim() ||
        req.headers.get('x-real-ip') ||
        'unknown'
    );
}
