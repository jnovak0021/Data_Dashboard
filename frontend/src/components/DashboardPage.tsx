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

    // In a real app, you might fetch dashboard details from an API
    if (id) {
      // Mock data - replace with real data fetching
      const dashboardId = Array.isArray(id) ? id[0] : id;
      setDashboardTitle(`Dashboard ${dashboardId.replace('dashboard', '#')}`);
    }
  }, [id, router]);

  const handleLogout = () => {
    // Redirect to the main page which handles logout
    router.push('/');
  };

  // Function to trigger dashboard refresh
  const handleFormSubmit = () => {
    setRefreshDashboard(prev => !prev);
  };

  return (
    <DashboardLayout userEmail={userEmail} onLogout={handleLogout}>
      <div className="p-6">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-2xl font-bold">{dashboardTitle}</h1>
          <APIFormDialog onFormSubmit={handleFormSubmit} />
        </div>
        
        <div className="bg-white shadow-lg rounded-lg p-0">
          <Dashboard refresh={refreshDashboard} />
        </div>
      </div>
    </DashboardLayout>
  );
};

export default DashboardPage;