const fetch = require("node-fetch");

// Rotate User-Agents để tránh bị block
const USER_AGENTS = [
  "Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.0 Mobile/15E148 Safari/604.1",
  "Mozilla/5.0 (Linux; Android 13; Pixel 7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/116.0.0.0 Mobile Safari/537.36",
  "Mozilla/5.0 (iPhone; CPU iPhone OS 16_6 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/16.6 Mobile/15E148 Safari/604.1",
  "Mozilla/5.0 (Linux; Android 12; SM-G991B) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/112.0.0.0 Mobile Safari/537.36",
  "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36",
];

function randomUA() {
  return USER_AGENTS[Math.floor(Math.random() * USER_AGENTS.length)];
}

async function fetchTikTokPage(username) {
  const url = `https://www.tiktok.com/@${username}`;
  const headers = {
    "User-Agent": randomUA(),
    "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,*/*;q=0.8",
    "Accept-Language": "vi-VN,vi;q=0.9,en-US;q=0.8,en;q=0.7",
    "Accept-Encoding": "gzip, deflate, br",
    "Referer": "https://www.tiktok.com/",
    "sec-fetch-dest": "document",
    "sec-fetch-mode": "navigate",
    "sec-fetch-site": "same-origin",
    "sec-fetch-user": "?1",
    "upgrade-insecure-requests": "1",
    "Cache-Control": "no-cache",
    "Connection": "keep-alive",
  };

  const resp = await fetch(url, {
    headers,
    redirect: "follow",
    timeout: 12000,
  });

  return { status: resp.status, html: await resp.text() };
}

module.exports = async (req, res) => {
  // CORS
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET, OPTIONS");
  if (req.method === "OPTIONS") {
    return res.status(200).end();
  }

  const username = (req.query.input || "").trim().replace(/^@/, "");
  if (!username) {
    return res.status(400).json({ error: "Missing ?input=username" });
  }

  try {
    const { status, html } = await fetchTikTokPage(username);

    if (status === 404) {
      return res.status(200).send(
        `<html><body>{"error":"User not found","statusCode":404}</body></html>`
      );
    }

    if (status !== 200) {
      return res.status(502).json({ error: `TikTok returned HTTP ${status}` });
    }

    // Trả thẳng HTML về để bot parse (giống server cũ)
    res.setHeader("Content-Type", "text/html; charset=utf-8");
    return res.status(200).send(html);

  } catch (err) {
    console.error("Fetch error:", err.message);
    return res.status(503).json({ error: err.message });
  }
};

