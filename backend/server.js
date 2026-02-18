import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import path from 'path';
import { fileURLToPath } from 'url';
import { fetchLinks } from './src/fetch.js';
import { generateBrief } from './src/llm.js';
import { connect, saveBrief, getRecent, getDbStatus } from './src/database.js';

const app = express();
const __dirname = path.dirname(fileURLToPath(import.meta.url));

app.use(cors({
  origin: '*'
}));
app.use(express.json());
app.use(express.static(path.join(__dirname, './frontend')));

connect();

function validateLinks(links) {
  if (!Array.isArray(links)) return 'Links must be an array';
  if (links.length < 5 || links.length > 10) return 'Provide 5-10 links';
  for (const link of links) {
    try {
      new URL(link);
    } catch {
      return `Invalid URL: ${link}`;
    }
  }
  return null;
}

// Root
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, './frontend/index.html'));
});

app.get('/api', (req, res) => {
  res.json({
    name: 'InsightForge API',
    version: '1.0.0',
    endpoints: {
      generate: 'POST /api/generate',
      briefs: 'GET /api/briefs',
      status: 'GET /api/status'
    }
  });
});

// Generate Brief
app.post('/api/generate', async (req, res) => {
  const { links } = req.body;

  const validationError = validateLinks(links);
  if (validationError) {
    return res.status(400).json({ success: false, message: validationError });
  }

  console.log(`\n🚀 New request — ${links.length} links\n`);

  try {
    const { successful, failed } = await fetchLinks(links);

    if (successful.length < 3) {
      return res.status(400).json({
        success: false,
        message: `Only ${successful.length} links worked. Need at least 3.`,
        failed
      });
    }

    const brief = await generateBrief(successful);

    const sources = links.map(link => {
      const found = successful.find(s => s.url === link);
      return found
        ? { url: link, title: found.title, used: true }
        : { url: link, title: 'Failed to fetch', used: false };
    });

    const data = {
      ...brief,
      sources,
      stats: {
        total: links.length,
        successful: successful.length,
        failed: failed.length
      }
    };

    await saveBrief(data);

    res.json({ success: true, brief: data });

  } catch (error) {
    console.error('❌ Error:', error.message);
    res.status(500).json({ success: false, message: error.message });
  }
});

// Get last 5 briefs
app.get('/api/briefs', async (req, res) => {
  try {
    const briefs = await getRecent();
    res.json({ success: true, briefs });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// Status
app.get('/api/status', (req, res) => {
  res.json({
    status: 'healthy',
    database: getDbStatus(),
    llm: {
      provider: 'Groq',
      model: 'llama-3.3-70b-versatile',
      status: process.env.GROQ_API_KEY ? 'configured' : 'missing API key'
    },
    uptime: `${Math.floor(process.uptime())}s`
  });
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`\n⚡ InsightForge running on http://localhost:${PORT}\n`);
});
