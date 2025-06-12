import { useState, useEffect } from 'react';
import cx from '@src/cx.mjs';
import { setPanelWidth } from '../../settings.mjs';

export function ResizeHandle({ minWidth = 300, maxWidth = 800, currentWidth }) {
  const [isDragging, setIsDragging] = useState(false);

  useEffect(() => {
    const handleMouseMove = (e) => {
      if (!isDragging) return;
      
      const newWidth = window.innerWidth - e.clientX;
      const clampedWidth = Math.min(Math.max(newWidth, minWidth), maxWidth);
      setPanelWidth(clampedWidth);
    };

    const handleMouseUp = () => {
      setIsDragging(false);
    };

    if (isDragging) {
      document.addEventListener('mousemove', handleMouseMove);
      document.addEventListener('mouseup', handleMouseUp);
      document.body.style.cursor = 'col-resize';
      document.body.style.userSelect = 'none';
    }

    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
      document.body.style.cursor = '';
      document.body.style.userSelect = '';
    };
  }, [isDragging, minWidth, maxWidth]);

  const handleMouseDown = (e) => {
    e.preventDefault();
    setIsDragging(true);
  };

  return (
    <div
      className={cx(
        'w-1 bg-gray-600 hover:bg-gray-500 cursor-col-resize transition-colors',
        'flex-shrink-0 group relative'
      )}
      onMouseDown={handleMouseDown}
    >
      {/* Visual indicator */}
      <div className="absolute inset-y-0 -left-1 -right-1 group-hover:bg-gray-500 group-hover:opacity-30" />
      
      {/* Drag hint dots */}
      <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2">
        <div className="flex flex-col space-y-1">
          <div className="w-0.5 h-0.5 bg-gray-400 rounded-full opacity-60" />
          <div className="w-0.5 h-0.5 bg-gray-400 rounded-full opacity-60" />
          <div className="w-0.5 h-0.5 bg-gray-400 rounded-full opacity-60" />
        </div>
      </div>
    </div>
  );
}