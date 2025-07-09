---
layout: doc
outline: deep
title: "KMS Activation Method"
description: "A guide to activating Windows and Office using the KMS method."
date: 2024-04-17
editLink: true
head:
  - - meta
    - name: keywords
      content: KMS, Office, activation, Windows 10, Windows 11, windows license
---

# Manual Activation with KMS  

> This guide explains how to activate Windows for 180 days using the Key Management Service (KMS) method.  
>
> This is an official activation channel provided by Microsoft for volume licensing and is a safe, reliable, and temporary activation solution.  

::: tip Prerequisites
- A stable internet connection.
- Administrator privileges for CMD on your computer.  
:::

<br/>  

## Step 1: Open Command Prompt as Administrator

1.  Click the `Start` button or search icon.
2.  Type `cmd` or `Command Prompt`.
3.  Select **Run as administrator**. [^1]  

<p align="center">
  <img src="https://github.com/user-attachments/assets/4465a2d3-6c93-4ee1-bb63-94ab7b8e06ac" alt="run-cmd-as-dmin" width="320px" /></p><br/>

## Step 2: Install a Generic KMS Client Key

In the Command Prompt window, run the following command.  
You must replace `Your-License-Key` with the key from the table below that matches your Windows edition. <br/>

```powershell
slmgr /ipk Your-License-Key
```  

::: tip To find your Windows edition

**Using a keyboard shortcut**   
- Simultaneously Press **`Win (⊞) + Pause/Break`** on your keyboard.  
  - This will open the **About** section in **Settings** directly. and you will see the Edition of your Windows under **Windows specifications**.  

**Using system settings**  
- 1. Click the 🪟`Start` button and then click ⚙️`Settings`.
- 2. Click on 💻`System`.
- 3. Scroll down and click on ℹ️`About`.
- 4. Under `Windows specifications`, you will see the Edition of your Windows. <br/>

<p align="center">
  <img src="https://github.com/user-attachments/assets/647ef16b-9208-4ff3-a94b-825ffa99721f" alt="about-system" width="320px" /></p><br/>
  
::: details Click here to see more ways

**Using the Run dialog**  
- 1. Press the `Win (⊞) + R` to open the Run dialog box.
- 2. Type the `ms-settings:about` Or `winver` Or `msinfo32` and press ENTER key.  
> A window will appear showing the Windows version and build number and other details.  

<p align="center">
  <img src="https://github.com/user-attachments/assets/f764797a-e07f-4c58-b932-bfe7b359a7bd" alt="winver-command" width="320px" /></p>  

<p align="center">
  <img src="https://github.com/user-attachments/assets/4c7edc15-1c02-4d7b-ab5f-df70eaff8ad7" alt="winver-response" width="320px" /></p><br/>

<p align="center">
  <img src="https://github.com/user-attachments/assets/a6360712-0ad0-4be4-b0a4-01171d293d83" alt="msinfo32-command" width="320px" /></p>

<p align="center">
  <img src="https://github.com/user-attachments/assets/8592c1bd-4a1a-47c1-bd21-0eb17049db31" alt="msinfo32-response" width="320px" /></p><br/>
  
**Using Command Prompt or PowerShell** [^2]  
1.  Click the `Start` button or search icon.
2.  Type `cmd` or `Command Prompt`.
  - At the Command Prompt, type `systeminfo` Or `systeminfo | findstr /B /C:"OS Name" /B /C:"OS Version"` and then press ENTER

<p align="center">
  <img src="https://github.com/user-attachments/assets/4c7edc15-1c02-4d7b-ab5f-df70eaff8ad7" alt="findstdr command" width="320px" /></p><br/>

- Also you can run the PowerShell or Command Prompt, and type `slmgr /dlv`, and then press ENTER.  
  - The /dlv command displays the detailed licensing information.  
    - Notice the output displays "Home" as seen in the following image:  

<p align="center">
  <img src="https://github.com/user-attachments/assets/86925e56-7cac-4b53-8ccf-6addcd799ece" alt="slmgr-command" width="320px" /></p><br/>

:::

Please select one of the **license keys** from the list that **matches your version of Windows** and replace it with the phrase `Your-License-Key` in the command.

> You can `paste` everything you copied  by **Right-clicking** in CMD Or PowerShell Or anoter terminals.  

### Generic Volume License Keys (GVLK)  

| Windows Edition        | GVLK Key                      |
|:-----------------------|:------------------------------|
| TX9XD-98N7V-6WMQ6-BX7FG-H8Q99 	|       Home       	|
| 3KHY7-WNT83-DGQKR-F7HPR-844BM 	|      Home N      	|
| 7HNRX-D7KGG-3K4RQ-4WPJ4-YTDFH 	|   Home sl [^3]   	|
| PVMJN-6DFY6–9CCP6–7BKTT-D3WVR 	|   Home cs [^4]   	|
| W269N-WFGWX-YVC9B-4J6C9-T83GX 	|        Pro       	|
| MH37W-N47XK-V7XM9-C7227-GCQG9 	|       Pro N      	|
| YNMGQ-8RYV3-4PGQ3-C8XTP-7CFBY 	|     Education    	|
| 84NGF-MHBT6-FXBX8-QWJK7-DRR8H 	|    Education N   	|
| NW6C2-QMPVW-D7KKK-3GKT6-VCFB2 	|   Pro Education  	|
| 2WH4N-8QGBV-H22JP-CT43Q-MDWWJ 	|  Pro Education N 	|
| DXG7C-N36C4-C4HTG-X4T3X-2YV77 	|  Pro for W [^5]  	|
| WYPNQ-8C467-V2W6J-TX4WX-WT2RQ 	| Pro N for W [^6] 	|
| NPPR9-FWDCX-D2C8J-H872K-2YT43 	|    Enterprise    	|
| DPH2V-TTNVB-4X9Q3-TJR4H-KHJW4 	|   Enterprise N   	|
| XKCNC-J26Q9-KFHD2-FKTHY-KD72Y 	|       Team       	|
| V3WVW-N2PV2-CGWC3-34QGF-VMJ2C 	|         S        	|
| KY7PN-VR6RX-83W6Y-6DDYQ-T6R4W 	|        SE        	|

<br/>  

<p align="center">
  <img src="https://github.com/user-attachments/assets/d5d93702-7865-4552-85d0-6916b1331bc0" alt="Install-KMS-Key" width="540px" /></p>  

<p align="center">
  <img src="https://github.com/user-attachments/assets/50c23cad-7690-49fb-bf1c-d1c7cc66f0fe" alt="install-KMS-keyy" width="540px" /></p><br/>
 
After running the command, you should see a success message. <br/>

## Step 3: Set the KMS Server Address

Next, point your system to a public KMS server. Run this command:  

```powershell
slmgr /skms kms8.msguides.com
```

<p align="center">
  <img src="https://github.com/user-attachments/assets/edd0835f-c314-4ef8-a87d-a33e29f3f7c0" alt="set-kms-server" width="540px" /></p><br/>  

## Step 4: Activate Windows

Finally, trigger the activation by running command:  

```powershell
slmgr /ato
```  

<p align="center">
  <img src="https://github.com/user-attachments/assets/95e014e5-8946-4036-84ca-77ebb6122b1b" alt="active-windows" width="540px" /></p><br/>

## Step 5: Check Activation Status

**You're all set!**   
To check the activation status of `Windows 10`, navigate to **Settings → Update & Security → Activation.**. [^7]  

To check the activation status of `Windows 11`, open Settings by clicking the Start button and then selecting **Settings → System → Activation.**. [^8]  

<p align="center">
  <img src="https://github.com/user-attachments/assets/da52f1bb-79c9-45db-bade-a0f56cd0a739" alt="activated" width="540px" /></p><br/>

### Troubleshooting

- **Error 0xC004F074:** This usually means your internet connection is unstable or the server is busy. Ensure you are online and try the `slmgr /ato` command again.  
- **Method Not Working?** If you're still having trouble, try the **HWID method** from the [Main Guide](./index).  
  - For additional help, visit the **[Discussion Section][2]** Or send [Email][3] Directly to me. <br/>

**Be curious 🤍**

### About Hotkeys 

::: details Use the hotkeys to open default programs in the Win+X Menu.  

The default programs in the Power User Menu have a corresponding hotkey. Familiarity with the hotkeys of common programs can save a lot of time and improve efficiency.  
For example:   
- Press **`Windows + X`** opens the **Power User Menu** (Win+X Menu).  
- The second keypress (e.g., `F`, `B`, `U`) selects the corresponding program.  
- For shutdown/restart options, `U` opens the submenu, followed by `I`, `S`, `U`, or  press `R` for reatart system.  
 
The following are the hotkeys corresponding to each program:  

| Keyboard Shortcut       | Program                  |
|-------------------------|--------------------------|
| `Windows + X`, then `F` | Apps and Features        |
| `Windows + X`, then `B` | Mobility Center          |
| `Windows + X`, then `O` | Power Options            |
| `Windows + X`, then `V` | Event Viewer             |
| `Windows + X`, then `Y` | System                   |
| `Windows + X`, then `M` | Device Manager           |
| `Windows + X`, then `W` | Network Connections      |
| `Windows + X`, then `K` | Disk Management          |
| `Windows + X`, then `G` | Computer Management      |
| `Windows + X`, then `A` | Windows Terminal (Admin) |
| `Windows + X`, then `T` | Task Manager             |
| `Windows + X`, then `N` | Settings                 |
| `Windows + X`, then `E` | File Explorer            |
| `Windows + X`, then `S` | Search                   |
| `Windows + X`, then `R` | Run                      |
| `Windows + X`, then `U`, `I` | Sign out          |
| `Windows + X`, then `U`, `S` | Sleep            |
| `Windows + X`, then `U`, `U` | Shut Down        |
| `Windows + X`, then `U`, `R` | Restart          |
| `Windows + X`, then `D` | Desktop                  |


[^1]: 10 Ways to run PowerShell in windows [read here][1].

[^2]: Another easiest way to run **PowerShell** is **Using Power User Menu**.  

- 1. Right-click the Windows Start icon on the Taskbar to open the menu containing shortcuts to frequently used tools. Also you can open this menu with `Win (⊞) + x`.  
- 1. Select **Windows Terminal (admin)** at windows 11 Or **Windows PowerShell (admin)** at Windows 10.    

[^3]: Home Single language version.

[^4]: Home Country Specific version.

[^5]: Professional for Workstations.

[^6]: Professional N for Workstations.

[^7]: To check the activation status of Windows 10, navigate to Settings → Update & Security → Activation. You will see your activation status listed there. If Windows is activated, you should see "Activated" with a green checkmark.  

[^8]: To check the activation status of Windows 11, open Settings by clicking the Start button and then selecting Settings → System → Activation. The activation status will be displayed, showing whether Windows is activated, along with details about the activation method and any linked Microsoft account.

[1]: https://www.minitool.com/news/open-windows-11-powershell.html
[2]: https://github.com/NiREvil/windows-activation/discussions/new/choose
[3]: mailto:diana.clk01@gmail.com
[rainbow]: https://github.com/NiREvil/vless/assets/126243832/1aca7f5d-6495-44b7-aced-072bae52f256
