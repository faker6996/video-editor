# Video Editor (Next.js) – Pivot từ OCR

![Version](https://img.shields.io/badge/version-0.1.0-blue.svg)
![Next.js](https://img.shields.io/badge/Next.js-15.4.5-black.svg)
![TypeScript](https://img.shields.io/badge/TypeScript-5-blue.svg)
![React](https://img.shields.io/badge/React-19.0.0-blue.svg)
![License](https://img.shields.io/badge/license-Private-red.svg)

Dự án đã được dọn dẹp để chuyển hướng sang một trang web chỉnh sửa video. Phần xác thực (auth) vẫn được giữ nguyên, cùng hạ tầng i18n và bộ UI. Tất cả các trang/chức năng OCR và quản lý tác vụ cũ đã được loại bỏ.

## 💡 Trạng thái hiện tại

- **Auth + SSO**: Đăng ký/đăng nhập, refresh token, SSO Google/Facebook vẫn hoạt động.
- **i18n**: Đa ngôn ngữ (en, vi) với `next-intl` và định tuyến theo locale.
- **UI cơ bản**: Bộ component Tailwind tuỳ biến vẫn còn để tái sử dụng.
- **Trang Editor**: Đã tạo trang placeholder `/:locale/editor` để bắt đầu tính năng chỉnh sửa video.

## 🛠 Công nghệ

- **Next.js** App Router 15.4.5, **React** 19, **TypeScript** 5
- **Tailwind CSS** 4.x, **Lucide React**, **Floating UI**
- **API Routes** (app/api/*) viết bằng TypeScript
- **PostgreSQL** (kết nối qua `pg` Pool) trong `lib/db.ts`
- **Redis** (ioredis) cho cache/session tiện ích
- **JWT** (jsonwebtoken), **bcrypt** cho mật khẩu
- **Email**: Nodemailer

## 🚀 Bắt đầu nhanh

### Yêu cầu
- Node.js 18+ và npm
- PostgreSQL và Redis đang chạy (cục bộ hoặc từ xa)
- Docker (tuỳ chọn) nếu muốn chạy bằng Compose

### Cài đặt
```bash
git clone <repository-url>
cd ocr_editng
npm install
```

Tạo file `.env.local` (tham khảo các biến bên dưới) và cập nhật giá trị phù hợp.

Chạy dev:
```bash
npm run dev
# hoặc (Turbopack)
npm run dev_v2
```

Build và chạy production cục bộ:
```bash
npm run build
npm run start
```

## 🔑 Biến môi trường chính

Database (PostgreSQL):
- `DATABASE_URL` ví dụ: `postgresql://user:pass@localhost:5432/ocr_editing`

Redis:
- `REDIS_HOST` (ví dụ `localhost`)
- `REDIS_PORT` (mặc định `6379`)
- `REDIS_PASSWORD` (nếu có)

Bảo mật/JWT:
- `JWT_SECRET` (bắt buộc)
- `JWT_ISSUER` (tuỳ chọn)
- `JWT_AUDIENCE` (tuỳ chọn)

Email (tuỳ chọn):
- `SMTP_HOST`, `SMTP_USER`, `SMTP_PASS` (port cố định 587 trong code)

Cấu hình ứng dụng/tải lên:
- `FRONTEND_URL` (ví dụ `http://localhost:3000`)
- `UPLOAD_HOST` (host phục vụ file tĩnh, ví dụ `http://localhost:3000`)
- `UPLOAD_DIR` (thư mục lưu file upload, mặc định `./uploads`)

Dịch vụ AI OCR (bên ngoài):
- `OCR_AI_SERVICE_URL` (mặc định `http://ai-service:8000/process-ocr`)
- `OCR_AI_SERVICE_TOKEN` (tuỳ chọn Bearer token)

Lưu ý: File `.env.example` hiện có chuỗi MySQL chỉ mang tính ví dụ; project dùng PostgreSQL thực tế thông qua `lib/db.ts`.

## 📂 Cấu trúc thư mục chính (đã tinh gọn)

```
app/
  [locale]/                # layout, redirect, pages
    (pages)/editor/        # trang Editor (placeholder)
    (pages)/login|register # trang xác thực
  api/
    auth/                  # login, register, refresh, me, logout, sso_*
components/
  ui/                      # Button, Modal, ... (tái sử dụng)
  login/                   # khối giao diện đăng nhập/đăng ký
contexts/                  # AuthContext, ThemeContext
i18n/                      # next-intl config + locales (en/vi)
lib/                       # db.ts, utils, middlewares, models, ...
```

## 🔧 Scripts (npm run ...)

- `dev`: chạy server dev kèm `NODE_OPTIONS=--inspect`
- `dev_v2`: chạy dev với Turbopack
- `build`: build production
- `start`: chạy production
- `lint`: lint (nếu cấu hình ESLint có sẵn)
- `docker:up`: chạy dịch vụ trong `docker-compose.prod.yml` (service `ocr-editing`)
- `docker:down`: dừng dịch vụ Docker
- `docker:restart`: restart dịch vụ Docker

## 🌐 API hiện có (app/api)

- `POST /api/auth/login`, `POST /api/auth/register`, `POST /api/auth/refresh`, `GET /api/auth/me`, `POST /api/auth/logout`
- `GET|POST /api/auth/sso_google`, `GET|POST /api/auth/sso_facebook` (cần `FRONTEND_URL`, client id/secret tương ứng)

Các API OCR/upload và tác vụ cũ đã được gỡ bỏ trong lần dọn dẹp này.

## 🐳 Docker

- Compose file: `docker-compose.prod.yml` (chỉ container ứng dụng `ocr-editing`).
- Map port: `${PORT:-3000}:3000` và mount `./public/uploads -> /app/public/uploads`, `./logs -> /app/logs`.
- Yêu cầu: PostgreSQL/Redis chạy bên ngoài và `.env.local` được cung cấp cho container.
- Healthcheck: gọi `GET /api/health` (nếu không có sẽ fallback sang `/`).

Chạy nhanh:
```bash
npm run docker:up     # build + up service ocr-editing
npm run docker:down   # dừng container
```

## 🌍 i18n

- Locales: `en`, `vi` sử dụng `next-intl`.
- Định tuyến theo locale: route dạng `/:locale/...` với layout riêng.

## 📝 Ghi chú

- Repo không kèm dịch vụ PostgreSQL/Redis trong Compose. Hãy tự chạy/cấu hình và trỏ `DATABASE_URL`, `REDIS_*` tương ứng.
- Một số tên hiển thị (ví dụ `AppConfig.APP_NAME`) có thể chưa cập nhật đồng nhất; không ảnh hưởng chức năng.

## Bản quyền

Mã nguồn nội bộ, không phổ biến công khai.

## 🔴 Realtime (Socket.IO)

- Gateway: `realtime/server.cjs` (chạy `npm run realtime`), hoặc bật service `realtime` trong `docker-compose.prod.yml`.
- Env:
  - `WS_URL`, `NEXT_PUBLIC_WS_URL`: ví dụ `http://192.168.210.100:4000`
  - `WS_PORT`: 4000
  - `WS_API_KEY`: API key cho REST `/emit` (tuỳ chọn)
- Sự kiện:
  - `task:status` payload: `{ taskId, status }`
  - `task:result` payload: `{ taskId, resultId }`
