import React, { useState, useEffect } from 'react';
import { X } from 'lucide-react';

interface EditClipModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (content: string) => void;
  initialContent: string;
}

export const EditClipModal: React.FC<EditClipModalProps> = ({ 
  isOpen, 
  onClose, 
  onSave, 
  initialContent 
}) => {
  const [content, setContent] = useState('');

  useEffect(() => {
    if (isOpen) {
      setContent(initialContent);
    }
  }, [isOpen, initialContent]);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave(content);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/30 backdrop-blur-sm p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg overflow-hidden animate-in fade-in zoom-in duration-200">
        <div className="flex items-center justify-between p-4 border-b border-gray-100">
          <h2 className="text-lg font-bold text-slate-800">Edit Clip</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 transition-colors">
            <X size={20} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-4">
          <textarea
            value={content}
            onChange={(e) => setContent(e.target.value)}
            className="w-full h-48 p-4 rounded-xl bg-gray-50 border border-gray-200 focus:ring-2 focus:ring-blue-100 focus:border-blue-400 outline-none transition-all resize-none font-sans text-slate-700"
            placeholder="Clip content..."
            autoFocus
          />
          
          <div className="flex justify-end gap-3 mt-4">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-slate-600 hover:bg-gray-100 rounded-lg font-medium transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-6 py-2 bg-slate-800 text-white rounded-lg font-medium hover:bg-slate-900 transition-colors shadow-lg shadow-slate-200"
            >
              Save Changes
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};