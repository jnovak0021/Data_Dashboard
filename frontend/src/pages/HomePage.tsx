import { useState } from 'react';
import { useRouter } from 'next/router';
import DashboardLayout from '@/components/DashboardLayout';
import Dashboard from '@/components/Dashboard';
import APIFormDialog from '@/components/APIFormDialog';

interface HomePageProps {
  userEmail: string | null;
  onLogout: () => void;
}

const HomePage = ({ userEmail, onLogout }: HomePageProps) => {
  const router = useRouter();
  const [refreshDashboard, setRefreshDashboard] = useState(false);  

  const handleFormSubmit = () => {
    setRefreshDashboard(prev => !prev);
  };

  return (
    <DashboardLayout userEmail={userEmail} onLogout={onLogout}>
      <div className="p-6">
        <h1 className="text-2xl font-bold mb-6">Welcome to Your Dashboard</h1>
        <APIFormDialog onFormSubmit={handleFormSubmit} />
        <div className="bg-white shadow-lg rounded-lg p-6">
          <Dashboard refresh={refreshDashboard} />
        </div>
      </div>
    </DashboardLayout>
  );
};

export default HomePage;