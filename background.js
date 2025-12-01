// handle first run
chrome.runtime.onInstalled.addListener((details) => {
    if (details.reason === "install") {
        chrome.tabs.create({ url: "https://gpc.webiterate.dev/" });
    }
});