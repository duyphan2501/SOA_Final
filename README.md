# Hướng dẫn cấu hình demo project với Docker compose

# Yêu cầu

Trước khi chạy project cần cài đặt:

* Docker
* Docker Compose

Kiểm tra:

```bash
docker --version
docker compose version
```

---

# Cấu trúc project

```
project
├── client
├── server
├── scripts
├── docker-compose.yml
├── .env
├── .gitignore
├── nginx.conf
└── README.md
```

---

# Chạy project bằng Docker

## 1. Clone project

```bash
git clone https://github.com/duyphan2501/microservice_social_network.git
```

```bash
cd microservice_social_network
```

---

## 2. Cấu hình môi trường

Đổi tên file `.env.example` thành `.env`.
```bash
cp .env.example .env
```

Điều chỉnh nếu cần thiết. Ví dụ

```
Nếu muốn dùng chức năng đăng ký tài khoản, reset password
EMAIL_USERNAME=
EMAIL_APP_PASSWORD=

Nếu muốn gửi ảnh, đăng bài (chứa ảnh/video...)
CLOUDINARY_API_KEY= 
CLOUDINARY_SECRET_KEY= 
CLOUDINARY_NAME= 
```

---

## 3. Build Docker Image

```bash
docker compose build
```

---

## 4. Chạy container

```bash
docker compose up
```

Hoặc chạy nền:

```bash
docker compose up -d
```

---

# Truy cập ứng dụng
Sau quá trình chạy container hoàn tất, mở trình duyệt:
```
http://localhost:5173
```

---

# Truy cập MySQL

```bash
docker exec -it mysqldb mysql -u root -p
```
Enter Password: 123456

Thông tin database:
* Xem trong scripts hoặc server/sql
* Tài khoản demo:
    - username: jane_smith
    - username: john_doe
* Mật khẩu các account: 1234


# Dừng project

```bash
docker compose down
```

---

# Xóa container + volume

```bash
docker compose down -v
```

# Troubleshooting

## Port đã được sử dụng

Nếu gặp lỗi:

```
port is already allocated
```

Hãy đổi port trong `docker-compose.yml`.

---

## Lỗi build image

Thử build lại:

```bash
docker compose build --no-cache
```
