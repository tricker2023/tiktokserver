# TikTok User Info API

Server proxy để lấy thông tin TikTok user, dùng cho bot Telegram tracking.

## Endpoint

```
GET /tiktok?input=<username>
```

## Cách deploy lên Vercel (miễn phí)

### Bước 1: Tạo tài khoản Vercel
- Vào https://vercel.com → Sign up bằng GitHub (miễn phí)

### Bước 2: Upload code
- Vào https://vercel.com/new
- Chọn "Deploy from GitHub" hoặc dùng Vercel CLI

### Bước 3 (dễ nhất - dùng Vercel CLI):
```bash
npm install -g vercel
vercel login
vercel --prod
```

### Bước 4: Cập nhật bot
Sau khi deploy xong, Vercel sẽ cho URL dạng:
  https://tiktok-user-info-xxx.vercel.app

Mở bot.py, tìm dòng:
  self.base_url = "https://info-tiktok-user.vercel.app/tiktok?input="

Đổi thành URL mới của bạn:
  self.base_url = "https://<tên-project-của-bạn>.vercel.app/tiktok?input="
