import React, { useMemo, useState, useEffect, useCallback } from 'react';
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
} from '@dnd-kit/core';
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  rectSortingStrategy,
} from '@dnd-kit/sortable';
import { Widget } from './Widget';
import './Widgets.css';

const widgetModules = import.meta.glob<any>('./widgets/*.tsx', { eager: true });

interface WidgetInfo {
  id: string;
  component: React.ComponentType<any>;
  name: string;
  colSpan: number;
}

export const TelemetryDashboard: React.FC = () => {
  const defaultWidgets = useMemo<WidgetInfo[]>(() => {
    return Object.entries(widgetModules).map(([path, module], index) => {
      const Component = module[Object.keys(module).find(key => key !== 'default') || 'default'] || Object.values(module)[0];
      const name = path.split('/').pop()?.replace('.tsx', '') || 'Widget';
      const isWide = ['map', 'chart', 'altitude'].some(term => name.toLowerCase().includes(term));
      
      return { 
        id: `widget-${name}-${index}`,
        component: Component,
        name,
        colSpan: isWide ? 2 : 1
      };
    });
  }, []);

  const [widgets, setWidgets] = useState<WidgetInfo[]>(defaultWidgets);

  useEffect(() => {
    try {
      const savedOrder = localStorage.getItem('widget-order');
      const savedSizes = localStorage.getItem('widget-sizes');
      
      let initialWidgets = [...defaultWidgets];
      const sizeMap = savedSizes ? JSON.parse(savedSizes) : {};

      initialWidgets = initialWidgets.map(w => ({
        ...w,
        colSpan: sizeMap[w.id] || w.colSpan
      }));
      
      if (savedOrder) {
        const orderIds: string[] = JSON.parse(savedOrder);
        const widgetMap = new Map(initialWidgets.map(w => [w.id, w]));
        const reorderedWidgets: WidgetInfo[] = [];
        
        orderIds.forEach(id => {
          if (widgetMap.has(id)) {
            reorderedWidgets.push(widgetMap.get(id)!);
            widgetMap.delete(id);
          }
        });
        
        widgetMap.forEach(widget => reorderedWidgets.push(widget));
        setWidgets(reorderedWidgets);
      } else {
        setWidgets(initialWidgets);
      }
    } catch {}
  }, [defaultWidgets]);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 8 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  );

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;

    if (over && active.id !== over.id) {
      setWidgets((items) => {
        const oldIndex = items.findIndex((item) => item.id === active.id);
        const newIndex = items.findIndex((item) => item.id === over.id);
        const newOrder = arrayMove(items, oldIndex, newIndex);
        localStorage.setItem('widget-order', JSON.stringify(newOrder.map(w => w.id)));
        return newOrder;
      });
    }
  };

  const handleResize = useCallback((id: string, newSpan: number) => {
    setWidgets(currentWidgets => {
      const updated = currentWidgets.map(w => w.id === id ? { ...w, colSpan: newSpan } : w);
      const sizes = updated.reduce((acc, w) => ({...acc, [w.id]: w.colSpan}), {});
      localStorage.setItem('widget-sizes', JSON.stringify(sizes));
      return updated;
    });
  }, []);

  return (
    <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
      <SortableContext items={widgets.map(w => w.id)} strategy={rectSortingStrategy}>
        <div className="widget-grid">
          {widgets.map((widget) => (
            <Widget 
              key={widget.id} 
              id={widget.id} 
              colSpan={widget.colSpan}
              onResize={handleResize}
            >
              <widget.component />
            </Widget>
          ))}
        </div>
      </SortableContext>
    </DndContext>
  );
};
