import { createContext, useContext, useState, ReactNode } from 'react';
import { DashboardType } from './types';

interface DashboardContextType {
  selectedDashboard: DashboardType | null;
  setSelectedDashboard: (dashboard: DashboardType | null) => void;
}

const DashboardContext = createContext<DashboardContextType | undefined>(undefined);

export const DashboardProvider = ({ children }: { children: ReactNode }) => {
  const [selectedDashboard, setSelectedDashboard] = useState<DashboardType | null>(null);

  return (
    <DashboardContext.Provider value={{ selectedDashboard, setSelectedDashboard }}>
      {children}
    </DashboardContext.Provider>
  );
};

export const useDashboard = () => {
  const context = useContext(DashboardContext);
  if (!context) {
    throw new Error('useDashboard must be used within a DashboardProvider');
  }
  return context;
};