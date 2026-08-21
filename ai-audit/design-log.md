# Design Log — thiết kế test plan theo từng bước (§2)

> File này chứng minh §2: *"drive an AI tool — **step by step**, not with a single generic prompt"*.
> Khác `ai-audit-report.md` (ghi từng phiên) ở chỗ: file này ghi **luồng thiết kế**, cho thấy
> đầu ra của bước trước là đầu vào của bước sau.
> Hướng dẫn: `docs/14-AI-AUDIT-CRITIQUE.md` §4.

---

## Bước 1 — Dạy AI về SUT
- **Đầu vào:** `server.js` dòng 32–66, 141–165, 284–310, 363–412 + `database.js` 20–110
- **Câu hỏi:** 6 câu về số truy vấn DB / index / lockout / mã trạng thái bất thường / đủ assertion chưa
- **AI trả sai:**
- **Chốt lại:**
- → **đầu vào cho bước 2**

## Bước 2 — Chốt tham số scenario
- **Đầu vào:** kết luận bước 1 + ràng buộc (200 tài khoản, generator cùng máy, 8 lõi)
- **AI đề xuất:**
- **Tôi sửa:** … vì …
- → **đầu vào cho bước 3**

## Bước 3 — Sinh `.jmx` từ một định nghĩa workflow chung
- **Đầu vào:**
- **AI output:**
- **Tôi sửa:**
- → **đầu vào cho bước 4**

## Bước 4 — CSV + JSON Extractor + Assertion
- **Đầu vào:**
- **AI output:**
- **Tôi sửa:**
- → **đầu vào cho bước 5**

## Bước 5 — Chọn listener (3 loại khác nhau)
- **Quyết định:** Load = Summary Report · Stress = Aggregate Report · Spike = View Results Tree
- **Lý do từng cái:**

## Bước 6 — Smoke test 40 giây
- **Lệnh:**
- **Phát hiện:**
- **Sửa:**
- → **đầu vào cho bước 7**

## Bước 7 — Human review
- **Số lỗi bắt được:**
- **Phân theo nhóm nguyên nhân:** prompt … / mô hình … / endpoint …
- → kết quả ghi vào `report/main-report.md` §2.4
