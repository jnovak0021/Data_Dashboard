import { useRouter } from 'next/router';
import { useState } from 'react';
import DashboardLayout from '@/components/DashboardLayout';
import Dashboard from '@/components/Dashboard';
import APIFormDialog from '@/components/APIFormDialog';

interface HomePageProps {
  userEmail: string | null;
  onLogout: () => void;
}

const HomePage: React.FC<HomePageProps> = ({ userEmail, onLogout }) => {
  const router = useRouter();
  const [refreshDashboard, setRefreshDashboard] = useState(false);

  // Function to trigger a dashboard refresh
  const handleFormSubmit = () => {
    setRefreshDashboard((prev) => !prev); // Toggle the state to trigger a re-fetch in Dashboard
  };

  return (
    <DashboardLayout userEmail={userEmail} onLogout={onLogout}>
      <div className="p-6">
        <h1 className="text-2xl font-bold mb-6">Welcome to Your Dashboard</h1>
        {/* Pass the callback to APIFormDialog */}
        <APIFormDialog onFormSubmit={handleFormSubmit} />
        <div className="bg-white shadow-lg rounded-lg p-6">
          {/* Pass the refreshDashboard state to Dashboard */}
          <Dashboard refresh={refreshDashboard} />
        </div>
      </div>
    </DashboardLayout>
  );
};

export default HomePage;