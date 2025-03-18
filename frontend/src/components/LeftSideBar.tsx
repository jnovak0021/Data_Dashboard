import { useState } from 'react';
import { useRouter } from 'next/router';
import { 
  FaHome, 
  FaUser, 
  FaCog, 
  FaSignOutAlt, 
  FaTachometerAlt, 
  FaChevronRight, 
  FaChevronDown, 
  FaPlus,
  FaChevronLeft,
  FaBars
} from 'react-icons/fa';

interface DashboardItem {
  id: string;
  name: string;
}

interface LeftSidebarProps {
  userEmail: string | null;
  onLogout: () => void;
}

const LeftSidebar: React.FC<LeftSidebarProps> = ({ userEmail, onLogout }) => {
  const router = useRouter();
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [isDashboardOpen, setIsDashboardOpen] = useState(true);
  const [selectedDashboard, setSelectedDashboard] = useState<string | null>(null);
  
  // Example dashboard items - in a real app, you might fetch these from an API
  const [dashboards, setDashboards] = useState<DashboardItem[]>([
    { id: 'dashboard1', name: 'Dashboard #1' },
    { id: 'dashboard2', name: 'Dashboard #2' },
  ]);

  const handleRoute = (path: string) => {
    router.push(path);
  };

  const handleDashboardSelect = (dashboardId: string) => {
    setSelectedDashboard(dashboardId);
    handleRoute(`/dashboard/${dashboardId}`);
  };

  const handleCreateDashboard = () => {
    // In a real app, you would create a new dashboard in your backend
    const newId = `dashboard${dashboards.length + 1}`;
    const newDashboard = { id: newId, name: `Dashboard #${dashboards.length + 1}` };
    setDashboards([...dashboards, newDashboard]);
    setSelectedDashboard(newId);
    handleRoute(`/dashboard/${newId}`);
  };

  const toggleCollapse = () => {
    setIsCollapsed(!isCollapsed);
  };

  const handleLogout = () => {
    onLogout();
    router.push('/');
  };

  return (
    <div 
      className={`bg-mainPink text-white h-screen transition-all duration-300 flex flex-col ${
        isCollapsed ? 'w-16' : 'w-64'
      }`}
    >
      {/* Toggle button */}
      <div className="flex justify-end p-2">
        <button 
          onClick={toggleCollapse} 
          className="text-white p-2 rounded-full hover:bg-pink-700 transition-colors"
        >
          {isCollapsed ? <FaBars /> : <FaChevronLeft />}
        </button>
      </div>

      {/* User info */}
      {!isCollapsed && userEmail && (
        <div className="px-4 py-2 border-b border-pink-700">
          <div className="flex items-center">
            <div className="w-8 h-8 rounded-full bg-pink-300 flex items-center justify-center text-pink-800 font-bold">
              {userEmail.charAt(0).toUpperCase()}
            </div>
            <div className="ml-2 truncate">
              <div className="text-sm font-medium">{userEmail}</div>
            </div>
          </div>
        </div>
      )}

      {/* Nav items */}
      <nav className="flex-1 overflow-y-auto">
        <ul className="space-y-2 p-2">
          {/* Home */}
          <li>
            <a 
              onClick={() => handleRoute('/')}
              className="flex items-center p-2 rounded-lg hover:bg-pink-700 cursor-pointer"
            >
              <FaHome className="text-xl" />
              {!isCollapsed && <span className="ml-3">Home</span>}
            </a>
          </li>

          {/* Profile */}
          <li>
            <a 
              onClick={() => handleRoute('/Profile')}
              className="flex items-center p-2 rounded-lg hover:bg-pink-700 cursor-pointer"
            >
              <FaUser className="text-xl" />
              {!isCollapsed && <span className="ml-3">Profile</span>}
            </a>
          </li>

          {/* Settings */}
          <li>
            <a 
              onClick={() => handleRoute('/settings')}
              className="flex items-center p-2 rounded-lg hover:bg-pink-700 cursor-pointer"
            >
              <FaCog className="text-xl" />
              {!isCollapsed && <span className="ml-3">Settings</span>}
            </a>
          </li>

          {/* Dashboards with sub-items */}
          <li>
            <div 
              className="flex items-center justify-between p-2 rounded-lg hover:bg-pink-700 cursor-pointer"
              onClick={() => !isCollapsed && setIsDashboardOpen(!isDashboardOpen)}
            >
              <div className="flex items-center">
                <FaTachometerAlt className="text-xl" />
                {!isCollapsed && <span className="ml-3">Dashboards</span>}
              </div>
              {!isCollapsed && (
                isDashboardOpen ? <FaChevronDown /> : <FaChevronRight />
              )}
            </div>

            {/* Dashboard sub-items */}
            {!isCollapsed && isDashboardOpen && (
              <ul className="pl-6 mt-2 space-y-1">
                {dashboards.map((dashboard) => (
                  <li key={dashboard.id}>
                    <a 
                      onClick={() => handleDashboardSelect(dashboard.id)}
                      className={`flex items-center p-2 rounded-lg cursor-pointer ${
                        selectedDashboard === dashboard.id 
                          ? 'bg-pink-700 font-medium' 
                          : 'hover:bg-pink-700'
                      }`}
                    >
                      <span>{dashboard.name}</span>
                    </a>
                  </li>
                ))}
                
                {/* Create New Dashboard */}
                <li>
                  <a 
                    onClick={handleCreateDashboard}
                    className="flex items-center p-2 rounded-lg hover:bg-pink-700 cursor-pointer text-pink-200"
                  >
                    <FaPlus className="text-sm mr-2" />
                    <span>Create New Dashboard</span>
                  </a>
                </li>
              </ul>
            )}
          </li>
        </ul>
      </nav>

      {/* Logout at the bottom */}
      <div className="p-4 border-t border-pink-700">
        <a 
          onClick={handleLogout}
          className="flex items-center p-2 rounded-lg hover:bg-pink-700 cursor-pointer"
        >
          <FaSignOutAlt className="text-xl" />
          {!isCollapsed && <span className="ml-3">Logout</span>}
        </a>
      </div>
    </div>
  );
};

export default LeftSidebar;