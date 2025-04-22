import React from 'react';
import { useAuth } from '../context/AuthContext';
import PendingInvitations from '../components/PendingInvitations'; // Import the component

const DashboardPage = () => {
  const { user, logout } = useAuth();

  return (
    <div>
      <h1>Dashboard</h1>
      {user ? (
        <>
          <p>Welcome, {user.name}!</p>
          <p>Email: {user.email}</p>
          <p>University: {user.university}</p>
          {/* Add more dashboard content here */}
          <button onClick={logout} style={{ marginTop: '20px' }}>Logout</button>

          <hr style={{ margin: '30px 0' }}/>

          {/* Display Pending Invitations */}
          <PendingInvitations />

        </>
      ) : (
        <p>Loading user data...</p>
      )}
    </div>
  );
};

export default DashboardPage;
