<div align="center">

<br/>

# 🪐 Pluto — AI Health Assistant

**Your Intelligent Health Companion, Powered by AI**

[![Next.js](https://img.shields.io/badge/Next.js-16-black?logo=next.js&logoColor=white)](https://nextjs.org/)
[![React](https://img.shields.io/badge/React-19-61DAFB?logo=react&logoColor=black)](https://react.dev/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5-3178C6?logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![TailwindCSS](https://img.shields.io/badge/TailwindCSS-4-06B6D4?logo=tailwind-css&logoColor=white)](https://tailwindcss.com/)
[![Turso](https://img.shields.io/badge/Turso-SQLite-4FF8D2?logo=sqlite&logoColor=black)](https://turso.tech/)
[![Vercel](https://img.shields.io/badge/Deployed%20on-Vercel-black?logo=vercel&logoColor=white)](https://vercel.com/)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](LICENSE)

<br/>

> ⚠️ **Medical Disclaimer:** Pluto is designed for **health awareness and educational purposes only**. It is **not** a substitute for professional medical advice, diagnosis, or treatment. Always consult a qualified healthcare provider for medical concerns.

</div>

---

## ✨ Overview

**Pluto** is a full-stack AI-powered health assistant web application that lets users describe their symptoms in natural language and receive structured preliminary health insights in real-time. It combines a modern, conversational chat interface with advanced large language models (via Groq/Google AI) to deliver instant, meaningful health awareness support.

No medical background needed — just talk to Pluto like you would talk to a knowledgeable friend.

---

## 🖥️ Features

| Feature | Description |
|---|---|
| 🤖 **AI-Powered Analysis** | Uses Groq & Google AI models to analyze symptoms and generate structured health insights |
| 💬 **Conversational Chat** | Natural language interface — ask follow-up questions, get detailed explanations |
| 📋 **Chat Session History** | Authenticated users can save and revisit previous conversations |
| 🔐 **Secure Authentication** | JWT-based auth with bcrypt password hashing, httpOnly cookie sessions |
| 🛡️ **Rate Limiting** | Token-bucket rate limiting to protect API endpoints from abuse |
| 🌙 **Dark / Light Mode** | Full theme support via `next-themes` |
| ⚡ **Real-Time Streaming** | AI responses stream token-by-token for a fluid, responsive feel |
| 📱 **Responsive Design** | Mobile-first, fully responsive layout built with Tailwind CSS v4 |
| 🔒 **Privacy First** | Health data is never shared; processed securely per session |

---

## 🏗️ Tech Stack

### Frontend
- **[Next.js 16](https://nextjs.org/)** — App Router, Server Components, API Routes
- **[React 19](https://react.dev/)** — Latest concurrent features
- **[TypeScript 5](https://www.typescriptlang.org/)** — Full type safety
- **[Tailwind CSS v4](https://tailwindcss.com/)** — Utility-first styling
- **[shadcn/ui](https://ui.shadcn.com/)** + **Radix UI** — Accessible, composable component primitives
- **[Recharts](https://recharts.org/)** — Data visualization
- **[Lucide React](https://lucide.dev/)** — Icon library
- **[next-themes](https://github.com/pacocoursey/next-themes)** — Dark/light mode

### Backend & AI
- **[Vercel AI SDK](https://sdk.vercel.ai/)** — AI streaming & chat primitives
- **[@ai-sdk/groq](https://sdk.vercel.ai/providers/ai-sdk-providers/groq)** — Groq LLM integration (Llama, Mixtral, etc.)
- **[@ai-sdk/google](https://sdk.vercel.ai/providers/ai-sdk-providers/google)** — Google Gemini integration
- **[JWT](https://jwt.io/)** + **[bcryptjs](https://github.com/dcodeIO/bcrypt.js)** — Authentication & password security
- **[Zod](https://zod.dev/)** — Runtime schema validation
- **[React Hook Form](https://react-hook-form.com/)** — Performant form management

### Database
- **[Turso](https://turso.tech/)** (libSQL / SQLite-compatible) — Edge-ready, serverless database
- **[@libsql/client](https://github.com/libsql/libsql-client-ts)** — TypeScript client for Turso

### Deployment & Analytics
- **[Vercel](https://vercel.com/)** — Zero-config deployment with edge network
- **[@vercel/analytics](https://vercel.com/analytics)** — Built-in usage analytics

---

## 🗄️ Database Schema

```sql
-- Users
CREATE TABLE users (
  id           INTEGER PRIMARY KEY AUTOINCREMENT,
  name         TEXT    NOT NULL,
  email        TEXT    UNIQUE NOT NULL,
  password_hash TEXT   NOT NULL,
  bio          TEXT,
  created_at   DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at   DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Chat Sessions
CREATE TABLE chat_sessions (
  id         INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id    INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  title      TEXT    NOT NULL DEFAULT 'New Chat',
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Chat Messages
CREATE TABLE chat_messages (
  id         INTEGER PRIMARY KEY AUTOINCREMENT,
  session_id INTEGER NOT NULL REFERENCES chat_sessions(id) ON DELETE CASCADE,
  role       TEXT    NOT NULL CHECK(role IN ('user', 'assistant', 'system')),
  content    TEXT    NOT NULL,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);
```

---

## 🚀 Getting Started

### Prerequisites

- **Node.js** >= 18
- **npm** or **pnpm**
- A **[Turso](https://turso.tech/)** database (free tier available)
- A **[Groq](https://console.groq.com/)** API key (free tier available)
- *(Optional)* A **[Google AI](https://aistudio.google.com/)** API key

### 1. Clone the Repository

```bash
git clone https://github.com/your-username/pluto-health-assistant.git
cd pluto-health-assistant
```

### 2. Install Dependencies

```bash
npm install
# or
pnpm install
```

### 3. Configure Environment Variables

Create a `.env.local` file in the project root:

```env
# ── Database (Turso) ─────────────────────────────────────────────
TURSO_DATABASE_URL=libsql://your-database-name.turso.io
TURSO_AUTH_TOKEN=your-turso-auth-token

# ── Authentication ───────────────────────────────────────────────
JWT_SECRET=your-super-secret-jwt-key-change-this-in-production

# ── AI Providers ─────────────────────────────────────────────────
GROQ_API_KEY=your-groq-api-key
GOOGLE_GENERATIVE_AI_API_KEY=your-google-ai-api-key   # optional
```

> 💡 **Tip:** Get a free Turso database at [turso.tech](https://turso.tech) and a free Groq API key at [console.groq.com](https://console.groq.com).

### 4. Run the Development Server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser. 🎉

---

## 📁 Project Structure

```
pluto-health-assistant/
├── app/
│   ├── api/
│   │   ├── auth/          # Login, register, logout, session endpoints
│   │   ├── chat/          # AI chat streaming + session/message CRUD
│   │   ├── health/        # Health check endpoint
│   │   └── users/         # User profile endpoints
│   ├── chat/              # Chat page
│   ├── login/             # Login / register page
│   ├── layout.tsx         # Root layout with theme provider
│   └── page.tsx           # Landing / marketing page
├── components/
│   ├── ui/                # shadcn/ui component library (Button, Dialog, etc.)
│   └── pluto-logo.tsx     # Pluto brand logo component
├── lib/
│   ├── auth.ts            # JWT, bcrypt, cookie session helpers
│   ├── db.ts              # Turso/libSQL client & schema initialization
│   ├── ratelimit.ts       # Token-bucket rate limiter
│   ├── api.ts             # API client utilities
│   └── validate.ts        # Zod schemas for input validation
├── hooks/                 # Custom React hooks
├── styles/                # Global CSS
├── public/                # Static assets
└── next.config.mjs        # Next.js configuration
```

---

## 🌐 API Endpoints

| Method | Endpoint | Description | Auth Required |
|--------|----------|-------------|:---:|
| `POST` | `/api/auth/register` | Create a new user account | ❌ |
| `POST` | `/api/auth/login` | Authenticate and receive session cookie | ❌ |
| `POST` | `/api/auth/logout` | Clear session cookie | ✅ |
| `GET` | `/api/auth/session` | Get current authenticated user | ✅ |
| `POST` | `/api/chat` | Stream AI health analysis response | ❌ |
| `GET` | `/api/chat/sessions` | List user's chat sessions | ✅ |
| `POST` | `/api/chat/sessions` | Create a new chat session | ✅ |
| `GET` | `/api/chat/sessions/[id]/messages` | Get messages for a session | ✅ |
| `POST` | `/api/chat/sessions/[id]/messages` | Save a message to a session | ✅ |
| `GET` | `/api/health` | API health check | ❌ |

---

## ☁️ Deploy to Vercel

The easiest way to deploy Pluto is with **[Vercel](https://vercel.com/)**.

[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new/clone?repository-url=https://github.com/your-username/pluto-health-assistant)

**Steps:**

1. Push your code to GitHub
2. Import the repository in [Vercel Dashboard](https://vercel.com/dashboard)
3. Add the following environment variables in the Vercel project settings:
   - `TURSO_DATABASE_URL`
   - `TURSO_AUTH_TOKEN`
   - `JWT_SECRET`
   - `GROQ_API_KEY`
4. Click **Deploy** 🚀

---

## 🔒 Security

- Passwords are hashed with **bcrypt** (12 salt rounds)
- Sessions use **httpOnly, Secure, SameSite=Strict** cookies
- JWT tokens expire after **7 days**
- API routes are protected by **token-bucket rate limiting**
- Input is validated with **Zod** schemas before processing
- `JWT_SECRET` is enforced at runtime in production

---

## 🛣️ Roadmap

- [ ] Voice input for symptom description
- [ ] Health history tracking & trends dashboard
- [ ] Medication reminders & management
- [ ] Doctor appointment booking integration
- [ ] Multi-language support
- [ ] Export health reports as PDF
- [ ] Redis-backed distributed rate limiting

---

## 🤝 Contributing

Contributions are welcome! Please open an issue first to discuss what you'd like to change.

```bash
# Fork and clone the repo
git clone https://github.com/your-username/pluto-health-assistant.git

# Create a feature branch
git checkout -b feature/your-feature-name

# Commit your changes
git commit -m "feat: add your feature"

# Push and open a Pull Request
git push origin feature/your-feature-name
```

---

## 📄 License

This project is licensed under the **MIT License** — see the [LICENSE](LICENSE) file for details.

---

<div align="center">

Built with ❤️ by [Devraj Yaguru](https://github.com/devrajyaguru03)

**Pluto AI Health Assistant — For educational purposes only.**

</div>
