import React from 'react';
import { Widget } from '../BaseWidget';
import { useTelemetry } from '../../context/TelemetryContext';

export const TemperatureWidget: React.FC = () => {
  const { data } = useTelemetry();
  const value = data?.temperature;

  const displayValue = value != null ? value.toFixed(1) : '---';
  return (
    <Widget 
      title="Temperatura" 
      value={displayValue} 
      unit="°C" 
    />
  );
};
