import { useEffect, useRef, useState } from 'react';
import { io, Socket } from 'socket.io-client';

type Props = {
  socketUrl: string;
};

function getSessionToken() {
  const STORAGE_KEY = 'supervisorio_admin_token';
  const existing = sessionStorage.getItem(STORAGE_KEY);
  if (existing) return existing;

  const newToken = Math.random().toString(36).substring(2) + Date.now().toString(36);
  sessionStorage.setItem(STORAGE_KEY, newToken);
  return newToken;
}

const SESSION_TOKEN = getSessionToken();

export function AdminPage({ socketUrl }: Props) {
  const [lastNumber, setLastNumber] = useState<number | null>(null);
  const [authStatus, setAuthStatus] = useState<string>('Tentando autenticar...');

  const socketRef = useRef<Socket | null>(null);

  useEffect(() => {
    if (!socketRef.current) {
      socketRef.current = io(socketUrl, { 
        auth: { 
          admin_token: SESSION_TOKEN 
        },
        autoConnect: false,
        reconnection: true
      });
      
      const socket = socketRef.current;
      
      socket.on('admin_auth_success', () => {
        setAuthStatus('Autenticado com sucesso (Admin).');
      });
      
      socket.on('admin_auth_failed', (msg: string) => setAuthStatus(`Falha: ${msg}`));
      
      socket.on('data_update', (data: any) => {
        if (data?.number !== undefined) setLastNumber(data.number);
      });

      socket.connect();
    }

    return () => {
    };
  }, [socketUrl]);

  if (authStatus.startsWith('Falha')) {
    return (
      <div style={{ 
        padding: '40px', 
        background: '#f8d7da', 
        color: '#842029', 
        borderRadius: '8px', 
        border: '1px solid #f5c6cb',
        textAlign: 'center',
        maxWidth: '600px',
        margin: '50px auto'
      }}>
        <h2>🚫 Acesso Negado</h2>
        <p style={{ fontSize: '1.2em', margin: '20px 0' }}>{authStatus}</p>
        <p>O painel de administrador permite apenas uma sessão ativa por vez.</p>
      </div>
    );
  }

  return (
    <>
      <div className="display-box">
        <h2>Painel Admin</h2>
        <div className="number-display">{lastNumber !== null ? lastNumber : '---'}</div>
      </div>

      <div className="admin-controls">
        <div className="auth-status" style={{
            marginBottom: '15px', 
            padding: '10px', 
            background: authStatus.includes('sucesso') ? '#d1e7dd' : '#f8d7da',
            color: authStatus.includes('sucesso') ? '#0f5132' : '#842029',
            borderRadius: '4px'
        }}>
            {authStatus}
        </div>
      </div>
    </>
  );
}
