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
| Test plan | `test-plans/23127183_Soak_20260821.jmx` |
| VU / ramp-up | 20 VU / ramp 60s |
| Think-time | 1–2s (Uniform Random Timer) |
| Thời lượng | 726s (~12 phút) |
| Dữ liệu khi đo | `products` = 20005 dòng · `users` = 402 (200 hợp lệ + 200 mồi lockout) |
| Bắt đầu / kết thúc | 19:37:46 → 19:49:52 (22/8/2026) |
| Raw log | `endurance/jtl/23127183_Soak_20260822-193744.jtl` (9176 sample, 0% lỗi) |
| Resource log | `endurance/resources/23127183_Soak_20260822-193744.resources.csv` |
| Ảnh Task Manager | `resource-monitor/screenshots/taskmgr-soak.png` — chụp giây ~400, đồng hồ 7:44 PM khớp khoảng chạy |
| RSS `node.exe` lúc bắt đầu (đọc tay từ Task Manager, trước khi chạy) | 61,5 MB (63.012 K, PID 3728) |
| RSS `node.exe` đỉnh (đo bằng sampler, phút 1) | 113,7 MB |
| RSS `node.exe` ổn định (phút 3–12) | ~76 MB |

## 3. Số liệu đo được — `npm run drift` SINH RA, đừng sửa tay

### Bảng theo từng phút (23127183_Soak_20260822-193744.jtl)

| Phút | Sample | RPS | Error% | p50 | **p95** | p99 | max | RSS `node` (PID 3728, MB) |
|---|---|---|---|---|---|---|---|---|
| 1 | 428 | 7.1 | 0.00% | 5 | **16** | 22 | 121 | 108.6 |
| 2 | 792 | 13.2 | 0.00% | 4 | **16** | 22 | 35 | 89.9 |
| 3 | 801 | 13.3 | 0.00% | 4 | **16** | 18 | 24 | 74.3 |
| 4 | 804 | 13.4 | 0.00% | 4 | **16** | 21 | 69 | 76.3 |
| 5 | 806 | 13.4 | 0.00% | 4 | **15** | 17 | 23 | 76.7 |
| 6 | 792 | 13.2 | 0.00% | 4 | **15** | 18 | 24 | 76.0 |
| 7 | 800 | 13.3 | 0.00% | 3 | **14** | 16 | 25 | 76.1 |
| 8 | 794 | 13.2 | 0.00% | 3 | **15** | 21 | 83 | 76.0 |
| 9 | 789 | 13.2 | 0.00% | 3 | **15** | 18 | 24 | 76.6 |
| 10 | 797 | 13.3 | 0.00% | 3 | **15** | 17 | 82 | 75.8 |
| 11 | 796 | 13.3 | 0.00% | 3 | **15** | 16 | 21 | 76.2 |
| 12 | 777 | 13.2 | 0.00% | 3 | **14** | 16 | 27 | 76.4 |

### Kiểm 4 tiêu chí ổn định (đã định nghĩa trước ở mục 1)

| # | Tiêu chí | Kết quả |
|---|---|---|
| 1 | Error rate thật < 1% | [PASS] 0.000% (0/9176 lỗi thật; 0 thuộc thiết kế bước 7) |
| 2 | \|Δp95\| 5' đầu vs 5' cuối ≤ 20% | [PASS] p95 đầu=16ms, p95 cuối=15ms, chênh -6.3% |
| 3 | Δ RSS phút 2 → phút cuối ≤ 20% | [PASS] RSS phút 2=89.9MB, RSS cuối=76.4MB, chênh -15.0%, trần=113.7MB |
| 4 | CPU đỉnh `java` < CPU đỉnh `node` | [FAIL] java=246.3%, node=16.3% |

### Kết luận bằng số

> Ngưỡng chịu tải ổn định đo được trên máy này: **12.8 req/s** duy trì 12 phút, p95 **15 ms**, error **0.00%**, RSS trần **113.7 MB**, độ trôi p95 **-6.3%**, độ trôi RSS **-15.0%**.

## 4. Kết luận — ngưỡng chịu tải của phần cứng này

| Chỉ số | Giá trị đo được |
|---|---|
| **Max stable RPS** | **12,8 req/s** — duy trì đều suốt 12 phút (20 VU, think-time 1–2s) |
| p95 tại mức đó | **15 ms** |
| Error rate | **0,00%** (0/9176 — không có 401/403 vì bước 7 dùng tài khoản mồi riêng, không bị lockout trong lượt này) |
| **Memory ceiling** (RSS `node.exe`) | **113,7 MB** (đỉnh ở phút 1, ngay sau warm-up) |
| Độ trôi p95 (5 phút đầu → 5 phút cuối) | **−6,3%** (16 ms → 15 ms) |
| Độ trôi RSS (phút 2 → phút cuối) | **−15,0%** (89,9 MB → 76,4 MB) |
| CPU đỉnh `node` / `java` | **16,3% / 246,3%** |

> **3/4 tiêu chí đạt — tiêu chí 4 KHÔNG đạt.** Theo đúng định nghĩa đã cam kết ở §1 (*"ổn định" đòi cả bốn*), mức 20 VU **không đạt "ổn định"** theo nghĩa chặt, vì CPU đỉnh của `java.exe` (246,3% — tức bão hòa hơn 2 lõi) cao hơn hẳn `node.exe` (16,3%). Điều này có nghĩa: **con số 12,8 req/s là trần của load generator trên máy này, không phải trần thật của SUT.** Ở mức tải nhẹ như Load/Soak (20 VU), JMeter tự nó đã tốn nhiều CPU hơn backend đang phục vụ — nhất quán với phát hiện tương tự ở lượt Stress (`docs/05`, `main-report.md` §6). Ngưỡng SUT thật có thể cao hơn 12,8 req/s đáng kể; để đo đúng cần load generator trên máy khác (ngoài phạm vi bài này).
>
> Ba tiêu chí còn lại đều đạt tốt: error 0%, p95 gần như không trôi (−6,3%), và RSS **không tăng** — thậm chí giảm sau warm-up.

**Điều kiện đo:** Windows 11, hostname `Pham_Vu_Ngoc_Duy`, load generator và SUT **cùng máy**. Xem [`resource-monitor/hardware-report.md`](../resource-monitor/hardware-report.md).

## 5. Diễn giải RSS và `userCarts`

**Quan sát:** RSS của `node.exe` bắt đầu ở 61,5 MB (đo tay trước khi chạy), tăng vọt lên đỉnh **113,7 MB** ở phút 1 (có thể do warm-up JIT của V8 + JMeter vừa mới bắt đầu ramp 60s), rồi **giảm và ổn định quanh 74–77 MB** từ phút 3 đến phút 12 — không hề tăng dần theo thời gian.

**Kết luận: KHÔNG có dấu hiệu rò rỉ bộ nhớ ở quy mô 12 phút này.** Đây là khả năng "(2)" trong `docs/08-ENDURANCE-THRESHOLD.md` §5: dữ liệu tích lũy trong `userCarts` (`server.js:290-293` — biến RAM không giới hạn, không bao giờ xoá) tồn tại thật, nhưng ở tải 12,8 req/s trong 12 phút, lượng dữ liệu tích luỹ đủ nhỏ để nằm gọn trong phạm vi mà V8 GC dọn dẹp được — RSS đi ngang chứ không tăng đơn điệu.

**Phép kiểm chứng độc lập (dừng tải, đọc lại RSS):** Lượt Soak kết thúc lúc 19:49:52. Đọc lại RSS ở 19:54:xx (~4 phút sau khi dừng tải, không có request nào tới backend): *(điền số SV đọc được)* — nếu RSS về gần mức ổn định trong-lượt (~76 MB) hoặc thấp hơn, xác nhận đây là áp lực GC/warm-up bình thường, không phải rò rỉ. Nếu RSS vẫn ở mức đỉnh cũ hoặc cao hơn, cần xem lại.

> **Không kết luận "chắc chắn không có rò rỉ ở quy mô lớn hơn."** 12 phút và 20 VU là quy mô nhỏ; `userCarts` **thật sự không có cơ chế xoá** — với tải cao hơn hoặc chạy nhiều giờ, kết quả có thể khác. Đây là giới hạn của phép đo, ghi ở §6.

## 6. Giới hạn của kết luận này

1. 12 phút là mốc tối thiểu của đề; chưa đủ để kết luận chắc chắn về rò rỉ dài hạn — `userCarts` không có cơ chế xoá theo code, chỉ là ở quy mô đo được RSS chưa kịp tăng rõ rệt.
2. **JMeter chạy cùng máy với SUT, và ở mức tải này JMeter là điểm nghẽn** (CPU đỉnh 246,3% so với 16,3% của backend) — số RPS đo được là trần của load generator, không phải trần thật của SUT. Xem tiêu chí 4 ở §4.
3. Ngưỡng này là ngưỡng **của máy này** (Intel i5-1035G1, 4 nhân/8 luồng, 15,8 GB RAM), không phải của EShop nói chung.
4. RSS đỉnh 113,7 MB xảy ra ở phút 1 (warm-up), không phải cuối lượt — nếu chỉ nhìn RSS cuối cùng mà không xem cả chuỗi theo phút, có thể bỏ lỡ đỉnh này.
