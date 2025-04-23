// auth.js - Shared authentication functions

function initAuth() {
    // Initialize Bootstrap dropdowns
    initBootstrapDropdowns();
    
    // Check and update auth status
    checkAuthStatus();
    
    // Setup logout functionality
    setupLogout();
    
    // Check session validity
    checkSession();
}

function initBootstrapDropdowns() {
    try {
        if (typeof bootstrap !== 'undefined' && bootstrap.Dropdown) {
            const dropdownElements = [].slice.call(document.querySelectorAll('.dropdown-toggle'));
            dropdownElements.forEach(function(dropdownToggleEl) {
                if (!dropdownToggleEl._dropdown) {
                    new bootstrap.Dropdown(dropdownToggleEl);
                }
            });
        }
    } catch (error) {
        console.error('Dropdown initialization error:', error);
    }
}

function checkAuthStatus() {
    try {
        const token = localStorage.getItem('agroToken');
        const userData = JSON.parse(localStorage.getItem('agroUser') || '{}');
        const userDropdown = document.getElementById("userDropdown");
        const loginButton = document.getElementById("loginButton");
        const userNameDisplay = document.getElementById("userNameDisplay");

        if (userDropdown) userDropdown.style.display = 'none';
        if (loginButton) loginButton.style.display = 'none';

        if (token && userData.name) {
            if (userNameDisplay) {
                userNameDisplay.textContent = userData.name;
            }
            if (userDropdown) {
                userDropdown.style.display = 'block';
                initBootstrapDropdowns();
            }
        } else {
            if (loginButton) {
                loginButton.style.display = 'block';
            }
        }
    } catch (error) {
        console.error('Authentication check error:', error);
    }
}

function setupLogout() {
    const logoutButton = document.getElementById('logoutButton');
    if (logoutButton) {
        logoutButton.addEventListener('click', function(e) {
            e.preventDefault();
            logoutUser();
        });
    }
}

function logoutUser() {
    // Optional: Send logout request to server
    fetch('http://localhost:5000/api/logout', {
        method: 'POST',
        headers: {
            'Authorization': `Bearer ${localStorage.getItem('agroToken')}`
        }
    }).catch(error => console.error('Logout error:', error));

    // Clear client-side storage
    localStorage.removeItem('agroToken');
    localStorage.removeItem('agroUser');
    localStorage.removeItem('agroLoginTime');
    
    // Redirect to login page
    window.location.href = "index.html";
}

function checkSession() {
    const loginTime = localStorage.getItem('agroLoginTime');
    const SESSION_TIMEOUT = 30 * 60 * 1000; // 30 minutes
    
    if (loginTime && (new Date().getTime() - parseInt(loginTime) > SESSION_TIMEOUT)) {
        logoutUser();
    }
}

// Add this to your server.js for session validation
app.post('/api/validate-session', async (req, res) => {
    try {
        const token = req.headers.authorization?.split(' ')[1];
        if (!token) return res.status(401).json({ valid: false });

        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        const Model = decoded.role === 'admin' ? Admin : User;
        const user = await Model.findById(decoded.id).select('-password');
        
        if (!user) return res.status(401).json({ valid: false });
        
        res.json({ valid: true, user });
    } catch (error) {
        res.status(401).json({ valid: false });
    }
});
function updateAuthUI() {
    const user = getCurrentUser(); // Your function to get current user
    
    if (user) {
      document.getElementById('loginButton').style.display = 'none';
      document.getElementById('userNameDisplay').textContent = user.name;
      document.querySelector('.user-section').style.display = 'block';
    } else {
      document.getElementById('loginButton').style.display = 'block';
      document.querySelector('.user-section').style.display = 'none';
    }
  }
  
  // Call this when page loads and after login/logout
  document.addEventListener("DOMContentLoaded", function() {
    updateAuthUI();
  });
  