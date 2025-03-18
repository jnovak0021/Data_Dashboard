import { CgProfile } from "react-icons/cg";
// import { FaHome,FaRunning} from "react-icons/fa";
// import {useRouter} from 'next/router';
// import {useState} from 'react';
// import Navbar from '@/components/Navbar'
import { FaHome, FaRunning } from "react-icons/fa";
import { useRouter } from 'next/router';
import { useState, useEffect, useRef } from 'react';
import mapboxgl from 'mapbox-gl';
import 'mapbox-gl/dist/mapbox-gl.css';

// Set your Mapbox access token
mapboxgl.accessToken = 'pk.eyJ1IjoibWF0dGhldy1zd2lmdCIsImEiOiJjbTdrenRyNmgwMnZ5Mmlva3IwMmMxMWMxIn0.p-4gdNL2HC8VqWHHJzUa0w';

// Mock data with photos and coordinates
const mockUserData = {
  recentWalks: [
    { id: 1, date: "2025-03-13", distance: "3.2 miles", duration: "45 min", photos: ["/walk1.jpg", "/walk2.jpg", "/walk3.jpg"], coordinates: [-122.4194, 37.7749] as [number, number], route: [[-122.4194, 37.7749], [-122.4184, 37.7759]] as [number, number][] },
    { id: 2, date: "2025-03-12", distance: "2.8 miles", duration: "38 min", photos: [], coordinates: [-122.4194, 37.7749] as [number, number], route: [] as [number, number][] },
  ],
  goals: {
    weeklyDistance: { target: "15 miles", current: "9.5 miles" },
    monthlyWalks: { target: "20", current: "12" },
  },
  friendsFeed: [
    { id: 1, user: "JaneDoe", type: "solo", distance: "4.1 miles", timestamp: "2 hours ago", photos: ["/friend1.jpg"], coordinates: [-122.4194, 37.7749] as [number, number], route: [[-122.4194, 37.7749], [-122.4204, 37.7739]] as [number, number][] },
    { id: 2, user: "JohnSmith", type: "group", distance: "3.8 miles", timestamp: "5 hours ago", photos: ["/group1.jpg", "/group2.jpg"], coordinates: [-122.4194, 37.7749] as [number, number], route: [] as [number, number][] },
  ]
};

const defaultPhoto = "/Default.jpg"; // Placeholder image

const HomePage = () => {
  const router = useRouter();
  const [page, setPage] = useState("Home");

  interface HandleRouteProps {
    pageIn: string;
  }

  const handleMapClick = () => {
    setPage("Map");
    handleRoute({ pageIn: "Map" });
  };

  const handleHomeClick = () => {
    setPage("Home");
    handleRoute({ pageIn: "Home" });
  };

  const handleProfileClick = () => {
    setPage("Profile");
    handleRoute({ pageIn: "Profile" });
  };

  const handleRoute = ({ pageIn }: HandleRouteProps) => {
    router.push("/" + pageIn);
  };

    // const handleHomeClick = () => {
    //     setPage("Home");
    //     handleRoute({pageIn: "/"})
    // }
    
    // const handleProfileClick = () => {
    //     setPage("Profile");
    //     handleRoute({ pageIn:  "Profile"});
    // }
  // Carousel component with Mapbox
  const PhotoCarousel = ({ photos, coordinates, route }: { photos: string[], coordinates: [number, number], route: [number, number][] }) => {
    const [currentPhoto, setCurrentPhoto] = useState(0);
    const mapContainer = useRef<HTMLDivElement>(null);
    const map = useRef<mapboxgl.Map | null>(null);
    const photosToShow = photos.length > 0 ? photos : [defaultPhoto];

    useEffect(() => {
      if (photosToShow.length > 1) {
        const timer = setInterval(() => {
          setCurrentPhoto((prev) => (prev + 1) % photosToShow.length);
        }, 4000);
        return () => clearInterval(timer);
      }
    }, [photosToShow.length]);

    useEffect(() => {
      if (mapContainer.current && !map.current) {
        map.current = new mapboxgl.Map({
          container: mapContainer.current,
          style: 'mapbox://styles/mapbox/streets-v11',
          center: coordinates,
          zoom: 12,
          // Removed interactive: false to enable scrolling/panning
        });

        // Add navigation control for zooming
        map.current.addControl(new mapboxgl.NavigationControl(), 'top-right');

        // Add route if available
        if (route.length > 0) {
          map.current.on('load', () => {
            if (!map.current) return;
            map.current.addSource('route', {
              type: 'geojson',
              data: {
                type: 'Feature',
                properties: {},
                geometry: {
                  type: 'LineString',
                  coordinates: route
                }
              }
            });

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
        } else {
          // Add marker if no route
          map.current.on('load', () => {
            if (!map.current) return;
            new mapboxgl.Marker()
              .setLngLat(coordinates)
              .addTo(map.current);
          });
        }
      }

      return () => {
        if (map.current) {
          map.current.remove();
          map.current = null;
        }
      };
    }, [coordinates, route]);

    return (
        // <div className=" bg-background text w-full h-screen flex items-center flex-col p-0">
        //     <Navbar />
        //     <div className="flex-grow flex justify-center items-center">
        //         Home Page
        //     </div>
        //     <div>
      <div className="flex w-full max-w-[700px] mx-auto" style={{ marginLeft: '350px' }}>
        <div className="relative w-[300px] h-[350px] bg-gray-200 overflow-hidden">
          <img 
            src={photosToShow[currentPhoto]} 
            alt="Walk photo" 
            className="w-full h-full object-cover object-center"
          />
          {photosToShow.length > 1 && (
            <div className="absolute bottom-2 left-1/2 transform -translate-x-1/2 flex space-x-1">
              {photosToShow.map((_, index) => (
                <div 
                  key={index} 
                  className={`w-2 h-2 rounded-full ${index === currentPhoto ? 'bg-white' : 'bg-gray-400'}`}
                />
              ))}
            </div>
          )}
        </div>
        <div 
          ref={mapContainer} 
          className="w-[300px] h-[350px] ml-8" // Increased from ml-4 to ml-8
        />
      </div>
    );
  };

  return (
    <div className="bg-background text-black w-screen h-screen flex flex-col overflow-hidden">
      {/* Navigation Bar */}
      <div className="w-full bg-mainPink text-4xl font-bold text-white h-16 flex justify-between items-center p-4 fixed top-0 z-10">
        <div className="flex space-x-4">
          <FaHome onClick={handleHomeClick} className="cursor-pointer" />
          <FaRunning onClick={handleMapClick} className="cursor-pointer" />
          <CgProfile onClick={handleProfileClick} className="cursor-pointer" />
        </div>
      </div>

      {/* Main Content - Instagram-style Feed */}
      <div className="w-full h-full overflow-y-auto mt-16">
        {/* Combined Feed */}
        <section className="w-full">
          {/* Your Stats Card */}
          <div className="p-4 border-b bg-white">
            <h2 className="text-xl font-semibold mb-2">Your Stats</h2>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="font-medium">Weekly Distance</p>
                <p>{mockUserData.goals.weeklyDistance.current} / {mockUserData.goals.weeklyDistance.target}</p>
                <div className="w-full bg-gray-200 rounded-full h-2.5 mt-1">
                  <div 
                    className="bg-mainPink h-2.5 rounded-full" 
                    style={{ width: `${(parseFloat(mockUserData.goals.weeklyDistance.current) / parseFloat(mockUserData.goals.weeklyDistance.target)) * 100}%` }}
                  />
                </div>
              </div>
              <div>
                <p className="font-medium">Monthly Walks</p>
                <p>{mockUserData.goals.monthlyWalks.current} / {mockUserData.goals.monthlyWalks.target}</p>
              </div>
            </div>
          </div>

          {/* Feed Items */}
          {[...mockUserData.recentWalks, ...mockUserData.friendsFeed]
            .sort((a, b) => {
              const dateA = new Date('date' in a ? a.date : a.timestamp).getTime();
              const dateB = new Date('date' in b ? b.date : b.timestamp).getTime();
              return dateB - dateA;
            })
            .map((item) => (
              <div key={item.id} className="border-b bg-white">
                <div className="p-4 flex items-center">
                  <div className="w-10 h-10 bg-mainPink rounded-full mr-3" />
                  <div>
                    <p className="font-semibold">
                      {"user" in item ? item.user : "You"} {"type" in item && item.type === "group" ? "led a group walk" : "went for a walk"}
                    </p>
                    <p className="text-sm text-gray-600">{'timestamp' in item ? item.timestamp : item.date}</p>
                  </div>
                </div>
                <PhotoCarousel photos={item.photos} coordinates={item.coordinates} route={item.route} />
                <div className="p-4">
                  <p>Distance: {item.distance}</p>
                  {"duration" in item && <p>Duration: {item.duration}</p>}
                </div>
              </div>
            ))}
        </section>
      </div>
    </div>
  );
};

export default HomePage;