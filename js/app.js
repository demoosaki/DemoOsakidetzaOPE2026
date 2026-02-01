// script to manage showing results and navigation colors

let showingResults = false;
const navElements = document.querySelectorAll('.nav-item');

function resetNavColors() {
    navElements.forEach(item => {
        item.style.color = ''; // Reset to default color
    });
}

function startNewSession() {
    showingResults = false;
    resetNavColors();
    // Other initialization code
}

function showResults() {
    showingResults = true;
    // Code to show results
}

// Example usage
startNewSession();