import React, { useState, useEffect } from 'react';
import { MapContainer, TileLayer, CircleMarker, Tooltip, Marker, Polyline, useMap } from 'react-leaflet';
import L from 'leaflet';
import * as d3 from 'd3';
import 'leaflet/dist/leaflet.css';
import './App.css';

const indianPorts = [
  { name: "Jawaharlal Nehru Port", coordinates: [18.949915, 72.949723], location: "Mumbai" },
  { name: "Chennai Port", coordinates: [13.082032, 80.292016], location: "Chennai" },
  { name: "Kandla Port", coordinates: [23.002721, 70.218651], location: "Gujarat" },
  { name: "Cochin Port", coordinates: [9.966681, 76.271960], location: "Cochin" },
  { name: "New Mangalore Port", coordinates: [12.927278, 74.812275], location: "Mangalore" },
  { name: "Mormugao Port", coordinates: [15.411207, 73.799978], location: "Goa" },
];

function App() {
  const [selectedPort1, setSelectedPort1] = useState(null);
  const [selectedPort2, setSelectedPort2] = useState(null);
  const [curvedRoute, setCurvedRoute] = useState([]);
  const [zoomLevel, setZoomLevel] = useState(5);

  // Handle first port selection
  const handlePort1Select = (e) => {
    const portName = e.target.value;
    if (portName) {
      const selectedPort = indianPorts.find(port => port.name === portName);
      setSelectedPort1(selectedPort);
    }
  };

  // Handle second port selection
  const handlePort2Select = (e) => {
    const portName = e.target.value;
    if (portName) {
      const selectedPort = indianPorts.find(port => port.name === portName);
      setSelectedPort2(selectedPort);
    }
  };

  // Calculate curved route when two ports are selected
  useEffect(() => {
    if (selectedPort1 && selectedPort2) {
      const route = calculateCurvedRoute(selectedPort1.coordinates, selectedPort2.coordinates);
      setCurvedRoute(route);
    }
  }, [selectedPort1, selectedPort2]);

  // Function to calculate the curved route with intermediate points
  const calculateCurvedRoute = (coord1, coord2) => {
    const lat1 = coord1[0];
    const lon1 = coord1[1];
    const lat2 = coord2[0];
    const lon2 = coord2[1];

    // Midpoint between the two coordinates
    const midLat = (lat1 + lat2) / 2;
    const midLon = (lon1 + lon2) / 2;

    // Perpendicular vector (rotate the vector 90 degrees)
    const diffLat = lat2 - lat1;
    const diffLon = lon2 - lon1;
    const perpendicularLat = -diffLon;
    const perpendicularLon = diffLat;

    // Normalize and scale the perpendicular vector to move along it
    const magnitude = Math.sqrt(perpendicularLat ** 2 + perpendicularLon ** 2);
    const scaleFactor = 0.5;  // Adjust this factor to control the curve's height
    const thirdLat = midLat + (perpendicularLat / magnitude) * scaleFactor;
    const thirdLon = midLon + (perpendicularLon / magnitude) * scaleFactor;

    // Create points for the curved line using D3 curve generator
    const lineGenerator = d3.line()
      .x(d => d[1])  // Longitude
      .y(d => d[0])  // Latitude
      .curve(d3.curveBasis);  // Smooth curve

    const pathData = [[lat1, lon1], [thirdLat, thirdLon], [lat2, lon2]];
    
    // Return the path data points as intermediate coordinates
    return pathData;
  };

  // Custom divIcon to display text labels
  const createTextIcon = (text) => {
    return L.divIcon({
      html: `<div style="font-size: 12px; font-weight: bold; color: black; text-align: center;">${text}</div>`,
      className: 'text-label',
    });
  };

  // Component to track zoom level
  const ZoomListener = () => {
    const map = useMap();
    useEffect(() => {
      const handleZoom = () => setZoomLevel(map.getZoom());
      map.on('zoomend', handleZoom);
      return () => {
        map.off('zoomend', handleZoom);
      };
    }, [map]);
    return null;
  };

  return (
    <div className="App">
      <h1>Indian Sea Ports Map</h1>
      <div className="map-controls">
        <div>
          <label>Select Port 1: </label>
          <select onChange={handlePort1Select}>
            <option value="">Select a Port</option>
            {indianPorts.map((port, index) => (
              <option key={index} value={port.name}>{port.name}</option>
            ))}
          </select>
        </div>
        <div>
          <label>Select Port 2: </label>
          <select onChange={handlePort2Select}>
            <option value="">Select a Port</option>
            {indianPorts.map((port, index) => (
              <option key={index} value={port.name}>{port.name}</option>
            ))}
          </select>
        </div>
      </div>
      <MapContainer center={[20.5937, 78.9629]} zoom={5} style={{ height: "600px", width: "100%" }}>
        <TileLayer
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
        />
        <ZoomListener />
        {indianPorts.map((port, index) => (
          zoomLevel > 4 && ( // Show only if zoom level is greater than 6
            <React.Fragment key={index}>
              {/* Text Label Above the CircleMarker */}
              <Marker
                position={port.coordinates}
                icon={createTextIcon(port.name)} // Custom text icon for port name
              />

              {/* Red Circle Marker */}
              <CircleMarker
                center={port.coordinates}
                radius={8}
                fillColor="red"
                color="red"
                weight={1}
                fillOpacity={0.8}
              >
                <Tooltip direction="top" offset={[0, -8]} opacity={1}>
                  <span>{port.name}<br />Location: {port.location}</span>
                </Tooltip>
              </CircleMarker>
            </React.Fragment>
          )
        ))}
        {zoomLevel > 4 && curvedRoute.length > 0 && (
          <Polyline positions={curvedRoute} color="blue" weight={2} />
        )}
      </MapContainer>
    </div>
  );
}

export default App;
