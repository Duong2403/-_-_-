import React from 'react';
import { useAuth } from '../context/AuthContext';
import PendingInvitations from '../components/PendingInvitations';
import { DateIcon, GroupsIcon, SparkIcon } from '../components/ui/SocialIcons';
import { Link } from 'react-router-dom';

const DashboardPage = () => {
  const { user, logout } = useAuth();

  return (
    <div className="bg-neutral-50 min-h-screen">
      <div className="container py-8">
        {user ? (
          <>
            {/* Welcome Header */}
            <div className="text-center mb-12 animate-fade-in">
              <div className="flex justify-center mb-4">
                <div className="bg-gradient-love rounded-full p-4">
                  <DateIcon className="text-white" size={32} />
                </div>
              </div>
              <h1 className="text-4xl font-bold text-neutral-800 mb-4 font-family-heading">
                Welcome back, <span className="text-gradient">{user.name}</span>! 💕
              </h1>
              <p className="text-lg text-neutral-600 max-w-2xl mx-auto">
                Ready to connect with amazing groups from other universities?
              </p>
            </div>

            {/* User Info Card */}
            <div className="card mb-8 animate-slide-up">
              <div className="card-body">
                <div className="flex items-center gap-4 mb-6">
                  <div className="w-16 h-16 bg-gradient-sunset rounded-full flex items-center justify-center text-white text-2xl font-bold">
                    {user.name?.charAt(0)?.toUpperCase() || 'U'}
                  </div>
                  <div>
                    <h2 className="text-2xl font-semibold text-neutral-800">{user.name}</h2>
                    <p className="text-neutral-600">{user.email}</p>
                    <div className="flex items-center gap-2 mt-2">
                      <span className="badge badge-primary">{user.university}</span>
                      {user.age && <span className="badge badge-outline">Age {user.age}</span>}
                    </div>
                  </div>
                </div>
                {user.bio && (
                  <div className="mb-4">
                    <h3 className="font-semibold text-neutral-700 mb-2">About Me</h3>
                    <p className="text-neutral-600">{user.bio}</p>
                  </div>
                )}
              </div>
            </div>

            {/* Quick Actions */}
            <div className="grid grid-3 gap-6 mb-8 animate-bounce-in">
              <Link to="/teams" className="card hover:shadow-2xl transition-all duration-300">
                <div className="card-body text-center">
                  <div className="flex justify-center mb-4">
                    <div className="bg-gradient-friendship rounded-lg p-3">
                      <GroupsIcon className="text-white" size={24} />
                    </div>
                  </div>
                  <h3 className="text-lg font-semibold text-neutral-800 mb-2">My Groups</h3>
                  <p className="text-neutral-600 text-sm">Manage your groups and create new ones</p>
                </div>
              </Link>
              
              <Link to="/matching" className="card hover:shadow-2xl transition-all duration-300">
                <div className="card-body text-center">
                  <div className="flex justify-center mb-4">
                    <div className="bg-gradient-love rounded-lg p-3">
                      <SparkIcon className="text-white" size={24} />
                    </div>
                  </div>
                  <h3 className="text-lg font-semibold text-neutral-800 mb-2">Discover</h3>
                  <p className="text-neutral-600 text-sm">Find groups from other universities</p>
                </div>
              </Link>
              
              <Link to="/chat" className="card hover:shadow-2xl transition-all duration-300">
                <div className="card-body text-center">
                  <div className="flex justify-center mb-4">
                    <div className="bg-gradient-accent rounded-lg p-3">
                      <DateIcon className="text-white" size={24} />
                    </div>
                  </div>
                  <h3 className="text-lg font-semibold text-neutral-800 mb-2">Chat</h3>
                  <p className="text-neutral-600 text-sm">Connect with matched groups</p>
                </div>
              </Link>
            </div>

            {/* Pending Invitations */}
            <div className="card animate-slide-up">
              <div className="card-header">
                <h2 className="text-xl font-semibold text-neutral-800">Pending Invitations</h2>
              </div>
              <div className="card-body">
                <PendingInvitations />
              </div>
            </div>

          </>
        ) : (
          <div className="text-center py-16">
            <div className="animate-fade-in">
              <div className="flex justify-center mb-6">
                <div className="bg-neutral-200 rounded-full p-6">
                  <DateIcon className="text-neutral-500" size={48} />
                </div>
              </div>
              <h2 className="text-2xl font-semibold text-neutral-800 mb-4">Loading your profile...</h2>
              <p className="text-neutral-600">Please wait while we fetch your data</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default DashboardPage;
