import { useEffect, useRef, useState } from 'react';
import { io, Socket } from 'socket.io-client';
import { TelemetryDashboard } from '../components/TelemetryDashboard';
import { TelemetryProvider, type TelemetryData } from '../context/TelemetryContext';

type Props = {
  socketUrl: string;
};

export function ViewerPage({ socketUrl }: Props) {
  const [telemetry, setTelemetry] = useState<TelemetryData | null>(null);

  const socketRef = useRef<Socket | null>(null);

  useEffect(() => {
    if (!socketRef.current) {
      socketRef.current = io(socketUrl, {
        autoConnect: false,
        reconnection: true
      });
      
      const socket = socketRef.current;
      
      socket.on('data_update', (data: any) => {
        console.log("UserWindow recebeu:", data);
        if (data) {
          setTelemetry(data as TelemetryData);
        }
      });

      socket.connect();
    }

    return () => {
    };
  }, [socketUrl]);

  return (
    <TelemetryProvider data={telemetry}>
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
        <TelemetryDashboard />
      </div>
    </TelemetryProvider>
  );
}
