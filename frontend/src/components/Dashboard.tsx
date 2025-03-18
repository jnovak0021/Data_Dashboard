import React from 'react';
import DashboardPane from './DashboardPane';

interface DashboardProps {
  // You could add props to customize the dashboard based on the selected one
  customLayout?: boolean;
}

const Dashboard: React.FC<DashboardProps> = ({ customLayout = false }) => {
  const numberOfPanes = 6; // Reduced number of panes for better display
  const paneWidth = 350; // Width of each pane in pixels
  const paneHeight = 350; // Height of each pane in pixels
  const queryString = 'https://www.airnowapi.org/aq/data/?startDate=2025-03-17T00&endDate=2025-03-17T23&parameters=O3,PM25,PM10&bbox=-124.409591,32.534156,-114.131211,36.778259&dataType=A&format=application/json&verbose=1&api_key=C854FD7C-A234-4088-83A5-04C0E93B7817';
  const graphType = "pie";
  const parameters = ['OZONE','PM2.5']
  const parameters2 = ['PM2.5','OZONE','PM10']

  const panes = Array.from({ length: numberOfPanes }, (_, index) => (
    <DashboardPane key={index} index={index} sizeX={paneWidth} sizeY={paneHeight} queryString={queryString} graphType={graphType} parameters={parameters} />
  ));
  
  const panes2 = Array.from({ length: numberOfPanes }, (_, index) => (
    <DashboardPane key={index} index={index} sizeX={paneWidth} sizeY={paneHeight} queryString={queryString} graphType={graphType} parameters={parameters2} />
  ));

  return (
    <div className="overflow-auto">
      <div className="dashboard-container grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {customLayout ? panes2 : panes}
      </div>
    </div>
  );
};

export default Dashboard;