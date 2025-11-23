# Auto GPC

**Auto GPC** is a lightweight Chrome extension that automatically opts you out of data sharing and selling by sending the [Global Privacy Control (GPC)](https://globalprivacycontrol.org/) signal to all websites you visit.

## Features

- **Universal Opt-Out**: Sends the `Sec-GPC: 1` HTTP header with every request.
- **JavaScript Signal**: Automatically sets `navigator.globalPrivacyControl = true` on all pages.
- **Privacy First**: Runs locally, collects no data, and has no analytics.
- **Legally Recognized**: The GPC signal is legally enforceable under **CCPA (California)**, **CPA (Colorado)**, and other privacy laws.

## Privacy Policy

This extension does not collect, store, or transmit any user data. It purely acts as a signaling mechanism to protect your privacy.

## License

MIT License