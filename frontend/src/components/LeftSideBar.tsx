import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import { fetchUserId } from '../../utils/auth'; // Assuming this utility correctly fetches the user ID
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
  FaBars,
  FaSpinner // Added for loading state indication
} from 'react-icons/fa';

interface Dashboard {
  id: number; // Assuming ID is a number from the backend
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
  const [refreshFlag, setRefreshFlag] = useState(0); // Used to refresh dashboard lists when something changes
  const [dashboards, setDashboards] = useState<Dashboard[]>([]);
  const [isLoadingDashboards, setIsLoadingDashboards] = useState(false); // Loading state
  const [errorFetchingDashboards, setErrorFetchingDashboards] = useState<string | null>(null); // Error state

  // Extract dashboardId from the current route to highlight the selected one
  useEffect(() => {
    if (router.pathname.startsWith('/dashboard/')) {
      const currentDashboardId = router.query.dashboardId as string;
      setSelectedDashboard(currentDashboardId);
    } else {
      setSelectedDashboard(null); // Deselect if not on a dashboard page
    }
  }, [router.pathname, router.query]);


  // Fetch dashboards when component mounts or refreshFlag changes
  useEffect(() => {
    const fetchDashboards = async () => {
      console.log("Fetching dashboards...");
      setIsLoadingDashboards(true); // Start loading
      setErrorFetchingDashboards(null); // Reset error
      setDashboards([]); // Clear previous dashboards potentially

      const userId = await fetchUserId();
      if (!userId) {
         console.error("User ID not found. Cannot fetch dashboards.");
         setErrorFetchingDashboards("User not identified.");
         setIsLoadingDashboards(false);
         return; // Exit if no user ID
      }

      try {
        const response = await fetch(`http://localhost:8000/api/go/dashboards/user/${userId}`);

        if (!response.ok) {
          // Try to get more specific error message from response body if possible
          let errorMsg = `HTTP error! Status: ${response.status}`;
          try {
              const errorData = await response.json();
              errorMsg += ` - ${errorData.message || JSON.stringify(errorData)}`;
          } catch (e) {
              // Ignore if response body is not JSON or empty
          }
          throw new Error(errorMsg);
        }

        // console.log(response); // Keep for debugging if needed
        const data = await response.json();
        console.log("Dashboards data received:", data);

        // IMPORTANT: Validate the received data structure matches Dashboard[]
        if (Array.isArray(data) && data.every(item => typeof item.id === 'number' && typeof item.name === 'string')) {
            setDashboards(data);
        } else {
            console.error("Received data is not in the expected Dashboard[] format:", data);
            throw new Error("Invalid data format received for dashboards.");
        }

      } catch (error: any) { // Catch specific error type if known, otherwise any
        console.error("There was an issue fetching dashboards:", error);
        setErrorFetchingDashboards(error.message || "Failed to fetch dashboards.");
      } finally {
        setIsLoadingDashboards(false); // Stop loading regardless of success or failure
      }
    };

    fetchDashboards();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [refreshFlag]); // Depend only on refreshFlag


  const handleRoute = (path: string) => {
    router.push(path);
  };

  const handleDashboardSelect = (dashboardId: number) => { // Use number type matching the interface
    const dashboardIdStr = dashboardId.toString();
    setSelectedDashboard(dashboardIdStr);
    handleRoute(`/dashboard/${dashboardIdStr}`);
  };

  // Call this to cause dashboard list to refresh
  const refreshDashboards = () => {
    setRefreshFlag(prev => prev + 1); // Increment flag to trigger useEffect
  };

  // Create a new dashboard and add to database
  const handleCreateDashboard = async () => {
    console.log("Attempting to create a new dashboard.");
    const userId = await fetchUserId();
     if (!userId) {
         console.error("User ID not found. Cannot create dashboard.");
         // Optionally: show an error message to the user
         return;
     }

    try {
      // Determine the next dashboard number based on fetched dashboards
      // Find the highest number in existing names like "Dashboard #X"
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


      const jsonBody = {
        userId: userId,
        name: nextDashboardName
      };
      console.log("Sending POST request to create dashboard:", jsonBody);

      const res = await fetch(`http://localhost:8000/api/go/createDashboard`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(jsonBody),
      });

      if (!res.ok) {
        // Try to get error details from response
        let errorMsg = `Failed to create Dashboard: ${res.status} ${res.statusText}`;
        try {
            const errorData = await res.json();
            errorMsg += ` - ${errorData.message || JSON.stringify(errorData)}`;
        } catch (e) {
            // Ignore if response body is not JSON or empty
        }
        throw new Error(errorMsg);
      }

      const data = await res.json();
      console.log('Dashboard POST Response:', data);

      // IMPORTANT: Refresh the list AFTER successful creation
      refreshDashboards();

    } catch (error) {
      console.error('Error creating Dashboard:', error);
      // Optionally: Show an error notification to the user
    }
  };

  const toggleCollapse = () => {
    setIsCollapsed(!isCollapsed);
    // If collapsing, ensure the dashboard sub-menu doesn't stay visually open
    if (!isCollapsed) {
        // Delay closing slightly to allow collapse animation
        // setTimeout(() => setIsDashboardOpen(false), 150); // Optional: adjust timing
    } else {
        // If expanding, default to open if it was previously
        setIsDashboardOpen(true);
    }
  };

  const handleLogout = () => {
    onLogout(); // Call the passed logout handler (e.g., clear token)
    router.push('/'); // Redirect to home/login page
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
          className="text-white p-2 rounded-full hover:bg-pink-700 focus:outline-none focus:ring-2 focus:ring-pink-400 transition-colors"
          aria-label={isCollapsed ? "Expand sidebar" : "Collapse sidebar"}
        >
          {isCollapsed ? <FaBars /> : <FaChevronLeft />}
        </button>
      </div>

      {/* User info */}
      {!isCollapsed && userEmail && (
        <div className="px-4 py-2 border-b border-pink-700 mb-2">
          <div className="flex items-center">
            <div className="w-8 h-8 rounded-full bg-pink-300 flex items-center justify-center text-pink-800 font-bold mr-2 flex-shrink-0">
              {userEmail.charAt(0).toUpperCase()}
            </div>
            <div className="overflow-hidden"> {/* Prevents long emails breaking layout */}
                <div className="text-sm font-medium truncate" title={userEmail}>{userEmail}</div>
            </div>
          </div>
        </div>
      )}

      {/* Nav items */}
      <nav className="flex-1 overflow-y-auto overflow-x-hidden"> {/* Prevent horizontal scroll */}
        <ul className="space-y-1 p-2">
          {/* Home */}
          <li>
            <a
              onClick={() => handleRoute('/')}
              className={`flex items-center p-2 rounded-lg hover:bg-pink-700 cursor-pointer transition-colors ${
                router.pathname === '/' ? 'bg-pink-700 font-semibold' : ''
              }`}
              title={isCollapsed ? "Home" : ""}
            >
              <FaHome className="text-xl flex-shrink-0" />
              {!isCollapsed && <span className="ml-3 whitespace-nowrap">Home</span>}
            </a>
          </li>

          {/* Profile */}
          <li>
            <a
              onClick={() => handleRoute('/Profile')}
              className={`flex items-center p-2 rounded-lg hover:bg-pink-700 cursor-pointer transition-colors ${
                router.pathname === '/Profile' ? 'bg-pink-700 font-semibold' : ''
              }`}
               title={isCollapsed ? "Profile" : ""}
           >
              <FaUser className="text-xl flex-shrink-0" />
              {!isCollapsed && <span className="ml-3 whitespace-nowrap">Profile</span>}
            </a>
          </li>

          {/* Settings */}
          <li>
            <a
              onClick={() => handleRoute('/Settings')}
              className={`flex items-center p-2 rounded-lg hover:bg-pink-700 cursor-pointer transition-colors ${
                 router.pathname === '/Settings' ? 'bg-pink-700 font-semibold' : ''
              }`}
              title={isCollapsed ? "Settings" : ""}
            >
              <FaCog className="text-xl flex-shrink-0" />
              {!isCollapsed && <span className="ml-3 whitespace-nowrap">Settings</span>}
            </a>
          </li>

          {/* Dashboards Section Toggle */}
          <li>
            <div
              className={`flex items-center justify-between p-2 rounded-lg hover:bg-pink-700 cursor-pointer transition-colors ${
                 router.pathname.startsWith('/dashboard') ? 'bg-pink-700 font-semibold' : ''
              }`}
              onClick={() => !isCollapsed && setIsDashboardOpen(!isDashboardOpen)} // Only toggle if not collapsed
              title={isCollapsed ? "Dashboards" : ""}
              role="button" // Better accessibility
              aria-expanded={!isCollapsed && isDashboardOpen} // Accessibility
            >
              <div className="flex items-center">
                <FaTachometerAlt className="text-xl flex-shrink-0" />
                {!isCollapsed && <span className="ml-3 whitespace-nowrap">Dashboards</span>}
              </div>
              {/* Show toggle icon only if not collapsed */}
              {!isCollapsed && (
                <span className="transition-transform duration-200">
                    {isDashboardOpen ? <FaChevronDown /> : <FaChevronRight />}
                </span>
              )}
            </div>

            {/* Dashboard Sub-items - Conditionally render based on collapsed and open state */}
            { !isCollapsed && isDashboardOpen && (
              <ul className="pl-6 mt-1 space-y-1 border-l border-pink-600 ml-4">
                {/* Loading State */}
                {isLoadingDashboards && (
                    <li className="flex items-center p-2 text-pink-200">
                        <FaSpinner className="animate-spin mr-2" />
                        Loading...
                    </li>
                )}

                {/* Error State */}
                {errorFetchingDashboards && !isLoadingDashboards && (
                     <li className="p-2 text-red-300 text-xs">
                        Error: {errorFetchingDashboards}
                     </li>
                )}

                {/* Dashboard List */}
                {!isLoadingDashboards && !errorFetchingDashboards && dashboards.map((dashboard) => (
                  <li key={dashboard.id}>
                    <a
                      onClick={() => handleDashboardSelect(dashboard.id)}
                      className={`flex items-center p-1.5 pl-2 rounded-md hover:bg-pink-700 cursor-pointer text-sm transition-colors ${
                        selectedDashboard === dashboard.id.toString() ? 'bg-pink-700 font-medium' : 'text-pink-100 hover:text-white'
                      }`}
                    >
                      {/* Optional: Add a small icon per dashboard */}
                      <span className="truncate" title={dashboard.name}>{dashboard.name}</span>
                    </a>
                  </li>
                ))}

                {/* Empty State (Optional but good UX) */}
                {!isLoadingDashboards && !errorFetchingDashboards && dashboards.length === 0 && (
                    <li className="p-2 text-pink-200 text-xs italic">
                        No dashboards found.
                    </li>
                )}


                {/* --- Create New Dashboard --- */}
                <li>
                  <button // Use button for actions
                    onClick={handleCreateDashboard}
                    className="flex items-center w-full p-2 rounded-lg hover:bg-pink-700 cursor-pointer text-pink-200 hover:text-white transition-colors focus:outline-none focus:ring-1 focus:ring-pink-400"
                  >
                    <FaPlus className="text-sm mr-2 flex-shrink-0" />
                    <span className="text-sm whitespace-nowrap">Create New Dashboard</span>
                  </button>
                </li>
              </ul>
            )} {/* End of Dashboard Sub-items */}
          </li> {/* End of Dashboards Section */}
        </ul>
      </nav>

      {/* Logout at the bottom */}
      <div className="p-2 border-t border-pink-700 mt-auto"> {/* mt-auto pushes it down */}
        <a
          onClick={handleLogout}
          className="flex items-center p-2 rounded-lg hover:bg-pink-700 cursor-pointer transition-colors"
          title={isCollapsed ? "Logout" : ""}
        >
          <FaSignOutAlt className="text-xl flex-shrink-0" />
          {!isCollapsed && <span className="ml-3 whitespace-nowrap">Logout</span>}
        </a>
      </div>
    </div>
  );
};

export default LeftSidebar;