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
| **RSS `node.exe` lúc bắt đầu** (đọc tay từ Task Manager) | 61,5 MB (63.012 K, PID 3728) |
| **RSS `node.exe` lúc kết thúc** | (đọc lúc script vừa dừng — SV cần bổ sung, xem thêm phép kiểm 4 phút sau ở endurance-threshold.md §5) |
| **Ảnh Task Manager** | `resource-monitor/screenshots/taskmgr-soak.png` (chụp lúc giây ~400) |
| Backend có bị restart giữa lượt không? | **Không** — bắt buộc; nếu có thì số liệu RSS vô nghĩa |
| Phép kiểm "dừng tải, đợi 60s, đọc lại RSS" | RSS sau 60s = … MB → kết luận: … |
| Ghi chú (máy có chạy việc gì khác không) | |

## Luot Soak — 20260822-193744

| | |
|---|---|
| Test plan | `test-plans/23127183_Soak_20260821.jmx` |
| Bat dau | 19:37:46 22/8/2026 (epoch 1787402266873) |
| Ket thuc | 19:49:52 22/8/2026 (epoch 1787402992453) |
| Thoi luong | 726s |
| Raw `.jtl` | `endurance/jtl/23127183_Soak_20260822-193744.jtl` |
| `jmeter.log` | `endurance/jtl/23127183_Soak_20260822-193744.jmeter.log` |
| Dashboard | `endurance/html/soak` |
| Resource CSV | `endurance/resources/23127183_Soak_20260822-193744.resources.csv` |
| `products` khi do | 20005 dong |
| JMeter exit code | 0 |
| **Anh Task Manager** | `resource-monitor/screenshots/taskmgr-soak.png` — *(dien gio chup)* |
| Reset lockout truoc luot | co, chay toi khi 0 tai khoan bi khoa |
| Cooldown truoc luot | *(dien so giay)* |
| Ghi chu | *(tai nen may, viec khac dang chay...)* |
