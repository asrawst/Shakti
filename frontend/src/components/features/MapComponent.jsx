import React, { useEffect, useState, useMemo } from 'react';
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';

// Fix for default marker icons in React Leaflet
import icon from 'leaflet/dist/images/marker-icon.png';
import iconShadow from 'leaflet/dist/images/marker-shadow.png';

let DefaultIcon = L.icon({
    iconUrl: icon,
    shadowUrl: iconShadow,
    iconSize: [25, 41],
    iconAnchor: [12, 41],
    popupAnchor: [1, -34],
    shadowSize: [41, 41]
});

L.Marker.prototype.options.icon = DefaultIcon;

// Custom Icons for different risk levels
const createCustomIcon = (color) => {
    return new L.DivIcon({
        className: 'custom-marker',
        html: `<div style="background-color: ${color}; width: 14px; height: 14px; border-radius: 50%; border: 2px solid white; box-shadow: 0 0 4px rgba(0,0,0,0.3);"></div>`,
        iconSize: [14, 14],
        iconAnchor: [7, 7],
        popupAnchor: [0, -10]
    });
};

const redIcon = createCustomIcon('#ef4444');   // Critical
const orangeIcon = createCustomIcon('#f97316'); // High
const greenIcon = createCustomIcon('#10b981');  // Normal (if needed)

const MapComponent = ({ data }) => {
    const [center, setCenter] = useState([28.6139, 77.2090]); // Default New Delhi

    // Filter and process data
    const markers = useMemo(() => {
        if (!data || !data.results) return [];

        const uniqueConsumers = {};
        data.results.forEach(item => {
            // Keep the detection with highest risk for each consumer
            if (!uniqueConsumers[item.consumer_id]) {
                uniqueConsumers[item.consumer_id] = item;
            } else {
                if ((item.aggregate_risk_score || 0) > (uniqueConsumers[item.consumer_id].aggregate_risk_score || 0)) {
                    uniqueConsumers[item.consumer_id] = item;
                }
            }
        });

        // Convert to array and filter valid coordinates
        return Object.values(uniqueConsumers)
            .filter(item => {
                const lat = parseFloat(item.latitude);
                const lng = parseFloat(item.longitude);
                // Basic validation for lat/long range
                return !isNaN(lat) && !isNaN(lng) && lat >= -90 && lat <= 90 && lng >= -180 && lng <= 180;
            })
            .map(item => {
                const risk = (item.risk_class || '').toLowerCase();
                let icon = greenIcon;
                if (risk === 'critical') icon = redIcon;
                else if (risk === 'high') icon = orangeIcon;

                // Only showing Critical and High as per previous logic, but let's show all if valid coords?
                // Logic preserved: show Critical and High primarily if we want to focus on theft.
                // But generally a map shows everything. Let's filter like before to keep it clean?
                // The previous code filtered: if (risk !== 'critical' && risk !== 'high') return;

                // Let's keep that filter for now to match the "Theft Detection" focus
                if (risk !== 'critical' && risk !== 'high') return null;

                return {
                    ...item,
                    lat: parseFloat(item.latitude),
                    lng: parseFloat(item.longitude),
                    icon: icon
                };
            })
            .filter(Boolean); // Remove nulls
    }, [data]);

    // Update center based on first marker if available
    useEffect(() => {
        if (markers.length > 0) {
            setCenter([markers[0].lat, markers[0].lng]);
        }
    }, [markers]);

    return (
        <div style={{
            height: '450px',
            width: '100%',
            borderRadius: '16px',
            overflow: 'hidden',
            marginTop: '2rem',
            marginBottom: '4rem',
            border: '1px solid rgba(255, 255, 255, 0.1)',
            boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
            position: 'relative',
            zIndex: 0 // Ensure it doesn't overlap incorrectly
        }}>
            <MapContainer
                center={center}
                zoom={11}
                scrollWheelZoom={false}
                style={{ height: '100%', width: '100%', background: '#242f3e' }}
            >
                <TileLayer
                    attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>'
                    url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"
                />

                {markers.map((item) => (
                    <Marker
                        key={item.consumer_id}
                        position={[item.lat, item.lng]}
                        icon={item.icon}
                    >
                        <Popup className="custom-popup">
                            <div style={{ color: '#1e293b' }}>
                                <strong>ID: {item.consumer_id}</strong><br />
                                Risk: {((item.aggregate_risk_score || 0) * 100).toFixed(0)}%<br />
                                <span style={{ textTransform: 'capitalize', color: item.risk_class === 'critical' ? '#ef4444' : '#f97316' }}>
                                    {item.risk_class}
                                </span>
                            </div>
                        </Popup>
                    </Marker>
                ))}
            </MapContainer>
        </div>
    );
};

export default MapComponent;
