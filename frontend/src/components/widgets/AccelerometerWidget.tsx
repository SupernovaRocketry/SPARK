import React from 'react';
import { VectorWidget } from '../Widget';
import { useTelemetry } from '../../context/TelemetryContext';

export const AccelerometerWidget: React.FC = () => {
  const { data } = useTelemetry();
  const accel_x = data?.accel_x;
  const accel_y = data?.accel_y;
  const accel_z = data?.accel_z;
  
  return (
    <VectorWidget 
      title="Acelerômetro"
      x={accel_x}
      y={accel_y}
      z={accel_z}
      unit="m/s²"
    />
  );
};
