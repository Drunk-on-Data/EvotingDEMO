// Vote Page JavaScript

document.addEventListener('DOMContentLoaded', () => {
    // Clear election IDs from sessionStorage to prevent redirection loops
    sessionStorage.removeItem('pendingElectionId');
    sessionStorage.removeItem('selectedElectionId');
    
    // Check authentication and QR verification
    checkAuthentication();
    
    // Get and display election data
    loadElectionData();
});

function checkAuthentication() {
    // Check if user is logged in
    const currentUser = JSON.parse(sessionStorage.getItem('currentUser'));
    
    if (!currentUser) {
        // Redirect to login page if not logged in
        window.location.href = 'login.html';
        return false;
    }
    
    // Check if vote is verified via QR code
    const voteVerified = sessionStorage.getItem('voteVerified') === 'true';
    const verificationTime = sessionStorage.getItem('verificationTime');
    
    // Verification expires after 30 minutes for security
    const isVerificationValid = voteVerified && verificationTime && 
        (Date.now() - parseInt(verificationTime)) < 30 * 60 * 1000;
    
    if (!isVerificationValid) {
        // Store election ID for redirection back after verification
        const urlParams = new URLSearchParams(window.location.search);
        const electionId = urlParams.get('id');
        
        if (electionId) {
            sessionStorage.setItem('pendingElectionId', electionId);
        }
        
        // Redirect to verification page
        window.location.href = 'vote-verification.html';
        return false;
    }
    
    return true;
}

function loadElectionData() {
    // Get election ID from URL parameters
    const urlParams = new URLSearchParams(window.location.search);
    const electionId = urlParams.get('id');
    
    if (!electionId) {
        showMessage('No election specified. Please select an election from the dashboard.', 'error');
        setTimeout(() => {
            window.location.href = 'dashboard.html';
        }, 3000);
        return;
    }
    
    // Get election data from localStorage
    const elections = JSON.parse(localStorage.getItem('elections')) || [];
    const election = elections.find(e => e.id === electionId);
    
    if (!election) {
        showMessage('Election not found.', 'error');
        setTimeout(() => {
            window.location.href = 'dashboard.html';
        }, 3000);
        return;
    }
    
    // Display election details
    displayElectionDetails(election);
    
    // Check if user has already voted
    const currentUser = JSON.parse(sessionStorage.getItem('currentUser'));
    const hasVoted = election.voters && election.voters.includes(currentUser.id);
    
    console.log("Checking if user has already voted:", {
        election: election.title,
        voters: election.voters || [],
        userId: currentUser.id,
        hasVoted: hasVoted
    });
    
    // Check if election is active
    const isActive = election.status === 'active';
    
    if (hasVoted) {
        showMessage('You have already voted in this election.', 'success');
        loadAndDisplayResults(election);
        return;
    }
    
    if (!isActive) {
        showMessage('This election is not currently active.', 'error');
        return;
    }
    
    // Display candidates
    displayCandidates(election);
}

function displayElectionDetails(election) {
    document.getElementById('election-title').textContent = election.title;
    document.getElementById('election-description').textContent = election.description;
    
    // Format dates
    const startDate = new Date(election.startDate);
    const endDate = new Date(election.endDate);
    
    const formattedStartDate = startDate.toLocaleDateString('en-US', { 
        year: 'numeric', month: 'short', day: 'numeric' 
    });
    const formattedEndDate = endDate.toLocaleDateString('en-US', { 
        year: 'numeric', month: 'short', day: 'numeric' 
    });
    
    document.getElementById('election-start-date').textContent = formattedStartDate;
    document.getElementById('election-end-date').textContent = formattedEndDate;
}

function displayCandidates(election) {
    const candidatesContainer = document.getElementById('candidates-container');
    
    // Clear loading indicator
    candidatesContainer.innerHTML = '';
    
    if (!election.candidates || election.candidates.length === 0) {
        candidatesContainer.innerHTML = '<p>No candidates available for this election.</p>';
        return;
    }
    
    // Create form for candidates
    const form = document.createElement('form');
    form.id = 'voteForm';
    form.className = 'vote-form';
    
    // Add candidates as options
    election.candidates.forEach(candidate => {
        const candidateOption = document.createElement('div');
        candidateOption.className = 'candidate-option';
        candidateOption.dataset.id = candidate.id;
        
        candidateOption.innerHTML = `
            <input type="radio" name="candidate" id="candidate_${candidate.id}" value="${candidate.id}" class="candidate-radio" required>
            <div class="candidate-details">
                <div class="candidate-name">${candidate.name}</div>
                <div class="candidate-position">${candidate.position || 'Candidate'}</div>
            </div>
        `;
        
        // Add click event to select candidate
        candidateOption.addEventListener('click', () => {
            // Remove selected class from all options
            document.querySelectorAll('.candidate-option').forEach(option => {
                option.classList.remove('selected');
            });
            
            // Add selected class to clicked option
            candidateOption.classList.add('selected');
            
            // Check the radio input
            const radio = candidateOption.querySelector('input[type="radio"]');
            if (radio) {
                radio.checked = true;
            }
        });
        
        form.appendChild(candidateOption);
    });
    
    // Add submit button
    const buttonsDiv = document.createElement('div');
    buttonsDiv.className = 'form-buttons';
    
    const submitButton = document.createElement('button');
    submitButton.type = 'submit';
    submitButton.className = 'btn btn-primary';
    submitButton.innerHTML = '<i class="fas fa-vote-yea"></i> Cast My Vote';
    
    const cancelButton = document.createElement('a');
    cancelButton.href = 'dashboard.html';
    cancelButton.className = 'btn btn-secondary';
    cancelButton.innerHTML = '<i class="fas fa-times"></i> Cancel';
    
    buttonsDiv.appendChild(submitButton);
    buttonsDiv.appendChild(cancelButton);
    form.appendChild(buttonsDiv);
    
    // Handle form submission
    form.addEventListener('submit', (e) => {
        e.preventDefault();
        submitVote(election);
    });
    
    candidatesContainer.appendChild(form);
}

function submitVote(election) {
    // Get selected candidate
    const selectedCandidateId = document.querySelector('input[name="candidate"]:checked')?.value;
    
    if (!selectedCandidateId) {
        showMessage('Please select a candidate to vote.', 'error');
        return;
    }
    
    // Show loading overlay
    document.querySelector('.loading-overlay').style.display = 'flex';
    
    // Get current user
    const currentUser = JSON.parse(sessionStorage.getItem('currentUser'));
    
    // Update election data - get fresh data to prevent race conditions
    const elections = JSON.parse(localStorage.getItem('elections')) || [];
    const electionIndex = elections.findIndex(e => e.id === election.id);
    
    if (electionIndex === -1) {
        showMessage('Election not found.', 'error');
        document.querySelector('.loading-overlay').style.display = 'none';
        return;
    }
    
    const updatedElection = elections[electionIndex];
    
    // Double-check if user already voted (to prevent multiple votes)
    if (updatedElection.voters && updatedElection.voters.includes(currentUser.id)) {
        showMessage('You have already voted in this election.', 'warning');
        document.querySelector('.loading-overlay').style.display = 'none';
        
        // Load the results instead
        loadAndDisplayResults(updatedElection);
        
        // Redirect to voted elections tab after a delay
        setTimeout(() => {
            sessionStorage.setItem('showVotedTab', 'true');
            window.location.href = 'dashboard.html';
        }, 2000);
        
        return;
    }
    
    // Simulate processing delay for better UX
    setTimeout(() => {
        // Find candidate and update votes
        const candidateIndex = updatedElection.candidates.findIndex(c => c.id === selectedCandidateId);
        
        if (candidateIndex === -1) {
            showMessage('Candidate not found.', 'error');
            document.querySelector('.loading-overlay').style.display = 'none';
            return;
        }
        
        // Increment votes for the selected candidate
        if (!updatedElection.candidates[candidateIndex].votes) {
            updatedElection.candidates[candidateIndex].votes = 0;
        }
        updatedElection.candidates[candidateIndex].votes++;
        
        // Add user to voters list if not already there
        if (!updatedElection.voters) {
            updatedElection.voters = [];
        }
        
        // Check again if user is already in voters list
        if (!updatedElection.voters.includes(currentUser.id)) {
            updatedElection.voters.push(currentUser.id);
            console.log("Added user to voters list:", {
                election: updatedElection.title,
                voters: updatedElection.voters,
                userId: currentUser.id
            });
        } else {
            console.log("User already in voters list - preventing duplicate vote");
        }
        
        // Save updated election data
        elections[electionIndex] = updatedElection;
        localStorage.setItem('elections', JSON.stringify(elections));
        
        // Hide loading overlay
        document.querySelector('.loading-overlay').style.display = 'none';
        
        // Show success message
        showMessage('Your vote has been cast successfully! Thank you for participating.', 'success');
        
        // Remove the vote form
        const candidatesContainer = document.getElementById('candidates-container');
        candidatesContainer.innerHTML = '';
        
        // Clear vote verification from session
        sessionStorage.removeItem('voteVerified');
        sessionStorage.removeItem('verificationTime');
        
        // Add buttons
        const buttonsDiv = document.createElement('div');
        buttonsDiv.className = 'form-buttons';
        
        // Add view voted elections button
        const viewVotedButton = document.createElement('a');
        viewVotedButton.href = 'dashboard.html';
        viewVotedButton.className = 'btn btn-success';
        viewVotedButton.innerHTML = '<i class="fas fa-check-circle"></i> View Voted Elections';
        viewVotedButton.addEventListener('click', (e) => {
            e.preventDefault();
            // Store instruction to show voted tab when page loads
            sessionStorage.setItem('showVotedTab', 'true');
            window.location.href = 'dashboard.html';
        });
        buttonsDiv.appendChild(viewVotedButton);
        
        candidatesContainer.appendChild(buttonsDiv);
        
        // If real-time results are enabled, show results
        if (updatedElection.settings && updatedElection.settings.realTimeResults) {
            loadAndDisplayResults(updatedElection);
        }
        
        // Automatically redirect to voted elections tab after 3 seconds
        setTimeout(() => {
            sessionStorage.setItem('showVotedTab', 'true');
            window.location.href = 'dashboard.html';
        }, 3000);
    }, 1500); // Simulate processing for 1.5 seconds
}

function loadAndDisplayResults(election) {
    // Create results container if it doesn't exist
    let resultsDiv = document.querySelector('.vote-card.results');
    
    if (!resultsDiv) {
        resultsDiv = document.createElement('div');
        resultsDiv.className = 'vote-card results';
        resultsDiv.innerHTML = `
            <h2><i class="fas fa-chart-bar"></i> Election Results</h2>
            <div id="results-container"></div>
        `;
        
        document.querySelector('.vote-container').appendChild(resultsDiv);
    }
    
    const resultsContainer = document.getElementById('results-container') || resultsDiv.querySelector('#results-container');
    resultsContainer.innerHTML = '';
    
    // Calculate total votes for percentage
    const totalVotes = election.candidates.reduce((sum, candidate) => sum + (candidate.votes || 0), 0);
    
    // Sort candidates by votes (descending)
    const sortedCandidates = [...election.candidates].sort((a, b) => (b.votes || 0) - (a.votes || 0));
    
    // Create candidate results HTML
    sortedCandidates.forEach(candidate => {
        const votes = candidate.votes || 0;
        const percent = totalVotes > 0 ? Math.round((votes / totalVotes) * 100) : 0;
        
        const candidateResult = document.createElement('div');
        candidateResult.className = 'candidate-result';
        candidateResult.innerHTML = `
            <div class="candidate-name">${candidate.name}</div>
            <div class="candidate-votes">${votes} votes (${percent}%)</div>
        `;
        
        const progressBar = document.createElement('div');
        progressBar.className = 'progress-bar';
        progressBar.innerHTML = `<div class="progress-fill" style="width: ${percent}%"></div>`;
        
        resultsContainer.appendChild(candidateResult);
        resultsContainer.appendChild(progressBar);
    });
    
    // Add total votes
    const totalVotesElement = document.createElement('p');
    totalVotesElement.className = 'total-votes';
    totalVotesElement.innerHTML = `<strong>Total votes cast:</strong> ${totalVotes}`;
    resultsContainer.appendChild(totalVotesElement);
}

function showMessage(message, type = 'info') {
    const resultElement = document.getElementById('vote-result');
    resultElement.innerHTML = message;
    resultElement.className = `alert alert-${type}`;
    resultElement.style.display = 'block';
    
    // Scroll to message
    resultElement.scrollIntoView({ behavior: 'smooth' });
} 