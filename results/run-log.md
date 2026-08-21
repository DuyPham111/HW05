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
