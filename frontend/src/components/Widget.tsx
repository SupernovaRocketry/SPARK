import React, { memo, useState } from 'react';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';

interface WidgetProps {
  id: string;
  children: React.ReactNode;
  colSpan?: number;
  onResize?: (id: string, newSpan: number) => void;
}

export const Widget: React.FC<WidgetProps> = memo(({ id, children, colSpan = 1, onResize }) => {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging: isSortableDragging,
  } = useSortable({ id });

  const [resizingWidth, setResizingWidth] = useState<number | null>(null);

  const isResizing = resizingWidth !== null;
  const isDragging = isSortableDragging || isResizing;

  const style = {
    transform: CSS.Transform.toString(transform),
    transition: isResizing ? 'none' : transition,
    opacity: isDragging ? 0.8 : 1,
    zIndex: isDragging ? 1000 : 'auto',
    position: 'relative' as const,
    touchAction: 'none',
    boxShadow: isDragging ? '0 10px 20px rgba(0,0,0,0.5)' : 'none',
    width: resizingWidth ? `${resizingWidth}px` : undefined,
  };

  const handleResizeStart = (e: React.PointerEvent) => {
    e.stopPropagation(); 
    e.preventDefault();
    
    const widgetElement = (e.currentTarget as HTMLElement).closest('.sortable-widget') as HTMLElement;
    if (!widgetElement) return;

    const startX = e.clientX;
    const initialWidth = widgetElement.offsetWidth;
    const approximateColumnWidth = initialWidth / colSpan;
    let currentSpan = colSpan;

    const handleMove = (moveEvent: PointerEvent) => {
        const deltaX = moveEvent.clientX - startX;
        const newWidth = Math.max(100, initialWidth + deltaX);
        
        setResizingWidth(newWidth);

        const rawSpan = newWidth / approximateColumnWidth;
        const newSpan = Math.max(1, Math.min(4, Math.round(rawSpan)));
        
        if (newSpan !== currentSpan && onResize) {
            currentSpan = newSpan;
            onResize(id, newSpan);
        }
    };

    const handleUp = () => {
        setResizingWidth(null);
        window.removeEventListener('pointermove', handleMove);
        window.removeEventListener('pointerup', handleUp);
    };

    window.addEventListener('pointermove', handleMove);
    window.addEventListener('pointerup', handleUp);
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...attributes}
      {...listeners}
      className={`sortable-widget widget-span-${colSpan}`}
    >
      <div style={{ pointerEvents: isDragging ? 'none' : 'auto', height: '100%', display: 'flex', flexDirection: 'column', position: 'relative' }}>
        {children}
        <div 
            className="resize-handle"
            onPointerDown={handleResizeStart}
            title="Arraste para redimensionar"
        />
      </div>
    </div>
  );
});
