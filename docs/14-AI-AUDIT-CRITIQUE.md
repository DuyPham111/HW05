# 14 — AI Audit Report (§9) và AI Critique (§10)

> §9 là **phụ lục bắt buộc**. §17: *"Missing any required document results in 0 points."*
> Format ở HW02 của bạn đã được 100đ — giữ nguyên, chỉ đổi nội dung cho phù hợp HW05.
> Output: `ai-audit/ai-audit-report.md` (+PDF) · `ai-audit/ai-critique.md` (+PDF) · `ai-audit/design-log.md`.

---

## 1. Quy tắc số một: **ghi ngay, đừng dồn**

Đây là dòng đầu tiên trong file audit của HW02 và nó đúng: *"ghi 1 block NGAY SAU mỗi phiên dùng AI (đừng dồn về cuối — sẽ quên prompt/giờ)"*.

Dồn về cuối = bịa. Bịa là rủi ro lớn nhất của bài này, và với HW05 thì còn dễ lộ hơn: mọi lượt dùng AI đều gắn với một file `.jtl` hoặc một commit có timestamp. Prompt ghi lúc 23h mà commit lúc 14h thì lệch ngay.

---

## 2. Mẫu block — giữ nguyên format HW02

```markdown
### [LOG-0xx] — <tiêu đề ngắn: làm gì>
- **Tool:** Claude Code (Opus 5) / ChatGPT / Gemini …
- **Date & Time:** 2026-08-2x hh:mm
- **Prompt:** "<nguyên văn, không tóm tắt>"
- **AI Output:** <tóm tắt trung thực; nếu là output Task 2 thì trỏ tới file nguyên văn>
- **Human Review Notes:** <PHẦN QUAN TRỌNG NHẤT — bạn đã kiểm/sửa/loại cái gì và VÌ SAO>
- **Bằng chứng liên quan:** `results/jtl/…` · commit `abc1234` · ảnh `screenshots/…`
```

### Ba trường riêng của HW05 (thêm vào cuối mỗi block khi có)

| Trường | Vì sao cần |
|---|---|
| **Scenario liên quan** | Load/Stress/Spike/Soak — để truy được lượt nào |
| **File `.jtl` sinh ra** | nối lượt AI với dữ liệu thật |
| **Con số nào trong báo cáo đến từ lượt này** | cho phép TA lần ngược từ một con số về nguồn gốc của nó |

### Nhãn trung thực trong Human Review Notes

Dùng **hai** nhãn, cố ý tách nhau:
- ***(SV đã kiểm)*** — bạn thật sự chạy/đo/đối chiếu.
- ***(SV chưa tự kiểm)*** — bạn chấp nhận output của AI mà chưa xác minh độc lập.

Viết tất cả thành "đã kiểm hết" đúng là loại bằng chứng dựng mà §11 phạt. Có vài dòng *(chưa tự kiểm)* thì phần *(đã kiểm)* mới đáng tin.

---

## 3. Bộ block tối thiểu cho HW05 (~12–16 block)

| LOG | Nội dung | Khi nào |
|---|---|---|
| 001 | Phân tích đề + dựng cấu trúc bài nộp + bộ docs hướng dẫn | trước khi bắt đầu |
| 002 | Sinh `preflight.mjs`, kiểm 6 endpoint | [01](01-SETUP.md) |
| 003 | Chốt phạm vi §5, viết `endpoint-selection.md` | [02](02-PHAM-VI-WORKFLOW.md) |
| 004 | Sinh `seed-perf-data.mjs` + 5 CSV | [03](03-DATA-DRIVEN-CSV.md) |
| 005 | **Bước 1** — dạy AI về SUT, 6 câu hỏi về code | [04](04-TEST-PLAN-LOAD.md) §2 |
| 006 | **Bước 2** — chốt tham số scenario Load | [04](04-TEST-PLAN-LOAD.md) §3 |
| 007 | **Bước 3–4** — sinh `gen-test-plans.py`, extractor, assertion | [04](04-TEST-PLAN-LOAD.md) §4 |
| 008 | **Bước 6** — smoke test, các lỗi phát hiện và cách sửa | [04](04-TEST-PLAN-LOAD.md) §6 |
| 009 | Thêm scenario Stress (4 bậc) | [05](05-TEST-PLAN-STRESS.md) |
| 010 | Thêm scenario Spike (2 thread group) | [06](06-TEST-PLAN-SPIKE.md) |
| 011 | `run-scenario.mjs` + `sample-resources.ps1` + `reset-lockout.mjs` | [07](07-CHAY-VA-THU-BANG-CHUNG.md) |
| 012 | `summarize-jtl.mjs` và đối chiếu chéo với dashboard | [07](07-CHAY-VA-THU-BANG-CHUNG.md) §6 |
| 013 | `soak-drift.mjs` + chốt endurance threshold | [08](08-ENDURANCE-THRESHOLD.md) |
| **014** | **Task 2 — AI phân tích `.jtl`** (output nguyên văn ở file riêng) | [09](09-TASK2-AI-ANALYSIS.md) |
| **015** | **Task 2 — AI đề xuất tối ưu** + phân loại của bạn | [09](09-TASK2-AI-ANALYSIS.md) §4 |
| 016 | Task 3 — flow chart + CI pipeline | [10](10-TASK3-CONTINUOUS-PERF.md) |
| 017 | Viết 4 Agent Skill | [13](13-AGENT-SKILLS.md) |

Block **014** và **015** là hai block quan trọng nhất — chúng là vật chứng của Task 2. Với hai block này, **output phải giữ nguyên văn** trong `ai-audit/task2-ai-output-verbatim.md`, và block chỉ trỏ sang.

---

## 4. `ai-audit/design-log.md` — nhật ký thiết kế theo bước

File này chứng minh §2 *"drive an AI tool — **step by step**, not with a single generic prompt"*. Nó khác `ai-audit-report.md` ở chỗ: audit report ghi **từng phiên**, design log ghi **luồng thiết kế** (7 bước của [04](04-TEST-PLAN-LOAD.md) §1) và cho thấy đầu ra bước trước là đầu vào bước sau.

Mẫu:

```markdown
# Design Log — thiết kế test plan theo từng bước (§2)

## Bước 1 — Dạy AI về SUT
- **Đầu vào:** `server.js` dòng 32–66, 141–165, 284–310, 363–412 + `database.js` 20–110
- **Câu hỏi:** 6 câu về số truy vấn DB / index / lockout / mã trạng thái bất thường
- **AI trả sai:** "lockout sau 3 lần sai" → thực tế 2 lần (`+2`, ngưỡng `>=3`)
- **Chốt lại:** [bảng 6 đáp án đúng]
- → **đầu vào cho bước 2**

## Bước 2 — Chốt tham số
- **Đầu vào:** kết luận bước 1 + ràng buộc (200 tài khoản, generator cùng máy, 8 lõi)
- **AI đề xuất:** 50 VU / think 5–10s
- **Tôi sửa:** 20 VU / think 1–3s, vì [lý do]
- → **đầu vào cho bước 3**

[… tới bước 7]
```

---

## 5. AI Critique — 200–300 từ, **đếm lại trước khi nộp**

§10 hỏi đúng 3 câu:
1. **Where did the AI get something wrong, biased, or incomplete?**
2. **Why did it fail to catch the issue?**
3. **What principle have you learned about collaborating with AI?**

### Cấu trúc gợi ý (3 đoạn, ~250 từ)

**Đoạn 1 (~110 từ) — sai ở đâu, cụ thể, có số:**
Chọn **2–3 lỗi thật** từ bảng human review §2.4 và bảng Task 2 §3.2. Ưu tiên lỗi có con số. Ví dụ dạng viết: *"Ở bước thiết kế, AI kết luận tài khoản bị khóa sau 3 lần sai vì khớp hằng số `>= 3` với spec, trong khi code cộng `+2` mỗi lần nên thực tế khóa sau 2 lần. Ở Task 2, AI đọc error rate {x}% là dấu hiệu hệ thống từ chối request, nhưng {y}/{z} sample mang mã đó đều thuộc sampler bước 7 — nhánh lockout cố ý."*

**Đoạn 2 (~80 từ) — vì sao nó sót:**
Quy về ba nhóm: **không chạy được** (chỉ đọc code tĩnh, không mô phỏng trạng thái qua nhiều request), **thiếu ngữ cảnh** (không biết bước nào là nhánh cố ý nếu tôi không nói), **thiên lệch về câu trả lời phổ biến** (đề xuất "thêm index" và "connection pool" là phản xạ mặc định cho mọi bài tối ưu DB, bất kể truy vấn là `LIKE '%x%'` hay engine là SQLite nhúng).

**Đoạn 3 (~60 từ) — nguyên tắc rút ra:**
Nói **một** nguyên tắc cụ thể, đừng nói chung chung kiểu "AI là công cụ hỗ trợ". Gợi ý: *mọi kết luận của AI về hiệu năng phải quy về được một dòng trong raw `.jtl` hoặc một dòng code; cái gì không quy được thì ghi là giả thuyết, không ghi là kết quả.*

### Đếm từ

```bash
cd "D:/Nam3/HK3/Kiểm thử phần mềm/HW05/HW05-Performance-Testing" && sed '/^#/d;/^\*\*/d' ai-audit/ai-critique.md | wc -w
```

Phải nằm trong **200–300**. Dưới 200 hoặc trên 300 đều là không làm đúng yêu cầu.

> **So với HW02:** critique HW02 của bạn nói về AI đọc code tĩnh và bỏ sót lỗi tầng client. HW05 phải nói về **lỗi đọc số liệu** — đó là bản chất khác của bài này. Đừng chép lại critique cũ.

---

## 6. Xuất PDF

§14 đòi Markdown **và** PDF cho: main report · AI Audit Report · AI Critique · (bug report nên có).

Cách nhanh nhất trên Windows — VS Code + extension **Markdown PDF**: chuột phải trong file `.md` → *Markdown PDF: Export (pdf)*.

Hoặc bằng lệnh:

```bash
npx -y md-to-pdf report/main-report.md ai-audit/ai-audit-report.md ai-audit/ai-critique.md bug-report/bug-report.md
```

**Kiểm sau khi xuất:** mở từng PDF, xác nhận **bảng không bị vỡ** và **ảnh hiện được** (đường dẫn ảnh tương đối phải đúng khi PDF nằm cùng thư mục với `.md`).

**Commit:** `docs: AI Audit Report 17 block + AI Critique 2xx tu + xuat PDF`

---

## 7. Checklist §9 §10

- [ ] `ai-audit-report.md` mở đầu bằng đúng câu khai báo: **"I use AI tools for the following tasks."**
- [ ] Mỗi block có đủ 4 trường §9: tool · date & time · prompt · output
- [ ] Mỗi block có **Human Review Notes**, có nhãn *(SV đã kiểm)* / *(SV chưa tự kiểm)*
- [ ] Block Task 2 trỏ tới `task2-ai-output-verbatim.md` giữ **nguyên văn**
- [ ] `design-log.md` cho thấy 7 bước nối tiếp nhau, đầu ra bước trước = đầu vào bước sau
- [ ] `ai-critique.md` đếm được **200–300 từ**, trả lời đủ 3 câu §10
- [ ] 4 file PDF xuất xong, bảng và ảnh không vỡ

---

→ Tiếp: [15-GIT-COMMIT-LOG.md](15-GIT-COMMIT-LOG.md)
