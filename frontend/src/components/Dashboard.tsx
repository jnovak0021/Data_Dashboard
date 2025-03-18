import React from 'react';
import DashboardPane from './DashboardPane';

const Dashboard: React.FC = () => {
  const numberOfPanes = 10; // Adjust this number to change the number of panes
  const paneWidth = 400; // Width of each pane in pixels
  const paneHeight = 400; // Height of each pane in pixels
  const queryString = 'https://www.airnowapi.org/aq/data/?startDate=2025-03-17T00&endDate=2025-03-17T23&parameters=O3,PM25,PM10&bbox=-124.409591,32.534156,-114.131211,36.778259&dataType=A&format=application/json&verbose=1&api_key=C854FD7C-A234-4088-83A5-04C0E93B7817';
  const graphType = "pie";
  const parameters = ['OZONE','PM2.5']
  const parameters2 = ['PM2.5','OZONE','PM10']

  const panes = Array.from({ length: numberOfPanes }, (_, index) => (
    <DashboardPane key={index} index={index} sizeX={paneWidth} sizeY={paneHeight} queryString={queryString} graphType = {graphType} parameters={parameters} />
  ));
  const panes2 = Array.from({ length: numberOfPanes }, (_, index) => (
    <DashboardPane key={index} index={index} sizeX={paneWidth} sizeY={paneHeight} queryString={queryString} graphType = {graphType} parameters={parameters2} />
  ));

  return (
    <>
    <div className="dashboard-container flex wrap  h-full">
      {panes}
    </div>
    <div className="dashboard-container flex flex-wrap w-full h-full">
        {panes2}
    </div>
      </>
  );
};

export default Dashboard;