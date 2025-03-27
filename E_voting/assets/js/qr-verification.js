class QRVerification {
    constructor() {
        this.tokenExpiration = 10 * 60 * 1000; // 10 minutes in milliseconds
        console.log('QRVerification instance created');
    }

    // Generate a unique verification token
    generateVerificationToken(userId) {
        const timestamp = Date.now();
        const randomString = Math.random().toString(36).substring(2, 15);
        const token = {
            userId: userId,
            token: `${userId}-${randomString}-${timestamp}`,
            created: timestamp,
            expires: timestamp + this.tokenExpiration
        };
        console.log('Generated verification token for user:', userId);
        return token;
    }

    // Generate a QR code for a user
    generateUserQR(userId, containerId) {
        console.log('Generating QR code for user:', userId);
        
        // Check if QRCode is available first
        if (typeof QRCode === 'undefined') {
            console.error('QRCode library not loaded! Cannot generate QR code.');
            const qrContainer = document.getElementById(containerId);
            if (qrContainer) {
                qrContainer.innerHTML = '<div class="error-message">QR code library not loaded. Please refresh the page or try again later.</div>';
                
                // Show retry button
                const retryBtn = document.createElement('button');
                retryBtn.className = 'btn qr-btn';
                retryBtn.innerHTML = '<i class="fas fa-sync-alt"></i> Retry Loading Library';
                retryBtn.onclick = () => {
                    location.reload();
                };
                qrContainer.appendChild(retryBtn);
            }
            return null;
        }
        
        // Get user details
        const users = JSON.parse(localStorage.getItem('users')) || [];
        console.log('Found users in localStorage:', users.length);
        
        const user = users.find(u => u.id === userId);
        
        if (!user) {
            console.error('User not found:', userId);
            const qrContainer = document.getElementById(containerId);
            if (qrContainer) {
                qrContainer.innerHTML = '<div class="error-message">User not found. Please try registering again.</div>';
            }
            return null;
        }
        
        console.log('User found:', user);
        
        // Create token with user information
        const tokenData = this.generateVerificationToken(userId);
        
        // Add user information to token
        tokenData.userInfo = {
            fullName: user.fullName,
            type: user.voterType || user.type,
            id: user.id
        };
        
        // Save token
        this.saveToken(userId, tokenData);
        
        const qrContainer = document.getElementById(containerId);
        if (qrContainer) {
            qrContainer.innerHTML = '<div class="loading-spinner"><i class="fas fa-spinner fa-spin"></i> Generating QR code...</div>'; 
            
            try {
                console.log('Creating QR code with data:', JSON.stringify(tokenData));
                
                // Short delay to allow loading spinner to render
                setTimeout(() => {
                    try {
                        // Clear the container again to remove loading spinner
                        qrContainer.innerHTML = '';
                        
                        // Use QRCode library to generate QR code
                        const qrcode = new QRCode(qrContainer, {
                            text: JSON.stringify(tokenData),
                            width: 200,
                            height: 200,
                            colorDark: "#000000",
                            colorLight: "#ffffff",
                            correctLevel: typeof QRCode.CorrectLevel !== 'undefined' ? QRCode.CorrectLevel.H : 0
                        });
                        
                        console.log('QR code created successfully');
                        
                        // Add expiration info
                        const expiryInfo = document.createElement('p');
                        expiryInfo.className = 'expiry-info';
                        expiryInfo.textContent = `This QR code will expire in 10 minutes.`;
                        qrContainer.appendChild(expiryInfo);
                        
                        // Mark user as QR verified
                        this.markUserAsVerified(userId);
                        
                        // Update the user info display
                        this.updateUserInfoDisplay(user);
                        
                        return tokenData;
                    } catch (innerError) {
                        console.error('Error during QR code creation:', innerError);
                        qrContainer.innerHTML = '<div class="error-message">Error generating QR code: ' + innerError.message + '</div>';
                        return null;
                    }
                }, 300);
            } catch (error) {
                console.error('Error generating QR code:', error);
                qrContainer.innerHTML = '<div class="error-message">Error generating QR code: ' + error.message + '</div>';
                return null;
            }
        } else {
            console.error('QR container not found with ID:', containerId);
            return null;
        }
    }
    
    // Mark user as verified in localStorage
    markUserAsVerified(userId) {
        const users = JSON.parse(localStorage.getItem('users')) || [];
        const userIndex = users.findIndex(u => u.id === userId);
        
        if (userIndex !== -1) {
            users[userIndex].qrVerified = true;
            localStorage.setItem('users', JSON.stringify(users));
            console.log('User marked as QR verified:', userId);
        } else {
            console.error('Could not mark user as verified - user not found:', userId);
        }
    }
    
    // Update the user info display
    updateUserInfoDisplay(user) {
        const fullNameElement = document.getElementById('user-fullname');
        const userIdElement = document.getElementById('user-id');
        const userTypeElement = document.getElementById('user-type');
        
        if (fullNameElement) fullNameElement.textContent = user.fullName;
        if (userIdElement) userIdElement.textContent = user.id;
        if (userTypeElement) {
            let userType = user.voterType || user.type;
            // Capitalize first letter
            userType = userType.charAt(0).toUpperCase() + userType.slice(1);
            userTypeElement.textContent = userType;
        }
        
        console.log('User info display updated for:', user.fullName);
    }

    // Save a verification token to localStorage
    saveToken(userId, tokenData) {
        // Get existing tokens for this user
        const tokensKey = `user_tokens_${userId}`;
        const existingTokens = JSON.parse(localStorage.getItem(tokensKey)) || [];
        
        // Add new token
        existingTokens.push(tokenData);
        
        // Save back to localStorage
        localStorage.setItem(tokensKey, JSON.stringify(existingTokens));
        console.log('Token saved for user:', userId);
        
        // If tokens exceed 5, remove the oldest ones
        if (existingTokens.length > 5) {
            const sortedTokens = existingTokens.sort((a, b) => a.created - b.created);
            const newTokens = sortedTokens.slice(-5); // Keep only the 5 most recent tokens
            localStorage.setItem(tokensKey, JSON.stringify(newTokens));
        }
    }

    // Get user's active tokens
    getUserTokens(userId) {
        const tokensJson = localStorage.getItem(`user_tokens_${userId}`);
        return tokensJson ? JSON.parse(tokensJson) : [];
    }

    // Clear all tokens for a user
    clearUserTokens(userId) {
        localStorage.removeItem(`user_tokens_${userId}`);
    }

    // Verify a QR code
    verifyQRCode(qrData) {
        try {
            const data = JSON.parse(qrData);
            console.log('Verifying QR code data:', data);
            
            // Check if token exists and has not expired
            if (!data.userId || !data.token || !data.expires) {
                return { valid: false, message: 'Invalid QR code format' };
            }
            
            if (Date.now() > data.expires) {
                return { valid: false, message: 'QR code has expired' };
            }
            
            // Verify the token exists in user's tokens
            const userTokens = this.getUserTokens(data.userId);
            const validToken = userTokens.find(t => t.token === data.token);
            
            if (!validToken) {
                return { valid: false, message: 'Invalid token' };
            }
            
            // Mark user as verified
            this.markUserAsVerified(data.userId);
            
            return { 
                valid: true, 
                userId: data.userId,
                message: 'QR code verified successfully',
                userInfo: data.userInfo || null
            };
        } catch (error) {
            console.error('QR verification error:', error);
            return { valid: false, message: 'Error processing QR code: ' + error.message };
        }
    }
    
    // Download QR code as an image
    downloadQRCode(containerId, filename = 'qr-code') {
        const qrContainer = document.getElementById(containerId);
        if (!qrContainer) {
            console.error('QR container not found');
            return;
        }
        
        const canvas = qrContainer.querySelector('canvas');
        if (!canvas) {
            console.error('QR code canvas not found');
            return;
        }
        
        const link = document.createElement('a');
        
        // Convert canvas to data URL
        link.href = canvas.toDataURL('image/png');
        link.download = `${filename}-${Date.now()}.png`;
        
        // Trigger download
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        
        console.log('QR code downloaded');
    }
}

class QRScanner {
    constructor(videoElementId, canvasElementId, resultElementId, onSuccessCallback) {
        this.video = document.getElementById(videoElementId);
        this.canvas = document.getElementById(canvasElementId);
        this.resultElement = document.getElementById(resultElementId);
        
        // Check if elements exist
        if (!this.video) {
            console.error('Video element not found:', videoElementId);
        }
        if (!this.canvas) {
            console.error('Canvas element not found:', canvasElementId);
        }
        if (!this.resultElement) {
            console.error('Result element not found:', resultElementId);
        }
        
        if (this.canvas) {
            this.canvasContext = this.canvas.getContext('2d');
        } else {
            console.error('Cannot get canvas context - canvas element not found');
        }
        
        this.scanning = false;
        this.onSuccessCallback = onSuccessCallback;
        console.log('QR Scanner initialized for video:', videoElementId);
    }
    
    // Start the QR scanner
    startScanner() {
        if (this.scanning) {
            console.log('Scanner already running');
            return;
        }
        
        // Check if jsQR is loaded before starting
        if (typeof jsQR === 'undefined') {
            console.error('jsQR library not loaded! Cannot start scanner.');
            if (this.resultElement) {
                this.resultElement.textContent = 'QR code scanning library not loaded. Please refresh the page.';
                this.resultElement.classList.add('error');
            }
            return;
        }
        
        if (!this.video || !this.canvas || !this.canvasContext) {
            console.error('Missing required elements for scanning');
            if (this.resultElement) {
                this.resultElement.textContent = 'Scanner initialization failed. Missing required elements.';
                this.resultElement.classList.add('error');
            }
            return;
        }
        
        this.scanning = true;
        console.log('Starting QR scanner');
        
        // Access device camera
        navigator.mediaDevices.getUserMedia({ video: { facingMode: 'environment' } })
            .then(stream => {
                this.video.srcObject = stream;
                this.video.setAttribute('playsinline', true); // Required for iOS
                this.video.play()
                    .then(() => {
                        console.log('Camera stream started successfully');
                        // Start scanning for QR code
                        requestAnimationFrame(() => this.scan());
                    })
                    .catch(playError => {
                        console.error('Error playing video:', playError);
                        if (this.resultElement) {
                            this.resultElement.textContent = 'Error starting video: ' + playError.message;
                            this.resultElement.classList.add('error');
                        }
                    });
            })
            .catch(error => {
                console.error('Camera access error:', error);
                
                let errorMessage = 'Camera access error: ' + error.message;
                
                // Add more specific messages for common errors
                if (error.name === 'NotAllowedError') {
                    errorMessage = 'Camera access denied. Please allow camera access and try again.';
                } else if (error.name === 'NotFoundError') {
                    errorMessage = 'No camera found on your device.';
                } else if (error.name === 'NotReadableError') {
                    errorMessage = 'Camera is already in use by another application.';
                } else if (error.name === 'OverconstrainedError') {
                    errorMessage = 'Camera does not satisfy required constraints.';
                }
                
                if (this.resultElement) {
                    this.resultElement.textContent = errorMessage;
                    this.resultElement.classList.add('error');
                }
                
                this.scanning = false;
            });
    }
    
    // Stop the QR scanner
    stopScanner() {
        console.log('Stopping QR scanner');
        this.scanning = false;
        
        // Stop video stream
        if (this.video && this.video.srcObject) {
            const tracks = this.video.srcObject.getTracks();
            tracks.forEach(track => track.stop());
            this.video.srcObject = null;
            console.log('Camera stream stopped');
        }
    }
    
    // Draw QR code detection outline
    drawQRCodeOutline(location) {
        if (!this.canvasContext) {
            console.error('Cannot draw QR code outline - canvas context not available');
            return;
        }
        
        this.canvasContext.beginPath();
        this.canvasContext.moveTo(location.topLeftCorner.x, location.topLeftCorner.y);
        this.canvasContext.lineTo(location.topRightCorner.x, location.topRightCorner.y);
        this.canvasContext.lineTo(location.bottomRightCorner.x, location.bottomRightCorner.y);
        this.canvasContext.lineTo(location.bottomLeftCorner.x, location.bottomLeftCorner.y);
        this.canvasContext.lineTo(location.topLeftCorner.x, location.topLeftCorner.y);
        this.canvasContext.lineWidth = 4;
        this.canvasContext.strokeStyle = '#FF3B58';
        this.canvasContext.stroke();
    }

    scan() {
        if (!this.scanning) {
            console.log('Scanning stopped');
            return;
        }

        if (!this.video || !this.canvas || !this.canvasContext) {
            console.error('Missing required elements for scanning');
            this.stopScanner();
            return;
        }

        if (typeof jsQR === 'undefined') {
            console.error('jsQR library not loaded!');
            if (this.resultElement) {
                this.resultElement.textContent = 'QR scanning library not loaded. Please refresh the page.';
                this.resultElement.classList.add('error');
            }
            this.stopScanner();
            return;
        }

        if (this.video.readyState === this.video.HAVE_ENOUGH_DATA) {
            try {
                // Draw video frame to canvas
                this.canvas.height = this.video.videoHeight;
                this.canvas.width = this.video.videoWidth;
                this.canvasContext.drawImage(this.video, 0, 0, this.canvas.width, this.canvas.height);
                
                // Get image data for QR code scanning
                const imageData = this.canvasContext.getImageData(0, 0, this.canvas.width, this.canvas.height);
                
                // Use jsQR library to detect QR code
                const code = jsQR(imageData.data, imageData.width, imageData.height, {
                    inversionAttempts: "dontInvert",
                });
                
                if (code) {
                    // QR code detected
                    console.log('QR code detected!');
                    this.drawQRCodeOutline(code.location);
                    
                    if (this.resultElement) {
                        this.resultElement.textContent = 'QR code detected! Verifying...';
                        this.resultElement.classList.remove('error');
                        this.resultElement.classList.add('success');
                    }
                    
                    // Process the QR code data
                    if (typeof this.onSuccessCallback === 'function') {
                        this.onSuccessCallback(code.data);
                        this.stopScanner();
                        return;
                    }
                }
            } catch (error) {
                console.error('QR scanning error:', error);
                if (this.resultElement) {
                    this.resultElement.textContent = 'Error scanning QR code: ' + error.message;
                    this.resultElement.classList.add('error');
                }
            }
        }
        
        // Continue scanning
        if (this.scanning) {
            requestAnimationFrame(() => this.scan());
        }
    }
}

// Initialize the verification system when the DOM is loaded
document.addEventListener('DOMContentLoaded', function() {
    console.log('DOM loaded, initializing QR verification system');
    
    // Check if QRCode library is loaded
    if (typeof QRCode === 'undefined') {
        console.error('QRCode library not loaded in DOMContentLoaded event');
        // We'll let the inline script in the HTML handle loading
    } else {
        console.log('QRCode library loaded in DOMContentLoaded event');
    }
    
    // Create QR verification instance
    window.qrVerification = new QRVerification();
    
    // Check if we're on the QR code verification page
    const qrContainer = document.getElementById('qrcode-container');
    if (qrContainer) {
        console.log('QR code container found, preparing to generate QR code');
        
        // Get user info from URL or session storage
        const urlParams = new URLSearchParams(window.location.search);
        const userId = urlParams.get('userId') || 
                       sessionStorage.getItem('newUserId') || 
                       sessionStorage.getItem('currentUserId');
        
        console.log('User ID for QR generation:', userId);
        
        if (userId) {
            // Generate QR code for the user with a delay to ensure library is loaded
            setTimeout(() => {
                if (typeof QRCode !== 'undefined') {
                    window.qrVerification.generateUserQR(userId, 'qrcode-container');
                } else {
                    console.error('QRCode library still not loaded after delay');
                    qrContainer.innerHTML = '<div class="error-message">Could not load QR code library. Please check your internet connection and refresh the page.</div>';
                }
            }, 1000); // Longer delay to ensure everything is loaded
            
            // Setup regenerate button
            const regenerateBtn = document.getElementById('regenerate-qr');
            if (regenerateBtn) {
                regenerateBtn.addEventListener('click', function() {
                    window.qrVerification.generateUserQR(userId, 'qrcode-container');
                });
            }
            
            // Setup download button
            const downloadBtn = document.getElementById('download-qr');
            if (downloadBtn) {
                downloadBtn.addEventListener('click', function() {
                    window.qrVerification.downloadQRCode('qrcode-container', `qr-${userId}`);
                });
            }
        } else {
            console.error('No user ID found for QR generation');
            const userInfoElement = document.querySelector('.user-info');
            if (userInfoElement) {
                userInfoElement.innerHTML = '<div class="error-message">User information not found. Please go back to registration.</div>';
            }
        }
    }
    
    // Check if we're on the QR scanner page
    const scannerContainer = document.getElementById('scanner-container');
    if (scannerContainer) {
        console.log('Scanner container found, preparing QR scanner');
        
        // Check if jsQR is loaded
        if (typeof jsQR === 'undefined') {
            console.error('jsQR library not loaded!');
            
            // Try to load jsQR library
            const script = document.createElement('script');
            script.src = "https://cdn.jsdelivr.net/npm/jsqr@1.4.0/dist/jsQR.min.js";
            script.onload = function() {
                console.log('jsQR library loaded successfully!');
                initializeScanner();
            };
            script.onerror = function() {
                console.error('Failed to load jsQR library!');
                
                const resultElement = document.getElementById('scan-result');
                if (resultElement) {
                    resultElement.textContent = 'Failed to load QR code scanning library. Please check your internet connection and refresh the page.';
                    resultElement.classList.add('error');
                }
            };
            document.body.appendChild(script);
        } else {
            console.log('jsQR library loaded.');
            initializeScanner();
        }
        
        function initializeScanner() {
            const startScanBtn = document.getElementById('start-scan');
            if (startScanBtn) {
                startScanBtn.addEventListener('click', function() {
                    const isScanning = startScanBtn.textContent.includes('Stop');
                    
                    if (isScanning) {
                        // Currently scanning, so stop
                        if (window.qrScanner) {
                            window.qrScanner.stopScanner();
                        }
                        startScanBtn.innerHTML = '<i class="fas fa-qrcode"></i> Start Scanning';
                    } else {
                        // Not scanning, so start
                        if (!window.qrScanner) {
                            window.qrScanner = new QRScanner(
                                'qr-video', 
                                'qr-canvas', 
                                'scan-result',
                                function(qrData) {
                                    // Verify the scanned QR code
                                    const result = window.qrVerification.verifyQRCode(qrData);
                                    const resultElement = document.getElementById('scan-result');
                                    
                                    if (resultElement) {
                                        resultElement.textContent = result.message;
                                        resultElement.className = 'scan-result ' + (result.valid ? 'success' : 'error');
                                        
                                        if (result.valid) {
                                            // Redirect to voting page or process the verified user
                                            sessionStorage.setItem('qr_verified', 'true');
                                            sessionStorage.setItem('verified_user_id', result.userId);
                                            
                                            // Wait 2 seconds to show success message before redirecting
                                            setTimeout(function() {
                                                window.location.href = 'vote.html';
                                            }, 2000);
                                        }
                                    }
                                }
                            );
                        }
                        
                        window.qrScanner.startScanner();
                        startScanBtn.innerHTML = '<i class="fas fa-stop"></i> Stop Scanning';
                    }
                });
            }
        }
    }
}); 