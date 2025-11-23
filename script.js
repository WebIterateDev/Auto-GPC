(function() {
  try {
    // Define on Navigator.prototype so getOwnPropertyDescriptor works as sites expect.
    const desc = {
      get: function() { return true; },
      configurable: false
    };
    // Some environments prefer defineProperty on prototype; guard in case it already exists.
    const proto = Navigator.prototype;
    const key = 'globalPrivacyControl';
    const existing = Object.getOwnPropertyDescriptor(proto, key);
    if (!existing || existing.configurable) {
      Object.defineProperty(proto, key, desc);
    }
  } catch (e) {
    // As a fallback, define on the instance (less ideal for detection, but better than nothing).
    try {
      Object.defineProperty(navigator, 'globalPrivacyControl', {
        value: true,
        configurable: false
      });
    } catch (_) {}
  }
})();