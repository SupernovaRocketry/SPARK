import React from 'react';
import { Widget } from '../Widget';
import { useTelemetry } from '../../context/TelemetryContext';

export const LatitudeWidget: React.FC = () => {
  const { data } = useTelemetry();
  const value = data?.latitude;

  const displayValue = value != null ? value.toFixed(6) : '---';
  return (
    <Widget 
      title="Latitude" 
      value={displayValue} 
      unit="°" 
    />
  );
};
