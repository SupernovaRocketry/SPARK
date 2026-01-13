import React from 'react';
import { VectorWidget } from '../Widget';
import { useTelemetry } from '../../context/TelemetryContext';

export const GyroscopeWidget: React.FC = () => {
  const { data } = useTelemetry();
  const rotation_x = data?.rotation_x;
  const rotation_y = data?.rotation_y;
  const rotation_z = data?.rotation_z;
  
  return (
    <VectorWidget 
      title="Giroscópio"
      x={rotation_x}
      y={rotation_y}
      z={rotation_z}
      unit="deg/s"
    />
  );
};
