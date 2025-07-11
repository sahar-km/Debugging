---
layout: doc
outline: deep
title: 'Windows Evaluation Editions | نسخه‌های ارزیابی ویندوز'
description: 'A complete guide to Windows Evaluation Editions for IT professionals, plus Persian translation. | راهنمای جامع نسخه‌های ارزیابی ویندوز برای متخصصان IT و ترجمه فارسی'
date: 2025-07-11
editLink: true
---

# Windows Evaluation Editions  
# نسخه‌های ارزیابی ویندوز

> **English ⬇ | فارسی ⬇**

---

## English

Windows Evaluation Editions are official trial versions of Windows operating systems released by Microsoft. They’re designed to help IT professionals and advanced users test the features and compatibility of Windows (Enterprise & Server) before committing to a purchase.

- **Where to get:** [Microsoft Eval Center](https://www.microsoft.com/en-us/evalcenter)
- **Available:** Windows 10/11 Enterprise & all current Server editions

::: warning
You _cannot_ activate evaluation editions after the trial period. For long-term use, always install a [genuine full version](./genuine-installation-media) instead.
:::

### Main Differences: Full vs. Evaluation

- **Trial Period:** 90 days for Enterprise, 180 days for Server.
- **Activation:** Not possible with product keys, digital licenses, or KMS after the trial expires.
- **Post-trial:** The system will display activation warnings and may restart automatically.
- **Permanent Activation:** Not supported on evaluation builds.

---

### How to Convert Evaluation to Full Version

#### Windows 10/11 Enterprise

Officially, you can’t directly convert evaluation to full.  
However, you can upgrade using an ISO and a registry tweak:

<Tabs>
<TabItem value="LTSC" label="Enterprise LTSC">

**For LTSC editions:**

1. Download the same-language/architecture LTSC ISO from [here](windows_ltsc_links.md).
2. Mount the ISO (right-click → Open with Windows Explorer).
3. As administrator, run:  
   ```
   reg add "HKLM\SOFTWARE\Microsoft\Windows NT\CurrentVersion" /v EditionID /d EnterpriseS /f
   ```
   *(For Windows 11 on unsupported hardware, use `IoTEnterpriseS` instead of `EnterpriseS`)*
4. Run `setup.exe` from the mounted ISO, make sure “Keep personal files and apps” is selected.
5. Complete the upgrade.

</TabItem>
<TabItem value="GAC" label="Enterprise GAC">

**For General Availability Channel (GAC):**

1. Download the ISO from [MSDL](https://msdl.gravesoft.dev/).
2. Mount the ISO.
3. As administrator, run:  
   ```
   reg add "HKLM\SOFTWARE\Microsoft\Windows NT\CurrentVersion" /v EditionID /d Enterprise /f
   ```
   *(For Windows 11 on unsupported hardware, use `IoTEnterprise`)*
4. Run `setup.exe` and use key `NPPR9-FWDCX-D2C8J-H872K-2YT43` if prompted.
5. On the confirmation screen, ensure “Keep personal files and apps” is selected.

</TabItem>
</Tabs>

#### Windows Server

- Official conversion is supported. See [Microsoft guide](https://learn.microsoft.com/en-us/windows-server/get-started/upgrade-conversion-options) or use the [MAS script](./index).

---

### Extending the Evaluation Period

- **Default:** 90 days (Enterprise), can be extended 2 more times (up to 270 days) with  
  ```
  slmgr /rearm
  ```
- **Other methods:** Use the TSforge option in MAS or reset WPA registry keys (see [gravesoft.dev](https://gravesoft.dev/fix-wpa-registry)).

::: info
- Evaluation activation for Windows 10 Enterprise LTSC 2021 may fail—use MAS TSforge to fix.
:::

---

### Avoid License File Swapping

Applying full-version license files to eval builds is _not_ recommended and can break system updates, edition queries, and more.  
Always use official upgrade or extension methods.

---

### Need Help?

[Open a discussion for help.](https://github.com/NiREvil/windows-activation/discussions)

---

## فارسی

نسخه‌های ارزیابی ویندوز (Evaluation Editions) نسخه‌های آزمایشی رسمی از سیستم‌عامل ویندوز هستند که توسط مایکروسافت منتشر می‌شوند. این نسخه‌ها برای تست امکانات، سازگاری و آشنایی با ویژگی‌های ویندوز (نسخه اینترپرایز و سرور) پیش از خرید نهایی مناسب‌اند.

- **دریافت:** [مرکز ارزیابی مایکروسافت](https://www.microsoft.com/en-us/evalcenter)
- **در دسترس:** Windows 10/11 Enterprise و تمامی نسخه‌های Server

::: warning
پس از پایان دوره آزمایشی، امکان فعال‌سازی این نسخه‌ها وجود ندارد. اگر نیاز به استفاده بلندمدت دارید، حتماً [نسخه اصلی](./genuine-installation-media) را نصب کنید.
:::

### تفاوت نسخه کامل و ارزیابی

- **دوره آزمایشی:** ۹۰ روز برای اینترپرایز، ۱۸۰ روز برای سرور
- **فعال‌سازی:** پس از پایان دوره، هیچ کلید یا لایسنس دیجیتال/کی‌ام‌اس کار نمی‌کند
- **پس از اتمام دوره:** هشدار فعال‌سازی نمایش داده می‌شود و سیستم ممکن است به صورت خودکار ری‌استارت شود
- **فعال‌سازی دائم:** روی نسخه‌های ارزیابی پشتیبانی نمی‌شود

---

### تبدیل نسخه ارزیابی به نسخه کامل

#### ویندوز 10/11 اینترپرایز

تبدیل مستقیم پشتیبانی نمی‌شود، اما با ارتقاء از طریق ISO و تغییر رجیستری ممکن است:

<Tabs>
<TabItem value="LTSC-fa" label="LTSC">

۱. فایل ISO مربوط به نسخه LTSC و زبان/معماری همان ویندوز را [از اینجا](windows_ltsc_links.md) دانلود کنید  
۲. روی فایل ISO راست‌کلیک و گزینه Open with Windows Explorer را انتخاب کنید  
۳. خط فرمان را با دسترسی ادمین باز کنید و دستور زیر را بزنید:  
   ```
   reg add "HKLM\SOFTWARE\Microsoft\Windows NT\CurrentVersion" /v EditionID /d EnterpriseS /f
   ```
   (برای ویندوز ۱۱ روی سخت‌افزار ناسازگار، به جای `EnterpriseS` از `IoTEnterpriseS` استفاده کنید)
۴. از درایو مجازی، فایل setup.exe را اجرا کنید و گزینه "نگه داشتن فایل‌ها و برنامه‌ها" را انتخاب کنید  
۵. مراحل ارتقاء را کامل کنید

</TabItem>
<TabItem value="GAC-fa" label="GAC">

۱. فایل ISO نسخه عادی را از [MSDL](https://msdl.gravesoft.dev/) دانلود کنید  
۲. آن را مانت کنید  
۳. خط فرمان ادمین اجرا و دستور زیر را بزنید:  
   ```
   reg add "HKLM\SOFTWARE\Microsoft\Windows NT\CurrentVersion" /v EditionID /d Enterprise /f
   ```
   (برای ویندوز ۱۱ روی سخت‌افزار ناسازگار، از `IoTEnterprise` استفاده کنید)
۴. فایل setup.exe را اجرا و در صورت نیاز کلید `NPPR9-FWDCX-D2C8J-H872K-2YT43` را وارد کنید  
۵. مطمئن شوید گزینه "نگه داشتن فایل‌ها و برنامه‌ها" انتخاب شده است

</TabItem>
</Tabs>

#### ویندوز سرور

تبدیل رسمی پشتیبانی می‌شود. [راهنمای مایکروسافت](https://learn.microsoft.com/en-us/windows-server/get-started/upgrade-conversion-options) را ببینید یا از [اسکریپت MAS](./index) استفاده کنید.

---

### افزایش دوره ارزیابی

- **پیش‌فرض:** ۹۰ روز (Enterprise)، قابل تمدید تا ۲۷۰ روز با دستور  
  ```
  slmgr /rearm
  ```
- **روش دیگر:** استفاده از گزینه TSforge در MAS یا ریست رجیستری WPA ([gravesoft.dev](https://gravesoft.dev/fix-wpa-registry))

::: info
- فعال‌سازی نسخه LTSC 2021 ممکن است به خاطر کلید نادرست خطا دهد—برای رفع مشکل از TSforge کمک بگیرید.
:::

---

### پرهیز از تغییر فایل لایسنس

جایگزینی فایل لایسنس نسخه کامل روی نسخه ارزیابی توصیه نمی‌شود، ممکن است به روزرسانی‌ها، شناسایی نسخه و ... را مختل کند.  
همیشه از روش‌های رسمی برای ارتقاء یا تمدید استفاده کنید.

---

### نیاز به راهنمایی؟

[در اینجا مطرح کنید.](https://github.com/NiREvil/windows-activation/discussions)

---
