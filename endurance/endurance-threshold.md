# Endurance Threshold — 23127183

> Hướng dẫn: [`docs/08-ENDURANCE-THRESHOLD.md`](../docs/08-ENDURANCE-THRESHOLD.md)
> **Mục 1 phải viết và commit TRƯỚC khi chạy lượt soak.** Mục 3 do `npm run drift` sinh ra — đừng sửa tay.

---

## 1. Định nghĩa "ổn định" (viết TRƯỚC khi chạy — commit `…`)

Một mức tải được gọi là **ổn định** khi trong suốt 12 phút chạy liên tục, thỏa **cả bốn**:

1. **Error rate < 1%**, và mọi lỗi còn lại giải thích được bằng thiết kế (401/403 của bước 7), không có 500 hay timeout.
2. **p95 không trôi quá 20%** giữa cửa sổ 5 phút đầu và 5 phút cuối.
3. **RSS của `node.exe` không tăng quá 20%** giữa phút 2 và phút cuối.
4. **CPU đỉnh của `java.exe` < CPU đỉnh của `node.exe`** — nếu ngược lại thì con số đo được là trần của load generator, không phải của SUT.

## 2. Cấu hình lượt soak

| | |
|---|---|
| Test plan | `test-plans/23127183_Soak_….jmx` |
| VU / ramp-up | |
| Think-time | |
| Thời lượng | 720s (12 phút) |
| Dữ liệu khi đo | `products` = … dòng · `users` = 402 |
| Bắt đầu / kết thúc | |
| Raw log | `endurance/jtl/…` |
| Resource log | `endurance/resources/…` |
| Ảnh Task Manager | `resource-monitor/screenshots/taskmgr-soak.png` |
| RSS `node.exe` lúc bắt đầu (đọc tay từ Task Manager) | … MB |

## 3. Số liệu đo được — `npm run drift` SINH RA, đừng sửa tay

*(bảng theo từng phút: sample · RPS · error% · p50 · p95 · p99 · max · RSS node — kèm kết quả PASS/FAIL của 4 tiêu chí)*

## 4. Kết luận — ngưỡng chịu tải của phần cứng này

| Chỉ số | Giá trị đo được |
|---|---|
| **Max stable RPS** | |
| p95 tại mức đó | |
| Error rate | |
| **Memory ceiling** (RSS `node.exe`) | |
| Độ trôi p95 (5 phút đầu → 5 phút cuối) | |
| Độ trôi RSS (phút 2 → phút cuối) | |
| CPU đỉnh `node` / `java` | |

**Điều kiện đo:** Windows 11, hostname `Pham_Vu_Ngoc_Duy`, load generator và SUT **cùng máy**. Xem [`resource-monitor/hardware-report.md`](../resource-monitor/hardware-report.md).

## 5. Diễn giải RSS và `userCarts`

*(Xem `docs/08` §5 — ba khả năng, ba cách viết. Nếu kết luận rò rỉ thì BẮT BUỘC có phép kiểm "dừng tải, đợi 60s, đọc lại RSS".)*

## 6. Giới hạn của kết luận này

1. 12 phút là mốc tối thiểu của đề; chưa đủ để kết luận chắc chắn về rò rỉ dài hạn.
2. JMeter chạy cùng máy với SUT.
3. Ngưỡng này là ngưỡng **của máy này**, không phải của EShop nói chung.
