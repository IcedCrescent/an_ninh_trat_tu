# Phần Mềm Ôn Tập: "Hội thi lực lượng tham gia bảo vệ an ninh, trật tự"

Ứng dụng web Single Page Application (SPA) giúp ôn tập trắc nghiệm kiến thức nghiệp vụ cho lực lượng bảo vệ an ninh, trật tự ở cơ sở. Dự án được phát triển bằng **Svelte 5 (sử dụng Runes)** và **FluentUI Web Components**, tối ưu hóa giao diện responsive trên di động (Mobile First).

---

## 📂 Cấu Trúc Dự Án

```text
├── .github/
│   └── workflows/
│       └── deploy.yml          # Quy trình tự động build & deploy lên GitHub Pages
├── bank/                       # Thư mục chứa ngân hàng câu hỏi gốc (.md)
│   ├── I.md                    # Chuyên đề I: Chính trị - Pháp luật
│   ├── II.md                   # Chuyên đề II: Hỗ trợ nắm tình hình ANTT...
│   ├── III.md                  # Chuyên đề III: Xây dựng phong trào toàn dân...
│   ├── IV.md                   # Chuyên đề IV: Phòng cháy, chữa cháy...
│   ├── V.md                    # Chuyên đề V: Quản lý hành chính về TTXH
│   └── VI.md                   # Chuyên đề VI: Vận động, giáo dục người vi phạm...
├── scripts/
│   └── parse_bank.js           # Script chuyển đổi câu hỏi từ Markdown sang JSON
├── src/
│   ├── assets/                 # Các tệp tĩnh hình ảnh/logo
│   ├── lib/
│   │   └── questions.json      # Dữ liệu ngân hàng câu hỏi sau khi parse (được dùng trong App)
│   ├── App.svelte              # Component giao diện chính (giao diện, logic trắc nghiệm và kết quả)
│   ├── app.css                 # File style tùy biến với chủ đề Navy-Dark cao cấp
│   └── main.ts                 # Điểm khởi chạy ứng dụng & Đăng ký FluentUI components
├── index.html                  # File HTML chính của ứng dụng
├── package.json                # Quản lý thư viện phụ thuộc và scripts chạy dự án
├── tsconfig.json               # Cấu hình TypeScript
└── vite.config.ts              # Cấu hình bundler Vite (đã bật relative base: './')
```

---

## 🛠️ Hướng Dẫn Cài Đặt và Chạy Local

### 1. Yêu cầu hệ thống
- Đã cài đặt **Node.js** (Khuyến nghị phiên bản v20 trở lên)
- Đã cài đặt **npm** (đi kèm Node.js)

### 2. Cài đặt các thư viện
Mở terminal tại thư mục gốc của dự án và chạy lệnh sau để cài đặt các package cần thiết:
```bash
npm install
```

### 3. Biên dịch ngân hàng câu hỏi
Chạy script parse để chuyển đổi các câu hỏi từ định dạng Markdown sang file JSON dữ liệu để ứng dụng web sử dụng:
```bash
node scripts/parse_bank.js
```
*Lưu ý: File JSON kết quả sẽ được ghi vào `src/lib/questions.json`.*

### 4. Chạy môi trường phát triển (Development)
Chạy lệnh sau để khởi động máy chủ thử nghiệm local:
```bash
npm run dev
```
Sau đó mở trình duyệt và truy cập: [http://localhost:5173](http://localhost:5173).

---

## 🚀 Hướng Dẫn Biên Dịch và Deploy Lên GitHub Pages

### 1. Deploy Tự Động Qua GitHub Actions (Khuyến Nghị)
Dự án đã được cấu hình sẵn quy trình CI/CD qua GitHub Actions tại tệp `.github/workflows/deploy.yml`. 

Để kích hoạt tính năng tự động deploy:
1. Đẩy mã nguồn của bạn lên một kho chứa (repository) trên **GitHub**.
2. Trên trang cấu hình repository GitHub của bạn:
   - Đi tới **Settings > Pages**.
   - Tại mục **Build and deployment > Source**, chọn **GitHub Actions**.
3. Mỗi khi bạn thực hiện `git push` lên nhánh `main`, GitHub Actions sẽ tự động biên dịch câu hỏi, đóng gói mã nguồn và triển khai ứng dụng lên GitHub Pages tại địa chỉ `https://<tên-tài-khoản>.github.io/<tên-repo>/`.

### 2. Kiểm tra bản build tĩnh ở máy local
Nếu bạn muốn build thử và chạy thử bản tĩnh ở máy cục bộ:
```bash
# Build đóng gói ứng dụng
npm run build

# Chạy preview bản đã đóng gói tĩnh
npm run preview
```
Bản build tĩnh sau khi đóng gói sẽ nằm trong thư mục `dist/`. Do đã được cấu hình `base: './'` trong `vite.config.ts`, thư mục này có thể tải trực tiếp lên bất kỳ hosting tĩnh nào (như GitHub Pages, Vercel, Netlify) mà không sợ lỗi đường dẫn tài nguyên.
