// Content script that injects gpc.js into the MAIN world
// This runs in the ISOLATED world but creates a script element
// that executes in the page's MAIN world for proper GPC detection

const script = document.createElement('script');
script.src = chrome.runtime.getURL('script.js');
(document.head || document.documentElement).appendChild(script);
script.remove();
