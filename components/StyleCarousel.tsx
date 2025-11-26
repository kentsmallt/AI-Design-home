import React from 'react';
import { DesignStyle } from '../types';

const STYLES: DesignStyle[] = [
  { id: 'mcm', name: 'Mid-Century Modern', prompt: 'Redesign in Mid-Century Modern style with teak furniture and organic curves', thumbnail: 'https://picsum.photos/id/10/100/100' },
  { id: 'scandi', name: 'Scandinavian', prompt: 'Redesign in Scandinavian style, minimalist, white walls, light wood, cozy textiles', thumbnail: 'https://picsum.photos/id/20/100/100' },
  { id: 'boho', name: 'Bohemian', prompt: 'Redesign in Bohemian style, plants, eclectic patterns, warm lighting, rattan texture', thumbnail: 'https://picsum.photos/id/30/100/100' },
  { id: 'industrial', name: 'Industrial', prompt: 'Redesign in Industrial style, exposed brick, metal accents, leather furniture, raw finishes', thumbnail: 'https://picsum.photos/id/40/100/100' },
  { id: 'coastal', name: 'Coastal', prompt: 'Redesign in Coastal style, airy, light blues, white linens, natural light', thumbnail: 'https://picsum.photos/id/50/100/100' },
];

interface StyleCarouselProps {
  onSelectStyle: (style: DesignStyle) => void;
  disabled: boolean;
}

export const StyleCarousel: React.FC<StyleCarouselProps> = ({ onSelectStyle, disabled }) => {
  return (
    <div className="w-full py-4">
      <h3 className="text-sm font-semibold text-stone-500 uppercase tracking-wider mb-3 px-1">Reimagine Style</h3>
      <div className="flex space-x-4 overflow-x-auto pb-2 scrollbar-hide">
        {STYLES.map((style) => (
          <button
            key={style.id}
            onClick={() => onSelectStyle(style)}
            disabled={disabled}
            className={`group flex-shrink-0 relative w-24 h-24 rounded-lg overflow-hidden border-2 border-transparent hover:border-indigo-500 transition-all focus:outline-none focus:ring-2 focus:ring-indigo-500 ${disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}
          >
            {/* Placeholder color if image fails, but using picsum here */}
            <div className="absolute inset-0 bg-stone-300 animate-pulse" /> 
            <img 
              src={style.thumbnail} 
              alt={style.name} 
              className="absolute inset-0 w-full h-full object-cover group-hover:scale-110 transition-transform duration-300"
            />
            <div className="absolute inset-0 bg-black/40 group-hover:bg-black/20 transition-colors flex items-end p-2">
              <span className="text-white text-xs font-bold leading-tight">{style.name}</span>
            </div>
          </button>
        ))}
      </div>
    </div>
  );
};
