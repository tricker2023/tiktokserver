const fetch = require("node-fetch");

// Mobile User-Agents — TikTok trả về HTML có nhúng JSON userInfo
const USER_AGENTS = [
  "Mozilla/5.0 (Linux; Android 10; K) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Mobile Safari/537.36",
  "Mozilla/5.0 (Linux; Android 11; Redmi Note 8) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/116.0.0.0 Mobile Safari/537.36",
  "Mozilla/5.0 (Linux; Android 12; SM-A325F) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/112.0.0.0 Mobile Safari/537.36",
  "Mozilla/5.0 (Linux; Android 13; Pixel 6) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Mobile Safari/537.36",
  "Mozilla/5.0 (Linux; Android 9; SAMSUNG SM-G960F) AppleWebKit/537.36 (KHTML, like Gecko) SamsungBrowser/14.0 Chrome/87.0.4280.141 Mobile Safari/537.36",
];

function randomUA() {
  return USER_AGENTS[Math.floor(Math.random() * USER_AGENTS.length)];
}

async function fetchTikTokPage(username) {
  const url = `https://www.tiktok.com/@${username}`;
  const ua = randomUA();

  const headers = {
    "User-Agent": ua,
    "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
    "Accept-Language": "vi-VN,vi;q=0.9",
    "Accept-Encoding": "gzip, deflate, br",
    "sec-fetch-dest": "document",
    "sec-fetch-mode": "navigate",
    "sec-fetch-site": "none",
    "sec-fetch-user": "?1",
    "upgrade-insecure-requests": "1",
    "Cache-Control": "no-cache",
  };

  const resp = await fetch(url, {
    headers,
    redirect: "follow",
  });

  const html = await resp.text();
  return { status: resp.status, html };
}

module.exports = async (req, res) => {
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

    const hasUserInfo = html.includes('"userInfo"') || html.includes('"uniqueId"');

    if (!hasUserInfo) {
      return res.status(503).json({
        error: "TikTok returned HTML without userInfo data",
        hint: "Try again later"
      });
    }

    res.setHeader("Content-Type", "text/html; charset=utf-8");
    return res.status(200).send(html);

  } catch (err) {
    console.error("Fetch error:", err.message);
    return res.status(503).json({ error: err.message });
  }
};
```

**4.** Nhấn **"Commit changes"** → Vercel tự deploy lại trong ~1 phút

**5.** Sau khi deploy xong, mở trình duyệt vào:
```
https://tiktokserver.vercel.app/tiktok?input=charlidamelio
