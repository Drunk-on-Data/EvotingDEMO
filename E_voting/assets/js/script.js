// Main JavaScript for E-Voting Website

document.addEventListener('DOMContentLoaded', () => {
    // Mobile menu toggle
    const hamburger = document.querySelector('.hamburger');
    const navLinks = document.querySelector('.nav-links');
    
    if (hamburger) {
        hamburger.addEventListener('click', () => {
            hamburger.classList.toggle('active');
            navLinks.classList.toggle('active');
        });
    }
    
    // Close mobile menu when a link is clicked
    const navItems = document.querySelectorAll('.nav-links a');
    navItems.forEach(item => {
        item.addEventListener('click', () => {
            if (hamburger.classList.contains('active')) {
                hamburger.classList.remove('active');
                navLinks.classList.remove('active');
            }
        });
    });
    
    // Smooth scrolling for navigation links
    document.querySelectorAll('a[href^="#"]').forEach(anchor => {
        anchor.addEventListener('click', function(e) {
            const targetId = this.getAttribute('href');
            if (targetId === '#') return;
            
            const targetElement = document.querySelector(targetId);
            if (targetElement) {
                e.preventDefault();
                window.scrollTo({
                    top: targetElement.offsetTop - 80, // Offset for header
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
            const currentUser = JSON.parse(sessionStorage.getItem('currentUser'));
            
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
    const currentUser = JSON.parse(sessionStorage.getItem('currentUser'));
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
                sessionStorage.removeItem('currentUser');
                window.location.reload();
            });
        }
    }
    
    // Initialize users in localStorage if it doesn't exist
    if (!localStorage.getItem('users')) {
        // Create default admin account
        const defaultUsers = [
            {
                id: 'admin123',
                fullName: 'Admin User',
                email: 'admin@evoting.com',
                password: 'admin123', // In a real app, this would be hashed
                type: 'admin',
                registrationDate: new Date().toISOString()
            },
            {
                id: 'voter123',
                fullName: 'Test Voter',
                email: 'voter@evoting.com',
                password: 'voter123', // In a real app, this would be hashed
                type: 'voter',
                voterType: 'student',
                registrationDate: new Date().toISOString()
            }
        ];
        localStorage.setItem('users', JSON.stringify(defaultUsers));
    }

    // Contact form submission
    const contactForm = document.getElementById('contactForm');
    if (contactForm) {
        contactForm.addEventListener('submit', function(e) {
            e.preventDefault();
            
            // Get form values
            const name = document.getElementById('name').value.trim();
            const email = document.getElementById('email').value.trim();
            const subject = document.getElementById('subject').value.trim();
            const message = document.getElementById('message').value.trim();
            
            // Simple validation
            if (!name || !email || !subject || !message) {
                alert('Please fill in all fields');
                return;
            }
            
            // Email validation
            const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
            if (!emailRegex.test(email)) {
                alert('Please enter a valid email address');
                return;
            }
            
            // In a real application, you would send this data to a server
            // For now, we'll just show a success message
            alert('Thank you for your message! We will get back to you soon.');
            contactForm.reset();
        });
    }

    // Add active class to nav links based on scroll position
    window.addEventListener('scroll', () => {
        const sections = document.querySelectorAll('section[id]');
        const scrollPosition = window.scrollY;
        
        sections.forEach(section => {
            const sectionTop = section.offsetTop - 100;
            const sectionHeight = section.offsetHeight;
            const sectionId = section.getAttribute('id');
            
            if (scrollPosition >= sectionTop && scrollPosition < sectionTop + sectionHeight) {
                document.querySelector(`.nav-links a[href="#${sectionId}"]`)?.classList.add('active');
            } else {
                document.querySelector(`.nav-links a[href="#${sectionId}"]`)?.classList.remove('active');
            }
        });
    });

    // Current Year for Footer Copyright
    const yearElement = document.querySelector('.footer-bottom p');
    if (yearElement) {
        const currentYear = new Date().getFullYear();
        yearElement.innerHTML = yearElement.innerHTML.replace('2023', currentYear);
    }
}); 