import React, { ReactNode } from 'react';
import LeftSidebar from './LeftSideBar';

interface DashboardLayoutProps {
  children: ReactNode;
  userEmail: string | null;
  onLogout: () => void;
}

const DashboardLayout: React.FC<DashboardLayoutProps> = ({ children, userEmail, onLogout }) => {
  return (
    <div className="flex h-screen bg-gray-100 overflow-hidden">
      {/* Left Sidebar */}
      <LeftSidebar userEmail={userEmail} onLogout={onLogout} />
      
      {/* Main Content */}
      <div className="flex-1 overflow-auto">
        {children}
      </div>
    </div>
  );
};

export default DashboardLayout;