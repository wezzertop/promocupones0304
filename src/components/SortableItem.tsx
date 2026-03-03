
import React from 'react';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { X, GripVertical } from 'lucide-react';

interface SortableItemProps {
  id: string;
  url: string;
  onRemove: (id: string) => void;
  index: number;
}

export function SortableItem({ id, url, onRemove, index }: SortableItemProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    zIndex: isDragging ? 50 : 'auto',
    opacity: isDragging ? 0.8 : 1,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className="relative aspect-square rounded-xl overflow-hidden border border-white/10 group bg-black/20 touch-none"
    >
      <img src={url} alt="Deal" className="w-full h-full object-cover" />
      
      {/* Drag Handle */}
      <div 
        {...attributes} 
        {...listeners}
        className="absolute top-2 left-2 p-1.5 bg-black/60 rounded-lg text-white/80 hover:text-white cursor-grab active:cursor-grabbing opacity-0 group-hover:opacity-100 transition-opacity"
      >
        <GripVertical size={16} />
      </div>

      {/* Remove Button */}
      <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity">
        <button
          type="button"
          onClick={() => onRemove(id)}
          className="p-1.5 bg-red-500/80 text-white rounded-lg hover:bg-red-600 transition-colors"
        >
          <X size={16} />
        </button>
      </div>

      {/* Index Badge */}
      <div className="absolute bottom-2 left-2 bg-black/60 backdrop-blur-sm text-white text-[10px] font-bold px-2 py-0.5 rounded pointer-events-none">
        {index === 0 ? 'Principal' : `#${index + 1}`}
      </div>
    </div>
  );
}
