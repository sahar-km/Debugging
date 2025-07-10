---
layout: doc
outline: deep
title: 'روش فعال‌سازی ویندوز با KMS'
description: 'راهنمای فعال‌سازی ویندوز و آفیس با استفاده از روش KMS'
date: 2024-04-17
editLink: true
head:
  - - meta
    - name: keywords
      content: KMS, فعال‌ساز آفیس، ویندوز 10، ویندوز 11
---

<div class="rtl">
  
# فعال‌سازی دستی با KMS

> این راهنما نحوه فعال‌سازی ویندوز به‌مدت ۱۸۰ روز را با استفاده از روش KMS (خدمات مدیریت کلید) توضیح می‌دهد.
>
> این روش، یکی از کانال‌های رسمی فعال‌سازی توسط مایکروسافت برای لایسنس‌های حجمی است و روشی موقتی، ایمن و قابل‌اعتماد محسوب می‌شود.

::: tip پیش‌نیازها

- اتصال پایدار به اینترنت
- دسترسی ادمین (Administrator) داشتن cmd در کامپیوتر شما
- فعال‌ کردن VPN درصورت اجرا نشدن فرامین. (فعلا دامنه ‌ها فیلتر نشدن پس طبیعتا برای اجرای دستورها نیازی به فعال کردن vpn نیست).

:::

</div><br/>

## مرحله ۱: اجرای Command Prompt با حالت مدیر سیستم

1. روی دکمه `Start` یا آیکون `Search` در taskbar کلیک کنید.
2. عبارت `cmd` یا `Command Prompt` را تایپ کنید.
3. روی گزینه **Run as administrator** کلیک نمایید. <br/>

<p align="center">
  <img src="https://github.com/user-attachments/assets/4465a2d3-6c93-4ee1-bb63-94ab7b8e06ac" alt="run-cmd-as-admin" width="320px" /></p><br/>

::: details روش‌های دیگر برای اجرای CMD

**۲. استفاده از Run box**

- 1. **باز کردن Run box:** کلیدهای `Win (⊞) + R` را همزمان فشار دهید.
- 2. **تایپ کنید:** `cmd` یا `command prompt`.
- 3. **اجرا به عنوان مدیر:** به جای فشردن Enter، کلیدهای `Ctrl + Shift + Enter` را فشار دهید. این ترکیب کلیدی، command prompt را با دسترسی مدیر سیستم اجرا می‌کند.
- 4. اگر پنجره User Account Control ظاهر شد، روی `Yes` کلیک کنید تا دسترسی مدیریت داده شود. <br/>

**۳. استفاده از Power User Menu**

- 1. روی آیکون `Windows Start` در `Taskbar` کلیک راست کنید تا منوی حاوی میانبرهای ابزارهای پرکاربرد باز شود، همچنین می‌توانید این منو را با `Win (⊞) + x` باز کنید.
- 2. سپس بر روی گزینه **Windows Terminal (Admin)** در ویندوز 11 و یا **Windows PowerShell (Admin)** در ویندوز 10 کلیک کنید.

همچنین می‌توانید از [این لینک][2] برای مشاهده ۸ روش اجرای **cmd** و از [این لینک][1] برای اجرای PowerShell به 10روش مختلف در ویندوز استفاده کنید.

:::

## مرحله ۲: نصب کلید عمومی KMS

در پنجره Command Prompt، دستور زیر را اجرا کنید.
حتماً `Your-License-Key` را با کلید مناسب از جدول زیر که با نسخه ویندوز شما هم‌خوانی دارد جایگزین کنید. <br/>

```powershell
slmgr /ipk Your-License-Key
```

::: tip برای بررسی نسخه ویندوز شما

**۱. استفاده از میانبر کیبورد**

- کلیدهای **`Win (⊞) + Pause/Break`** را همزمان فشار دهید.
  - این کار بخش **About** را در **Settings** مستقیماً باز می‌کند و شما نسخه ویندوز خود را در زیر **Windows specifications** خواهید دید. <br/>

<p align="center">
  <img src="https://github.com/user-attachments/assets/647ef16b-9208-4ff3-a94b-825ffa99721f" alt="about-system" width="320px" /></p><br/>

::: details برای مشاهده روش‌های بیشتر کلیک کنید

**۱. استفاده از میانبر کیبورد**

- کلیدهای **`Win (⊞) + Pause/Break`** را همزمان فشار دهید.
  - این کار بخش **About** را در **Settings** مستقیماً باز می‌کند و شما نسخه ویندوز را در زیر **Windows specifications** خواهید دید. <br/>

**۲. استفاده از تنظیمات سیستم**

- 1. روی دکمه 🪟`Start` کلیک کنید و سپس روی ⚙️`Settings` کلیک کنید.
- 2. روی 💻`System` کلیک کنید.
- 3. به پایین اسکرول کرده و روی ℹ️`About` کلیک کنید.
- 4. در زیر `Windows specifications`، نسخه ویندوز شما را خواهید دید. <br/>

**۳. استفاده از Run باکس**

- 1. کلیدهای `Win (⊞) + R` را فشار دهید تا Run dialog box باز شود.
- 2. یکی از موارد `ms-settings:about` یا `winver` یا `msinfo32` را تایپ کنید و Enter را فشار دهید.
     > پنجره‌ای ظاهر می‌شود که نسخه ویندوز، Build number و سایر جزئیات را نشان می‌دهد. <br/>

<p align="center">
  <img src="https://github.com/user-attachments/assets/f764797a-e07f-4c58-b932-bfe7b359a7bd" alt="winver-command" width="320px" /></p>

<p align="center">
  <img src="https://github.com/user-attachments/assets/4c7edc15-1c02-4d7b-ab5f-df70eaff8ad7" alt="winver-response" width="320px" /></p><br/>

<p align="center">
  <img src="https://github.com/user-attachments/assets/a6360712-0ad0-4be4-b0a4-01171d293d83" alt="msinfo32-command" width="320px" /></p>

<p align="center">
  <img src="https://github.com/user-attachments/assets/8592c1bd-4a1a-47c1-bd21-0eb17049db31" alt="msinfo32-response" width="320px" /></p><br/>

**۴. استفاده از Command Prompt یا PowerShell** [^2]

- 1. روی دکمه `Start` یا آیکون search کلیک کنید.
- 2.**تایپ کنید:** `cmd` یا `Command Prompt`.
- 3. در Command Prompt، `systeminfo` یا `systeminfo | findstr /B /C:"OS Name" /B /C:"OS Version"` را تایپ کرده و Enter را فشار دهید.

<p align="center">
  <img src="https://github.com/user-attachments/assets/4c7edc15-1c02-4d7b-ab5f-df70eaff8ad7" alt="findstr command" width="320px" /></p><br/>

- همچنین می‌توانید PowerShell یا Command Prompt را اجرا کنید و `slmgr /dlv` را تایپ کنید، سپس Enter را فشار دهید.
  - دستور /dlv اطلاعات مفصل لایسنس را نمایش می‌دهد.
    - توجه کنید که خروجی "Home" را نشان می‌دهد همانطور که در تصویر زیر مشاهده می‌کنید:

<p align="center">
  <img src="https://github.com/user-attachments/assets/86925e56-7cac-4b53-8ccf-6addcd799ece" alt="slmgr-command" width="320px" /></p><br/>

:::

لطفاً یکی از **کلیدهای لایسنس** را از لیست زیر که **با نسخه ویندوز شما مطابقت دارد** انتخاب کنید و آن را با عبارت `Your-License-Key` در دستور جایگزین کنید.

> شما می‌توانید هر چیزی که کپی کرده‌اید را با **کلیک راست** در CMD یا PowerShell یا سایر ترمینال‌ها paste کنید.

### کلیدهای لایسنس حجمی (GVLK)

| نسخه ویندوز      | کلید GVLK                     |
| :--------------- | :---------------------------- |
| Home             | TX9XD-98N7V-6WMQ6-BX7FG-H8Q99 |
| Home N           | 3KHY7-WNT83-DGQKR-F7HPR-844BM |
| Home SL [^3]     | 7HNRX-D7KGG-3K4RQ-4WPJ4-YTDFH |
| Home CS [^4]     | PVMJN-6DFY6–9CCP6–7BKTT-D3WVR |
| Pro              | W269N-WFGWX-YVC9B-4J6C9-T83GX |
| Pro N            | MH37W-N47XK-V7XM9-C7227-GCQG9 |
| Education        | YNMGQ-8RYV3-4PGQ3-C8XTP-7CFBY |
| Education N      | 84NGF-MHBT6-FXBX8-QWJK7-DRR8H |
| Pro Education    | NW6C2-QMPVW-D7KKK-3GKT6-VCFB2 |
| Pro Education N  | 2WH4N-8QGBV-H22JP-CT43Q-MDWWJ |
| Pro for W [^5]   | DXG7C-N36C4-C4HTG-X4T3X-2YV77 |
| Pro N for W [^6] | WYPNQ-8C467-V2W6J-TX4WX-WT2RQ |
| Enterprise       | NPPR9-FWDCX-D2C8J-H872K-2YT43 |
| Enterprise N     | DPH2V-TTNVB-4X9Q3-TJR4H-KHJW4 |
| Team             | XKCNC-J26Q9-KFHD2-FKTHY-KD72Y |
| S                | V3WVW-N2PV2-CGWC3-34QGF-VMJ2C |
| SE               | KY7PN-VR6RX-83W6Y-6DDYQ-T6R4W |

<br/>

<p align="center">
  <img src="https://github.com/user-attachments/assets/d5d93702-7865-4552-85d0-6916b1331bc0" alt="Install-KMS-Key" width="540px" /></p>

<p align="center">
  <img src="https://github.com/user-attachments/assets/50c23cad-7690-49fb-bf1c-d1c7cc66f0fe" alt="install-KMS-keyy" width="540px" /></p><br/>

::: details کلیدهای لایسنس جایگزین

|           **کلید**            |    **نسخه**    |
| :---------------------------: | :------------: |
| TX9XD-98N7V-6WMQ6-BX7FG-H8Q99 |      Home      |
| 3KHY7-WNT83-DGQKR-F7HPR-844BM |     Home N     |
| 7HNRX-D7KGG-3K4RQ-4WPJ4-YTDFH |    Home SL     |
| PVMJN-6DFY6–9CCP6–7BKTT-D3WVR |    Home CS     |
| W269N-WFGWX-YVC9B-4J6C9-T83GX |  Professional  |
| MH37W-N47XK-V7XM9-C7227-GCQG9 | Professional N |
| NW6C2-QMPVW-D7KKK-3GKT6-VCFB2 |   Education    |
| 2WH4N-8QGBV-H22JP-CT43Q-MDWWJ |  Education N   |
| NPPR9-FWDCX-D2C8J-H872K-2YT43 |   Enterprise   |
| DPH2V-TTNVB-4X9Q3-TJR4H-KHJW4 |  Enterprise N  |

:::

<br/>

## مرحله ۳: تنظیم آدرس سرور KMS

سپس، سیستم خود را به یک سرور KMS عمومی متصل کنید. این دستور را اجرا کنید:

```powershell
slmgr /skms kms8.msguides.com
```

<p align="center">
  <img src="https://github.com/user-attachments/assets/edd0835f-c314-4ef8-a87d-a33e29f3f7c0" alt="set-kms-server" width="540px" /></p><br/>

## مرحله ۴: فعال‌سازی ویندوز

در نهایت، با اجرای این دستور فعال‌سازی را انجام دهید:

```powershell
slmgr /ato
```

<p align="center">
  <img src="https://github.com/user-attachments/assets/95e014e5-8946-4036-84ca-77ebb6122b1b" alt="active-windows" width="540px" /></p><br/>

## مرحله ۵: بررسی وضعیت فعال‌سازی

**همه چیز آماده است!**

برای بررسی وضعیت فعال‌سازی **`ویندوز ۱۰`**، از این طریق اقدام کنید:  
 **Settings → Update & Security → Activation** . [^7]

برای بررسی وضعیت فعال‌سازی **`ویندوز ۱۱`**، بر روی دکمه Start کلیک کرده و سپس از این طریق اقدام کنید:  
Settings → System → Activation. [^8] <br/>

<p align="center">
  <img src="https://github.com/user-attachments/assets/da52f1bb-79c9-45db-bade-a0f56cd0a739" alt="activated" width="540px" /></p><br/>

### رفع مشکلات

- **خطای 0xC004F074:** معمولاً به این معنی است که اتصال اینترنت شما ناپایدار است یا سرور شلوغ است. مطمئن شوید که آنلاین هستید و دوباره دستور `slmgr /ato` را امتحان کنید.
- **این روش کار نمی‌کند؟** اگر همچنان مشکل دارید، روش **HWID** را از [راهنمای اصلی](./index-fa) امتحان کنید.
  - برای کمک بیشتر، از **[بخش بحث][3]** بازدید کنید یا مستقیماً [ایمیل][4] برای من بفرستید. <br/>

**کنجکاو باشید 🤍**

<br><br/>

### درباره کلیدهای میانبر

::: details از کلیدهای میانبر برای باز کردن برنامه‌های پیش‌فرض در منوی Win+X استفاده کنید.

**منوی Power user** یک منوی کوتاه است که برخی از ابزارهای پیشرفته سیستم مانند event viewer، device manager، disk management، computer management، task manager و غیره را فهرست می‌کند.

<p align="center">
  <img src="https://github.com/user-attachments/assets/7fa52188-2ac2-4b4d-9600-cf3f92e11d3d" alt="windows-plus-x-menu" width="320px" /></p><br/>

برنامه‌های پیش‌فرض در منوی Power User دارای کلید میانبر متناظر هستند. آشنایی با کلیدهای میانبر برنامه‌های معمول می‌تواند زمان زیادی صرفه‌جویی کند و بهره‌وری را افزایش دهد.  
به عنوان مثال:

- فشردن **`Windows + X`** منوی **Power User** (منوی Win+X) را باز می‌کند.
- فشردن کلید دوم (مثل `F`، `B`، `U`) برنامه متناظر را انتخاب می‌کند.
- برای گزینه‌های خاموش/راه‌اندازی مجدد، `U` زیرمنو را باز می‌کند، سپس `I`، `S`، `U` هرکدام عمل خاصی را انجام می‌دهند، برای مثال می‌توانید `R` را برای راه‌اندازی مجدد سیستم فشار دهید.

در زیر کلیدهای میانبر متناظر با هر برنامه آمده است:

| میانبر کیبورد               | برنامه                   |
| --------------------------- | ------------------------ |
| `Windows + X`, سپس `F`      | Apps and Features        |
| `Windows + X`, سپس `B`      | Mobility Center          |
| `Windows + X`, سپس `O`      | Power Options            |
| `Windows + X`, سپس `V`      | Event Viewer             |
| `Windows + X`, سپس `Y`      | System                   |
| `Windows + X`, سپس `M`      | Device Manager           |
| `Windows + X`, سپس `W`      | Network Connections      |
| `Windows + X`, سپس `K`      | Disk Management          |
| `Windows + X`, سپس `G`      | Computer Management      |
| `Windows + X`, سپس `A`      | Windows Terminal (Admin) |
| `Windows + X`, سپس `T`      | Task Manager             |
| `Windows + X`, سپس `N`      | Settings                 |
| `Windows + X`, سپس `E`      | File Explorer            |
| `Windows + X`, سپس `S`      | Search                   |
| `Windows + X`, سپس `R`      | Run                      |
| `Windows + X`, سپس `U`, `I` | Sign out                 |
| `Windows + X`, سپس `U`, `S` | Sleep                    |
| `Windows + X`, سپس `U`, `U` | Shut Down                |
| `Windows + X`, سپس `U`, `R` | Restart                  |
| `Windows + X`, سپس `D`      | Desktop                  |

:::

[^1]: ۱۰ روش برای اجرای PowerShell در ویندوز [اینجا بخوانید][1].

[^2]: ساده‌ترین روش دیگر برای اجرای **PowerShell** از طریق **Power User Menu** می‌باشد:

- روی آیکون `Windows Start` در `Taskbar` کلیک راست کنید تا منوی حاوی میانبرهای ابزارهای پرکاربرد باز شود، همچنین می‌توانید این منو را با `Win (⊞) + x` باز کنید.
- سپس بر روی گزینه **Windows Terminal (Admin)** در ویندوز 11 و یا **Windows PowerShell (Admin)** در ویندوز 10 کلیک کنید.

[^3]: نسخه تک زبانه Home.

[^4]: نسخه مخصوص کشور Home.

[^5]: Professional for Workstations.

[^6]: Professional N for Workstations.

[^7]: برای بررسی وضعیت فعال‌سازی ویندوز 10، به Settings → Update & Security → Activation بروید. وضعیت فعال‌سازی شما در آنجا فهرست شده است. اگر ویندوز فعال باشد، باید "Activated" را با علامت تیک سبز ببینید.

[^8]: برای بررسی وضعیت فعال‌سازی ویندوز 11، Settings را با کلیک روی دکمه Start باز کنید و سپس Settings → System → Activation را انتخاب کنید. وضعیت فعال‌سازی نمایش داده می‌شود و نشان می‌دهد که آیا ویندوز فعال است یا خیر، همراه با جزئیات روش فعال‌سازی و هر حساب مایکروسافت پیوند شده.

[1]: https://www.minitool.com/news/open-windows-11-powershell.html
[2]: https://www.minitool.com/news/open-command-prompt-windows-11.html
[3]: https://github.com/NiREvil/windows-activation/discussions
[4]: mailto:diana.clk01@gmail.com
[rainbow]: https://github.com/NiREvil/vless/assets/126243832/1aca7f5d-6495-44b7-aced-072bae52f256
