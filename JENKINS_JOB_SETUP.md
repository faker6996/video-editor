# 🚀 Jenkins Job Setup - OCR Editing System (Production Only)

## 🎯 **Mục tiêu:** 
Jenkins tự động pull code từ GitHub và deploy ứng dụng OCR production. Database bạn tự quản lý riêng.

---

## 📋 **BƯỚC 1: Chuẩn bị Production Environment File**

### **Tại sao cần Environment File?**
- Production cần config database, URL, secrets riêng biệt
- Jenkins cần biết config để deploy đúng environment
- Bảo mật: không hard-code thông tin nhạy cảm vào code

### **File cần edit trước khi upload:**

**📁 `.env.prod` (Production):**
```bash
# Edit các thông tin này cho đúng với hệ thống của bạn:
DATABASE_URL=postgresql://user:password@192.168.210.100:5432/ocr_editing
POSTGRES_PASSWORD=your_production_password  
REDIS_PASSWORD=your_redis_password
FRONTEND_URL=http://192.168.210.100:3000
UPLOAD_HOST=http://192.168.210.100:3000
JWT_SECRET=your-production-jwt-secret
SESSION_SECRET=your-production-session-secret
```

**⚠️ QUAN TRỌNG:** Edit các thông tin database, password thật của bạn vào file này trước khi upload!

---

## 🔑 **BƯỚC 2: Upload Environment File vào Jenkins**

### **2.1 Vào Jenkins Credentials:**
1. Mở Jenkins Dashboard
2. Click **"Manage Jenkins"**
3. Click **"Credentials"** 
4. Click **"Global credentials (unrestricted)"**
5. Click **"Add Credentials"**

### **2.2 Upload Production Environment:**
- **Kind**: `Secret file` 
- **File**: Click "Choose file" → Upload `.env.prod`
- **ID**: `ocr-env-prod`
- **Description**: `OCR Production Environment`
- Click **"Create"**

### **2.3 Kiểm tra:**
Bạn sẽ thấy credential mới trong danh sách:
```
✅ ocr-env-prod (Secret file)
```

---

## 🏗️ **BƯỚC 3: Tạo Jenkins Pipeline Job**

### **3.1 Tạo Job mới:**
1. Jenkins Dashboard → Click **"New Item"**
2. **Item name**: `OCR-Editing-Deploy`
3. **Type**: Select **"Pipeline"**
4. Click **"OK"**

### **3.2 Cấu hình Pipeline:**

**📋 General Tab:**
- **Description**: `OCR Editing System - Auto Deploy from GitHub`

**⚙️ Build Triggers:**
- ✅ Tick **"GitHub hook trigger for GITScm polling"**
- ✅ Tick **"Poll SCM"**
- **Schedule**: `H/5 * * * *` (kiểm tra mỗi 5 phút)

**📜 Pipeline Configuration:**
- **Definition**: `Pipeline script from SCM`
- **SCM**: `Git`
- **Repository URL**: `git@github.com:faker6996/ocr_editing.git`
- **Credentials**: `github-private-key` (credential SSH có sẵn)
- **Branch Specifier**: `*/main`
- **Script Path**: `JenkinsFile`

### **3.3 Save Configuration:**
Click **"Save"**

---

## 🚀 **BƯỚC 4: Test Deployment**

### **4.1 Test Production Deploy:**
1. Vào job **"OCR-Editing-Deploy"**
2. Click **"Build with Parameters"**
3. Chọn parameters:
   - **DEPLOY_ENV**: `prod` (chỉ có production)
   - **DEPLOY_TYPE**: `pm2`
   - **SKIP_TESTS**: `false`
4. Click **"Build"**

### **4.2 Theo dõi build:**
- Click vào build number (VD: #1)
- Click **"Console Output"** để xem log
- Chờ build hoàn thành (màu xanh = thành công)

### **4.3 Kiểm tra deployment:**
- Truy cập: `http://192.168.210.100:3000` (production)
- Kiểm tra upload ảnh có hoạt động không

---

## 📊 **Deploy Parameters Giải thích:**

| Parameter | Options | Khi nào dùng |
|-----------|---------|---------------|
| **DEPLOY_ENV** | `prod` = Production | Chỉ có production environment |
| **DEPLOY_TYPE** | `pm2` = Process Manager<br>`docker` = Container | PM2 đơn giản hơn, Docker cô lập hơn |
| **SKIP_TESTS** | `false` = Chạy tests<br>`true` = Bỏ qua tests | Hotfix urgent thì skip, bình thường chạy tests |

---

## 🔄 **Automatic Deployment:**

### **Khi nào tự động deploy?**
- Push code lên GitHub branch `main` → Jenkins tự động build
- Mỗi 5 phút Jenkins check GitHub có thay đổi không
- Webhook từ GitHub trigger ngay lập tức (nếu setup)

### **Manual Deploy:**
- Vào Jenkins job → Click **"Build with Parameters"**
- Chọn environment và click Build

---

## 📂 **Cấu trúc thư mục trên server:**

```
/opt/
└── ocr-editing/             ← Production deployment
    ├── .env.local           ← Copy từ .env.prod  
    ├── public/uploads/      ← Upload images
    └── ...
```

---

## 🎯 **Pipeline Workflow (Luồng hoạt động):**

```
1. 📥 GitHub Push → Webhook/Polling trigger
2. 🔄 Jenkins pull latest code từ main branch  
3. 📋 Copy .env.prod file vào workspace
4. 📦 npm install - Cài đặt dependencies
5. 🧪 npm run lint - Chạy tests (nếu không skip)
6. 🏗️ npm run build - Build Next.js application
7. 🚀 Deploy với PM2 hoặc Docker
8. ✅ Health check - Kiểm tra app có chạy không
9. 📱 Discord notification - Thông báo kết quả
```

---

## 🛠️ **Troubleshooting:**

### **Build failed?**
1. Check Console Output trong Jenkins build
2. Thường là lỗi: dependencies, environment variables, hoặc code syntax

### **Deploy failed?**
1. Kiểm tra server có đủ disk space không
2. Port 3000/3001 có bị chiếm không
3. PM2 process có conflict không

### **App không chạy?**
1. Kiểm tra .env file có đúng database connection không
2. Test database connection thủ công
3. Check PM2 logs: `pm2 logs ocr-editing`

---

## 🎉 **Kết quả sau khi setup:**

✅ **Auto CI/CD**: Push code → Tự động deploy<br>
✅ **Production Ready**: Chỉ deploy production environment<br>
✅ **Flexible Deploy**: PM2 hoặc Docker<br>
✅ **Health Monitoring**: Tự động kiểm tra app<br>
✅ **Easy Rollback**: Deploy version cũ nếu cần<br>
✅ **Database Independent**: Jenkins không touch database<br>

**Jenkins chỉ lo deploy app - Database bạn quản lý riêng! 🚀**