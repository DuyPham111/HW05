# Run Log — các lượt chạy (§11 đối chiếu mốc thời gian)

> `tools/run-scenario.mjs` tự **append** block vào file này sau mỗi lượt.
> Việc của bạn: điền dòng "Ảnh Task Manager" và ghi lại thủ tục reset lockout + cooldown.
> Mốc giờ ở đây phải khớp với `timeStamp` trong `.jtl` và với đồng hồ Windows trong ảnh chụp.

---

## Lượt 1 — Load

| | |
|---|---|
| Test plan | |
| Bắt đầu (local / epoch ms) | |
| Kết thúc (local / epoch ms) | |
| Thời lượng | |
| Raw `.jtl` | |
| `jmeter.log` | |
| Dashboard | |
| Resource CSV | |
| `products` khi đo | … dòng |
| **Ảnh Task Manager** | `resource-monitor/screenshots/taskmgr-load.png` (chụp lúc …) |
| Reset lockout trước lượt | lúc … — kết quả: … |
| Cooldown trước lượt | … giây |
| Ghi chú (tải nền máy, việc khác đang chạy) | |

---

## Lượt 2 — Stress

| | |
|---|---|
| Test plan | |
| Bắt đầu / Kết thúc | |
| Raw `.jtl` | |
| Dashboard | |
| Resource CSV | |
| **Ảnh Task Manager** | `taskmgr-stress.png` (chụp lúc bậc 200 VU, giây ~200–230) |
| Reset lockout / cooldown | |
| Ghi chú | |

---

## Lượt 3 — Spike

| | |
|---|---|
| Test plan | |
| Bắt đầu / Kết thúc | |
| Raw `.jtl` | |
| Dashboard | |
| Resource CSV | |
| **Ảnh Task Manager** | `taskmgr-spike.png` (chụp trong cửa sổ sốc, giây ~62–90) |
| Ảnh View Results Tree | `vrt-spike-401.png` |
| Reset lockout / cooldown | |
| Ghi chú | |

## Luot Load — 20260822-181312 — ĐÃ XOÁ

*(Lượt chạy qua kênh công cụ Claude, không mở được cửa sổ terminal trên màn hình sinh viên nên ảnh chụp không hợp lệ (chỉ thấy Task Manager, không thấy tool đang chạy). Đã xoá `.jtl`/`.jmeter.log`/`.resources.csv`, chạy lại lượt bên dưới do chính sinh viên tự chạy trong PowerShell.)*

## Luot Load — 20260822-183102 ✅ CHÍNH THỨC

| | |
|---|---|
| Test plan | `test-plans/23127183_Load_20260821.jmx` |
| Bat dau | 18:31:04 22/8/2026 (epoch 1787398264544) |
| Ket thuc | 18:37:09 22/8/2026 (epoch 1787398629619) |
| Thoi luong | 365s |
| Raw `.jtl` | `results/jtl/23127183_Load_20260822-183102.jtl` (3282 sample, 0% loi) |
| `jmeter.log` | `results/jtl/23127183_Load_20260822-183102.jmeter.log` |
| Dashboard | `results/html/load` |
| Resource CSV | `results/resources/23127183_Load_20260822-183102.resources.csv` |
| `products` khi do | 20005 dong |
| JMeter exit code | 0 |
| **Anh Task Manager** | `resource-monitor/screenshots/taskmgr-load.png` — chup luc ~18:34 PM, dung giay thu 180, thay ca PowerShell (dang chay JMeter) va Task Manager (node.exe PID 3728, java.exe PID 2292) trong CUNG mot anh |
| Reset lockout truoc luot | co, chay toi khi 0 tai khoan bi khoa |
| Cooldown truoc luot | ~12 phut (tu 18:19 luot truoc den 18:31) — du xa |
| Ghi chu | Sinh vien tu chay `node tools/run-scenario.mjs Load` trong PowerShell rieng, dung theo huong dan docs/HUONG-DAN-VIEC-TU-LAM.md muc B |
