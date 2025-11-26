import React, { useState, useRef, useEffect, useCallback } from 'react';
import { MousePointer2 } from 'lucide-react';

interface ComparisonSliderProps {
  originalImage: string; // base64 or url
  generatedImage: string; // base64 or url
}

export const ComparisonSlider: React.FC<ComparisonSliderProps> = ({ originalImage, generatedImage }) => {
  const [sliderPosition, setSliderPosition] = useState(50);
  const [isDragging, setIsDragging] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  const handleMove = useCallback((clientX: number) => {
    if (containerRef.current) {
      const rect = containerRef.current.getBoundingClientRect();
      const x = Math.max(0, Math.min(clientX - rect.left, rect.width));
      const percentage = (x / rect.width) * 100;
      setSliderPosition(percentage);
    }
  }, []);

  const onMouseDown = () => setIsDragging(true);
  const onTouchStart = () => setIsDragging(true);

  useEffect(() => {
    const onMouseUp = () => setIsDragging(false);
    const onMouseMove = (e: MouseEvent) => {
      if (isDragging) handleMove(e.clientX);
    };
    const onTouchMove = (e: TouchEvent) => {
      if (isDragging) handleMove(e.touches[0].clientX);
    };

    if (isDragging) {
      window.addEventListener('mouseup', onMouseUp);
      window.addEventListener('mousemove', onMouseMove);
      window.addEventListener('touchend', onMouseUp);
      window.addEventListener('touchmove', onTouchMove);
    }

    return () => {
      window.removeEventListener('mouseup', onMouseUp);
      window.removeEventListener('mousemove', onMouseMove);
      window.removeEventListener('touchend', onMouseUp);
      window.removeEventListener('touchmove', onTouchMove);
    };
  }, [isDragging, handleMove]);

  return (
    <div 
      ref={containerRef}
      className="relative w-full h-[500px] md:h-[600px] bg-stone-200 rounded-xl overflow-hidden cursor-crosshair select-none shadow-lg group"
      onClick={(e) => handleMove(e.clientX)}
    >
      {/* Generated Image (Underneath, or Top? Let's put Original on Right (After) and Generated on Left (Before) logic reversed usually) */}
      {/* Standard convention: Left is Before, Right is After. But user can drag. Let's put Original Bottom, Generated Top, clipped. */}
      
      {/* Background: Original Image (Full width) */}
      <img 
        src={`data:image/jpeg;base64,${originalImage}`} 
        className="absolute top-0 left-0 w-full h-full object-cover"
        alt="Original Room"
      />
      
      <div className="absolute top-4 right-4 bg-black/50 text-white px-2 py-1 rounded text-xs font-bold pointer-events-none">Original</div>

      {/* Foreground: Generated Image (Clipped width) */}
      <div 
        className="absolute top-0 left-0 h-full overflow-hidden border-r-2 border-white/50"
        style={{ width: `${sliderPosition}%` }}
      >
        <img 
          src={`data:image/jpeg;base64,${generatedImage}`} 
          className="absolute top-0 left-0 max-w-none h-full object-cover" 
          style={{ width: containerRef.current?.getBoundingClientRect().width || '100%' }} // Keep aspect ratio logic simple
          // Actually, for this to align perfectly, we need specific CSS.
          // Better approach: use w-full h-full but the container is clipped.
          // To ensure alignment, the inner image must have the same dimensions as the outer container
          // We can use calculated width from JS, or just use `width: 100vw` logic if it was full screen, 
          // but here it is container based.
          // Trick: Set width to the parent's width using standard calc if possible, or JS.
          // Let's rely on `w-[1000px]` (arbitrary large) or dynamic.
          // Correct way:
        />
         {/* We need to set the width of this inner image to match the PARENT container width exactly, regardless of the clipping container's width */}
         <img 
          src={`data:image/jpeg;base64,${generatedImage}`}
          className="absolute top-0 left-0 h-full object-cover max-w-none"
          style={{ width: containerRef.current ? containerRef.current.clientWidth : '100%' }}
          alt="Redesigned Room"
         />
         
         <div className="absolute top-4 left-4 bg-indigo-600/80 text-white px-2 py-1 rounded text-xs font-bold pointer-events-none">Reimagined</div>
      </div>

      {/* Slider Handle */}
      <div 
        className="absolute top-0 bottom-0 w-1 bg-white cursor-ew-resize flex items-center justify-center hover:bg-indigo-400 transition-colors"
        style={{ left: `${sliderPosition}%` }}
        onMouseDown={onMouseDown}
        onTouchStart={onTouchStart}
      >
        <div className="w-8 h-8 bg-white rounded-full shadow-xl flex items-center justify-center -ml-[1px]">
          <MousePointer2 size={16} className="text-indigo-600 rotate-90 transform" />
        </div>
      </div>
    </div>
  );
};
