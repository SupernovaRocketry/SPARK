import React, { useEffect, useRef } from 'react';
import uPlot from 'uplot';
import 'uplot/dist/uPlot.min.css';
import { useTelemetry } from '../../context/TelemetryContext';
import '../Widgets.css';

export const AltitudeChartWidget: React.FC = () => {
  const { data } = useTelemetry();
  const chartRef = useRef<HTMLDivElement>(null);
  const plotRef = useRef<uPlot | null>(null);
  const startTimeRef = useRef<number>(Date.now());
  const dataRef = useRef<{ time: number[], altitude: number[] }>({ time: [], altitude: [] });

  useEffect(() => {
    if (!chartRef.current || plotRef.current) return;

    const timer = setTimeout(() => {
      if (!chartRef.current || plotRef.current) return;
      
      const width = chartRef.current.offsetWidth || 600;
      const height = chartRef.current.offsetHeight || 250;

      const opts: uPlot.Options = {
        width,
        height,
        cursor: { show: false },
        legend: { show: false },
        scales: {
          x: {
            time: false,
            auto: false,
            range: (u) => {
              const dataMax = u.data[0][u.data[0].length - 1] ?? 20;
              return dataMax <= 20 ? [0, 20] : [dataMax - 20, dataMax];
            },
          },
          y: { range: [100, 700] },
        },
        axes: [
          {
            stroke: '#666',
            grid: { stroke: '#333', width: 1 },
            ticks: { stroke: '#666', width: 1 },
            font: '12px monospace',
            values: (_, vals) => vals.map(v => v.toFixed(0) + 's'),
          },
          {
            stroke: '#666',
            grid: { stroke: '#333', width: 1 },
            ticks: { stroke: '#666', width: 1 },
            font: '12px monospace',
            values: (_, vals) => vals.map(v => v.toFixed(0) + 'm'),
            side: 3,
          },
        ],
        series: [
          { label: 'Tempo (s)' },
          {
            label: 'Altitude (m)',
            stroke: '#00ff00',
            fill: 'rgba(0, 255, 0, 0.1)',
            width: 2,
            points: { show: false },
          },
        ],
      };

      plotRef.current = new uPlot(opts, [[0], [0]], chartRef.current);
    }, 100);

    return () => {
      clearTimeout(timer);
      if (plotRef.current) {
        plotRef.current.destroy();
        plotRef.current = null;
      }
    };
  }, []);

  useEffect(() => {
    if (!plotRef.current || !data) return;

    const altitude = data?.bmp_altitude ?? 0;
    const currentTime = (Date.now() - startTimeRef.current) / 1000;

    dataRef.current.time.push(currentTime);
    dataRef.current.altitude.push(altitude);

    while (dataRef.current.time.length > 1 && dataRef.current.time[0] < currentTime - 25) {
      dataRef.current.time.shift();
      dataRef.current.altitude.shift();
    }

    plotRef.current.setData([dataRef.current.time, dataRef.current.altitude]);
  }, [data]);

  useEffect(() => {
    const handleResize = () => {
      if (plotRef.current && chartRef.current) {
        plotRef.current.setSize({
          width: chartRef.current.offsetWidth,
          height: chartRef.current.offsetHeight,
        });
      }
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  return (
    <div className="widget-card" style={{ padding: '1vmin', gridColumn: 'span 2', display: 'flex', flexDirection: 'column', height: 'fit-content' }}>
      <div style={{ fontSize: '2vmin', color: '#aaa', marginBottom: '0.5vmin', textAlign: 'center', textTransform: 'uppercase', letterSpacing: '0.1em' }}>
        Altitude x Tempo
      </div>
      <div ref={chartRef} style={{ width: '100%', height: '25vmin', background: '#1a1a1a', borderRadius: '8px' }} />
    </div>
  );
};
