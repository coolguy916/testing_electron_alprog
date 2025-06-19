    // js/register.js
    document.getElementById('register-form').addEventListener('submit', async (e) => {
        e.preventDefault();
        const username = document.getElementById('username').value;
        const password = document.getElementById('password').value;
        const errorMessage = document.getElementById('error-message');

        try {
            const response = await fetch('http://localhost:3001/api/auth/register', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ username, password })
            });

            const result = await response.json();
            
            if (response.ok) {
                errorMessage.textContent = '';
                // Store user info in session storage to use across pages
                sessionStorage.setItem('loggedInUser', JSON.stringify(result.user));
                
            } else {
                errorMessage.textContent = result.error;
                sessionStorage.removeItem('loggedInUser');
            }
        } catch (error) {
            errorMessage.textContent = 'Could not connect to the API server.';
            console.error('Fetch error:', error);
        }
    });