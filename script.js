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

function isFutureDate(dateStr) {
    const today = new Date();
    today.setHours(0,0,0,0);
    const inputDate = new Date(dateStr);
    return inputDate > today;
}

// Handle form submission
document.addEventListener('DOMContentLoaded', () => {
    const form = document.querySelector('form');
    if (form) {
        form.addEventListener('submit', async (e) => {
            e.preventDefault();
            const email = form.elements.email.value;
            const deliveryDate = form.elements.delivery_date.value;
            const letter = form.elements.letter.value;
            let valid = true;
            // Email validation
            if (!email || !/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email)) {
                document.getElementById('email').setAttribute('aria-invalid', 'true');
                document.getElementById('emailError').textContent = 'Please enter a valid email address.';
                valid = false;
            } else {
                document.getElementById('email').removeAttribute('aria-invalid');
                document.getElementById('emailError').textContent = '';
            }
            // Delivery date validation
            if (!deliveryDate || !isFutureDate(deliveryDate)) {
                document.getElementById('delivery_date').setAttribute('aria-invalid', 'true');
                document.getElementById('dateError').textContent = 'Please select a future date.';
                valid = false;
            } else {
                document.getElementById('delivery_date').removeAttribute('aria-invalid');
                document.getElementById('dateError').textContent = '';
            }
            // Letter validation
            if (!letter) {
                document.getElementById('letter').setAttribute('aria-invalid', 'true');
                document.getElementById('letterError').textContent = 'Letter content is required.';
                valid = false;
            } else {
                document.getElementById('letter').removeAttribute('aria-invalid');
                document.getElementById('letterError').textContent = '';
            }
            if (!valid) return;
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