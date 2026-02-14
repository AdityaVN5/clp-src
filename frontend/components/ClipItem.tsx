import React from 'react';
import { Clip, Collection, ColorTheme } from '../types';
import { IconHelper } from './IconHelper';
import { Pin, Trash2, Edit2, Tag, Palette, Type, FolderPlus, ChevronRight } from 'lucide-react';
import { COLORS } from '../constants';

interface ClipItemProps {
  clip: Clip;
  collection?: Collection;
  collections: Collection[];
  onDelete: (id: string) => void;
  onEdit: (id: string, newContent: string) => void;
  onPin: (id: string) => void;
  onMoveToCollection: (clipId: string, collectionId: string | null) => void;
  onLabelColor: (id: string, color: ColorTheme | null) => void;
  onLabelText: (id: string, text: string) => void;
  onRemoveLabel: (id: string) => void;
  onColor: (id: string, bg: string) => void;
  onClick: () => void;
  isSelected?: boolean; // New prop
  // Context Menu Props
  isMenuOpen: boolean;
  menuPosition: { x: number, y: number } | null;
  onContextMenuOpen: (id: string, x: number, y: number) => void;
}

const colorTextMap: Record<string, string> = {
  green: 'text-emerald-500 dark:text-emerald-400',
  yellow: 'text-amber-500 dark:text-amber-400',
  pink: 'text-rose-500 dark:text-rose-400',
  blue: 'text-sky-500 dark:text-sky-400',
  purple: 'text-violet-500 dark:text-violet-400',
  gray: 'text-gray-400 dark:text-gray-500',
};

const labelColorMap: Record<string, string> = {
  green: 'bg-emerald-500',
  yellow: 'bg-amber-500',
  pink: 'bg-rose-500',
  blue: 'bg-sky-500',
  purple: 'bg-violet-500',
  gray: 'bg-gray-400',
};

const dotColorMap: Record<string, string> = {
  green: 'bg-emerald-400',
  yellow: 'bg-amber-400',
  pink: 'bg-rose-400',
  blue: 'bg-sky-400',
  purple: 'bg-violet-400',
  gray: 'bg-gray-400',
};

const iconBgMap: Record<string, string> = {
  green: 'bg-emerald-400 dark:bg-emerald-600',
  yellow: 'bg-amber-400 dark:bg-amber-600',
  pink: 'bg-rose-400 dark:bg-rose-600',
  blue: 'bg-sky-400 dark:bg-sky-600',
  purple: 'bg-violet-400 dark:bg-violet-600',
  gray: 'bg-gray-300 dark:bg-slate-600',
};

// Pastel backgrounds
const bgColors = [
  { hex: '#ffffff', name: 'White' }, // default
  { hex: '#f0f9ff', name: 'Blue' },
  { hex: '#fdf2f8', name: 'Pink' },
  { hex: '#fffbeb', name: 'Yellow' },
  { hex: '#f0fdf4', name: 'Green' },
];

export const ClipItem: React.FC<ClipItemProps> = ({ 
  clip, 
  collection,
  collections,
  onDelete,
  onEdit,
  onPin,
  onMoveToCollection,
  onLabelColor,
  onLabelText,
  onRemoveLabel,
  onColor,
  onClick,
  isSelected,
  isMenuOpen,
  menuPosition,
  onContextMenuOpen
}) => {
  const collectionColor = collection?.color || 'gray';
  const collectionName = collection?.name || 'No collection';
  const collectionIcon = collection?.iconName || 'plus';
  
  const handleContextMenu = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation(); // Stop bubbling to prevent parent handlers (if any)
    onContextMenuOpen(clip.id, e.clientX, e.clientY);
  };

  // Logic to determine background color in dark mode
  // If user set a specific color (not white), use it (maybe opacity in future).
  // If default white, use dark slate.
  const customBg = clip.backgroundColor && clip.backgroundColor !== '#ffffff' ? clip.backgroundColor : undefined;

  // Ref for scrolling into view
  const itemRef = React.useRef<HTMLDivElement>(null);
  
  React.useEffect(() => {
    if (isSelected && itemRef.current) {
      itemRef.current.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    }
  }, [isSelected]);

  return (
    <>
      <div 
        ref={itemRef}
        onClick={onClick}
        onContextMenu={handleContextMenu}
        className={`
          group relative flex flex-col sm:flex-row sm:items-center py-6 border-b transition-all px-4 -mx-2 rounded-xl mb-2 cursor-pointer
          ${isSelected 
             ? 'ring-2 ring-blue-500 shadow-md bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-800' 
             : `border-gray-100 dark:border-slate-800 hover:shadow-md ${!customBg ? 'bg-white dark:bg-slate-900/50' : ''}`}
        `}
        style={customBg ? { backgroundColor: customBg } : {}}
      >
        {/* Pin Indicator */}
        {clip.isPinned && (
           <div className="absolute top-2 right-2 text-slate-400 dark:text-slate-500 rotate-45">
             <Pin size={16} fill="currentColor" />
           </div>
        )}

        {/* Custom Label (Top Bar or Badge) */}
        {clip.labelText ? (
           <div className={`absolute top-2 left-4 px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider text-white shadow-sm ${clip.labelColor ? labelColorMap[clip.labelColor] : 'bg-gray-500'}`}>
             {clip.labelText}
           </div>
        ) : clip.labelColor ? (
           <div className={`absolute top-0 left-6 w-12 h-1.5 rounded-b-md ${labelColorMap[clip.labelColor]}`} />
        ) : null}

        {/* Content Section (Left) */}
        {/* Added dynamic padding-top (pt-8) if label text exists to create space */}
        <div className={`flex-1 pr-4 min-w-0 mb-3 sm:mb-0 mt-2 sm:mt-0 ${clip.labelText ? 'pt-8' : ''}`}>
          {clip.type === 'text' ? (
            <p className={`text-[15px] leading-relaxed line-clamp-2 cursor-default pt-2 sm:pt-0 ${customBg ? 'text-slate-800' : 'text-slate-600 dark:text-slate-300'}`}>
              {clip.content}
            </p>
          ) : (
            <div className="h-24 w-64 rounded-xl overflow-hidden shadow-sm mt-2 sm:mt-0 bg-gray-100 dark:bg-slate-800">
               <img src={clip.imageSrc} alt="Clip" className="w-full h-full object-cover" />
            </div>
          )}
        </div>

        {/* Metadata Section (Right) */}
        <div className="flex items-center justify-between sm:justify-end sm:space-x-8 min-w-[200px]">
          <div className="flex flex-col items-start sm:items-end">
            <span className={`text-sm font-bold mb-1 ${colorTextMap[collectionColor]}`}>
              {collectionName}
            </span>
            <div className="flex items-center text-gray-400 dark:text-gray-500 text-xs font-medium space-x-1">
               <span>{clip.createdAt.split(' ').slice(0, -2).join(' ')}</span>
               <span className={`${customBg ? 'text-slate-800' : 'text-slate-800 dark:text-slate-200'} font-bold`}>{clip.createdAt.split(' ').slice(-2).join(' ')}</span>
            </div>
          </div>

          {/* Icon Badge */}
          <div className={`
            flex-shrink-0 w-12 h-12 rounded-xl flex items-center justify-center shadow-md shadow-gray-200 dark:shadow-none
            ${collection ? iconBgMap[collectionColor] + ' text-white' : 'bg-gray-200 dark:bg-slate-700 text-white'}
          `}>
            <IconHelper name={collectionIcon} size={24} />
          </div>
        </div>
      </div>

      {/* Context Menu */}
      {isMenuOpen && menuPosition && (
        <div 
          style={{ top: menuPosition.y, left: menuPosition.x }} 
          className="fixed z-50 bg-white dark:bg-slate-900 rounded-xl shadow-2xl border border-gray-100 dark:border-slate-800 w-60 overflow-visible animate-in fade-in duration-100 origin-top-left"
          onClick={(e) => e.stopPropagation()} // Prevent closing when clicking inside
        >
          <div className="py-1">
             {/* Add to Collection (Submenu) */}
             <div className="relative group/submenu">
                <button 
                  className="w-full text-left px-4 py-2.5 text-sm text-slate-700 dark:text-slate-200 hover:bg-gray-50 dark:hover:bg-slate-800 flex items-center justify-between font-medium transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <FolderPlus size={16} className="text-slate-400" /> 
                    <span>Add to</span>
                  </div>
                  <ChevronRight size={14} className="text-gray-400" />
                </button>
                
                {/* Nested Submenu */}
                <div className="absolute left-full top-0 ml-1 w-48 bg-white dark:bg-slate-900 rounded-xl shadow-xl border border-gray-100 dark:border-slate-800 overflow-hidden hidden group-hover/submenu:block animate-in fade-in slide-in-from-left-2 duration-100">
                    <div className="py-1 max-h-64 overflow-y-auto">
                         <button
                            onClick={() => onMoveToCollection(clip.id, null)}
                            className="w-full text-left px-4 py-2.5 text-sm text-slate-500 dark:text-slate-400 hover:bg-gray-50 dark:hover:bg-slate-800 hover:text-red-500 flex items-center gap-2 font-medium transition-colors"
                         >
                            <span className="w-2 h-2 rounded-full mr-2 border border-slate-300 dark:border-slate-600"></span>
                            Remove from collection
                         </button>
                         {collections.map(col => (
                             <button 
                                key={col.id}
                                onClick={() => onMoveToCollection(clip.id, col.id)}
                                className="w-full text-left px-4 py-2.5 text-sm text-slate-700 dark:text-slate-200 hover:bg-gray-50 dark:hover:bg-slate-800 flex items-center gap-2 font-medium transition-colors"
                             >
                                <span className={`w-2 h-2 rounded-full mr-2 ${dotColorMap[col.color]}`}></span>
                                {col.name}
                             </button>
                         ))}
                    </div>
                </div>
             </div>
             
             <div className="h-px bg-gray-50 dark:bg-slate-800 my-1"></div>

             {/* Edit */}
             {clip.type === 'text' && (
                <button 
                  onClick={() => onEdit(clip.id, clip.content || '')}
                  className="w-full text-left px-4 py-2.5 text-sm text-slate-700 dark:text-slate-200 hover:bg-gray-50 dark:hover:bg-slate-800 flex items-center gap-3 font-medium transition-colors"
                >
                  <Edit2 size={16} className="text-slate-400" /> Edit Clip
                </button>
             )}

             {/* Pin */}
             <button 
               onClick={() => onPin(clip.id)}
               className="w-full text-left px-4 py-2.5 text-sm text-slate-700 dark:text-slate-200 hover:bg-gray-50 dark:hover:bg-slate-800 flex items-center gap-3 font-medium transition-colors"
             >
               <Pin size={16} className={`text-slate-400 ${clip.isPinned ? 'fill-slate-400' : ''}`} /> 
               {clip.isPinned ? 'Unpin Clip' : 'Pin Clip'}
             </button>

             {/* Label Actions */}
             <div className="border-t border-gray-50 dark:border-slate-800 my-1">
                {/* Edit Text */}
                <button 
                  onClick={() => onLabelText(clip.id, clip.labelText || '')}
                  className="w-full text-left px-4 py-2.5 text-sm text-slate-700 dark:text-slate-200 hover:bg-gray-50 dark:hover:bg-slate-800 flex items-center gap-3 font-medium transition-colors"
                >
                  <Type size={16} className="text-slate-400" /> {clip.labelText ? 'Edit Label Text' : 'Add Label Text'}
                </button>
                
                {/* Remove Label Text if present */}
                {clip.labelText && (
                   <button 
                    onClick={() => onRemoveLabel(clip.id)}
                    className="w-full text-left px-4 py-2 text-xs text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 flex items-center gap-3 font-medium transition-colors pl-9"
                  >
                    Remove Label Text
                  </button>
                )}

                {/* Color Palette */}
                <div className="px-4 py-2">
                   <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-2 flex items-center gap-2">
                      <Tag size={10} /> Label Color
                   </p>
                   <div className="flex justify-between items-center">
                      <button 
                        onClick={() => onLabelColor(clip.id, null)}
                        title="None"
                        className="w-4 h-4 rounded-full border border-gray-300 dark:border-slate-600 bg-white dark:bg-slate-800 hover:scale-110"
                      />
                      {COLORS.map(color => (
                        <button
                          key={color}
                          onClick={() => onLabelColor(clip.id, color)}
                          className={`w-4 h-4 rounded-full ${labelColorMap[color]} hover:scale-110 transition-transform`}
                        />
                      ))}
                   </div>
                </div>
             </div>

             {/* Background Color Submenu Area */}
             <div className="px-4 py-2 border-t border-gray-50 dark:border-slate-800 my-1">
                <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-2 flex items-center gap-2">
                   <Palette size={10} /> Background
                </p>
                <div className="flex justify-between items-center">
                   {bgColors.map(c => (
                     <button
                       key={c.name}
                       onClick={() => onColor(clip.id, c.hex)}
                       style={{ backgroundColor: c.hex }}
                       className="w-5 h-5 rounded border border-gray-200 dark:border-slate-600 hover:scale-110 transition-transform shadow-sm"
                       title={c.name}
                     />
                   ))}
                </div>
             </div>

             {/* Delete */}
             <button 
               onClick={(e) => {
                 e.stopPropagation();
                 onDelete(clip.id);
               }}
               className="w-full text-left px-4 py-2.5 text-sm text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 flex items-center gap-3 font-medium transition-colors border-t border-gray-50 dark:border-slate-800"
             >
               <Trash2 size={16} /> Delete Clip
             </button>
          </div>
        </div>
      )}
    </>
  );
};