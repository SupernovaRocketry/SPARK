import React from 'react';
import { Widget } from '../Widget';
import { useTelemetry } from '../../context/TelemetryContext';

export const PressureWidget: React.FC = () => {
  const { data } = useTelemetry();
  const value = data?.pressure;

  const displayValue = value != null ? value.toFixed(2) : '---';
  return (
    <Widget 
      title="Pressão" 
      value={displayValue} 
      unit="hPa" 
    />
  );
};
