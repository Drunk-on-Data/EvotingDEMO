document.addEventListener('DOMContentLoaded', () => {
    const registerForm = document.getElementById('registerForm');
    const registerMessage = document.getElementById('registerMessage');
    const voterTypeSelect = document.getElementById('voterType');
    const idFieldLabel = document.getElementById('idFieldLabel');
    const idFieldInput = document.getElementById('identificationField');
    const idFieldHelper = document.getElementById('idFieldHelper');
    
    // Initialize users in localStorage if it doesn't exist
    if (!localStorage.getItem('users')) {
        // Create default admin account
        const defaultUsers = [
            {
                id: 'admin123',
                fullName: 'Admin User',
                password: 'admin123', // In a real app, this would be hashed
                type: 'admin',
                registrationDate: new Date().toISOString(),
                verified: true
            },
            {
                id: '1MS22CS001', // Example USN
                fullName: 'Test Student',
                password: 'student123', // In a real app, this would be hashed
                type: 'voter',
                voterType: 'student',
                registrationDate: new Date().toISOString(),
                verified: true
            },
            {
                id: 'STAFF001', // Example Staff ID
                fullName: 'Test Staff',
                password: 'staff123', // In a real app, this would be hashed
                type: 'voter',
                voterType: 'staff',
                registrationDate: new Date().toISOString(),
                verified: true
            }
        ];
        localStorage.setItem('users', JSON.stringify(defaultUsers));
    }
    
    // Initialize OTP storage if it doesn't exist
    if (!localStorage.getItem('otpStorage')) {
        localStorage.setItem('otpStorage', JSON.stringify({}));
    }
    
    // Generate CAPTCHA on page load
    generateCaptcha();
    
    // Refresh CAPTCHA when clicked
    document.getElementById('captchaRefresh').addEventListener('click', generateCaptcha);
    
    // Handle voter type change to update ID field
    voterTypeSelect.addEventListener('change', () => {
        const selectedType = voterTypeSelect.value;
        
        if (selectedType === 'student') {
            idFieldLabel.innerHTML = '<i class="fas fa-id-badge"></i> USN Number';
            idFieldInput.placeholder = 'Enter your USN number';
            idFieldHelper.textContent = 'University Serial Number (USN) provided by your institution';
            idFieldInput.pattern = '[0-9A-Za-z]+'; // Allow alphanumeric USN
        } else if (selectedType === 'staff') {
            idFieldLabel.innerHTML = '<i class="fas fa-id-badge"></i> Staff ID';
            idFieldInput.placeholder = 'Enter your staff ID';
            idFieldHelper.textContent = 'Your staff identification number';
            idFieldInput.pattern = '[0-9A-Za-z]+'; // Allow alphanumeric Staff ID
        }
    });
    
    // Handle form submission
    registerForm.addEventListener('submit', (e) => {
        e.preventDefault();
        
        // Get form values
        const fullName = document.getElementById('fullName').value.trim();
        const password = document.getElementById('password').value;
        const confirmPassword = document.getElementById('confirmPassword').value;
        const voterType = document.getElementById('voterType').value;
        const identificationNumber = document.getElementById('identificationField').value.trim().toUpperCase(); // Convert to uppercase for consistency
        const agreeTerms = document.getElementById('termsAgreement').checked;
        const captchaInput = document.getElementById('captchaInput').value.trim();
        const captchaText = document.getElementById('captchaText').getAttribute('data-captcha');
        
        // Validate form
        if (!fullName || !password || !confirmPassword || !voterType || !identificationNumber) {
            showMessage('Please fill in all fields', 'error');
            return;
        }
        
        if (password !== confirmPassword) {
            showMessage('Passwords do not match', 'error');
            return;
        }
        
        if (!agreeTerms) {
            showMessage('You must agree to the Terms of Service and Privacy Policy', 'error');
            return;
        }
        
        // Validate ID format based on user type
        if (voterType === 'student') {
            // USN format validation - example: 1MS22CS001
            const usnRegex = /^[0-9][A-Za-z]{2}[0-9]{2}[A-Za-z]{2}[0-9]{3}$/;
            if (!usnRegex.test(identificationNumber)) {
                showMessage('Please enter a valid USN in format 1MS22CS001', 'error');
                return;
            }
        } else if (voterType === 'staff') {
            // Staff ID validation - simple alphanumeric check
            const staffIdRegex = /^[A-Za-z0-9]{3,10}$/;
            if (!staffIdRegex.test(identificationNumber)) {
                showMessage('Staff ID must be 3-10 alphanumeric characters', 'error');
                return;
            }
        }
        
        // Password strength validation
        if (password.length < 6) {
            showMessage('Password must be at least 6 characters long', 'error');
            return;
        }
        
        // Validate CAPTCHA
        if (!captchaInput) {
            showMessage('Please enter the CAPTCHA code', 'error');
            return;
        }
        
        if (captchaInput !== captchaText) {
            showMessage('CAPTCHA verification failed. Please try again.', 'error');
            generateCaptcha();
            return;
        }
        
        // Check if ID already exists
        const users = JSON.parse(localStorage.getItem('users')) || [];
        if (users.some(user => user.id === identificationNumber)) {
            showMessage('This ID is already registered. Please use the login page.', 'error');
            return;
        }
        
        // Create new user object
        const newUser = {
            id: identificationNumber, // Using the ID (USN/Staff ID) as the primary key
            fullName: fullName,
            password: password, // In a real app, this would be hashed
            type: 'voter', // Default type for registration
            voterType: voterType,
            registrationDate: new Date().toISOString(),
            verified: false, // Set to false initially until QR verification
            studentId: voterType === 'student' ? identificationNumber : null,
            employeeId: voterType === 'staff' ? identificationNumber : null,
            identificationNumber: identificationNumber, // Store the ID as identification number for both types
            qrVerified: false // New field to track QR verification status
        };
        
        // Add user to localStorage
        users.push(newUser);
        localStorage.setItem('users', JSON.stringify(users));
        
        // Store the new user ID in session storage for QR verification
        sessionStorage.setItem('newUserId', identificationNumber);
        
        // Show success message
        showMessage('Registration successful! Redirecting to QR verification...', 'success');
        
        // Redirect to QR verification page after a delay
        setTimeout(() => {
            window.location.href = 'qr-verification.html';
        }, 2000);
    });
    
    // Function to generate CAPTCHA
    function generateCaptcha() {
        const captchaText = document.getElementById('captchaText');
        const captchaInput = document.getElementById('captchaInput');
        
        // Generate random string for CAPTCHA
        const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghjkmnpqrstuvwxyz23456789';
        let captcha = '';
        for (let i = 0; i < 6; i++) {
            captcha += chars.charAt(Math.floor(Math.random() * chars.length));
        }
        
        // Store CAPTCHA text as data attribute
        captchaText.setAttribute('data-captcha', captcha);
        
        // Display CAPTCHA text
        captchaText.textContent = captcha;
        
        // Clear input field
        if (captchaInput) {
            captchaInput.value = '';
        }
    }
    
    // Function to show messages
    function showMessage(message, type) {
        registerMessage.textContent = message;
        registerMessage.className = 'register-message ' + type;
        registerMessage.style.display = 'block';
        
        // Hide message after 5 seconds
        setTimeout(() => {
            registerMessage.style.display = 'none';
        }, 5000);
    }
    
    // Toggle password visibility
    const togglePassword = document.getElementById('passwordToggle');
    const toggleConfirmPassword = document.getElementById('confirmPasswordToggle');
    
    if (togglePassword) {
        togglePassword.addEventListener('click', () => {
            const passwordInput = document.getElementById('password');
            togglePasswordVisibility(passwordInput, togglePassword);
        });
    }
    
    if (toggleConfirmPassword) {
        toggleConfirmPassword.addEventListener('click', () => {
            const confirmPasswordInput = document.getElementById('confirmPassword');
            togglePasswordVisibility(confirmPasswordInput, toggleConfirmPassword);
        });
    }
    
    function togglePasswordVisibility(input, icon) {
        if (input.type === 'password') {
            input.type = 'text';
            icon.querySelector('i').classList.remove('fa-eye');
            icon.querySelector('i').classList.add('fa-eye-slash');
        } else {
            input.type = 'password';
            icon.querySelector('i').classList.remove('fa-eye-slash');
            icon.querySelector('i').classList.add('fa-eye');
        }
    }
}); 