# 09 — Task 2 (10đ): AI phân tích và **săn lỗi đọc metric**

> Cấu trúc điểm của task này rất rõ: **phân tích là output của AI, phần soát lại là của bạn.** Nếu bạn tự phân tích rồi bảo AI viết lại cho đẹp → mất điểm, vì không có gì để soát.
> Và: *"For each misinterpretation, **cite the correct value from your raw `.jtl` log** and explain the error."* — mỗi lỗi phải kèm **con số đúng lấy từ raw**, không phải "AI nói vậy là sai".
> Output: `ai-audit/task2-ai-output-verbatim.md` (+PDF) · báo cáo §3.1–§3.3.

---

## 1. Quy trình 4 bước

```
(1) Đưa AI raw .jtl + resources.csv, yêu cầu phân tích và đề xuất ngưỡng
        ↓  LƯU NGUYÊN VĂN output vào ai-audit/task2-ai-output-verbatim.md
(2) Bạn soát từng nhận định, đối chiếu với raw .jtl → bảng "AI đọc sai chỗ nào"
        ↓
(3) Yêu cầu AI đề xuất tối ưu (index / connection pool / WAL / …)
        ↓
(4) Bạn phân loại từng đề xuất: feasible hay hallucinated, kèm lý do và bằng chứng
```

**Quy tắc vàng của task này: lưu output của AI NGUYÊN VĂN, kể cả chỗ nó sai — nhất là chỗ nó sai.** Đó là vật chứng. Sửa nó đi rồi mới lưu thì bạn xóa mất chính thứ được chấm.

---

## 2. Bước 1 — Prompt cho AI phân tích

Trước khi hỏi, chuẩn bị dữ liệu ở dạng AI đọc được:

```bash
cd "D:/Nam3/HK3/Kiểm thử phần mềm/HW05/HW05-Performance-Testing" && npm run summary && wc -l results/jtl/*.jtl endurance/jtl/*.jtl
```

### Prompt (dùng nguyên văn, và **cố ý không** mớm sẵn các bẫy — để AI tự lộ ra chỗ sai)

> Tôi vừa chạy 4 lượt performance test bằng JMeter 5.6.3 trên backend Node.js + SQLite (SUT EShop) ở `localhost:3000`. Workflow 7 bước cho mỗi virtual user: `POST /api/login` → `GET /api/products?search=` → `GET /api/products/{id}` → `POST /api/cart` → `POST /api/apply-coupon` → `POST /api/checkout` → `POST /api/login` (mật khẩu sai).
>
> Đây là dữ liệu thật:
> - `results/summary.md`: [dán toàn bộ]
> - 200 dòng đầu của `results/jtl/23127183_Stress_….jtl`: [dán]
> - `results/resources/23127183_Stress_….resources.csv`: [dán]
> - Cấu hình 4 scenario: Load 20 VU/6 phút · Stress bậc 25→50→100→200/8 phút · Spike 10 nền + 200 trong 5s/4 phút · Soak 20 VU/12 phút.
>
> Hãy phân tích và trả lời:
> 1. Hệ thống hoạt động thế nào ở từng scenario? Endpoint nào là điểm nghẽn, căn cứ vào đâu?
> 2. Có dấu hiệu bão hòa tài nguyên không? Ở mức tải nào?
> 3. Error rate nói lên điều gì?
> 4. Đề xuất **ngưỡng hiệu năng** (SLO) cụ thể cho hệ thống này: p95 tối đa, error rate tối đa, RPS tối thiểu — kèm lý do.
> 5. Có dấu hiệu rò rỉ bộ nhớ không?

**→ Lưu output NGUYÊN VĂN** vào `ai-audit/task2-ai-output-verbatim.md`, kèm header:

```markdown
# Task 2 — Output nguyên văn của AI (vật chứng)

- **Tool:** Claude Code (Opus 5) / ChatGPT / …
- **Ngày giờ:** 2026-08-2x hh:mm
- **Prompt:** [dán nguyên văn prompt ở trên]
- **Lưu ý:** phần dưới là output **chưa chỉnh sửa**, giữ nguyên cả những chỗ sai —
  đó là vật chứng cho mục §3.2 của báo cáo.

---
[output nguyên văn]
```

**Commit:** `docs(task2): luu nguyen van output phan tich cua AI`

---

## 3. Bước 2 — Soát: 8 lỗi đọc metric AI hay mắc trên **chính bộ số liệu này**

Với mỗi nhận định của AI, mở raw `.jtl` kiểm lại. Dưới đây là 8 chỗ nên soi trước — kèm **lệnh để tự tính con số đúng**.

### 3.1 Lẫn lộn `elapsed` với `Latency`

AI hay viết *"thời gian xử lý của server là 18ms"* trong khi 18ms là `elapsed` (gồm cả truyền dữ liệu). Bước 2 (`search`) trả về mảng JSON có thể vài trăm KB → `elapsed − Latency` là phần truyền, không phải xử lý.

```bash
cd "D:/Nam3/HK3/Kiểm thử phần mềm/HW05/HW05-Performance-Testing" && awk -F, 'NR==1{for(i=1;i<=NF;i++)h[$i]=i; next} $h["label"]~/Search/ {e+=$h["elapsed"]; l+=$h["Latency"]; n++} END{printf "Search: avg elapsed %.1f ms, avg Latency %.1f ms, chenh %.1f ms\n", e/n, l/n, (e-l)/n}' results/jtl/23127183_Stress_*.jtl
```

### 3.2 Gộp 401/403 vào "lỗi hệ thống"

Bước 7 cố tình sai mật khẩu. **401 và 403 ở đây là hành vi đúng theo thiết kế.** AI nhìn thấy error rate 14% rồi kết luận "hệ thống không ổn định" là sai hoàn toàn.

```bash
cd "D:/Nam3/HK3/Kiểm thử phần mềm/HW05/HW05-Performance-Testing" && awk -F, 'NR>1{n[$4"|"$3]++} END{for(k in n) printf "%-50s %s\n", k, n[k]}' results/jtl/23127183_Stress_*.jtl | sort -t'|' -k1
```

**Con số đúng để trích:** *"Trong {tổng} sample của lượt Stress, {x} sample trả 401 và {y} trả 403 — toàn bộ thuộc sampler `07 Login sai`, là nhánh lockout cố ý của workflow. Số lỗi **không** phải do thiết kế là **{z}** ({z/tổng}%)."*

### 3.3 Lấy `average` làm kết luận trong khi phân phối lệch phải

`avg 9,6ms` nghe đẹp, nhưng nếu `p99 = 124ms` và `max = 3691ms` thì có một nhóm request bị xếp hàng nghiêm trọng mà trung bình che mất. Kiểm tỉ số `max/p50` và `p99/p50` — lệch > 10 lần là phân phối đuôi dài, trung bình vô nghĩa.

### 3.4 So RPS giữa hai lượt có **thời lượng khác nhau** mà không chuẩn hóa

Load 6 phút vs Soak 12 phút: số sample của Soak gấp đôi **không** có nghĩa là nó "chịu tải gấp đôi". Chỉ RPS mới so được, và ngay cả RPS cũng phải trừ giai đoạn ramp-up.

### 3.5 Bỏ qua cột `allThreads` → không kiểm tải có thật sự đạt mức thiết kế

AI mặc định lượt Stress "đã chạy ở 200 VU" vì bạn nói vậy. Kiểm:

```bash
cd "D:/Nam3/HK3/Kiểm thử phần mềm/HW05/HW05-Performance-Testing" && awk -F, 'NR==1{for(i=1;i<=NF;i++)h[$i]=i; next} {if($h["allThreads"]>m)m=$h["allThreads"]} END{print "Peak allThreads =", m}' results/jtl/23127183_Stress_*.jtl
```

Nếu peak < 200 → **JMeter không dựng đủ thread**, và mọi kết luận về "hệ thống chịu được 200 VU" đều sai.

### 3.6 Quy nhân quả cho một biến mà chưa cô lập biến đó

AI rất hay viết *"p95 cao hơn vì dữ liệu nhiều hơn"* hoặc *"vì CPU cao"*. Với 4 lượt chạy ở 4 thời điểm khác nhau, trên máy có tải nền thay đổi, **không lượt nào giữ mọi biến khác cố định** → chỉ được nói **tương quan**, không được nói **nguyên nhân**. Đây là lỗi đắt nhất và cũng là lỗi dễ ghi điểm nhất khi bạn bắt được nó.

### 3.7 Đề xuất ngưỡng SLO mà không tính tới việc load generator ở cùng máy

Mọi con số đo được đều bị ảnh hưởng bởi việc JMeter ăn CPU trên chính máy đó. Nếu AI đề xuất *"p95 < 20ms cho production"* mà không nêu điều kiện này → nhận định thiếu.

```bash
cd "D:/Nam3/HK3/Kiểm thử phần mềm/HW05/HW05-Performance-Testing" && awk -F, 'NR>1{if($3=="java"&&$5>j)j=$5; if($3=="node"&&$5>n)n=$5} END{printf "CPU dinh (%% cua 1 loi): java=%.1f  node=%.1f\n", j, n}' results/resources/23127183_Stress_*.resources.csv
```

### 3.8 Kết luận rò rỉ bộ nhớ chỉ từ đồ thị RSS đi lên

Xem [08](08-ENDURANCE-THRESHOLD.md) §5: phải có phép kiểm "dừng tải, đợi 60s, đọc lại RSS" thì mới phân biệt được rò rỉ với áp lực GC.

### Mẫu bảng §3.2 của báo cáo

```markdown
| # | AI nói gì (trích nguyên văn) | Sai ở đâu | **Giá trị đúng từ raw `.jtl`** | Vì sao AI sai |
|---|---|---|---|---|
| 1 | *"error rate 14,2% cho thấy hệ thống bắt đầu từ chối request"* | gộp 401/403 cố ý vào lỗi hệ thống | `23127183_Stress_….jtl`: 37.014/258.992 sample là 401\|403, **100% thuộc sampler `07 Login sai`**. Lỗi ngoài thiết kế: **0** | AI không có thông tin bước 7 là nhánh lockout cố ý; prompt của tôi cố tình không mớm để kiểm nó |
| 2 | *"thời gian xử lý phía server 18 ms"* | đọc `elapsed` như thời gian xử lý | avg `elapsed` = … ms nhưng avg `Latency` = … ms; chênh … ms là phần truyền dữ liệu | AI bỏ qua cột `Latency` — cột này chỉ có vì tôi bật `saveservice.latency=true` |
| 3 | … | | | |
```

> Có **5–8 dòng** là đủ tốt. Chất lượng hơn số lượng: một dòng có con số đúng trích từ raw và giải thích đúng nguyên nhân hơn năm dòng chung chung.

**Commit:** `docs(task2): soat 7 nhan dinh cua AI, doi chieu gia tri dung tu raw jtl`

---

## 4. Bước 3+4 — Đề xuất tối ưu: **feasible** hay **hallucinated**

### Prompt

> Dựa trên phân tích trên và mã nguồn sau: [dán `server.js` các handler + `database.js` phần `CREATE TABLE`], đề xuất **5 tối ưu hiệu năng** cụ thể cho SUT này. Với mỗi đề xuất: nói rõ thay đổi ở file/dòng nào, kỳ vọng cải thiện chỉ số nào, và cách đo lại để xác nhận.

### Bảng phân loại — với SUT này, đáp án gần như xác định trước

| Đề xuất AI thường đưa | Phân loại | **Lý do — trích code** |
|---|---|---|
| Bật **SQLite WAL** (`PRAGMA journal_mode=WAL`) | ✅ **Feasible** | Bước 6 là `INSERT` thật (`server.js:300`). WAL cho phép đọc song song với ghi → giảm chặn giữa bước 2/3 và bước 6. Đo lại: p95 bước 6 và bước 2 trước/sau |
| Thêm **index** cho `products.name` | ⚠️ **Feasible nhưng vô ích ở đây** | Truy vấn là `LIKE '%X%'` (`server.js:144`) — wildcard **đầu chuỗi** nên B-tree index không dùng được. Muốn ăn thua phải đổi sang **FTS5** hoặc bỏ wildcard đầu. **Đây là chỗ ghi điểm**: AI đề xuất index vì đó là câu trả lời mặc định, mà không đọc dạng truy vấn |
| Thêm **index** cho `users.email` | ✅ **Feasible** | `SELECT * FROM users WHERE email = ?` (`server.js:35`) — khớp chính xác, index dùng được. Nhưng lợi ích nhỏ vì bảng chỉ ~400 dòng; nói rõ điều đó |
| **Connection pool** cho SQLite | ❌ **Hallucinated** | `sqlite3` của Node mở **một handle trên file cục bộ**, không có mô hình client–server → không có "pool" theo nghĩa đó. Đây là đề xuất chép từ ngữ cảnh PostgreSQL/MySQL |
| **Redis cache** cho product listing | ⚠️ **Feasible về kỹ thuật, không phù hợp phạm vi** | Đúng về nguyên lý, nhưng thêm một service ngoài vào một app demo SQLite là thay đổi kiến trúc, không phải tối ưu. Ghi: feasible-nhưng-ngoài-phạm-vi |
| **Băm mật khẩu bằng bcrypt** để "tăng bảo mật và hiệu năng" | ❌ **Hallucinated (về hiệu năng)** | `server.js:46` so sánh plaintext. Thêm bcrypt **làm chậm** login đi hàng chục lần. Đúng về bảo mật, **sai về hiệu năng** — AI trộn hai mục tiêu |
| Tăng **`UV_THREADPOOL_SIZE`** | ⚠️ **Cần kiểm chứng** | `sqlite3` chạy trên libuv threadpool nên về lý thuyết có tác dụng. Nhưng chưa đo thì chưa được khẳng định → xếp vào "cần A/B test", đừng khẳng định bừa |
| **Xóa giỏ hàng sau checkout** | ✅ **Feasible** | `userCarts` không bao giờ được xóa (`server.js:290`, không có `clearCart`) → liên quan trực tiếp tới quan sát RSS ở lượt soak |

### Điểm cộng: **A/B test một đề xuất**

Nếu còn thời gian, làm thật một cái — đề xuất WAL là dễ nhất:

1. Sửa `backend/database.js`, thêm sau khi mở DB: `db.run("PRAGMA journal_mode=WAL");`
2. Restart backend (**không** seed lại — giữ nguyên dữ liệu để so được).
3. Chạy lại **đúng** plan Load, cùng tham số: `node tools/run-scenario.mjs Load`
4. `npm run summary` → so p95 bước 6 (checkout) trước/sau.
5. Ghi vào báo cáo **cả khi kết quả không cải thiện** — kết quả âm cũng là kết quả, và nó chứng minh bạn thật sự chạy.
6. **Hoàn nguyên** thay đổi ở `database.js` sau khi đo xong (SUT không phải của bạn), ghi rõ đã hoàn nguyên.

**Commit:** `docs(task2): phan loai 6 de xuat toi uu feasible/hallucinated + A-B test WAL`

---

## 5. Checklist Task 2

- [ ] `ai-audit/task2-ai-output-verbatim.md` giữ **nguyên văn**, có prompt + ngày giờ + tool
- [ ] Bảng §3.2 có ≥ 5 dòng, **mỗi dòng có con số trích từ raw `.jtl`** kèm tên file
- [ ] Mỗi lệnh dùng để tính con số đúng đều được ghi lại (để TA chạy lại được)
- [ ] Bảng §3.3 phân loại ≥ 5 đề xuất, mỗi cái có lý do trích **số dòng code**
- [ ] Có ít nhất 1 chỗ AI sai mà bạn **kiểm bằng thực nghiệm**, không chỉ bằng lập luận
- [ ] Không có con số nào trong §3 mà không truy được về `summary.md` hoặc `.jtl`

---

→ Tiếp: [10-TASK3-CONTINUOUS-PERF.md](10-TASK3-CONTINUOUS-PERF.md)
