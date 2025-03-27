// Initialize test data for the E-Voting System
function initializeTestData() {
    // Initialize users if not exists
    if (!localStorage.getItem('users')) {
        const users = [
            {
                id: 'student1',
                fullName: 'John Smith',
                email: 'john.smith@student.edu',
                studentId: '1MS22CS001',
                department: 'Computer Science',
                password: 'password123', // In a real app, this would be hashed
                voterType: 'student',
                registrationDate: '2023-01-15'
            },
            {
                id: 'student2',
                fullName: 'Emma Wilson',
                email: 'emma.wilson@student.edu',
                studentId: '1MS22CS002',
                department: 'Engineering',
                password: 'password123',
                voterType: 'student',
                registrationDate: '2023-02-10'
            },
            {
                id: 'student3',
                fullName: 'Michael Johnson',
                email: 'michael.johnson@student.edu',
                studentId: '1MS22CS003',
                department: 'Computer Science',
                password: 'password123',
                voterType: 'student',
                registrationDate: '2023-02-15'
            },
            {
                id: 'student4',
                fullName: 'Sophia Garcia',
                email: 'sophia.garcia@student.edu',
                studentId: '1MS22EC001',
                department: 'Electronics Engineering',
                password: 'password123',
                voterType: 'student',
                registrationDate: '2023-01-20'
            },
            {
                id: 'student5',
                fullName: 'Daniel Brown',
                email: 'daniel.brown@student.edu',
                studentId: '1MS22ME001',
                department: 'Mechanical Engineering',
                password: 'password123',
                voterType: 'student',
                registrationDate: '2023-03-05'
            },
            {
                id: 'staff1',
                fullName: 'Dr. Robert Davis',
                email: 'robert.davis@staff.edu',
                staffId: 'STAFF001',
                department: 'Computer Science',
                password: 'password123',
                voterType: 'staff',
                registrationDate: '2022-09-01'
            }
        ];
        localStorage.setItem('users', JSON.stringify(users));
    }

    // Initialize elections if not exists
    if (!localStorage.getItem('elections')) {
        const currentDate = new Date();
        const tomorrow = new Date(currentDate);
        tomorrow.setDate(currentDate.getDate() + 1);
        const yesterday = new Date(currentDate);
        yesterday.setDate(currentDate.getDate() - 1);
        const nextWeek = new Date(currentDate);
        nextWeek.setDate(currentDate.getDate() + 7);

        const elections = [
            {
                id: 'election1',
                title: 'Student Council President Election',
                description: 'Vote for your next Student Council President for the academic year 2025-2026',
                startDate: yesterday.toISOString().split('T')[0],
                endDate: tomorrow.toISOString().split('T')[0],
                status: 'active',
                eligibility: 'students',
                candidates: [
                    { id: 'c1', name: 'Sarah Johnson', position: 'President', votes: 45 },
                    { id: 'c2', name: 'Michael Chen', position: 'President', votes: 38 },
                    { id: 'c3', name: 'Emily Davis', position: 'President', votes: 42 }
                ],
                voters: [],
                settings: {
                    anonymousVoting: true,
                    publicResults: true,
                    realTimeResults: true
                },
                createdBy: 'staff1'
            },
            {
                id: 'election2',
                title: 'Department Representative Election',
                description: 'Choose your department representative for the student council',
                startDate: currentDate.toISOString().split('T')[0],
                endDate: nextWeek.toISOString().split('T')[0],
                status: 'active',
                eligibility: 'students',
                candidates: [
                    { id: 'c4', name: 'David Wilson', position: 'Representative', votes: 0 },
                    { id: 'c5', name: 'Lisa Anderson', position: 'Representative', votes: 0 }
                ],
                voters: [],
                settings: {
                    anonymousVoting: true,
                    publicResults: true,
                    realTimeResults: true
                },
                createdBy: 'staff1'
            },
            {
                id: 'election3',
                title: 'Authorized Users Only Election',
                description: 'This election is only for specific authorized students',
                startDate: currentDate.toISOString().split('T')[0],
                endDate: nextWeek.toISOString().split('T')[0],
                status: 'active',
                eligibility: 'authorized',
                authorizedUsers: ['1MS22CS001', '1MS22CS002'],
                candidates: [
                    { id: 'c6', name: 'James Taylor', position: 'Representative', votes: 0 },
                    { id: 'c7', name: 'Olivia Martinez', position: 'Representative', votes: 0 }
                ],
                voters: [],
                settings: {
                    anonymousVoting: true,
                    publicResults: true,
                    realTimeResults: true
                },
                createdBy: 'staff1'
            }
        ];
        localStorage.setItem('elections', JSON.stringify(elections));
    }
}

// Run initialization
initializeTestData();

// Log test credentials for easy access
console.log('Test Credentials:');
console.log('Student 1 - Email: john.smith@student.edu, Password: password123, USN: 1MS22CS001');
console.log('Student 2 - Email: emma.wilson@student.edu, Password: password123, USN: 1MS22CS002');
console.log('Student 3 - Email: michael.johnson@student.edu, Password: password123, USN: 1MS22CS003');
console.log('Student 4 - Email: sophia.garcia@student.edu, Password: password123, USN: 1MS22EC001');
console.log('Student 5 - Email: daniel.brown@student.edu, Password: password123, USN: 1MS22ME001');
console.log('Staff - Email: robert.davis@staff.edu, Password: password123');

// Sample CSV content for testing
console.log('\nSample CSV content for authorized users:');
console.log('1MS22CS001\n1MS22CS002\n1MS22CS003');
