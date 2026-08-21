# AI Audit Report — HW05 Performance Testing

**Sinh viên:** Phạm Vũ Ngọc Duy (23127183)

**Declaration:** *"I use AI tools for the following tasks."*

> **Quy tắc:** ghi 1 block **NGAY SAU** mỗi phiên dùng AI — đừng dồn về cuối, sẽ quên prompt và giờ.
> **Human Review Notes là phần quan trọng nhất:** bạn đã kiểm chứng / sửa / loại cái gì, và **vì sao**.
> Dùng hai nhãn: ***(SV đã kiểm)*** cho thứ bạn thật sự chạy/đo; ***(SV chưa tự kiểm)*** cho thứ bạn chấp nhận mà chưa xác minh. Viết tất cả thành "đã kiểm hết" là loại bằng chứng dựng mà §11 phạt.
> Hướng dẫn đầy đủ + danh sách 17 block đề xuất: [`docs/14-AI-AUDIT-CRITIQUE.md`](../docs/14-AI-AUDIT-CRITIQUE.md).

---

### [LOG-001] — Phân tích đề + dựng cấu trúc bài nộp và bộ hướng dẫn
- **Tool:**
- **Date & Time:**
- **Prompt:**
- **AI Output:**
- **Human Review Notes:**
- **Bằng chứng liên quan:** commit `…`

### [LOG-002] — Setup môi trường + `preflight.mjs`
- **Tool:**
- **Date & Time:**
- **Prompt:**
- **AI Output:**
- **Human Review Notes:**
- **Bằng chứng liên quan:**

### [LOG-003] — Chốt phạm vi §5 và viết `endpoint-selection.md`
- **Tool:**
- **Date & Time:**
- **Prompt:**
- **AI Output:**
- **Human Review Notes:**

### [LOG-004] — Sinh `seed-perf-data.mjs` và 5 file CSV data-driven
- **Tool:**
- **Date & Time:**
- **Prompt:**
- **AI Output:**
- **Human Review Notes:**

### [LOG-005] — Bước 1: dạy AI về SUT (6 câu hỏi về code)
- **Tool:**
- **Date & Time:**
- **Prompt:**
- **AI Output:**
- **Human Review Notes:**
- **Scenario liên quan:** (thiết kế chung cho cả 4)

### [LOG-006] — Bước 2: chốt tham số scenario Load
- **Tool:**
- **Date & Time:**
- **Prompt:**
- **AI Output:**
- **Human Review Notes:**
- **Scenario liên quan:** Load

### [LOG-007] — Bước 3–4: `gen-test-plans.py`, JSON extractor, assertion từng bước
- **Tool:**
- **Date & Time:**
- **Prompt:**
- **AI Output:**
- **Human Review Notes:**

### [LOG-008] — Bước 6: smoke test 40 giây và các lỗi phát hiện
- **Tool:**
- **Date & Time:**
- **Prompt:**
- **AI Output:**
- **Human Review Notes:**
- **File `.jtl` sinh ra:** `results/jtl/smoke-….jtl`

### [LOG-009] — Thêm scenario Stress (4 bậc, không dùng plugin)
- **Tool:**
- **Date & Time:**
- **Prompt:**
- **AI Output:**
- **Human Review Notes:**
- **Scenario liên quan:** Stress

### [LOG-010] — Thêm scenario Spike (2 thread group)
- **Tool:**
- **Date & Time:**
- **Prompt:**
- **AI Output:**
- **Human Review Notes:**
- **Scenario liên quan:** Spike

### [LOG-011] — `run-scenario.mjs` + `sample-resources.ps1` + `reset-lockout.mjs`
- **Tool:**
- **Date & Time:**
- **Prompt:**
- **AI Output:**
- **Human Review Notes:**

### [LOG-012] — `summarize-jtl.mjs` và đối chiếu chéo với HTML dashboard
- **Tool:**
- **Date & Time:**
- **Prompt:**
- **AI Output:**
- **Human Review Notes:**
- **Con số nào trong báo cáo đến từ lượt này:** toàn bộ §2.2, §2.3

### [LOG-013] — `soak-drift.mjs` và chốt endurance threshold
- **Tool:**
- **Date & Time:**
- **Prompt:**
- **AI Output:**
- **Human Review Notes:**
- **File `.jtl` sinh ra:** `endurance/jtl/…`

### [LOG-014] — **Task 2: AI phân tích raw `.jtl`** ⭐
- **Tool:**
- **Date & Time:**
- **Prompt:** *(nguyên văn — dán đầy đủ)*
- **AI Output:** giữ **nguyên văn** tại [`task2-ai-output-verbatim.md`](task2-ai-output-verbatim.md)
- **Human Review Notes:** *(liệt kê từng nhận định đã soát, chỉ ra chỗ sai kèm giá trị đúng từ raw)*
- **Con số nào trong báo cáo đến từ lượt này:** §3.1, §3.2

### [LOG-015] — **Task 2: AI đề xuất tối ưu + phân loại feasible/hallucinated** ⭐
- **Tool:**
- **Date & Time:**
- **Prompt:**
- **AI Output:** *(nguyên văn tại `task2-ai-output-verbatim.md`)*
- **Human Review Notes:**

### [LOG-016] — Task 3: flow chart + CI pipeline + chạy thật
- **Tool:**
- **Date & Time:**
- **Prompt:**
- **AI Output:**
- **Human Review Notes:**

### [LOG-017] — Viết 4 Agent Skill
- **Tool:**
- **Date & Time:**
- **Prompt:**
- **AI Output:**
- **Human Review Notes:**

---

## Bảng tổng hợp lỗi của AI đã bắt được

> Gộp bảng §2.4 (lỗi thiết kế test plan) và §3.2 (lỗi đọc metric) của báo cáo chính để tiện tra cứu.

| # | Lỗi | Giai đoạn | Nhóm nguyên nhân | Có làm test plan báo lỗi không? |
|---|---|---|---|---|
| 1 | | thiết kế / phân tích | prompt / mô hình / endpoint | |

*(Cột cuối quan trọng: lỗi **không** làm plan báo lỗi là loại nguy hiểm nhất — nó lặng lẽ làm sai số liệu.)*

## Công cụ AI đã dùng (§8 đòi khai báo)

| Tool | Phiên bản/model | Dùng cho |
|---|---|---|
| Claude Code | | |
| | | |
