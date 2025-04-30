import { useRouter } from 'next/router';
import { useEffect, useState } from 'react';
import DashboardLayout from '@/components/DashboardLayout';
import Dashboard from '@/components/Dashboard';
import { getUserSession } from '../../utils/auth';
import APIFormDialog from '@/components/APIFormDialog';

const DashboardPage = () => {
  const router = useRouter();
  const { id } = router.query;
  const [dashboardTitle, setDashboardTitle] = useState('Loading...');
  const [userEmail, setUserEmail] = useState<string | null>(null);
  const [refreshDashboard, setRefreshDashboard] = useState(false);
  const BASE_URL = process.env.NEXT_PUBLIC_BACKEND_BASE;  //contant for the baseURL

  useEffect(() => {
    const session = getUserSession();
    if (session && session.isLoggedIn) {
      setUserEmail(session.email);
    } else {
      router.push('/');
      return;
    }

    if (id) {
      fetchDashboardDetails(id.toString());
    }
  }, [id, router]);

  const fetchDashboardDetails = async (dashboardId: string) => {
    try {
      const response = await fetch(`${BASE_URL}/api/go/dashboards/${dashboardId}`);
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
    router.push('/');
  };

  const handleFormSubmit = () => {
    setRefreshDashboard(prev => !prev);
  };

  return (
    <DashboardLayout userEmail={userEmail} onLogout={handleLogout}>
      <div className="p-6">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-2xl font-bold">{dashboardTitle}</h1>
          <APIFormDialog onFormSubmit={handleFormSubmit}  editMode={false}/>
        </div>
        <div className="bg-white shadow-lg rounded-lg p-0">
          <Dashboard refresh={refreshDashboard} />
        </div>
      </div>
    </DashboardLayout>
  );
};

export default DashboardPage;