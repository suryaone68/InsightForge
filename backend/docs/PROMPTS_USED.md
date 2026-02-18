# Prompts Used During Development

## 1. Research Brief Generation Prompt
Used to generate structured research brief from articles:

"You are a research analyst. Analyze these N articles and return ONLY valid JSON with summary, keyPoints with citations, conflicts, whatToVerify checklist, and sourcesUsed."

## 2. Content Extraction Logic
"How to extract clean article text using Cheerio - remove nav, footer, scripts and get main content from article or main tags"

## 3. Concurrency Setup
"How to use p-limit with Promise.allSettled to fetch multiple URLs in parallel with max 3 concurrent requests"

## 4. MongoDB Schema
"Design a MongoDB schema for saving research briefs with keyPoints, conflicts, sources and keeping only last 5 records"
```

---

**`.env.example`**
```
MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/insightforge
GROQ_API_KEY=your_groq_api_key_here
PORT=3000