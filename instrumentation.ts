export async function register() {
    // Run DB schema initialization on server startup
    if (process.env.NEXT_RUNTIME === 'nodejs') {
        const { initDb } = await import('./lib/db');
        await initDb();
    }
}
