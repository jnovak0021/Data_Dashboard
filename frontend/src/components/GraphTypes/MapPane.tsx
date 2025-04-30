import React, { useRef, useEffect, useState, useCallback } from 'react';
import mapboxgl from 'mapbox-gl';
import 'mapbox-gl/dist/mapbox-gl.css';
import { CiCircleMinus } from "react-icons/ci";

mapboxgl.accessToken = "pk.eyJ1IjoiY3dpbHNvbjAwMjMiLCJhIjoiY21hNDluNXoxMDJ0cDJqb28wYndtaHo5ayJ9.NTF-BW2mPhVsGNujBeYPoA";

interface MapPaneProps {
  markerDataUrl?: string;
  initialCoordinates?: [number, number];
  initialZoom?: number;
  className?: string;
  onDelete?: () => void;
}

const MapPane: React.FC<MapPaneProps> = ({
  markerDataUrl,
  initialCoordinates = [0, 0],
  initialZoom = 2,
  className = "",
  onDelete
}) => {
  const mapContainer = useRef<HTMLDivElement>(null);
  const mapInstance = useRef<mapboxgl.Map | null>(null);
  const [mapInitialized, setMapInitialized] = useState(false);

  const initializeMap = useCallback(() => {
    if (!mapContainer.current || mapInstance.current) return;

    const map = new mapboxgl.Map({
      container: mapContainer.current,
      style: 'mapbox://styles/mapbox/satellite-streets-v12',
      center: initialCoordinates,
      zoom: initialZoom,
      projection: 'mercator',
      antialias: true,
    });

    map.addControl(new mapboxgl.NavigationControl());

    map.on('style.load', () => {
      map.setPaintProperty('background', 'background-color', 'rgba(0, 0, 0, 0)');
      setMapInitialized(true);
      setTimeout(() => map.resize(), 100);
    });

    mapInstance.current = map;
  }, [initialCoordinates, initialZoom]);

  const loadMarkerData = useCallback(async () => {
    if (!markerDataUrl || !mapInstance.current) return;

    try {
      const response = await fetch(markerDataUrl);
      if (!response.ok) throw new Error(`Failed to fetch marker data: ${response.statusText}`);

      const jsonData = await response.json();
      if (!Array.isArray(jsonData)) {
        console.error("Expected JSON array");
        return;
      }

      const map = mapInstance.current;

      jsonData.forEach((item) => {
        const lng = item.Longitude ?? item.longitude ?? item.lng;
        const lat = item.Latitude ?? item.latitude ?? item.lat;
        const value = item.Value ?? item.value ?? item.val;

        if (lng != null && lat != null) {
          const el = document.createElement('div');
          el.className = 'mapbox-red-dot';

          const popup = new mapboxgl.Popup({ offset: 25 }).setHTML(
            `<strong>Value:</strong> ${value ?? 'N/A'}<br/><strong>Lat:</strong> ${lat}<br/><strong>Lng:</strong> ${lng}`
          );

          new mapboxgl.Marker({ element: el })
            .setLngLat([lng, lat])
            .setPopup(popup)
            .addTo(map!);
        }
      });
    } catch (error) {
      console.error("Error loading marker data:", error);
    }
  }, [markerDataUrl]);

  useEffect(() => {
    const timer = setTimeout(() => {
      initializeMap();
    }, 100);

    return () => {
      clearTimeout(timer);
      if (mapInstance.current) {
        mapInstance.current.remove();
        mapInstance.current = null;
        setMapInitialized(false);
      }
    };
  }, [initializeMap]);

  useEffect(() => {
    if (mapInitialized && markerDataUrl) {
      loadMarkerData();
    }
  }, [mapInitialized, markerDataUrl, loadMarkerData]);

  useEffect(() => {
    if (!mapInstance.current) return;

    const handleResize = () => {
      if (mapInstance.current && mapContainer.current) {
        try {
          mapInstance.current.resize();
        } catch (err) {
          console.warn("Map resize error:", err);
        }
      }
    };

    let resizeTimeout: NodeJS.Timeout;
    const debouncedResize = () => {
      clearTimeout(resizeTimeout);
      resizeTimeout = setTimeout(handleResize, 200);
    };

    window.addEventListener('resize', debouncedResize);
    debouncedResize();

    return () => {
      window.removeEventListener('resize', debouncedResize);
      clearTimeout(resizeTimeout);
    };
  }, [mapInitialized]);

  const containerClassName = `group w-full h-full rounded-lg overflow-hidden relative ${className}`;

  return (
    <div className={containerClassName} style={{ height: "100%", width: "100%" }}>
      {onDelete && (
        <button
          className="btn-delete absolute top-2 right-2 z-50 bg-red-500 hover:bg-red-700 text-white rounded-full p-1 transition-all opacity-0 group-hover:opacity-100"
          onClick={onDelete}
          aria-label="Delete map pane"
        >
          <CiCircleMinus size={20} />
        </button>
      )}
      <div ref={mapContainer} className="absolute inset-0" style={{ position: "absolute", width: "100%", height: "100%" }} />
      {!mapInitialized && (
        <div className="absolute inset-0 flex items-center justify-center bg-gray-100 bg-opacity-75">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
        </div>
      )}
      <style jsx>{`
        .mapbox-red-dot {
          width: 10px;
          height: 10px;
          background-color: red;
          border-radius: 50%;
          box-shadow: 0 0 4px rgba(255, 0, 0, 0.8);
          cursor: pointer;
        }
      `}</style>
    </div>
  );
};

export default MapPane;
