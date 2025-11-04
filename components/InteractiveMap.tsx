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

const soilMoistureData = {
    "type": "FeatureCollection",
    "features": [
        {
            "type": "Feature",
            "properties": { "moistureLevel": "Dry" },
            "geometry": { "type": "Polygon", "coordinates": [ [ [ -0.09, 51.509 ], [ -0.08, 51.509 ], [ -0.085, 51.505 ], [ -0.09, 51.505 ], [ -0.09, 51.509 ] ] ] }
        },
        {
            "type": "Feature",
            "properties": { "moistureLevel": "Optimal" },
            "geometry": { "type": "Polygon", "coordinates": [ [ [ -0.08, 51.512 ], [ -0.07, 51.513 ], [ -0.065, 51.51 ], [ -0.08, 51.509 ], [ -0.08, 51.512 ] ] ] }
        },
        {
            "type": "Feature",
            "properties": { "moistureLevel": "Wet" },
            "geometry": { "type": "Polygon", "coordinates": [ [ [ -0.07, 51.507 ], [ -0.06, 51.507 ], [ -0.06, 51.505 ], [ -0.07, 51.505 ], [ -0.07, 51.507 ] ] ] }
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

const getMoistureStyle = (level: string) => {
    switch (level) {
        case 'Dry': return { color: '#f59e0b', fillColor: '#fcd34d', weight: 1, opacity: 0.8, fillOpacity: 0.5 };
        case 'Optimal': return { color: '#16a34a', fillColor: '#4ade80', weight: 1, opacity: 0.8, fillOpacity: 0.5 };
        case 'Wet': return { color: '#0284c7', fillColor: '#38bdf8', weight: 1, opacity: 0.8, fillOpacity: 0.5 };
        default: return { color: '#6b7280', fillColor: '#d1d5db', weight: 1, opacity: 0.8, fillOpacity: 0.5 };
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
    showNdvi?: boolean;
    showSoilMoisture?: boolean;
    mapType?: 'street' | 'satellite';
}

const InteractiveMap: React.FC<InteractiveMapProps> = ({ 
    location, 
    showNdvi = false, 
    showSoilMoisture = false,
    mapType = 'satellite'
}) => {
    const mapContainerRef = useRef<HTMLDivElement>(null);
    const mapRef = useRef<L.Map | null>(null);
    const streetLayerRef = useRef<L.TileLayer | null>(null);
    const satelliteLayerRef = useRef<L.TileLayer | null>(null);
    const ndviLayerRef = useRef<L.ImageOverlay | null>(null);
    const soilLayerRef = useRef<L.GeoJSON | null>(null);

    useEffect(() => {
        if (mapContainerRef.current && !mapRef.current) {
            mapRef.current = L.map(mapContainerRef.current).setView([51.505, -0.09], 13);
            
            // Define base layers
            streetLayerRef.current = L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
                attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
            });
            satelliteLayerRef.current = L.tileLayer('https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}', {
	            attribution: 'Tiles &copy; Esri &mdash; Source: Esri, i-cubed, USDA, USGS, AEX, GeoEye, Getmapping, Aerogrid, IGN, IGP, UPR-EGP, and the GIS User Community'
            });

            // Set initial base layer
            if (mapType === 'satellite') {
                satelliteLayerRef.current.addTo(mapRef.current);
            } else {
                streetLayerRef.current.addTo(mapRef.current);
            }

            // Add soil moisture layer (conditionally)
            soilLayerRef.current = L.geoJSON(soilMoistureData as any, {
                style: (feature) => getMoistureStyle(feature?.properties.moistureLevel),
                onEachFeature: (feature, layer) => {
                    if (feature.properties && feature.properties.moistureLevel) {
                        layer.bindPopup(`<strong>Soil Moisture: ${feature.properties.moistureLevel}</strong><br/>Alert: Potential ${feature.properties.moistureLevel === 'Dry' ? 'drought' : feature.properties.moistureLevel === 'Wet' ? 'waterlogging' : 'stable conditions'}.`);
                    }
                }
            });
            if (showSoilMoisture) {
                soilLayerRef.current.addTo(mapRef.current);
            }

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

            // Add NDVI overlay
            const ndviImageUrl = 'https://i.imgur.com/gY5Z2oW.png'; // Semi-transparent NDVI overlay
            const imageBounds: L.LatLngBoundsExpression = geoJsonLayer.getBounds();
            ndviLayerRef.current = L.imageOverlay(ndviImageUrl, imageBounds, {
                opacity: showNdvi ? 0.75 : 0,
            }).addTo(mapRef.current);

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
            mapRef.current.setView([location.lat, location.lon], 13);
            L.marker([location.lat, location.lon]).addTo(mapRef.current)
                .bindPopup('Your approximate location').openPopup();
        }
    }, [location]);
    
    useEffect(() => {
        if (mapRef.current && streetLayerRef.current && satelliteLayerRef.current) {
            if (mapType === 'satellite') {
                if (mapRef.current.hasLayer(streetLayerRef.current)) {
                    mapRef.current.removeLayer(streetLayerRef.current);
                }
                if (!mapRef.current.hasLayer(satelliteLayerRef.current)) {
                    satelliteLayerRef.current.addTo(mapRef.current);
                }
            } else {
                 if (mapRef.current.hasLayer(satelliteLayerRef.current)) {
                    mapRef.current.removeLayer(satelliteLayerRef.current);
                }
                if (!mapRef.current.hasLayer(streetLayerRef.current)) {
                    streetLayerRef.current.addTo(mapRef.current);
                }
            }
        }
    }, [mapType]);

    useEffect(() => {
        if (ndviLayerRef.current) {
            ndviLayerRef.current.setOpacity(showNdvi ? 0.75 : 0);
        }
    }, [showNdvi]);

    useEffect(() => {
        if (mapRef.current && soilLayerRef.current) {
            if (showSoilMoisture && !mapRef.current.hasLayer(soilLayerRef.current)) {
                soilLayerRef.current.addTo(mapRef.current);
            } else if (!showSoilMoisture && mapRef.current.hasLayer(soilLayerRef.current)) {
                mapRef.current.removeLayer(soilLayerRef.current);
            }
        }
    }, [showSoilMoisture]);

    return <div ref={mapContainerRef} className="h-full w-full" />;
};

export default InteractiveMap;