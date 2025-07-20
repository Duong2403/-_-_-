# UniMatch - Inter-University Group Matching Platform

## What is UniMatch?

UniMatch is a comprehensive web application designed to connect university groups from different schools for meaningful relationships, including friendships, study sessions, and romantic connections. The platform enables students to form groups with their classmates and discover compatible groups from other universities.

### Key Features

- **Group Formation**: Create teams with university classmates
- **Inter-University Matching**: Discover and connect with groups from other universities
- **Real-time Chat**: Communicate between groups with live messaging
- **Meeting Scheduling**: Plan and organize meetups between matched groups
- **Profile Management**: Comprehensive user profiles with MBTI, interests, and preferences
- **Review System**: Rate and review meetings with other groups
- **Photo Sharing**: Upload and share images in chats and profiles

### Technology Stack

- **Frontend**: React 18 + Vite + Socket.IO Client
- **Backend**: Node.js + Express + Socket.IO
- **Database**: MongoDB
- **File Storage**: Cloudinary (profiles) + Local storage (chat images)
- **Authentication**: JWT (JSON Web Tokens)
- **Email Service**: Nodemailer

## Prerequisites

Before running the application, ensure you have the following installed:

- **Node.js** (v16 or higher)
- **npm** (comes with Node.js)
- **MongoDB** (v4.4 or higher)
- **Git** (for cloning the repository)

## Installation & Setup

### 1. Clone the Repository

```bash
git clone <repository-url>
cd 유승훈_교수님
```

### 2. Environment Configuration

Create a `.env` file in the `unimatch/backend/` directory with the following variables:

```env
# Server Configuration
PORT=5000
NODE_ENV=development

# MongoDB Configuration
MONGO_URI=mongodb://localhost:27017/unimatch

# JWT Configuration
JWT_SECRET=your_jwt_secret_key_here

# Cloudinary Configuration (for image uploads)
CLOUDINARY_CLOUD_NAME=your_cloudinary_cloud_name
CLOUDINARY_API_KEY=your_cloudinary_api_key
CLOUDINARY_API_SECRET=your_cloudinary_api_secret

# Email Configuration (for notifications)
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_USER=your_email@gmail.com
EMAIL_PASS=your_email_app_password
```

### 3. Install Dependencies

#### Backend Dependencies
```bash
cd unimatch/backend
npm install
```

#### Frontend Dependencies
```bash
cd unimatch/frontend
npm install
```

## How to Run the Application

### 1. Start MongoDB Server

Open a terminal and run:
```bash
mongod --dbpath ./mongodb_data --port 27017
```

**Note**: Make sure the `mongodb_data` directory exists in your project root. If it doesn't exist, create it first.

### 2. Start the Backend Server

Open a new terminal window and run:
```bash
cd unimatch/backend
npm run dev
```

The backend server will start on `http://localhost:5000`

### 3. Start the Frontend Development Server

Open another terminal window and run:
```bash
cd unimatch/frontend
npm run dev
```

The frontend application will start on `http://localhost:3000`

### 4. Access the Application

Open your web browser and navigate to:
```
http://localhost:3000
```

## Application Structure

### Backend API Endpoints

- `POST /api/auth/register` - User registration
- `POST /api/auth/login` - User authentication
- `GET /api/users/me` - Get current user profile
- `PUT /api/users/profile` - Update user profile
- `GET /api/teams/my-teams` - Get user's teams
- `POST /api/teams` - Create new team
- `GET /api/teams/all-discoverable` - Get discoverable teams
- `POST /api/matches` - Create team match
- `GET /api/messages` - Get chat messages
- `POST /api/messages` - Send message
- `POST /api/meetings` - Schedule meeting
- `POST /api/reviews` - Submit review

### Frontend Routes

- `/` - Home page with application overview
- `/login` - User login
- `/register` - User registration
- `/dashboard` - User dashboard
- `/profile` - User profile management
- `/teams` - Team management
- `/matching` - Team discovery and matching
- `/chat` - Real-time messaging
- `/profile/:userId` - Public user profiles

## User Registration Requirements

- **Email**: Must end with `.ac.kr` or `.edu` (university email)
- **Age**: Must be between 19-29 years old
- **University**: Must select from the provided list
- **Password**: Minimum 6 characters

## Team Formation

1. **Create a Team**: Users can create teams with their classmates
2. **Team Composition**: Specify gender ratio (e.g., "3:3", "2:2")
3. **Team Preferences**: Set interests, meeting purposes, and availability
4. **Team Status**: Teams can be in "forming", "active", "matched", or "inactive" status

## Matching System

1. **Discovery**: Browse teams from other universities
2. **Compatibility**: View team preferences and interests
3. **Join Requests**: Send requests to join teams
4. **Matching**: Teams can accept/decline join requests
5. **Communication**: Matched teams can chat and schedule meetings

## Development Scripts

### Backend Scripts
```bash
npm run dev    # Start development server with nodemon
npm start      # Start production server
npm test       # Run tests (not implemented yet)
```

### Frontend Scripts
```bash
npm run dev    # Start development server
npm run build  # Build for production
npm run preview # Preview production build
npm run lint   # Run ESLint
```

## Troubleshooting

### Common Issues

1. **MongoDB Connection Error**
   - Ensure MongoDB is running on port 27017
   - Check if the `mongodb_data` directory exists
   - Verify MongoDB installation

2. **Port Already in Use**
   - Backend: Change PORT in `.env` file
   - Frontend: Vite will automatically use the next available port

3. **Environment Variables**
   - Ensure all required environment variables are set in `.env`
   - Restart the server after changing environment variables

4. **Dependencies Issues**
   - Delete `node_modules` and `package-lock.json`
   - Run `npm install` again

### Database Reset

To reset the database:
```bash
# Stop the application
# Delete the mongodb_data directory
rm -rf mongodb_data
# Create a new mongodb_data directory
mkdir mongodb_data
# Restart MongoDB and the application
```

## Production Deployment

For production deployment:

1. **Build the Frontend**:
   ```bash
   cd unimatch/frontend
   npm run build
   ```

2. **Set Production Environment Variables**:
   - Update `MONGO_URI` to production database
   - Set `NODE_ENV=production`
   - Configure production email and Cloudinary credentials

3. **Deploy Backend**:
   - Deploy to cloud platform (Heroku, AWS, etc.)
   - Set up production MongoDB instance
   - Configure environment variables

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly
5. Submit a pull request

## License

This project is licensed under the ISC License.

## Support

For support and questions, please contact the development team or create an issue in the repository.
