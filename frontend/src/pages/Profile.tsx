import React from 'react';

const Profile = () => {
    return (
        <div className="bg-background text w-full h-screen flex flex-col items-center p-4">
            <div className=" w-full max-w-4xl">
                <div className=" bg-mainPink flex items-center space-x-4 p-4 rounded-lg border-gray-300">
                    <div className="w-24 h-24 rounded-full bg-background-300"></div>
                    <div>
                        <h2 className="text-2xl text-white font-bold">Username</h2>
                        <p className="text-white">Bio goes here. This is a short description about the user.</p>
                    </div>
                </div>
                <div className="grid grid-cols-3 gap-4 p-4">
                    <div className="w-full h-32 bg-gray-300"></div>
                    <div className="w-full h-32 bg-gray-300"></div>
                    <div className="w-full h-32 bg-gray-300"></div>
                    <div className="w-full h-32 bg-gray-300"></div>
                    <div className="w-full h-32 bg-gray-300"></div>
                    <div className="w-full h-32 bg-gray-300"></div>
                </div>
            </div>
        </div>
    );
}

export default Profile;