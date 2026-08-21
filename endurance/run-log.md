# Run Log — lượt endurance / soak

*(Cùng định dạng `results/run-log.md`. `tools/run-scenario.mjs Soak` tự append vào đây.)*

## Lượt Soak

| | |
|---|---|
| Test plan | |
| Bắt đầu / Kết thúc (local / epoch ms) | |
| Thời lượng | 720s |
| Raw `.jtl` | |
| Dashboard | |
| Resource CSV | |
| `products` khi đo | … dòng |
| **RSS `node.exe` lúc bắt đầu** (đọc tay từ Task Manager) | … MB |
| **RSS `node.exe` lúc kết thúc** | … MB |
| **Ảnh Task Manager** | `resource-monitor/screenshots/taskmgr-soak.png` (chụp lúc giây ~400) |
| Backend có bị restart giữa lượt không? | **Không** — bắt buộc; nếu có thì số liệu RSS vô nghĩa |
| Phép kiểm "dừng tải, đợi 60s, đọc lại RSS" | RSS sau 60s = … MB → kết luận: … |
| Ghi chú (máy có chạy việc gì khác không) | |
