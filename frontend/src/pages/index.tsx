import React from 'react';
import HomePage from '@/pages/HomePage';
const Home: React.FC = () => {
  return (
    <main className="flex flex-wrap justify-center items-start min-h-screen bg-gray-100">
      <div className="m-4">
        <HomePage />
      </div>
    </main>
  );
}

export default Home;