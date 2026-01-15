import { useEffect, useRef, useState } from 'react';
import { io, Socket } from 'socket.io-client';

const widgetModules = import.meta.glob('../components/widgets/*.tsx');
const AVAILABLE_WIDGETS = Object.keys(widgetModules)
  .map(path => path.split('/').pop()?.replace('.tsx', '') || '')
  .filter(Boolean)
  .sort();

type Props = {
  socketUrl: string;
};

type Client = {
  id: string;
  sid: string;
  type: string;
  ip: string;
  widgets?: string[];
};

type SerialPortInfo = {
  port: string;
  description: string;
  status: string;
  active: boolean;
};

function getSessionToken() {
  const STORAGE_KEY = 'admin_token';
  const existing = sessionStorage.getItem(STORAGE_KEY);
  if (existing) return existing;

  const newToken = Math.random().toString(36).substring(2) + Date.now().toString(36);
  sessionStorage.setItem(STORAGE_KEY, newToken);
  return newToken;
}

const SESSION_TOKEN = getSessionToken();

export function AdminPage({ socketUrl }: Props) {
  const [clients, setClients] = useState<Client[]>([]);
  const [globalWidgets, setGlobalWidgets] = useState<string[]>([]);
  const [editingClient, setEditingClient] = useState<Client | null>(null);
  
  const [serialPorts, setSerialPorts] = useState<SerialPortInfo[]>([]);
  const [currentPort, setCurrentPort] = useState<string>('');
  const [scanning, setScanning] = useState(false);

  const socketRef = useRef<Socket | null>(null);

  useEffect(() => {
    if (!socketRef.current) {
      socketRef.current = io(socketUrl, { 
        auth: { 
          id: 'ADMIN_' + SESSION_TOKEN.substring(0, 5),
          admin_secret: SESSION_TOKEN 
        },
        autoConnect: false,
        reconnection: true
      });
      
      const socket = socketRef.current;
      
      socket.on('admin_auth_success', () => {
        socket.emit('get_global_widgets');
        socket.emit('get_serial_ports');
      });
      
      socket.on('clients_update', (data: Client[]) => {
        setClients(data);
      });

      socket.on('serial_ports_list', (data: { current: string, ports: SerialPortInfo[] }) => {
        setSerialPorts(data.ports);
        setCurrentPort(data.current);
        setScanning(false);
      });

      socket.on('global_widgets_update', (widgets: string[]) => {
        setGlobalWidgets(widgets);
      });

      socket.connect();
    }
  }, [socketUrl]);

  const handleGlobalToggle = (widget: string) => {
    const newWidgets = globalWidgets.includes(widget)
      ? globalWidgets.filter(w => w !== widget)
      : [...globalWidgets, widget];
    
    setGlobalWidgets(newWidgets);
    socketRef.current?.emit('update_global_widgets', newWidgets);
  };

  const handleClientToggle = (widget: string) => {
    if (!editingClient) return;
    
    const currentWidgets = editingClient.widgets || globalWidgets;
    
    const newWidgets = currentWidgets.includes(widget)
      ? currentWidgets.filter(w => w !== widget)
      : [...currentWidgets, widget];

    const updatedClient = { ...editingClient, widgets: newWidgets };
    setEditingClient(updatedClient);
  };

  const saveClientWidgets = () => {
    if (!editingClient) return;
    const payload = {
      client_id: editingClient.id,
      widgets: editingClient.widgets === undefined ? 'GLOBAL' : editingClient.widgets
    };

    socketRef.current?.emit('update_client_widgets', payload);
    setEditingClient(null);
  };

  const resetClientWidgets = () => {
    if (!editingClient) return;
    setEditingClient({ ...editingClient, widgets: undefined });
  };

  const refreshPorts = () => {
    setScanning(true);
    socketRef.current?.emit('get_serial_ports');
  };

  const changePort = (port: string) => {
    socketRef.current?.emit('set_serial_port', port);
  };

  return (
    <div className="admin-scroll">
      <div style={{ backgroundColor: '#2a2a2a', padding: '15px', borderRadius: '8px', marginBottom: '20px', border: '1px solid #444' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
          <h3>Configuração Serial (Receptor)</h3>
          <button 
            onClick={refreshPorts} 
            disabled={scanning}
            style={{ 
              padding: '5px 15px', 
              background: scanning ? '#555' : '#1976d2', 
              color: '#fff', 
              border: 'none', 
              borderRadius: '4px',
              cursor: scanning ? 'default' : 'pointer'
            }}
          >
            {scanning ? 'Escaneando...' : 'Escanear Portas'}
          </button>
        </div>

        {serialPorts.length === 0 ? (
           <p style={{ color: '#888' }}>Nenhuma porta serial detectada.</p>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(250px, 1fr))', gap: '10px' }}>
            {serialPorts.map(sp => {
              const isSelected = sp.port === currentPort;
              let borderColor = '#444';
              let statusColor = '#888';
              
              if (sp.active) {
                 borderColor = '#4caf50';
                 statusColor = '#4caf50';
              } else if (isSelected) {
                 borderColor = '#2196f3';
                 statusColor = '#2196f3';
              }

              return (
                <div 
                  key={sp.port} 
                  onClick={() => changePort(sp.port)}
                  style={{ 
                    border: `2px solid ${borderColor}`,
                    background: isSelected ? 'rgba(33, 150, 243, 0.1)' : '#333',
                    padding: '10px',
                    borderRadius: '6px',
                    cursor: 'pointer',
                    display: 'flex',
                    flexDirection: 'column',
                    opacity: scanning ? 0.7 : 1
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <strong style={{ fontSize: '1.1em' }}>{sp.port}</strong>
                    {sp.active && <span style={{ fontSize: '0.8em', background: '#4caf50', color: '#000', padding: '2px 6px', borderRadius: '4px' }}>DATA</span>}
                  </div>
                  <span style={{ fontSize: '0.9em', color: '#aaa', marginTop: '5px' }}>{sp.description}</span>
                  <span style={{ fontSize: '0.8em', color: statusColor, marginTop: '5px' }}>
                    {isSelected ? 'CONECTADO' : sp.status}
                  </span>
                </div>
              );
            })}
          </div>
        )}
      </div>

      <div style={{ backgroundColor: '#2a2a2a', padding: '15px', borderRadius: '8px', marginBottom: '20px', border: '1px solid #444' }}>
        <h3>Padrões Globais</h3>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '10px' }}>
          {AVAILABLE_WIDGETS.map(widget => (
            <label key={widget} style={{ display: 'flex', alignItems: 'center', gap: '5px', background: '#333', padding: '5px 10px', borderRadius: '4px', cursor: 'pointer' }}>
              <input 
                type="checkbox" 
                checked={globalWidgets.includes(widget)} 
                onChange={() => handleGlobalToggle(widget)}
              />
              {widget.replace('Widget', '')}
            </label>
          ))}
        </div>
      </div>

      <h2>Clientes Conectados ({clients.filter(c => c.type !== 'Admin').length})</h2>
      <div style={{ 
        backgroundColor: '#2a2a2a', 
        borderRadius: '8px', 
        padding: '10px',
        border: '1px solid #444',
        overflowX: 'auto'
      }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', color: '#ccc' }}>
          <thead>
            <tr style={{ borderBottom: '1px solid #444', textAlign: 'left' }}>
              <th style={{ padding: '10px' }}>ID</th>
              <th style={{ padding: '10px' }}>IP</th>
              <th style={{ padding: '10px' }}>Widgets</th>
              <th style={{ padding: '10px' }}>Ações</th>
            </tr>
          </thead>
          <tbody>
            {clients
              .filter(client => client.type !== 'Admin')
              .map(client => (
              <tr key={client.sid} style={{ borderBottom: '1px solid #333' }}>
                <td style={{ padding: '10px', fontFamily: 'monospace', fontWeight: 'bold' }}>{client.id}</td>
                <td style={{ padding: '10px' }}>{client.ip}</td>
                <td style={{ padding: '10px', fontSize: '0.9em' }}>
                  {client.widgets ? (
                    <span style={{ color: '#4fc3f7' }}>Personalizado ({client.widgets.length})</span>
                  ) : (
                    <span style={{ color: '#81c784' }}>Padrão Global</span>
                  )}
                </td>
                <td style={{ padding: '10px' }}>
                  <button 
                    onClick={() => setEditingClient(client)}
                    style={{ padding: '5px 10px', cursor: 'pointer', background: '#555', color: '#fff', border: 'none', borderRadius: '4px' }}
                  >
                    Editar
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {clients.filter(c => c.type !== 'Admin').length === 0 && <p style={{ padding: '20px', textAlign: 'center', color: '#666' }}>Nenhum cliente conectado.</p>}
      </div>

      {editingClient && (
        <div style={{
          position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
          background: 'rgba(0,0,0,0.8)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000
        }}>
          <div style={{ background: '#222', padding: '20px', borderRadius: '8px', width: '90%', maxWidth: '500px', border: '1px solid #555' }}>
            <h3>Editando: {editingClient.id}</h3>
            <p style={{ color: '#888', fontSize: '0.9em' }}>
              {editingClient.widgets === undefined 
                ? "Este usuário está usando os Padrões Globais." 
                : "Este usuário tem permissões personalizadas."}
            </p>
            
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '10px', margin: '20px 0', maxHeight: '300px', overflowY: 'auto' }}>
              {AVAILABLE_WIDGETS.map(widget => {
                const isChecked = (editingClient.widgets || globalWidgets).includes(widget);
                
                return (
                  <label key={widget} style={{ display: 'flex', alignItems: 'center', gap: '5px', background: '#333', padding: '5px 10px', borderRadius: '4px', cursor: 'pointer', width: '100%' }}>
                    <input 
                      type="checkbox" 
                      checked={isChecked} 
                      onChange={() => handleClientToggle(widget)}
                    />
                    {widget.replace('Widget', '')}
                  </label>
                );
              })}
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px' }}>
              <button onClick={resetClientWidgets} style={{ padding: '8px 15px', cursor: 'pointer', background: 'transparent', color: '#f44336', border: '1px solid #d32f2f', borderRadius: '4px' }}>
                Restaurar Padrão
              </button>
              <div style={{ flex: 1 }}></div>
              <button onClick={() => setEditingClient(null)} style={{ padding: '8px 15px', cursor: 'pointer', background: '#555', color: '#fff', border: 'none', borderRadius: '4px' }}>
                Cancelar
              </button>
              <button onClick={saveClientWidgets} style={{ padding: '8px 15px', cursor: 'pointer', background: '#4caf50', color: '#fff', border: 'none', borderRadius: '4px' }}>
                Salvar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
