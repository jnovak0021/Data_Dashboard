import { useRouter } from 'next/router';
import { useEffect, useState } from 'react';
import DashboardLayout from '@/components/DashboardLayout';
import Dashboard from '@/components/Dashboard';
import { getUserSession } from '../../../utils/auth';
import APIFormDialog from '@/components/APIFormDialog';
import { DashboardProvider } from '../../../utils/dashboard-context';

const DashboardPage = () => {
  const router = useRouter();
  const { id } = router.query;
  const [dashboardTitle, setDashboardTitle] = useState('Loading...');
  const [userEmail, setUserEmail] = useState<string | null>(null);
  const [refreshDashboard, setRefreshDashboard] = useState(false);
  const [dashboardId, setDashboardId] = useState<string | null>(null);

  useEffect(() => {
    // Check user session
    const session = getUserSession();
    if (session && session.isLoggedIn) {
      setUserEmail(session.email);
    } else {
      // Redirect to login if not logged in
      router.push('/');
      return;
    }

    // Set dashboard ID when available from router
    if (id && typeof id === 'string') {
      setDashboardId(id);
      fetchDashboardDetails(id);
    }
  }, [id, router]);

  // Fetch dashboard details
  const fetchDashboardDetails = async (dashboardId: string) => {
    try {
      const response = await fetch(`http://localhost:8000/api/go/dashboards/${dashboardId}`);
      if (response.ok) {
        const data = await response.json();
        setDashboardTitle(data.name || `Dashboard #${dashboardId}`);
      } else {
        setDashboardTitle(`Dashboard #${dashboardId}`);
      }
    } catch (error) {
      console.error("Error fetching dashboard details:", error);
      setDashboardTitle(`Dashboard #${dashboardId}`);
    }
  };

  const handleLogout = () => {
    // Redirect to the main page which handles logout
    router.push('/');
  };

  // Function to trigger dashboard refresh
  const handleFormSubmit = () => {
    setRefreshDashboard(prev => !prev);
  };

  return (
    <DashboardProvider>
      <DashboardLayout userEmail={userEmail} onLogout={handleLogout}>
        <div className="p-6">
          <div className="flex justify-between items-center mb-6">
            <h1 className="text-2xl font-bold">{dashboardTitle}</h1>
            <APIFormDialog onFormSubmit={handleFormSubmit} />
          </div>
          
          <div className="bg-white shadow-lg rounded-lg p-0">
            {dashboardId && <Dashboard refresh={refreshDashboard} />}
          </div>
        </div>
      </DashboardLayout>
    </DashboardProvider>
  );
};

export default DashboardPage;