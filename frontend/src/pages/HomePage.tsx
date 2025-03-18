import { CgProfile } from "react-icons/cg";
import { FaHome, FaRunning } from "react-icons/fa";
import { useRouter } from 'next/router';
import { useState } from 'react';
import Globe from '@/components/Dashboard';


const HomePage = () => {
  const router = useRouter();
  const [page, setPage] = useState("Home");

  interface HandleRouteProps {
    pageIn: string;
  }

  const handleMapClick = () => {
    setPage("Map");
    handleRoute({ pageIn: "Map" });
  };

  const handleHomeClick = () => {
    setPage("Home");
    handleRoute({ pageIn: "Home" });
  };

  const handleProfileClick = () => {
    setPage("Profile");
    handleRoute({ pageIn: "Profile" });
  };

  const handleRoute = ({ pageIn }: HandleRouteProps) => {
    router.push("/" + pageIn);
  };


  return (
    <div className="bg-background text-black w-screen h-screen flex flex-col overflow-hidden">
      {/* Navigation Bar */}
      <div className="w-full bg-mainPink text-4xl font-bold text-white h-16 flex justify-between items-center p-4 fixed top-0 z-10">
        <div className="flex space-x-4">
          <FaHome onClick={handleHomeClick} className="cursor-pointer" />
          <FaRunning onClick={handleMapClick} className="cursor-pointer" />
          <CgProfile onClick={handleProfileClick} className="cursor-pointer" />
        </div>
      </div>
      <Globe />
    </div>
  );
};

export default HomePage;