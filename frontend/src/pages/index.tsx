import React, { useState } from 'react';
import HomePage from '@/pages/HomePage';
import Login from '@/components/Login'
const Index: React.FC = () => {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [userEmail, setUserEmail] = useState<string | null>(null); // Track userEmail

  return (
    <main className="flex flex-wrap justify-center items-start min-h-screen bg-gray-100">
      <div className=" bg-background min-h-screen w-full flex justify-center items-center transition-all duration-500">
         {/* Login or Earthquake Filter Section */}
         {!isLoggedIn ? (
            <div className="  flex justify-center items-center z-10 w-full h-full">
               {/* Pass setUserEmail when the user logs in */}
               <Login setIsLoggedIn={setIsLoggedIn} setUser={setUserEmail} />
            </div>
         ) : (
            <div className="flex w-full h-screen z-10">
              <HomePage />
            </div>
         )}
      </div>
      <div className="m-4">
      
      </div>
    </main>
  );
}

export default Index;