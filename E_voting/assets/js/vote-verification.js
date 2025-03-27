// Vote Verification - QR Code Scanner for Vote Authorization

// Handle file upload
document.getElementById('qr-upload').addEventListener('change', function(e) {
    const fileReader = new FileReader();
    fileReader.onload = function() {
        const img = new Image();
        img.onload = function() {
            const canvas = document.createElement('canvas');
            const context = canvas.getContext('2d');
            canvas.width = img.width;
            canvas.height = img.height;
            context.drawImage(img, 0, 0, img.width, img.height);
            const imageData = context.getImageData(0, 0, canvas.width, canvas.height);
            
            // Display the QR code preview
            const previewContainer = document.getElementById('qr-preview-container');
            previewContainer.innerHTML = '';
            previewContainer.appendChild(img);
            previewContainer.style.display = 'block';
            
            // Process the QR code
            processQRCode(imageData);
        };
        img.src = fileReader.result;
    };
    fileReader.readAsDataURL(e.target.files[0]);
});

// Initialize camera scanning button event
document.getElementById('scan-btn').addEventListener('click', function() {
    initializeScanner();
});

// Process QR code data
function processQRCode(imageData) {
    try {
        // Check if jsQR is loaded
        if (typeof jsQR !== 'function') {
            showError("QR scanning library not loaded. Please try uploading the QR code instead.");
            return;
        }

        const code = jsQR(imageData.data, imageData.width, imageData.height);
        
        if (code) {
            verifyQRCode(code.data);
        } else {
            showError("No QR code found in the image. Please try again with a clearer image.");
        }
    } catch (error) {
        console.error("Error processing QR code:", error);
        showError("Failed to process QR code. Please try again.");
    }
}

// Initialize QR code scanner
function initializeScanner() {
    const videoElement = document.getElementById('qr-scanner-video');
    const scannerContainer = document.getElementById('scanner-container');
    
    // Check if already initialized
    if (scannerContainer.style.display === 'block') {
        scannerContainer.style.display = 'none';
        stopVideoStream();
        return;
    }
    
    // Show scanner container
    scannerContainer.style.display = 'block';
    
    // Access user's camera
    navigator.mediaDevices.getUserMedia({ video: { facingMode: "environment" } })
        .then(function(stream) {
            videoElement.srcObject = stream;
            videoElement.play();
            
            // Start scanning
            const canvas = document.createElement('canvas');
            const canvasContext = canvas.getContext('2d');
            
            function scanQRCode() {
                if (videoElement.readyState === videoElement.HAVE_ENOUGH_DATA) {
                    canvas.height = videoElement.videoHeight;
                    canvas.width = videoElement.videoWidth;
                    
                    canvasContext.drawImage(videoElement, 0, 0, canvas.width, canvas.height);
                    const imageData = canvasContext.getImageData(0, 0, canvas.width, canvas.height);
                    
                    try {
                        // Check if jsQR is loaded
                        if (typeof jsQR === 'function') {
                            const code = jsQR(imageData.data, imageData.width, imageData.height);
                            
                            if (code) {
                                // Stop scanning and hide video
                                stopVideoStream();
                                scannerContainer.style.display = 'none';
                                
                                // Verify the QR code
                                verifyQRCode(code.data);
                                return; // Exit the scanning loop
                            }
                        } else {
                            showError("QR scanning library not loaded. Please try uploading the QR code instead.");
                            stopVideoStream();
                            return;
                        }
                    } catch (error) {
                        console.error("Error scanning QR code:", error);
                    }
                }
                
                // Continue scanning
                requestAnimationFrame(scanQRCode);
            }
            
            scanQRCode();
        })
        .catch(function(error) {
            console.error("Error accessing camera:", error);
            showError("Could not access camera. Please check your camera permissions or try uploading the QR code.");
        });
}

// Stop video stream
function stopVideoStream() {
    const videoElement = document.getElementById('qr-scanner-video');
    if (videoElement.srcObject) {
        const tracks = videoElement.srcObject.getTracks();
        tracks.forEach(track => track.stop());
        videoElement.srcObject = null;
    }
}

// Verify QR code
function verifyQRCode(qrData) {
    try {
        console.log('QR Data received:', qrData);
        
        // Parse QR data (expected format: JSON with token)
        const qrInfo = JSON.parse(qrData);
        console.log('Parsed QR data:', qrInfo);
        
        if (!qrInfo || !qrInfo.token) {
            showError("Invalid QR code format. Please use a valid voter verification QR code.");
            return;
        }
        
        // Get the user's verification token from localStorage
        const currentUser = JSON.parse(sessionStorage.getItem('currentUser'));
        
        if (!currentUser || !currentUser.id) {
            showError("You must be logged in to verify your vote. Please login first.");
            setTimeout(() => {
                window.location.href = 'login.html';
            }, 3000);
            return;
        }
        
        // Get user data from localStorage
        const users = JSON.parse(localStorage.getItem('users') || '[]');
        const userIndex = users.findIndex(u => u.id === currentUser.id);
        
        if (userIndex === -1) {
            showError("User not found. Please login again.");
            return;
        }
        
        // Get the user object
        const user = users[userIndex];
        
        // For demo purposes, we'll accept any valid QR code
        // Set verification flag and time
        sessionStorage.setItem('voteVerified', 'true');
        sessionStorage.setItem('verificationTime', Date.now().toString());
        
        // Update user's verification status in localStorage
        user.verified = true;
        user.qrVerified = true;
        users[userIndex] = user;
        localStorage.setItem('users', JSON.stringify(users));
        
        // Show success message
        showSuccess("Identity verification successful! You will be redirected to the voting page.");
        
        // Get the election ID from either pendingElectionId or selectedElectionId
        const pendingElectionId = sessionStorage.getItem('pendingElectionId');
        const selectedElectionId = sessionStorage.getItem('selectedElectionId');
        const electionId = pendingElectionId || selectedElectionId;
        
        console.log('Found election IDs:', {
            pendingElectionId,
            selectedElectionId,
            finalElectionId: electionId
        });
        
        // Set timeout to redirect
        setTimeout(() => {
            if (electionId) {
                console.log('Redirecting to election:', electionId);
                // Move pendingElectionId to sessionStorage to make it work with vote.js
                if (selectedElectionId && !pendingElectionId) {
                    sessionStorage.setItem('pendingElectionId', selectedElectionId);
                }
                // Redirect to the voting page with the election ID
                window.location.href = `vote.html?id=${electionId}`;
            } else {
                console.log('No election ID found, redirecting to dashboard');
                // Redirect to dashboard if no specific election
                window.location.href = 'dashboard.html';
            }
        }, 2000);
    } catch (error) {
        console.error("Error verifying QR code:", error);
        showError("Failed to verify QR code. Please try again.");
    }
}

// Show success message
function showSuccess(message) {
    const resultElement = document.getElementById('verification-result');
    resultElement.className = 'verification-result success-message';
    resultElement.innerHTML = `<i class="fas fa-check-circle"></i> ${message}`;
    resultElement.style.display = 'block';
}

// Show error message
function showError(message) {
    const resultElement = document.getElementById('verification-result');
    resultElement.className = 'verification-result error-message';
    resultElement.innerHTML = `<i class="fas fa-exclamation-circle"></i> ${message}`;
    resultElement.style.display = 'block';
} 