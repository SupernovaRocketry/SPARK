import React, { createContext, useContext, type ReactNode } from 'react';

export type TelemetryData = any;

interface TelemetryContextType {
  data: TelemetryData | null;
}

const TelemetryContext = createContext<TelemetryContextType | undefined>(undefined);

export const TelemetryProvider: React.FC<{ data: TelemetryData | null; children: ReactNode }> = ({ data, children }) => {
  return (
    <TelemetryContext.Provider value={{ data }}>
      {children}
    </TelemetryContext.Provider>
  );
};

export const useTelemetry = () => {
  const context = useContext(TelemetryContext);
  if (context === undefined) {
    throw new Error('useTelemetry must be used within a TelemetryProvider');
  }
  return context;
};
