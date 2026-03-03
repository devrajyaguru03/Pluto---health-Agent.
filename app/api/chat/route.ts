import { groq } from '@ai-sdk/groq';
import { streamText } from 'ai';
import { getSession } from '@/lib/auth';
import { respondError } from '@/lib/api';
import { rateLimit, getIp } from '@/lib/ratelimit';
import { db } from '@/lib/db';

export const maxDuration = 60;

const HEALTH_ASSISTANT_SYSTEM_PROMPT = `You are Pluto, an intelligent AI health assistant designed to help users understand their symptoms and health concerns. You provide helpful, accurate, and compassionate health information.

## Your Capabilities:
- Analyze symptoms described by users
- Analyze medical reports, blood test results, X-rays, skin conditions, and other medical images
- Provide general health information and educational content
- Suggest potential causes for common symptoms
- Recommend when to seek professional medical care
- Offer wellness tips and preventive health advice
- Answer questions about common health conditions

## When Analyzing Medical Images or Reports:
- Identify key values, measurements, and findings in reports
- Explain what normal ranges typically are for blood tests and lab values
- Note any values that appear outside normal ranges (high/low)
- For images of body parts or skin: describe what you visually observe
- Always clarify that your analysis is informational and not a medical diagnosis
- Recommend professional medical follow-up for concerning findings

## Important Guidelines:
1. **Safety First**: Always recommend consulting a healthcare professional for serious symptoms, persistent issues, or emergencies.
2. **Be Clear About Limitations**: You are an AI assistant, not a doctor. Your responses are for educational purposes only.
3. **Ask Clarifying Questions**: When needed, ask follow-up questions to better understand the situation.
4. **Be Compassionate**: Health concerns can be stressful. Respond with empathy and understanding.
5. **Provide Structured Responses**: Organize your response clearly with findings, explanations, and recommendations.
6. **Emergency Recognition**: If findings suggest a medical emergency, immediately advise seeking emergency care.

## Response Format:
- Use clear, easy-to-understand language
- Avoid excessive medical jargon (explain terms when used)
- Use bullet points and sections for clarity
- Always end with appropriate next steps or recommendations

Remember: Your goal is to improve health awareness and help users make informed decisions, while always encouraging professional medical consultation.`;

export async function POST(req: Request) {
  // Rate limiting
  const ip = getIp(req);
  const limit = rateLimit(ip, { limit: 20, windowMs: 60_000 });
  if (!limit.ok) {
    return respondError(`Too many requests. Please wait ${limit.retryAfter}s.`, 429);
  }

  let body: any;
  try {
    body = await req.json();
  } catch {
    return respondError('Invalid request body', 400);
  }

  const { messages, sessionId } = body;
  if (!messages || !Array.isArray(messages)) {
    return respondError('messages array is required', 400);
  }

  // Build core messages supporting text + images
  const coreMessages = messages.map((m: any) => {
    const parts: any[] = [];

    // Collect text content
    if (typeof m.content === 'string' && m.content) {
      parts.push({ type: 'text', text: m.content });
    }

    // Collect text parts from parts array
    if (m.parts && Array.isArray(m.parts)) {
      for (const p of m.parts) {
        if (p.type === 'text' && p.text) {
          parts.push({ type: 'text', text: p.text });
        }
        // Image as base64 data URL
        if (p.type === 'image' && p.data) {
          parts.push({
            type: 'image',
            image: p.data, // base64 data URL: "data:image/jpeg;base64,..."
          });
        }
      }
    }

    // If nothing found, fallback
    if (parts.length === 0 && m.text) {
      parts.push({ type: 'text', text: m.text });
    }

    return {
      role: m.role as 'user' | 'assistant' | 'system',
      content: parts.length === 1 && parts[0].type === 'text'
        ? parts[0].text  // plain text: keep as string for compatibility
        : parts,         // multimodal: use parts array
    };
  });

  // Extract user text for history saving
  const lastUserMsg = [...coreMessages].reverse().find(m => m.role === 'user');
  const lastUserText = typeof lastUserMsg?.content === 'string'
    ? lastUserMsg.content
    : Array.isArray(lastUserMsg?.content)
      ? lastUserMsg.content.filter((p: any) => p.type === 'text').map((p: any) => p.text).join('')
      : '';

  // Check if any message contains an image
  const hasImage = messages.some((m: any) =>
    m.parts?.some((p: any) => p.type === 'image' && p.data)
  );

  // Use vision model if image present, text model otherwise
  const model = hasImage
    ? groq('meta-llama/llama-4-scout-17b-16e-instruct')
    : groq('llama-3.3-70b-versatile');

  // Save user message to DB if authenticated
  const session = await getSession();
  if (session && sessionId && lastUserText) {
    const ownerResult = await db.execute({
      sql: 'SELECT id FROM chat_sessions WHERE id = ? AND user_id = ?',
      args: [sessionId, session.id],
    });
    if (ownerResult.rows.length > 0) {
      await db.execute({
        sql: 'INSERT INTO chat_messages (session_id, role, content) VALUES (?, ?, ?)',
        args: [sessionId, 'user', hasImage ? `[Image attached] ${lastUserText}` : lastUserText],
      });
    }
  }

  const result = streamText({
    model,
    system: HEALTH_ASSISTANT_SYSTEM_PROMPT,
    messages: coreMessages as any,
    abortSignal: req.signal,
    onFinish: async ({ text }) => {
      if (session && sessionId && text) {
        const ownerResult = await db.execute({
          sql: 'SELECT id FROM chat_sessions WHERE id = ? AND user_id = ?',
          args: [sessionId, session.id],
        });
        if (ownerResult.rows.length > 0) {
          await db.execute({
            sql: 'INSERT INTO chat_messages (session_id, role, content) VALUES (?, ?, ?)',
            args: [sessionId, 'assistant', text],
          });
          await db.execute({
            sql: 'UPDATE chat_sessions SET updated_at = CURRENT_TIMESTAMP WHERE id = ?',
            args: [sessionId],
          });
        }
      }
    },
  });

  return result.toUIMessageStreamResponse();
}
