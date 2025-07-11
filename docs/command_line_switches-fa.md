---
layout: doc
outline: deep
title: 'Command Line Switches | سوئیچ‌های خط فرمان'
description: 'Comprehensive list of command line switches for MAS and their Persian translation. | لیست کامل سوئیچ‌های خط فرمان MAS و ترجمه فارسی'
date: 2025-07-11
editLink: true
---

# Command Line Switches

# سوئیچ‌های خط فرمان

> **English ⬇ | فارسی ⬇**

---

## English

You can use the switches below in MAS AIO, separate files, or the PowerShell one-liner for fully unattended automation.  
For pre-activation, see the [OEM folder guide](./oem-folder).

### HWID Activation

| Switch                  | Meaning                                                                                          |
| ----------------------- | ------------------------------------------------------------------------------------------------ |
| `/HWID`                 | Activate with HWID (Hardware-based license)                                                      |
| `/HWID-NoEditionChange` | Run HWID activation _without_ changing Windows edition (default: edition auto-adjusts if needed) |

### Ohook (Office Activation)

| Switch             | Meaning                                    |
| ------------------ | ------------------------------------------ |
| `/Ohook`           | Install Ohook & activate Office            |
| `/Ohook-Uninstall` | Uninstall Ohook & remove Office activation |

### TSforge (Trial/Eval tools)

| Switch                       | Meaning                                                                  |
| ---------------------------- | ------------------------------------------------------------------------ |
| `/Z-Windows`                 | Activate only Windows with TSforge                                       |
| `/Z-ESU`                     | Activate only ESU (Extended Security Updates)                            |
| `/Z-Office`                  | Activate only Office with TSforge                                        |
| `/Z-ProjectVisio`            | Activate only Project/Visio                                              |
| `/Z-WindowsESUOffice`        | Activate all (Windows/ESU/Office)                                        |
| `/Z-WinHost`                 | Activate only Windows KMS Host                                           |
| `/Z-OffHost`                 | Activate only Office KMS Host                                            |
| `/Z-APPX`                    | Activate 8/8.1 APPXLOB                                                   |
| `/Z-ID-ActivationIdGoesHere` | Specify custom Activation ID (replace ActivationIdGoesHere with your ID) |
| `/Z-Reset`                   | Reset rearm counter, eval period, and clear tamper/key lock              |

#### Forcing Activation Methods

Override auto-detection by adding one of these:

| Switch     | Meaning                                                           |
| ---------- | ----------------------------------------------------------------- |
| `/Z-SCID`  | Force StaticCID (Internet required, not for Windows 7 or older)   |
| `/Z-ZCID`  | Force ZeroCID (Works best below build 19041; not for 26100.4188+) |
| `/Z-KMS4k` | Force KMS4k (volume licenses only, 4000+ years activation)        |

### KMS38

| Switch                    | Meaning                          |
| ------------------------- | -------------------------------- |
| `/KMS38`                  | Activate with KMS38              |
| `/KMS38-NoEditionChange`  | Run KMS38 without edition change |
| `/KMS38-RemoveProtection` | Remove KMS38 protection          |

### Online KMS

| Switch                        | Meaning                                               |
| ----------------------------- | ----------------------------------------------------- |
| `/K-Windows`                  | Activate only Windows                                 |
| `/K-Office`                   | Activate only Office                                  |
| `/K-ProjectVisio`             | Activate only Project/Visio                           |
| `/K-WindowsOffice`            | Activate all Windows and Office                       |
| `/K-NoEditionChange`          | Don’t auto-change edition for KMS                     |
| `/K-NoRenewalTask`            | Don’t install renewal task after activation           |
| `/K-Uninstall`                | Uninstall Online KMS & renewal tasks                  |
| `/K-Server-YOURKMSSERVERNAME` | Specify a KMS server address (edit YOURKMSSERVERNAME) |
| `/K-Port-YOURPORTNAME`        | Specify a KMS port (edit YOURPORTNAME)                |

### Other Switches

- `/S` — Run in silent mode (no output, CMD window still appears)

---

### Usage Examples

#### PowerShell One-Liner

```powershell
& ([ScriptBlock]::Create((irm https://get.activated.win))) /HWID /Ohook
```

- Replace `/HWID /Ohook` with any combination of switches.

#### Notes

- Script runs unattended if any switch is present.
- `/S` does not work in MAS separate files.
- Switches are case-insensitive and can be in any order, separated by spaces.
- KMS uninstall switches override other KMS switches.

---

## فارسی

از سوئیچ‌های زیر می‌توانید در MAS AIO، نسخه فایل‌های جدا یا پاورشل وان‌لاینر برای اجرای کاملاً خودکار استفاده کنید.  
جهت فعال‌سازی پیش‌فرض، به [راهنمای پوشه OEM](./oem-folder) مراجعه کنید.

### فعال‌سازی HWID

| سوئیچ                   | توضیح                                                                                  |
| ----------------------- | -------------------------------------------------------------------------------------- |
| `/HWID`                 | فعال‌سازی با HWID (مجوز مبتنی بر سخت‌افزار)                                            |
| `/HWID-NoEditionChange` | فعال‌سازی HWID بدون تغییر نسخه ویندوز (به طور پیش‌فرض اگر لازم باشد نسخه تغییر می‌کند) |

### Ohook (فعال‌سازی آفیس)

| سوئیچ              | توضیح                          |
| ------------------ | ------------------------------ |
| `/Ohook`           | نصب و فعال‌سازی آفیس با Ohook  |
| `/Ohook-Uninstall` | حذف Ohook و لغو فعال‌سازی آفیس |

### TSforge (ابزار دوره آزمایشی)

| سوئیچ                        | توضیح                                                            |
| ---------------------------- | ---------------------------------------------------------------- |
| `/Z-Windows`                 | فعال‌سازی فقط ویندوز با TSforge                                  |
| `/Z-ESU`                     | فعال‌سازی فقط ESU (آپدیت‌های امنیتی تمدیدشده)                    |
| `/Z-Office`                  | فعال‌سازی فقط آفیس با TSforge                                    |
| `/Z-ProjectVisio`            | فعال‌سازی فقط Project/Visio                                      |
| `/Z-WindowsESUOffice`        | فعال‌سازی همه (ویندوز/ESU/آفیس)                                  |
| `/Z-WinHost`                 | فعال‌سازی فقط میزبان KMS ویندوز                                  |
| `/Z-OffHost`                 | فعال‌سازی فقط میزبان KMS آفیس                                    |
| `/Z-APPX`                    | فعال‌سازی 8/8.1 APPXLOB                                          |
| `/Z-ID-ActivationIdGoesHere` | تعیین Activation ID دلخواه (ActivationIdGoesHere را ویرایش کنید) |
| `/Z-Reset`                   | ریست شمارنده rearm، دوره آزمایشی و حذف حالت تمپر/قفل کلید        |

#### اجبار روش فعال‌سازی

برای نادیده گرفتن تشخیص خودکار، یکی از این سوئیچ‌ها را اضافه کنید:

| سوئیچ      | توضیح                                                                           |
| ---------- | ------------------------------------------------------------------------------- |
| `/Z-SCID`  | اجبار استفاده از StaticCID (نیاز به اینترنت، مناسب ویندوز ۷ یا پایین‌تر نیست)   |
| `/Z-ZCID`  | اجبار استفاده از ZeroCID (مناسب بیلدهای زیر 19041؛ برای 26100.4188+ مناسب نیست) |
| `/Z-KMS4k` | اجبار استفاده از KMS4k (فقط لایسنس ولوم، فعال‌سازی ۴۰۰۰ ساله)                   |

### KMS38

| سوئیچ                     | توضیح                           |
| ------------------------- | ------------------------------- |
| `/KMS38`                  | فعال‌سازی با KMS38              |
| `/KMS38-NoEditionChange`  | فعال‌سازی KMS38 بدون تغییر نسخه |
| `/KMS38-RemoveProtection` | حذف محافظت KMS38                |

### KMS آنلاین

| سوئیچ                         | توضیح                                                  |
| ----------------------------- | ------------------------------------------------------ |
| `/K-Windows`                  | فعال‌سازی فقط ویندوز                                   |
| `/K-Office`                   | فعال‌سازی فقط آفیس                                     |
| `/K-ProjectVisio`             | فعال‌سازی فقط Project/Visio                            |
| `/K-WindowsOffice`            | فعال‌سازی همه ویندوز و آفیس                            |
| `/K-NoEditionChange`          | عدم تغییر خودکار نسخه برای KMS                         |
| `/K-NoRenewalTask`            | عدم نصب تسک تمدید خودکار پس از فعال‌سازی               |
| `/K-Uninstall`                | حذف KMS آنلاین و تسک تمدید                             |
| `/K-Server-YOURKMSSERVERNAME` | تعیین آدرس سرور KMS (YOURKMSSERVERNAME را ویرایش کنید) |
| `/K-Port-YOURPORTNAME`        | تعیین پورت KMS (YOURPORTNAME را ویرایش کنید)           |

### سایر سوئیچ‌ها

- `/S` — اجرای بی‌صدا (خروجی ندارد، اما پنجره CMD باز می‌شود)

---

### مثال استفاده

#### پاورشل وان‌لاینر

```powershell
& ([ScriptBlock]::Create((irm https://get.activated.win))) /HWID /Ohook
```

- به جای `/HWID /Ohook` هر ترکیبی از سوئیچ‌ها را می‌توانید وارد کنید.

#### نکات

- با وجود هر سوئیچ، اسکریپت به صورت خودکار و بی‌نیاز به کاربر اجرا می‌شود.
- سوئیچ `/S` در نسخه فایل‌های جدا MAS کار نمی‌کند.
- سوئیچ‌ها حساس به بزرگی/کوچکی حروف نیستند و با فاصله جدا می‌شوند.
- سوئیچ حذف KMS نسبت به سایر سوئیچ‌های KMS اولویت دارد.

---
