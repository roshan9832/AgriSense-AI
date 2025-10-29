import React, { useEffect, useRef } from 'react';
import * as L from 'leaflet';
import ReactDOMServer from 'react-dom/server';
import { WaterSourceIcon, WeatherStationIcon } from './Icons';

// Fix for default icon paths in Leaflet when used with bundlers
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
  iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
});


const farmData = {
    "type": "FeatureCollection",
    "features": [
        { 
            "type": "Feature", 
            "properties": { "name": "Wheat Field A", "crop": "Wheat" }, 
            "geometry": { "type": "Polygon", "coordinates": [ [ [ -0.09, 51.509 ], [ -0.09, 51.512 ], [ -0.08, 51.512 ], [ -0.08, 51.509 ], [ -0.09, 51.509 ] ] ] } 
        },
        { 
            "type": "Feature", 
            "properties": { "name": "Corn Plot 3", "crop": "Corn" }, 
            "geometry": { "type": "Polygon", "coordinates": [ [ [ -0.07, 51.51 ], [ -0.07, 51.513 ], [ -0.06, 51.513 ], [ -0.06, 51.51 ], [ -0.07, 51.51 ] ] ] } 
        },
        { 
            "type": "Feature", 
            "properties": { "name": "Soybean Field", "crop": "Soybean" }, 
            "geometry": { "type": "Polygon", "coordinates": [ [ [ -0.09, 51.505 ], [ -0.09, 51.507 ], [ -0.08, 51.507 ], [ -0.08, 51.505 ], [ -0.09, 51.505 ] ] ] } 
        },
        { 
            "type": "Feature", 
            "properties": { "name": "Vineyard", "crop": "Vineyard" }, 
            "geometry": { "type": "Polygon", "coordinates": [ [ [ -0.07, 51.505 ], [ -0.07, 51.507 ], [ -0.06, 51.507 ], [ -0.06, 51.505 ], [ -0.07, 51.505 ] ] ] } 
        }
    ]
};

const resources = {
    waterSource: { lat: 51.508, lng: -0.075 },
    weatherStation: { lat: 51.513, lng: -0.085 },
};

const getCropStyle = (crop: string) => {
    switch (crop) {
        case 'Wheat': return { color: '#fbbf24', fillColor: '#fde68a', weight: 2, opacity: 1, fillOpacity: 0.6 };
        case 'Corn': return { color: '#22c55e', fillColor: '#86efac', weight: 2, opacity: 1, fillOpacity: 0.6 };
        case 'Soybean': return { color: '#f97316', fillColor: '#fed7aa', weight: 2, opacity: 1, fillOpacity: 0.6 };
        case 'Vineyard': return { color: '#a855f7', fillColor: '#d8b4fe', weight: 2, opacity: 1, fillOpacity: 0.6 };
        default: return { color: '#6b7280', fillColor: '#d1d5db', weight: 2, opacity: 1, fillOpacity: 0.6 };
    }
};

const createCustomIcon = (iconComponent: React.ReactElement) => {
    return L.divIcon({
        html: ReactDOMServer.renderToString(iconComponent),
        className: 'bg-transparent border-0',
        iconSize: [32, 32],
        iconAnchor: [16, 32],
        popupAnchor: [0, -32]
    });
};

interface InteractiveMapProps {
    location: { lat: number, lon: number } | null;
}

const InteractiveMap: React.FC<InteractiveMapProps> = ({ location }) => {
    const mapContainerRef = useRef<HTMLDivElement>(null);
    const mapRef = useRef<L.Map | null>(null);

    useEffect(() => {
        if (mapContainerRef.current && !mapRef.current) {
            mapRef.current = L.map(mapContainerRef.current).setView([51.505, -0.09], 13);
            
            L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
                attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
            }).addTo(mapRef.current);

            // Add farm plots
            const geoJsonLayer = L.geoJSON(farmData as any, {
                style: (feature) => getCropStyle(feature?.properties.crop),
                onEachFeature: (feature, layer) => {
                    if (feature.properties && feature.properties.name) {
                        layer.bindPopup(`<strong>${feature.properties.name}</strong><br/>Crop: ${feature.properties.crop}`);
                    }
                }
            }).addTo(mapRef.current);
            mapRef.current.fitBounds(geoJsonLayer.getBounds());

            // Add resource markers
            const waterIcon = createCustomIcon(<div className="p-1 bg-white rounded-full shadow-lg"><WaterSourceIcon className="w-6 h-6 text-blue-500" /></div>);
            L.marker([resources.waterSource.lat, resources.waterSource.lng], { icon: waterIcon })
              .addTo(mapRef.current)
              .bindPopup('<b>Water Source</b><br/>Status: Active');

            const stationIcon = createCustomIcon(<div className="p-1 bg-white rounded-full shadow-lg"><WeatherStationIcon className="w-6 h-6 text-slate-600" /></div>);
            L.marker([resources.weatherStation.lat, resources.weatherStation.lng], { icon: stationIcon })
              .addTo(mapRef.current)
              .bindPopup('<b>Weather Station</b><br/>Real-time data');
        }

    }, []);

    useEffect(() => {
        if(mapRef.current && location) {
            // NOTE: The farm GeoJSON data is static and located in London.
            // In a real app, you would fetch data relevant to the user's location.
            // For this demo, we will center the map on the user's location.
            mapRef.current.setView([location.lat, location.lon], 13);

            // Add a marker for the user's location
            L.marker([location.lat, location.lon]).addTo(mapRef.current)
                .bindPopup('Your approximate location').openPopup();
        }
    }, [location]);

    return <div ref={mapContainerRef} className="h-96 md:h-[500px] w-full" />;
};

export default InteractiveMap;