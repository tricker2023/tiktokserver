const https = require("https");
const zlib = require("zlib");

const USER_AGENTS = [
  "Mozilla/5.0 (Linux; Android 10; K) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Mobile Safari/537.36",
  "Mozilla/5.0 (Linux; Android 11; Redmi Note 8) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/116.0.0.0 Mobile Safari/537.36",
  "Mozilla/5.0 (Linux; Android 12; SM-A325F) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/112.0.0.0 Mobile Safari/537.36",
  "Mozilla/5.0 (Linux; Android 13; Pixel 6) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Mobile Safari/537.36",
];

function randomUA() {
  return USER_AGENTS[Math.floor(Math.random() * USER_AGENTS.length)];
}

function fetchPage(url, redirectCount = 0) {
  return new Promise((resolve, reject) => {
    if (redirectCount > 5) return reject(new Error("Too many redirects"));

    const options = {
      headers: {
        "User-Agent": randomUA(),
        "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
        "Accept-Language": "vi-VN,vi;q=0.9",
        "Accept-Encoding": "gzip, deflate, br",
        "sec-fetch-dest": "document",
        "sec-fetch-mode": "navigate",
        "sec-fetch-site": "none",
        "sec-fetch-user": "?1",
        "upgrade-insecure-requests": "1",
        "Cache-Control": "no-cache",
      },
      timeout: 12000,
    };

    const req = https.get(url, options, (res) => {
      if ([301, 302, 303, 307, 308].includes(res.statusCode) && res.headers.location) {
        const newUrl = res.headers.location.startsWith("http")
          ? res.headers.location
          : `https://www.tiktok.com${res.headers.location}`;
        res.resume();
        return resolve(fetchPage(newUrl, redirectCount + 1));
      }

      let stream = res;
      const encoding = res.headers["content-encoding"] || "";
      if (encoding.includes("gzip")) {
        stream = res.pipe(zlib.createGunzip());
      } else if (encoding.includes("deflate")) {
        stream = res.pipe(zlib.createInflate());
      } else if (encoding.includes("br")) {
        stream = res.pipe(zlib.createBrotliDecompress());
      }

      const chunks = [];
      stream.on("data", (chunk) => chunks.push(chunk));
      stream.on("end", () => {
        const html = Buffer.concat(chunks).toString("utf-8");
        resolve({ statusCode: res.statusCode, html });
      });
      stream.on("error", reject);
    });

    req.on("timeout", () => { req.destroy(); reject(new Error("Request timed out")); });
    req.on("error", reject);
  });
}

module.exports = async (req, res) => {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET, OPTIONS");

  if (req.method === "OPTIONS") return res.status(200).end();

  const username = (req.query.input || "").trim().replace(/^@/, "");
  if (!username) {
    return res.status(400).json({ error: "Missing ?input=username" });
  }

  try {
    const url = `https://www.tiktok.com/@${username}`;
    const { statusCode, html } = await fetchPage(url);

    if (statusCode === 404) {
      return res.status(200).send(`<html><body>{"error":"User not found","statusCode":404}</body></html>`);
    }

    if (statusCode !== 200) {
      return res.status(502).json({ error: `TikTok returned HTTP ${statusCode}` });
    }

    const hasUserInfo = html.includes('"userInfo"') || html.includes('"uniqueId"');
    if (!hasUserInfo) {
      return res.status(503).json({ error: "No userInfo in response", hint: "Captcha or block" });
    }

    res.setHeader("Content-Type", "text/html; charset=utf-8");
    return res.status(200).send(html);

  } catch (err) {
    console.error("Error:", err.message);
    return res.status(503).json({ error: err.message });
  }
};
