---
layout: doc
outline: deep
title: 'HWID (digital license): Windows & Office Activation Guide'
description: 'Comprehensive open-source guide to safely activate Windows 10/11 and Office using HWID in under 40 seconds. Includes troubleshooting tips and detailed comparisons.'
date: 2025-05-04
editLink: true
head:
  - - meta
    - name: description
      content: Safely activate Windows 10/11 and Microsoft Office using official open-source methods like HWID. Includes permanent and renewable options with full guides.
  - - meta
    - name: keywords
      content: digital license generation without kms, windows activation, office activation, hwid, activate windows 11, activate office 2021, open-source tools
  - - meta
    - property: og:title
      content: Safe and Permanent Activation for Windows and Office
  - - meta
    - property: og:description
      content: A full open-source guide to activating Windows 10/11 and Microsoft Office using reliable tools like HWID
---

# HWID : Windows & Office Activation Guide

::: tip Instant Windows 10/11 and Office Activation in under 40-Second.

- This has some details about the **HWID** (Digital License) method.
- Comprehensive open-source guide to safely activate Microsoft products using `HWID`. Includes troubleshooting tips and detailed comparisons.'

:::

<br/>

## Scope

How and why `HWID` works is somewhat complicated because of all the preliminary "knowledge" required to know why the very thing abused by HWID activators exists at all. Hence, this document. <br/>

## Digital Licenses

`Digital Licenses` (recently renamed to `Digital Entitlements`, but no one cares) are a fancy DRM invention by the geniuses over at Microsoft to make the Microsoft Store at least somewhat relevant.

Their purpose is to be proof of being licensed to use a piece of software (Please note that **You will own nothing and you will be happy** and **This software is licensed, not sold)** assigned to a Microsoft account.

There is a very long explanation for what keeps track of digital licenses, but that's somewhat complicated and I don't know everything.

Basically, there is a couple of components that keep track of these licenses and manage all the talking with the Microsoft Store and that talk to software components to tell them what Windows users are allowed to do with their computers. These are the things we want to accept our forgeries. <br/>

## The Free Windows 10 Upgrade

This activation method was at one point referred to as the "Digital License Generation without KMS or predecessor install/upgrade" and that name is just a tiny bit better and more descriptive than "HWID/KMS38".

During the free Windows 10 upgrade period, any activated system (this is the "predecessor") that upgraded to Windows 10 got a free digital license. This promotion is long over, but the free upgrade still works.

This type of reactivation/transfer (legal or otherwise) is actually used during **every single upgrade**, including between individual versions of Windows 10. This mode of activation is what we fake at the moment of writing. <br/>

## Mechanism of Activation Transfer

The main tool that facilitates the license transfer is called **GatherOsState** (full name: _Gather Downlevel OS Activation State_).

This tool collects, other than the titular activation state, the following information:

- Pre-upgrade **Windows Version** (eg. "NT 10.0.10240")
- **Hardware ID**
- One of the following:
  - OS **Product family name**
  - KMS Activation expiration time
- MSDM OEM product key

These are put into a file called the Genuine Authorization Ticket (`GenuineTicket.xml`) and used by `ClipUp.exe` in a process referred to as "License Migration". <br/>

## Hardware ID

The activation method's name - "HWID" - refers to this very parameter so it must be important.

The Hardware ID is a magical data structure built by evaluating the system's hardware. In the ticket, it is found under the base64 string `SessionId`. The `Hwid` string is the base64 representation of the `HWID_BLOCK` structure. <br/>

## HWID_BLOCK

```c
struct HWID_BLOCK {
    uint16_t wSize;
    uint16_t wVersion; // 0 for all
    uint16_t threshold; // Set to 0x13
    struct HWID hwid; // variable length
    struct TIMEWEIGHT tw; // variable length
}
```

<br/>

## HWID

```c
struct HWID {
    uint16_t size;
    uint16_t version;
    uint16_t instances[9];
    uint16_t dock_or_PCMCIA;
    uint16_t hashRAM;
    uint16_t hashBIOS;
    uint16_t instanceHashes[];
};
```

The hashes are all SHA-256 truncated to 15 bits; the 16th bit is set to whether the device is removable (1 if removable). <br/>

<br/>

### version

This is the version of the hardware ID. It is set to `0` for all implementations I'm aware of. <br/>

### nInstances

This is an array of 9 counts of instances of hardware per type of hardware. The types are, in order (by 0-based index):

0.  `CDROM` or `Mobile Broadband`
1.  `Hard Disk Controllers`
2.  `Hard Disk Drives`
3.  `Displays`
4.  `SCSI Adapters` or `Bluetooth Controllers`
5.  `Audio Adapters`
6.  `Unused`
7.  `Network Cards`
8.  `CPUs`

When there is an "or" betwen two types, the kind of device that has more instances is chosen. <br/>

<br/>

### bDockOrPCMCIA

This is set to 1 if non-user-provided docking info or PCMCIA is present. <br/>

### hashRAM

This is a hash of the amount of RAM in the local system. It is rather advanced (supports NUMA and such) and is more than just the amount or a hash thereof. <br/>

### hashSMBIOS

This is a hash of the entire SMBIOS table. <br/>

### instanceHashes

These are the hashes for all components as per `nInstances`. For removable devices, the least significant bit is used as a flag for whether the device is removable or not.

Removability is assessed via PnP info. You can check it yourself with Powershell's `Get-PnpDeviceProperty -KeyName DEVPKEY_Device_RemovalPolicy` for any device you like. These values (`CM_REMOVAL_POLICY_[…]`) are mapped to a single bit set if the device is removable.

Some of the devices are only counted when they are not removable. Exact info on that when I stop being lazy. <br/>

## Timeweight

```c
struct TIMEWEIGHT {
    struct weight {
        uint8_t type;
        uint16_t weight;
    } weights[];
}
```

The timeweight is a structure that contains information on how important certain hardware elements are. The structure is constant across Windows 10's history (not thoroughly verified).

The type corresponds to identifiers of Hardware Collectors in the HWID algorithm (you can find the values in the [massgravel/hwid-stuff][1] repo) and the weight is how "important" a component is.

When **locally** verifying a hardware ID, you sum all the weights of components matching with the license's HWID and determine if they are equal to or over the threshold. If they aren't, the HWID does not match (`ClipUp` exits with an error).

### Further reading

If you're interested, the (somewhat outdated but still matching) patent for this type of Hardware ID can be found [patents.googlr.com/][2]. <br/>

## Product Family Name

The **Product family name** is a string that identifies a product family in the Microsoft store. When it comes to Windows, it is composed of a few mostly stationary parts:

```bash
Microsoft.Windows.191.X21-99682_8wekyb3d8bbwe
```

The above PFN corresponds to the following fields:

```bash
Package Identity Name: Microsoft.Windows.191.X21-99682
Publisher String: 8wekyb3d8bbwe
```

In turn, the parts of Package Identity Name are:

- **Product**: `Microsoft Windows`
- **SKU ID**: `191` (IoT Enterprise LTSC)
- **Product Key Part Number**: `X21-99682`

### Publish string

The publisher string is made by hashing some data about the publisher [stackoverflow.com/questions/][3]. For all intents and purposes, it's a constant value. <br/>

### SKU ID

This value corresponds to the edition. You can find an (almost) full list of these IDs in Windows SDK's `winnt.h`. <br/>

### Product Key Part Number

The product key part number is a value specific to a given range of product key IDs belonging to a given group. Most commonly, you can find it on COA stickers. It's basically the "signature" of a key range; different ranges can have different policies, some ranges can be reserved for testing, etc. etc.

The part numbers can also be specific to markets (basically countries) in the Store itself, though I have no concrete examples of this.

[1]: https://github.com/massgravel/hwid-stuff
[2]: https://patents.google.com/patent/US7302590B2
[3]: https://stackoverflow.com/questions/21568483/how-to-calculate-publisherid-from-publisher
