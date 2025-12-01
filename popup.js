// DOM elements
const domainEl = document.getElementById('domain');
const statusCard = document.getElementById('statusCard');
const statusIcon = document.getElementById('statusIcon');
const statusTitle = document.getElementById('statusTitle');
const statusMessage = document.getElementById('statusMessage');
const gpcJsonLink = document.getElementById('gpcJsonLink');

// Status types
const STATUS = {
    SCANNING: 'scanning',
    SUPPORTED: 'supported',
    NOT_SUPPORTED: 'not-supported',
    ERROR: 'error'
};

// Icons
const ICONS = {
    check: `<svg class="check-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"></path>
    </svg>`,
    cross: `<svg class="cross-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"></path>
    </svg>`,
    warning: `<svg class="warning-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"></path>
    </svg>`
};

/**
 * Update the UI with the current status
 */
function updateStatus(status, title, message) {
    // Remove all status classes
    statusCard.classList.remove(STATUS.SCANNING, STATUS.SUPPORTED, STATUS.NOT_SUPPORTED, STATUS.ERROR);

    // Add new status class
    statusCard.classList.add(status);

    // Update icon
    switch (status) {
        case STATUS.SUPPORTED:
            statusIcon.innerHTML = ICONS.check;
            break;
        case STATUS.NOT_SUPPORTED:
            statusIcon.innerHTML = ICONS.cross;
            break;
        case STATUS.ERROR:
            statusIcon.innerHTML = ICONS.warning;
            break;
        case STATUS.SCANNING:
            statusIcon.innerHTML = `<svg class="spinner" viewBox="0 0 50 50">
                <circle class="path" cx="25" cy="25" r="20" fill="none" stroke-width="5"></circle>
            </svg>`;
            break;
    }

    // Update text
    statusTitle.textContent = title;
    statusMessage.textContent = message;
}

/**
 * Disable or enable the GPC JSON link
 */
function setGpcLinkState(enabled) {
    if (enabled) {
        gpcJsonLink.style.pointerEvents = '';
        gpcJsonLink.style.opacity = '';
        gpcJsonLink.classList.remove('disabled');
    } else {
        gpcJsonLink.style.pointerEvents = 'none';
        gpcJsonLink.style.opacity = '0.5';
        gpcJsonLink.classList.add('disabled');
    }
}

/**
 * Extract domain from URL
 */
function extractDomain(url) {
    try {
        const urlObj = new URL(url);
        return urlObj.hostname;
    } catch (e) {
        return 'Unknown';
    }
}

/**
 * Check GPC support for a domain
 */
async function checkGPCSupport(domain, url) {
    try {
        const urlObj = new URL(url);
        const gpcUrl = `${urlObj.protocol}//${urlObj.hostname}/.well-known/gpc.json`;

        // Fetch the GPC support resource
        const response = await fetch(gpcUrl, {
            method: 'GET',
            headers: {
                'Accept': 'application/json'
            },
            // Don't follow redirects automatically - we'll handle them
            redirect: 'follow'
        });

        // Check if response is successful
        if (!response.ok) {
            setGpcLinkState(false);
            updateStatus(
                STATUS.NOT_SUPPORTED,
                'GPC Not Supported',
                `No GPC support resource found (HTTP ${response.status})`
            );
            return;
        }

        // Check content type
        const contentType = response.headers.get('content-type');
        if (!contentType || !contentType.includes('application/json')) {
            updateStatus(
                STATUS.ERROR,
                'Invalid Response',
                'GPC resource must be application/json'
            );
            return;
        }

        // Parse JSON
        let data;
        try {
            data = await response.json();
        } catch (e) {
            updateStatus(
                STATUS.ERROR,
                'Invalid JSON',
                'GPC resource is not valid JSON'
            );
            return;
        }

        // Validate according to W3C spec
        if (typeof data !== 'object' || data === null || Array.isArray(data)) {
            updateStatus(
                STATUS.ERROR,
                'Invalid Format',
                'GPC resource must be a JSON object'
            );
            return;
        }

        // Check gpc member
        if (!('gpc' in data)) {
            updateStatus(
                STATUS.ERROR,
                'Missing GPC Field',
                'GPC resource must have a "gpc" member'
            );
            return;
        }

        // Validate gpc value
        if (data.gpc === true) {
            let message = 'This site respects GPC requests';
            if (data.lastUpdate) {
                message += ` (updated ${data.lastUpdate})`;
            }
            updateStatus(
                STATUS.SUPPORTED,
                'GPC Supported ✓',
                message
            );
        } else if (data.gpc === false) {
            updateStatus(
                STATUS.NOT_SUPPORTED,
                'GPC Not Supported',
                'This site explicitly does not support GPC'
            );
        } else {
            updateStatus(
                STATUS.ERROR,
                'Invalid GPC Value',
                'GPC value must be true or false'
            );
        }

    } catch (error) {
        // Disable link on error
        setGpcLinkState(false);

        // Handle network errors, CORS, etc.
        if (error.name === 'TypeError' && error.message.includes('fetch')) {
            updateStatus(
                STATUS.ERROR,
                'Cannot Check',
                'Unable to fetch GPC resource (network error or CORS)'
            );
        } else {
            updateStatus(
                STATUS.ERROR,
                'Error',
                error.message || 'An unexpected error occurred'
            );
        }
    }
}

/**
 * Initialize the popup
 */
async function init() {
    try {
        // Get the current active tab
        const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });

        if (!tab || !tab.url) {
            domainEl.textContent = 'No active tab';
            updateStatus(STATUS.ERROR, 'Error', 'Cannot access current tab');
            return;
        }

        const domain = extractDomain(tab.url);
        domainEl.textContent = domain;

        // Set GPC JSON link
        const urlObj = new URL(tab.url);
        const gpcUrl = `${urlObj.protocol}//${urlObj.hostname}/.well-known/gpc.json`;
        gpcJsonLink.href = gpcUrl;

        // Check if it's a valid HTTP(S) URL
        if (!tab.url.startsWith('http://') && !tab.url.startsWith('https://')) {
            updateStatus(
                STATUS.ERROR,
                'Cannot Check',
                'GPC only works on HTTP/HTTPS pages'
            );
            setGpcLinkState(false);
            return;
        }

        // Start scanning
        updateStatus(STATUS.SCANNING, 'Scanning...', 'Checking GPC support');

        // Check GPC support
        await checkGPCSupport(domain, tab.url);

    } catch (error) {
        domainEl.textContent = 'Error';
        updateStatus(STATUS.ERROR, 'Error', error.message || 'Failed to initialize');
    }
}

// Initialize when DOM is ready
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
} else {
    init();
}
