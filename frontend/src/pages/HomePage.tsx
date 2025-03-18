import { useRouter } from 'next/router';
import DashboardLayout from '@/components/DashboardLayout';
import Dashboard from '@/components/Dashboard';

interface HomePageProps {
  userEmail: string | null;
  onLogout: () => void;
}

const HomePage: React.FC<HomePageProps> = ({ userEmail, onLogout }) => {
  const router = useRouter();
  
  return (
    <DashboardLayout userEmail={userEmail} onLogout={onLogout}>
      <div className="p-6">
        <h1 className="text-2xl font-bold mb-6">Welcome to Your Dashboard</h1>
        <div className="bg-white shadow-lg rounded-lg p-6">
          <Dashboard />
        </div>
      </div>
    </DashboardLayout>
  );
};

export default HomePage;