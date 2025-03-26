# E-Voting Website

A secure and user-friendly electronic voting platform built with HTML, CSS, and JavaScript.

## Features

- **Responsive Design**: Works seamlessly on desktop, tablet, and mobile devices
- **Modern UI**: Clean and intuitive user interface for easy navigation
- **Secure Voting**: Built with security in mind
- **Real-time Results**: View election results as they come in
- **User Authentication**: Secure login and registration system
- **User Management**: Admin panel for managing users
- **Static Deployment**: Works without any server implementation

## Project Structure

```
E-voting/
├── assets/               # Static assets
│   ├── css/              # CSS stylesheets
│   ├── js/               # JavaScript files
│   └── images/           # Image assets
├── index.html            # Main landing page
├── login.html            # Login page
├── register.html         # Registration page
├── dashboard.html        # User dashboard
├── vote.html             # Voting page
├── manage-elections.html # Election management
├── clear-database.html   # Utility for clearing test data
└── README.md             # Project documentation
```

## Technologies Used

- HTML5
- CSS3
- JavaScript (ES6+)
- Font Awesome (for icons)
- LocalStorage (for client-side database)

## How to Run

1. Simply open the `index.html` file in any modern web browser
2. No server or installation required
3. Navigate through the website

## Login Credentials

For testing purposes, you can use the following credentials:

- **Admin**: User ID: `ADMIN123`, Password: `admin123`
- **Student**: User ID: `1MS22CS001`, Password: `student123`
- **Staff**: User ID: `STAFF001`, Password: `staff123`

## Database Information

The application uses browser's localStorage as a client-side database for demonstration purposes:

- User data, elections, and votes are stored in your browser's localStorage
- Data persists between sessions until you clear your browser data
- The clear-database.html page can be used to reset all data

## Browser Compatibility

- Chrome (latest)
- Firefox (latest)
- Safari (latest)
- Edge (latest)

## Future Enhancements

- Backend integration with Node.js/Express
- Database integration for storing user data and votes
- Two-factor authentication for enhanced security
- Blockchain technology for vote verification
- Advanced admin panel for election management
- Email verification for new registrations

## License

This project is licensed under the MIT License - see the LICENSE file for details.

## Acknowledgments

- Font Awesome for the icons
- Google Fonts for typography

---

**Note**: This is a front-end prototype. The user management functionality uses localStorage for demonstration purposes. In a production environment, a proper backend database would be implemented.