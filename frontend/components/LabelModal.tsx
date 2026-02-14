import React, { useState, useEffect } from 'react';
import { X, Tag } from 'lucide-react';

interface LabelModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (text: string) => void;
  initialText: string;
}

export const LabelModal: React.FC<LabelModalProps> = ({ 
  isOpen, 
  onClose, 
  onSave, 
  initialText 
}) => {
  const [text, setText] = useState('');

  useEffect(() => {
    if (isOpen) {
      setText(initialText);
    }
  }, [isOpen, initialText]);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave(text);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/30 backdrop-blur-sm p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm overflow-hidden animate-in fade-in zoom-in duration-200">
        <div className="flex items-center justify-between p-4 border-b border-gray-100">
          <h2 className="text-lg font-bold text-slate-800 flex items-center gap-2">
            <Tag size={18} />
            {initialText ? 'Edit Label' : 'Add Label'}
          </h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 transition-colors">
            <X size={20} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-4">
          <div className="mb-4">
            <label className="block text-sm font-semibold text-slate-600 mb-2">Label Text</label>
            <input
              type="text"
              value={text}
              onChange={(e) => setText(e.target.value)}
              className="w-full px-4 py-2 rounded-xl bg-gray-50 border border-gray-200 focus:ring-2 focus:ring-blue-100 focus:border-blue-400 outline-none transition-all text-slate-700"
              placeholder="e.g. Important, Todo..."
              autoFocus
              maxLength={20}
            />
            <p className="text-xs text-gray-400 mt-1 text-right">{text.length}/20</p>
          </div>
          
          <div className="flex justify-end gap-3 mt-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-slate-600 hover:bg-gray-100 rounded-lg font-medium transition-colors text-sm"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-6 py-2 bg-slate-800 text-white rounded-lg font-medium hover:bg-slate-900 transition-colors shadow-lg shadow-slate-200 text-sm"
            >
              Save Label
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};