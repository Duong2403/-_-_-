import React from 'react';
import { BrowserRouter as Router, Routes, Route, Link } from 'react-router-dom';
import { useAuth } from './context/AuthContext'; // Import useAuth
import ErrorBoundary from './components/ErrorBoundary';
import { ToastProvider } from './components/Toast';

// Page Components
import LoginPage from './components/Login'; // Using component directly for now
import RegisterPage from './components/Register'; // Using component directly for now
import DashboardPage from './pages/DashboardPage';
import ProfilePage from './pages/ProfilePage';
import TeamsPage from './pages/TeamsPage';
import TeamsPageModern from './pages/TeamsPageModern'; // Import the enhanced teams page
import TeamDetailPage from './pages/TeamDetailPage'; // Import the new page
import MatchingPage from './pages/MatchingPage';
import ChatPage from './pages/ChatPage';
import PublicProfilePage from './pages/PublicProfilePage'; // Import the new page

// Helper Components
import ProtectedRoute from './components/ProtectedRoute';
import Navbar from './components/Navbar'; // Let's create a Navbar component

import { 
  UniversityIcon,
  GroupsIcon,
  CoupleIcon,
  DateIcon,
  CoffeeIcon,
  SparkIcon
} from './components/ui/SocialIcons';
import { 
  ArrowRightIcon,
  StarIcon,
  ChatIcon
} from './components/ui/Icons';

// Modern Scientific Home component
const HomePage = () => (
  <div className="bg-neutral-50 min-h-screen">
    {/* Hero Section */}
    <section className="section-lg bg-gradient text-white overflow-hidden relative">
      <div className="absolute inset-0 bg-black bg-opacity-10"></div>
      <div className="container relative z-10">
        <div className="text-center animate-fade-in">
          <div className="flex justify-center mb-6">
            <div className="flex items-center gap-4 bg-white bg-opacity-20 rounded-full px-6 py-3 backdrop-blur-sm">
              <DateIcon className="text-white" size={32} />
              <span className="text-xl font-semibold">Inter-University Connection Platform</span>
            </div>
          </div>
          <h1 className="text-6xl font-bold mb-6 font-family-heading">
            Welcome to <span className="text-yellow-300">UniMatch</span>
          </h1>
          <p className="text-xl text-white text-opacity-90 mb-8 max-w-4xl mx-auto leading-relaxed">
            Connect university groups across different schools! Create groups with your classmates 
            and meet amazing groups from other universities for friendships, study sessions, and romantic connections.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
            <Link to="/register" className="btn btn-lg bg-white text-primary-rose hover:bg-neutral-100 transition-all duration-300 transform hover:scale-105">
              <SparkIcon className="mr-2" size={20} />
              Find Your Match
            </Link>
            <Link to="/login" className="btn btn-lg btn-outline border-white text-white hover:bg-white hover:text-primary-rose">
              <ArrowRightIcon className="mr-2" size={20} />
              Sign In
            </Link>
          </div>
        </div>
      </div>
    </section>

    {/* What is UniMatch Section */}
    <section className="section bg-white">
      <div className="container">
        <div className="text-center mb-16 animate-slide-up">
          <div className="flex justify-center mb-4">
            <UniversityIcon className="text-primary-rose" size={48} />
          </div>
          <h2 className="text-4xl font-bold text-neutral-800 mb-6 font-family-heading">
            What is <span className="text-gradient">UniMatch</span>?
          </h2>
          <p className="text-lg text-neutral-600 max-w-4xl mx-auto leading-relaxed">
            UniMatch connects university groups from different schools for meaningful relationships! 
            Form groups with your classmates, then discover and meet groups from other universities. 
            Whether you're looking for study partners, new friendships, or that special someone - we help you connect!
          </p>
        </div>
        <div className="bg-gradient-love rounded-2xl p-8 text-white text-center animate-bounce-in">
          <div className="flex justify-center mb-6">
            <div className="grid grid-3 gap-8 max-w-2xl">
              <div className="flex flex-col items-center">
                <GroupsIcon className="text-white mb-2" size={32} />
                <span className="font-semibold">15,000+</span>
                <span className="text-sm opacity-90">Students</span>
              </div>
              <div className="flex flex-col items-center">
                <UniversityIcon className="text-white mb-2" size={32} />
                <span className="font-semibold">200+</span>
                <span className="text-sm opacity-90">Universities</span>
              </div>
              <div className="flex flex-col items-center">
                <DateIcon className="text-white mb-2" size={32} />
                <span className="font-semibold">25,000+</span>
                <span className="text-sm opacity-90">Successful Matches</span>
              </div>
            </div>
          </div>
          <p className="text-lg opacity-90">
            Join thousands of students finding friends and love across university boundaries! 💕
          </p>
        </div>
      </div>
    </section>

    {/* Key Features Section */}
    <section className="section bg-neutral-50">
      <div className="container">
        <div className="text-center mb-16 animate-slide-up">
          <h2 className="text-4xl font-bold text-neutral-800 mb-6 font-family-heading">
            Features for <span className="text-gradient">Meaningful Connections</span>
          </h2>
          <p className="text-lg text-neutral-600 max-w-3xl mx-auto">
            Everything you need to create groups, meet other university groups, and build lasting relationships
          </p>
        </div>
        <div className="grid grid-3 gap-8 animate-bounce-in">
          <div className="card hover:shadow-2xl transition-all duration-300">
            <div className="card-body text-center">
              <div className="flex justify-center mb-6">
                <div className="bg-gradient rounded-full p-4">
                  <GroupsIcon className="text-white" size={32} />
                </div>
              </div>
              <h3 className="text-xl font-semibold text-neutral-800 mb-4">Group Formation</h3>
              <p className="text-neutral-600 leading-relaxed">
                Create groups with your university friends and showcase your collective interests, 
                personalities, and what you're looking for in other groups.
              </p>
              <div className="mt-6">
                <span className="badge badge-primary">Team Building</span>
                <span className="badge badge-outline ml-2">Friendship</span>
              </div>
            </div>
          </div>
          <div className="card hover:shadow-2xl transition-all duration-300">
            <div className="card-body text-center">
              <div className="flex justify-center mb-6">
                <div className="bg-gradient-love rounded-full p-4">
                  <UniversityIcon className="text-white" size={32} />
                </div>
              </div>
              <h3 className="text-xl font-semibold text-neutral-800 mb-4">Inter-University Matching</h3>
              <p className="text-neutral-600 leading-relaxed">
                Discover and connect with groups from other universities based on shared interests, 
                compatibility, and relationship goals.
              </p>
              <div className="mt-6">
                <span className="badge badge-success">Cross-Campus</span>
                <span className="badge badge-outline ml-2">Smart Matching</span>
              </div>
            </div>
          </div>
          <div className="card hover:shadow-2xl transition-all duration-300">
            <div className="card-body text-center">
              <div className="flex justify-center mb-6">
                <div className="bg-gradient-friendship rounded-full p-4">
                  <ChatIcon className="text-white" size={32} />
                </div>
              </div>
              <h3 className="text-xl font-semibold text-neutral-800 mb-4">Group Communication</h3>
              <p className="text-neutral-600 leading-relaxed">
                Chat between groups, plan meetups, schedule dates, and get to know each other 
                in a fun, safe environment.
              </p>
              <div className="mt-6">
                <span className="badge badge-warning">Group Chat</span>
                <span className="badge badge-outline ml-2">Meetup Planning</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>

    {/* How it Works Section */}
    <section className="section bg-white">
      <div className="container">
        <div className="text-center mb-16 animate-slide-up">
          <h2 className="text-4xl font-bold text-neutral-800 mb-6 font-family-heading">
            How It <span className="text-gradient">Works</span>
          </h2>
          <p className="text-lg text-neutral-600 max-w-3xl mx-auto">
            Get started in minutes and connect with groups from other universities for friendship and romance
          </p>
        </div>
        <div className="grid grid-4 gap-8 mb-16 animate-bounce-in">
          <div className="text-center">
            <div className="flex justify-center mb-4">
              <div className="bg-gradient rounded-full p-6 relative">
                <UniversityIcon className="text-white" size={32} />
                <div className="absolute -top-2 -right-2 bg-accent-peach text-white rounded-full w-8 h-8 flex items-center justify-center text-sm font-bold">
                  1
                </div>
              </div>
            </div>
            <h3 className="text-lg font-semibold text-neutral-800 mb-3">Join Your University</h3>
            <p className="text-neutral-600 text-sm leading-relaxed">
              Sign up with your university email and create your personal profile with interests, photos, and what you're looking for.
            </p>
          </div>
          <div className="text-center">
            <div className="flex justify-center mb-4">
              <div className="bg-gradient-friendship rounded-full p-6 relative">
                <GroupsIcon className="text-white" size={32} />
                <div className="absolute -top-2 -right-2 bg-accent-peach text-white rounded-full w-8 h-8 flex items-center justify-center text-sm font-bold">
                  2
                </div>
              </div>
            </div>
            <h3 className="text-lg font-semibold text-neutral-800 mb-3">Form Your Group</h3>
            <p className="text-neutral-600 text-sm leading-relaxed">
              Create a group with your university friends (2-6 people) and set your group's interests and relationship goals.
            </p>
          </div>
          <div className="text-center">
            <div className="flex justify-center mb-4">
              <div className="bg-gradient-love rounded-full p-6 relative">
                <SparkIcon className="text-white" size={32} />
                <div className="absolute -top-2 -right-2 bg-accent-peach text-white rounded-full w-8 h-8 flex items-center justify-center text-sm font-bold">
                  3
                </div>
              </div>
            </div>
            <h3 className="text-lg font-semibold text-neutral-800 mb-3">Discover Matches</h3>
            <p className="text-neutral-600 text-sm leading-relaxed">
              Browse and match with groups from other universities based on shared interests, compatibility, and goals.
            </p>
          </div>
          <div className="text-center">
            <div className="flex justify-center mb-4">
              <div className="bg-gradient-accent rounded-full p-6 relative">
                <CoffeeIcon className="text-white" size={32} />
                <div className="absolute -top-2 -right-2 bg-accent-peach text-white rounded-full w-8 h-8 flex items-center justify-center text-sm font-bold">
                  4
                </div>
              </div>
            </div>
            <h3 className="text-lg font-semibold text-neutral-800 mb-3">Meet & Connect</h3>
            <p className="text-neutral-600 text-sm leading-relaxed">
              Chat with matched groups, plan meetups, and build lasting friendships or romantic relationships across universities.
            </p>
          </div>
        </div>
        <div className="bg-gradient-love rounded-2xl p-8 text-white text-center">
          <div className="flex justify-center mb-4">
            <DateIcon className="text-white" size={48} />
          </div>
          <h3 className="text-2xl font-bold mb-4">Ready to find your perfect group match? 💕</h3>
          <p className="text-lg opacity-90 mb-6">
            Join thousands of students who are already finding amazing friends and romantic connections across universities!
          </p>
          <div className="flex justify-center">
            <StarIcon className="text-yellow-300 mr-1" size={20} filled />
            <StarIcon className="text-yellow-300 mr-1" size={20} filled />
            <StarIcon className="text-yellow-300 mr-1" size={20} filled />
            <StarIcon className="text-yellow-300 mr-1" size={20} filled />
            <StarIcon className="text-yellow-300 mr-4" size={20} filled />
            <span className="text-sm opacity-90">4.8/5 from 5,000+ happy students</span>
          </div>
        </div>
      </div>
    </section>

    {/* Call to Action */}
    <section className="section-lg bg-gradient text-white text-center">
      <div className="container">
        <div className="animate-fade-in">
          <h2 className="text-4xl font-bold mb-6 font-family-heading">
            Ready to <span className="text-yellow-300">Find Love & Friendship</span>?
          </h2>
          <p className="text-xl mb-8 max-w-3xl mx-auto opacity-90">
            Join UniMatch today and connect with amazing groups from other universities for friendship, dating, and unforgettable experiences!
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
            <Link to="/register" className="btn btn-lg bg-white text-primary-rose hover:bg-neutral-100 transition-all duration-300 transform hover:scale-105">
              <SparkIcon className="mr-2" size={20} />
              Sign Up Now - It's Free
            </Link>
            <Link to="/login" className="btn btn-lg btn-outline border-white text-white hover:bg-white hover:text-primary-rose">
              <ArrowRightIcon className="mr-2" size={20} />
              Already have an account?
            </Link>
          </div>
          <p className="text-sm opacity-75 mt-4">
            💕 Join 15,000+ students • 🏫 200+ universities • ✨ Free forever
          </p>
        </div>
      </div>
    </section>

  </div>
);


function App() {
  const { loading } = useAuth(); // Get loading state

  // Avoid rendering routes until auth state is loaded
  if (loading) {
      return (
        <div className="min-h-screen bg-neutral-50 flex items-center justify-center">
          <div className="text-center">
            <div className="animate-spin w-8 h-8 border-2 border-primary-rose border-t-transparent rounded-full mx-auto mb-4"></div>
            <p className="text-neutral-600">Loading Application...</p>
          </div>
        </div>
      );
  }

  return (
    <ErrorBoundary>
      <ToastProvider>
        <Router>
          <Navbar />
          <main>
            <Routes>
              {/* Public Routes */}
              <Route path="/" element={<HomePage />} />
              <Route path="/login" element={<LoginPage />} />
              <Route path="/register" element={<RegisterPage />} />

              {/* Protected Routes */}
              <Route element={<ProtectedRoute />}>
                <Route path="/dashboard" element={<DashboardPage />} />
                <Route path="/profile" element={<ProfilePage />} />
                <Route path="/teams" element={<TeamsPageModern />} />
                <Route path="/teams-modern" element={<TeamsPageModern />} /> {/* Alternative route for enhanced teams page */}
                <Route path="/teams/:teamId" element={<TeamDetailPage />} /> {/* Add route for team detail */}
                <Route path="/matching" element={<MatchingPage />} />
                <Route path="/chat" element={<ChatPage />} />
                <Route path="/users/:userId" element={<PublicProfilePage />} /> {/* Add route for public profile */}
                {/* Add more protected routes here */}
              </Route>

              {/* Optional: Add a 404 Not Found Route */}
              <Route path="*" element={
                <div className="min-h-screen bg-neutral-50 flex items-center justify-center">
                  <div className="text-center">
                    <h2 className="text-2xl font-semibold text-neutral-800 mb-4">404 Not Found</h2>
                    <Link to="/" className="btn btn-primary">Go Home</Link>
                  </div>
                </div>
              } />
            </Routes>
          </main>
        </Router>
      </ToastProvider>
    </ErrorBoundary>
  );
}

export default App;
