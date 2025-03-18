import React, { useState, useEffect } from 'react';
import HomePage from '@/pages/HomePage';
import Login from '@/components/Login';
import { getUserSession, clearUserSession } from '../../utils/auth';

const Index: React.FC = () => {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [userEmail, setUserEmail] = useState<string | null>(null);
  
  // Check for existing session on component mount
  useEffect(() => {
    const session = getUserSession();
    if (session && session.isLoggedIn) {
      setIsLoggedIn(true);
      setUserEmail(session.email);
    }
  }, []);
  
  // Handle logout function
  const handleLogout = () => {
    clearUserSession();
    setIsLoggedIn(false);
    setUserEmail(null);
  };

  return (
    <main className="min-h-screen bg-gray-100">
      {!isLoggedIn ? (
        <div className="flex justify-center items-center h-screen w-full">
          <Login setIsLoggedIn={setIsLoggedIn} setUser={setUserEmail} />
        </div>
      ) : (
        // Pass the required props to HomePage
        <HomePage userEmail={userEmail} onLogout={handleLogout} />
      )}
    </main>
  );
}

export default Index;