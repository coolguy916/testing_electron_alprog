// js/register.js
document.getElementById('register-form').addEventListener('submit', async (e) => {
    e.preventDefault();

    // Get values from all form fields
    const username = document.getElementById('username').value;
    const password = document.getElementById('password').value;
    const confirmPassword = document.getElementById('confirm-password').value;
    const errorMessage = document.getElementById('error-message');

    errorMessage.textContent = ''; 

    if (password !== confirmPassword) {
        errorMessage.textContent = 'Passwords do not match.';
        return; 
    }
    
    // if (password.length < 8) {
    //     errorMessage.textContent = 'Password must be at least 8 characters long.';
    //     return;
    // }

    try {
        const response = await fetch('http://localhost:3001/api/auth/register', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ username, password }) 
        });

        const result = await response.json();
        
        if (response.ok) {
            // Success: clear any error messages
            errorMessage.textContent = '';
            
            // Store user info in session storage to use across pages
            sessionStorage.setItem('loggedInUser', JSON.stringify(result.user));
            
            // Redirect to another page or show a success message
            alert('Account created successfully!');
            // view\uibaru\monitor.html
            window.location.href = '../uibaru/monitor.html'; 
            
        } else {
            // Show error from server
            errorMessage.textContent = result.error || 'An unknown error occurred.';
            sessionStorage.removeItem('loggedInUser');
        }
    } catch (error) {
        errorMessage.textContent = 'Could not connect to the API server.';
        console.error('Fetch error:', error);
    }
});