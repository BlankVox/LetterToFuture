// Google Analytics
window.dataLayer = window.dataLayer || [];
function gtag() {
    dataLayer.push(arguments);
}
gtag('js', new Date());
gtag('config', 'G-XXXXXXXXXX');

// Set minimum date for delivery date input
function setDateMin() {
    const dateInput = document.getElementById('delivery_date');
    if (dateInput) {
        const today = new Date();
        today.setDate(today.getDate() + 1);
        dateInput.min = today.toISOString().split('T')[0];
    }
}
setDateMin();

// Alpine.js FAQ note (optional, for clarity)
document.addEventListener('alpine:init', () => {
    // FAQ accordion logic is handled by Alpine.js in the HTML
});

// Handle form submission
document.addEventListener('DOMContentLoaded', () => {
    const form = document.querySelector('form');
    if (form) {
        form.addEventListener('submit', async (e) => {
            e.preventDefault();
            const email = form.elements.email.value;
            const deliveryDate = form.elements.delivery_date.value;
            const letter = form.elements.letter.value;
            try {
                await fetch('/api/schedule', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ email, deliveryDate, letter })
                });
                // The rest of your Alpine.js logic will handle UI state
            } catch (err) {
                alert('Failed to schedule letter. Please try again.');
            }
        });
    }
}); 