# ⚡ InsightForge

AI-Powered Research Brief Generator

## What it does
Paste 5-10 article links and get a structured research brief with summary, key points with citations, conflicting claims, and a what-to-verify checklist.

## How to run

1. Clone the repo
   git clone https://github.com/yourusername/insightforge.git
   cd insightforge/backend

2. Install dependencies
   npm install

3. Setup environment
   cp .env.example .env
   # Add your MONGODB_URI and GROQ_API_KEY in .env

4. Start server
   npm start

5. Open frontend
   Open frontend/index.html in browser
   Or visit http://localhost:3000

## What is done
- Paste 5-10 links and fetch content using Axios + Cheerio
- Generate research brief using Groq (Llama 3.3)
- Summary, key points with citations, conflicts, what-to-verify checklist
- Sources page showing what was used from each link
- Last 5 briefs saved in MongoDB
- Status page showing backend, database, LLM health
- Basic input validation and error handling

