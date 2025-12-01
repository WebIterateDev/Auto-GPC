// Handle extension icon click
chrome.action.onClicked.addListener(() => {
    chrome.tabs.create({ url: "https://gpc.webiterate.dev/" });
});
