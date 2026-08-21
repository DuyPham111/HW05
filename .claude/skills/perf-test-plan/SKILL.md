---
name: perf-test-plan
description: >-
  Thiết kế, sinh và duyệt một bộ test plan JMeter (Load/Stress/Spike/Soak) cho một nhóm
  endpoint API theo quy trình 7 bước. Dùng khi cần thiết kế kịch bản tải, chọn tham số
  VU/ramp-up/think-time, gắn CSV data-driven và assertion, hoặc rà soát một test plan do
  AI sinh trước khi chạy lượt lấy số liệu thật.
---

# Perf Test Plan — quy trình 7 bước cho một nhóm endpoint

> **KHUNG CHỜ HOÀN THIỆN.** Viết bằng lời của bạn sau khi thực sự đi qua quy trình — skill viết trước khi làm sẽ chung chung và không dùng lại được. Hướng dẫn: `docs/13-AGENT-SKILLS.md` §3.

## Nguyên tắc

- **Một** định nghĩa workflow → phát ra mọi scenario. Không viết tay nhiều file `.jmx`: 4 file XML 500–1000 dòng sớm muộn cũng lệch nhau một assertion, và lúc đó so Load với Stress mất ý nghĩa.
- Chia AI theo **từng bước**, không một prompt gộp.
- Mọi tham số phải có **lý do**; tham số không giải thích được thì chưa được dùng.
- Assertion phải kiểm **nội dung**, không chỉ HTTP status.
- Sau mỗi bước: người review, sửa, ghi log vào `ai-audit/ai-audit-report.md`, rồi mới commit.

## Bước 1 — Đọc code trước khi thiết kế

Prompt (dán code handler + schema, kèm số dòng):

```
Đây là mã nguồn các handler tôi sẽ đo: [dán]. CHƯA viết test plan.
Trả lời 6 câu, chỉ dựa trên code tôi dán, không suy diễn:
1) Mỗi endpoint có bao nhiêu truy vấn DB, loại gì (đọc PK / quét bảng / ghi)? Trích file:dòng.
2) Endpoint nào KHÔNG chạm DB?
3) Có index nào ngoài PK? Truy vấn nào không thể dùng index kể cả khi thêm?
4) Cơ chế khóa/giới hạn: sau bao nhiêu lần, bao lâu, reset khi nào? Trích dòng.
5) Endpoint nào trả 2xx nhưng nội dung là lỗi/rỗng? Endpoint nào trả 4xx như hành vi ĐÚNG?
6) Assertion chỉ kiểm HTTP status có đủ không? Chỗ nào không đủ thì phải kiểm thêm gì?
```

→ Mọi kết luận phải trích được `file:dòng`. Không trích được = chưa xác minh, không được dùng.

## Bước 2 — Chốt tham số

Bảng `| Scenario | VU | Ramp-up | Think-time | Duration | Listener | Lý do |`.

Ràng buộc **phải khai báo trước** khi hỏi AI:
- số tài khoản/bản ghi có trong CSV (VU không được vượt quá)
- load generator ở **cùng máy** với SUT hay không
- số lõi CPU
- mục tiêu là mô phỏng người dùng thật hay là ép tải

## Bước 3 — Sinh `.jmx` bằng script

Quy tắc: tên file `{MSSV}_{Scenario}_{YYYYMMDD}.jmx` · `HTTP Request Defaults` có timeout · `HTTP Header Manager` cấp Thread Group · mọi `CSVDataSet` để **`shareMode.all`** · không dùng plugin ngoài (file phải mở được trên JMeter sạch).

## Bước 4 — Extractor + Assertion

Quy tắc chung: endpoint nào **trả 2xx-nhưng-rỗng**, hoặc **4xx-là-đúng**, thì assertion phải xử lý riêng.

| Tình huống | Assertion |
|---|---|
| trả token/id cần cho bước sau | assert có field đó, không chỉ status |
| not-found trả 200 + body rỗng | assert body chứa field định danh |
| 4xx là hành vi thiết kế | Response Assertion nhận mã đó + tick *Ignore Status* |
| ghi DB | assert có id bản ghi vừa tạo |

## Bước 5 — Listener

Ba loại **khác nhau** cho ba scenario. `View Results Tree` chỉ dùng cho lượt ngắn (nó lưu toàn bộ response vào RAM).

## Bước 6 — Smoke test 40 giây (KHÔNG BỎ)

Chạy 2 VU × 40s, rồi đếm `(responseCode | label)`:

```bash
awk -F, 'NR>1{n[$4"|"$3]++} END{for(k in n) printf "%-45s %s\n", k, n[k]}' <file>.jtl | sort
```

Bảng "thấy gì → nghĩa là gì → sửa gì": *(điền theo SUT cụ thể)*

## Bước 7 — Human review

Bảng `| AI sai gì | bằng chứng | sửa thành | vì sao sót |`, mỗi dòng quy về **một trong ba nhóm**: chất lượng prompt / giới hạn mô hình / đặc điểm endpoint.

## AI hay sai ở đâu — kiểm mỗi lần

| AI hay làm | Kiểm bằng |
|---|---|
| `shareMode` để mặc định | `grep shareMode *.jmx` → phải là `shareMode.all` |
| assertion chỉ kiểm status | đọc từng Response Assertion |
| bỏ qua nhánh 4xx-là-đúng | chạy smoke, xem error% có bất thường |
| think-time quá dài | đếm số sample trong 40s smoke |
| dùng plugin (Ultimate Thread Group) | mở `.jmx` trên JMeter sạch |
| khớp hằng số trong code với spec mà không mô phỏng trạng thái qua nhiều request | tự chạy tay chuỗi request và đếm |

## Áp dụng cho endpoint group khác

1. Đổi hằng `WORKFLOW`, giữ nguyên 7 bước.
2. Chạy lại bước 1 cho **các handler mới** — đừng tái sử dụng kết luận cũ.
3. Kiểm lại: endpoint mới có trả 2xx-rỗng hay 4xx-đúng không?
4. Kiểm CSV mới có đủ bản ghi cho số VU cao nhất không.
5. Smoke test lại từ đầu.
