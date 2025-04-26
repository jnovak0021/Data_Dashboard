// components/LeftSidebar.tsx
import { useRouter } from 'next/router';
import { useState, useEffect } from 'react';
import { useDashboard } from '../../utils/dashboard-context';
import { fetchUserId } from '../../utils/auth';
import {
  FaHome,
  FaCog,
  FaSignOutAlt,
  FaTachometerAlt,
  FaChevronRight,
  FaChevronDown,
  FaPlus,
  FaChevronLeft,
  FaBars,
  FaSpinner, // Added for loading state indication
  FaShoppingCart,
  FaTrash // Added for delete functionality
} from 'react-icons/fa';
import { DashboardType } from '../../utils/types';

interface DeleteConfirmationProps {
  dashboardName: string;
  onConfirm: () => void;
  onCancel: () => void;
}

const DeleteConfirmation: React.FC<DeleteConfirmationProps> = ({ dashboardName, onConfirm, onCancel }) => {
  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50">
      <div className="bg-background/95 w-full max-w-[325px] rounded-lg shadow-lg border border-border/50 p-4">
        <h3 className="text-lg font-medium text-white mb-2">Delete Dashboard</h3>
        <p className="text-sm text-gray-300 mb-4">
          Are you sure you want to delete {dashboardName}? This action cannot be undone.
        </p>
        <div className="flex justify-end gap-2">
          <button
            onClick={onCancel}
            className="px-3 py-1.5 rounded-md border border-gray-600 bg-gray-800 hover:bg-gray-700 text-white text-sm transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={onConfirm}
            className="px-3 py-1.5 rounded-md bg-red-600 hover:bg-red-700 text-white text-sm transition-colors"
          >
            Delete
          </button>
        </div>
      </div>
    </div>
  );
};

interface LeftSidebarProps {
  userEmail: string | null;
  onLogout: () => void;
}

const LeftSidebar: React.FC<LeftSidebarProps> = ({ userEmail, onLogout }) => {
  const router = useRouter();
  const { selectedDashboard, setSelectedDashboard } = useDashboard();
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [isDashboardOpen, setIsDashboardOpen] = useState(true);
  const [refreshFlag, setRefreshFlag] = useState(0);
  const [dashboards, setDashboards] = useState<DashboardType[]>([]);
  const [isLoadingDashboards, setIsLoadingDashboards] = useState(false);
  const [errorFetchingDashboards, setErrorFetchingDashboards] = useState<string | null>(null);
  const [dashboardToDelete, setDashboardToDelete] = useState<DashboardType | null>(null);

  // Fetch dashboards
  useEffect(() => {
    const fetchDashboards = async () => {
      console.log('Fetching dashboards...');
      setIsLoadingDashboards(true);
      setErrorFetchingDashboards(null);
      setDashboards([]);

      const userId = await fetchUserId();
      if (!userId) {
        console.error('User ID not found. Cannot fetch dashboards.');
        setErrorFetchingDashboards('User not identified.');
        setIsLoadingDashboards(false);
        return;
      }

      try {
        const response = await fetch(`http://localhost:8000/api/go/dashboards/user/${userId}`);
        if (!response.ok) {
          throw new Error(`HTTP error! Status: ${response.status}`);
        }
        const data = await response.json();
        console.log('Dashboards data received:', data);
        if (Array.isArray(data) && data.every(item => typeof item.id === 'number' && typeof item.name === 'string')) {
          setDashboards(data);
          if (!selectedDashboard && data.length > 0) {
            setSelectedDashboard(data[0]);
          }
        } else {
          throw new Error('Invalid data format received for dashboards.');
        }
      } catch (error: any) {
        console.error('There was an issue fetching dashboards:', error);
        setErrorFetchingDashboards(error.message || 'Failed to fetch dashboards.');
      } finally {
        setIsLoadingDashboards(false);
      }
    };

    fetchDashboards();
  }, [refreshFlag, setSelectedDashboard]);

  useEffect(() => {
    if (selectedDashboard) {
      handleRoute(`/dashboard/${selectedDashboard.id}`);
    }
  }, [selectedDashboard]);

  const handleRoute = (path: string) => {
    router.push(path);
  };

  const handleDashboardSelect = (dashboard: DashboardType) => {
    setSelectedDashboard(dashboard);
    handleRoute(`/dashboard/${dashboard.id}`);
  };

  const refreshDashboards = () => {
    setRefreshFlag(prev => prev + 1);
  };

  const handleCreateDashboard = async () => {
    console.log('Attempting to create a new dashboard.');
    const userId = await fetchUserId();
    if (!userId) {
      console.error('User ID not found. Cannot create dashboard.');
      return;
    }

    try {
      let maxNum = 0;
      dashboards.forEach(d => {
        const match = d.name.match(/^Dashboard #(\d+)$/);
        if (match && match[1]) {
          const num = parseInt(match[1], 10);
          if (num > maxNum) {
            maxNum = num;
          }
        }
      });
      const nextDashboardName = `Dashboard #${maxNum + 1}`;

      const res = await fetch(`http://localhost:8000/api/go/createDashboard`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId, name: nextDashboardName }),
      });

      if (!res.ok) {
        throw new Error(`Failed to create Dashboard: ${res.status}`);
      }

      refreshDashboards();
    } catch (error) {
      console.error('Error creating Dashboard:', error);
    }
  };

  const handleDeleteClick = (e: React.MouseEvent, dashboard: DashboardType) => {
    e.stopPropagation();
    setDashboardToDelete(dashboard);
  };

  const handleDeleteDashboard = async () => {
    if (!dashboardToDelete) return;

    try {
      const res = await fetch(`http://localhost:8000/api/go/dashboards/${dashboardToDelete.id}`, {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
      });

      if (!res.ok) {
        throw new Error(`Failed to delete dashboard: ${res.statusText}`);
      }

      if (selectedDashboard?.id.toString() === dashboardToDelete.id.toString()) {
        router.push('/');
      }

      setDashboardToDelete(null);
      refreshDashboards();
    } catch (error) {
      console.error('Error deleting dashboard:', error);
    }
  };

  const handleCancelDelete = () => {
    setDashboardToDelete(null);
  };

  const toggleCollapse = () => {
    setIsCollapsed(!isCollapsed);
    if (!isCollapsed) {
      // Optionally close dashboard menu when collapsing
    } else {
      setIsDashboardOpen(true);
    }
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
      <div className="flex justify-end p-2">
        <button
          onClick={toggleCollapse}
          className="text-white p-2 rounded-full hover:bg-pink-700 focus:outline-none focus:ring-2 focus:ring-pink-400 transition-colors"
          aria-label={isCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
        >
          {isCollapsed ? <FaBars /> : <FaChevronLeft />}
        </button>
      </div>

      {!isCollapsed && userEmail && (
        <div className="px-4 py-2 border-b border-pink-700 mb-2">
          <div className="flex items-center">
            <div className="w-8 h-8 rounded-full bg-pink-300 flex items-center justify-center text-pink-800 font-bold mr-2 flex-shrink-0">
              {userEmail.charAt(0).toUpperCase()}
            </div>
            <div className="overflow-hidden">
              <div className="text-sm font-medium truncate" title={userEmail}>
                {userEmail}
              </div>
            </div>
          </div>
        </div>
      )}

      <nav className="flex-1 overflow-y-auto overflow-x-hidden">
        <ul className="space-y-1 p-2">
          <li>
            <a
              onClick={() => handleRoute('/')}
              className={`flex items-center p-2 rounded-lg hover:bg-pink-700 cursor-pointer transition-colors ${
                router.pathname === '/' ? 'bg-pink-700 font-semibold' : ''
              }`}
              title={isCollapsed ? 'Home' : ''}
            >
              <FaHome className="text-xl flex-shrink-0" />
              {!isCollapsed && <span className="ml-3 whitespace-nowrap">Home</span>}
            </a>
          </li>
          <li>
            <a
              onClick={() => handleRoute('/Settings')}
              className={`flex items-center p-2 rounded-lg hover:bg-pink-700 cursor-pointer transition-colors ${
                router.pathname === '/Settings' ? 'bg-pink-700 font-semibold' : ''
              }`}
              title={isCollapsed ? 'Settings' : ''}
            >
              <FaCog className="text-xl flex-shrink-0" />
              {!isCollapsed && <span className="ml-3 whitespace-nowrap">Settings</span>}
            </a>
          </li>
          <li>
            <div
              className={`flex items-center justify-between p-2 rounded-lg hover:bg-pink-700 cursor-pointer transition-colors ${
                router.pathname.startsWith('/dashboard') ? 'bg-pink-700 font-semibold' : ''
              }`}
              onClick={() => !isCollapsed && setIsDashboardOpen(!isDashboardOpen)}
              title={isCollapsed ? 'Dashboards' : ''}
              role="button"
              aria-expanded={!isCollapsed && isDashboardOpen}
            >
              <div className="flex items-center">
                <FaTachometerAlt className="text-xl flex-shrink-0" />
                {!isCollapsed && <span className="ml-3 whitespace-nowrap">Dashboards</span>}
              </div>
              {!isCollapsed && (
                <span className="transition-transform duration-200">
                  {isDashboardOpen ? <FaChevronDown /> : <FaChevronRight />}
                </span>
              )}
            </div>
            {!isCollapsed && isDashboardOpen && (
              <ul className="pl-6 mt-1 space-y-1 border-l border-pink-600 ml-4">
                {isLoadingDashboards && (
                  <li className="flex items-center p-2 text-pink-200">
                    <FaSpinner className="animate-spin mr-2" />
                    Loading...
                  </li>
                )}
                {errorFetchingDashboards && !isLoadingDashboards && (
                  <li className="p-2 text-red-300 text-xs">Error: {errorFetchingDashboards}</li>
                )}
                {!isLoadingDashboards &&
                  !errorFetchingDashboards &&
                  dashboards.map(dashboard => (
                    <li key={dashboard.id}>
                      <div className="flex items-center">
                        <a
                          onClick={() => handleDashboardSelect(dashboard)}
                          className={`flex-1 flex items-center p-1.5 pl-2 rounded-md hover:bg-pink-700 cursor-pointer text-sm transition-colors ${
                            selectedDashboard?.id.toString() === dashboard.id.toString()
                              ? 'bg-pink-700 font-medium'
                              : 'text-pink-100 hover:text-white'
                          }`}
                        >
                          <span className="truncate" title={dashboard.name}>
                            {dashboard.name}
                          </span>
                        </a>
                        <button
                          onClick={e => handleDeleteClick(e, dashboard)}
                          className="pr-3 pl-2 text-gray-400 hover:text-red-500 transition-colors focus:outline-none ml-1"
                          title="Delete dashboard"
                          aria-label={`Delete ${dashboard.name}`}
                        >
                          <FaTrash size={12} />
                        </button>
                      </div>
                    </li>
                  ))}
                {!isLoadingDashboards && !errorFetchingDashboards && dashboards.length === 0 && (
                  <li className="p-2 text-pink-200 text-xs italic">No dashboards found.</li>
                )}
                <li>
                  <button
                    onClick={handleCreateDashboard}
                    className="flex items-center w-full p-2 rounded-lg hover:bg-pink-700 cursor-pointer text-pink-200 hover:text-white transition-colors focus:outline-none focus:ring-1 focus:ring-pink-400"
                  >
                    <FaPlus className="text-sm mr-2 flex-shrink-0" />
                    <span className="text-sm whitespace-nowrap">Create New Dashboard</span>
                  </button>
                </li>
                <li>
                  <button
                  className="flex items-center w-full p-2 rounded-lg hover:bg-pink-700 cursor-pointer text-pink-200 hover:text-white transition-colors focus:outline-none focus:ring-1 focus:ring-pink-400"
                  >
                    <FaShoppingCart className="text-sm mr-2 flex-shrink-0" />
                    <span className="text-sm whitespace-nowrap">Dashboard Shop</span>

                  </button>
                </li>
              </ul>
            )}
          </li>
        </ul>
      </nav>

      <div className="p-2 border-t border-pink-700 mt-auto">
        <a
          onClick={handleLogout}
          className="flex items-center p-2 rounded-lg hover:bg-pink-700 cursor-pointer transition-colors"
          title={isCollapsed ? 'Logout' : ''}
        >
          <FaSignOutAlt className="text-xl flex-shrink-0" />
          {!isCollapsed && <span className="ml-3 whitespace-nowrap">Logout</span>}
        </a>
      </div>

      {dashboardToDelete && (
        <DeleteConfirmation
          dashboardName={dashboardToDelete.name}
          onConfirm={handleDeleteDashboard}
          onCancel={handleCancelDelete}
        />
      )}
    </div>
  );
};

export default LeftSidebar;