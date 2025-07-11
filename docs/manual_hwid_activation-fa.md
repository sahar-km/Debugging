---
layout: doc
outline: deep
title: 'فعال‌سازی دستی HWID'
description: 'آموزش فعال‌سازی HWID ویندوز ۱۰/۱۱ بدون نیاز به اسکریپت، ویژه کسانی که ترجیح می‌دهند مراحل را خودشان انجام دهند.'
date: 2025-07-11
editLink: true
---

# فعال‌سازی دستی HWID ویندوز ۱۰/۱۱

اگر دوست ندارید از ابزار یا اسکریپت آماده برای فعال‌سازی ویندوز استفاده کنید، این راهنما مخصوص شماست. مراحل فعال‌سازی HWID را می‌توانید به‌سادگی و دستی انجام دهید.

::: danger پشتیبانی 

فعال‌سازی HWID فقط روی ویندوز ۱۰ یا ۱۱ پشتیبانی می‌شود.

:::

<br/>

## مراحل فعال‌سازی دستی

۱. **اتصال اینترنت را برقرار کنید.**  
۲. **نسخه ویندوز خود را پیدا کنید:**  
   از منوی استارت عبارت "About your PC" را جستجو کرده و نسخه را بررسی کنید.
۳. **دانلود فایل تیکت:**  
   از جدول زیر مطابق با نسخه ویندوز خود، فایل تیکت (Ticket) را دانلود کنید.
۴. **کپی فایل تیکت:**  
   فایل دانلودشده را به آدرس زیر منتقل کنید:  
   `C:\ProgramData\Microsoft\Windows\ClipSVC\GenuineTicket`  
   توجه: پوشه `ProgramData` پنهان است؛ آدرس را مستقیماً در نوار آدرس اکسپلورر وارد کنید.
۵. **باز کردن تنظیمات فعال‌سازی:**  
   وارد بخش Settings > Activation شوید و روی گزینه "Change product key" کلیک کنید.
۶. **وارد کردن کلید محصول:**  
   کلید مربوط به نسخه ویندوز را از جدول زیر کپی و در کادر مربوطه وارد کنید.
۷. **اتمام فعال‌سازی:**  
   چند لحظه صبر کنید تا ویندوز به صورت خودکار فعال شود.

<br/>

::: info رفع خطا

اگر هنگام وارد کردن کلید خطای `0x803fa067` دریافت کردید، اینترنت را قطع کنید و مجدداً کلید را وارد نمایید.  
پس از تایید، دوباره به اینترنت وصل شوید تا فعال‌سازی کامل شود.

:::

<hr/><br/>

## جدول کلید و فایل تیکت نسخه‌های ویندوز ۱۰/۱۱

| نسخه ویندوز                          | کلید فعال‌سازی                        | دانلود فایل تیکت |
| ------------------------------------- | -------------------------------------- | ---------------- |
| Education                            | YNMGQ-8RYV3-4PGQ3-C8XTP-7CFBY         | [دانلود](https://github.com/massgravel/hwid-kms38-tickets/releases/latest/download/Education.xml) |
| Education N                          | 84NGF-MHBT6-FXBX8-QWJK7-DRR8H         | [دانلود](https://github.com/massgravel/hwid-kms38-tickets/releases/latest/download/Education.N.xml) |
| Enterprise                           | XGVPP-NMH47-7TTHJ-W3FW7-8HV2C         | [دانلود](https://github.com/massgravel/hwid-kms38-tickets/releases/latest/download/Enterprise.xml) |
| Enterprise N                         | 3V6Q6-NQXCX-V8YXR-9QCYV-QPFCT         | [دانلود](https://github.com/massgravel/hwid-kms38-tickets/releases/latest/download/Enterprise.N.xml) |
| Enterprise LTSB 2015                 | FWN7H-PF93Q-4GGP8-M8RF3-MDWWW         | [دانلود](https://github.com/massgravel/hwid-kms38-tickets/releases/latest/download/Enterprise.LTSB.2015.xml) |
| Enterprise LTSB 2016                 | NK96Y-D9CD8-W44CQ-R8YTK-DYJWX         | [دانلود](https://github.com/massgravel/hwid-kms38-tickets/releases/latest/download/Enterprise.LTSB.2016.xml) |
| Enterprise LTSC 2019                 | 43TBQ-NH92J-XKTM7-KT3KK-P39PB         | [دانلود](https://github.com/massgravel/hwid-kms38-tickets/releases/latest/download/Enterprise.LTSC.2019.xml) |
| Enterprise N LTSB 2015               | NTX6B-BRYC2-K6786-F6MVQ-M7V2X         | [دانلود](https://github.com/massgravel/hwid-kms38-tickets/releases/latest/download/Enterprise.N.LTSB.2015.xml) |
| Enterprise N LTSB 2016               | 2DBW3-N2PJG-MVHW3-G7TDK-9HKR4         | [دانلود](https://github.com/massgravel/hwid-kms38-tickets/releases/latest/download/Enterprise.N.LTSB.2016.xml) |
| Home                                 | YTMG3-N6DKC-DKB77-7M9GH-8HVX7         | [دانلود](https://github.com/massgravel/hwid-kms38-tickets/releases/latest/download/Home.xml) |
| Home N                               | 4CPRK-NM3K3-X6XXQ-RXX86-WXCHW         | [دانلود](https://github.com/massgravel/hwid-kms38-tickets/releases/latest/download/Home.N.xml) |
| Home China                           | N2434-X9D7W-8PF6X-8DV9T-8TYMD         | [دانلود](https://github.com/massgravel/hwid-kms38-tickets/releases/latest/download/Home.China.xml) |
| Home Single Language                 | BT79Q-G7N6G-PGBYW-4YWX6-6F4BT         | [دانلود](https://github.com/massgravel/hwid-kms38-tickets/releases/latest/download/Home.Single.Language.xml) |
| IoT Enterprise                       | XQQYW-NFFMW-XJPBH-K8732-CKFFD         | [دانلود](https://github.com/massgravel/hwid-kms38-tickets/releases/latest/download/IoT.Enterprise.xml) |
| IoT Enterprise Subscription          | P8Q7T-WNK7X-PMFXY-VXHBG-RRK69         | [دانلود](https://github.com/massgravel/hwid-kms38-tickets/releases/latest/download/IoT.Enterprise.Subscription.xml) |
| IoT Enterprise LTSC 2021             | QPM6N-7J2WJ-P88HH-P3YRH-YY74H         | [دانلود](https://github.com/massgravel/hwid-kms38-tickets/releases/latest/download/IoT.Enterprise.LTSC.2021.xml) |
| IoT Enterprise LTSC 2024             | CGK42-GYN6Y-VD22B-BX98W-J8JXD         | [دانلود](https://github.com/massgravel/hwid-kms38-tickets/releases/latest/download/IoT.Enterprise.LTSC.2024.xml) |
| IoT Enterprise LTSC Subscription 2024| N979K-XWD77-YW3GB-HBGH6-D32MH         | [دانلود](https://github.com/massgravel/hwid-kms38-tickets/releases/latest/download/IoT.Enterprise.LTSC.Subscription.2024.xml) |
| Pro                                  | VK7JG-NPHTM-C97JM-9MPGT-3V66T         | [دانلود](https://github.com/massgravel/hwid-kms38-tickets/releases/latest/download/Pro.xml) |
| Pro N                                | 2B87N-8KFHP-DKV6R-Y2C8J-PKCKT         | [دانلود](https://github.com/massgravel/hwid-kms38-tickets/releases/latest/download/Pro.N.xml) |
| Pro Education                        | 8PTT6-RNW4C-6V7J2-C2D3X-MHBPB         | [دانلود](https://github.com/massgravel/hwid-kms38-tickets/releases/latest/download/Pro.Education.xml) |
| Pro Education N                      | GJTYN-HDMQY-FRR76-HVGC7-QPF8P         | [دانلود](https://github.com/massgravel/hwid-kms38-tickets/releases/latest/download/Pro.Education.N.xml) |
| Pro for Workstations                 | DXG7C-N36C4-C4HTG-X4T3X-2YV77         | [دانلود](https://github.com/massgravel/hwid-kms38-tickets/releases/latest/download/Pro.for.Workstations.xml) |
| Pro N for Workstations               | WYPNQ-8C467-V2W6J-TX4WX-WT2RQ         | [دانلود](https://github.com/massgravel/hwid-kms38-tickets/releases/latest/download/Pro.N.for.Workstations.xml) |
| S                                    | V3WVW-N2PV2-CGWC3-34QGF-VMJ2C         | [دانلود](https://github.com/massgravel/hwid-kms38-tickets/releases/latest/download/Cloud.S.xml) |
| S N                                  | NH9J3-68WK7-6FB93-4K3DF-DJ4F6         | [دانلود](https://github.com/massgravel/hwid-kms38-tickets/releases/latest/download/Cloud.S.N.xml) |
| SE                                   | KY7PN-VR6RX-83W6Y-6DDYQ-T6R4W         | [دانلود](https://github.com/massgravel/hwid-kms38-tickets/releases/latest/download/CloudEdition.SE.xml) |
| SE N                                 | K9VKN-3BGWV-Y624W-MCRMQ-BHDCD         | [دانلود](https://github.com/massgravel/hwid-kms38-tickets/releases/latest/download/CloudEdition.SE.N.xml) |
| Team                                 | XKCNC-J26Q9-KFHD2-FKTHY-KD72Y         | [دانلود](https://github.com/massgravel/hwid-kms38-tickets/releases/latest/download/Team.xml) |

---

> اگر به دنبال روش آسان‌تر هستید، می‌توانید از [ابزار فعال‌سازی خودکار](./index-fa) استفاده کنید.
