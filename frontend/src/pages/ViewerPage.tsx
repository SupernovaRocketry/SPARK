import { useEffect, useRef, useState } from 'react';
import { io, Socket } from 'socket.io-client';

type Props = {
  socketUrl: string;
};

export function ViewerPage({ socketUrl }: Props) {
  const [lastNumber, setLastNumber] = useState<number | null>(null);

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
        if (data?.number !== undefined) {
          setLastNumber(data.number);
        }
      });

      socket.connect();
    }

    return () => {
    };
  }, [socketUrl]);

  return (
    <>
      <div className="display-box">
        <h2>Painel de Visualização</h2>
        <div className="number-display">{lastNumber !== null ? lastNumber : '---'}</div>
      </div>

      <div className="user-controls">
        <p>Você está no modo visitante.</p>
      </div>

      <div className="info">
        <p>URL Socket: {socketUrl}</p>
      </div>
    </>
  );
}
