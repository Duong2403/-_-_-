import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const Navbar = () => {
  const { isAuthenticated, user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login'); // Redirect to login after logout
  };

  return (
    <nav className="navbar">
      <div className="container navbar-container"> {/* Use container for centering */}
        <Link to="/" className="navbar-brand">UniMatch</Link>
        <ul className="navbar-nav">
          {isAuthenticated ? (
            <>
              <li><Link to="/dashboard" className="nav-link">Dashboard</Link></li>
              <li><Link to="/teams" className="nav-link">Teams</Link></li>
              <li><Link to="/matching" className="nav-link">Matching</Link></li>
              <li><Link to="/chat" className="nav-link">Chat</Link></li>
              <li><Link to="/profile" className="nav-link">Profile ({user?.name})</Link></li>
              <li><button onClick={handleLogout} className="nav-button">Logout</button></li>
            </>
          ) : (
            // Links to show when not authenticated
            <>
              <li><Link to="/login" className="nav-link">Login</Link></li>
              <li><Link to="/register" className="nav-link">Register</Link></li>
            </>
          )}
        </ul>
      </div>
    </nav>
  );
};

export default Navbar;
