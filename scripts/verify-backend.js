const fs = require('fs');
const path = require('path');

async function verify() {
    const baseUrl = 'http://localhost:3000';
    const cookieJar = {
        cookie: ''
    };

    const email = `test${Date.now()}@example.com`;
    const password = 'password123';

    console.log(`Testing with email: ${email}`);

    // 1. Signup
    console.log('\n--- Testing Signup ---');
    try {
        const res = await fetch(`${baseUrl}/api/auth/signup`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ name: 'Test User', email, password })
        });

        if (res.status !== 200) {
            console.error('Signup failed:', res.status, await res.text());
            return;
        }

        const data = await res.json();
        console.log('Signup success:', data);

        // Capture cookie
        const setCookie = res.headers.get('set-cookie');
        if (setCookie) {
            cookieJar.cookie = setCookie.split(';')[0];
            console.log('Cookie received');
        } else {
            console.error('No cookie received on signup');
        }

    } catch (e) {
        console.error('Signup error:', e);
        return;
    }

    // 2. Login (Optional if signup logs in, which it does)
    // Let's test Logout then Login
    console.log('\n--- Testing Logout ---');
    try {
        const res = await fetch(`${baseUrl}/api/auth/logout`, {
            method: 'POST',
            headers: { 'Cookie': cookieJar.cookie }
        });
        console.log('Logout status:', res.status);
        cookieJar.cookie = ''; // Clear cookie
    } catch (e) { console.error(e); }

    console.log('\n--- Testing Login ---');
    try {
        const res = await fetch(`${baseUrl}/api/auth/login`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email, password })
        });

        if (res.status === 200) {
            const data = await res.json();
            console.log('Login success:', data);
            const setCookie = res.headers.get('set-cookie');
            if (setCookie) {
                cookieJar.cookie = setCookie.split(';')[0];
            }
        } else {
            console.error('Login failed:', await res.text());
            return;
        }
    } catch (e) { console.error(e); }

    // 3. Me
    console.log('\n--- Testing Me ---');
    try {
        const res = await fetch(`${baseUrl}/api/auth/me`, {
            headers: { 'Cookie': cookieJar.cookie }
        });
        const data = await res.json();
        console.log('Me data:', data);
    } catch (e) { console.error(e); }

    // 4. Chat
    console.log('\n--- Testing Chat (Gemini) ---');
    try {
        const res = await fetch(`${baseUrl}/api/chat`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Cookie': cookieJar.cookie
            },
            body: JSON.stringify({
                messages: [{ role: 'user', content: 'Say hello!' }]
            })
        });

        if (res.status === 200) {
            console.log('Chat request successful, streaming response...');
            // Just read some text
            const text = await res.text();
            console.log('Chat response preview:', text.substring(0, 100) + '...');
        } else {
            console.error('Chat failed:', res.status, await res.text());
        }
    } catch (e) { console.error(e); }
}

// Check if server is running, if not, warn
fetch('http://localhost:3000').then(() => {
    verify();
}).catch(() => {
    console.log('Server is not running. Please run "npm run dev" in another terminal and then run this script.');
});
