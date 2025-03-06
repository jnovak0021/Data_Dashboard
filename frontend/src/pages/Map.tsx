import React, { useState, useEffect, useRef } from 'react';
import mapboxgl from 'mapbox-gl';
import 'mapbox-gl/dist/mapbox-gl.css';

// You'll need to replace with your MapBox access token
mapboxgl.accessToken = 'pk.eyJ1IjoibWF0dGhldy1zd2lmdCIsImEiOiJjbTdrenRyNmgwMnZ5Mmlva3IwMmMxMWMxIn0.p-4gdNL2HC8VqWHHJzUa0w';

// Type definitions
type Coordinate = [number, number]; // [longitude, latitude]

interface WalkStats {
  distance: number; // in meters
  duration: number; // in seconds
  pace: number; // in minutes per kilometer
}

const Map: React.FC = () => {
  // State for tracking walk
  const [isTracking, setIsTracking] = useState<boolean>(false);
  const [locationHistory, setLocationHistory] = useState<Coordinate[]>([]);
  const [currentLocation, setCurrentLocation] = useState<Coordinate | null>(null);
  const [stats, setStats] = useState<WalkStats>({
    distance: 0,
    duration: 0,
    pace: 0,
  });
  const [error, setError] = useState<string | null>(null);
  
  // Refs
  const mapContainer = useRef<HTMLDivElement>(null);
  const map = useRef<mapboxgl.Map | null>(null);
  const watchId = useRef<number | null>(null);
  const startTime = useRef<number | null>(null);
  const routeSource = useRef<mapboxgl.GeoJSONSource | null>(null);
  const statsInterval = useRef<number | null>(null);
  
  // Initialize map
  useEffect(() => {
    if (map.current) return; // Map already initialized
    
    if (!mapContainer.current) return; // Safety check
    
    map.current = new mapboxgl.Map({
      container: mapContainer.current,
      style: 'mapbox://styles/mapbox/streets-v11',
      zoom: 15
    });

    // Add user location marker and controls
    map.current.addControl(new mapboxgl.NavigationControl(), 'top-right');
    
    // Initialize the GeoJSON source for the route
    map.current.on('load', () => {
      if (!map.current) return;
      
      map.current.addSource('route', {
        type: 'geojson',
        data: {
          type: 'Feature',
          properties: {},
          geometry: {
            type: 'LineString',
            coordinates: []
          }
        }
      });
      
      routeSource.current = map.current.getSource('route') as mapboxgl.GeoJSONSource;
      
      map.current.addLayer({
        id: 'route',
        type: 'line',
        source: 'route',
        layout: {
          'line-join': 'round',
          'line-cap': 'round'
        },
        paint: {
          'line-color': '#ff4400',
          'line-width': 5
        }
      });
    });
    map.current.addControl(
      new mapboxgl.GeolocateControl({
          positionOptions: {
              enableHighAccuracy: true
          },
          // When active the map will receive updates to the device's location as it changes.
          trackUserLocation: true,
          // Draw an arrow next to the location dot to indicate which direction the device is heading.
          showUserHeading: true
      })
  );
    
    // Get initial user location
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position: GeolocationPosition) => {
          const { longitude, latitude } = position.coords;
          setCurrentLocation([longitude, latitude]);
          if (map.current) {
            map.current.setCenter([longitude, latitude]);
          }
        },
        (error: GeolocationPositionError) => {
          setError(`Error getting location: ${error.message}`);
        },
        { enableHighAccuracy: true }
      );
    } else {
      setError('Geolocation is not supported by your browser');
    }
    
    return () => {
      if (map.current) {
        map.current.remove();
        map.current = null;
      }
    };
  }, []);
  
  // Calculate distance between two points using Haversine formula
  const calculateDistance = (lon1: number, lat1: number, lon2: number, lat2: number): number => {
    const R = 6371e3; // Earth's radius in meters
    const φ1 = lat1 * Math.PI / 180;
    const φ2 = lat2 * Math.PI / 180;
    const Δφ = (lat2 - lat1) * Math.PI / 180;
    const Δλ = (lon2 - lon1) * Math.PI / 180;

    const a = Math.sin(Δφ / 2) * Math.sin(Δφ / 2) +
              Math.cos(φ1) * Math.cos(φ2) *
              Math.sin(Δλ / 2) * Math.sin(Δλ / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

    return R * c; // distance in meters
  };
  
  // Update stats based on location history
  const updateStats = (): void => {
    if (!startTime.current || locationHistory.length < 2) return;
    
    // Calculate total distance
    let totalDistance = 0;
    for (let i = 1; i < locationHistory.length; i++) {
      const prevLoc = locationHistory[i - 1];
      const currLoc = locationHistory[i];
      totalDistance += calculateDistance(
        prevLoc[0], prevLoc[1],
        currLoc[0], currLoc[1]
      );
    }
    
    // Calculate duration in seconds
    const duration = (Date.now() - startTime.current) / 1000;
    
    // Calculate pace (minutes per km)
    // Only calculate if we've moved at least 10 meters to avoid division by zero or unreliable small distances
    let pace = 0;
    if (totalDistance > 10) {
      pace = (duration / 60) / (totalDistance / 1000);
    }
    
    setStats({
      distance: totalDistance,
      duration: duration,
      pace: pace
    });
  };
  
  // Start tracking walk
  const startWalk = (): void => {
    if (isTracking) return;
    
    setIsTracking(true);
    setLocationHistory([]);
    setStats({
      distance: 0,
      duration: 0,
      pace: 0
    });
    
    startTime.current = Date.now();
    
    // Update route on map
    if (routeSource.current) {
      routeSource.current.setData({
        type: 'Feature',
        properties: {},
        geometry: {
          type: 'LineString',
          coordinates: []
        }
      });
    }
    
    
    // Start watching position
    if (navigator.geolocation) {
      console.log("we are in here.");
    
      console.log(navigator.geolocation);

      watchId.current = navigator.geolocation.watchPosition(
        (position: GeolocationPosition) => {
          const { longitude, latitude } = position.coords;
          const newLocation: Coordinate = [longitude, latitude];
          
          setCurrentLocation(newLocation);
          setLocationHistory(prevHistory => {
            const newHistory = [...prevHistory, newLocation];
            
            // Update the route on the map
            if (routeSource.current) {
              routeSource.current.setData({
                type: 'Feature',
                properties: {},
                geometry: {
                  type: 'LineString',
                  coordinates: newHistory
                }
              });
            }
            
            return newHistory;
          });
        },
        (error: GeolocationPositionError) => {
          setError(`Error tracking location: ${error.message}`);
          stopWalk();
        },
        { 
          enableHighAccuracy: true,
          maximumAge: 0,
          timeout: 5000
        }
      );
      
      // Update stats every second
      statsInterval.current = window.setInterval(updateStats, 1000);
    } else {
      setError('Geolocation is not supported by your browser');
    }
  };
  
  // Stop tracking walk
  const stopWalk = (): void => {
    if (!isTracking) return;
    
    setIsTracking(false);
    
    // Stop watching position
    if (watchId.current !== null) {
      navigator.geolocation.clearWatch(watchId.current);
      watchId.current = null;
    }
    
    // Clear stats interval
    if (statsInterval.current !== null) {
      window.clearInterval(statsInterval.current);
      statsInterval.current = null;
    }
    
    // Final stats update
    updateStats();
  };
  
  // Format distance for display
  const formatDistance = (meters: number): string => {
    if (meters < 1000) {
      return `${Math.round(meters)} m`;
    } else {
      return `${(meters / 1000).toFixed(2)} km`;
    }
  };
  
  // Format duration for display (MM:SS)
  const formatDuration = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };
  
  // Format pace for display (MM:SS per km)
  const formatPace = (minsPerKm: number): string => {
    if (!isFinite(minsPerKm) || minsPerKm === 0) return '0:00';
    
    const mins = Math.floor(minsPerKm);
    const secs = Math.floor((minsPerKm - mins) * 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };
  
  return (
    <div className="walk-tracker">
      <div 
        ref={mapContainer} 
        className="map-container" 
        style={{ width: '100%', height: '400px' }}
      />
      
      {error && (
        <div className="error-message">
          {error}
        </div>
      )}
      
      <div className="stats-container">
        <div className="stat">
          <h3>Distance</h3>
          <p>{formatDistance(stats.distance)}</p>
        </div>
        <div className="stat">
          <h3>Duration</h3>
          <p>{formatDuration(stats.duration)}</p>
        </div>
        <div className="stat">
          <h3>Pace</h3>
          <p>{formatPace(stats.pace)} min/km</p>
        </div>
      </div>
      
      <div className="controls">
        {!isTracking ? (
          <button 
            className="start-button"
            onClick={startWalk}
          >
            Start Walk
          </button>
        ) : (
          <button 
            className="stop-button"
            onClick={stopWalk}
          >
            Stop Walk
          </button>
        )}
      </div>
    </div>
  );
};

export default Map;