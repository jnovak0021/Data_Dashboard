import { CgProfile } from "react-icons/cg";
import { FaHome,FaRunning} from "react-icons/fa";
import {useRouter} from 'next/router';
import {useState} from 'react';
const HomePage = () => {


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
        handleRoute({pageIn: "Home"})
    }
    
    const handleProfileClick = () => {
        setPage("Profile");
        handleRoute({ pageIn:  "Profile"});
    }


    const handleRoute = ({ pageIn }: HandleRouteProps) => {
        router.push("/" + pageIn);
    }

    return (
        <div className=" bg-background text w-full h-screen flex items-center flex-col p-0">
            <div className=" navbar w-half bg-mainPink text-4xl font-bold text-white fixed text-4x1 flex top-0 h-16 justify-between items-center rounded-b-lg p-4">
            {/* <div className=" navbar w-full bg-mainPink text-4xl font-bold text-white fixed text-4x1 flex top-0 h-16 justify-between items-center rounded-b-lg p-4 right-0  "> */}
                <div className="flex space-x-4">
                    <FaHome onClick={handleHomeClick} className="cursor-pointer"/>
                    <FaRunning onClick={handleMapClick} className="cursor-pointer"/>
                    <CgProfile onClick={handleProfileClick} className="cursor-pointer"/>
                </div>

            </div>
            <div className="flex-grow flex justify-center items-center">
                Home Page
            </div>
            <div>
            </div>
        </div>
    );
}

export default HomePage;