// Mobile Navigation Toggle
const hamburger = document.querySelector('.hamburger');
const navLinks = document.querySelector('.nav-links');

hamburger.addEventListener('click', () => {
    hamburger.classList.toggle('active');
    navLinks.classList.toggle('active');
});

// Close mobile menu when clicking on a nav link
document.querySelectorAll('.nav-links a').forEach(link => {
    link.addEventListener('click', () => {
        hamburger.classList.remove('active');
        navLinks.classList.remove('active');
    });
});

// Smooth scrolling for anchor links
document.querySelectorAll('a[href^="#"]').forEach(anchor => {
    anchor.addEventListener('click', function(e) {
        e.preventDefault();
        
        if (this.getAttribute('href') === '#') return;
        
        const targetId = this.getAttribute('href');
        const targetElement = document.querySelector(targetId);
        
        if (targetElement) {
            window.scrollTo({
                top: targetElement.offsetTop - 80,
                behavior: 'smooth'
            });
        }
    });
});

// Add fixed header on scroll
window.addEventListener('scroll', () => {
    const header = document.querySelector('header');
    if (window.scrollY > 50) {
        header.classList.add('scrolled');
    } else {
        header.classList.remove('scrolled');
    }
});

// Login and Register Button Event Listeners
document.querySelector('.login-btn')?.addEventListener('click', () => {
    // Redirect to login page
    window.location.href = 'login.html';
});

document.querySelector('.register-btn')?.addEventListener('click', () => {
    // Redirect to register page
    window.location.href = 'register.html';
});

// Vote Button Event Listeners
document.querySelectorAll('.vote-btn').forEach(button => {
    button.addEventListener('click', (e) => {
        // Check if user is logged in
        const currentUser = JSON.parse(sessionStorage.getItem('evote_current_user'));
        
        if (currentUser) {
            // If logged in, redirect to dashboard
            window.location.href = 'dashboard.html';
        } else {
            // If not logged in, redirect to login page
            window.location.href = 'login.html';
        }
    });
});

// Testimonial Carousel (can be expanded later)
let currentTestimonial = 0;
const testimonials = document.querySelectorAll('.testimonial-card');

function showTestimonial(index) {
    testimonials.forEach((testimonial, i) => {
        if (i === index) {
            testimonial.style.display = 'block';
        } else {
            testimonial.style.display = 'none';
        }
    });
}

// Initialize testimonials if they exist
if (testimonials.length > 1) {
    // Show first testimonial initially
    showTestimonial(currentTestimonial);
    
    // Auto-rotate testimonials every 5 seconds
    setInterval(() => {
        currentTestimonial = (currentTestimonial + 1) % testimonials.length;
        showTestimonial(currentTestimonial);
    }, 5000);
}

// Add animation on scroll
const animateOnScroll = () => {
    const elements = document.querySelectorAll('.feature-card, .election-card, .step, .testimonial-card');
    
    elements.forEach(element => {
        const elementPosition = element.getBoundingClientRect().top;
        const screenPosition = window.innerHeight / 1.3;
        
        if (elementPosition < screenPosition) {
            element.classList.add('animate');
        }
    });
};

// Add animation class to CSS
document.addEventListener('DOMContentLoaded', () => {
    // Add animation class to elements
    const style = document.createElement('style');
    style.textContent = `
        .feature-card, .election-card, .step, .testimonial-card {
            opacity: 0;
            transform: translateY(20px);
            transition: opacity 0.5s ease, transform 0.5s ease;
        }
        
        .feature-card.animate, .election-card.animate, .step.animate, .testimonial-card.animate {
            opacity: 1;
            transform: translateY(0);
        }
    `;
    document.head.appendChild(style);
    
    // Initial check for elements in view
    animateOnScroll();
    
    // Listen for scroll events
    window.addEventListener('scroll', animateOnScroll);
    
    // Check if user is already logged in
    const currentUser = JSON.parse(sessionStorage.getItem('evote_current_user'));
    if (currentUser) {
        // Update auth buttons to show dashboard link and logout
        const authButtons = document.querySelector('.auth-buttons');
        if (authButtons) {
            authButtons.innerHTML = `
                <a href="dashboard.html" class="btn dashboard-btn">Dashboard</a>
                <button id="logoutBtn" class="btn logout-btn">Logout</button>
            `;
            
            // Add logout functionality
            document.getElementById('logoutBtn')?.addEventListener('click', () => {
                sessionStorage.removeItem('evote_current_user');
                window.location.reload();
            });
        }
    }
});

// Current Year for Footer Copyright
document.addEventListener('DOMContentLoaded', () => {
    const yearElement = document.querySelector('.footer-bottom p');
    if (yearElement) {
        const currentYear = new Date().getFullYear();
        yearElement.innerHTML = yearElement.innerHTML.replace('2023', currentYear);
    }
});