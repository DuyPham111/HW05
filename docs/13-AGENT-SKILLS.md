# 13 — Agent Skills (§7 — 10đ)

> §7: *"You are encouraged to build an Agent Skill that applies this performance-testing and log-analysis workflow, so that it can be **reused on additional endpoints** in future testing tasks. Submit the skill together with a demonstration video (YouTube link) that shows, **end to end**, how you used the skill on a **complete endpoint group**."*
> Bảng §15 cho mục này **10 điểm** — bằng cả Task 2 hoặc Task 3. Đừng làm qua loa.
> Output: 4 file `.claude/skills/*/SKILL.md` + đoạn demo trong video.

---

## 1. Skill tốt khác skill dở ở chỗ nào

Ở HW02 bạn viết 3 skill và được 10/10. Giữ nguyên công thức đó:

| Skill dở | Skill tốt (công thức HW02 của bạn) |
|---|---|
| chép lại đề bài | ghi **quy trình từng bước** kèm **prompt mẫu** cho từng bước |
| mô tả chung chung | có **bảng kiểm** và **giá trị ngưỡng cụ thể** |
| không nói AI hay sai gì | có mục **"AI hay sai ở đâu, kiểm bằng gì"** |
| chỉ dùng được cho đúng bài này | tham số hóa được → dùng lại cho endpoint khác (đúng chữ *"reused on additional endpoints"* của §7) |

---

## 2. Bốn skill nên viết

| Skill | Trả lời câu hỏi | Dùng ở bước nào |
|---|---|---|
| `perf-test-plan` | *"thiết kế và duyệt một test plan hiệu năng cho một nhóm endpoint như thế nào?"* | [04](04-TEST-PLAN-LOAD.md) [05](05-TEST-PLAN-STRESS.md) [06](06-TEST-PLAN-SPIKE.md) |
| `jtl-analysis` | *"phân tích raw `.jtl`, chốt ngưỡng, và bắt lỗi AI đọc sai metric"* | [09](09-TASK2-AI-ANALYSIS.md) |
| `resource-evidence` | *"thu bằng chứng tài nguyên/phần cứng đúng chuẩn §6/§11"* | [07](07-CHAY-VA-THU-BANG-CHUNG.md) [08](08-ENDURANCE-THRESHOLD.md) |
| `ai-audit-logger` | *"ghi AI Audit Report đúng §9 ngay sau mỗi phiên"* | [14](14-AI-AUDIT-CRITIQUE.md) |

Đặt ở `.claude/skills/<tên>/SKILL.md`. Front-matter bắt buộc:

```yaml
---
name: perf-test-plan
description: >-
  Thiết kế, sinh và duyệt một bộ test plan JMeter (Load/Stress/Spike/Soak) cho một
  nhóm endpoint API theo quy trình 7 bước. Dùng khi cần thiết kế kịch bản tải, chọn
  tham số VU/ramp-up/think-time, hoặc rà soát test plan do AI sinh trước khi chạy thật.
---
```

> `description` là thứ quyết định skill có được kích hoạt đúng lúc hay không. Viết theo mẫu **"làm gì + dùng khi nào"**, giống các skill HW02 của bạn.

---

## 3. Nội dung `perf-test-plan/SKILL.md`

Khung bắt buộc (viết bằng lời của bạn, đây chỉ là dàn ý):

```markdown
# Perf Test Plan — quy trình 7 bước cho một nhóm endpoint

## Nguyên tắc
- **Một** định nghĩa workflow → phát ra mọi scenario. Không viết tay nhiều file .jmx.
- Chia AI theo **từng bước**, không một prompt gộp (§2 của đề cấm).
- Mọi tham số phải có **lý do**; tham số không giải thích được thì chưa được dùng.
- Assertion phải kiểm **nội dung**, không chỉ HTTP status.

## Bước 1 — Đọc code trước khi thiết kế
Prompt: [dán prompt §2 của docs/04]
Đầu ra: bảng {endpoint → số truy vấn DB → loại (đọc PK/quét bảng/ghi) → số dòng code}.
Kiểm: mọi kết luận phải trích được file:dòng. Không trích được = chưa xác minh.

## Bước 2 — Chốt tham số
Bảng {VU, ramp-up, think-time, duration, lý do} cho từng scenario.
Ràng buộc phải khai báo trước: số tài khoản trong CSV · load generator ở cùng máy hay không.

## Bước 3 — Sinh .jmx
[quy tắc đặt tên {MSSV}_{Scenario}_{YYYYMMDD}; CSV shareMode.all; timeout; header]

## Bước 4 — Extractor + Assertion
Bảng assertion theo từng bước. Quy tắc: endpoint nào trả 2xx-nhưng-rỗng, hoặc 4xx-là-đúng,
thì assertion phải xử lý riêng.

## Bước 5 — Listener
Ba loại khác nhau cho ba scenario. View Results Tree chỉ dùng cho lượt ngắn.

## Bước 6 — Smoke test 40 giây (KHÔNG BỎ)
Lệnh + bảng "thấy gì → nghĩa là gì → sửa gì".

## Bước 7 — Human review
Bảng {AI sai gì | bằng chứng | sửa thành | vì sao sót}, quy về 3 nhóm nguyên nhân:
chất lượng prompt / giới hạn mô hình / đặc điểm endpoint.

## AI hay sai ở đâu (kiểm mỗi lần)
| AI hay làm | Kiểm bằng |
|---|---|
| CSV `shareMode` sai | `grep shareMode *.jmx` phải ra `shareMode.all` |
| assertion chỉ kiểm status | đọc từng Response Assertion |
| bỏ qua nhánh 4xx-là-đúng | chạy smoke, xem error% có bất thường |
| think-time quá dài | đếm sample trong 40s smoke |
| dùng plugin (Ultimate Thread Group) | mở .jmx trên JMeter sạch, phải mở được |

## Áp dụng cho endpoint group khác
Đổi hằng `WORKFLOW`, giữ nguyên 7 bước. Checklist chuyển đổi: [3–5 gạch đầu dòng]
```

---

## 4. Nội dung `jtl-analysis/SKILL.md`

Đây là skill có giá trị tái sử dụng cao nhất — nó chính là danh sách kiểm của [09](09-TASK2-AI-ANALYSIS.md) §3. Khung:

```markdown
# JTL Analysis — phân tích raw .jtl và bắt lỗi đọc metric

## Đầu vào
`.jtl` (CSV có header) + `.resources.csv` cùng basename.

## Quy trình
1. Tính lại mọi chỉ số từ raw — không đọc số từ HTML dashboard.
   Percentile: nearest-rank, `p = sorted[ceil(n*q)-1]`. Ghi rõ công thức vào output.
2. Phân rã theo `label` và theo `responseCode`.
3. Tách **lỗi thiết kế** khỏi **lỗi thật** trước khi nói bất cứ điều gì về error rate.
4. Đọc `Latency` riêng, không trộn với `elapsed`.
5. Kiểm `allThreads` max — tải có thật sự đạt mức thiết kế không.
6. Đối chiếu với `.resources.csv`: CPU của tiến trình SUT so với CPU của load generator.

## Bảng kiểm 8 lỗi đọc metric (chạy mỗi lần)
| # | Lỗi | Lệnh kiểm | Con số phải trích |
|---|---|---|---|
| 1 | đọc `elapsed` thành thời gian xử lý server | [awk] | avg elapsed vs avg Latency |
| 2 | gộp 4xx-thiết-kế vào lỗi hệ thống | [awk] | số sample theo (code, label) |
| 3 | dùng average trên phân phối lệch phải | — | p50 / p95 / p99 / max |
| 4 | so RPS giữa hai lượt khác thời lượng | — | RPS chuẩn hóa |
| 5 | bỏ qua `allThreads` | [awk] | peak allThreads |
| 6 | quy nhân quả khi chưa cô lập biến | — | nêu tương quan, không nêu nguyên nhân |
| 7 | bỏ qua việc load generator ở cùng máy | [awk] | CPU java vs node |
| 8 | kết luận rò rỉ từ đồ thị RSS đi lên | — | phải có phép kiểm dừng-tải-60s |

## Chốt ngưỡng
Định nghĩa "ổn định" phải viết TRƯỚC khi nhìn số. 4 tiêu chí: error% · độ trôi p95 ·
độ trôi RSS · CPU generator < CPU SUT.

## Phân loại đề xuất tối ưu
feasible / feasible-nhưng-vô-ích / feasible-ngoài-phạm-vi / hallucinated — mỗi cái phải
trích được file:dòng làm căn cứ. Mẫu cho SUT SQLite: [bảng ở docs/09 §4]
```

---

## 5. `resource-evidence/SKILL.md` và `ai-audit-logger/SKILL.md`

Ngắn hơn, nhưng phải cụ thể:

- **`resource-evidence`**: bố trí màn hình, mốc giây phải chụp cho từng scenario, 4 thứ phải nhìn thấy trong ảnh, cách lấy mẫu CPU/RSS trên Windows (`Get-Process`, hiệu `.CPU`), cách sinh hardware report, quy tắc khớp mtime ảnh với run-log.
- **`ai-audit-logger`**: template block LOG-xxx (tool / ngày giờ / prompt nguyên văn / output / **Human Review Notes**), quy tắc ghi ngay không dồn cuối, quy tắc nhãn *(SV đã kiểm)* vs *(SV chưa tự kiểm)*, và 3 trường riêng của HW05: scenario liên quan · file `.jtl` sinh ra · con số nào trong báo cáo đến từ lượt này.

---

## 6. Demo skill end-to-end trong video (§7 bắt buộc)

§7 đòi *"end to end, how you used the skill on a **complete endpoint group**"*. Nghĩa là không chỉ mở file SKILL.md ra đọc — phải **gọi skill và cho nó chạy thật**.

**Kịch bản đoạn demo (~1,5 phút, nằm trong video chính):**

1. Mở Claude Code trong thư mục repo.
2. Gõ `/perf-test-plan` (hoặc mô tả tác vụ để skill tự kích hoạt).
3. Yêu cầu áp dụng lên **một nhóm endpoint chưa làm** — ví dụ nhóm read-heavy mở rộng: `GET /api/categories` + `GET /api/orders/my-orders`.
4. Cho xem AI đi qua các bước: đọc code → đề xuất tham số → sinh plan → nêu assertion cần có.
5. Chỉ vào **một chỗ bạn sửa lại output của skill** — chứng minh human review vẫn diễn ra.

> Điểm ăn: đoạn này chứng minh skill **tái sử dụng được cho endpoint khác**, đúng chữ của §7. Nếu chỉ demo trên đúng workflow đã làm thì không chứng minh được tính tái sử dụng.

---

## 7. Checklist §7

- [ ] 4 file `SKILL.md`, mỗi file có front-matter `name` + `description` đúng mẫu "làm gì + dùng khi nào"
- [ ] Mỗi skill có **prompt mẫu cụ thể**, không chỉ mô tả
- [ ] Mỗi skill có mục **"AI hay sai ở đâu, kiểm bằng gì"**
- [ ] Mỗi skill có mục **"áp dụng cho endpoint group khác"** (§7 đòi tính tái sử dụng)
- [ ] Video có đoạn gọi skill **thật** trên một endpoint group, có bước bạn sửa output
- [ ] Đã dùng skill thật ít nhất một lần trong quá trình làm bài, và **ghi lượt đó vào AI Audit** (bằng chứng skill không phải viết cho có)

**Commit:** `feat(skills): 4 Agent Skill perf-test-plan / jtl-analysis / resource-evidence / ai-audit-logger`

---

→ Tiếp: [14-AI-AUDIT-CRITIQUE.md](14-AI-AUDIT-CRITIQUE.md)
