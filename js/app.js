// Your updated file content goes here.
// Make sure to include the showingResults flag logic and nav color conditions based on it.

let showingResults = false;

function finish() {
    // Logic that handles the end of a question or a quiz.
    showingResults = true;
    updateNavColor();
}

function restart() {
    showingResults = false;
    updateNavColor();
}

function updateNavColor() {
    if (showingResults) {
        // Change nav color to indicate results are being shown
    } else {
        // Reset nav colors
    }
}

// Additional code...
