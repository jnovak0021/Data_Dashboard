import { CgProfile } from "react-icons/cg";
import { FaHome, FaRunning, FaSignOutAlt } from "react-icons/fa";
import { useRouter } from 'next/router';
import { useState } from 'react';
import { clearUserSession } from "../../utils/auth";

const Navbar = () => {
    //router 
    const router = useRouter();
    const [page, setPage] = useState("Home");

    interface HandleRouteProps {
        pageIn: string;
    }

    const handleMapClick = () => {
        setPage("Map");
        handleRoute({pageIn: "Map"})
    }

    const handleHomeClick = () => {
        setPage("Home");
        handleRoute({pageIn: "/"})
    }
    
    const handleProfileClick = () => {
        setPage("Profile");
        handleRoute({ pageIn:  "Profile"});
    }

    const handleLogout = () => {
        clearUserSession();
        router.push("/");
        // Force a page reload to reset all React state
        window.location.reload();
    }

    const handleRoute = ({ pageIn }: HandleRouteProps) => {
        router.push("/" + pageIn);
    }

    return (
        <div className="navbar w-half bg-mainPink text-4xl font-bold text-white fixed text-4x1 flex top-0 h-16 justify-between items-center rounded-b-lg p-4">
            <div className="flex space-x-4">
                <FaHome onClick={handleHomeClick} className="cursor-pointer"/>
                <FaRunning onClick={handleMapClick} className="cursor-pointer"/>
                <CgProfile onClick={handleProfileClick} className="cursor-pointer"/>
            </div>
            <div>
                <FaSignOutAlt onClick={handleLogout} className="cursor-pointer" title="Logout" />
            </div>
        </div>
    );
}

export default Navbar;