// js/login.js
document.getElementById('login-form').addEventListener('submit', async (e) => {
    e.preventDefault();

    // Get values from the form, using 'username' instead of 'email'
    const username = document.getElementById('username').value;
    const password = document.getElementById('password').value;
    const errorMessage = document.getElementById('error-message');

    // Clear previous error messages
    errorMessage.textContent = '';

    try {
        const response = await fetch('http://localhost:3001/api/auth/login', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ username, password })
        });

        const result = await response.json();

        if (response.ok) {
            // Store user info in session storage to use across pages
            sessionStorage.setItem('loggedInUser', JSON.stringify(result.user));
            // Redirect to the main page on successful login
            window.location.href = '../uibaru/monitor.html';
        } else {
            // Display the error message from the server
            errorMessage.textContent = result.error;
            sessionStorage.removeItem('loggedInUser');
        }
    } catch (error) {
        errorMessage.textContent = 'Could not connect to the API server.';
        console.error('Fetch error:', error);
    }
});