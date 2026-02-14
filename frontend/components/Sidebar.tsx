import React, { useState, useEffect } from 'react';
import { PlusCircle, ChevronLeft, ChevronRight, Edit2, Trash2, ClipboardList, Layers } from 'lucide-react';
import { Collection, ColorTheme } from '../types';
import { COLORS } from '../constants';
import { IconHelper } from './IconHelper';

interface SidebarProps {
  isOpen: boolean;
  toggleSidebar: () => void;
  activeCollectionId: string | null;
  onSelectCollection: (id: string | null) => void;
  collections: Collection[];
  onAddCollection: () => void;
  onEditCollection: (collection: Collection) => void;
  onUpdateCollection: (id: string, updates: Partial<Collection>) => void;
  onDeleteCollection: (id: string) => void;
  onReorderCollections: (fromIndex: number, toIndex: number) => void;
}

// Minimal solid background colors with dark text for contrast
const colorMap: Record<ColorTheme, string> = {
  green: 'bg-emerald-100 text-emerald-900 dark:bg-emerald-900/30 dark:text-emerald-100',
  yellow: 'bg-amber-100 text-amber-900 dark:bg-amber-900/30 dark:text-amber-100',
  pink: 'bg-rose-100 text-rose-900 dark:bg-rose-900/30 dark:text-rose-100',
  blue: 'bg-sky-100 text-sky-900 dark:bg-sky-900/30 dark:text-sky-100',
  purple: 'bg-violet-100 text-violet-900 dark:bg-violet-900/30 dark:text-violet-100',
  gray: 'bg-gray-100 text-gray-900 dark:bg-slate-800 dark:text-gray-100',
};

const iconBgMap: Record<ColorTheme, string> = {
  green: 'bg-emerald-400 text-white dark:bg-emerald-500',
  yellow: 'bg-amber-400 text-white dark:bg-amber-500',
  pink: 'bg-rose-400 text-white dark:bg-rose-500',
  blue: 'bg-sky-400 text-white dark:bg-sky-500',
  purple: 'bg-violet-400 text-white dark:bg-violet-500',
  gray: 'bg-gray-400 text-white dark:bg-slate-500',
};

const dotColorMap: Record<ColorTheme, string> = {
  green: 'bg-emerald-400',
  yellow: 'bg-amber-400',
  pink: 'bg-rose-400',
  blue: 'bg-sky-400',
  purple: 'bg-violet-400',
  gray: 'bg-gray-400',
};

interface ContextMenuState {
  x: number;
  y: number;
  collectionId: string;
}

export const Sidebar: React.FC<SidebarProps> = ({ 
  isOpen, 
  toggleSidebar, 
  activeCollectionId, 
  onSelectCollection,
  collections,
  onAddCollection,
  onEditCollection,
  onUpdateCollection,
  onDeleteCollection,
  onReorderCollections
}) => {
  const [contextMenu, setContextMenu] = useState<ContextMenuState | null>(null);
  const [draggedIndex, setDraggedIndex] = useState<number | null>(null);

  // Close context menu on click outside
  useEffect(() => {
    const handleClick = () => setContextMenu(null);
    window.addEventListener('click', handleClick);
    return () => window.removeEventListener('click', handleClick);
  }, []);

  const handleContextMenu = (e: React.MouseEvent, collectionId: string) => {
    e.preventDefault();
    setContextMenu({ x: e.clientX, y: e.clientY, collectionId });
  };

  const handleDragStart = (e: React.DragEvent, index: number) => {
    setDraggedIndex(index);
    e.dataTransfer.effectAllowed = 'move';
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault(); // Necessary to allow dropping
  };

  const handleDrop = (e: React.DragEvent, targetIndex: number) => {
    e.preventDefault();
    if (draggedIndex === null || draggedIndex === targetIndex) return;
    onReorderCollections(draggedIndex, targetIndex);
    setDraggedIndex(null);
  };

  return (
    <div 
      className={`
        relative bg-white dark:bg-slate-950 border-r border-gray-100 dark:border-slate-800 h-full flex flex-col transition-all duration-300 ease-in-out
        ${isOpen ? 'w-full' : 'w-20'}
      `}
    >
      {/* Toggle Button */}
      <button 
        onClick={toggleSidebar}
        className="absolute -right-3 top-8 bg-white dark:bg-slate-800 border border-gray-100 dark:border-slate-700 shadow-sm rounded-full p-1 text-gray-400 dark:text-slate-400 hover:text-gray-600 dark:hover:text-slate-200 z-10"
      >
        {isOpen ? <ChevronLeft size={16} /> : <ChevronRight size={16} />}
      </button>

      {/* Header / Logo / New Collection */}
      <div className={`p-6 ${!isOpen ? 'flex flex-col items-center px-2 gap-6' : ''}`}>
        
        {/* Logo */}
        <div className={`flex items-center ${isOpen ? 'mb-8' : ''}`}>
           <div className="w-10 h-10 bg-slate-800 dark:bg-white text-white dark:text-slate-900 rounded-xl flex items-center justify-center shadow-lg shadow-slate-200 dark:shadow-none flex-shrink-0">
             <ClipboardList size={20} strokeWidth={2.5} />
           </div>
           {isOpen && (
             <span className="ml-2 text-xl font-black tracking-tight text-slate-800 dark:text-white">clp</span>
           )}
        </div>

        <button 
          onClick={onAddCollection}
          className={`
            flex items-center justify-center space-x-2 w-full py-3 rounded-full border border-gray-200 dark:border-slate-700 hover:shadow-sm transition-all text-slate-700 dark:text-slate-200 font-medium hover:bg-gray-50 dark:hover:bg-slate-800
            ${!isOpen ? 'w-10 h-10 p-0 rounded-xl' : 'px-4'}
          `}
          title={!isOpen ? "New Collection" : undefined}
        >
          <PlusCircle size={24} strokeWidth={1.5} />
          {isOpen && <span className="text-sm">New</span>}
        </button>
      </div>

      {/* Collections List */}
      <div className="flex-1 overflow-y-auto px-4 pb-4 space-y-4">
        
        {/* All History Item - Default Undeletable */}
        <div 
          onClick={() => onSelectCollection('all')}
          className={`
            group cursor-pointer rounded-xl transition-all duration-200 relative overflow-hidden select-none
            ${isOpen ? 'p-3 h-14 flex items-center' : 'mx-auto w-10 h-10 flex items-center justify-center mt-2 mb-2'} 
            ${activeCollectionId === 'all' && isOpen ? 'bg-slate-800 dark:bg-slate-700 text-white shadow-lg shadow-slate-200 dark:shadow-none' : ''}
            ${activeCollectionId === 'all' && !isOpen ? 'bg-slate-800 dark:bg-slate-700 text-white shadow-md' : 'hover:bg-gray-50 dark:hover:bg-slate-800'}
          `}
          title={!isOpen ? "All History" : undefined}
        >
          {isOpen ? (
             <div className="flex items-center w-full">
               <div className={`p-1.5 rounded-lg mr-3 flex-shrink-0 ${activeCollectionId === 'all' ? 'bg-white/20 text-white' : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300'}`}>
                 <Layers size={16} />
               </div>
               <div className="min-w-1 flex-1">
                 <h3 className={`font-bold text-xs truncate ${activeCollectionId === 'all' ? 'text-white' : 'text-slate-800 dark:text-white'}`}>All History</h3>
                 <p className={`text-[10px] font-medium mt-0.5 truncate ${activeCollectionId === 'all' ? 'text-white/60' : 'text-gray-400 dark:text-slate-400'}`}>Everything</p>
               </div>
             </div>
          ) : (
             <div className={`${activeCollectionId === 'all' ? 'text-white' : 'text-slate-500 dark:text-slate-400 group-hover:text-slate-700 dark:group-hover:text-slate-200'}`}>
                <Layers size={18} />
             </div>
          )}
        </div>
        
        {isOpen && <div className="h-px w-full bg-gray-100 dark:bg-slate-800 my-2"></div>}

        {collections.map((collection, index) => {
          const isActive = activeCollectionId === collection.id;
          
          return (
            <div 
              key={collection.id}
              onClick={() => onSelectCollection(collection.id)}
              onContextMenu={(e) => handleContextMenu(e, collection.id)}
              draggable
              onDragStart={(e) => handleDragStart(e, index)}
              onDragOver={handleDragOver}
              onDrop={(e) => handleDrop(e, index)}
              className={`
                group cursor-pointer rounded-xl transition-all duration-200 relative overflow-hidden select-none
                ${isOpen ? 'p-3 h-14 flex items-center' : 'mx-auto w-10 h-10 flex items-center justify-center'}
                ${isOpen ? colorMap[collection.color] : ''}
                ${isOpen && isActive ? 'ring-1 ring-offset-1 ring-gray-300 dark:ring-slate-600 shadow-sm' : ''}
                ${!isOpen && isActive ? iconBgMap[collection.color] + ' shadow-md' : ''}
                ${!isOpen && !isActive ? 'hover:bg-gray-50 dark:hover:bg-slate-800' : ''}
                ${draggedIndex === index ? 'opacity-50 border border-dashed border-gray-300' : ''}
              `}
              title={!isOpen ? collection.name : undefined}
            >
              {isOpen ? (
                 // Expanded View
                <div className="flex items-center w-full">
                  <div className={`
                    p-1.5 rounded-lg shadow-sm mr-3 flex-shrink-0
                    ${iconBgMap[collection.color]}
                  `}>
                    <IconHelper name={collection.iconName} size={16} />
                  </div>
                  <div className="min-w-0 flex-1">
                    <h3 className="font-bold text-xs truncate">{collection.name}</h3>
                    <p className="text-[10px] opacity-70 font-medium truncate">{collection.count} items</p>
                  </div>
                </div>
              ) : (
                // Collapsed View
                <div className={`
                  transition-all
                  ${isActive ? 'text-white' : 'text-slate-400 dark:text-slate-500 group-hover:text-slate-600 dark:group-hover:text-slate-300'}
                `}>
                   <IconHelper name={collection.iconName} size={18} />
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Context Menu */}
      {contextMenu && (
        <div 
          style={{ top: contextMenu.y, left: contextMenu.x }} 
          className="fixed z-50 bg-white dark:bg-slate-900 rounded-xl shadow-2xl border border-gray-100 dark:border-slate-700 w-56 overflow-hidden animate-in fade-in duration-100 origin-top-left"
        >
          <div className="py-1">
             <button 
              onClick={(e) => {
                e.stopPropagation();
                const col = collections.find(c => c.id === contextMenu.collectionId);
                if (col) onEditCollection(col);
                setContextMenu(null);
              }}
              className="w-full text-left px-4 py-2.5 text-sm text-slate-700 dark:text-slate-200 hover:bg-gray-50 dark:hover:bg-slate-800 flex items-center gap-3 font-medium transition-colors"
            >
              <Edit2 size={16} className="text-slate-400" /> Edit Collection
            </button>
            
            <div className="px-4 py-2 border-t border-b border-gray-50 dark:border-slate-800 my-1">
               <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-2">Change Color</p>
               <div className="flex justify-between items-center">
                  {COLORS.map(color => (
                    <button
                      key={color}
                      onClick={(e) => {
                        e.stopPropagation();
                        onUpdateCollection(contextMenu.collectionId, { color });
                        setContextMenu(null); // Optional: Keep open if user wants to see change
                      }}
                      className={`
                        w-6 h-6 rounded-full ${dotColorMap[color]} 
                        hover:scale-110 transition-transform ring-1 ring-offset-1 ring-transparent hover:ring-gray-200 dark:hover:ring-slate-600
                      `}
                    />
                  ))}
               </div>
            </div>

            <button 
              onClick={(e) => {
                e.stopPropagation();
                onDeleteCollection(contextMenu.collectionId);
                setContextMenu(null);
              }}
              className="w-full text-left px-4 py-2.5 text-sm text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 flex items-center gap-3 font-medium transition-colors"
            >
              <Trash2 size={16} /> Delete
            </button>
          </div>
        </div>
      )}
    </div>
  );
};