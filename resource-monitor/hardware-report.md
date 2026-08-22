# Hardware Report - 23127183

> Sinh tu dong bang `npm run hardware` (`tools/hardware-report.ps1`).
> Anh dxdiag: `screenshots/hardware-dxdiag.png` - xem `docs/HUONG-DAN-VIEC-TU-LAM.md` muc A.
> muc 11: hostname phai **khop voi cac HW truoc** cua sinh vien.

| Muc | Gia tri |
|---|---|
| **Hostname** | `Pham_Vu_Ngoc_Duy` |
| Ten NetBIOS (bi cat 15 ky tu) | `PHAM_VU_NGOC_DU` |
| User | `DELL` |
| OS | Microsoft Windows 11 Home Single Language - build 26200, 64-bit |
| CPU | Intel(R) Core(TM) i5-1035G1 CPU @ 1.00GHz |
| So loi | **4 loi vat ly / 8 loi logic** |
| Xung co ban | 1190 MHz |
| RAM | **15.8 GB** |
| O dia chua SUT | D: - 296.9 GB tong, 90.8 GB trong |
| Java | 17.0.19 |
| JMeter | 5.6.3 |
| Node | v22.16.0 |
| Ngay sinh bao cao | 2026-08-22 11:37:19 |

## Gioi han bat buoc phai cong bo

**Load generator (JMeter) va SUT (backend Node) chay tren CUNG may nay.** Moi so do vi the
bao gom ca chi phi sinh tai. CPU dinh cua `java.exe` so voi `node.exe` o tung luot duoc ghi
trong `results/resources/*.resources.csv` va doi chieu o `report/main-report.md` muc 6.

**Cach doc cot `cpu_percent_of_one_core`:** 100 = bao hoa **mot loi**. May nay co
8 loi logic nen tran ly thuyet la 800.
Node chay JavaScript tren mot luong nen cham ~100 la da bao hoa, du may con loi ranh.

## Anh

![dxdiag](screenshots/hardware-dxdiag.png)