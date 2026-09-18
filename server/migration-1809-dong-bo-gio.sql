-- Chỉ chạy sau khi thầy duyệt triển khai. Ca cũ mặc định giữ giờ riêng.
ALTER TABLE ca ADD COLUMN dong_bo_gio INTEGER NOT NULL DEFAULT 0 CHECK (dong_bo_gio IN (0, 1));
