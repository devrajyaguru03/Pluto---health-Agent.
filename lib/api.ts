import { NextResponse } from 'next/server';

/**
 * Consistent success response wrapper.
 */
export function respond<T>(data: T, status = 200): NextResponse {
    return NextResponse.json(data, { status });
}

/**
 * Consistent error response wrapper.
 */
export function respondError(
    message: string,
    status = 400,
    details?: unknown
): NextResponse {
    return NextResponse.json(
        { error: message, ...(details ? { details } : {}) },
        { status }
    );
}

/**
 * Wraps an API handler with try/catch and returns a 500 on unexpected errors.
 */
export function withErrorHandler(
    handler: (req: Request, ctx?: any) => Promise<NextResponse>
) {
    return async (req: Request, ctx?: any): Promise<NextResponse> => {
        try {
            return await handler(req, ctx);
        } catch (err: any) {
            // If parseBody threw a NextResponse (e.g., validation error), pass it through
            if (err instanceof Response) {
                return err as NextResponse;
            }
            console.error('[API Error]', err);
            return respondError('Internal server error', 500);
        }
    };
}
