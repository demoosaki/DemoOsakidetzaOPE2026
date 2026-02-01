// Add order toggle per-test and persistence in localStorage

function shuffleArray(array) {
    for (let i = array.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [array[i], array[j]] = [array[j], array[i]];
    }
    return array;
}

function getOrderMode() {
    return localStorage.getItem('orderMode') || 'fixed';
}

function setOrderMode(mode) {
    localStorage.setItem('orderMode', mode);
}

function processOrder(tests) {
    if (getOrderMode() === 'random') {
        return shuffleArray(tests);
    }
    return tests;
}

function renderOrderToggle() {
    const orderToggle = document.createElement('select');
    orderToggle.innerHTML = '<option value="fixed">Fixed</option><option value="random">Random</option>';
    orderToggle.value = getOrderMode();
    orderToggle.onchange = function() {
        setOrderMode(orderToggle.value);
        applyOrderChange();
    };
    document.body.appendChild(orderToggle);
}

function originalTestHandling(tests) {
    // existing logic for handling original tests
}

function applyOrderChange() {
    const tests = [...document.querySelectorAll('.test')];
    const orderedTests = processOrder(tests);
    // Logic to render orderedTests
}

// existing Ads and other logic...

// Call to render order toggle at initialization
renderOrderToggle();