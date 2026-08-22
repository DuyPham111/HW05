# Run Log — lượt endurance / soak

*(Cùng định dạng `results/run-log.md`. `tools/run-scenario.mjs Soak` tự append vào đây.)*

## Lượt Soak

| | |
|---|---|
| Test plan | `test-plans/23127183_Soak_20260821.jmx` |
| Bắt đầu / Kết thúc (local / epoch ms) | 19:37:46 → 19:49:52 22/8/2026 (epoch 1787402266873 → 1787402992453) |
| Thời lượng | 726s |
| Raw `.jtl` | `endurance/jtl/23127183_Soak_20260822-193744.jtl` |
| Dashboard | `endurance/html/soak` |
| Resource CSV | `endurance/resources/23127183_Soak_20260822-193744.resources.csv` |
| `products` khi đo | 20005 dòng |
| **RSS `node.exe` lúc bắt đầu** (đọc tay từ Task Manager) | 61,5 MB (63.012 K, PID 3728) |
| **RSS `node.exe` lúc kết thúc** (đọc sau khi dừng tải hoàn toàn, không có request nào tới backend) | **31,6 MB (32.316 K, PID 3728)** — thấp hơn cả mức bắt đầu (61,5 MB) và mức ổn định trong-lượt (~76 MB) |
| **Ảnh Task Manager** | `resource-monitor/screenshots/taskmgr-soak.png` (chụp lúc giây ~400) |
| Backend có bị restart giữa lượt không? | **Không** — bắt buộc; nếu có thì số liệu RSS vô nghĩa |
| Phép kiểm "dừng tải, đọc lại RSS" | RSS sau khi dừng = 31,6 MB, **thấp hơn** cả baseline ban đầu và mức trong-lượt → kết luận: không rò rỉ, RSS trong-lượt chỉ là bộ nhớ tạm được V8 GC thu hồi hoàn toàn khi hết tải (xem thêm `endurance-threshold.md` §5) |
| Ghi chú (máy có chạy việc gì khác không) | Không có tải nền nào khác trong lúc đo |

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
| **Anh Task Manager** | `resource-monitor/screenshots/taskmgr-soak.png` — chup luc giay ~400, dong ho 7:44 PM khop khoang chay |
| Reset lockout truoc luot | co, chay toi khi 0 tai khoan bi khoa |
| Cooldown truoc luot | ~4 phut (Spike ket thuc -> Soak bat dau) — xem `report/main-report.md` Sec 2.6 |
| Ghi chu | Khong co tai nen nao khac tren may trong luc do |
