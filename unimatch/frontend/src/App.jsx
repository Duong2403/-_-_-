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
  <div style={{
    textAlign: 'center',
    padding: '60px 20px', // Increased padding
    backgroundColor: '#f8f9fa',
    fontFamily: "'Arial', sans-serif" // Added font family
  }}>
    <h1 style={{
      color: '#007bff',
      marginBottom: '20px',
      fontSize: '2.5em' // Larger heading
    }}>Welcome to UniMatch</h1>
    <p style={{
      fontSize: '1.3em', // Slightly larger text
      color: '#555',
      marginBottom: '60px', // Increased margin
      maxWidth: '900px', // Max width for better readability
      margin: '0 auto 60px auto' // Center paragraph
    }}>
      The ultimate platform designed for university students to easily connect, form teams, and collaborate on projects, studies, and events.
    </p>

    {/* Section 1: What is UniMatch? */}
    <div style={{ margin: '60px auto', maxWidth: '1000px' }}> {/* Centered section */}
      <h2 style={{ color: '#343a40', marginBottom: '30px', fontSize: '2em' }}>What is UniMatch?</h2>
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}> {/* Flex container for text and image */}
        <p style={{ fontSize: '1.1em', color: '#666', maxWidth: '800px', margin: '0 auto 30px auto' }}>
          UniMatch simplifies the process of finding like-minded peers within your university. Whether you need teammates for a group project, study partners for an exam, or collaborators for an event, UniMatch helps you find the perfect match based on skills, interests, and availability.
        </p>
        {/* Placeholder for an illustrative image */}
        {/* <img src="/path/to/illustration1.png" alt="What is UniMatch Illustration" style={{ marginTop: '30px', maxWidth: '100%', height: 'auto' }} /> */}
        <div style={{
          marginTop: '30px',
          width: '100%', // Full width within container
          maxWidth: '700px', // Max width for image placeholder
          height: '300px', // Increased height
          backgroundColor: '#e9ecef',
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          color: '#6c757d',
          borderRadius: '8px' // Rounded corners
        }}>
          [Placeholder for Image: Illustration showing students connecting]
        </div>
      </div>
    </div>

    {/* Section 2: Key Features */}
    <div style={{ margin: '60px auto', maxWidth: '1200px' }}> {/* Centered section */}
      <h2 style={{ color: '#343a40', marginBottom: '40px', fontSize: '2em' }}>Key Features</h2>
      <div style={{ display: 'flex', justifyContent: 'center', flexWrap: 'wrap', gap: '30px' }}> {/* Added gap */}
        <div style={{
          width: '300px',
          padding: '30px', // Increased padding
          border: '1px solid #dee2e6',
          borderRadius: '8px',
          backgroundColor: '#fff',
          boxShadow: '0 4px 8px rgba(0,0,0,0.1)' // Added shadow
        }}>
          <h3 style={{ color: '#007bff', marginBottom: '20px', fontSize: '1.5em' }}>Team Creation & Management</h3>
          <p style={{ color: '#666', fontSize: '1.1em' }}>Easily create and manage teams for any purpose. Invite members, set team goals, and keep track of your progress.</p>
          {/* Placeholder for a feature icon/image */}
           {/* <img src="/path/to/icon-team.png" alt="Team Feature Icon" style={{ marginTop: '20px', width: '60px', height: '60px' }} /> */}
           <div style={{
             marginTop: '20px',
             width: '60px', // Larger icon placeholder
             height: '60px', // Larger icon placeholder
             backgroundColor: '#ced4da',
             margin: '20px auto 0',
             display: 'flex',
             justifyContent: 'center',
             alignItems: 'center',
             color: '#495057',
             borderRadius: '50%' // Circular icon placeholder
           }}>
             [Icon]
           </div>
        </div>
        <div style={{
          width: '300px',
          padding: '30px',
          border: '1px solid #dee2e6',
          borderRadius: '8px',
          backgroundColor: '#fff',
          boxShadow: '0 4px 8px rgba(0,0,0,0.1)'
        }}>
          <h3 style={{ color: '#007bff', marginBottom: '20px', fontSize: '1.5em' }}>Smart Matching</h3>
          <p style={{ color: '#666', fontSize: '1.1em' }}>Our intelligent algorithm helps you find the best potential matches based on your team's needs and other users' profiles.</p>
           {/* Placeholder for a feature icon/image */}
           {/* <img src="/path/to/icon-match.png" alt="Matching Feature Icon" style={{ marginTop: '20px', width: '60px', height: '60px' }} /> */}
            <div style={{
             marginTop: '20px',
             width: '60px',
             height: '60px',
             backgroundColor: '#ced4da',
             margin: '20px auto 0',
             display: 'flex',
             justifyContent: 'center',
             alignItems: 'center',
             color: '#495057',
             borderRadius: '50%'
           }}>
             [Icon]
           </div>
        </div>
        <div style={{
          width: '300px',
          padding: '30px',
          border: '1px solid #dee2e6',
          borderRadius: '8px',
          backgroundColor: '#fff',
          boxShadow: '0 4px 8px rgba(0,0,0,0.1)'
        }}>
          <h3 style={{ color: '#007bff', marginBottom: '20px', fontSize: '1.5em' }}>Integrated Communication</h3>
          <p style={{ color: '#666', fontSize: '1.1em' }}>Communicate seamlessly with your team and matched teams through our built-in chat and meeting scheduling features.</p>
           {/* Placeholder for a feature icon/image */}
           {/* <img src="/path/to/icon-chat.png" alt="Communication Feature Icon" style={{ marginTop: '20px', width: '60px', height: '60px' }} /> */}
            <div style={{
             marginTop: '20px',
             width: '60px',
             height: '60px',
             backgroundColor: '#ced4da',
             margin: '20px auto 0',
             display: 'flex',
             justifyContent: 'center',
             alignItems: 'center',
             color: '#495057',
             borderRadius: '50%'
           }}>
             [Icon]
           </div>
        </div>
      </div>
    </div>

    {/* Section 3: How it Works */}
     <div style={{ margin: '60px auto', maxWidth: '1000px' }}> {/* Centered section */}
      <h2 style={{ color: '#343a40', marginBottom: '40px', fontSize: '2em' }}>How it Works</h2>
      <div style={{ display: 'flex', justifyContent: 'center', flexWrap: 'wrap', alignItems: 'center', gap: '20px' }}> {/* Added gap */}
        <div style={{ width: '250px', margin: '10px', textAlign: 'left' }}> {/* Adjusted margin */}
          <h4 style={{ color: '#007bff', marginBottom: '10px', fontSize: '1.3em' }}>1. Create Your Profile</h4>
          <p style={{ color: '#666', fontSize: '1em' }}>Sign up with your school email and build a profile highlighting your skills and interests.</p>
        </div>
         {/* Placeholder for an arrow or connecting line image */}
         {/* <img src="/path/to/arrow.png" alt="Step Arrow" style={{ width: '50px', height: 'auto' }} /> */}
         <div style={{
           width: '50px',
           height: '20px',
           backgroundColor: '#adb5bd',
           margin: '0 10px',
           display: 'flex',
           justifyContent: 'center',
           alignItems: 'center',
           color: '#495057',
           fontWeight: 'bold' // Bold arrow
         }}>
             {`->`} {/* Simplified arrow */}
           </div>
        <div style={{ width: '250px', margin: '10px', textAlign: 'left' }}>
          <h4 style={{ color: '#007bff', marginBottom: '10px', fontSize: '1.3em' }}>2. Form or Join a Team</h4>
          <p style={{ color: '#666', fontSize: '1em' }}>Create a new team for your project or browse existing teams to join.</p>
        </div>
         {/* Placeholder for an arrow or connecting line image */}
         {/* <img src="/path/to/arrow.png" alt="Step Arrow" style={{ width: '50px', height: 'auto' }} /> */}
         <div style={{
           width: '50px',
           height: '20px',
           backgroundColor: '#adb5bd',
           margin: '0 10px',
           display: 'flex',
           justifyContent: 'center',
           alignItems: 'center',
           color: '#495057',
           fontWeight: 'bold'
         }}>
             {`->`}
           </div>
        <div style={{ width: '250px', margin: '10px', textAlign: 'left' }}>
          <h4 style={{ color: '#007bff', marginBottom: '10px', fontSize: '1.3em' }}>3. Find Your Match</h4>
          <p style={{ color: '#666', fontSize: '1em' }}>Use our matching feature to connect with other teams or individuals.</p>
        </div>
         {/* Placeholder for an arrow or connecting line image */}
         {/* <img src="/path/to/arrow.png" alt="Step Arrow" style={{ width: '50px', height: 'auto' }} /> */}
         <div style={{
           width: '50px',
           height: '20px',
           backgroundColor: '#adb5bd',
           margin: '0 10px',
           display: 'flex',
           justifyContent: 'center',
           alignItems: 'center',
           color: '#495057',
           fontWeight: 'bold'
         }}>
             {`->`}
           </div>
         <div style={{ width: '250px', margin: '10px', textAlign: 'left' }}>
          <h4 style={{ color: '#007bff', marginBottom: '10px', fontSize: '1.3em' }}>4. Collaborate & Succeed</h4>
          <p style={{ color: '#666', fontSize: '1em' }}>Utilize chat and meeting tools to work together effectively and achieve your goals.</p>
        </div>
      </div>
       {/* Placeholder for an illustrative image summarizing the process */}
      {/* <img src="/path/to/process-illustration.png" alt="How it Works Illustration" style={{ marginTop: '40px', maxWidth: '100%', height: 'auto' }} /> */}
       <div style={{
         marginTop: '40px',
         width: '100%',
         maxWidth: '800px', // Max width for process illustration
         height: '350px', // Increased height
         backgroundColor: '#e9ecef',
         display: 'flex',
         justifyContent: 'center',
         alignItems: 'center',
         color: '#6c757d',
         borderRadius: '8px'
       }}>
        [Placeholder for Image: Illustration showing the step-by-step process]
      </div>
    </div>

    {/* Call to Action */}
    <div style={{
      marginTop: '80px', // Increased margin
      padding: '40px', // Increased padding
      backgroundColor: '#007bff',
      color: '#fff',
      borderRadius: '8px',
      maxWidth: '800px', // Max width for CTA
      margin: '80px auto 0 auto' // Center CTA
    }}>
      <h2 style={{ color: '#fff', marginBottom: '20px', fontSize: '2em' }}>Ready to Connect?</h2>
      <p style={{ fontSize: '1.3em', marginBottom: '40px' }}>Join UniMatch today and find the perfect team for your next university endeavor!</p>
      {/* Add buttons for Login and Register */}
      <Link to="/register" style={{ textDecoration: 'none', marginRight: '20px' }}>
        <button style={{
          padding: '12px 30px', // Increased padding
          fontSize: '1.1em', // Slightly larger text
          color: '#007bff',
          backgroundColor: '#fff',
          border: 'none',
          borderRadius: '5px',
          cursor: 'pointer',
          transition: 'background-color 0.3s ease' // Added transition
        }} onMouseOver={(e) => e.target.style.backgroundColor = '#e9ecef'} onMouseOut={(e) => e.target.style.backgroundColor = '#fff'}>
          Sign Up Now
        </button>
      </Link>
      <Link to="/login" style={{ textDecoration: 'none' }}>
         <button style={{
           padding: '12px 30px',
           fontSize: '1.1em',
           color: '#fff',
           backgroundColor: 'transparent',
           border: '2px solid #fff',
           borderRadius: '5px',
           cursor: 'pointer',
           transition: 'background-color 0.3s ease, color 0.3s ease' // Added transition
         }} onMouseOver={(e) => { e.target.style.backgroundColor = '#fff'; e.target.style.color = '#007bff'; }} onMouseOut={(e) => { e.target.style.backgroundColor = 'transparent'; e.target.style.color = '#fff'; }}>
          Login
        </button>
      </Link>
    </div>

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
