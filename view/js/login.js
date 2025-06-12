// js/login.js
document.getElementById('login-form').addEventListener('submit', async (e) => {
    e.preventDefault();
    const email = document.getElementById('email').value;
    const password = document.getElementById('password').value;
    const errorMessage = document.getElementById('error-message');

    try {
        const response = await fetch('http://localhost:3001/api/auth/login', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email, password })
        });

        const result = await response.json();

        if (response.ok) {
            errorMessage.textContent = '';
            // Store user info in session storage to use across pages
            sessionStorage.setItem('loggedInUser', JSON.stringify(result.user));

            // Redirect based on the user's role
            if (result.user.role === 'admin') {
                window.location.href = '../../index.html';
            } else {
                window.location.href = "../../index.html";
            }
        } else {
            errorMessage.textContent = result.error;
            sessionStorage.removeItem('loggedInUser');
        }
    } catch (error) {
        errorMessage.textContent = 'Could not connect to the API server.';
        console.error('Fetch error:', error);
    }
});