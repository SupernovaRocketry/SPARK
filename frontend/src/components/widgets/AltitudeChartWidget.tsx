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
      
      const opts: uPlot.Options = {
        width: chartRef.current.offsetWidth || 600,
        height: chartRef.current.offsetHeight || 250,
        cursor: { show: false },
        legend: { show: false },
        scales: {
          x: { time: false, auto: false, range: (u) => {
            const max = u.data[0][u.data[0].length - 1] ?? 20;
            return max <= 20 ? [0, 20] : [max - 20, max];
          }},
          y: { range: [100, 700] },
        },
        axes: [
          { stroke: '#666', grid: { stroke: '#333', width: 1 }, ticks: { stroke: '#666', width: 1 }, font: '12px monospace', values: (_, v) => v.map(n => n.toFixed(0) + 's') },
          { stroke: '#666', grid: { stroke: '#333', width: 1 }, ticks: { stroke: '#666', width: 1 }, font: '12px monospace', values: (_, v) => v.map(n => n.toFixed(0) + 'm'), side: 3 },
        ],
        series: [
          { label: 'Tempo' },
          { label: 'Altitude', stroke: '#00ff00', fill: 'rgba(0, 255, 0, 0.1)', width: 2, points: { show: false } },
        ],
      };

      plotRef.current = new uPlot(opts, [[0], [0]], chartRef.current);
    }, 100);

    return () => {
      clearTimeout(timer);
      plotRef.current?.destroy();
      plotRef.current = null;
    };
  }, []);

  useEffect(() => {
    if (!plotRef.current || !data) return;
    const now = (Date.now() - startTimeRef.current) / 1000;
    
    dataRef.current.time.push(now);
    dataRef.current.altitude.push(data.bmp_altitude ?? 0);

    while (dataRef.current.time.length > 1 && dataRef.current.time[0] < now - 25) {
      dataRef.current.time.shift();
      dataRef.current.altitude.shift();
    }
    plotRef.current.setData([dataRef.current.time, dataRef.current.altitude]);
  }, [data]);

  useEffect(() => {
    if (!chartRef.current) return;

    const observer = new ResizeObserver((entries) => {
      if (!plotRef.current) return;
      for (const entry of entries) {
        const { width, height } = entry.contentRect;
        plotRef.current.setSize({ width, height });
      }
    });

    observer.observe(chartRef.current);
    return () => observer.disconnect();
  }, []);

  return (
    <div className="widget-card" style={{ padding: '1vmin', width: '100%', display: 'flex', flexDirection: 'column', height: '100%' }}>
      <div style={{ fontSize: '2vmin', color: '#aaa', marginBottom: '0.5vmin', textAlign: 'center', textTransform: 'uppercase', letterSpacing: '0.1em' }}>
        Altitude x Tempo
      </div>
      <div ref={chartRef} style={{ flex: 1, width: '100%', minHeight: '200px', background: '#1a1a1a', borderRadius: '8px' }} />
    </div>
  );
};
