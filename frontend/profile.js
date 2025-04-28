document.addEventListener('DOMContentLoaded', function() {
    // Verify authentication first
    verifyAuthentication();

    // Display user info from localStorage
    const user = JSON.parse(localStorage.getItem('agroUser'));
    document.getElementById('display-name').textContent = user.name;
    document.getElementById('display-email').textContent = user.email;

    // Authentication functions
    async function verifyAuthentication() {
        const token = localStorage.getItem('agroToken');
        if (!token) {
            redirectToLogin();
            return;
        }

        try {
            const response = await fetch('/api/validate-session', {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });

            if (!response.ok) {
                redirectToLogin();
            }
        } catch (error) {
            console.error('Session validation error:', error);
            redirectToLogin();
        }
    }

    function redirectToLogin() {
        localStorage.removeItem('agroToken');
        localStorage.removeItem('agroUser');
        window.location.href = 'index.html';
    }
});
