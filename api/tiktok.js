const https = require("https");

function httpsGet(url, headers) {
  return new Promise((resolve, reject) => {
    const req = https.get(url, { headers, timeout: 12000 }, (res) => {
      const chunks = [];
      res.on("data", (c) => chunks.push(c));
      res.on("end", () => resolve({ status: res.statusCode, body: Buffer.concat(chunks).toString("utf-8") }));
      res.on("error", reject);
    });
    req.on("timeout", () => { req.destroy(); reject(new Error("timeout")); });
    req.on("error", reject);
  });
}

module.exports = async (req, res) => {
  res.setHeader("Access-Control-Allow-Origin", "*");
  if (req.method === "OPTIONS") return res.status(200).end();

  const username = (req.query.input || "").trim().replace(/^@/, "");
  if (!username) return res.status(400).json({ error: "Missing ?input=username" });

  try {
    const apiUrl = `https://www.tiktok.com/api/user/detail/?uniqueId=${encodeURIComponent(username)}&aid=1988&app_language=vi&device_platform=web_pc`;

    const { status, body } = await httpsGet(apiUrl, {
      "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36",
      "Accept": "application/json, text/plain, */*",
      "Accept-Language": "vi-VN,vi;q=0.9",
      "Referer": "https://www.tiktok.com/",
      "sec-fetch-dest": "empty",
      "sec-fetch-mode": "cors",
      "sec-fetch-site": "same-origin",
    });

    if (status !== 200) return res.status(502).json({ error: `TikTok API returned HTTP ${status}` });

    let data;
    try { data = JSON.parse(body); } catch { return res.status(503).json({ error: "Invalid JSON from TikTok" }); }

    const statusCode = data.statusCode || data.status_code;
    if (statusCode === 10202 || statusCode === 10221) return res.status(200).json({ status: "DIE", statusCode });
    if (statusCode !== 0) return res.status(200).json({ status: "UNKNOWN", statusCode, msg: data.statusMsg });

    const user = data.userInfo?.user;
    const stats = data.userInfo?.stats;
    if (!user) return res.status(200).json({ status: "DIE", reason: "no user in response" });

    return res.status(200).json({
      status: "LIVE",
      id: user.id,
      username: user.uniqueId,
      nickname: user.nickname,
      avatar: user.avatarLarger || user.avatarMedium || user.avatarThumb,
      private: user.privateAccount || false,
      followers: stats?.followerCount ?? 0,
      following: stats?.followingCount ?? 0,
      likes: stats?.heartCount ?? 0,
      videos: stats?.videoCount ?? 0,
      friends: stats?.friendCount ?? 0,
    });

  } catch (err) {
    return res.status(503).json({ error: err.message });
  }
};
```

→ **Commit changes**

---

## 2. Tải `bot.py` mới về thay file cũ

Sau khi Vercel deploy xong (~1 phút), test link:
```
https://tiktokserver.vercel.app/tiktok?input=charlidamelio
