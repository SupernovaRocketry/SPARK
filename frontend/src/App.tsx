import { useEffect, useState } from 'react';
import './App.css';

import { AdminPage } from './pages/AdminPage';
import { ViewerPage } from './pages/ViewerPage';

const SOCKET_URL = window.location.port === '5173'
  ? `http://${window.location.hostname}:8080`
  : window.location.origin;

function App() {
  const [path, setPath] = useState(window.location.pathname);

  useEffect(() => {
    const handlePopState = () => setPath(window.location.pathname);
    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, []);

  const isAdminRoute = path === '/admin';

  return (
    <div className="container">
      <h1>Teste de WebSocket (Socket.IO)</h1>

      {isAdminRoute ? (
        <AdminPage socketUrl={SOCKET_URL} />
      ) : (
        <ViewerPage socketUrl={SOCKET_URL} />
      )}
    </div>
  );
}

export default App;
