# data/ — 5 file CSV data-driven (§6)

Sinh bang `npm run seed:perf -- --users 200 --products 20000`.

| File | Cot | Dung o buoc | Rang buoc BAT BUOC |
|---|---|---|---|
| `users.csv` | `email,password,user_id` | 1, 5 | >= 200 dong (200 VU o luot Stress) |
| `users_lockout.csv` | `email,wrong_password` | 7 | tai khoan MOI rieng — khong dung chung voi buoc 1 |
| `search-terms.csv` | `keyword` | 2 | KHONG chua dau nhay don, dau `%` hay `_` — server noi chuoi SQL |
| `products.csv` | `product_id,product_name,price` | 3, 4 | id THAT lay tu GET /api/products sau khi seed |
| `orders.csv` | `total_amount,shipping_address,coupon_code` | 5, 6 | `total_amount` > 500000 (BIGBUY dung `>` chu khong phai `>=`) |

Moi CSV Data Set Config trong .jmx phai de **Sharing mode = All threads** (`shareMode.all`).

Huong dan: `docs/03-DATA-DRIVEN-CSV.md`.
