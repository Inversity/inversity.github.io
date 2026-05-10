---
layout: misc
title: Babeth Plan of Attack
description: Dove QOL overview
category: dove
date: 09/05/2026
permalink: /dove-of-attack/
tags: [Babeth, dove, quality of life, finally, angy, stupid fucking website, meow, me-ow]
---

This is a document outlining the hour I get to spend ~forcing~ hanging out with Babeth and making her life better via tech.

## Attack Vectors

1. **1Password:** Setup **1Password** as her password manager
    1. **PC:** Desktop App + Chrome Extension
        - **Download Link:** [1Password for Windows](https://c.1password.com/dist/1P/win8/1PasswordSetup-latest.msixbundle)
        - Set **1Password** as default Password Manager and disable saving passwords, identity, personal details, and cards elsewhere (Google)
    2. **iOS:** App, Safari Extension, Chrome Extension
        - **Download Link:** [1Password for iOS](https://apps.apple.com/us/app/1password-password-manager/id1511601750)
        - Set **1Password** as default Password Manager and disable saving passwords, identity, personal details, and cards elsewhere (KeyChain + Google)
    3. Verify where her passwords, identity, personal details, and cards are currently stored:
        - Safari/iOS Keychain
            - Search `AutoFill`
        - Chrome/Google Passwords
            - [Google Password Manager](https://passwords.google.com/)
        - Elsewhere
    4. Note which set of passwords are most up to date and if any are not used/can be omitted
    5. Export all sources of passwords, personal details, and cards
    6. Import passwords, personal details, and cards into **1Password**, omitting the ones that are outdated
        - Transfer OTP
    7. Verify **1Password** is working as expected on all devices
    8. **IMPORTANT:** Create new Passkeys for most used sites
    9. Teach Babeth how to use and feel comfortable with **1Password**
        1. How to use **1Password** when she needs a passwords/address/identity/cards
        2. How to save a login
        3. How to generate password
2. **AdGuard** on all devices (optional VPN using my Mullvad OpenGuard configuration)
    1. **PC**
        1. **AdGuard Desktop:**
            - **Download Link:** [AdGuard AdBlocker for Windows](https://static.adtidy.org/windows/beta/setup.exe)
        2. **Browser Assistant:**
          - **Download Link:** [AdGuard Browser Assistant for Google Chrome](https://chromewebstore.google.com/detail/adguard-browser-assistant/fbohpolgemkbfphodcfgnpjcmedcjhpn)
    2. **iOS**
            - **Download Link:** [AdGuard AdBlocker for iOS/Safari](https://apps.apple.com/us/app/adguard-ad-blocker-for-safari/id1047223162)
            - Configure Safari Extensions
    3. **DNS Servers**
        1. **QUIC**
            - [**Default Server** | Blocks Ads & Trackers](https://dns.adguard-dns.com/dns-query)
            - [**Non-Filtering Server** | Will not block ads, trackers, or any other DNS requests](https://quic://unfiltered.adguard-dns.com)
        2. **HTTPS**
            - [**Default Server** | Blocks Ads & Trackers](https://dns.adguard-dns.com/dns-query)
            - [**Non-Filtering Server** | Will not block ads, trackers, or any other DNS requests](https://unfiltered.adguard-dns.com/dns-query)
3. **Privacy Overhaul:**
    1. Go over privacy/data retention for:
        1. Google
        2. Apple
        3. Anthropic/other Assistant
4. **(Optional) Mullvad**
    1. **PC:**
        - **Download Link:** [Mullvad VPN for Windows](https://releases.mullvad.net/desktop/installer-downloader/1.2.0/Install%20Mullvad%20VPN.exe)
    2. **iOS:**
        - **Download Link:** [Mullvad VPN for iOS](https://apps.apple.com/us/app/mullvad-vpn/id1488466513)
