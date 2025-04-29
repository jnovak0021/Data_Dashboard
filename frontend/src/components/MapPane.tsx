import React, { useRef, useEffect, useState } from 'react';
import mapboxgl from 'mapbox-gl';
import 'mapbox-gl/dist/mapbox-gl.css';

// Use the Mapbox token from your Globe.tsx
mapboxgl.accessToken = "pk.eyJ1IjoiY3dpbHNvbjAwMjMiLCJhIjoiY205eXlpbnUzMW8wdjJqcHZpZ2RnamhwcyJ9.r5-grC6pZa0oSWVYvABYWw";

const MapPane: React.FC = () => {
  const mapContainer = useRef<HTMLDivElement>(null);
  const [map, setMap] = useState<mapboxgl.Map | null>(null);
  const [mapInitialized, setMapInitialized] = useState(false);

  useEffect(() => {
    if (mapContainer.current && !map) {
      console.log("Initializing map...");
      
      // Create the map instance
      const mapInstance = new mapboxgl.Map({
        container: mapContainer.current,
        style: 'mapbox://styles/mapbox/satellite-streets-v12',
        center: [0, 0],
        zoom: 2,
        projection: 'globe', // Use globe projection like in Globe.tsx
        antialias: true,
      });

      // Add navigation controls
      mapInstance.addControl(new mapboxgl.NavigationControl());

      // Make background transparent (from Globe.tsx)
      mapInstance.on('style.load', () => {
        mapInstance.setPaintProperty('background', 'background-color', 'rgba(0, 0, 0, 0)');
        console.log("Map style loaded");
        setMapInitialized(true);
      });

      // Save map instance to state
      setMap(mapInstance);

      return () => {
        mapInstance.remove();
        setMap(null);
        setMapInitialized(false);
      };
    }
  }, [map]);

  // Add resize handler to ensure map renders correctly
  useEffect(() => {
    const handleResize = () => {
      if (map) {
        map.resize();
      }
    };

    window.addEventListener('resize', handleResize);
    
    // Also trigger resize when component mounts to ensure proper sizing
    handleResize();

    return () => {
      window.removeEventListener('resize', handleResize);
    };
  }, [map]);

  return (
    <div className="w-full h-full rounded-lg overflow-hidden relative">
      <div ref={mapContainer} className="absolute inset-0" />
      {!mapInitialized && (
        <div className="absolute inset-0 flex items-center justify-center bg-gray-100 bg-opacity-75">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
        </div>
      )}
    </div>
  );
};

export default MapPane;