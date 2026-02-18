import Groq from 'groq-sdk';

const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });
const MODEL = 'llama-3.3-70b-versatile';

function buildPrompt(articles) {
  const articlesText = articles.map((a, i) => `
ARTICLE ${i + 1}:
URL: ${a.url}
Title: ${a.title}
Content: ${a.content}
---`).join('\n');

  return `You are a research analyst. Analyze these ${articles.length} articles and return ONLY valid JSON.

${articlesText}

Return this exact JSON:
{
  "summary": "2-3 sentence overall summary",
  "keyPoints": [
    {
      "point": "the key insight",
      "source": "Article 1",
      "url": "exact url of that article",
      "snippet": "short quote from that article"
    }
  ],
  "conflicts": [
    {
      "claim": "what is conflicting",
      "sourceA": "Article X says this",
      "sourceB": "Article Y says this"
    }
  ],
  "whatToVerify": [
    "specific claim to fact-check",
    "another thing to verify"
  ],
  "sourcesUsed": [
    {
      "url": "article url",
      "title": "article title",
      "contribution": "what this source contributed"
    }
  ]
}

Rules:
- keyPoints must have 5-8 points
- whatToVerify must have 3-5 items
- If no conflicts, return empty array []
- Return ONLY JSON, no markdown, no explanation`;
}

export async function generateBrief(articles) {
  console.log(`🤖 Generating brief from ${articles.length} articles...`);

  try {
    const completion = await groq.chat.completions.create({
      model: MODEL,
      messages: [
        {
          role: 'system',
          content: 'You are a research analyst. Always respond with valid JSON only. No markdown, no extra text.'
        },
        { role: 'user', content: buildPrompt(articles) }
      ],
      temperature: 0.3,
      max_tokens: 3000
    });

    const rawText = completion.choices[0].message.content.trim();

    // Check karo HTML toh nahi aaya
    if (rawText.startsWith('<')) {
      throw new Error('LLM returned invalid response. Please try again.');
    }

    const cleaned = rawText.replace(/```json|```/g, '').trim();

    let parsed;
    try {
      parsed = JSON.parse(cleaned);
    } catch {
      console.error('❌ Raw response:', rawText.substring(0, 300));
      throw new Error('LLM returned invalid JSON. Please try again.');
    }

    if (!parsed.summary || !parsed.keyPoints || !parsed.whatToVerify) {
      throw new Error('LLM response missing required fields');
    }

    console.log(`✅ Brief generated — ${parsed.keyPoints.length} key points\n`);
    return parsed;

  } catch (error) {
    console.error('❌ LLM error:', error.message);
    throw new Error(`LLM failed: ${error.message}`);
  }
}
