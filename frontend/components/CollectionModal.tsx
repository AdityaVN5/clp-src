import React, { useState, useEffect } from 'react';
import { X, Check } from 'lucide-react';
import { Collection, ColorTheme } from '../types';
import { COLORS, ICONS } from '../constants';
import { IconHelper } from './IconHelper';

interface CollectionModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (data: { name: string; color: ColorTheme; iconName: string }) => void;
  initialData?: Collection | null;
}

const colorBgMap: Record<ColorTheme, string> = {
  green: 'bg-emerald-400',
  yellow: 'bg-amber-400',
  pink: 'bg-rose-400',
  blue: 'bg-sky-400',
  purple: 'bg-violet-400',
  gray: 'bg-gray-400',
};

export const CollectionModal: React.FC<CollectionModalProps> = ({ 
  isOpen, 
  onClose, 
  onSave, 
  initialData 
}) => {
  const [name, setName] = useState('');
  const [selectedIcon, setSelectedIcon] = useState<string>(ICONS[0]);
  const [selectedColor, setSelectedColor] = useState<ColorTheme>('blue');

  // Reset or populate form when modal opens
  useEffect(() => {
    if (isOpen) {
      if (initialData) {
        setName(initialData.name);
        setSelectedIcon(initialData.iconName);
        setSelectedColor(initialData.color);
      } else {
        setName('');
        setSelectedIcon(ICONS[0]);
        setSelectedColor('blue');
      }
    }
  }, [isOpen, initialData]);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;
    onSave({ name, color: selectedColor, iconName: selectedIcon });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 backdrop-blur-sm p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden animate-in fade-in zoom-in duration-200">
        <div className="flex items-center justify-between p-6 border-b border-gray-100">
          <h2 className="text-xl font-bold text-slate-800">
            {initialData ? 'Edit Collection' : 'New Collection'}
          </h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 transition-colors">
            <X size={20} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          {/* Name Input */}
          <div>
            <label className="block text-sm font-semibold text-slate-600 mb-2">Name</label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g., Work Projects"
              className="w-full px-4 py-3 rounded-xl bg-gray-50 border border-gray-200 focus:ring-2 focus:ring-blue-100 focus:border-blue-400 outline-none transition-all"
              autoFocus
            />
          </div>

          {/* Color Selection */}
          <div>
            <label className="block text-sm font-semibold text-slate-600 mb-3">Color</label>
            <div className="flex gap-3">
              {COLORS.map((color) => (
                <button
                  key={color}
                  type="button"
                  onClick={() => setSelectedColor(color)}
                  className={`
                    w-8 h-8 rounded-full ${colorBgMap[color]} transition-transform hover:scale-110 flex items-center justify-center
                    ${selectedColor === color ? 'ring-2 ring-offset-2 ring-slate-400 scale-110' : ''}
                  `}
                >
                  {selectedColor === color && <Check size={14} className="text-white" strokeWidth={3} />}
                </button>
              ))}
            </div>
          </div>

          {/* Icon Selection */}
          <div>
            <label className="block text-sm font-semibold text-slate-600 mb-3">Icon</label>
            <div className="grid grid-cols-5 gap-3">
              {ICONS.map((icon) => (
                <button
                  key={icon}
                  type="button"
                  onClick={() => setSelectedIcon(icon)}
                  className={`
                    p-3 rounded-xl flex items-center justify-center transition-all border
                    ${selectedIcon === icon 
                      ? 'bg-slate-100 border-slate-300 text-slate-800' 
                      : 'bg-white border-gray-100 text-gray-400 hover:bg-gray-50 hover:text-gray-600'}
                  `}
                >
                  <IconHelper name={icon} size={20} />
                </button>
              ))}
            </div>
          </div>

          <div className="pt-2">
            <button
              type="submit"
              disabled={!name.trim()}
              className="w-full py-3 bg-slate-800 text-white rounded-xl font-medium hover:bg-slate-900 transition-colors disabled:opacity-50 disabled:cursor-not-allowed shadow-lg shadow-slate-200"
            >
              {initialData ? 'Save Changes' : 'Create Collection'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};