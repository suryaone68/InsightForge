import axios from 'axios';
import * as cheerio from 'cheerio';
import pLimit from 'p-limit';

const limit = pLimit(3);
const TIMEOUT_MS = 15000;
const MAX_CONTENT = 3000;
const MIN_CONTENT = 200;

async function fetchSingle(url) {
  try {
    const response = await axios.get(url, {
      timeout: TIMEOUT_MS,
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
        'Accept-Language': 'en-US,en;q=0.5',
        'Connection': 'keep-alive',
      },
      maxRedirects: 5,
    });

    const contentType = response.headers['content-type'] || '';
    if (!contentType.includes('text/html') && !contentType.includes('text/plain')) {
      throw new Error(`Invalid content type: ${contentType}`);
    }

    const $ = cheerio.load(response.data);
    $('script, style, nav, footer, header, iframe, noscript').remove();

    const title = $('h1').first().text().trim()
      || $('title').text().trim()
      || 'Untitled';

    let content = $('article').text()
      || $('main').text()
      || $('.content, .post, .article').text()
      || $('body').text();

    content = content.replace(/\s+/g, ' ').trim().substring(0, MAX_CONTENT);

    if (content.length < MIN_CONTENT) {
      throw new Error('Page content too short');
    }

    content = content.replace(/<[^>]*>/g, '').trim();

    const snippet = $('meta[name="description"]').attr('content')
      || content.substring(0, 200);

    console.log(`✅ Fetched: ${url} — ${content.length} chars`);
    return { url, title: title.substring(0, 200), content, snippet: snippet.trim() };

  } catch (error) {
    console.log(`❌ Failed: ${url} — ${error.message}`);
    throw { url, error: error.message };
  }
}

async function fetchWithRetry(url) {
  try {
    return await fetchSingle(url);
  } catch (error) {
    console.log(`⚠️  Retrying: ${url}`);
    try {
      return await fetchSingle(url);
    } catch {
      throw error;
    }
  }
}

export async function fetchLinks(links) {
  console.log(`\n📥 Fetching ${links.length} links (max 3 parallel)...\n`);

  const results = await Promise.allSettled(
    links.map(link => limit(() => fetchWithRetry(link)))
  );

  const successful = results
    .filter(r => r.status === 'fulfilled')
    .map(r => r.value);

  const failed = results
    .filter(r => r.status === 'rejected')
    .map(r => r.reason);

  console.log(`📊 Done — Success: ${successful.length}, Failed: ${failed.length}\n`);

  return { successful, failed };
}
