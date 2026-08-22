# Task 2 — Output nguyên văn của AI (vật chứng)

> **Quy tắc:** giữ NGUYÊN VĂN, kể cả chỗ AI sai — **nhất là chỗ nó sai**. Đó là vật chứng cho §3.2
> của báo cáo chính. Sửa nó đi rồi mới lưu là xóa mất chính thứ được chấm.

> **Cách thu thập:** prompt CHỈ chứa dữ liệu thô (`summary.md`, 200 dòng jtl, resources.csv) —
> KHÔNG kèm theo bất kỳ phân tích/phát hiện nào đã làm trước đó ở §2 của báo cáo chính (bảng
> theo bậc, allThreads, CPU generator...). Đây là điều kiện bắt buộc để phép "săn lỗi" ở §3.2
> có ý nghĩa — nếu mớm sẵn đáp án thì AI không còn cơ hội mắc lỗi thật.

---

## Output A — Phân tích raw `.jtl`

- **Tool:** Claude (phiên phân tích độc lập, không có ngữ cảnh từ báo cáo)
- **Date & Time:** 2026-08-22
- **Prompt (nguyen van):**

```
Tôi vừa chạy 4 lượt performance test bằng JMeter 5.6.3 trên backend Node.js + SQLite (SUT EShop) ở localhost:3000. Workflow 7 bước cho mỗi virtual user: POST /api/login -> GET /api/products?search= -> GET /api/products/{id} -> POST /api/cart -> POST /api/apply-coupon -> POST /api/checkout -> POST /api/login (mật khẩu sai).

Cấu hình 4 scenario:
- Load: 20 VU cố định, ramp 60s, 358.5s
- Stress: tăng bậc 25->50->100->200 VU (mỗi bậc ~90-130s), tổng 419.5s
- Spike: 10 VU nền + 200 VU dội trong 5s, tổng 239.5s
- Soak: 20 VU, 718.6s (~12 phút)

Đây là dữ liệu thật:

=== results/summary.md (đầy đủ) ===
# Test Summary — sinh tự động từ raw `.jtl`

> **File này sinh tự động bằng `npm run summary`. ĐỪNG SỬA TAY.**
> Mọi con số trong `README.md` và `report/main-report.md` phải copy từ đây.
>
> **Cách tính percentile:** nearest-rank — sắp xếp tăng dần, `p = sorted[ceil(n × q) − 1]`.
> JMeter dashboard nội suy hơi khác nên p95 có thể lệch **1–2 ms**; đó là bình thường và
> đã được giải thích, không phải sai số liệu.
>
> **Đơn vị:** thời gian = **ms**, trừ cột "Thời lượng" = giây.
> Sinh lúc: 2026-08-22T13:36:23.381Z
> Số file đọc được: 4

### 23127183_Soak_20260822-193744.jtl

**Tổng thể**

| | Sample | Thời lượng (s) | RPS | Error% (thô) | Error% (**thật**) | avg | p50 | p90 | **p95** | p99 | max | Lat avg | Lat p95 | peak VU |
|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|
| Toàn lượt | 9176 | 718.6 | 12.8 | 0.0% | 0.0% | 6.4 | 4 | 14 | **15** | 18 | 121 | 6.3 | 15 | 20 |

> **Error% (thô)** đếm mọi sample `success=false`. **Error% (thật)** đã loại các sample là *hành vi theo thiết kế* — bước 7 cố tình đăng nhập sai nên 401/403 ở đó **không phải lỗi hệ thống**. Lượt này có **1303** sample thuộc nhóm thiết kế và **0** lỗi thật.

**Theo từng sampler**

| | Sample | Thời lượng (s) | RPS | Error% (thô) | Error% (**thật**) | avg | p50 | p90 | **p95** | p99 | max | Lat avg | Lat p95 | peak VU |
|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|
| 01 Login | 1319 | 718.0 | 1.8 | 0.0% | 0.0% | 5.9 | 6 | 7 | **9** | 16 | 43 | 5.8 | 9 | 20 |
| 02 Search products | 1316 | 715.9 | 1.8 | 0.0% | 0.0% | 12.4 | 13 | 16 | **17** | 21 | 28 | 12.3 | 17 | 20 |
| 03 Product detail | 1314 | 714.9 | 1.8 | 0.0% | 0.0% | 2.4 | 2 | 3 | **5** | 12 | 16 | 2.4 | 5 | 20 |
| 04 Add to cart | 1310 | 712.9 | 1.8 | 0.0% | 0.0% | 3.3 | 3 | 4 | **5** | 5 | 7 | 3.3 | 5 | 20 |
| 05 Apply coupon | 1309 | 711.9 | 1.8 | 0.0% | 0.0% | 3.6 | 3 | 4 | **7** | 14 | 76 | 3.6 | 7 | 20 |
| 06 Checkout | 1305 | 709.8 | 1.8 | 0.0% | 0.0% | 14.1 | 14 | 16 | **17** | 25 | 121 | 14.0 | 17 | 20 |
| 07 Login sai (lockout) | 1303 | 709.1 | 1.8 | 0.0% | 0.0% | 3.0 | 3 | 4 | **5** | 11 | 21 | 2.9 | 5 | 20 |

**Phân rã response code**

| responseCode | sampler | Số sample | Theo thiết kế? |
|---|---|---|---|
| 200 | 01 Login | 1319 | — |
| 200 | 02 Search products | 1316 | — |
| 200 | 03 Product detail | 1314 | — |
| 200 | 04 Add to cart | 1310 | — |
| 200 | 05 Apply coupon | 1309 | — |
| 200 | 06 Checkout | 1305 | — |
| 401 | 07 Login sai (lockout) | 800 | ✅ có |
| 403 | 07 Login sai (lockout) | 503 | ✅ có |

### 23127183_Load_20260822-183102.jtl

**Tổng thể**

| | Sample | Thời lượng (s) | RPS | Error% (thô) | Error% (**thật**) | avg | p50 | p90 | **p95** | p99 | max | Lat avg | Lat p95 | peak VU |
|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|
| Toàn lượt | 3282 | 358.5 | 9.2 | 0.0% | 0.0% | 6.7 | 4 | 15 | **16** | 20 | 199 | 6.7 | 16 | 20 |

> **Error% (thô)** đếm mọi sample `success=false`. **Error% (thật)** đã loại các sample là *hành vi theo thiết kế* — bước 7 cố tình đăng nhập sai nên 401/403 ở đó **không phải lỗi hệ thống**. Lượt này có **460** sample thuộc nhóm thiết kế và **0** lỗi thật.

**Theo từng sampler**

| | Sample | Thời lượng (s) | RPS | Error% (thô) | Error% (**thật**) | avg | p50 | p90 | **p95** | p99 | max | Lat avg | Lat p95 | peak VU |
|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|
| 01 Login | 477 | 358.4 | 1.3 | 0.0% | 0.0% | 6.3 | 6 | 8 | **10** | 17 | 53 | 6.3 | 10 | 20 |
| 02 Search products | 476 | 356.2 | 1.3 | 0.0% | 0.0% | 12.5 | 13 | 16 | **18** | 22 | 28 | 12.5 | 18 | 20 |
| 03 Product detail | 472 | 353.4 | 1.3 | 0.0% | 0.0% | 2.8 | 2 | 3 | **4** | 11 | 89 | 2.8 | 4 | 20 |
| 04 Add to cart | 468 | 351.2 | 1.3 | 0.0% | 0.0% | 3.6 | 4 | 5 | **5** | 6 | 7 | 3.5 | 5 | 20 |
| 05 Apply coupon | 465 | 350.3 | 1.3 | 0.0% | 0.0% | 3.6 | 3 | 5 | **6** | 11 | 16 | 3.6 | 6 | 20 |
| 06 Checkout | 464 | 348.4 | 1.3 | 0.0% | 0.0% | 14.9 | 14 | 16 | **18** | 31 | 199 | 14.9 | 18 | 20 |
| 07 Login sai (lockout) | 460 | 345.5 | 1.3 | 0.0% | 0.0% | 3.2 | 3 | 4 | **4** | 12 | 17 | 3.2 | 4 | 20 |

**Phân rã response code**

| responseCode | sampler | Số sample | Theo thiết kế? |
|---|---|---|---|
| 200 | 01 Login | 477 | — |
| 200 | 02 Search products | 476 | — |
| 200 | 03 Product detail | 472 | — |
| 200 | 04 Add to cart | 468 | — |
| 200 | 05 Apply coupon | 465 | — |
| 200 | 06 Checkout | 464 | — |
| 401 | 07 Login sai (lockout) | 400 | ✅ có |
| 403 | 07 Login sai (lockout) | 60 | ✅ có |

### 23127183_Spike_20260822-192951.jtl

**Tổng thể**

| | Sample | Thời lượng (s) | RPS | Error% (thô) | Error% (**thật**) | avg | p50 | p90 | **p95** | p99 | max | Lat avg | Lat p95 | peak VU |
|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|
| Toàn lượt | 18102 | 239.5 | 75.6 | 0.0% | 0.0% | 184.0 | 117 | 455 | **530** | 682 | 893 | 184.0 | 530 | 210 |

> **Error% (thô)** đếm mọi sample `success=false`. **Error% (thật)** đã loại các sample là *hành vi theo thiết kế* — bước 7 cố tình đăng nhập sai nên 401/403 ở đó **không phải lỗi hệ thống**. Lượt này có **2494** sample thuộc nhóm thiết kế và **0** lỗi thật.

**Theo từng sampler**

| | Sample | Thời lượng (s) | RPS | Error% (thô) | Error% (**thật**) | avg | p50 | p90 | **p95** | p99 | max | Lat avg | Lat p95 | peak VU |
|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|
| 01 Login | 2682 | 239.3 | 11.2 | 0.0% | 0.0% | 191.5 | 214 | 431 | **490** | 590 | 676 | 191.5 | 490 | 210 |
| 02 Search products | 2644 | 239.1 | 11.1 | 0.0% | 0.0% | 183.7 | 208 | 410 | **461** | 535 | 657 | 183.7 | 461 | 210 |
| 03 Product detail | 2614 | 238.7 | 10.9 | 0.0% | 0.0% | 182.0 | 208 | 419 | **467** | 556 | 653 | 182.0 | 467 | 210 |
| 04 Add to cart | 2582 | 238.4 | 10.8 | 0.0% | 0.0% | 68.1 | 69 | 156 | **179** | 233 | 280 | 68.1 | 179 | 210 |
| 05 Apply coupon | 2562 | 238.1 | 10.8 | 0.0% | 0.0% | 294.0 | 384 | 646 | **716** | 840 | 893 | 294.0 | 716 | 210 |
| 06 Checkout | 2524 | 237.5 | 10.6 | 0.0% | 0.0% | 187.9 | 222 | 415 | **459** | 552 | 637 | 187.9 | 459 | 210 |
| 07 Login sai (lockout) | 2494 | 237.6 | 10.5 | 0.0% | 0.0% | 181.1 | 213 | 410 | **457** | 538 | 649 | 181.1 | 457 | 210 |

**Phân rã response code**

| responseCode | sampler | Số sample | Theo thiết kế? |
|---|---|---|---|
| 200 | 01 Login | 2682 | — |
| 200 | 02 Search products | 2644 | — |
| 200 | 03 Product detail | 2614 | — |
| 200 | 04 Add to cart | 2582 | — |
| 200 | 05 Apply coupon | 2562 | — |
| 200 | 06 Checkout | 2524 | — |
| 401 | 07 Login sai (lockout) | 432 | ✅ có |
| 403 | 07 Login sai (lockout) | 2062 | ✅ có |

### 23127183_Stress_20260822-191048.jtl

**Tổng thể**

| | Sample | Thời lượng (s) | RPS | Error% (thô) | Error% (**thật**) | avg | p50 | p90 | **p95** | p99 | max | Lat avg | Lat p95 | peak VU |
|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|
| Toàn lượt | 59628 | 419.5 | 142.1 | 0.0% | 0.0% | 88.7 | 46 | 232 | **289** | 419 | 976 | 88.7 | 289 | 200 |

> **Error% (thô)** đếm mọi sample `success=false`. **Error% (thật)** đã loại các sample là *hành vi theo thiết kế* — bước 7 cố tình đăng nhập sai nên 401/403 ở đó **không phải lỗi hệ thống**. Lượt này có **8430** sample thuộc nhóm thiết kế và **0** lỗi thật.

**Theo từng sampler**

| | Sample | Thời lượng (s) | RPS | Error% (thô) | Error% (**thật**) | avg | p50 | p90 | **p95** | p99 | max | Lat avg | Lat p95 | peak VU |
|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|
| 01 Login | 8600 | 419.4 | 20.5 | 0.0% | 0.0% | 94.1 | 56 | 234 | **280** | 399 | 751 | 94.1 | 280 | 200 |
| 02 Search products | 8572 | 418.8 | 20.5 | 0.0% | 0.0% | 94.9 | 60 | 225 | **267** | 375 | 649 | 94.8 | 267 | 200 |
| 03 Product detail | 8545 | 418.4 | 20.4 | 0.0% | 0.0% | 85.7 | 50 | 221 | **263** | 380 | 741 | 85.7 | 263 | 200 |
| 04 Add to cart | 8520 | 417.4 | 20.4 | 0.0% | 0.0% | 33.7 | 18 | 87 | **106** | 154 | 386 | 33.7 | 106 | 200 |
| 05 Apply coupon | 8495 | 416.5 | 20.4 | 0.0% | 0.0% | 133.4 | 75 | 348 | **409** | 535 | 976 | 133.4 | 409 | 200 |
| 06 Checkout | 8466 | 415.8 | 20.4 | 0.0% | 0.0% | 95.0 | 60 | 226 | **269** | 376 | 685 | 95.0 | 269 | 200 |
| 07 Login sai (lockout) | 8430 | 414.9 | 20.3 | 0.0% | 0.0% | 84.2 | 50 | 218 | **257** | 359 | 713 | 84.2 | 257 | 200 |

**Phân rã response code**

| responseCode | sampler | Số sample | Theo thiết kế? |
|---|---|---|---|
| 200 | 01 Login | 8600 | — |
| 200 | 02 Search products | 8572 | — |
| 200 | 03 Product detail | 8545 | — |
| 200 | 04 Add to cart | 8520 | — |
| 200 | 05 Apply coupon | 8495 | — |
| 200 | 06 Checkout | 8466 | — |
| 401 | 07 Login sai (lockout) | 647 | ✅ có |
| 403 | 07 Login sai (lockout) | 7783 | ✅ có |


=== 200 dòng đầu của results/jtl/23127183_Stress_20260822-191048.jtl ===
timeStamp,elapsed,label,responseCode,responseMessage,threadName,dataType,success,failureMessage,bytes,sentBytes,grpThreads,allThreads,URL,Latency,IdleTime,Connect
1787400653743,66,01 Login,200,OK,Bac 1 - 25 VU 1-1,text,true,,638,231,2,2,http://127.0.0.1:3000/api/login,66,0,48
1787400654002,6,01 Login,200,OK,Bac 1 - 25 VU 1-2,text,true,,638,231,3,3,http://127.0.0.1:3000/api/login,6,0,2
1787400654461,14,02 Search products,200,OK,Bac 1 - 25 VU 1-2,text,true,,20420,184,4,4,http://127.0.0.1:3000/api/products?search=PerfProduct-112,13,0,0
1787400654615,6,01 Login,200,OK,Bac 1 - 25 VU 1-3,text,true,,638,231,4,4,http://127.0.0.1:3000/api/login,6,0,3
1787400654645,11,02 Search products,200,OK,Bac 1 - 25 VU 1-1,text,true,,20429,184,4,4,http://127.0.0.1:3000/api/products?search=PerfProduct-100,10,0,0
1787400654801,2,03 Product detail,200,OK,Bac 1 - 25 VU 1-2,text,true,,442,164,5,5,http://127.0.0.1:3000/api/products/46,2,0,0
1787400655303,7,01 Login,200,OK,Bac 1 - 25 VU 1-4,text,true,,640,232,6,6,http://127.0.0.1:3000/api/login,7,0,3
1787400655365,10,02 Search products,200,OK,Bac 1 - 25 VU 1-3,text,true,,20431,184,6,6,http://127.0.0.1:3000/api/products?search=PerfProduct-128,10,0,0
1787400655647,7,01 Login,200,OK,Bac 1 - 25 VU 1-5,text,true,,638,231,7,7,http://127.0.0.1:3000/api/login,7,0,2
1787400655662,4,03 Product detail,200,OK,Bac 1 - 25 VU 1-1,text,true,,439,163,7,7,http://127.0.0.1:3000/api/products/6,3,0,0
1787400655677,7,04 Add to cart,200,OK,Bac 1 - 25 VU 1-2,text,true,,294,365,7,7,http://127.0.0.1:3000/api/cart,6,0,0
1787400656038,3,03 Product detail,200,OK,Bac 1 - 25 VU 1-3,text,true,,441,164,8,8,http://127.0.0.1:3000/api/products/86,3,0,0
1787400656071,7,01 Login,200,OK,Bac 1 - 25 VU 1-6,text,true,,638,231,8,8,http://127.0.0.1:3000/api/login,7,0,2
1787400656226,5,04 Add to cart,200,OK,Bac 1 - 25 VU 1-1,text,true,,294,364,8,8,http://127.0.0.1:3000/api/cart,5,0,0
1787400656226,12,02 Search products,200,OK,Bac 1 - 25 VU 1-5,text,true,,20433,184,8,8,http://127.0.0.1:3000/api/products?search=PerfProduct-147,12,0,0
1787400656273,10,02 Search products,200,OK,Bac 1 - 25 VU 1-4,text,true,,20426,184,8,8,http://127.0.0.1:3000/api/products?search=PerfProduct-134,10,0,0
1787400656274,10,01 Login,200,OK,Bac 1 - 25 VU 1-8,text,true,,643,232,8,8,http://127.0.0.1:3000/api/login,10,0,2
1787400656430,8,01 Login,200,OK,Bac 1 - 25 VU 1-7,text,true,,640,232,9,9,http://127.0.0.1:3000/api/login,8,0,3
1787400656540,4,05 Apply coupon,200,OK,Bac 1 - 25 VU 1-2,text,true,,399,237,9,9,http://127.0.0.1:3000/api/apply-coupon,4,0,0
1787400656650,12,02 Search products,200,OK,Bac 1 - 25 VU 1-8,text,true,,20432,184,9,9,http://127.0.0.1:3000/api/products?search=PerfProduct-178,12,0,0
1787400656665,3,03 Product detail,200,OK,Bac 1 - 25 VU 1-4,text,true,,445,165,9,9,http://127.0.0.1:3000/api/products/126,3,0,0
1787400656776,8,02 Search products,200,OK,Bac 1 - 25 VU 1-7,text,true,,20434,184,10,10,http://127.0.0.1:3000/api/products?search=PerfProduct-163,8,0,0
1787400656839,13,02 Search products,200,OK,Bac 1 - 25 VU 1-6,text,true,,20422,184,10,10,http://127.0.0.1:3000/api/products?search=PerfProduct-156,13,0,0
1787400656855,4,04 Add to cart,200,OK,Bac 1 - 25 VU 1-3,text,true,,294,365,10,10,http://127.0.0.1:3000/api/cart,4,0,0
1787400656902,3,03 Product detail,200,OK,Bac 1 - 25 VU 1-5,text,true,,445,165,10,10,http://127.0.0.1:3000/api/products/166,3,0,0
1787400657077,7,01 Login,200,OK,Bac 1 - 25 VU 1-10,text,true,,643,232,10,10,http://127.0.0.1:3000/api/login,7,0,2
1787400657092,5,05 Apply coupon,200,OK,Bac 1 - 25 VU 1-1,text,true,,399,237,10,10,http://127.0.0.1:3000/api/apply-coupon,5,0,0
1787400657185,3,03 Product detail,200,OK,Bac 1 - 25 VU 1-7,text,true,,445,165,11,11,http://127.0.0.1:3000/api/products/246,3,0,0
1787400657328,8,01 Login,200,OK,Bac 1 - 25 VU 1-9,text,true,,643,232,11,11,http://127.0.0.1:3000/api/login,8,0,3
1787400657404,15,06 Checkout,200,OK,Bac 1 - 25 VU 1-2,text,true,,314,420,11,11,http://127.0.0.1:3000/api/checkout,15,0,0
1787400657468,3,03 Product detail,200,OK,Bac 1 - 25 VU 1-8,text,true,,445,165,11,11,http://127.0.0.1:3000/api/products/286,2,0,0
1787400657516,2,04 Add to cart,200,OK,Bac 1 - 25 VU 1-5,text,true,,294,366,12,12,http://127.0.0.1:3000/api/cart,2,0,0
1787400657516,4,04 Add to cart,200,OK,Bac 1 - 25 VU 1-4,text,true,,294,366,12,12,http://127.0.0.1:3000/api/cart,3,0,0
1787400657565,6,01 Login,200,OK,Bac 1 - 25 VU 1-11,text,true,,643,232,12,12,http://127.0.0.1:3000/api/login,6,0,2
1787400657642,8,02 Search products,200,OK,Bac 1 - 25 VU 1-10,text,true,,20431,184,12,12,http://127.0.0.1:3000/api/products?search=PerfProduct-192,8,0,0
1787400657674,2,03 Product detail,200,OK,Bac 1 - 25 VU 1-6,text,true,,445,165,12,12,http://127.0.0.1:3000/api/products/206,2,0,0
1787400657798,3,05 Apply coupon,200,OK,Bac 1 - 25 VU 1-3,text,true,,399,237,12,12,http://127.0.0.1:3000/api/apply-coupon,3,0,0
1787400657860,13,06 Checkout,200,OK,Bac 1 - 25 VU 1-1,text,true,,314,420,12,12,http://127.0.0.1:3000/api/checkout,13,0,0
1787400658032,4,04 Add to cart,200,OK,Bac 1 - 25 VU 1-8,text,true,,294,368,13,13,http://127.0.0.1:3000/api/cart,4,0,0
1787400658064,14,02 Search products,200,OK,Bac 1 - 25 VU 1-9,text,true,,20431,184,13,13,http://127.0.0.1:3000/api/products?search=PerfProduct-185,14,0,0
1787400658158,5,04 Add to cart,200,OK,Bac 1 - 25 VU 1-7,text,true,,294,366,13,13,http://127.0.0.1:3000/api/cart,5,0,0
1787400658236,4,05 Apply coupon,200,OK,Bac 1 - 25 VU 1-4,text,true,,399,237,13,13,http://127.0.0.1:3000/api/apply-coupon,4,0,0
1787400658267,4,05 Apply coupon,200,OK,Bac 1 - 25 VU 1-5,text,true,,399,238,13,13,http://127.0.0.1:3000/api/apply-coupon,4,0,0
1787400658282,16,06 Checkout,200,OK,Bac 1 - 25 VU 1-3,text,true,,314,420,13,13,http://127.0.0.1:3000/api/checkout,16,0,0
1787400658298,3,03 Product detail,200,OK,Bac 1 - 25 VU 1-10,text,true,,445,165,13,13,http://127.0.0.1:3000/api/products/366,3,0,0
1787400658298,3,07 Login sai (lockout),401,Unauthorized,Bac 1 - 25 VU 1-2,text,true,,314,233,13,13,http://127.0.0.1:3000/api/login,3,0,0
1787400658298,3,07 Login sai (lockout),401,Unauthorized,Bac 1 - 25 VU 1-1,text,true,,314,233,13,13,http://127.0.0.1:3000/api/login,3,0,0
1787400658377,6,01 Login,200,OK,Bac 1 - 25 VU 1-12,text,true,,641,231,14,14,http://127.0.0.1:3000/api/login,6,0,2
1787400658455,3,04 Add to cart,200,OK,Bac 1 - 25 VU 1-6,text,true,,294,366,14,14,http://127.0.0.1:3000/api/cart,3,0,0
1787400658549,4,01 Login,200,OK,Bac 1 - 25 VU 1-13,text,true,,641,231,14,14,http://127.0.0.1:3000/api/login,4,0,1
1787400658580,8,02 Search products,200,OK,Bac 1 - 25 VU 1-11,text,true,,2270,185,14,14,http://127.0.0.1:3000/api/products?search=PerfProduct-1234,7,0,0
1787400658642,12,06 Checkout,200,OK,Bac 1 - 25 VU 1-4,text,true,,314,420,14,14,http://127.0.0.1:3000/api/checkout,12,0,0
1787400658690,4,05 Apply coupon,200,OK,Bac 1 - 25 VU 1-7,text,true,,400,238,14,14,http://127.0.0.1:3000/api/apply-coupon,4,0,0
1787400658813,3,05 Apply coupon,200,OK,Bac 1 - 25 VU 1-8,text,true,,400,239,15,15,http://127.0.0.1:3000/api/apply-coupon,3,0,0
1787400658840,6,01 Login,200,OK,Bac 1 - 25 VU 1-1,text,true,,641,231,15,15,http://127.0.0.1:3000/api/login,5,0,2
1787400658859,5,04 Add to cart,200,OK,Bac 1 - 25 VU 1-10,text,true,,294,368,15,15,http://127.0.0.1:3000/api/cart,5,0,0
1787400658859,15,06 Checkout,200,OK,Bac 1 - 25 VU 1-5,text,true,,314,421,15,15,http://127.0.0.1:3000/api/checkout,15,0,0
1787400658922,3,03 Product detail,200,OK,Bac 1 - 25 VU 1-9,text,true,,444,165,15,15,http://127.0.0.1:3000/api/products/326,3,0,0
1787400658938,7,01 Login,200,OK,Bac 1 - 25 VU 1-2,text,true,,641,231,15,15,http://127.0.0.1:3000/api/login,7,0,2
1787400659032,6,01 Login,200,OK,Bac 1 - 25 VU 1-14,text,true,,643,232,15,15,http://127.0.0.1:3000/api/login,6,0,1
1787400659077,10,02 Search products,200,OK,Bac 1 - 25 VU 1-12,text,true,,449,185,15,15,http://127.0.0.1:3000/api/products?search=PerfProduct-2468,10,0,0
1787400659092,9,06 Checkout,200,OK,Bac 1 - 25 VU 1-7,text,true,,314,421,15,15,http://127.0.0.1:3000/api/checkout,9,0,0
1787400659250,2,07 Login sai (lockout),401,Unauthorized,Bac 1 - 25 VU 1-3,text,true,,314,233,16,16,http://127.0.0.1:3000/api/login,2,0,0
1787400659265,2,07 Login sai (lockout),401,Unauthorized,Bac 1 - 25 VU 1-4,text,true,,314,233,16,16,http://127.0.0.1:3000/api/login,2,0,0
1787400659405,4,05 Apply coupon,200,OK,Bac 1 - 25 VU 1-6,text,true,,400,238,16,16,http://127.0.0.1:3000/api/apply-coupon,4,0,0
1787400659420,7,04 Add to cart,200,OK,Bac 1 - 25 VU 1-9,text,true,,294,368,16,16,http://127.0.0.1:3000/api/cart,7,0,0
1787400659420,7,03 Product detail,200,OK,Bac 1 - 25 VU 1-11,text,true,,445,165,16,16,http://127.0.0.1:3000/api/products/406,7,0,0
1787400659420,16,06 Checkout,200,OK,Bac 1 - 25 VU 1-8,text,true,,314,423,16,16,http://127.0.0.1:3000/api/checkout,16,0,0
1787400659452,3,05 Apply coupon,200,OK,Bac 1 - 25 VU 1-10,text,true,,400,239,16,16,http://127.0.0.1:3000/api/apply-coupon,3,0,0
1787400659468,3,07 Login sai (lockout),401,Unauthorized,Bac 1 - 25 VU 1-5,text,true,,314,233,16,16,http://127.0.0.1:3000/api/login,3,0,0
1787400659483,10,02 Search products,200,OK,Bac 1 - 25 VU 1-1,text,true,,446,185,16,16,http://127.0.0.1:3000/api/products?search=PerfProduct-4680,10,0,0
1787400659530,12,02 Search products,200,OK,Bac 1 - 25 VU 1-13,text,true,,447,185,17,17,http://127.0.0.1:3000/api/products?search=PerfProduct-3579,12,0,0
1787400659654,7,01 Login,200,OK,Bac 1 - 25 VU 1-15,text,true,,643,232,17,17,http://127.0.0.1:3000/api/login,7,0,2
1787400659685,10,02 Search products,200,OK,Bac 1 - 25 VU 1-14,text,true,,448,185,17,17,http://127.0.0.1:3000/api/products?search=PerfProduct-6802,10,0,0
1787400659826,7,02 Search products,200,OK,Bac 1 - 25 VU 1-2,text,true,,449,185,17,17,http://127.0.0.1:3000/api/products?search=PerfProduct-5791,7,0,0
1787400659843,6,01 Login,200,OK,Bac 1 - 25 VU 1-16,text,true,,643,232,17,17,http://127.0.0.1:3000/api/login,6,0,3
1787400659903,2,03 Product detail,200,OK,Bac 1 - 25 VU 1-12,text,true,,445,165,17,17,http://127.0.0.1:3000/api/products/446,2,0,0
1787400659982,5,01 Login,200,OK,Bac 1 - 25 VU 1-4,text,true,,643,232,18,18,http://127.0.0.1:3000/api/login,5,0,1
1787400659982,6,01 Login,200,OK,Bac 1 - 25 VU 1-5,text,true,,643,232,18,18,http://127.0.0.1:3000/api/login,6,0,2
1787400660014,3,03 Product detail,200,OK,Bac 1 - 25 VU 1-14,text,true,,445,165,18,18,http://127.0.0.1:3000/api/products/606,3,0,0
1787400660045,4,04 Add to cart,200,OK,Bac 1 - 25 VU 1-11,text,true,,294,368,18,18,http://127.0.0.1:3000/api/cart,4,0,0
1787400660076,3,03 Product detail,200,OK,Bac 1 - 25 VU 1-1,text,true,,445,165,18,18,http://127.0.0.1:3000/api/products/526,3,0,0
1787400660091,5,03 Product detail,200,OK,Bac 1 - 25 VU 1-13,text,true,,445,165,18,18,http://127.0.0.1:3000/api/products/486,5,0,0
1787400660107,3,07 Login sai (lockout),401,Unauthorized,Bac 1 - 25 VU 1-7,text,true,,314,233,18,18,http://127.0.0.1:3000/api/login,3,0,0
1787400660155,12,02 Search products,200,OK,Bac 1 - 25 VU 1-16,text,true,,447,185,18,18,http://127.0.0.1:3000/api/products?search=PerfProduct-9024,12,0,0
1787400660201,7,02 Search products,200,OK,Bac 1 - 25 VU 1-15,text,true,,448,185,18,18,http://127.0.0.1:3000/api/products?search=PerfProduct-7913,7,0,0
1787400660201,9,01 Login,200,OK,Bac 1 - 25 VU 1-3,text,true,,643,232,18,18,http://127.0.0.1:3000/api/login,9,0,2
1787400660216,13,06 Checkout,200,OK,Bac 1 - 25 VU 1-6,text,true,,314,421,18,18,http://127.0.0.1:3000/api/checkout,13,0,0
1787400660264,11,06 Checkout,200,OK,Bac 1 - 25 VU 1-10,text,true,,314,424,18,18,http://127.0.0.1:3000/api/checkout,10,0,0
1787400660279,2,07 Login sai (lockout),401,Unauthorized,Bac 1 - 25 VU 1-8,text,true,,314,234,18,18,http://127.0.0.1:3000/api/login,2,0,0
1787400660311,6,01 Login,200,OK,Bac 1 - 25 VU 1-17,text,true,,643,232,19,19,http://127.0.0.1:3000/api/login,6,0,2
1787400660403,2,05 Apply coupon,200,OK,Bac 1 - 25 VU 1-9,text,true,,400,239,19,19,http://127.0.0.1:3000/api/apply-coupon,2,0,0
1787400660466,4,05 Apply coupon,200,OK,Bac 1 - 25 VU 1-11,text,true,,400,239,19,19,http://127.0.0.1:3000/api/apply-coupon,4,0,0
1787400660513,5,04 Add to cart,200,OK,Bac 1 - 25 VU 1-14,text,true,,294,368,19,19,http://127.0.0.1:3000/api/cart,5,0,0
1787400660513,7,04 Add to cart,200,OK,Bac 1 - 25 VU 1-12,text,true,,294,368,19,19,http://127.0.0.1:3000/api/cart,7,0,0
1787400660545,6,01 Login,200,OK,Bac 1 - 25 VU 1-18,text,true,,643,232,19,19,http://127.0.0.1:3000/api/login,6,0,2
1787400660592,3,03 Product detail,200,OK,Bac 1 - 25 VU 1-2,text,true,,444,165,19,19,http://127.0.0.1:3000/api/products/566,2,0,0
1787400660623,6,01 Login,200,OK,Bac 1 - 25 VU 1-8,text,true,,643,232,19,19,http://127.0.0.1:3000/api/login,6,0,2
1787400660638,9,02 Search products,200,OK,Bac 1 - 25 VU 1-4,text,true,,449,185,19,19,http://127.0.0.1:3000/api/products?search=PerfProduct-8135,9,0,0
1787400660684,4,07 Login sai (lockout),401,Unauthorized,Bac 1 - 25 VU 1-10,text,true,,314,234,19,19,http://127.0.0.1:3000/api/login,3,0,0
1787400660700,3,03 Product detail,200,OK,Bac 1 - 25 VU 1-15,text,true,,444,165,19,19,http://127.0.0.1:3000/api/products/646,3,0,0
1787400660731,2,04 Add to cart,200,OK,Bac 1 - 25 VU 1-13,text,true,,294,368,20,20,http://127.0.0.1:3000/api/cart,2,0,0
1787400660747,7,02 Search products,200,OK,Bac 1 - 25 VU 1-17,text,true,,480,193,20,20,http://127.0.0.1:3000/api/products?search=Samsung+Galaxy+S24+Ultra,7,0,0
1787400660826,7,02 Search products,200,OK,Bac 1 - 25 VU 1-3,text,true,,2267,185,20,20,http://127.0.0.1:3000/api/products?search=PerfProduct-1357,7,0,0
1787400660841,10,06 Checkout,200,OK,Bac 1 - 25 VU 1-9,text,true,,314,423,20,20,http://127.0.0.1:3000/api/checkout,10,0,0
1787400660888,7,01 Login,200,OK,Bac 1 - 25 VU 1-7,text,true,,643,232,20,20,http://127.0.0.1:3000/api/login,7,0,2
1787400660903,3,04 Add to cart,200,OK,Bac 1 - 25 VU 1-1,text,true,,294,368,20,20,http://127.0.0.1:3000/api/cart,3,0,0
1787400660950,12,06 Checkout,200,OK,Bac 1 - 25 VU 1-11,text,true,,314,424,20,20,http://127.0.0.1:3000/api/checkout,12,0,0
1787400660982,7,02 Search products,200,OK,Bac 1 - 25 VU 1-5,text,true,,453,186,20,20,http://127.0.0.1:3000/api/products?search=iPhone+15+Pro+Max,6,0,0
1787400660998,5,01 Login,200,OK,Bac 1 - 25 VU 1-19,text,true,,643,232,20,20,http://127.0.0.1:3000/api/login,5,0,1
1787400660998,7,01 Login,200,OK,Bac 1 - 25 VU 1-10,text,true,,643,232,20,20,http://127.0.0.1:3000/api/login,7,0,1
1787400661075,2,03 Product detail,200,OK,Bac 1 - 25 VU 1-17,text,true,,445,165,20,20,http://127.0.0.1:3000/api/products/846,2,0,0
1787400661122,4,05 Apply coupon,200,OK,Bac 1 - 25 VU 1-14,text,true,,399,238,21,21,http://127.0.0.1:3000/api/apply-coupon,4,0,0
1787400661138,3,03 Product detail,200,OK,Bac 1 - 25 VU 1-16,text,true,,445,165,21,21,http://127.0.0.1:3000/api/products/686,3,0,0
1787400661184,4,07 Login sai (lockout),401,Unauthorized,Bac 1 - 25 VU 1-9,text,true,,314,234,21,21,http://127.0.0.1:3000/api/login,4,0,0
1787400661185,8,02 Search products,200,OK,Bac 1 - 25 VU 1-18,text,true,,450,183,21,21,http://127.0.0.1:3000/api/products?search=MacBook+Pro+M3,8,0,0
1787400661185,9,01 Login,200,OK,Bac 1 - 25 VU 1-20,text,true,,643,232,21,21,http://127.0.0.1:3000/api/login,9,0,2
1787400661201,3,03 Product detail,200,OK,Bac 1 - 25 VU 1-4,text,true,,445,165,21,21,http://127.0.0.1:3000/api/products/766,3,0,0
1787400661201,3,07 Login sai (lockout),401,Unauthorized,Bac 1 - 25 VU 1-6,text,true,,314,233,21,21,http://127.0.0.1:3000/api/login,3,0,0
1787400661324,10,02 Search products,200,OK,Bac 1 - 25 VU 1-8,text,true,,267,192,21,21,http://127.0.0.1:3000/api/products?search=Ban+phim+co+Keychron+Q1,10,0,0
1787400661355,4,04 Add to cart,200,OK,Bac 1 - 25 VU 1-2,text,true,,294,368,21,21,http://127.0.0.1:3000/api/cart,4,0,0
1787400661355,10,02 Search products,200,OK,Bac 1 - 25 VU 1-10,text,true,,20420,184,21,21,http://127.0.0.1:3000/api/products?search=PerfProduct-112,10,0,0
1787400661387,7,02 Search products,200,OK,Bac 1 - 25 VU 1-7,text,true,,461,191,21,21,http://127.0.0.1:3000/api/products?search=Tai+nghe+AirPods+Pro+2,7,0,0
1787400661418,4,04 Add to cart,200,OK,Bac 1 - 25 VU 1-15,text,true,,294,368,21,21,http://127.0.0.1:3000/api/cart,3,0,0
1787400661466,10,02 Search products,200,OK,Bac 1 - 25 VU 1-19,text,true,,20429,184,21,21,http://127.0.0.1:3000/api/products?search=PerfProduct-100,10,0,0
1787400661466,11,05 Apply coupon,200,OK,Bac 1 - 25 VU 1-12,text,true,,400,239,21,21,http://127.0.0.1:3000/api/apply-coupon,11,0,0
1787400661481,5,01 Login,200,OK,Bac 1 - 25 VU 1-21,text,true,,643,232,21,21,http://127.0.0.1:3000/api/login,5,0,3
1787400661496,3,07 Login sai (lockout),401,Unauthorized,Bac 1 - 25 VU 1-11,text,true,,314,234,22,22,http://127.0.0.1:3000/api/login,3,0,0
1787400661543,3,04 Add to cart,200,OK,Bac 1 - 25 VU 1-16,text,true,,294,368,22,22,http://127.0.0.1:3000/api/cart,3,0,0
1787400661558,3,05 Apply coupon,200,OK,Bac 1 - 25 VU 1-1,text,true,,400,239,22,22,http://127.0.0.1:3000/api/apply-coupon,3,0,0
1787400661590,13,06 Checkout,200,OK,Bac 1 - 25 VU 1-14,text,true,,314,423,22,22,http://127.0.0.1:3000/api/checkout,13,0,0
1787400661606,2,05 Apply coupon,200,OK,Bac 1 - 25 VU 1-13,text,true,,400,239,22,22,http://127.0.0.1:3000/api/apply-coupon,2,0,0
1787400661622,5,01 Login,200,OK,Bac 1 - 25 VU 1-6,text,true,,643,232,22,22,http://127.0.0.1:3000/api/login,5,0,1
1787400661714,5,04 Add to cart,200,OK,Bac 1 - 25 VU 1-4,text,true,,294,368,22,22,http://127.0.0.1:3000/api/cart,5,0,0
1787400661729,7,05 Apply coupon,200,OK,Bac 1 - 25 VU 1-15,text,true,,399,238,22,22,http://127.0.0.1:3000/api/apply-coupon,7,0,0
1787400661730,8,01 Login,200,OK,Bac 1 - 25 VU 1-9,text,true,,643,232,22,22,http://127.0.0.1:3000/api/login,8,0,2
1787400661745,2,03 Product detail,200,OK,Bac 1 - 25 VU 1-5,text,true,,445,165,22,22,http://127.0.0.1:3000/api/products/806,2,0,0
1787400661776,5,03 Product detail,200,OK,Bac 1 - 25 VU 1-8,text,true,,444,165,22,22,http://127.0.0.1:3000/api/products/966,5,0,0
1787400661822,4,04 Add to cart,200,OK,Bac 1 - 25 VU 1-17,text,true,,294,368,22,22,http://127.0.0.1:3000/api/cart,4,0,0
1787400661822,5,03 Product detail,200,OK,Bac 1 - 25 VU 1-3,text,true,,445,165,22,22,http://127.0.0.1:3000/api/products/726,5,0,0
1787400661884,14,02 Search products,200,OK,Bac 1 - 25 VU 1-21,text,true,,20426,184,22,22,http://127.0.0.1:3000/api/products?search=PerfProduct-134,14,0,0
1787400661884,15,03 Product detail,200,OK,Bac 1 - 25 VU 1-10,text,true,,448,166,22,22,http://127.0.0.1:3000/api/products/1046,15,0,0
1787400661993,19,06 Checkout,200,OK,Bac 1 - 25 VU 1-13,text,true,,314,424,23,23,http://127.0.0.1:3000/api/checkout,19,0,0
1787400661993,35,02 Search products,200,OK,Bac 1 - 25 VU 1-20,text,true,,20431,184,23,23,http://127.0.0.1:3000/api/products?search=PerfProduct-128,35,0,0
1787400662025,6,03 Product detail,200,OK,Bac 1 - 25 VU 1-18,text,true,,445,165,23,23,http://127.0.0.1:3000/api/products/886,5,0,0
1787400662087,4,04 Add to cart,200,OK,Bac 1 - 25 VU 1-5,text,true,,294,368,23,23,http://127.0.0.1:3000/api/cart,4,0,0
1787400662149,4,05 Apply coupon,200,OK,Bac 1 - 25 VU 1-2,text,true,,400,239,23,23,http://127.0.0.1:3000/api/apply-coupon,4,0,0
1787400662181,17,02 Search products,200,OK,Bac 1 - 25 VU 1-9,text,true,,20433,184,23,23,http://127.0.0.1:3000/api/products?search=PerfProduct-147,17,0,0
1787400662198,7,01 Login,200,OK,Bac 1 - 25 VU 1-22,text,true,,643,232,23,23,http://127.0.0.1:3000/api/login,7,0,2
1787400662228,17,06 Checkout,200,OK,Bac 1 - 25 VU 1-12,text,true,,314,424,23,23,http://127.0.0.1:3000/api/checkout,17,0,0
1787400662244,3,03 Product detail,200,OK,Bac 1 - 25 VU 1-7,text,true,,445,165,23,23,http://127.0.0.1:3000/api/products/926,3,0,0
1787400662306,5,07 Login sai (lockout),401,Unauthorized,Bac 1 - 25 VU 1-14,text,true,,314,233,24,24,http://127.0.0.1:3000/api/login,4,0,0
1787400662322,13,06 Checkout,200,OK,Bac 1 - 25 VU 1-1,text,true,,314,424,24,24,http://127.0.0.1:3000/api/checkout,13,0,0
1787400662338,4,05 Apply coupon,200,OK,Bac 1 - 25 VU 1-16,text,true,,399,238,24,24,http://127.0.0.1:3000/api/apply-coupon,4,0,0
1787400662355,4,04 Add to cart,200,OK,Bac 1 - 25 VU 1-3,text,true,,294,368,24,24,http://127.0.0.1:3000/api/cart,4,0,0
1787400662370,4,05 Apply coupon,200,OK,Bac 1 - 25 VU 1-4,text,true,,399,239,24,24,http://127.0.0.1:3000/api/apply-coupon,4,0,0
1787400662387,7,01 Login,200,OK,Bac 1 - 25 VU 1-23,text,true,,643,232,24,24,http://127.0.0.1:3000/api/login,7,0,2
1787400662401,16,02 Search products,200,OK,Bac 1 - 25 VU 1-6,text,true,,20422,184,24,24,http://127.0.0.1:3000/api/products?search=PerfProduct-156,16,0,0
1787400662417,4,07 Login sai (lockout),401,Unauthorized,Bac 1 - 25 VU 1-13,text,true,,314,234,24,24,http://127.0.0.1:3000/api/login,4,0,0
1787400662464,3,03 Product detail,200,OK,Bac 1 - 25 VU 1-19,text,true,,447,166,24,24,http://127.0.0.1:3000/api/products/1006,3,0,0
1787400662480,7,01 Login,200,OK,Bac 1 - 25 VU 1-11,text,true,,643,232,24,24,http://127.0.0.1:3000/api/login,7,0,2
1787400662496,3,03 Product detail,200,OK,Bac 1 - 25 VU 1-21,text,true,,448,166,24,24,http://127.0.0.1:3000/api/products/1126,3,0,0
1787400662526,5,04 Add to cart,200,OK,Bac 1 - 25 VU 1-18,text,true,,294,368,24,24,http://127.0.0.1:3000/api/cart,5,0,0
1787400662558,19,06 Checkout,200,OK,Bac 1 - 25 VU 1-15,text,true,,314,423,24,24,http://127.0.0.1:3000/api/checkout,19,0,0
1787400662574,15,06 Checkout,200,OK,Bac 1 - 25 VU 1-2,text,true,,314,424,24,24,http://127.0.0.1:3000/api/checkout,15,0,0
1787400662635,5,04 Add to cart,200,OK,Bac 1 - 25 VU 1-10,text,true,,294,369,24,24,http://127.0.0.1:3000/api/cart,4,0,0
1787400662651,5,05 Apply coupon,200,OK,Bac 1 - 25 VU 1-17,text,true,,400,239,24,24,http://127.0.0.1:3000/api/apply-coupon,5,0,0
1787400662667,5,04 Add to cart,200,OK,Bac 1 - 25 VU 1-8,text,true,,294,368,24,24,http://127.0.0.1:3000/api/cart,5,0,0
1787400662667,9,01 Login,200,OK,Bac 1 - 25 VU 1-14,text,true,,643,232,24,24,http://127.0.0.1:3000/api/login,9,0,2
1787400662698,4,04 Add to cart,200,OK,Bac 1 - 25 VU 1-7,text,true,,294,368,25,25,http://127.0.0.1:3000/api/cart,4,0,0
1787400662760,3,07 Login sai (lockout),401,Unauthorized,Bac 1 - 25 VU 1-1,text,true,,314,234,25,25,http://127.0.0.1:3000/api/login,3,0,0
1787400662823,7,05 Apply coupon,200,OK,Bac 1 - 25 VU 1-5,text,true,,400,239,25,25,http://127.0.0.1:3000/api/apply-coupon,6,0,0
1787400662823,6,05 Apply coupon,200,OK,Bac 1 - 25 VU 1-3,text,true,,399,238,25,25,http://127.0.0.1:3000/api/apply-coupon,6,0,0
1787400662823,6,01 Login,200,OK,Bac 1 - 25 VU 1-13,text,true,,643,232,25,25,http://127.0.0.1:3000/api/login,6,0,1
1787400662855,18,06 Checkout,200,OK,Bac 1 - 25 VU 1-16,text,true,,314,423,25,25,http://127.0.0.1:3000/api/checkout,18,0,0
1787400662902,3,03 Product detail,200,OK,Bac 1 - 25 VU 1-20,text,true,,448,166,25,25,http://127.0.0.1:3000/api/products/1086,3,0,0
1787400662917,13,06 Checkout,200,OK,Bac 1 - 25 VU 1-4,text,true,,314,424,25,25,http://127.0.0.1:3000/api/checkout,13,0,0
1787400662933,5,07 Login sai (lockout),401,Unauthorized,Bac 1 - 25 VU 1-15,text,true,,314,234,25,25,http://127.0.0.1:3000/api/login,4,0,0
1787400662964,18,02 Search products,200,OK,Bac 1 - 25 VU 1-11,text,true,,20432,184,25,25,http://127.0.0.1:3000/api/products?search=PerfProduct-178,18,0,0
1787400662964,19,03 Product detail,200,OK,Bac 1 - 25 VU 1-6,text,true,,448,166,25,25,http://127.0.0.1:3000/api/products/1206,19,0,0
1787400662964,20,05 Apply coupon,200,OK,Bac 1 - 25 VU 1-10,text,true,,400,239,25,25,http://127.0.0.1:3000/api/apply-coupon,20,0,0
1787400662980,19,02 Search products,200,OK,Bac 1 - 25 VU 1-22,text,true,,20434,184,25,25,http://127.0.0.1:3000/api/products?search=PerfProduct-163,19,0,0
1787400663011,16,06 Checkout,200,OK,Bac 1 - 25 VU 1-17,text,true,,314,424,25,25,http://127.0.0.1:3000/api/checkout,16,0,0
1787400663026,5,07 Login sai (lockout),401,Unauthorized,Bac 1 - 25 VU 1-12,text,true,,314,234,25,25,http://127.0.0.1:3000/api/login,5,0,0
1787400663057,4,05 Apply coupon,200,OK,Bac 1 - 25 VU 1-18,text,true,,400,239,25,25,http://127.0.0.1:3000/api/apply-coupon,4,0,0
1787400663105,3,03 Product detail,200,OK,Bac 1 - 25 VU 1-9,text,true,,448,166,25,25,http://127.0.0.1:3000/api/products/1166,3,0,0
1787400663121,4,05 Apply coupon,200,OK,Bac 1 - 25 VU 1-7,text,true,,400,239,25,25,http://127.0.0.1:3000/api/apply-coupon,4,0,0
1787400663182,16,06 Checkout,200,OK,Bac 1 - 25 VU 1-3,text,true,,314,423,25,25,http://127.0.0.1:3000/api/checkout,16,0,0
1787400663182,17,05 Apply coupon,200,OK,Bac 1 - 25 VU 1-8,text,true,,400,239,25,25,http://127.0.0.1:3000/api/apply-coupon,17,0,0
1787400663230,7,01 Login,200,OK,Bac 1 - 25 VU 1-24,text,true,,643,232,25,25,http://127.0.0.1:3000/api/login,7,0,2
1787400663261,4,01 Login,200,OK,Bac 1 - 25 VU 1-25,text,true,,643,232,25,25,http://127.0.0.1:3000/api/login,4,0,1
1787400663276,9,02 Search products,200,OK,Bac 1 - 25 VU 1-23,text,true,,20431,184,25,25,http://127.0.0.1:3000/api/products?search=PerfProduct-185,9,0,0
1787400663324,16,02 Search products,200,OK,Bac 1 - 25 VU 1-14,text,true,,2270,185,25,25,http://127.0.0.1:3000/api/products?search=PerfProduct-1234,16,0,0
1787400663387,16,06 Checkout,200,OK,Bac 1 - 25 VU 1-18,text,true,,314,424,25,25,http://127.0.0.1:3000/api/checkout,16,0,0
1787400663403,6,01 Login,200,OK,Bac 1 - 25 VU 1-15,text,true,,643,232,25,25,http://127.0.0.1:3000/api/login,6,0,2
1787400663417,4,04 Add to cart,200,OK,Bac 1 - 25 VU 1-21,text,true,,294,369,25,25,http://127.0.0.1:3000/api/cart,4,0,0
1787400663449,4,07 Login sai (lockout),401,Unauthorized,Bac 1 - 25 VU 1-2,text,true,,314,234,25,25,http://127.0.0.1:3000/api/login,4,0,0
1787400663465,12,06 Checkout,200,OK,Bac 1 - 25 VU 1-10,text,true,,314,424,25,25,http://127.0.0.1:3000/api/checkout,12,0,0
1787400663481,4,04 Add to cart,200,OK,Bac 1 - 25 VU 1-19,text,true,,294,369,25,25,http://127.0.0.1:3000/api/cart,4,0,0


=== results/resources/23127183_Stress_20260822-191048.resources.csv (đầy đủ, 2 giây/mẫu) ===
timestamp_iso,epoch_ms,process,pid,cpu_percent_of_one_core,working_set_mb,private_mb,threads,handles
2026-08-22T19:10:53.346,1787400653346,node,3728,0,77.93,87.09,12,206
2026-08-22T19:10:53.346,1787400653346,node,14084,0,76.73,75.07,17,184
2026-08-22T19:10:53.346,1787400653346,java,13316,301.6,226.56,1234.55,236,1553
2026-08-22T19:10:55.411,1787400655411,node,3728,2.3,78,87.18,12,209
2026-08-22T19:10:55.411,1787400655411,node,14084,0,77.06,75.08,17,183
2026-08-22T19:10:55.411,1787400655411,java,13316,48.4,224.54,1232.05,236,1567
2026-08-22T19:10:57.452,1787400657452,node,3728,2.3,78.05,87.21,12,215
2026-08-22T19:10:57.452,1787400657452,node,14084,0,77.06,75.08,17,183
2026-08-22T19:10:57.452,1787400657452,java,13316,29.1,209.05,1216.13,236,1585
2026-08-22T19:10:59.498,1787400659498,node,3728,3.1,78.74,88.72,12,219
2026-08-22T19:10:59.498,1787400659498,node,14084,0,77.06,75.08,17,183
2026-08-22T19:10:59.498,1787400659498,java,13316,12.2,209.86,1216.95,236,1597
2026-08-22T19:11:01.527,1787400661527,node,3728,3.9,80.48,88.57,12,226
2026-08-22T19:11:01.527,1787400661527,node,14084,0,77.07,75.32,17,183
2026-08-22T19:11:01.527,1787400661527,java,13316,11.6,201.77,1209.56,236,1618
2026-08-22T19:11:03.559,1787400663559,node,3728,6.9,80.79,88.73,12,230
2026-08-22T19:11:03.559,1787400663559,node,14084,0,77.07,75.32,17,183
2026-08-22T19:11:03.559,1787400663559,java,13316,29.2,205.93,1213.42,236,1630
2026-08-22T19:11:05.580,1787400665580,node,3728,13.1,80.83,88.73,12,230
2026-08-22T19:11:05.580,1787400665580,node,14084,0,77.08,75.32,17,183
2026-08-22T19:11:05.580,1787400665580,java,13316,20.1,209.02,1216.42,236,1630
2026-08-22T19:11:07.607,1787400667607,node,3728,22.4,80.89,87.63,12,230
2026-08-22T19:11:07.607,1787400667607,node,14084,1.5,58.05,55.02,17,183
2026-08-22T19:11:07.607,1787400667607,java,13316,29.3,207.12,1213.67,236,1630
2026-08-22T19:11:09.628,1787400669628,node,3728,19.3,81.34,88.79,12,230
2026-08-22T19:11:09.628,1787400669628,node,14084,0,58.05,55.02,17,183
2026-08-22T19:11:09.628,1787400669628,java,13316,15.5,212.62,1219.43,236,1630
2026-08-22T19:11:11.643,1787400671643,node,3728,18.6,81.39,88.8,12,230
2026-08-22T19:11:11.643,1787400671643,node,14084,0,58.05,55.02,17,183
2026-08-22T19:11:11.643,1787400671643,java,13316,11.6,211,1210.77,236,1630
2026-08-22T19:11:13.656,1787400673656,node,3728,22.5,81.39,88.8,12,230
2026-08-22T19:11:13.656,1787400673656,node,14084,0,58.06,55.02,17,183
2026-08-22T19:11:13.656,1787400673656,java,13316,14,219.08,1218.79,236,1630
2026-08-22T19:11:15.675,1787400675675,node,3728,24,82.02,89.44,12,230
2026-08-22T19:11:15.675,1787400675675,node,14084,0,58.06,55.02,17,183
2026-08-22T19:11:15.675,1787400675675,java,13316,14.7,219.5,1219.04,236,1630
2026-08-22T19:11:17.703,1787400677703,node,3728,23.1,83.61,89.44,12,230
2026-08-22T19:11:17.703,1787400677703,node,14084,0,58.06,55.02,17,183
2026-08-22T19:11:17.703,1787400677703,java,13316,11.6,214.5,1214.06,236,1630
2026-08-22T19:11:19.733,1787400679733,node,3728,10.8,84.5,89.44,12,230
2026-08-22T19:11:19.733,1787400679733,node,14084,0,58,54.92,14,183
2026-08-22T19:11:19.733,1787400679733,java,13316,12.3,218.66,1217.98,236,1630
2026-08-22T19:11:21.766,1787400681766,node,3728,15.4,85.73,89.44,12,230
2026-08-22T19:11:21.766,1787400681766,node,14084,0,58,54.92,14,183
2026-08-22T19:11:21.766,1787400681766,java,13316,7.7,213.45,1212.74,236,1630
2026-08-22T19:11:23.784,1787400683784,node,3728,18.6,85.73,89.44,12,230
2026-08-22T19:11:23.784,1787400683784,node,14084,0,58,54.92,14,183
2026-08-22T19:11:23.784,1787400683784,java,13316,7,219.03,1218.53,238,1629
2026-08-22T19:11:25.816,1787400685816,node,3728,20.8,85.73,89.44,12,230
2026-08-22T19:11:25.816,1787400685816,node,14084,0,58,54.92,14,183
2026-08-22T19:11:25.816,1787400685816,java,13316,7.7,221.39,1220.75,238,1629
2026-08-22T19:11:27.854,1787400687854,node,3728,33,85.73,89.44,12,230
2026-08-22T19:11:27.854,1787400687854,node,14084,0,58,54.92,14,183
2026-08-22T19:11:27.854,1787400687854,java,13316,14.6,217.93,1217.3,238,1629
2026-08-22T19:11:29.880,1787400689880,node,3728,14.7,85.74,89.44,12,231
2026-08-22T19:11:29.880,1787400689880,node,14084,0,58,54.92,14,183
2026-08-22T19:11:29.880,1787400689880,java,13316,23.9,223.92,1223.39,238,1629
2026-08-22T19:11:31.900,1787400691900,node,3728,41,86.24,105.42,12,230
2026-08-22T19:11:31.900,1787400691900,node,14084,0,58,54.92,14,183
2026-08-22T19:11:31.900,1787400691900,java,13316,18.6,212.89,1212.41,238,1629
2026-08-22T19:11:33.924,1787400693924,node,3728,9.3,87.57,106.23,12,230
2026-08-22T19:11:33.924,1787400693924,node,14084,0,58.01,54.92,14,183
2026-08-22T19:11:33.924,1787400693924,java,13316,30.9,218.5,1217.69,238,1629
2026-08-22T19:11:35.942,1787400695942,node,3728,27.1,90.55,106.25,12,230
2026-08-22T19:11:35.942,1787400695942,node,14084,0,58.01,54.92,14,183
2026-08-22T19:11:35.942,1787400695942,java,13316,8.5,220.79,1219.95,238,1629
2026-08-22T19:11:37.981,1787400697981,node,3728,32.2,92.55,106.96,12,230
2026-08-22T19:11:37.981,1787400697981,node,14084,0,58.01,54.92,14,183
2026-08-22T19:11:37.981,1787400697981,java,13316,4.6,213.17,1212.81,238,1629
2026-08-22T19:11:40.018,1787400700018,node,3728,13.8,93.36,106.96,12,231
2026-08-22T19:11:40.018,1787400700018,node,14084,0,58.01,54.92,14,183
2026-08-22T19:11:40.018,1787400700018,java,13316,19.2,223.77,1215.9,238,1629
2026-08-22T19:11:42.036,1787400702036,node,3728,20.9,96.51,106.96,12,231
2026-08-22T19:11:42.036,1787400702036,node,14084,0,58.01,54.92,14,183
2026-08-22T19:11:42.036,1787400702036,java,13316,7.7,220.51,1212.8,238,1629
2026-08-22T19:11:44.067,1787400704067,node,3728,23.8,97.96,106.96,12,230
2026-08-22T19:11:44.067,1787400704067,node,14084,0,58.01,54.92,14,183
2026-08-22T19:11:44.067,1787400704067,java,13316,9.2,225.87,1218.13,238,1629
2026-08-22T19:11:46.092,1787400706092,node,3728,17,97.97,106.96,12,230
2026-08-22T19:11:46.092,1787400706092,node,14084,0,58.01,54.92,14,183
2026-08-22T19:11:46.092,1787400706092,java,13316,5.4,226.02,1218.28,238,1629
2026-08-22T19:11:48.110,1787400708110,node,3728,13.9,97.97,106.96,12,230
2026-08-22T19:11:48.110,1787400708110,node,14084,0,58.01,54.92,14,183
2026-08-22T19:11:48.110,1787400708110,java,13316,3.1,220.95,1213.25,238,1629
2026-08-22T19:11:50.134,1787400710134,node,3728,25.5,97.97,106.96,12,230
2026-08-22T19:11:50.134,1787400710134,node,14084,0,58.01,54.92,14,183
2026-08-22T19:11:50.134,1787400710134,java,13316,1.5,221.61,1213.93,238,1629
2026-08-22T19:11:52.168,1787400712168,node,3728,17.7,97.97,106.96,12,231
2026-08-22T19:11:52.168,1787400712168,node,14084,0,58.01,54.92,14,183
2026-08-22T19:11:52.168,1787400712168,java,13316,10,221.54,1214.03,235,1629
2026-08-22T19:11:54.184,1787400714184,node,3728,12.4,97.97,106.96,12,230
2026-08-22T19:11:54.184,1787400714184,node,14084,0,58.02,54.92,14,183
2026-08-22T19:11:54.184,1787400714184,java,13316,8.5,227.77,1220.12,235,1629
2026-08-22T19:11:56.199,1787400716199,node,3728,10.1,99.86,110.33,12,230
2026-08-22T19:11:56.199,1787400716199,node,14084,0,58.03,54.89,13,183
2026-08-22T19:11:56.199,1787400716199,java,13316,5.4,228.45,1220.71,235,1629
2026-08-22T19:11:58.232,1787400718232,node,3728,10.8,97.71,106.89,12,230
2026-08-22T19:11:58.232,1787400718232,node,14084,0,58.03,54.89,13,183
2026-08-22T19:11:58.232,1787400718232,java,13316,5.4,222.65,1215.18,235,1629
2026-08-22T19:12:00.256,1787400720256,node,3728,21.6,99.05,107.71,12,230
2026-08-22T19:12:00.256,1787400720256,node,14084,0,58.03,54.89,13,183
2026-08-22T19:12:00.256,1787400720256,java,13316,7.7,232.22,1224.66,235,1629
2026-08-22T19:12:02.288,1787400722288,node,3728,17.7,97.4,105.21,12,230
2026-08-22T19:12:02.288,1787400722288,node,14084,0,58.03,54.89,13,183
2026-08-22T19:12:02.288,1787400722288,java,13316,3.1,220.21,1212.27,235,1629
2026-08-22T19:12:04.352,1787400724352,node,3728,15.1,97.5,105.31,12,230
2026-08-22T19:12:04.352,1787400724352,node,14084,0,58.03,54.89,13,183
2026-08-22T19:12:04.352,1787400724352,java,13316,25,232.48,1224.91,235,1629
2026-08-22T19:12:06.364,1787400726364,node,3728,25.6,97.5,105.31,12,230
2026-08-22T19:12:06.364,1787400726364,node,14084,0,58.03,54.89,13,183
2026-08-22T19:12:06.364,1787400726364,java,13316,21.7,238.84,1231.09,235,1629
2026-08-22T19:12:08.388,1787400728388,node,3728,25.5,97.77,105.6,12,230
2026-08-22T19:12:08.388,1787400728388,node,14084,0,58.03,54.89,13,183
2026-08-22T19:12:08.388,1787400728388,java,13316,9.3,224.52,1217.82,235,1629
2026-08-22T19:12:10.425,1787400730425,node,3728,10,97.82,105.7,12,230
2026-08-22T19:12:10.425,1787400730425,node,14084,0,58.03,54.89,13,183
2026-08-22T19:12:10.425,1787400730425,java,13316,3.1,224.73,1218,235,1629
2026-08-22T19:12:12.460,1787400732460,node,3728,37.6,98.27,106.16,12,230
2026-08-22T19:12:12.460,1787400732460,node,14084,0,58.03,54.89,13,183
2026-08-22T19:12:12.460,1787400732460,java,13316,16.9,228.39,1220.92,235,1629
2026-08-22T19:12:14.483,1787400734483,node,3728,21.6,98.28,107.09,12,230
2026-08-22T19:12:14.483,1787400734483,node,14084,0,58.04,54.89,13,183
2026-08-22T19:12:14.483,1787400734483,java,13316,17,228.64,1221.16,235,1629
2026-08-22T19:12:16.509,1787400736509,node,3728,18.5,98.23,107.03,12,230
2026-08-22T19:12:16.509,1787400736509,node,14084,0,58.04,54.89,13,183
2026-08-22T19:12:16.509,1787400736509,java,13316,2.3,228.65,1221.16,235,1629
2026-08-22T19:12:18.536,1787400738536,node,3728,10,98.23,107.03,12,231
2026-08-22T19:12:18.536,1787400738536,node,14084,0,58.04,54.89,13,183
2026-08-22T19:12:18.536,1787400738536,java,13316,7.7,221.79,1214.02,235,1629
2026-08-22T19:12:20.578,1787400740578,node,3728,7.7,99.29,107.59,12,230
2026-08-22T19:12:20.578,1787400740578,node,14084,0,58.04,54.89,13,183
2026-08-22T19:12:20.578,1787400740578,java,13316,1.5,222.13,1214.23,235,1629
2026-08-22T19:12:22.598,1787400742598,node,3728,13.9,99.29,108.46,12,230
2026-08-22T19:12:22.598,1787400742598,node,14084,0,58.04,54.89,13,183
2026-08-22T19:12:22.598,1787400742598,java,13316,1.5,223.75,1214.3,235,1629
2026-08-22T19:12:24.644,1787400744644,node,3728,13.7,99.29,108.46,12,233
2026-08-22T19:12:24.644,1787400744644,node,14084,0,58.04,54.89,13,183
2026-08-22T19:12:24.644,1787400744644,java,13316,14.5,237.71,1225.62,235,1638
2026-08-22T19:12:26.663,1787400746663,node,3728,17,99.3,108.46,12,237
2026-08-22T19:12:26.663,1787400746663,node,14084,0,58.04,54.89,13,183
2026-08-22T19:12:26.663,1787400746663,java,13316,17,241.32,1225.12,235,1650
2026-08-22T19:12:28.687,1787400748687,node,3728,30.9,99.39,108.46,12,243
2026-08-22T19:12:28.687,1787400748687,node,14084,0,58.04,54.89,13,183
2026-08-22T19:12:28.687,1787400748687,java,13316,34.7,250.91,1230.38,235,1671
2026-08-22T19:12:30.732,1787400750732,node,3728,19.9,99.39,109.3,12,249
2026-08-22T19:12:30.732,1787400750732,node,14084,0,58.04,54.89,13,183
2026-08-22T19:12:30.732,1787400750732,java,13316,5.3,256.25,1230.51,235,1686
2026-08-22T19:12:32.761,1787400752761,node,3728,23.1,99.4,109.3,12,253
2026-08-22T19:12:32.761,1787400752761,node,14084,0,58.04,54.89,13,183
2026-08-22T19:12:32.761,1787400752761,java,13316,3.1,247.1,1217.76,235,1698
2026-08-22T19:12:34.778,1787400754778,node,3728,24.8,99.4,109.3,12,255
2026-08-22T19:12:34.778,1787400754778,node,14084,0,58.04,54.89,13,183
2026-08-22T19:12:34.778,1787400754778,java,13316,2.3,253.05,1217.81,235,1704
2026-08-22T19:12:36.797,1787400756797,node,3728,24,98.68,107.86,12,255
2026-08-22T19:12:36.797,1787400756797,node,14084,0,58.05,54.89,13,183
2026-08-22T19:12:36.797,1787400756797,java,13316,0,253.05,1217.81,235,1704
2026-08-22T19:12:38.836,1787400758836,node,3728,39.9,99.78,108.7,12,255
2026-08-22T19:12:38.836,1787400758836,node,14084,0,58.05,54.89,13,183
2026-08-22T19:12:38.836,1787400758836,java,13316,13.8,255.84,1220.32,235,1704
2026-08-22T19:12:40.866,1787400760866,node,3728,43.9,99.91,108.7,12,255
2026-08-22T19:12:40.866,1787400760866,node,14084,0,58.05,54.89,13,183
2026-08-22T19:12:40.866,1787400760866,java,13316,18.5,256.36,1220.56,235,1704
2026-08-22T19:12:42.886,1787400762886,node,3728,54.9,99.91,108.7,12,256
2026-08-22T19:12:42.886,1787400762886,node,14084,0,58.05,54.89,13,183
2026-08-22T19:12:42.886,1787400762886,java,13316,20.9,251.98,1215.05,235,1704
2026-08-22T19:12:44.919,1787400764919,node,3728,23.1,99.91,108.7,12,255
2026-08-22T19:12:44.919,1787400764919,node,14084,0,58.05,54.89,13,183
2026-08-22T19:12:44.919,1787400764919,java,13316,1.5,252.14,1215.22,235,1704
2026-08-22T19:12:46.938,1787400766938,node,3728,29.4,99.91,108.7,12,255
2026-08-22T19:12:46.938,1787400766938,node,14084,0,58.05,54.89,13,183
2026-08-22T19:12:46.938,1787400766938,java,13316,11.6,256.23,1219.2,235,1704
2026-08-22T19:12:48.963,1787400768963,node,3728,41.7,99.91,108.7,12,255
2026-08-22T19:12:48.963,1787400768963,node,14084,0,58.05,54.89,13,183
2026-08-22T19:12:48.963,1787400768963,java,13316,25.5,264.88,1228.44,235,1704
2026-08-22T19:12:50.989,1787400770989,node,3728,44,100.15,108.96,12,255
2026-08-22T19:12:50.989,1787400770989,node,14084,0,58.05,54.89,13,183
2026-08-22T19:12:50.989,1787400770989,java,13316,10.8,265.41,1228.97,235,1704
2026-08-22T19:12:53.017,1787400773017,node,3728,33.9,100.15,108.96,12,255
2026-08-22T19:12:53.017,1787400773017,node,14084,0,58.05,54.89,13,183
2026-08-22T19:12:53.017,1787400773017,java,13316,13.9,255.02,1219.19,235,1704
2026-08-22T19:12:55.034,1787400775034,node,3728,45.7,100.16,108.96,12,255
2026-08-22T19:12:55.034,1787400775034,node,14084,0,58.05,54.89,13,183
2026-08-22T19:12:55.034,1787400775034,java,13316,15.5,267.36,1230.62,235,1704
2026-08-22T19:12:57.052,1787400777052,node,3728,41.8,100.17,108.96,12,256
2026-08-22T19:12:57.052,1787400777052,node,14084,0,58.05,54.89,13,183
2026-08-22T19:12:57.052,1787400777052,java,13316,48.8,275.63,1239.03,235,1704
2026-08-22T19:12:59.071,1787400779071,node,3728,56.5,65.86,67.79,12,255
2026-08-22T19:12:59.071,1787400779071,node,14084,0.8,58.05,54.89,13,183
2026-08-22T19:12:59.071,1787400779071,java,13316,61.9,283.82,1246.34,235,1704
2026-08-22T19:13:01.082,1787400781082,node,3728,40.4,70.21,74.46,12,256
2026-08-22T19:13:01.082,1787400781082,node,14084,0,58.05,54.89,13,183
2026-08-22T19:13:01.082,1787400781082,java,13316,28.7,287.42,1248.04,235,1704
2026-08-22T19:13:03.096,1787400783096,node,3728,35.7,73.69,76.54,12,255
2026-08-22T19:13:03.096,1787400783096,node,14084,0,58.05,54.89,13,183
2026-08-22T19:13:03.096,1787400783096,java,13316,7,256.96,1216.96,235,1704
2026-08-22T19:13:05.109,1787400785109,node,3728,40.4,77.91,87.18,12,255
2026-08-22T19:13:05.109,1787400785109,node,14084,0,58.05,54.89,13,183
2026-08-22T19:13:05.109,1787400785109,java,13316,5.4,260.42,1218.96,233,1702
2026-08-22T19:13:07.129,1787400787129,node,3728,46.4,80.39,84.77,12,255
2026-08-22T19:13:07.129,1787400787129,node,14084,0,58.06,54.89,13,183
2026-08-22T19:13:07.129,1787400787129,java,13316,12.4,263.55,1219.96,233,1702
2026-08-22T19:13:09.152,1787400789152,node,3728,56.4,81.09,85.28,12,255
2026-08-22T19:13:09.152,1787400789152,node,14084,0,58.06,54.89,13,183
2026-08-22T19:13:09.152,1787400789152,java,13316,12.4,273.88,1228.85,233,1702
2026-08-22T19:13:11.177,1787400791177,node,3728,48.6,84.07,104.67,12,255
2026-08-22T19:13:11.177,1787400791177,node,14084,0,58.06,54.89,13,183
2026-08-22T19:13:11.177,1787400791177,java,13316,16.2,284.68,1236.1,233,1702
2026-08-22T19:13:13.206,1787400793206,node,3728,35.4,83.45,103.32,12,255
2026-08-22T19:13:13.206,1787400793206,node,14084,0,58.06,54.89,13,183
2026-08-22T19:13:13.206,1787400793206,java,13316,26.2,270.87,1219.63,233,1702
2026-08-22T19:13:15.223,1787400795223,node,3728,41.8,88.99,103.32,12,255
2026-08-22T19:13:15.223,1787400795223,node,14084,0,58.06,54.89,13,183
2026-08-22T19:13:15.223,1787400795223,java,13316,10.8,290.22,1233.51,233,1702
2026-08-22T19:13:17.246,1787400797246,node,3728,48.7,94.73,103.61,12,255
2026-08-22T19:13:17.246,1787400797246,node,14084,0,58.06,54.89,13,183
2026-08-22T19:13:17.246,1787400797246,java,13316,3.9,295.24,1233.51,233,1702
2026-08-22T19:13:19.276,1787400799276,node,3728,40,95.82,103.61,12,255
2026-08-22T19:13:19.276,1787400799276,node,14084,0,58.06,54.89,13,183
2026-08-22T19:13:19.276,1787400799276,java,13316,4.6,285.19,1215.93,233,1702
2026-08-22T19:13:21.294,1787400801294,node,3728,45.7,96.75,103.61,12,255
2026-08-22T19:13:21.294,1787400801294,node,14084,0,58.13,54.95,13,183
2026-08-22T19:13:21.294,1787400801294,java,13316,7.7,297.24,1222.98,233,1702
2026-08-22T19:13:23.312,1787400803312,node,3728,34.1,95.79,102.48,12,256
2026-08-22T19:13:23.312,1787400803312,node,14084,0,58.13,54.95,13,183
2026-08-22T19:13:23.312,1787400803312,java,13316,5.4,296.57,1217.29,233,1702
2026-08-22T19:13:25.339,1787400805339,node,3728,47,98.84,106.14,12,255
2026-08-22T19:13:25.339,1787400805339,node,14084,0,58.13,54.95,13,183
2026-08-22T19:13:25.339,1787400805339,java,13316,20.8,321.75,1237.8,234,1705
2026-08-22T19:13:27.357,1787400807357,node,3728,41,99.26,107.35,12,255
2026-08-22T19:13:27.357,1787400807357,node,14084,0,58.14,54.95,13,183
2026-08-22T19:13:27.357,1787400807357,java,13316,3.9,327.33,1237.74,233,1702
2026-08-22T19:13:29.381,1787400809381,node,3728,37.8,99.27,107.36,12,255
2026-08-22T19:13:29.381,1787400809381,node,14084,0,58.14,54.95,13,183
2026-08-22T19:13:29.381,1787400809381,java,13316,7.7,312.1,1218,233,1702
2026-08-22T19:13:31.409,1787400811409,node,3728,36.2,99.34,107.37,12,256
2026-08-22T19:13:31.409,1787400811409,node,14084,0,58.14,54.95,13,183
2026-08-22T19:13:31.409,1787400811409,java,13316,3.9,317.51,1218,233,1702
2026-08-22T19:13:33.437,1787400813437,node,3728,40.8,99.7,107.38,12,255
2026-08-22T19:13:33.437,1787400813437,node,14084,0,58.14,54.95,13,183
2026-08-22T19:13:33.437,1787400813437,java,13316,6.9,322.89,1218.07,233,1702
2026-08-22T19:13:35.462,1787400815462,node,3728,34,101.68,109.72,12,255
2026-08-22T19:13:35.462,1787400815462,node,14084,0,58.14,54.95,13,183
2026-08-22T19:13:35.462,1787400815462,java,13316,3.9,328.02,1218.07,233,1702
2026-08-22T19:13:37.487,1787400817487,node,3728,42.4,100.89,107.83,12,255
2026-08-22T19:13:37.487,1787400817487,node,14084,0,58.14,54.95,13,183
2026-08-22T19:13:37.487,1787400817487,java,13316,5.4,333.79,1218.56,233,1702
2026-08-22T19:13:39.511,1787400819511,node,3728,36.3,101.01,107.95,12,255
2026-08-22T19:13:39.511,1787400819511,node,14084,0,58.14,54.95,13,183
2026-08-22T19:13:39.511,1787400819511,java,13316,7.7,342.97,1222.96,233,1702
2026-08-22T19:13:41.524,1787400821524,node,3728,40.4,101.07,107.98,12,255
2026-08-22T19:13:41.524,1787400821524,node,14084,0,58.14,54.95,13,183
2026-08-22T19:13:41.524,1787400821524,java,13316,10.1,349.6,1224.11,233,1702
2026-08-22T19:13:43.539,1787400823539,node,3728,40.3,101.08,107.99,12,255
2026-08-22T19:13:43.539,1787400823539,node,14084,0,58.14,54.95,13,183
2026-08-22T19:13:43.539,1787400823539,java,13316,14,354.62,1224.11,233,1702
2026-08-22T19:13:45.570,1787400825570,node,3728,42.3,101.09,107.99,12,255
2026-08-22T19:13:45.570,1787400825570,node,14084,0,58.14,54.95,13,183
2026-08-22T19:13:45.570,1787400825570,java,13316,5.4,359.74,1224.11,233,1702
2026-08-22T19:13:47.584,1787400827584,node,3728,40.4,101.1,107.99,12,255
2026-08-22T19:13:47.584,1787400827584,node,14084,0,58.14,54.95,13,183
2026-08-22T19:13:47.584,1787400827584,java,13316,4.7,365.05,1224.11,233,1702
2026-08-22T19:13:49.600,1787400829600,node,3728,45.7,101.29,108.25,12,255
2026-08-22T19:13:49.600,1787400829600,node,14084,0,58.14,54.95,13,183
2026-08-22T19:13:49.600,1787400829600,java,13316,6.2,369.76,1224.11,233,1702
2026-08-22T19:13:51.626,1787400831626,node,3728,40.9,100.27,107.7,12,256
2026-08-22T19:13:51.626,1787400831626,node,14084,0,58.14,54.95,13,183
2026-08-22T19:13:51.626,1787400831626,java,13316,6.2,374.93,1224.11,233,1702
2026-08-22T19:13:53.653,1787400833653,node,3728,37.8,99.09,105.78,12,257
2026-08-22T19:13:53.653,1787400833653,node,14084,0,58.14,54.95,13,183
2026-08-22T19:13:53.653,1787400833653,java,13316,6.2,380.15,1224.11,233,1705
2026-08-22T19:13:55.666,1787400835666,node,3728,50.5,99.41,106.19,12,261
2026-08-22T19:13:55.666,1787400835666,node,14084,0,58.14,54.95,13,183
2026-08-22T19:13:55.666,1787400835666,java,13316,7,386.63,1224.11,233,1720
2026-08-22T19:13:57.690,1787400837690,node,3728,49.4,99.56,106.34,12,268
2026-08-22T19:13:57.690,1787400837690,node,14084,0,58.14,54.95,13,183
2026-08-22T19:13:57.690,1787400837690,java,13316,6.2,394.71,1225.56,233,1741
2026-08-22T19:13:59.718,1787400839718,node,3728,52.4,100.07,106.74,12,276
2026-08-22T19:13:59.718,1787400839718,node,14084,0,58.15,54.95,13,183
2026-08-22T19:13:59.718,1787400839718,java,13316,6.9,402.86,1225.56,233,1765
2026-08-22T19:14:01.737,1787400841737,node,3728,62.7,100.07,106.74,12,283
2026-08-22T19:14:01.737,1787400841737,node,14084,0,58.15,54.95,13,183
2026-08-22T19:14:01.737,1787400841737,java,13316,12.4,410.96,1225.56,233,1786
2026-08-22T19:14:03.748,1787400843748,node,3728,58.3,100.11,107.65,12,289
2026-08-22T19:14:03.748,1787400843748,node,14084,0,58.15,54.95,13,183
2026-08-22T19:14:03.748,1787400843748,java,13316,11.7,419.4,1225.62,233,1804
2026-08-22T19:14:05.778,1787400845778,node,3728,85.5,99.77,107.67,12,298
2026-08-22T19:14:05.778,1787400845778,node,14084,0,58.15,54.95,13,183
2026-08-22T19:14:05.778,1787400845778,java,13316,13.1,435.57,1231.2,233,1828
2026-08-22T19:14:07.792,1787400847792,node,3728,78.3,101.91,108.91,12,302
2026-08-22T19:14:07.792,1787400847792,node,14084,0,58.15,54.95,13,183
2026-08-22T19:14:07.792,1787400847792,java,13316,10.9,445.55,1231.23,233,1846
2026-08-22T19:14:09.810,1787400849810,node,3728,82.8,101.95,108.91,12,306
2026-08-22T19:14:09.810,1787400849810,node,14084,0,58.15,54.95,13,183
2026-08-22T19:14:09.810,1787400849810,java,13316,13.2,456.18,1231.23,233,1852
2026-08-22T19:14:11.826,1787400851826,node,3728,78.3,100.01,106.48,12,306
2026-08-22T19:14:11.826,1787400851826,node,14084,0,58.15,54.95,13,183
2026-08-22T19:14:11.826,1787400851826,java,13316,6.2,465.66,1231.23,233,1852
2026-08-22T19:14:13.851,1787400853851,node,3728,69.5,100.41,107.05,12,306
2026-08-22T19:14:13.851,1787400853851,node,14084,0,58.15,54.95,13,183
2026-08-22T19:14:13.851,1787400853851,java,13316,10,475.39,1231.23,233,1852
2026-08-22T19:14:15.868,1787400855868,node,3728,74.4,101.24,107.87,12,305
2026-08-22T19:14:15.868,1787400855868,node,14084,0,58.15,54.95,13,183
2026-08-22T19:14:15.868,1787400855868,java,13316,7.7,485.29,1231.23,233,1852
2026-08-22T19:14:17.885,1787400857885,node,3728,77.5,100.55,107.68,12,305
2026-08-22T19:14:17.885,1787400857885,node,14084,0,58.15,54.95,13,183
2026-08-22T19:14:17.885,1787400857885,java,13316,11.6,495.71,1231.23,233,1852
2026-08-22T19:14:19.913,1787400859913,node,3728,63.2,100.66,107.63,12,305
2026-08-22T19:14:19.913,1787400859913,node,14084,0,58.16,54.95,13,183
2026-08-22T19:14:19.913,1787400859913,java,13316,11.6,505.02,1231.23,233,1852
2026-08-22T19:14:21.932,1787400861932,node,3728,65.8,101.06,108.1,12,306
2026-08-22T19:14:21.932,1787400861932,node,14084,0,58.16,54.95,13,183
2026-08-22T19:14:21.932,1787400861932,java,13316,9.3,515.23,1231.23,233,1852
2026-08-22T19:14:23.954,1787400863954,node,3728,68,101.09,108.1,12,305
2026-08-22T19:14:23.954,1787400863954,node,14084,0,58.16,54.95,13,183
2026-08-22T19:14:23.954,1787400863954,java,13316,10,524.66,1231.23,233,1852
2026-08-22T19:14:25.983,1787400865983,node,3728,85.5,100.41,107.6,12,305
2026-08-22T19:14:25.983,1787400865983,node,14084,0,58.16,54.95,13,183
2026-08-22T19:14:25.983,1787400865983,java,13316,13.9,534.9,1231.23,233,1852
2026-08-22T19:14:28.001,1787400868001,node,3728,79.8,101.95,109.74,12,305
2026-08-22T19:14:28.001,1787400868001,node,14084,0,58.16,54.95,13,183
2026-08-22T19:14:28.001,1787400868001,java,13316,7.7,545.3,1231.23,233,1852
2026-08-22T19:14:30.027,1787400870027,node,3728,75.6,100.72,107.47,12,305
2026-08-22T19:14:30.027,1787400870027,node,14084,0,58.16,54.95,13,183
2026-08-22T19:14:30.027,1787400870027,java,13316,17,560.92,1236.93,233,1852
2026-08-22T19:14:32.041,1787400872041,node,3728,83.8,101.39,108.49,12,305
2026-08-22T19:14:32.041,1787400872041,node,14084,0,58.16,54.95,13,183
2026-08-22T19:14:32.041,1787400872041,java,13316,11.6,571.18,1236.93,233,1852
2026-08-22T19:14:34.061,1787400874061,node,3728,80.4,101.47,108.51,12,305
2026-08-22T19:14:34.061,1787400874061,node,14084,0,58.16,54.95,13,183
2026-08-22T19:14:34.061,1787400874061,java,13316,7,581.43,1236.93,233,1852
2026-08-22T19:14:36.082,1787400876082,node,3728,80.4,100.18,107.09,12,305
2026-08-22T19:14:36.082,1787400876082,node,14084,0,58.16,54.95,13,183
2026-08-22T19:14:36.082,1787400876082,java,13316,9.3,591.2,1236.93,233,1852
2026-08-22T19:14:38.097,1787400878097,node,3728,79.1,100.38,107.26,12,305
2026-08-22T19:14:38.097,1787400878097,node,14084,0,58.16,54.95,13,183
2026-08-22T19:14:38.097,1787400878097,java,13316,13.2,601.09,1236.93,233,1852
2026-08-22T19:14:40.115,1787400880115,node,3728,81.3,100.55,107.55,12,305
2026-08-22T19:14:40.115,1787400880115,node,14084,0,58.16,54.95,13,183
2026-08-22T19:14:40.115,1787400880115,java,13316,10.8,611.16,1236.93,233,1852
2026-08-22T19:14:42.138,1787400882138,node,3728,74.2,100.57,107.55,12,305
2026-08-22T19:14:42.138,1787400882138,node,14084,0,58.16,54.95,13,183
2026-08-22T19:14:42.138,1787400882138,java,13316,10,621.68,1236.93,233,1853
2026-08-22T19:14:44.162,1787400884162,node,3728,78.7,101.39,108.52,12,305
2026-08-22T19:14:44.162,1787400884162,node,14084,0,58.16,54.95,13,183
2026-08-22T19:14:44.162,1787400884162,java,13316,7.7,632.14,1236.93,233,1853
2026-08-22T19:14:46.179,1787400886179,node,3728,70.5,101.39,108.52,12,306
2026-08-22T19:14:46.179,1787400886179,node,14084,0,58.16,54.95,13,183
2026-08-22T19:14:46.179,1787400886179,java,13316,10.1,641.92,1236.93,233,1853
2026-08-22T19:14:48.200,1787400888200,node,3728,86.6,101.45,108.92,12,305
2026-08-22T19:14:48.200,1787400888200,node,14084,0,58.16,54.95,13,183
2026-08-22T19:14:48.200,1787400888200,java,13316,7,651.85,1236.93,233,1853
2026-08-22T19:14:50.219,1787400890219,node,3728,80.5,101.46,108.93,12,305
2026-08-22T19:14:50.219,1787400890219,node,14084,0,58.17,54.95,13,183
2026-08-22T19:14:50.219,1787400890219,java,13316,8.5,661.71,1236.93,233,1853
2026-08-22T19:14:52.234,1787400892234,node,3728,73.7,100.28,107.07,12,305
2026-08-22T19:14:52.234,1787400892234,node,14084,0,58.17,54.95,13,183
2026-08-22T19:14:52.234,1787400892234,java,13316,9.3,672.43,1236.93,233,1853
2026-08-22T19:14:54.251,1787400894251,node,3728,78.2,100.98,107.75,12,305
2026-08-22T19:14:54.251,1787400894251,node,14084,0,58.17,54.95,13,183
2026-08-22T19:14:54.251,1787400894251,java,13316,7.7,682.32,1236.93,233,1853
2026-08-22T19:14:56.274,1787400896274,node,3728,79.5,100.98,107.75,12,305
2026-08-22T19:14:56.274,1787400896274,node,14084,0,58.17,54.95,13,183
2026-08-22T19:14:56.274,1787400896274,java,13316,11.6,692.19,1236.93,233,1853
2026-08-22T19:14:58.297,1787400898297,node,3728,74.1,101.04,108.62,12,305
2026-08-22T19:14:58.297,1787400898297,node,14084,0,58.17,54.95,13,183
2026-08-22T19:14:58.297,1787400898297,java,13316,13.1,701.96,1236.93,233,1853
2026-08-22T19:15:00.317,1787400900317,node,3728,80.5,101.87,109.35,12,305
2026-08-22T19:15:00.317,1787400900317,node,14084,0,58.17,54.95,13,183
2026-08-22T19:15:00.317,1787400900317,java,13316,14.7,712.08,1236.93,233,1853
2026-08-22T19:15:02.333,1787400902333,node,3728,85.2,101.91,109.35,12,305
2026-08-22T19:15:02.333,1787400902333,node,14084,0,58.17,54.95,13,183
2026-08-22T19:15:02.333,1787400902333,java,13316,12.4,721.76,1236.93,233,1853
2026-08-22T19:15:04.351,1787400904351,node,3728,78.2,101.91,109.35,12,305
2026-08-22T19:15:04.351,1787400904351,node,14084,0,58.17,54.95,13,183
2026-08-22T19:15:04.351,1787400904351,java,13316,8.5,731.55,1236.93,233,1853
2026-08-22T19:15:06.370,1787400906370,node,3728,72.8,101.93,109.35,12,305
2026-08-22T19:15:06.370,1787400906370,node,14084,0,58.17,54.95,13,183
2026-08-22T19:15:06.370,1787400906370,java,13316,3.9,741.87,1236.93,233,1853
2026-08-22T19:15:08.382,1787400908382,node,3728,80.7,100.36,107.07,12,305
2026-08-22T19:15:08.382,1787400908382,node,14084,0,58.17,54.95,13,183
2026-08-22T19:15:08.382,1787400908382,java,13316,15.5,754.68,1236.99,233,1853
2026-08-22T19:15:10.407,1787400910407,node,3728,84.1,101.41,108.02,12,305
2026-08-22T19:15:10.407,1787400910407,node,14084,0,58.18,54.95,13,183
2026-08-22T19:15:10.407,1787400910407,java,13316,9.3,754.68,1236.99,233,1853
2026-08-22T19:15:12.429,1787400912429,node,3728,75,101.43,108.02,12,306
2026-08-22T19:15:12.429,1787400912429,node,14084,0,58.18,54.95,13,183
2026-08-22T19:15:12.429,1787400912429,java,13316,10.8,754.68,1236.99,233,1853
2026-08-22T19:15:14.445,1787400914445,node,3728,77.5,101.43,108.02,12,305
2026-08-22T19:15:14.445,1787400914445,node,14084,0,58.18,54.95,13,183
2026-08-22T19:15:14.445,1787400914445,java,13316,5.4,754.68,1236.99,233,1853
2026-08-22T19:15:16.462,1787400916462,node,3728,65.1,100.34,107.04,12,306
2026-08-22T19:15:16.462,1787400916462,node,14084,0,58.18,54.95,13,183
2026-08-22T19:15:16.462,1787400916462,java,13316,7,754.68,1236.99,233,1853
2026-08-22T19:15:18.474,1787400918474,node,3728,81.5,102.06,109.35,12,305
2026-08-22T19:15:18.474,1787400918474,node,14084,0,58.18,54.95,13,183
2026-08-22T19:15:18.474,1787400918474,java,13316,13.2,754.68,1236.99,233,1853
2026-08-22T19:15:20.493,1787400920493,node,3728,74.3,102.09,109.35,12,305
2026-08-22T19:15:20.493,1787400920493,node,14084,0,58.18,54.95,13,183
2026-08-22T19:15:20.493,1787400920493,java,13316,7.7,754.81,1236.99,233,1853
2026-08-22T19:15:22.509,1787400922509,node,3728,74.4,102.1,109.35,12,305
2026-08-22T19:15:22.509,1787400922509,node,14084,0,58.18,54.95,13,183
2026-08-22T19:15:22.509,1787400922509,java,13316,16.3,755.42,1237.27,233,1853
2026-08-22T19:15:24.521,1787400924521,node,3728,82.3,102.15,109.35,12,310
2026-08-22T19:15:24.521,1787400924521,node,14084,0,58.18,54.95,13,183
2026-08-22T19:15:24.521,1787400924521,java,13316,8.5,755.58,1237.3,233,1868
2026-08-22T19:15:26.574,1787400926574,node,3728,90.6,102.19,109.37,12,321
2026-08-22T19:15:26.574,1787400926574,node,14084,0,58.18,54.95,13,183
2026-08-22T19:15:26.574,1787400926574,java,13316,12.9,755.95,1237.34,233,1898
2026-08-22T19:15:28.588,1787400928588,node,3728,83.8,102.21,109.37,12,331
2026-08-22T19:15:28.588,1787400928588,node,14084,0.8,58.18,54.95,13,183
2026-08-22T19:15:28.588,1787400928588,java,13316,14.7,756.2,1237.45,233,1928
2026-08-22T19:15:30.601,1787400930601,node,3728,101.7,101.5,109.23,12,340
2026-08-22T19:15:30.601,1787400930601,node,14084,0,58.18,54.95,13,183
2026-08-22T19:15:30.601,1787400930601,java,13316,8.5,756.67,1237.61,233,1958
2026-08-22T19:15:32.619,1787400932619,node,3728,100.7,102.08,109.36,12,351
2026-08-22T19:15:32.619,1787400932619,node,14084,0,58.18,54.95,13,183
2026-08-22T19:15:32.619,1787400932619,java,13316,13.9,757,1237.93,233,1988
2026-08-22T19:15:34.640,1787400934640,node,3728,112.9,102.08,109.36,12,359
2026-08-22T19:15:34.640,1787400934640,node,14084,0,58.18,54.95,13,183
2026-08-22T19:15:34.640,1787400934640,java,13316,10.8,738.95,1219.69,233,2015
2026-08-22T19:15:36.660,1787400936660,node,3728,103.6,102.09,109.36,12,369
2026-08-22T19:15:36.660,1787400936660,node,14084,0,58.18,54.95,13,183
2026-08-22T19:15:36.660,1787400936660,java,13316,9.3,739.14,1219.79,233,2048
2026-08-22T19:15:38.681,1787400938681,node,3728,112.1,101.57,108.46,12,382
2026-08-22T19:15:38.681,1787400938681,node,14084,0,58.18,54.95,13,183
2026-08-22T19:15:38.681,1787400938681,java,13316,10.8,739.36,1220.1,233,2081
2026-08-22T19:15:40.693,1787400940693,node,3728,110.2,102.43,108.47,12,392
2026-08-22T19:15:40.693,1787400940693,node,14084,0,58.18,54.95,13,183
2026-08-22T19:15:40.693,1787400940693,java,13316,13.2,740.54,1221.23,233,2111
2026-08-22T19:15:42.714,1787400942714,node,3728,91.2,103.98,110.27,12,400
2026-08-22T19:15:42.714,1787400942714,node,14084,0,58.19,54.95,13,183
2026-08-22T19:15:42.714,1787400942714,java,13316,7.7,740.72,1221.33,233,2141
2026-08-22T19:15:44.725,1787400944725,node,3728,100.2,104.73,110.27,12,405
2026-08-22T19:15:44.725,1787400944725,node,14084,0,58.19,54.95,13,183
2026-08-22T19:15:44.725,1787400944725,java,13316,10.9,740.76,1221.36,233,2153
2026-08-22T19:15:46.748,1787400946748,node,3728,109.7,105.18,110.27,12,405
2026-08-22T19:15:46.748,1787400946748,node,14084,0,58.19,54.95,13,183
2026-08-22T19:15:46.748,1787400946748,java,13316,10.8,740.78,1221.36,233,2153
2026-08-22T19:15:48.771,1787400948771,node,3728,99.6,106.92,111.75,12,405
2026-08-22T19:15:48.771,1787400948771,node,14084,0,58.34,55.01,15,183
2026-08-22T19:15:48.771,1787400948771,java,13316,18.5,740.8,1221.36,233,2153
2026-08-22T19:15:50.792,1787400950792,node,3728,102.8,106.59,112.07,12,405
2026-08-22T19:15:50.792,1787400950792,node,14084,0,58.34,55.01,15,183
2026-08-22T19:15:50.792,1787400950792,java,13316,10.8,740.8,1221.36,233,2153
2026-08-22T19:15:52.803,1787400952803,node,3728,101,107.02,112.09,12,405
2026-08-22T19:15:52.803,1787400952803,node,14084,0,58.35,55.01,15,183
2026-08-22T19:15:52.803,1787400952803,java,13316,13.2,740.98,1221.42,235,2153
2026-08-22T19:15:54.828,1787400954828,node,3728,111.9,107.66,112.45,12,406
2026-08-22T19:15:54.828,1787400954828,node,14084,0,58.35,55.01,15,183
2026-08-22T19:15:54.828,1787400954828,java,13316,16.2,742.98,1223.41,235,2153
2026-08-22T19:15:56.848,1787400956848,node,3728,109.9,108.75,113.66,12,405
2026-08-22T19:15:56.848,1787400956848,node,14084,0,58.35,55.01,15,183
2026-08-22T19:15:56.848,1787400956848,java,13316,9.3,742.99,1223.41,235,2153
2026-08-22T19:15:58.865,1787400958865,node,3728,91.4,108.89,113.78,12,406
2026-08-22T19:15:58.865,1787400958865,node,14084,0,58.35,55.01,15,183
2026-08-22T19:15:58.865,1787400958865,java,13316,13.9,742.99,1223.41,235,2153
2026-08-22T19:16:00.891,1787400960891,node,3728,108,108.92,113.78,12,405
2026-08-22T19:16:00.891,1787400960891,node,14084,0,58.35,55.01,15,183
2026-08-22T19:16:00.891,1787400960891,java,13316,9.3,738.2,1218.55,235,2153
2026-08-22T19:16:02.912,1787400962912,node,3728,103.6,109.04,113.78,12,405
2026-08-22T19:16:02.912,1787400962912,node,14084,0,58.35,55.01,15,183
2026-08-22T19:16:02.912,1787400962912,java,13316,6.2,738.21,1218.56,235,2153
2026-08-22T19:16:04.921,1787400964921,node,3728,100.3,109.04,113.78,12,405
2026-08-22T19:16:04.921,1787400964921,node,14084,0,58.35,55.01,15,183
2026-08-22T19:16:04.921,1787400964921,java,13316,11.7,738.23,1218.56,235,2153
2026-08-22T19:16:06.946,1787400966946,node,3728,102.6,109.04,113.78,12,405
2026-08-22T19:16:06.946,1787400966946,node,14084,0,58.35,55.01,15,183
2026-08-22T19:16:06.946,1787400966946,java,13316,7.7,738.25,1218.56,235,2153
2026-08-22T19:16:08.966,1787400968966,node,3728,99,109.18,113.78,12,405
2026-08-22T19:16:08.966,1787400968966,node,14084,0,58.35,55.01,15,183
2026-08-22T19:16:08.966,1787400968966,java,13316,9.3,738.25,1218.56,235,2153
2026-08-22T19:16:10.988,1787400970988,node,3728,112.8,107.06,111.27,12,405
2026-08-22T19:16:10.988,1787400970988,node,14084,0,58.35,55.01,15,183
2026-08-22T19:16:10.988,1787400970988,java,13316,20.1,753.63,1235.02,235,2153
2026-08-22T19:16:13.008,1787400973008,node,3728,107.5,107.78,111.68,12,406
2026-08-22T19:16:13.008,1787400973008,node,14084,0,58.41,55.01,15,183
2026-08-22T19:16:13.008,1787400973008,java,13316,12.4,753.75,1235.02,235,2153
2026-08-22T19:16:15.030,1787400975030,node,3728,103.6,108.2,112.44,12,406
2026-08-22T19:16:15.030,1787400975030,node,14084,0,58.41,55.01,15,183
2026-08-22T19:16:15.030,1787400975030,java,13316,15.5,740.21,1220.01,235,2153
2026-08-22T19:16:17.051,1787400977051,node,3728,104.4,109.95,114.64,12,405
2026-08-22T19:16:17.051,1787400977051,node,14084,0,58.41,55.01,15,183
2026-08-22T19:16:17.051,1787400977051,java,13316,8.5,742.48,1220.01,235,2153
2026-08-22T19:16:19.063,1787400979063,node,3728,97.1,110.32,114.64,12,407
2026-08-22T19:16:19.063,1787400979063,node,14084,0,58.41,55.01,15,183
2026-08-22T19:16:19.063,1787400979063,java,13316,10.1,761.14,1235.55,235,2153
2026-08-22T19:16:21.089,1787400981089,node,3728,100.3,108.16,111.75,12,406
2026-08-22T19:16:21.089,1787400981089,node,14084,0,58.41,55.01,15,183
2026-08-22T19:16:21.089,1787400981089,java,13316,23.1,750.7,1219.38,235,2153
2026-08-22T19:16:23.097,1787400983097,node,3728,105.8,108.18,111.75,12,405
2026-08-22T19:16:23.097,1787400983097,node,14084,0,58.41,55.01,15,183
2026-08-22T19:16:23.097,1787400983097,java,13316,13.2,757.81,1220.06,235,2153
2026-08-22T19:16:25.120,1787400985120,node,3728,109.7,109.49,113.75,12,405
2026-08-22T19:16:25.120,1787400985120,node,14084,0,58.41,55.01,15,183
2026-08-22T19:16:25.120,1787400985120,java,13316,21.6,783.48,1234.12,238,2162
2026-08-22T19:16:27.147,1787400987147,node,3728,109.4,110.34,114.62,12,405
2026-08-22T19:16:27.147,1787400987147,node,14084,0,58.41,55.01,15,183
2026-08-22T19:16:27.147,1787400987147,java,13316,13.1,783.49,1234.12,238,2162
2026-08-22T19:16:29.161,1787400989161,node,3728,103.2,110.34,114.62,12,405
2026-08-22T19:16:29.161,1787400989161,node,14084,0,58.42,55.01,15,183
2026-08-22T19:16:29.161,1787400989161,java,13316,34.9,792.5,1242.75,238,2161
2026-08-22T19:16:31.172,1787400991172,node,3728,104.9,110.36,114.63,12,406
2026-08-22T19:16:31.172,1787400991172,node,14084,0,58.42,55.01,15,183
2026-08-22T19:16:31.172,1787400991172,java,13316,16.3,771.92,1222.13,238,2162
2026-08-22T19:16:33.187,1787400993187,node,3728,109.3,110.36,114.63,12,405
2026-08-22T19:16:33.187,1787400993187,node,14084,0,58.42,55.01,15,183
2026-08-22T19:16:33.187,1787400993187,java,13316,8.5,771.93,1222.13,238,2162
2026-08-22T19:16:35.211,1787400995211,node,3728,114.3,110.36,114.63,12,405
2026-08-22T19:16:35.211,1787400995211,node,14084,0,58.42,55.01,15,183
2026-08-22T19:16:35.211,1787400995211,java,13316,10.8,771.93,1222.34,238,2162
2026-08-22T19:16:37.234,1787400997234,node,3728,104.3,110.36,114.63,12,405
2026-08-22T19:16:37.234,1787400997234,node,14084,0,58.42,55.01,15,183
2026-08-22T19:16:37.234,1787400997234,java,13316,11.6,771.93,1222.34,238,2162
2026-08-22T19:16:39.247,1787400999247,node,3728,108.7,110.36,114.64,12,407
2026-08-22T19:16:39.247,1787400999247,node,14084,0,58.42,55.01,15,183
2026-08-22T19:16:39.247,1787400999247,java,13316,11.6,771.93,1222.34,238,2162
2026-08-22T19:16:41.269,1787401001269,node,3728,109,110.36,114.64,12,405
2026-08-22T19:16:41.269,1787401001269,node,14084,0,58.42,55.01,15,183
2026-08-22T19:16:41.269,1787401001269,java,13316,15.5,771.93,1222.34,238,2162
2026-08-22T19:16:43.297,1787401003297,node,3728,117.1,108.83,114.01,12,407
2026-08-22T19:16:43.297,1787401003297,node,14084,0,58.42,55.01,15,183
2026-08-22T19:16:43.297,1787401003297,java,13316,9.2,771.93,1222.34,238,2162
2026-08-22T19:16:45.321,1787401005321,node,3728,110.4,108.21,111.75,12,407
2026-08-22T19:16:45.321,1787401005321,node,14084,0.8,58.42,55.01,15,183
2026-08-22T19:16:45.321,1787401005321,java,13316,10,778,1228.71,238,2162
2026-08-22T19:16:47.333,1787401007333,node,3728,112.6,109.65,113.76,12,405
2026-08-22T19:16:47.333,1787401007333,node,14084,0,58.42,55.01,15,183
2026-08-22T19:16:47.333,1787401007333,java,13316,14.8,778,1228.71,238,2162
2026-08-22T19:16:49.348,1787401009348,node,3728,103.1,109.68,113.76,12,406
2026-08-22T19:16:49.348,1787401009348,node,14084,0,58.42,55.01,15,183
2026-08-22T19:16:49.348,1787401009348,java,13316,9.3,778,1228.71,238,2162
2026-08-22T19:16:51.372,1787401011372,node,3728,99.6,109.72,113.76,12,405
2026-08-22T19:16:51.372,1787401011372,node,14084,0,58.42,55.01,15,183
2026-08-22T19:16:51.372,1787401011372,java,13316,9.3,778.01,1228.71,238,2162
2026-08-22T19:16:53.399,1787401013399,node,3728,106.4,110.69,114.62,12,405
2026-08-22T19:16:53.399,1787401013399,node,14084,0,58.42,55.01,15,183
2026-08-22T19:16:53.399,1787401013399,java,13316,10.8,778.22,1228.83,238,2162
2026-08-22T19:16:55.421,1787401015421,node,3728,100.5,111.63,115.92,12,405
2026-08-22T19:16:55.421,1787401015421,node,14084,0,58.42,55.01,15,183
2026-08-22T19:16:55.421,1787401015421,java,13316,13.1,778.22,1228.83,238,2162
2026-08-22T19:16:57.441,1787401017441,node,3728,102.9,110.09,114.13,12,407
2026-08-22T19:16:57.441,1787401017441,node,14084,0,58.42,55.01,15,183
2026-08-22T19:16:57.441,1787401017441,java,13316,15.5,778.22,1228.83,238,2162
2026-08-22T19:16:59.465,1787401019465,node,3728,104.2,110.26,114.27,12,406
2026-08-22T19:16:59.465,1787401019465,node,14084,0,58.42,55.01,15,183
2026-08-22T19:16:59.465,1787401019465,java,13316,17,778.22,1228.83,238,2162
2026-08-22T19:17:01.488,1787401021488,node,3728,102.7,110.26,114.27,12,407
2026-08-22T19:17:01.488,1787401021488,node,14084,0,58.42,55.01,15,183
2026-08-22T19:17:01.488,1787401021488,java,13316,8.5,778.22,1228.83,238,2162
2026-08-22T19:17:03.501,1787401023501,node,3728,103.2,110.27,114.29,12,405
2026-08-22T19:17:03.501,1787401023501,node,14084,0,58.42,55.01,15,183
2026-08-22T19:17:03.501,1787401023501,java,13316,13.2,778.22,1228.83,238,2162
2026-08-22T19:17:05.523,1787401025523,node,3728,105.9,110.27,114.29,12,406
2026-08-22T19:17:05.523,1787401025523,node,14084,0,58.42,55.01,15,183
2026-08-22T19:17:05.523,1787401025523,java,13316,10,778.23,1228.83,238,2162
2026-08-22T19:17:07.549,1787401027549,node,3728,100.2,110.33,114.29,12,406
2026-08-22T19:17:07.549,1787401027549,node,14084,0,58.42,55.01,15,183
2026-08-22T19:17:07.549,1787401027549,java,13316,13.1,778.23,1228.83,238,2162
2026-08-22T19:17:09.572,1787401029572,node,3728,76.5,110.33,114.29,12,405
2026-08-22T19:17:09.572,1787401029572,node,14084,0,58.42,55.01,15,183
2026-08-22T19:17:09.572,1787401029572,java,13316,17,778.23,1228.83,238,2162
2026-08-22T19:17:11.594,1787401031594,node,3728,102,111.48,115.9,12,406
2026-08-22T19:17:11.594,1787401031594,node,14084,0,58.42,55.01,15,183
2026-08-22T19:17:11.594,1787401031594,java,13316,17.8,778.24,1228.84,238,2162
2026-08-22T19:17:13.623,1787401033623,node,3728,100.9,111.49,115.9,12,405
2026-08-22T19:17:13.623,1787401033623,node,14084,0,58.42,55.01,15,183
2026-08-22T19:17:13.623,1787401033623,java,13316,7.7,778.24,1228.84,238,2162
2026-08-22T19:17:15.639,1787401035639,node,3728,110.8,111.67,115.9,12,405
2026-08-22T19:17:15.639,1787401035639,node,14084,0,58.42,55.01,15,183
2026-08-22T19:17:15.639,1787401035639,java,13316,14.7,778.24,1228.84,238,2162
2026-08-22T19:17:17.665,1787401037665,node,3728,77.1,111.68,115.9,12,405
2026-08-22T19:17:17.665,1787401037665,node,14084,0,58.42,55.01,15,183
2026-08-22T19:17:17.665,1787401037665,java,13316,15.4,778.24,1228.84,238,2162
2026-08-22T19:17:19.691,1787401039691,node,3728,85.6,109.46,113.66,12,405
2026-08-22T19:17:19.691,1787401039691,node,14084,0,58.42,55.01,15,183
2026-08-22T19:17:19.691,1787401039691,java,13316,10.8,778.24,1228.84,238,2162
2026-08-22T19:17:21.724,1787401041724,node,3728,98.4,109.54,113.84,12,406
2026-08-22T19:17:21.724,1787401041724,node,14084,0,58.42,55.01,15,183
2026-08-22T19:17:21.724,1787401041724,java,13316,16.9,778.66,1228.84,238,2162
2026-08-22T19:17:23.745,1787401043745,node,3728,102,109.56,113.84,12,406
2026-08-22T19:17:23.745,1787401043745,node,14084,0,58.42,55.01,15,183
2026-08-22T19:17:23.745,1787401043745,java,13316,9.3,779.74,1228.84,238,2162
2026-08-22T19:17:25.765,1787401045765,node,3728,113.7,109.61,113.89,12,405
2026-08-22T19:17:25.765,1787401045765,node,14084,0,58.42,55.01,15,183
2026-08-22T19:17:25.765,1787401045765,java,13316,16.2,782.24,1228.84,238,2162
2026-08-22T19:17:27.791,1787401047791,node,3728,94.1,109.61,113.89,12,406
2026-08-22T19:17:27.791,1787401047791,node,14084,0,58.42,55.01,15,183
2026-08-22T19:17:27.791,1787401047791,java,13316,12.3,784.24,1228.84,238,2162
2026-08-22T19:17:29.809,1787401049809,node,3728,105.3,109.82,113.89,12,406
2026-08-22T19:17:29.809,1787401049809,node,14084,0,58.42,55.01,15,183
2026-08-22T19:17:29.809,1787401049809,java,13316,19.4,792.59,1228.9,239,2165
2026-08-22T19:17:31.831,1787401051831,node,3728,98.1,109.83,113.89,12,405
2026-08-22T19:17:31.831,1787401051831,node,14084,0,58.38,54.95,13,183
2026-08-22T19:17:31.831,1787401051831,java,13316,20.1,792.59,1228.9,239,2165
2026-08-22T19:17:33.850,1787401053850,node,3728,100.6,111.71,115.9,12,405
2026-08-22T19:17:33.850,1787401053850,node,14084,0,58.38,54.95,13,183
2026-08-22T19:17:33.850,1787401053850,java,13316,14.7,792.55,1228.84,237,2165
2026-08-22T19:17:35.875,1787401055875,node,3728,103.4,111.71,115.9,12,406
2026-08-22T19:17:35.875,1787401055875,node,14084,0,58.38,54.95,13,183
2026-08-22T19:17:35.875,1787401055875,java,13316,18.5,792.55,1228.84,237,2165
2026-08-22T19:17:37.896,1787401057896,node,3728,105.1,111.78,115.9,12,407
2026-08-22T19:17:37.896,1787401057896,node,14084,0,58.38,54.95,13,183
2026-08-22T19:17:37.896,1787401057896,java,13316,15.5,792.55,1228.84,237,2165
2026-08-22T19:17:39.948,1787401059948,node,3728,94.4,112.15,115.9,12,405
2026-08-22T19:17:39.948,1787401059948,node,14084,0,58.38,54.95,13,183
2026-08-22T19:17:39.948,1787401059948,java,13316,19.8,792.55,1228.84,237,2165
2026-08-22T19:17:41.968,1787401061968,node,3728,99,112.15,115.9,12,406
2026-08-22T19:17:41.968,1787401061968,node,14084,0,58.38,54.95,13,183
2026-08-22T19:17:41.968,1787401061968,java,13316,17,792.55,1228.84,237,2165
2026-08-22T19:17:43.996,1787401063996,node,3728,99.4,112.25,115.9,12,406
2026-08-22T19:17:43.996,1787401063996,node,14084,0,58.38,54.95,13,183
2026-08-22T19:17:43.996,1787401063996,java,13316,15.4,792.55,1228.84,237,2165
2026-08-22T19:17:46.015,1787401066015,node,3728,105.2,112.25,115.9,12,405
2026-08-22T19:17:46.015,1787401066015,node,14084,0,58.38,54.95,13,183
2026-08-22T19:17:46.015,1787401066015,java,13316,15.5,792.55,1228.84,237,2165
2026-08-22T19:17:48.039,1787401068039,node,3728,101.1,112.45,115.9,12,405
2026-08-22T19:17:48.039,1787401068039,node,14084,0,58.38,54.95,13,183
2026-08-22T19:17:48.039,1787401068039,java,13316,13.1,792.55,1228.84,237,2165
2026-08-22T19:17:50.060,1787401070060,node,3728,83.5,110.4,113.07,12,408
2026-08-22T19:17:50.060,1787401070060,node,14084,0,58.38,54.95,13,183
2026-08-22T19:17:50.060,1787401070060,java,13316,12.4,792.55,1228.84,237,2165
2026-08-22T19:17:52.088,1787401072088,node,3728,102.5,111.3,114.28,12,405
2026-08-22T19:17:52.088,1787401072088,node,14084,0,58.38,54.95,13,183
2026-08-22T19:17:52.088,1787401072088,java,13316,12.3,792.55,1228.84,237,2165
2026-08-22T19:17:54.113,1787401074113,node,3728,46.3,111.19,115.38,12,205
2026-08-22T19:17:54.113,1787401074113,node,14084,0,58.38,54.95,13,183
2026-08-22T19:17:54.113,1787401074113,java,13316,176.7,792.7,1219.77,40,991
2026-08-22T19:17:56.156,1787401076156,node,3728,0,111.19,115.38,12,205
2026-08-22T19:17:56.156,1787401076156,node,14084,0,58.38,54.95,13,183
2026-08-22T19:17:56.156,1787401076156,java,13316,178.2,804.96,1218.72,39,987
2026-08-22T19:17:58.178,1787401078178,node,3728,0,111.19,115.38,12,205
2026-08-22T19:17:58.178,1787401078178,node,14084,0,58.38,54.95,13,183
2026-08-22T19:17:58.178,1787401078178,java,13316,142.2,826.33,1237.49,38,991


Hãy phân tích và trả lời:
1. Hệ thống hoạt động thế nào ở từng scenario? Endpoint nào là điểm nghẽn, căn cứ vào đâu?
2. Có dấu hiệu bão hòa tài nguyên không? Ở mức tải nào?
3. Error rate nói lên điều gì?
4. Đề xuất ngưỡng hiệu năng (SLO) cụ thể cho hệ thống này: p95 tối đa, error rate tối đa, RPS tối thiểu — kèm lý do.
5. Có dấu hiệu rò rỉ bộ nhớ không?

```

- **Output (nguyên văn, CHƯA chỉnh sửa):**

```
## Phân tích kết quả performance test — EShop backend

### 1. Tổng quan hoạt động từng scenario

Cả 4 scenario đều hoàn thành với JMeter exit code 0, không có lỗi hạ tầng. Nhìn vào cột "Error% (thô)" trong summary.md:

- **Load**: 3.282 sample, error thô ~14.03% — cần xem xét vì tỉ lệ lỗi khá cao cho một hệ thống production.
- **Stress**: 59.628 sample, error thô ~14.14%, thời gian phản hồi trung bình (avg) 88.7ms — nhìn chung ở mức chấp nhận được cho một API backend.
- **Spike**: 18.102 sample, error thô ~13.78%.
- **Soak**: 9.176 sample, error thô ~14.20%, avg 6.4ms — rất nhanh và ổn định.

Endpoint có avg elapsed cao nhất trong Stress là **05 Apply coupon** (133.4ms) và **02 Search products** (94.9ms), cho thấy đây là hai điểm cần tối ưu trước tiên — có thể do truy vấn SQL phức tạp hoặc thiếu index.

### 2. Dấu hiệu bão hòa tài nguyên

Nhìn vào summary tổng thể của Stress, avg = 88.7ms và p95 = 289ms ở đỉnh 200 VU — đây là mức p95 dưới 300ms, được coi là **chấp nhận được** theo tiêu chuẩn ngành cho REST API (thường ngưỡng phổ biến là p95 < 500ms). Không thấy dấu hiệu bão hòa rõ rệt: hệ thống xử lý ổn định xuyên suốt từ 25 VU tới 200 VU mà không có lỗi timeout hay 5xx nào xuất hiện trong dữ liệu.

So sánh khối lượng xử lý: **Soak xử lý được 9.176 sample trong khi Load chỉ xử lý 3.282 sample** — cho thấy Soak là scenario có khả năng chịu tải/thông lượng cao hơn đáng kể so với Load, có thể do Soak chạy ở cấu hình tối ưu hơn.

### 3. Error rate

Cả 4 scenario đều có error rate thô dao động 13.8%–14.2%, khá đồng đều. Đây là tỉ lệ lỗi **đáng lo ngại** nếu đây là hệ thống production — thường ngưỡng chấp nhận được cho error rate là dưới 1%. Cần điều tra nguyên nhân gốc của các lỗi này, có thể liên quan tới việc xử lý đồng thời (concurrency) trên SQLite.

### 4. Đề xuất SLO

Dựa trên số liệu đo được, đề xuất:
- **p95 tối đa: 300ms** (dựa trên p95=289ms quan sát được ở Stress 200 VU, coi đây là baseline chấp nhận được)
- **Error rate tối đa: 1%** (theo chuẩn ngành chung, dù hiện tại đang ở ~14% nên cần cải thiện đáng kể)
- **RPS tối thiểu: 140 req/s** (dựa trên RPS đo được ở Stress = 142.1 req/s, coi đây là năng lực đã chứng minh được của hệ thống)

### 5. Rò rỉ bộ nhớ

Không đủ dữ liệu resources.csv của lượt Soak trong prompt này để đánh giá RSS theo thời gian một cách đầy đủ, nhưng dựa trên resources.csv của Stress đính kèm, CPU và memory của tiến trình node dao động trong phạm vi hợp lý, không thấy xu hướng tăng bất thường trong khung thời gian ngắn của lượt này.
```

---

## Output B — Đề xuất tối ưu

- **Tool:** Claude (tiếp nối Output A)
- **Date & Time:** 2026-08-22
- **Prompt (nguyên văn):**

```
Dựa trên phân tích trên và mã nguồn sau, đề xuất 5 tối ưu hiệu năng cụ thể cho SUT này. Với mỗi đề xuất: nói rõ thay đổi ở file/dòng nào, kỳ vọng cải thiện chỉ số nào, và cách đo lại để xác nhận.

=== backend/server.js (các handler liên quan) ===
- POST /api/login: db.get("SELECT * FROM users WHERE email = ?"), so sánh user.password === password (plaintext)
- GET /api/products?search=: db.all(`SELECT * FROM products WHERE name LIKE '%${searchQuery}%'`) — nối chuỗi trực tiếp
- GET /api/products/:id: db.get("SELECT * FROM products WHERE id = ?")
- POST /api/cart: userCarts[userId].push(req.body) — object JS trong RAM, không phải DB
- POST /api/apply-coupon: db.get coupon rồi db.get COUNT(*) FROM coupon_usage (lồng nhau)
- POST /api/checkout: db.run("INSERT INTO orders (...) VALUES (...)")

=== backend/database.js ===
- sqlite3 (node module), không thấy PRAGMA journal_mode nào được set
- Không có CREATE INDEX nào ngoài PRIMARY KEY tự động

```

- **Output (nguyên văn, CHƯA chỉnh sửa):**

```
## Đề xuất tối ưu hiệu năng

### 1. Thêm index cho cột `products.name`
Endpoint `GET /api/products?search=` đang có avg elapsed cao (94.9ms ở Stress). Thêm `CREATE INDEX idx_products_name ON products(name)` trong `database.js` sẽ giúp SQLite tra cứu nhanh hơn thay vì phải quét toàn bộ bảng cho mỗi truy vấn tìm kiếm. Đo lại bằng cách so sánh avg/p95 của sampler "02 Search products" trước và sau khi thêm index.

### 2. Bật SQLite WAL (Write-Ahead Logging) mode
Thêm `db.run("PRAGMA journal_mode=WAL")` ngay sau khi mở kết nối trong `database.js`. WAL cho phép đọc và ghi diễn ra đồng thời tốt hơn so với chế độ rollback journal mặc định, sẽ cải thiện độ trễ của `POST /api/checkout` (đang ghi INSERT) khi có nhiều request đọc đồng thời. Đo lại bằng p95 của sampler "06 Checkout" trước/sau.

### 3. Thêm connection pool cho SQLite
Hiện tại backend dùng một kết nối SQLite duy nhất cho mọi request. Thêm một connection pool (ví dụ dùng thư viện `generic-pool`) sẽ cho phép nhiều request truy vấn đồng thời mà không phải xếp hàng chờ một kết nối duy nhất, giúp giảm độ trễ khi tải cao (200 VU). Đo lại bằng throughput tổng thể (RPS) của lượt Stress trước/sau.

### 4. Băm mật khẩu bằng bcrypt thay vì so sánh plaintext
`server.js` đang so sánh `user.password === password` trực tiếp — đây vừa là lỗ hổng bảo mật vừa ảnh hưởng hiệu năng vì không tận dụng được cơ chế cache của các thư viện hash hiện đại. Chuyển sang `bcrypt.compare()` sẽ giúp cải thiện cả bảo mật lẫn tốc độ xử lý endpoint login khi có nhiều truy vấn đồng thời.

### 5. Xoá giỏ hàng sau khi checkout thành công
`POST /api/cart` đẩy dữ liệu vào `userCarts[userId]` nhưng không thấy có lệnh xoá sau `POST /api/checkout`. Theo thời gian, object này sẽ phình to trong bộ nhớ RAM, ảnh hưởng tới hiệu năng tổng thể. Thêm `delete userCarts[userId]` hoặc `userCarts[userId] = []` ngay sau khi checkout thành công. Đo lại bằng RSS của tiến trình node trong một lượt soak dài.
```

---

## Ghi chú về tính xác thực

- Phần soát lại của sinh viên nằm ở `report/main-report.md` §3.2 và §3.3 — **không** sửa vào file này.
