// Dashboard JavaScript

document.addEventListener('DOMContentLoaded', () => {
    // Check if user is logged in
    const currentUser = JSON.parse(sessionStorage.getItem('currentUser'));
    
    if (!currentUser) {
        // Redirect to login page if not logged in
        window.location.href = 'login.html';
        return;
    }
    
    // Populate user avatar with initials
    const userAvatar = document.getElementById('userAvatar');
    if (userAvatar && currentUser.fullName) {
        const initials = getInitials(currentUser.fullName);
        userAvatar.textContent = initials;
    }
    
    // Update user name in the header
    const userNameElement = document.getElementById('userName');
    if (userNameElement && currentUser.fullName) {
        userNameElement.textContent = currentUser.fullName;
    }
    
    // Update user ID in the header
    const userIdElement = document.getElementById('userId');
    if (userIdElement) {
        if (currentUser.voterType === 'student') {
            userIdElement.textContent = currentUser.studentId || currentUser.id;
        } else {
            userIdElement.textContent = currentUser.employeeId || currentUser.staffId || currentUser.id;
        }
    }
    
    // Set visibility based on user type
    setUserTypeVisibility(currentUser.voterType);
    
    // Initialize tab functionality
    initializeTabs();
    
    // Populate profile information
    populateProfileInfo(currentUser);
    
    // Initialize password change functionality
    initializePasswordChange();
    
    // Initialize staff-specific functionality if user is staff
    if (currentUser.voterType === 'staff' || currentUser.voterType === 'admin') {
        initializeStaffFunctionality();
    }
    
    // Logout functionality
    const logoutBtn = document.getElementById('logoutBtn');
    if (logoutBtn) {
        logoutBtn.addEventListener('click', () => {
            // Clear session storage
            sessionStorage.removeItem('currentUser');
            
            // Redirect to home page
            window.location.href = 'index.html';
        });
    }
    
    // Initialize elections data in localStorage if it doesn't exist
    if (!localStorage.getItem('elections')) {
        const defaultElections = [
            {
                id: 'election1',
                title: 'Student Council President Election',
                description: 'Vote for your next Student Council President for the academic year 2023-2024',
                startDate: '2023-05-15',
                endDate: '2023-05-20',
                status: 'active',
                eligibility: 'students',
                candidates: [
                    { id: 'c1', name: 'Sarah Johnson', position: 'President', votes: 45 },
                    { id: 'c2', name: 'Michael Chen', position: 'President', votes: 38 },
                    { id: 'c3', name: 'Emily Davis', position: 'President', votes: 42 }
                ],
                voters: ['student1'],
                settings: {
                    anonymousVoting: true,
                    publicResults: true,
                    realTimeResults: true
                }
            },
            {
                id: 'election2',
                title: 'Department Representative Election',
                description: 'Choose your department representative for the student council',
                startDate: '2023-06-10',
                endDate: '2023-06-15',
                status: 'active',
                eligibility: 'students',
                candidates: [
                    { id: 'c4', name: 'David Wilson', position: 'Representative', votes: 27 },
                    { id: 'c5', name: 'Lisa Anderson', position: 'Representative', votes: 19 }
                ],
                voters: [],
                settings: {
                    anonymousVoting: true,
                    publicResults: true,
                    realTimeResults: false
                }
            },
            {
                id: 'election3',
                title: 'Club President Election',
                description: 'Vote for the new president of the student club',
                startDate: '2023-07-05',
                endDate: '2023-07-10',
                status: 'upcoming',
                eligibility: 'students',
                candidates: [
                    { id: 'c7', name: 'Daniel Miller', position: 'President', votes: 0 },
                    { id: 'c8', name: 'Sophia Garcia', position: 'President', votes: 0 }
                ],
                voters: [],
                settings: {
                    anonymousVoting: true,
                    publicResults: false,
                    realTimeResults: false
                }
            }
        ];
        localStorage.setItem('elections', JSON.stringify(defaultElections));
    }
    
    // Load and display elections that the user is eligible for
    loadStudentElections();
    
    // Load and display election results for the user
    loadStudentResults();
    
    // Function to get user initials for avatar
    function getInitials(name) {
        if (!name) return '?';
        
        const parts = name.split(' ');
        if (parts.length === 1) return parts[0].charAt(0).toUpperCase();
        
        return (parts[0].charAt(0) + parts[parts.length - 1].charAt(0)).toUpperCase();
    }
    
    // Function to initialize tab functionality
    function initializeTabs() {
        const tabs = document.querySelectorAll('.dashboard-tab');
        const sections = document.querySelectorAll('.section');
        
        tabs.forEach(tab => {
            tab.addEventListener('click', () => {
                const targetId = tab.getAttribute('data-tab');
                
                // Clear all refresh intervals when changing tabs
                clearAllRefreshIntervals();
                
                // Remove active class from all tabs and sections
                tabs.forEach(t => t.classList.remove('active'));
                sections.forEach(s => s.classList.remove('active'));
                
                // Add active class to clicked tab and corresponding section
                tab.classList.add('active');
                document.getElementById(targetId).classList.add('active');
                
                // If switching to results tab, trigger a refresh
                if (targetId === 'results' && currentUser.voterType === 'student') {
                    loadStudentResults();
                } else if (targetId === 'all-results' && (currentUser.voterType === 'staff' || currentUser.voterType === 'admin')) {
                    loadAllResults();
                }
            });
        });
        
        // Clear refresh intervals when page is unloaded
        window.addEventListener('beforeunload', clearAllRefreshIntervals);
        
        function clearAllRefreshIntervals() {
            // Clear intervals from result cards
            document.querySelectorAll('.result-card').forEach(card => {
                const intervalId = card.dataset.refreshInterval;
                if (intervalId) {
                    clearInterval(parseInt(intervalId));
                    delete card.dataset.refreshInterval;
                }
            });
            
            // Clear intervals from containers
            const resultsContainer = document.getElementById('resultsContainer');
            if (resultsContainer && resultsContainer.dataset.refreshInterval) {
                clearInterval(parseInt(resultsContainer.dataset.refreshInterval));
                delete resultsContainer.dataset.refreshInterval;
            }
            
            const allResultsContainer = document.getElementById('allResultsContainer');
            if (allResultsContainer && allResultsContainer.dataset.refreshInterval) {
                clearInterval(parseInt(allResultsContainer.dataset.refreshInterval));
                delete allResultsContainer.dataset.refreshInterval;
            }
        }
    }
    
    // Function to load and display elections for student
    function loadStudentElections() {
        const allElections = JSON.parse(localStorage.getItem('elections')) || [];
        const currentUser = JSON.parse(sessionStorage.getItem('currentUser'));
        
        if (!currentUser) {
            console.error("No user found in session storage");
            return;
        }
        
        // Filter elections based on eligibility for students
        const eligibleElections = allElections.filter(election => {
            // Check basic eligibility
            const basicEligibility = (
                (election.eligibility === 'all' || 
                election.eligibility === 'students') &&
                (election.status === 'active' || election.status === 'upcoming')
            );
            
            // Check if this is an authorized-only election 
            if (election.eligibility === 'authorized') {
                // The current user must have their studentId in the authorizedUsers array
                return (
                    (election.status === 'active' || election.status === 'upcoming') &&
                    election.authorizedUsers && 
                    election.authorizedUsers.includes(currentUser.studentId)
                );
            }
            
            return basicEligibility;
        });
        
        const electionsContainer = document.getElementById('electionsContainer');
        if (!electionsContainer) return;
        
        // Check if there are any eligible elections
        if (eligibleElections.length === 0) {
            document.getElementById('noElectionsMessage').style.display = 'block';
            return;
        }
        
        // Clear existing election cards (except the empty state message)
        const emptyState = document.getElementById('noElectionsMessage');
        electionsContainer.innerHTML = '';
        electionsContainer.appendChild(emptyState);
        emptyState.style.display = 'none';
        
        // Create and append election cards
        eligibleElections.forEach(election => {
            const hasVoted = election.voters && election.voters.includes(currentUser.id);
            
            const electionCard = document.createElement('div');
            electionCard.className = 'election-card';
            
            // Format dates
            const startDate = new Date(election.startDate);
            const endDate = new Date(election.endDate);
            const formattedStartDate = startDate.toLocaleDateString('en-US', { 
                year: 'numeric', month: 'short', day: 'numeric' 
            });
            const formattedEndDate = endDate.toLocaleDateString('en-US', { 
                year: 'numeric', month: 'short', day: 'numeric' 
            });
            
            // Determine status for display
            let statusClass = '';
            let statusText = '';
            
            if (election.status === 'active') {
                statusClass = 'status-active';
                statusText = 'Active';
            } else if (election.status === 'upcoming') {
                statusClass = 'status-upcoming';
                statusText = 'Upcoming';
            } else {
                statusClass = 'status-ended';
                statusText = 'Ended';
            }
            
            electionCard.innerHTML = `
                <div class="election-header">
                    <h3 class="election-title">${election.title}</h3>
                    <div class="election-dates">
                        <i class="fas fa-calendar-alt"></i> ${formattedStartDate} - ${formattedEndDate}
                    </div>
                    <span class="election-status ${statusClass}">
                        <i class="fas fa-circle"></i> ${statusText}
                    </span>
                </div>
                <div class="election-body">
                    <p class="election-description">${election.description}</p>
                    <div class="election-actions">
                        ${election.status === 'active' 
                            ? hasVoted 
                                ? `<button class="btn btn-primary" disabled><i class="fas fa-check-circle"></i> Voted</button>
                                   ${election.settings.realTimeResults ? `<a href="vote.html?id=${election.id}" class="btn btn-secondary"><i class="fas fa-chart-bar"></i> View Results</a>` : ''}`
                                : `<a href="vote.html?id=${election.id}" class="btn btn-primary"><i class="fas fa-vote-yea"></i> Vote Now</a>
                                   ${election.settings.realTimeResults ? `<button class="btn btn-secondary view-results-btn" data-id="${election.id}"><i class="fas fa-chart-bar"></i> Live Results</button>` : ''}`
                            : election.status === 'upcoming'
                                ? '<button class="btn btn-primary" disabled><i class="fas fa-clock"></i> Coming Soon</button>'
                                : '<button class="btn btn-primary" disabled><i class="fas fa-times-circle"></i> Ended</button>'
                        }
                    </div>
                </div>
            `;
            
            // Add event listener for the view results button
            const viewResultsBtn = electionCard.querySelector('.view-results-btn');
            if (viewResultsBtn) {
                viewResultsBtn.addEventListener('click', () => {
                    window.location.href = `vote.html?id=${election.id}`;
                });
            }
            
            electionsContainer.appendChild(electionCard);
        });
    }
    
    // Function to load and display election results for the student
    function loadStudentResults() {
        const allElections = JSON.parse(localStorage.getItem('elections')) || [];
        const currentUser = JSON.parse(sessionStorage.getItem('currentUser'));
        
        if (!currentUser) return;
        
        // Filter elections that the user has voted in and that have public results
        // or elections with real-time results enabled
        const resultElections = allElections.filter(election => {
            const hasVoted = election.voters && election.voters.includes(currentUser.id);
            const canViewResults = election.settings.publicResults || election.settings.realTimeResults;
            
            // User can see results if:
            // 1. They have voted in the election AND public results are enabled
            // 2. OR real-time results are enabled for the election
            return (hasVoted && election.settings.publicResults) || 
                   (election.settings.realTimeResults && election.status === 'active');
        });
        
        const resultsContainer = document.getElementById('resultsContainer');
        if (!resultsContainer) return;
        
        // Check if there are any results to display
        if (resultElections.length === 0) {
            document.getElementById('noResultsMessage').style.display = 'block';
            return;
        }
        
        // Clear existing results (except the empty state message)
        const emptyState = document.getElementById('noResultsMessage');
        resultsContainer.innerHTML = '';
        resultsContainer.appendChild(emptyState);
        emptyState.style.display = 'none';
        
        // Create and append result cards
        resultElections.forEach(election => {
            // Skip if the election doesn't have candidates or is upcoming
            if (!election.candidates || election.status === 'upcoming') return;
            
            const resultCard = document.createElement('div');
            resultCard.className = 'result-card';
            resultCard.dataset.electionId = election.id;
            
            // Calculate total votes for percentage
            const totalVotes = election.candidates.reduce((sum, candidate) => sum + candidate.votes, 0);
            
            // Sort candidates by votes (descending)
            const sortedCandidates = [...election.candidates].sort((a, b) => b.votes - a.votes);
            
            // Create candidate results HTML
            const candidatesHTML = sortedCandidates.map(candidate => {
                const percent = totalVotes > 0 ? Math.round((candidate.votes / totalVotes) * 100) : 0;
                
                return `
                    <div class="candidate-result">
                        <div class="candidate-name">${candidate.name}</div>
                        <div class="candidate-votes">${candidate.votes} votes (${percent}%)</div>
                    </div>
                    <div class="progress-bar">
                        <div class="progress-fill" style="width: ${percent}%"></div>
                    </div>
                `;
            }).join('');
            
            const hasVoted = election.voters && election.voters.includes(currentUser.id);
            const liveUpdate = election.settings.realTimeResults ? '<span class="live-badge">LIVE</span>' : '';
            
            resultCard.innerHTML = `
                <div class="result-header">
                    <h3>${election.title} ${liveUpdate}</h3>
                    <p>Total votes: ${totalVotes}</p>
                    ${!hasVoted && election.status === 'active' ? 
                      `<div class="not-voted-warning">
                          <i class="fas fa-exclamation-triangle"></i> 
                          You haven't voted in this election yet
                          <a href="vote.html?id=${election.id}" class="btn btn-sm btn-primary">Vote Now</a>
                       </div>` : ''}
                </div>
                <div class="result-body">
                    ${candidatesHTML}
                </div>
            `;
            
            // Add auto-refresh functionality for real-time results
            if (election.settings.realTimeResults && election.status === 'active') {
                const resultCardElement = resultCard;
                const electionId = election.id;
                
                // Set up auto-refresh every 10 seconds for real-time results
                const refreshIntervalId = setInterval(() => {
                    const updatedElections = JSON.parse(localStorage.getItem('elections')) || [];
                    const updatedElection = updatedElections.find(e => e.id === electionId);
                    
                    if (!updatedElection || updatedElection.status !== 'active') {
                        clearInterval(refreshIntervalId);
                        return;
                    }
                    
                    // Update the result card with the latest data
                    updateResultCard(resultCardElement, updatedElection, currentUser);
                }, 10000); // Refresh every 10 seconds
                
                // Store the interval ID to clear it when switching tabs or leaving the page
                resultCard.dataset.refreshInterval = refreshIntervalId;
            }
            
            resultsContainer.appendChild(resultCard);
        });
        
        // Function to update a result card with the latest data
        function updateResultCard(cardElement, election, user) {
            const totalVotes = election.candidates.reduce((sum, candidate) => sum + candidate.votes, 0);
            const sortedCandidates = [...election.candidates].sort((a, b) => b.votes - a.votes);
            
            // Update total votes
            const totalVotesElement = cardElement.querySelector('.result-header p');
            if (totalVotesElement) {
                totalVotesElement.textContent = `Total votes: ${totalVotes}`;
            }
            
            // Update candidate results
            const resultBody = cardElement.querySelector('.result-body');
            if (resultBody) {
                resultBody.innerHTML = sortedCandidates.map(candidate => {
                    const percent = totalVotes > 0 ? Math.round((candidate.votes / totalVotes) * 100) : 0;
                    
                    return `
                        <div class="candidate-result">
                            <div class="candidate-name">${candidate.name}</div>
                            <div class="candidate-votes">${candidate.votes} votes (${percent}%)</div>
                        </div>
                        <div class="progress-bar">
                            <div class="progress-fill" style="width: ${percent}%"></div>
                        </div>
                    `;
                }).join('');
            }
            
            // Update the voted status if needed
            const hasVoted = election.voters && election.voters.includes(user.id);
            const notVotedWarning = cardElement.querySelector('.not-voted-warning');
            
            if (hasVoted && notVotedWarning) {
                notVotedWarning.remove();
            }
        }
    }
    
    // Function to initialize password change functionality
    function initializePasswordChange() {
        const changePasswordBtn = document.getElementById('changePasswordBtn');
        const openChangePasswordBtn = document.getElementById('openChangePasswordBtn');
        const passwordModal = document.getElementById('passwordModal');
        const closeModal = document.getElementById('closeModal');
        const cancelPasswordChange = document.getElementById('cancelPasswordChange');
        const passwordForm = document.getElementById('changePasswordForm');
        const currentPasswordInput = document.getElementById('currentPassword');
        const newPasswordInput = document.getElementById('newPassword');
        const confirmPasswordInput = document.getElementById('confirmPassword');
        const successMessage = document.getElementById('passwordSuccessMessage');
        const errorMessage = document.getElementById('passwordErrorMessage');
        const currentPasswordError = document.getElementById('currentPasswordError');
        const newPasswordError = document.getElementById('newPasswordError');
        const confirmPasswordError = document.getElementById('confirmPasswordError');
        
        // Initialize password toggle buttons
        const passwordToggleButtons = document.querySelectorAll('.password-toggle');
        passwordToggleButtons.forEach(button => {
            button.addEventListener('click', () => {
                const targetId = button.getAttribute('data-target');
                const passwordInput = document.getElementById(targetId);
                
                // Toggle password visibility
                const type = passwordInput.getAttribute('type') === 'password' ? 'text' : 'password';
                passwordInput.setAttribute('type', type);
                
                // Toggle eye icon
                const eyeIcon = button.querySelector('i');
                eyeIcon.classList.toggle('fa-eye');
                eyeIcon.classList.toggle('fa-eye-slash');
            });
        });
        
        // Open modal event listeners
        if (changePasswordBtn) {
            changePasswordBtn.addEventListener('click', openPasswordModal);
        }
        
        if (openChangePasswordBtn) {
            openChangePasswordBtn.addEventListener('click', openPasswordModal);
        }
        
        // Close modal event listeners
        if (closeModal) {
            closeModal.addEventListener('click', closePasswordModal);
        }
        
        if (cancelPasswordChange) {
            cancelPasswordChange.addEventListener('click', closePasswordModal);
        }
        
        // Form submission
        if (passwordForm) {
            passwordForm.addEventListener('submit', (e) => {
                e.preventDefault();
                
                // Reset error messages
                currentPasswordError.textContent = '';
                newPasswordError.textContent = '';
                confirmPasswordError.textContent = '';
                successMessage.style.display = 'none';
                errorMessage.style.display = 'none';
                
                // Get form values
                const currentPassword = currentPasswordInput.value;
                const newPassword = newPasswordInput.value;
                const confirmPassword = confirmPasswordInput.value;
                
                // Validate current password
                const currentUser = JSON.parse(sessionStorage.getItem('currentUser'));
                if (currentPassword !== currentUser.password) {
                    currentPasswordError.textContent = 'Current password is incorrect';
                    return;
                }
                
                // Validate new password
                if (newPassword.length < 8) {
                    newPasswordError.textContent = 'Password must be at least 8 characters long';
                    return;
                }
                
                // Check if password contains uppercase, lowercase and number
                const hasUpperCase = /[A-Z]/.test(newPassword);
                const hasLowerCase = /[a-z]/.test(newPassword);
                const hasNumber = /[0-9]/.test(newPassword);
                
                if (!hasUpperCase || !hasLowerCase || !hasNumber) {
                    newPasswordError.textContent = 'Password must include uppercase, lowercase, and numbers';
                    return;
                }
                
                // Validate password confirmation
                if (newPassword !== confirmPassword) {
                    confirmPasswordError.textContent = 'Passwords do not match';
                    return;
                }
                
                // Update password in user data
                currentUser.password = newPassword;
                sessionStorage.setItem('currentUser', JSON.stringify(currentUser));
                
                // Also update in localStorage users array
                const users = JSON.parse(localStorage.getItem('users')) || [];
                const userIndex = users.findIndex(user => user.id === currentUser.id);
                
                if (userIndex !== -1) {
                    users[userIndex].password = newPassword;
                    localStorage.setItem('users', JSON.stringify(users));
                }
                
                // Show success message
                successMessage.style.display = 'block';
                
                // Reset form
                passwordForm.reset();
                
                // Close modal after delay
                setTimeout(() => {
                    closePasswordModal();
                }, 2000);
            });
        }
        
        function openPasswordModal() {
            passwordModal.style.display = 'flex';
            // Reset form and messages
            if (passwordForm) passwordForm.reset();
            if (successMessage) successMessage.style.display = 'none';
            if (errorMessage) errorMessage.style.display = 'none';
            if (currentPasswordError) currentPasswordError.textContent = '';
            if (newPasswordError) newPasswordError.textContent = '';
            if (confirmPasswordError) confirmPasswordError.textContent = '';
        }
        
        function closePasswordModal() {
            passwordModal.style.display = 'none';
        }
    }
    
    // Function to set visibility based on user type
    function setUserTypeVisibility(userType) {
        // Check if user is a student
        const isStudent = userType && userType.toLowerCase() === 'student';
        const isStaff = userType && (userType.toLowerCase() === 'staff' || userType.toLowerCase() === 'admin');
        
        // Get the dashboard containers
        const studentDashboard = document.querySelector('.student-dashboard-container');
        const staffDashboard = document.querySelector('.staff-dashboard-container');
        
        // Get the section elements
        const studentSections = document.querySelectorAll('.student-section');
        const staffSections = document.querySelectorAll('.staff-section');
        const profileSection = document.getElementById('profile');
        
        if (isStudent) {
            // Show student dashboard and hide staff dashboard
            if (studentDashboard) studentDashboard.style.display = 'flex';
            if (staffDashboard) staffDashboard.style.display = 'none';
            
            // Show student sections and hide staff sections
            studentSections.forEach(section => section.classList.add('section'));
            staffSections.forEach(section => {
                section.classList.add('section');
                section.classList.remove('active');
                section.style.display = 'none';
            });
            
            // Make sure "my-elections" is active for students
            const myElectionsSection = document.getElementById('my-elections');
            if (myElectionsSection) {
                myElectionsSection.classList.add('active');
            }
        } else if (isStaff) {
            // Show staff dashboard and hide student dashboard
            if (studentDashboard) studentDashboard.style.display = 'none';
            if (staffDashboard) staffDashboard.style.display = 'flex';
            
            // Show staff sections and hide student sections
            staffSections.forEach(section => section.classList.add('section'));
            studentSections.forEach(section => {
                section.classList.add('section');
                section.classList.remove('active');
                section.style.display = 'none';
            });
            
            // Make sure "conduct-election" is active for staff
            const conductElectionSection = document.getElementById('conduct-election');
            if (conductElectionSection) {
                conductElectionSection.classList.add('active');
                conductElectionSection.style.display = 'block';
            }
        }
        
        // Always make profile available
        if (profileSection) {
            profileSection.classList.add('section');
        }
    }
    
    // Function to populate profile information
    function populateProfileInfo(user) {
        // Profile name (in the profile section)
        const profileName = document.getElementById('profileName');
        if (profileName) {
            profileName.textContent = user.fullName || 'User';
        }
        
        // Profile ID
        const profileId = document.getElementById('profileId');
        if (profileId) {
            // Display the appropriate ID based on user type
            if (user.voterType === 'student' || user.type === 'student') {
                profileId.textContent = user.studentId || user.identificationNumber || user.id || 'N/A';
            } else if (user.voterType === 'staff' || user.type === 'staff') {
                profileId.textContent = user.employeeId || user.staffId || user.identificationNumber || user.id || 'N/A';
            } else {
                profileId.textContent = user.id || user.identificationNumber || 'N/A';
            }
        }
        
        // Email
        const userEmail = document.getElementById('userEmail');
        if (userEmail) {
            userEmail.textContent = user.email || 'N/A';
        }
        
        // Department
        const userDepartment = document.getElementById('userDepartment');
        if (userDepartment) {
            userDepartment.textContent = user.department || 'N/A';
        }
        
        // Account type
        const profileType = document.getElementById('profileType');
        if (profileType) {
            const userType = user.voterType || user.type;
            profileType.textContent = userType.charAt(0).toUpperCase() + userType.slice(1);
        }
        
        // Registration date
        const profileDate = document.getElementById('profileDate');
        if (profileDate) {
            if (user.registrationDate) {
                const date = new Date(user.registrationDate);
                profileDate.textContent = date.toLocaleDateString('en-US', { 
                    year: 'numeric', 
                    month: 'long', 
                    day: 'numeric' 
                });
            } else {
                // If no registration date, use a fallback
                profileDate.textContent = 'Not available';
            }
        }
    }
    
    // Function to initialize staff functionality
    function initializeStaffFunctionality() {
        // Initialize conduct election form
        initializeConductElectionForm();
        
        // Initialize manage elections section
        loadManageElections();
        
        // Initialize all results section
        loadAllResults();
        
        // Set up refresh button
        const refreshElectionsBtn = document.getElementById('refreshElectionsBtn');
        if (refreshElectionsBtn) {
            refreshElectionsBtn.addEventListener('click', loadManageElections);
        }
    }
    
    // Function to initialize conduct election form
    function initializeConductElectionForm() {
        const createElectionForm = document.getElementById('createElectionForm');
        const addCandidateBtn = document.getElementById('addCandidateBtn');
        const candidatesContainer = document.getElementById('candidatesContainer');
        const csvFileInput = document.getElementById('csvFile');
        
        // Set min dates for date inputs to today
        const today = new Date().toISOString().split('T')[0];
        const startDateInput = document.getElementById('startDate');
        const endDateInput = document.getElementById('endDate');
        
        if (startDateInput) startDateInput.min = today;
        if (endDateInput) endDateInput.min = today;
        
        // Initialize authorized users array
        let authorizedUsers = [];
        
        // Handle CSV file upload
        if (csvFileInput) {
            csvFileInput.addEventListener('change', handleCSVUpload);
        }
        
        function handleCSVUpload(event) {
            const file = event.target.files[0];
            if (!file) {
                return;
            }
            
            const reader = new FileReader();
            reader.onload = function(e) {
                const content = e.target.result;
                
                // Parse CSV content (assuming simple one-column format)
                authorizedUsers = content.split(/\r?\n/)
                    .map(line => line.trim())
                    .filter(line => line !== '');
                
                // Update preview
                updateAuthorizedUsersPreview(authorizedUsers);
            };
            
            reader.readAsText(file);
        }
        
        function updateAuthorizedUsersPreview(users) {
            const previewElement = document.getElementById('authorizedUsersPreview');
            const countElement = document.getElementById('authorizedUsersCount');
            
            if (!previewElement || !countElement) return;
            
            if (users.length === 0) {
                previewElement.innerHTML = '<div class="empty-preview">No authorized users found in file</div>';
                countElement.textContent = '0';
                return;
            }
            
            // Display max 50 USNs in the preview
            const previewUsers = users.slice(0, 50);
            const hasMore = users.length > 50;
            
            let previewHTML = previewUsers.map(usn => 
                `<span class="authorized-usn">${usn}</span>`
            ).join('');
            
            if (hasMore) {
                previewHTML += `<div class="mt-2">...and ${users.length - 50} more</div>`;
            }
            
            previewElement.innerHTML = previewHTML;
            countElement.textContent = users.length;
        }

        // Add candidate button functionality
        if (addCandidateBtn && candidatesContainer) {
            addCandidateBtn.addEventListener('click', () => {
                const candidateInputs = document.querySelectorAll('.candidate-input');
                
                // Show remove buttons if we have more than one candidate
                if (candidateInputs.length > 0) {
                    candidateInputs.forEach(input => {
                        const removeBtn = input.querySelector('.remove-candidate');
                        if (removeBtn) removeBtn.style.display = 'block';
                    });
                }
                
                // Create new candidate input
                const newCandidate = document.createElement('div');
                newCandidate.className = 'candidate-input';
                newCandidate.style.display = 'flex';
                newCandidate.style.gap = '10px';
                newCandidate.style.marginTop = '10px';
                
                newCandidate.innerHTML = `
                    <input type="text" class="form-control candidate-name" placeholder="Candidate Name" required>
                    <input type="text" class="form-control candidate-position" placeholder="Position" required>
                    <button type="button" class="btn btn-danger remove-candidate">
                        <i class="fas fa-trash"></i>
                    </button>
                `;
                
                // Add remove functionality to the new button
                const removeBtn = newCandidate.querySelector('.remove-candidate');
                if (removeBtn) {
                    removeBtn.addEventListener('click', () => {
                        newCandidate.remove();
                        
                        // If only one candidate left, hide its remove button
                        const remainingCandidates = document.querySelectorAll('.candidate-input');
                        if (remainingCandidates.length === 1) {
                            const lastRemoveBtn = remainingCandidates[0].querySelector('.remove-candidate');
                            if (lastRemoveBtn) lastRemoveBtn.style.display = 'none';
                        }
                    });
                }
                
                candidatesContainer.appendChild(newCandidate);
            });
        }
        
        // Handle form submission
        if (createElectionForm) {
            createElectionForm.addEventListener('submit', (e) => {
                e.preventDefault();
                
                // Get form values
                const title = document.getElementById('electionTitle').value.trim();
                const description = document.getElementById('electionDescription').value.trim();
                const startDate = document.getElementById('startDate').value;
                const endDate = document.getElementById('endDate').value;
                const eligibility = document.getElementById('eligibility').value;
                const anonymousVoting = document.getElementById('anonymousVoting').checked;
                const publicResults = document.getElementById('publicResults').checked;
                const realTimeResults = document.getElementById('realTimeResults').checked;
                
                // Validate authorized users if eligibility is set to authorized
                if (eligibility === 'authorized' && authorizedUsers.length === 0) {
                    alert('Please upload a CSV file with authorized USNs');
                    return;
                }
                
                // Get candidates
                const candidateInputs = document.querySelectorAll('.candidate-input');
                const candidates = [];
                
                candidateInputs.forEach((input, index) => {
                    const nameInput = input.querySelector('.candidate-name');
                    const positionInput = input.querySelector('.candidate-position');
                    
                    if (nameInput && positionInput) {
                        candidates.push({
                            id: 'c' + (new Date().getTime() + index), // Generate unique ID
                            name: nameInput.value.trim(),
                            position: positionInput.value.trim(),
                            votes: 0
                        });
                    }
                });
                
                // Validate dates
                const startDateObj = new Date(startDate);
                const endDateObj = new Date(endDate);
                
                if (endDateObj <= startDateObj) {
                    alert('End date must be after start date');
                    return;
                }
                
                // Create election object
                const newElection = {
                    id: 'election_' + new Date().getTime(),
                    title,
                    description,
                    startDate,
                    endDate,
                    eligibility,
                    status: startDateObj > new Date() ? 'upcoming' : 'active',
                    candidates,
                    voters: [],
                    authorizedUsers: eligibility === 'authorized' ? authorizedUsers : [],
                    settings: {
                        anonymousVoting,
                        publicResults,
                        realTimeResults
                    },
                    createdBy: JSON.parse(sessionStorage.getItem('currentUser')).id,
                    createdAt: new Date().toISOString()
                };
                
                // Add to elections in localStorage
                const elections = JSON.parse(localStorage.getItem('elections')) || [];
                elections.push(newElection);
                localStorage.setItem('elections', JSON.stringify(elections));
                
                // Reset authorized users
                authorizedUsers = [];
                updateAuthorizedUsersPreview([]);
                
                // Show success message
                alert('Election created successfully!');
                
                // Reset form
                createElectionForm.reset();
                
                // Reset candidates (keep only one)
                if (candidatesContainer) {
                    candidatesContainer.innerHTML = `
                        <div class="candidate-input">
                            <input type="text" class="form-control candidate-name" placeholder="Candidate Name" required>
                            <input type="text" class="form-control candidate-position" placeholder="Position" required>
                            <button type="button" class="btn btn-danger remove-candidate" style="display: none;">
                                <i class="fas fa-trash"></i>
                            </button>
                        </div>
                    `;
                }
                
                // Refresh manage elections table
                loadManageElections();
            });
        }
    }
    
    // Function to load manage elections
    function loadManageElections() {
        const manageElectionsBody = document.getElementById('manageElectionsBody');
        const noManageElectionsMessage = document.getElementById('noManageElectionsMessage');
        
        if (!manageElectionsBody) return;
        
        // Get current user
        const currentUser = JSON.parse(sessionStorage.getItem('currentUser'));
        if (!currentUser) return;
        
        // Get all elections
        const allElections = JSON.parse(localStorage.getItem('elections')) || [];
        
        // Filter elections created by this staff member
        const staffElections = allElections.filter(election => election.createdBy === currentUser.id);
        
        // Check if there are any elections to display
        if (staffElections.length === 0) {
            manageElectionsBody.innerHTML = '';
            if (noManageElectionsMessage) noManageElectionsMessage.style.display = 'block';
            return;
        }
        
        // Hide empty state message
        if (noManageElectionsMessage) noManageElectionsMessage.style.display = 'none';
        
        // Clear existing content
        manageElectionsBody.innerHTML = '';
        
        // Add elections to the table
        staffElections.forEach(election => {
            const row = document.createElement('tr');
            
            // Format dates
            const startDate = new Date(election.startDate);
            const endDate = new Date(election.endDate);
            const formattedStartDate = startDate.toLocaleDateString('en-US');
            const formattedEndDate = endDate.toLocaleDateString('en-US');
            
            // Get status class
            let statusClass;
            if (election.status === 'active') {
                statusClass = 'status-active';
            } else if (election.status === 'upcoming') {
                statusClass = 'status-upcoming';
            } else {
                statusClass = 'status-ended';
            }
            
            // Create status badge
            const statusBadge = `<span class="election-status ${statusClass}">
                ${election.status.charAt(0).toUpperCase() + election.status.slice(1)}
            </span>`;
            
            // Get eligibility text
            let eligibilityText = '';
            switch(election.eligibility) {
                case 'all':
                    eligibilityText = 'All Users';
                    break;
                case 'students':
                    eligibilityText = 'All Students';
                    break;
                case 'staff':
                    eligibilityText = 'All Staff';
                    break;
                case 'authorized':
                    eligibilityText = `Authorized (${election.authorizedUsers ? election.authorizedUsers.length : 0} users)`;
                    break;
                default:
                    eligibilityText = election.eligibility;
            }
            
            // Get total votes and voters
            const totalVotes = election.voters ? election.voters.length : 0;
            
            row.innerHTML = `
                <td>${election.title}</td>
                <td>${formattedStartDate}</td>
                <td>${formattedEndDate}</td>
                <td>${statusBadge}</td>
                <td>${eligibilityText}</td>
                <td>${totalVotes}</td>
                <td>
                    <button class="btn btn-primary view-results-btn" data-id="${election.id}">
                        <i class="fas fa-chart-bar"></i> Results
                    </button>
                    <button class="btn btn-danger delete-election-btn" data-id="${election.id}">
                        <i class="fas fa-trash"></i> Delete
                    </button>
                </td>
            `;
            
            // Add event listeners to buttons
            const viewResultsBtn = row.querySelector('.view-results-btn');
            const deleteElectionBtn = row.querySelector('.delete-election-btn');
            
            if (viewResultsBtn) {
                viewResultsBtn.addEventListener('click', () => {
                    // If real-time results are enabled for active elections, go to vote page
                    if (election.settings.realTimeResults && election.status === 'active') {
                        window.location.href = `vote.html?id=${election.id}`;
                    } else {
                        // Otherwise switch to results tab
                        const resultsTab = document.querySelector('.dashboard-tab[data-tab="all-results"]');
                        if (resultsTab) {
                            resultsTab.click();
                        }
                    }
                });
            }
            
            if (deleteElectionBtn) {
                deleteElectionBtn.addEventListener('click', () => {
                    if (confirm('Are you sure you want to delete this election? This cannot be undone.')) {
                        // Delete election
                        const elections = JSON.parse(localStorage.getItem('elections')) || [];
                        const updatedElections = elections.filter(e => e.id !== election.id);
                        localStorage.setItem('elections', JSON.stringify(updatedElections));
                        
                        // Refresh the table
                        loadManageElections();
                    }
                });
            }
            
            manageElectionsBody.appendChild(row);
        });
    }
    
    // Function to load all results for staff
    function loadAllResults() {
        const allResultsContainer = document.getElementById('allResultsContainer');
        const noAllResultsMessage = document.getElementById('noAllResultsMessage');
        
        if (!allResultsContainer) return;
        
        // Get current user
        const currentUser = JSON.parse(sessionStorage.getItem('currentUser'));
        if (!currentUser) return;
        
        // Get all elections
        const allElections = JSON.parse(localStorage.getItem('elections')) || [];
        
        // Filter elections to show results (either created by this staff or ended)
        const electionsWithResults = allElections.filter(election => 
            election.createdBy === currentUser.id || election.status === 'ended'
        );
        
        // Check if there are any elections to display
        if (electionsWithResults.length === 0) {
            // Clear existing content (except the empty state message)
            const emptyState = document.getElementById('noAllResultsMessage');
            allResultsContainer.innerHTML = '';
            if (emptyState) {
                allResultsContainer.appendChild(emptyState);
                emptyState.style.display = 'block';
            }
            return;
        }
        
        // Hide empty state message
        if (noAllResultsMessage) noAllResultsMessage.style.display = 'none';
        
        // Clear existing content
        allResultsContainer.innerHTML = '';
        
        // Set up refresh interval for active elections
        const refreshInterval = setInterval(() => {
            updateActiveElectionResults();
        }, 10000); // Update every 10 seconds
        
        // Store the interval ID to clear it when switching tabs or leaving the page
        allResultsContainer.dataset.refreshInterval = refreshInterval;
        
        // Add results cards
        electionsWithResults.forEach(election => {
            // Skip if the election doesn't have candidates
            if (!election.candidates || election.candidates.length === 0) return;
            
            const resultCard = document.createElement('div');
            resultCard.className = 'result-card';
            resultCard.dataset.electionId = election.id;
            
            // Add live badge for active elections
            const liveBadge = election.status === 'active' ? 
                '<span class="live-badge">LIVE</span>' : '';
            
            // Calculate total votes for percentage
            const totalVotes = election.candidates.reduce((sum, candidate) => sum + candidate.votes, 0);
            
            // Sort candidates by votes (descending)
            const sortedCandidates = [...election.candidates].sort((a, b) => b.votes - a.votes);
            
            // Create candidate results HTML
            const candidatesHTML = sortedCandidates.map(candidate => {
                const percent = totalVotes > 0 ? Math.round((candidate.votes / totalVotes) * 100) : 0;
                
                return `
                    <div class="candidate-result">
                        <div class="candidate-name">${candidate.name} (${candidate.position})</div>
                        <div class="candidate-votes">${candidate.votes} votes (${percent}%)</div>
                    </div>
                    <div class="progress-bar">
                        <div class="progress-fill" style="width: ${percent}%"></div>
                    </div>
                `;
            }).join('');
            
            // Format dates
            const startDate = new Date(election.startDate);
            const endDate = new Date(election.endDate);
            const formattedDateRange = `${startDate.toLocaleDateString('en-US')} - ${endDate.toLocaleDateString('en-US')}`;
            
            resultCard.innerHTML = `
                <div class="result-header">
                    <h3>${election.title} ${liveBadge}</h3>
                    <p><i class="fas fa-calendar-alt"></i> ${formattedDateRange}</p>
                    <p class="total-votes">Total votes: ${totalVotes}</p>
                </div>
                <div class="result-body">
                    ${candidatesHTML}
                </div>
            `;
            
            allResultsContainer.appendChild(resultCard);
        });
        
        // Function to update active election results
        function updateActiveElectionResults() {
            // Get all elections
            const elections = JSON.parse(localStorage.getItem('elections')) || [];
            const resultCards = allResultsContainer.querySelectorAll('.result-card');
            
            resultCards.forEach(card => {
                const electionId = card.dataset.electionId;
                const election = elections.find(e => e.id === electionId);
                
                if (!election || election.status !== 'active') return;
                
                // Update the card with the latest results
                const totalVotes = election.candidates.reduce((sum, candidate) => sum + candidate.votes, 0);
                const sortedCandidates = [...election.candidates].sort((a, b) => b.votes - a.votes);
                
                // Update total votes
                const totalVotesElement = card.querySelector('.total-votes');
                if (totalVotesElement) {
                    totalVotesElement.textContent = `Total votes: ${totalVotes}`;
                }
                
                // Update candidate results
                const resultBody = card.querySelector('.result-body');
                if (resultBody) {
                    resultBody.innerHTML = sortedCandidates.map(candidate => {
                        const percent = totalVotes > 0 ? Math.round((candidate.votes / totalVotes) * 100) : 0;
                        
                        return `
                            <div class="candidate-result">
                                <div class="candidate-name">${candidate.name} (${candidate.position})</div>
                                <div class="candidate-votes">${candidate.votes} votes (${percent}%)</div>
                            </div>
                            <div class="progress-bar">
                                <div class="progress-fill" style="width: ${percent}%"></div>
                            </div>
                        `;
                    }).join('');
                }
            });
        }
    }
}); 