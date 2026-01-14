import { useEffect, useRef, useState } from 'react';
import { io, Socket } from 'socket.io-client';
import { TelemetryDashboard } from '../components/TelemetryDashboard';
import { TelemetryProvider, type TelemetryData } from '../context/TelemetryContext';

type Props = {
  socketUrl: string;
};

function getClientId() {
  const STORAGE_KEY = 'spark_client_id';
  const existing = localStorage.getItem(STORAGE_KEY);
  if (existing) return existing;

  const newId = 'user_' + Math.random().toString(36).substring(2, 8).toUpperCase();
  localStorage.setItem(STORAGE_KEY, newId);
  return newId;
}

export function ViewerPage({ socketUrl }: Props) {
  const [telemetry, setTelemetry] = useState<TelemetryData | null>(null);
  const [allowedWidgets, setAllowedWidgets] = useState<string[] | undefined>(undefined);

  const socketRef = useRef<Socket | null>(null);

  useEffect(() => {
    if (!socketRef.current) {
      const clientId = getClientId();
      socketRef.current = io(socketUrl, {
        auth: {
          id: clientId
        },
        autoConnect: false,
        reconnection: true
      });
      
      const socket = socketRef.current;
      
      socket.on('data_update', (data: any) => {
        if (data) setTelemetry(data as TelemetryData);
      });

      socket.on('widget_permissions', (widgets: string[]) => {
        setAllowedWidgets(widgets);
      });

      socket.connect();
    }

    return () => {};
  }, [socketUrl]);

  return (
    <TelemetryProvider data={telemetry}>
      <div style={{ height: '100vh', width: '100vw', overflow: 'hidden' }}>
        <TelemetryDashboard allowedWidgets={allowedWidgets} />
      </div>
    </TelemetryProvider>
  );
}
