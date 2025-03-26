// Login Page JavaScript

document.addEventListener('DOMContentLoaded', () => {
    // DOM Elements
    const loginForm = document.getElementById('loginForm');
    const userIdInput = document.getElementById('userId');
    const passwordInput = document.getElementById('password');
    const passwordToggle = document.getElementById('passwordToggle');
    const userIdError = document.getElementById('userIdError');
    const passwordError = document.getElementById('passwordError');
    const loginMessage = document.getElementById('loginMessage');
    const rememberMeCheckbox = document.getElementById('rememberMe');
    
    // Remove QR verification option reference
    // const qrVerifyOption = document.getElementById('qrVerifyOption');

    // Remove the code that creates QR verification option
    /*
    if (!qrVerifyOption && loginForm) {
        const optionsDiv = document.querySelector('.form-options');
        if (optionsDiv) {
            const qrVerifyLink = document.createElement('a');
            qrVerifyLink.href = 'qr-scanner.html';
            qrVerifyLink.className = 'qr-verify-link';
            qrVerifyLink.innerHTML = '<i class="fas fa-qrcode"></i> Verify with QR code';
            
            const qrVerifyDiv = document.createElement('div');
            qrVerifyDiv.className = 'qr-verify-option';
            qrVerifyDiv.id = 'qrVerifyOption';
            qrVerifyDiv.appendChild(qrVerifyLink);
            
            optionsDiv.appendChild(qrVerifyDiv);
            
            // Add separator line
            const separator = document.createElement('div');
            separator.className = 'form-separator';
            separator.innerHTML = '<span>or</span>';
            
            loginForm.insertBefore(separator, document.querySelector('.form-group:last-of-type'));
        }
    }
    */

    // Toggle password visibility
    passwordToggle.addEventListener('click', () => {
        const type = passwordInput.getAttribute('type') === 'password' ? 'text' : 'password';
        passwordInput.setAttribute('type', type);
        
        // Toggle eye icon
        const eyeIcon = passwordToggle.querySelector('i');
        eyeIcon.classList.toggle('fa-eye');
        eyeIcon.classList.toggle('fa-eye-slash');
    });

    // Check for saved credentials
    checkSavedCredentials();

    // Form submission
    loginForm.addEventListener('submit', (e) => {
        e.preventDefault();
        
        // Reset error messages
        userIdError.textContent = '';
        passwordError.textContent = '';
        loginMessage.textContent = '';
        loginMessage.className = 'login-message';
        
        // Get form values
        const userId = userIdInput.value.trim().toUpperCase(); // Convert to uppercase for consistency
        const password = passwordInput.value.trim();
        
        // Validate inputs
        let isValid = true;
        
        if (!userId) {
            userIdError.textContent = 'USN/Staff ID is required';
            isValid = false;
        }
        
        if (!password) {
            passwordError.textContent = 'Password is required';
            isValid = false;
        } else if (password.length < 6) {
            passwordError.textContent = 'Password must be at least 6 characters';
            isValid = false;
        }
        
        if (isValid) {
            // Attempt login
            attemptLogin(userId, password);
        }
    });

    // Function to attempt login
    function attemptLogin(userId, password) {
        // Show loading state
        const submitBtn = loginForm.querySelector('button[type="submit"]');
        const originalBtnText = submitBtn.textContent;
        submitBtn.textContent = 'Logging in...';
        submitBtn.disabled = true;
        
        // Simulate API call with setTimeout
        setTimeout(() => {
            // Check credentials against "database"
            const user = checkUserCredentials(userId, password);
            
            if (user) {
                // Save credentials if remember me is checked
                if (rememberMeCheckbox.checked) {
                    saveCredentials(userId, password);
                } else {
                    clearSavedCredentials();
                }
                
                // Show success message
                loginMessage.textContent = 'Login successful! Redirecting...';
                loginMessage.classList.add('success');
                loginMessage.style.display = 'block';
                
                // Skip QR verification, always redirect to dashboard directly
                setTimeout(() => {
                    window.location.href = 'dashboard.html';
                }, 1500);
            } else {
                // Show error message
                loginMessage.textContent = 'Invalid USN/Staff ID or Password';
                loginMessage.classList.add('error');
                loginMessage.style.display = 'block';
                
                // Reset button
                submitBtn.textContent = originalBtnText;
                submitBtn.disabled = false;
            }
        }, 1000); // Simulate network delay
    }

    // Function to check user credentials against "database"
    function checkUserCredentials(userId, password) {
        // Get users from localStorage
        let users = JSON.parse(localStorage.getItem('users')) || [];
        
        console.log("Checking credentials for:", userId);
        
        // If no users exist, create some default ones
        if (users.length === 0) {
            users = [
                {
                    id: 'ADMIN123',
                    fullName: 'Admin User',
                    password: 'admin123',
                    type: 'admin',
                    registrationDate: new Date().toISOString(),
                    verified: true,
                    qrVerified: true
                },
                {
                    id: '1MS22CS001',
                    fullName: 'Test Student',
                    password: 'student123',
                    type: 'voter',
                    voterType: 'student',
                    registrationDate: new Date().toISOString(),
                    verified: true,
                    qrVerified: true
                },
                {
                    id: 'STAFF001',
                    fullName: 'Test Staff',
                    password: 'staff123',
                    type: 'voter',
                    voterType: 'staff',
                    registrationDate: new Date().toISOString(),
                    verified: true,
                    qrVerified: true
                }
            ];
            
            // Save to localStorage
            localStorage.setItem('users', JSON.stringify(users));
        }
        
        // Check if user exists and password matches
        const user = users.find(u => u.id === userId && u.password === password);
        
        if (user) {
            console.log("Found matching user:", user);
            
            // Create a user object with all necessary IDs for proper matching
            const sessionUser = {
                id: user.id, // Main ID
                fullName: user.fullName,
                type: user.type,
                voterType: user.voterType || null,
                // For students, use the ID as studentId
                studentId: user.voterType === 'student' ? user.id : null,
                // For staff, use the ID as employeeId
                employeeId: user.voterType === 'staff' ? user.id : null,
                // Store the ID as identificationNumber for both types
                identificationNumber: user.id,
                // QR verification status is no longer needed
                qrVerified: true // Always set to true since we're bypassing QR verification
            };
            
            console.log("Storing user in session storage:", sessionUser);
            
            // Store current user info in session storage (will be cleared when browser is closed)
            sessionStorage.setItem('currentUser', JSON.stringify(sessionUser));
            sessionStorage.setItem('currentUserId', user.id);
            
            return user;
        }
        
        console.log("No matching user found");
        return null;
    }

    // Function to save credentials to localStorage
    function saveCredentials(userId, password) {
        localStorage.setItem('savedCredentials', JSON.stringify({
            userId,
            password
        }));
    }

    // Function to clear saved credentials
    function clearSavedCredentials() {
        localStorage.removeItem('savedCredentials');
    }

    // Function to check for saved credentials
    function checkSavedCredentials() {
        const savedCredentials = JSON.parse(localStorage.getItem('savedCredentials'));
        
        if (savedCredentials) {
            userIdInput.value = savedCredentials.userId;
            passwordInput.value = savedCredentials.password;
            rememberMeCheckbox.checked = true;
        }
    }
}); 