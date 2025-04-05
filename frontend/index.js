
    let selectedRole = "user"; // Default role
    
    function setRole(role) {
        selectedRole = role;
        document.getElementById("roleSelection").style.display = "none";
        toggleForm("signupForm");
    }
    
    function toggleForm(formId) {
        document.getElementById("loginForm").style.display = "none";
        document.getElementById("signupForm").style.display = "none";
        document.getElementById("recoverForm").style.display = "none";
        document.getElementById(formId).style.display = "block";
    }
    
    function showRecover() {
        toggleForm("recoverForm");
    }
    
    function clearInputs() {
        document.getElementById("signupEmail").value = "";
        document.getElementById("signupName").value = "";
        document.getElementById("signupPassword").value = "";
        document.getElementById("loginEmail").value = "";
        document.getElementById("loginPassword").value = "";
        document.getElementById("recoverEmail").value = "";
    }
    
    async function login(event) {
        event.preventDefault();
        const email = document.getElementById("loginEmail").value;
        const password = document.getElementById("loginPassword").value;
        
        try {
            const response = await fetch('http://localhost:5000/api/login', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    email,
                    password,
                    role: selectedRole
                }),
            });
            
            const data = await response.json();
            
            if (response.ok) {
                // Store token and user data in localStorage
                localStorage.setItem('agroToken', data.token);
                localStorage.setItem('agroUser', JSON.stringify({
                    id: data._id,
                    name: data.name,
                    email: data.email,
                    role: data.role
                }));
                
                // Store login timestamp
                localStorage.setItem('agroLoginTime', new Date().getTime());
                
                // Redirect based on role
                if (data.role === 'admin') {
                    window.location.href = '../../adminpanel/admin.html';
                } else {
                    // Redirect to current page or home page
                    const currentPage = window.location.pathname.split('/').pop();
                    if (currentPage === 'index.html') {
                        window.location.href = 'home%20page/home.html';
                    } else {
                        window.location.reload(); // Refresh current page
                    }
                }
            } else {
                alert(data.error || 'Login failed');
            }
        } catch (error) {
            console.error('Error:', error);
            alert('Login failed. Please try again.');
        }
    }
    async function signup(event) {
        event.preventDefault();
        const email = document.getElementById("signupEmail").value;
        const name = document.getElementById("signupName").value;
        const password = document.getElementById("signupPassword").value;
        
        // Simple password validation
        if (password.length < 6 || !/[!@#$%^&*]/.test(password)) {
            alert('Password must be at least 6 characters and include a special character');
            return;
        }
        
        try {
            const response = await fetch('http://localhost:5000/api/signup', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    email,
                    name,
                    password,
                    role: selectedRole
                }),
            });
            
            const data = await response.json();
            
            if (response.ok) {
                alert('Account created successfully! Please login.');
                toggleForm('loginForm');
                clearInputs();
            } else {
                alert(data.error || 'Signup failed');
            }
        } catch (error) {
            console.error('Error:', error);
            alert('Signup failed. Please try again.');
        }
    }
    
    