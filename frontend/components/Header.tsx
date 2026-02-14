import React, { useState, useRef, useEffect } from 'react';
import { Search, Settings, ChevronDown, Check, Pin, PinOff } from 'lucide-react';
import { SortOption } from '../types';

interface HeaderProps {
  searchQuery: string;
  onSearchChange: (query: string) => void;
  sortOption: SortOption;
  onSortChange: (option: SortOption) => void;
  onOpenSettings: () => void;
  isAppPinned: boolean;
  onToggleAppPin: () => void;
}

export const Header: React.FC<HeaderProps> = ({ 
  searchQuery, 
  onSearchChange,
  sortOption,
  onSortChange,
  onOpenSettings,
  isAppPinned,
  onToggleAppPin
}) => {
  const [isSortOpen, setIsSortOpen] = useState(false);
  const sortRef = useRef<HTMLDivElement>(null);

  // Close sort dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (sortRef.current && !sortRef.current.contains(event.target as Node)) {
        setIsSortOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const getSortLabel = (option: SortOption) => {
    switch (option) {
      case 'newest': return 'Sort by date (Newest)';
      case 'oldest': return 'Sort by date (Oldest)';
      case 'alphabetical': return 'Sort A-Z';
      default: return 'Sort by';
    }
  };

  const handleSortSelect = (option: SortOption) => {
    onSortChange(option);
    setIsSortOpen(false);
  };

  return (
    <div className="flex flex-col md:flex-row md:items-center justify-between py-6 px-1 mb-2 space-y-4 md:space-y-0">
      {/* Search Bar */}
      <div className="relative w-full md:w-96 group">
        <input 
          type="text" 
          placeholder="Search..." 
          value={searchQuery}
          onChange={(e) => onSearchChange(e.target.value)}
          className="w-full pl-6 pr-12 py-3.5 bg-gray-100/80 dark:bg-slate-800/80 border-none rounded-full text-sm text-gray-700 dark:text-gray-200 focus:ring-2 focus:ring-blue-100 dark:focus:ring-blue-900 focus:bg-white dark:focus:bg-slate-800 transition-all outline-none placeholder-gray-500 dark:placeholder-gray-400 font-medium"
        />
        <Search className="absolute right-4 top-1/2 transform -translate-y-1/2 text-slate-500 dark:text-slate-400" size={20} />
      </div>

      {/* Actions */}
      <div className="flex items-center justify-end space-x-4">
        
        {/* Screen Pin Button (Visual Only in Web) */}
        <button
          onClick={onToggleAppPin}
          className={`
            p-2 rounded-full transition-all duration-200 
            ${isAppPinned 
              ? 'bg-blue-100 text-blue-600 dark:bg-blue-900 dark:text-blue-300 shadow-sm ring-1 ring-blue-200 dark:ring-blue-800' 
              : 'text-slate-500 dark:text-slate-400 hover:bg-gray-100 dark:hover:bg-slate-800 hover:text-slate-800 dark:hover:text-slate-200'}
          `}
          title={isAppPinned ? "Unpin from screen" : "Pin to screen"}
        >
          {isAppPinned ? <Pin size={20} fill="currentColor" /> : <PinOff size={20} />}
        </button>

        <div className="h-6 w-px bg-gray-200 dark:bg-slate-700 mx-2"></div>

        {/* Sort Dropdown */}
        <div className="relative" ref={sortRef}>
          <button 
            onClick={() => setIsSortOpen(!isSortOpen)}
            className="flex items-center space-x-2 text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white font-medium text-sm focus:outline-none"
          >
            <span>{getSortLabel(sortOption)}</span>
            <ChevronDown size={16} className={`transition-transform duration-200 ${isSortOpen ? 'rotate-180' : ''}`} />
          </button>

          {isSortOpen && (
            <div className="absolute right-0 top-full mt-2 w-56 bg-white dark:bg-slate-900 rounded-xl shadow-xl border border-gray-100 dark:border-slate-800 py-1 z-50 animate-in fade-in zoom-in-95 duration-100">
              <div className="px-4 py-2 border-b border-gray-50 dark:border-slate-800 text-xs font-bold text-gray-400 uppercase tracking-wider">
                Sort Options
              </div>
              
              <button 
                onClick={() => handleSortSelect('newest')}
                className="w-full text-left px-4 py-2.5 text-sm text-slate-700 dark:text-slate-300 hover:bg-gray-50 dark:hover:bg-slate-800 flex items-center justify-between"
              >
                <span>Date created (Newest)</span>
                {sortOption === 'newest' && <Check size={14} className="text-blue-500" />}
              </button>
              
              <button 
                onClick={() => handleSortSelect('oldest')}
                className="w-full text-left px-4 py-2.5 text-sm text-slate-700 dark:text-slate-300 hover:bg-gray-50 dark:hover:bg-slate-800 flex items-center justify-between"
              >
                <span>Date created (Oldest)</span>
                {sortOption === 'oldest' && <Check size={14} className="text-blue-500" />}
              </button>
              
              <button 
                onClick={() => handleSortSelect('alphabetical')}
                className="w-full text-left px-4 py-2.5 text-sm text-slate-700 dark:text-slate-300 hover:bg-gray-50 dark:hover:bg-slate-800 flex items-center justify-between"
              >
                <span>Alphabetical (A-Z)</span>
                {sortOption === 'alphabetical' && <Check size={14} className="text-blue-500" />}
              </button>
            </div>
          )}
        </div>
        
        {/* Settings Button */}
        <button 
          onClick={onOpenSettings}
          className="text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200 transition-colors p-2 rounded-full hover:bg-gray-100 dark:hover:bg-slate-800"
          title="Settings"
        >
          <Settings size={22} />
        </button>
      </div>
    </div>
  );
};