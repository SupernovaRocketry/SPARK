import React from 'react';
import { Widget } from '../Widget';
import { useTelemetry } from '../../context/TelemetryContext';

export const AltitudeWidget: React.FC = () => {
  const { data } = useTelemetry();
  const value = data?.bmp_altitude;
  
  const displayValue = value != null ? value.toFixed(1) : '---';
  return (
    <Widget 
      title="Altitude" 
      value={displayValue} 
      unit="m" 
    />
  );
};
