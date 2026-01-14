import React, { useEffect } from 'react';
import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { useTelemetry } from '../../context/TelemetryContext';
import '../Widgets.css';

const iconUrl = "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png";
const iconRetinaUrl = "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png";
const shadowUrl = "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png";

const customIcon = L.icon({
    iconUrl: iconUrl,
    iconRetinaUrl: iconRetinaUrl,
    shadowUrl: shadowUrl,
    iconSize: [25, 41],
    iconAnchor: [12, 41],
    popupAnchor: [1, -34],
    shadowSize: [41, 41]
});

export const MapWidget: React.FC = () => {
  const { data } = useTelemetry();
  const lat = data?.latitude;
  const lng = data?.longitude;
  
  const hasSignal = (data?.latitude !== undefined) && (data?.longitude !== undefined);

  if (!hasSignal) {
    return (
      <div className="widget-card" style={{ padding: 0, overflow: 'hidden', minHeight: '40vmin', gridColumn: 'span 2', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div style={{ textAlign: 'center', color: '#666' }}>
          <div style={{ fontSize: '3vmin', marginBottom: '1vmin' }}>🛰️</div>
          <div style={{ fontSize: '2vmin' }}>Aguardando informações de GPS...</div>
        </div>
      </div>
    );
  }

  return (
    <div className="widget-card" style={{ padding: 0, overflow: 'hidden', minHeight: '40vmin', gridColumn: 'span 2' }}>
        <MapContainer center={[lat, lng]} zoom={105} style={{ height: '100%', width: '100%' }} zoomControl={false}>
            <TileLayer
                attribution='&copy; OpenStreetMap'
                url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            />
            <Marker position={[lat, lng]} icon={customIcon}/>
        </MapContainer>
    </div>
  );
};
