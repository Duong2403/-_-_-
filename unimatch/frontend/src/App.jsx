import React from 'react';
import { BrowserRouter as Router, Routes, Route, Link } from 'react-router-dom';
import { useAuth } from './context/AuthContext'; // Import useAuth

// Page Components
import LoginPage from './components/Login'; // Using component directly for now
import RegisterPage from './components/Register'; // Using component directly for now
import DashboardPage from './pages/DashboardPage';
import ProfilePage from './pages/ProfilePage';
import TeamsPage from './pages/TeamsPage';
import TeamDetailPage from './pages/TeamDetailPage'; // Import the new page
import MatchingPage from './pages/MatchingPage';
import ChatPage from './pages/ChatPage';
import PublicProfilePage from './pages/PublicProfilePage'; // Import the new page

// Helper Components
import ProtectedRoute from './components/ProtectedRoute';
import Navbar from './components/Navbar'; // Let's create a Navbar component

// Simple Home component for the root path
const HomePage = () => (
  <div>
    <h1>Welcome to UniMatch</h1>
    <p>The platform for university students to connect and form teams!</p>
    {/* Add more marketing/info content here */}
  </div>
);


function App() {
  const { loading } = useAuth(); // Get loading state

  // Avoid rendering routes until auth state is loaded
  if (loading) {
      return <div>Loading Application...</div>;
  }

  return (
    <Router>
      <Navbar /> {/* Add Navbar */}
      <div style={{ padding: '20px' }}> {/* Add some padding */}
        <Routes>
          {/* Public Routes */}
          <Route path="/" element={<HomePage />} />
          <Route path="/login" element={<LoginPage />} />
          <Route path="/register" element={<RegisterPage />} />

          {/* Protected Routes */}
          <Route element={<ProtectedRoute />}>
            <Route path="/dashboard" element={<DashboardPage />} />
            <Route path="/profile" element={<ProfilePage />} />
            <Route path="/teams" element={<TeamsPage />} />
            <Route path="/teams/:teamId" element={<TeamDetailPage />} /> {/* Add route for team detail */}
            <Route path="/matching" element={<MatchingPage />} />
            <Route path="/chat" element={<ChatPage />} />
            <Route path="/users/:userId" element={<PublicProfilePage />} /> {/* Add route for public profile */}
            {/* Add more protected routes here */}
          </Route>

          {/* Optional: Add a 404 Not Found Route */}
          <Route path="*" element={<div><h2>404 Not Found</h2><Link to="/">Go Home</Link></div>} />
        </Routes>
      </div>
    </Router>
  );
}

export default App;
