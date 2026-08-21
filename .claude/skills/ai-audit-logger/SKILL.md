---
name: ai-audit-logger
description: >-
  Ghi AI Audit Report đúng yêu cầu §9 ngay sau mỗi phiên làm việc với AI: tool, ngày giờ,
  prompt nguyên văn, output, và Human Review Notes có nhãn trung thực. Dùng ngay sau mỗi
  lượt hỏi AI, không dồn về cuối bài.
---

# AI Audit Logger — ghi log ngay sau mỗi phiên

> **KHUNG CHỜ HOÀN THIỆN.** Hướng dẫn: `docs/14-AI-AUDIT-CRITIQUE.md`.

## Quy tắc số một

**Ghi ngay sau mỗi phiên, đừng dồn về cuối.** Dồn về cuối = bịa. Và với bài hiệu năng thì rất dễ lộ: mỗi lượt dùng AI đều gắn với một file `.jtl` hoặc một commit có timestamp — prompt ghi lúc 23h mà commit lúc 14h là lệch ngay.

## Template block

```markdown
### [LOG-0xx] — <tiêu đề ngắn: làm gì>
- **Tool:** <tên + model>
- **Date & Time:** <YYYY-MM-DD hh:mm>
- **Prompt:** "<NGUYÊN VĂN, không tóm tắt>"
- **AI Output:** <tóm tắt trung thực; nếu là output cần làm vật chứng thì trỏ tới file giữ nguyên văn>
- **Human Review Notes:** <bạn kiểm/sửa/loại cái gì và VÌ SAO — phần quan trọng nhất>
- **Bằng chứng liên quan:** <commit · file .jtl · ảnh>
```

## Ba trường riêng cho bài hiệu năng

| Trường | Vì sao |
|---|---|
| **Scenario liên quan** | truy được lượt nào |
| **File `.jtl` sinh ra** | nối lượt AI với dữ liệu thật |
| **Con số nào trong báo cáo đến từ lượt này** | cho phép lần ngược từ một con số về nguồn gốc |

## Hai nhãn trung thực trong Human Review Notes

- ***(SV đã kiểm)*** — thật sự chạy/đo/đối chiếu
- ***(SV chưa tự kiểm)*** — chấp nhận output mà chưa xác minh độc lập

Viết tất cả thành "đã kiểm hết" là loại bằng chứng dựng bị phạt. Có vài dòng *(chưa tự kiểm)* thì phần *(đã kiểm)* mới đáng tin.

## Output cần giữ NGUYÊN VĂN

Với các lượt mà **output của AI chính là vật chứng** (phần phân tích được đem ra soát lỗi), lưu nguyên văn vào file riêng, **kể cả chỗ AI sai — nhất là chỗ nó sai**. Sửa rồi mới lưu là xóa mất thứ được chấm.

## Bảng tổng hợp lỗi của AI

Cuối file audit, gộp mọi lỗi đã bắt được:

```markdown
| # | Lỗi | Giai đoạn | Nhóm nguyên nhân | Có làm kết quả báo lỗi không? |
```

Cột cuối quan trọng nhất: lỗi **không** làm hệ thống báo lỗi là loại nguy hiểm nhất — nó lặng lẽ làm sai số liệu.

## Ba nhóm nguyên nhân (quy mọi lỗi về một trong ba)

1. **Chất lượng prompt** — tôi chưa cung cấp dữ kiện đó
2. **Giới hạn mô hình** — AI không có cách nào biết (không chạy được, không thấy hành vi thật)
3. **Đặc điểm endpoint/hệ thống** — SUT hành xử khác quy ước, đọc code mới biết

## Áp dụng cho bài khác

Template và hai nhãn giữ nguyên. Đổi ba trường riêng cho phù hợp loại bằng chứng của bài đó (vd bài automation: test file sinh ra · report HTML nào · TC nào).
