import { groq } from '@ai-sdk/groq';
import { streamText, type UIMessage } from 'ai';
import { getSession } from '@/lib/auth';

export const maxDuration = 60;

const HEALTH_ASSISTANT_SYSTEM_PROMPT = `You are Pluto, an intelligent AI health assistant designed to help users understand their symptoms and health concerns. You provide helpful, accurate, and compassionate health information.

## Your Capabilities:
- Analyze symptoms described by users
- Provide general health information and educational content
- Suggest potential causes for common symptoms
- Recommend when to seek professional medical care
- Offer wellness tips and preventive health advice
- Answer questions about common health conditions

## Important Guidelines:
1. **Safety First**: Always recommend consulting a healthcare professional for serious symptoms, persistent issues, or emergencies. Never discourage professional medical care.

2. **Be Clear About Limitations**: You are an AI assistant, not a doctor. Make it clear that your responses are for educational purposes and should not replace professional medical advice.

3. **Ask Clarifying Questions**: When needed, ask follow-up questions to better understand the user's situation (duration of symptoms, severity, other relevant factors).

4. **Be Compassionate**: Health concerns can be stressful. Respond with empathy and understanding.

5. **Provide Structured Responses**: When analyzing symptoms, organize your response clearly:
   - Acknowledge the symptom(s)
   - Possible explanations (from most to least common)
   - Self-care suggestions (when appropriate)
   - When to see a doctor

6. **Emergency Recognition**: If a user describes symptoms that could indicate a medical emergency (chest pain, difficulty breathing, signs of stroke, severe allergic reaction, etc.), immediately advise them to seek emergency medical care.

## Response Format:
- Use clear, easy-to-understand language
- Avoid excessive medical jargon
- Use bullet points for lists
- Provide actionable advice when appropriate
- Always end with appropriate next steps or recommendations

Remember: Your goal is to improve health awareness and help users make informed decisions about their health, while always encouraging professional medical consultation when needed.`;

export async function POST(req: Request) {
  // Authentication is optional - chat works for everyone
  // const session = await getSession();
  // if (!session) {
  //   return new Response('Unauthorized', { status: 401 });
  // }

  const { messages }: { messages: UIMessage[] } = await req.json();

  /* 
   * Manually map messages to ensure compatibility and debugging.
   * Expects messages to be an array of objects with role and content.
   */
  if (!messages || !Array.isArray(messages)) {
    return new Response('Invalid messages format', { status: 400 });
  }

  const coreMessages = messages.map((m: any) => {
    // UIMessage uses 'parts' array, but streamText expects 'content' string
    let content = '';
    if (m.content) {
      content = m.content;
    } else if (m.parts && Array.isArray(m.parts)) {
      content = m.parts
        .filter((p: any) => p.type === 'text')
        .map((p: any) => p.text)
        .join('');
    }
    return {
      role: m.role,
      content: content
    };
  });

  const result = streamText({
    model: groq('llama-3.3-70b-versatile'),
    system: HEALTH_ASSISTANT_SYSTEM_PROMPT,
    messages: coreMessages as any, // Cast to any to avoid type strictness for now
    abortSignal: req.signal,
  });

  return result.toUIMessageStreamResponse();
}
