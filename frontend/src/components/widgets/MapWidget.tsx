import React, { useEffect, useRef } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { useTelemetry } from '../../context/TelemetryContext';
import '../Widgets.css';

const customIcon = L.icon({
  iconUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
  iconRetinaUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png",
  shadowUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41]
});

export const MapWidget: React.FC = () => {
  const { data } = useTelemetry();
  const lat = data?.latitude;
  const lng = data?.longitude;
  const hasSignal = (lat !== undefined) && (lng !== undefined);
  
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<L.Map | null>(null);
  const markerRef = useRef<L.Marker | null>(null);

  useEffect(() => {
    if (!mapContainerRef.current || mapInstanceRef.current) return;

    const map = L.map(mapContainerRef.current, {
      zoomControl: false,
      attributionControl: false
    }).setView([lat || 0, lng || 0], 100);

    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '&copy; OpenStreetMap'
    }).addTo(map);

    const marker = L.marker([lat || 0, lng || 0], { icon: customIcon }).addTo(map);
    
    mapInstanceRef.current = map;
    markerRef.current = marker;

    return () => {
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove();
        mapInstanceRef.current = null;
        markerRef.current = null;
      }
    };
  }, [hasSignal]);

  useEffect(() => {
    if (!mapContainerRef.current) return;

    const observer = new ResizeObserver(() => {
      if (mapInstanceRef.current) {
        requestAnimationFrame(() => mapInstanceRef.current?.invalidateSize());
      }
    });

    observer.observe(mapContainerRef.current);
    return () => observer.disconnect();
  }, [hasSignal]);

  useEffect(() => {
    if (!mapInstanceRef.current || !markerRef.current || !hasSignal) return;
    
    try {
      markerRef.current.setLatLng([lat, lng]);
      mapInstanceRef.current.setView([lat, lng]);
      mapInstanceRef.current.invalidateSize();
    } catch {}
  }, [lat, lng, hasSignal]);

  if (!hasSignal) {
    return (
      <div className="widget-card" style={{ padding: 0, overflow: 'hidden', height: '100%', minHeight: '300px', width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div style={{ textAlign: 'center', color: '#666' }}>
          <div style={{ fontSize: '3vmin', marginBottom: '1vmin' }}>🛰️</div>
          <div style={{ fontSize: '2vmin' }}>Aguardando GPS...</div>
        </div>
      </div>
    );
  }

  return (
    <div className="widget-card" style={{ padding: 0, overflow: 'hidden', height: '100%', minHeight: '300px', width: '100%' }}>
      <div ref={mapContainerRef} style={{ height: '100%', width: '100%' }} />
    </div>
  );
};
