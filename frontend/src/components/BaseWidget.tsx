import React from 'react';
import './Widgets.css';

interface WidgetProps {
  title: string;
  value: string | number;
  unit?: string;
}

export const Widget: React.FC<WidgetProps> = ({ title, value, unit }) => {
  return (
    <div className="widget-card">
      <div className="widget-title">{title}</div>
      <div className="widget-value-container">
        <div className="widget-value">{value}</div>
        {unit && <span className="widget-unit">{unit}</span>}
      </div>
    </div>
  );
};

interface VectorWidgetProps {
  title: string;
  x: number;
  y: number;
  z: number;
  unit?: string;
}

export const VectorWidget: React.FC<VectorWidgetProps> = ({ title, x, y, z, unit }) => {
  const format = (n: any) => {
    if (typeof n !== 'number') return '---';
    const sign = n >= 0 ? '+' : '';
    return `${sign}${n.toFixed(2)}`;
  };
  
  return (
    <div className="widget-card">
      <div className="widget-title">{title}</div>
      <div className="widget-group">
        <div className="widget-sub-value">
          <span className="widget-sub-label">X</span>
          <div className="widget-value-container">
            <span className="widget-value">{format(x)}</span>
          </div>
        </div>
        <div className="widget-sub-value">
          <span className="widget-sub-label">Y</span>
          <div className="widget-value-container">
            <span className="widget-value">{format(y)}</span>
          </div>
        </div>
        <div className="widget-sub-value">
          <span className="widget-sub-label">Z</span>
          <div className="widget-value-container">
            <span className="widget-value">{format(z)}</span>
          </div>
        </div>
      </div>
        {unit && <div className="widget-unit" style={{marginTop: '0.5rem'}}>{unit}</div>}
    </div>
  );
};
