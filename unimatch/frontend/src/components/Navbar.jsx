import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { 
  GroupsIcon, 
  CoupleIcon, 
  DateIcon,
  SparkIcon
} from './ui/SocialIcons';
import { 
  ChatIcon, 
  TeamIcon 
} from './ui/Icons';

const Navbar = () => {
  const { isAuthenticated, user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <nav className="bg-white shadow-lg border-b border-neutral-200 sticky top-0 z-50">
      <div className="container">
        <div className="flex justify-between items-center py-4">
          {/* Brand */}
          <Link to="/" className="flex items-center gap-3 text-decoration-none">
            <div className="bg-gradient rounded-lg p-2">
              <DateIcon className="text-white" size={24} />
            </div>
            <span className="text-2xl font-bold text-gradient font-family-heading">
              UniMatch
            </span>
          </Link>

          {/* Navigation Links */}
          <div className="flex items-center gap-6">
            {isAuthenticated ? (
              <>
                <Link to="/dashboard" className="flex items-center gap-2 text-neutral-600 hover:text-primary-rose transition-colors">
                  <TeamIcon size={18} />
                  <span className="font-medium">Dashboard</span>
                </Link>
                <Link to="/teams" className="flex items-center gap-2 text-neutral-600 hover:text-primary-rose transition-colors">
                  <GroupsIcon size={18} />
                  <span className="font-medium">Groups</span>
                </Link>
                <Link to="/matching" className="flex items-center gap-2 text-neutral-600 hover:text-primary-rose transition-colors">
                  <SparkIcon size={18} />
                  <span className="font-medium">Discover</span>
                </Link>
                <Link to="/chat" className="flex items-center gap-2 text-neutral-600 hover:text-primary-rose transition-colors">
                  <ChatIcon size={18} />
                  <span className="font-medium">Chat</span>
                </Link>
                
                {/* User Profile Dropdown */}
                <div className="flex items-center gap-4 pl-4 border-l border-neutral-200">
                  <Link to="/profile" className="flex items-center gap-2 text-neutral-600 hover:text-primary-rose transition-colors">
                    <div className="w-8 h-8 bg-gradient rounded-full flex items-center justify-center text-white text-sm font-semibold">
                      {user?.name?.charAt(0)?.toUpperCase() || 'U'}
                    </div>
                    <span className="font-medium">{user?.name || 'Profile'}</span>
                  </Link>
                  <button 
                    onClick={handleLogout}
                    className="btn btn-sm btn-outline text-neutral-600 border-neutral-300 hover:bg-neutral-100 hover:border-neutral-400"
                  >
                    Logout
                  </button>
                </div>
              </>
            ) : (
              <div className="flex items-center gap-4">
                <Link to="/login" className="text-neutral-600 hover:text-primary-rose font-medium transition-colors">
                  Login
                </Link>
                <Link to="/register" className="btn btn-primary">
                  <DateIcon className="mr-2" size={16} />
                  Find Love
                </Link>
              </div>
            )}
          </div>
        </div>
      </div>
    </nav>
  );
};

export default Navbar;
