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
