import React from 'react';
import { Widget } from '../Widget';
import { useTelemetry } from '../../context/TelemetryContext';

export const LongitudeWidget: React.FC = () => {
  const { data } = useTelemetry();
  const value = data?.longitude;

  const displayValue = value != null ? value.toFixed(6) : '---';
  return (
    <Widget 
      title="Longitude" 
      value={displayValue} 
      unit="°" 
    />
  );
};
