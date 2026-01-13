import React, { useMemo } from 'react';
import './Widgets.css';

// importar todos os widgets da pasta widgets
const widgetModules = import.meta.glob<any>('./widgets/*.tsx', { eager: true });

export const TelemetryDashboard: React.FC = () => {
  const widgets = useMemo(() => {
    return Object.values(widgetModules).map(module => module[Object.keys(module).find(key => key !== 'default') || 'default'] || Object.values(module)[0]);
  }, []);

  return (
    <div className="widget-grid">
      {widgets.map((WidgetComponent, index) => (
        <WidgetComponent key={index} />
      ))}
    </div>
  );
};
