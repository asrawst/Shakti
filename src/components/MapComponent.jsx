import React, { useEffect, useRef, useState } from 'react';

const MapComponent = ({ data }) => {
    const mapRef = useRef(null);
    const googleMapRef = useRef(null);
    const markersRef = useRef([]);
    const [error, setError] = useState(null);

    // Filter and process data
    const getUniqueConsumers = (data) => {
        if (!data || !data.results) return [];
        const uniqueConsumers = {};
        data.results.forEach(item => {
            if (!uniqueConsumers[item.consumer_id]) {
                uniqueConsumers[item.consumer_id] = item;
            } else {
                if (item.aggregate_risk_score > uniqueConsumers[item.consumer_id].aggregate_risk_score) {
                    uniqueConsumers[item.consumer_id] = item;
                }
            }
        });
        return Object.values(uniqueConsumers);
    };

    useEffect(() => {
        // Wait for window.google to be available (injected by Requestly)
        const checkForGoogleMaps = () => {
            if (window.google && window.google.maps) {
                initializeMap();
            } else {
                // Poll for a brief moment in case script injection is slightly delayed
                setTimeout(checkForGoogleMaps, 500);
            }
        };

        checkForGoogleMaps();

        return () => {
            // Cleanup markers
            markersRef.current.forEach(marker => marker.setMap(null));
        };
    }, []);

    const initializeMap = () => {
        if (!mapRef.current) return;
        if (googleMapRef.current) return; // Already initialized

        try {
            googleMapRef.current = new window.google.maps.Map(mapRef.current, {
                center: { lat: 28.6139, lng: 77.2090 }, // New Delhi Center
                zoom: 11,
                mapTypeControl: false, // Disable Map/Satellite toggle
                streetViewControl: false, // Disable Street View
                restriction: {
                    latLngBounds: {
                        north: 28.90,
                        south: 28.40,
                        east: 77.40,
                        west: 76.80,
                    },
                    strictBounds: false,
                },
                styles: [
                    // Dark theme style to match the app
                    { elementType: "geometry", stylers: [{ color: "#242f3e" }] },
                    { elementType: "labels.text.stroke", stylers: [{ color: "#242f3e" }] },
                    { elementType: "labels.text.fill", stylers: [{ color: "#746855" }] },
                    {
                        featureType: "administrative.locality",
                        elementType: "labels.text.fill",
                        stylers: [{ color: "#d59563" }],
                    },
                    {
                        featureType: "poi",
                        elementType: "labels.text.fill",
                        stylers: [{ color: "#d59563" }],
                    },
                    {
                        featureType: "poi.park",
                        elementType: "geometry",
                        stylers: [{ color: "#263c3f" }],
                    },
                    {
                        featureType: "water",
                        elementType: "geometry",
                        stylers: [{ color: "#17263c" }],
                    },
                ]
            });

            // Add markers
            updateMarkers();
        } catch (err) {
            console.error("Error initializing Google Map:", err);
            setError("Google Maps API loaded but initialization failed.");
        }
    };

    const updateMarkers = () => {
        if (!googleMapRef.current) return;

        // Clear existing
        markersRef.current.forEach(marker => marker.setMap(null));
        markersRef.current = [];

        const consumers = getUniqueConsumers(data);

        consumers.forEach(item => {
            const lat = parseFloat(item.latitude);
            const lng = parseFloat(item.longitude);
            if (isNaN(lat) || isNaN(lng)) return;

            let color = '#ef4444'; // Red for critical
            const risk = (item.risk_class || '').toLowerCase();

            // Filter: Only show critical/theft and mild cases
            if (risk !== 'theft' && risk !== 'critical' && risk !== 'mild') {
                return;
            }

            if (risk === 'mild') {
                color = '#eab308'; // Yellow for mild
            }

            // Create a simple SVG marker
            const svgMarker = {
                path: window.google.maps.SymbolPath.CIRCLE,
                fillColor: color,
                fillOpacity: 0.8,
                strokeWeight: 2,
                strokeColor: "white",
                scale: 8,
            };

            const marker = new window.google.maps.Marker({
                position: { lat, lng },
                map: googleMapRef.current,
                icon: svgMarker,
                title: `Consumer: ${item.consumer_id} (${item.risk_class})`
            });

            // InfoWindow
            const infoWindow = new window.google.maps.InfoWindow({
                content: `
                    <div style="color: black; padding: 5px;">
                        <strong>ID: ${item.consumer_id}</strong><br/>
                        Risk: ${((item.aggregate_risk_score || 0) * 100).toFixed(0)}%
                    </div>
                `
            });

            marker.addListener("click", () => {
                infoWindow.open(googleMapRef.current, marker);
            });

            markersRef.current.push(marker);
        });
    };

    // Update markers if data changes after map init
    useEffect(() => {
        if (googleMapRef.current) {
            updateMarkers();
        }
    }, [data]);

    return (
        <div style={{
            height: '400px',
            width: '100%',
            borderRadius: '16px',
            overflow: 'hidden',
            marginTop: '2rem',
            marginBottom: '4rem',
            border: '1px solid rgba(255, 255, 255, 0.1)',
            boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
            position: 'relative'
        }}>
            <div ref={mapRef} style={{ width: '100%', height: '100%' }} />

            {/* Fallback/Loading message if API isn't injected yet */}
            {!window.google && !error && (
                <div style={{
                    position: 'absolute',
                    top: 0,
                    left: 0,
                    right: 0,
                    bottom: 0,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    background: '#0f172a',
                    color: 'rgba(255,255,255,0.7)',
                    zIndex: 1
                }}>
                    Waiting for Google Maps (Requestly)...
                </div>
            )}
        </div>
    );
};

export default MapComponent;
