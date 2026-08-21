# 08 — Endurance / Soak test và ngưỡng chịu tải của máy bạn

> §6: *"Run a short endurance / soak test (around 10–15 minutes at sustained load) to empirically find your hardware's threshold, reported with **concrete numbers** (e.g., maximum stable RPS, memory ceiling)."*
> Chữ quan trọng nhất là **concrete numbers**. "Hệ thống ổn định" không phải là đáp án. "62,8 req/s ổn định 12 phút, p95 8ms, RSS trần 83,1 MB" mới là.
> Output: `endurance/endurance-threshold.md` + `endurance/jtl/` + mục §2.7 báo cáo.

---

## 1. Định nghĩa "ổn định" **trước khi chạy** — không phải sau

Đây là chỗ dễ tự lừa mình nhất: chạy xong, nhìn số, rồi chọn định nghĩa nào làm cho số của mình đẹp. Viết định nghĩa ra **trước**, commit nó **trước** khi chạy lượt soak — commit log sẽ là bằng chứng bạn không chỉnh luật sau trận.

**Định nghĩa đề xuất** (chép vào `endurance/endurance-threshold.md` §1 rồi commit ngay):

> Một mức tải được gọi là **ổn định** khi trong suốt 12 phút chạy liên tục, đồng thời thỏa **cả bốn** điều kiện:
> 1. **Error rate < 1%**, và mọi lỗi còn lại phải giải thích được bằng thiết kế (401/403 của bước 7), không có 500 hay timeout.
> 2. **p95 không trôi quá 20%** giữa cửa sổ 5 phút đầu và cửa sổ 5 phút cuối.
> 3. **RSS (working set) của `node.exe` không tăng quá 20%** giữa phút thứ 2 và phút cuối — nếu tăng đơn điệu thì đó là rò rỉ, không phải ổn định.
> 4. **CPU của `java.exe` (JMeter) < CPU của `node.exe`** — nếu ngược lại thì con số đo được là trần của load generator, không phải của SUT.

**Commit:** `docs: dinh nghia tieu chi on dinh TRUOC khi chay soak`

---

## 2. Chọn mức tải cho lượt soak

Không chạy soak ở mức Stress (200 VU) — soak đo **độ bền ở mức chịu được**, không đo điểm gãy.

**Cách chọn:** lấy bậc cao nhất trong lượt Stress mà **cả bốn** tiêu chí trên còn thỏa, rồi lùi lại một chút.

| Nếu Stress cho thấy | Chọn mức soak |
|---|---|
| 25/50 VU ổn, 100 VU p95 bắt đầu dãn | **50 VU** |
| lên tới 200 VU vẫn 0% error, p95 tăng gần tuyến tính | **20–25 VU** (mức Load) và **ghi rõ** rằng đây là mức bảo thủ, chưa phải trần |

Mặc định trong `gen-test-plans.py`, scenario `Soak` = **20 VU, ramp 60s, duration 720s (12 phút), think 1–2s** — cùng mức Load để so trực tiếp được lượt 6 phút với lượt 12 phút. Nếu Stress cho thấy dư địa lớn hơn thì chỉnh lên và **ghi lý do**.

---

## 3. Chạy

```bash
cd "D:/Nam3/HK3/Kiểm thử phần mềm/HW05/HW05-Performance-Testing" && npm run reset:lockout -- --wait && node tools/run-scenario.mjs Soak
```

**Trước khi bấm chạy — ba việc bắt buộc:**

1. **Ghi RSS của `node.exe` ngay lúc bắt đầu** (Task Manager, cột Memory) vào `endurance/run-log.md`. Đây là điểm mốc; không có nó thì không tính được độ trôi.
2. **Không restart backend giữa lượt.** `userCarts` là biến RAM — restart là mọi bằng chứng rò rỉ về 0.
3. **Không dùng máy làm việc khác** trong 12 phút (đừng mở Chrome nặng, đừng build gì). Tải nền của máy là biến gây nhiễu mạnh nhất; nếu buộc phải làm gì thì ghi vào run-log.

Chụp ảnh Task Manager ở **giây thứ ~400** → `resource-monitor/screenshots/taskmgr-soak.png`.

---

## 4. `tools/soak-drift.mjs` — tính độ trôi theo phút

**Prompt:**

> Viết `tools/soak-drift.mjs` (Node 22, ESM, không dependency ngoài). Đọc file `.jtl` mới nhất trong `endurance/jtl/` và file `.resources.csv` cùng basename trong `endurance/resources/`, rồi in ra Markdown và ghi vào `endurance/endurance-threshold.md` (mục "Số liệu đo được", giữ nguyên các mục tôi viết tay):
>
> 1. **Bảng theo từng phút**: phút thứ n | sample | RPS | error% | p50 | **p95** | p99 | max | `working_set_mb` của `node` (lấy trung bình các mẫu trong phút đó).
> 2. **Kiểm 4 tiêu chí ổn định**, mỗi cái in `[PASS]`/`[FAIL]` kèm con số:
>    - error rate toàn lượt, và phân rã theo response code
>    - p95 của 5 phút đầu vs 5 phút cuối, kèm **% chênh lệch**
>    - RSS của `node` ở phút 2 vs phút cuối, kèm **% chênh lệch** và **giá trị trần (max)**
>    - CPU đỉnh của `java` vs của `node`
> 3. **Kết luận bằng số**: *"Ngưỡng chịu tải ổn định đo được trên máy này: **{RPS} req/s** duy trì {phút} phút, p95 **{ms} ms**, error **{%}**, RSS trần **{MB} MB**, độ trôi p95 **{±%}**, độ trôi RSS **{±%}**."*
> 4. Nếu tiêu chí 3 FAIL (RSS tăng đơn điệu), in thêm: hệ số góc của đường hồi quy tuyến tính RSS theo thời gian (MB/phút) và ngoại suy thời điểm chạm 1 GB.

```bash
cd "D:/Nam3/HK3/Kiểm thử phần mềm/HW05/HW05-Performance-Testing" && npm run drift && cat endurance/endurance-threshold.md
```

---

## 5. Chỗ có thể có phát hiện thật: RSS và `userCarts`

`server.js:290`:

```js
app.post("/api/cart", authenticateToken, (req, res) => {
  const userId = req.user.id;
  if (!userCarts[userId]) userCarts[userId] = [];
  userCarts[userId].push(req.body);      // ← không giới hạn, không xóa
  res.json({ message: "Added to cart" });
});
```

`userCarts` là object toàn cục trong process `node`. Mỗi request bước 4 **cộng thêm vĩnh viễn** một object; `POST /api/checkout` **không** xóa giỏ. Trong 12 phút soak với ~20 VU, bước 4 chạy hàng chục nghìn lần.

**Việc phải làm:**

1. Đọc bảng RSS theo phút từ `npm run drift`.
2. Ba khả năng, ba cách viết báo cáo:

| Bạn quan sát | Kết luận đúng | Viết vào đâu |
|---|---|---|
| RSS **tăng đơn điệu**, không đi ngang | Có **rò rỉ bộ nhớ**. Trích `server.js:290`, đưa hệ số MB/phút, ngoại suy thời điểm chạm trần. Đây là một **performance issue thật** → báo GitHub Issue ([11](11-BUG-REPORT-GITHUB-ISSUES.md)) | §2.7 + bug-report |
| RSS tăng rồi **đi ngang** (GC bắt kịp) | **Không** kết luận rò rỉ. Ghi: dữ liệu tích lũy nhưng V8 vẫn giữ được trong heap sau GC ở quy mô 12 phút; ngưỡng RSS trần là **{X} MB** | §2.7 |
| RSS **dao động không xu hướng** | Ghi trần và độ dao động, và nói rõ 12 phút **không đủ dài** để kết luận về rò rỉ — đây là giới hạn của phép đo | §2.7 + §6 Giới hạn |

3. **Kiểm chứng độc lập** (nếu RSS tăng): dừng tải, đợi 60 giây, đọc lại RSS.
   - Về gần mức ban đầu → là **áp lực GC**, không phải rò rỉ.
   - Vẫn cao → **giữ tham chiếu**, tức rò rỉ thật.
   Ghi cả phép kiểm này vào báo cáo — nó là thứ phân biệt một kết luận có căn cứ với một suy đoán.

> **Đừng viết "phát hiện memory leak" nếu chưa làm bước 3.** Đây đúng là loại kết luận nhân quả vội vàng mà Task 2 yêu cầu bạn phải bắt được ở AI — tự mình mắc thì mất điểm ở cả hai chỗ.

---

## 6. Mẫu `endurance/endurance-threshold.md`

```markdown
# Endurance Threshold — 23127183

## 1. Định nghĩa "ổn định" (viết TRƯỚC khi chạy, commit …)
[4 tiêu chí ở §1]

## 2. Cấu hình lượt soak
| | |
|---|---|
| Test plan | `test-plans/23127183_Soak_20260820.jmx` |
| VU | 20, ramp 60s |
| Think-time | 1–2s |
| Thời lượng | 720s (12 phút) |
| Dữ liệu | `products` = {N} dòng, `users` = 402 |
| Bắt đầu / kết thúc | … |
| Raw log | `endurance/jtl/23127183_Soak_….jtl` |

## 3. Số liệu đo được  ← npm run drift SINH RA, đừng sửa tay
[bảng theo phút + 4 tiêu chí PASS/FAIL]

## 4. Kết luận — ngưỡng chịu tải của phần cứng này
| Chỉ số | Giá trị đo được |
|---|---|
| **Max stable RPS** | **{X} req/s** duy trì 12 phút |
| p95 tại mức đó | **{Y} ms** |
| Error rate | **{Z}%** (toàn bộ là 401/403 của bước 7 — hành vi thiết kế) |
| **Memory ceiling** (RSS `node.exe`) | **{M} MB** |
| Độ trôi p95 (5' đầu → 5' cuối) | **{±p}%** |
| Độ trôi RSS (phút 2 → phút cuối) | **{±r}%** |
| CPU đỉnh `node` / `java` | {a}% / {b}% của một lõi |

**Điều kiện đo:** Windows 11, {CPU} {n} lõi, {RAM} GB, load generator và SUT **cùng máy**.
Xem `resource-monitor/hardware-report.md`.

## 5. Giới hạn của kết luận này
- 12 phút là mốc tối thiểu của đề; không đủ để kết luận chắc chắn về rò rỉ bộ nhớ dài hạn.
- JMeter chạy cùng máy với SUT: {ghi CPU của java so với node}.
- Ngưỡng này là ngưỡng **của máy này**, không phải của EShop nói chung.
```

**Commit:** `test(soak): luot endurance 12 phut + chot nguong bang so cu the`

---

→ Tiếp: [09-TASK2-AI-ANALYSIS.md](09-TASK2-AI-ANALYSIS.md)
