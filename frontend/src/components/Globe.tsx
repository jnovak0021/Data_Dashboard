import React, { useRef, useEffect } from "react";
import mapboxgl from "mapbox-gl";
import "mapbox-gl/dist/mapbox-gl.css";
import Papa from "papaparse";

const Globe: React.FC = () => {
   const mapContainerRef = useRef<HTMLDivElement>(null);
   const mapRef = useRef<mapboxgl.Map | null>(null);

   useEffect(() => {
      if (mapContainerRef.current && !mapRef.current) {
         mapboxgl.accessToken = "pk.eyJ1IjoiY3dpbHNvbjAwMjMiLCJhIjoiY21hNDluNXoxMDJ0cDJqb28wYndtaHo5ayJ9.NTF-BW2mPhVsGNujBeYPoA";

         const map = new mapboxgl.Map({
            container: mapContainerRef.current,
            style: "mapbox://styles/mapbox/satellite-streets-v12",
            center: [0, 0],
            zoom: 2,
            projection: "globe",
            antialias: true,
         });

         mapRef.current = map;

         // Make background transparent
         map.on("style.load", () => {
            map.setPaintProperty("background", "background-color", "rgba(0, 0, 0, 0)");
         });

         // Add navigation controls
         map.addControl(new mapboxgl.NavigationControl());

         // Load and parse CSV data
         fetch("/path/to/reputation.csv")
            .then(response => response.text())
            .then(csvText => {
               Papa.parse(csvText, {
                  header: true,
                  complete: (results) => {
                     const data = results.data as { Latitude: string, Longitude: string }[];
                     const markerData: [number, number][] = data
                        .filter(row => row.Latitude && row.Longitude)
                        .map(row => [parseFloat(row.Longitude), parseFloat(row.Latitude)]);

                     // Add markers to the map
                     markerData.forEach(coord => {
                        new mapboxgl.Marker()
                           .setLngLat(coord)
                           .addTo(map);
                     });
                  }
               });
            });

         return () => {
            map.remove();
            mapRef.current = null;
         };
      }
   }, []);

   return <div id="map-container" ref={mapContainerRef} className="absolute top-0 left-0 w-full h-full" />;
};

export default Globe;