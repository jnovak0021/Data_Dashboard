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
    <main className="flex flex-wrap justify-center items-start min-h-screen bg-gray-100">
      <div className="bg-background min-h-screen w-full flex justify-center items-center transition-all duration-500">
         {/* Login or Earthquake Filter Section */}
         {!isLoggedIn ? (
            <div className="flex justify-center items-center z-10 w-full h-full">
               {/* Pass setUserEmail when the user logs in */}
               <Login setIsLoggedIn={setIsLoggedIn} setUser={setUserEmail} />
            </div>
         ) : (
            <div className="flex w-full h-screen z-10">
              <HomePage />
              
              {/* Optional: Add a logout button somewhere in your app */}
              {/* For example: */}
               <button 
                onClick={handleLogout}
                className="absolute top-4 right-4 px-4 py-2 bg-red-500 text-white rounded"
                >
                Logout
              </button>
            </div>
         )}
      </div>
    </main>
  );
}

export default Index;