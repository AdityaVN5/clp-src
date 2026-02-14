import React, { useState, useMemo, useEffect } from 'react';
import { invoke } from '@tauri-apps/api/core';
import { listen } from '@tauri-apps/api/event';
import { Sidebar } from './components/Sidebar';
import { Header } from './components/Header';
import { ClipItem } from './components/ClipItem';
import { CollectionModal } from './components/CollectionModal';
import { SettingsModal } from './components/SettingsModal';
import { EditClipModal } from './components/EditClipModal';
import { LabelModal } from './components/LabelModal';
import { COLLECTIONS as INITIAL_COLLECTIONS } from './constants';
import { Collection, ColorTheme, Clip, SortOption, AppTheme } from './types';

const App: React.FC = () => {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [activeCollectionId, setActiveCollectionId] = useState<string | null>('all'); // Default to All History
  
  // State for Collections
  const [collections, setCollections] = useState<Collection[]>([]);
  
  // State for Clips
  const [clips, setClips] = useState<Clip[]>([]);
  
  // State for Search & Sort
  const [searchQuery, setSearchQuery] = useState('');
  const [sortOption, setSortOption] = useState<SortOption>('newest');

  // State for Screen Pinning
  const [isAppPinned, setIsAppPinned] = useState(false);

  // State for Context Menu (Global to prevent duplicates)
  const [activeContextMenu, setActiveContextMenu] = useState<{ id: string, x: number, y: number } | null>(null);

  // State for Modals
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [isEditClipOpen, setIsEditClipOpen] = useState(false);
  const [isLabelModalOpen, setIsLabelModalOpen] = useState(false);
  
  const [editingCollection, setEditingCollection] = useState<Collection | null>(null);
  const [clipToEdit, setClipToEdit] = useState<{ id: string, content: string } | null>(null);
  const [clipToLabel, setClipToLabel] = useState<{ id: string, text: string } | null>(null);

  // Theme State
  const [theme, setTheme] = useState<AppTheme>('system');

  // Apply Theme Effect
  useEffect(() => {
    const root = window.document.documentElement;
    root.classList.remove('light', 'dark');

    if (theme === 'system') {
      const systemTheme = window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
      root.classList.add(systemTheme);
    } else {
      root.classList.add(theme);
    }
  }, [theme]);

  // Load Data & Listen for Events
  useEffect(() => {
    invoke<Collection[]>('get_collections').then(setCollections);
    invoke<Clip[]>('get_clips').then(setClips);

    const unlistenChanged = listen<Clip>('clipboard-changed', (event) => {
       setClips(prev => [event.payload, ...prev]); 
    });

    return () => {
      unlistenChanged.then(f => f());
    };
  }, []);

  const toggleSidebar = () => setIsSidebarOpen(!isSidebarOpen);

  // Close context menu on global click
  useEffect(() => {
    const handleClick = () => setActiveContextMenu(null);
    window.addEventListener('click', handleClick);
    return () => window.removeEventListener('click', handleClick);
  }, []);

  const handleContextMenuOpen = (id: string, x: number, y: number) => {
    setActiveContextMenu({ id, x, y });
  };

  // --- Dynamic Collection Counts ---

  const handleToggleAppPin = () => {
    const newValue = !isAppPinned;
    setIsAppPinned(newValue);
    invoke('set_always_on_top', { value: newValue });
  };
  
  const handlePasteClip = async (clipId: string) => {
    await invoke('paste_clip', { id: clipId });
  };
  const collectionsWithCounts = useMemo(() => {
    return collections.map(col => ({
      ...col,
      count: clips.filter(c => c.collectionId === col.id).length
    }));
  }, [collections, clips]);

  // --- Collection Handlers ---

  const handleAddCollectionClick = () => {
    setEditingCollection(null);
    setIsModalOpen(true);
  };

  const handleEditCollectionClick = (collection: Collection) => {
    setEditingCollection(collection);
    setIsModalOpen(true);
  };

  const handleUpdateCollection = (id: string, updates: Partial<Collection>) => {
    setCollections(prev => prev.map(c => 
      c.id === id ? { ...c, ...updates } : c
    ));
  };

  const handleSaveCollection = (data: { name: string; color: ColorTheme; iconName: string }) => {
    if (editingCollection) {
      // Update existing
      invoke<Collection[]>('update_collection', { 
        id: editingCollection.id, 
        name: data.name, 
        color: data.color, 
        iconName: data.iconName 
      }).then(setCollections);
    } else {
      // Create new
      invoke<Collection[]>('create_collection', { 
        name: data.name, 
        color: data.color, 
        iconName: data.iconName 
      }).then(cols => {
        setCollections(cols);
      });
    }
    setIsModalOpen(false);
  };

  const handleDeleteCollection = (id: string) => {
    if (window.confirm('Are you sure you want to delete this collection?')) {
      invoke<Collection[]>('delete_collection', { id }).then(setCollections);
      if (activeCollectionId === id) {
        setActiveCollectionId('all');
      }
    }
  };

  const handleReorderCollections = (fromIndex: number, toIndex: number) => {
    const newCollections = [...collections];
    const [movedItem] = newCollections.splice(fromIndex, 1);
    newCollections.splice(toIndex, 0, movedItem);
    setCollections(newCollections);
  };

  // --- Clip Action Handlers ---

  const handleClipDelete = (id: string) => {
    invoke<Clip[]>('delete_clip', { id }).then(setClips);
  };

  const handleClipPin = (id: string) => {
    invoke<Clip[]>('toggle_pin', { id }).then(setClips);
  };

  const handleMoveToCollection = (clipId: string, collectionId: string | null) => {
    invoke<Clip[]>('move_clip', { id: clipId, collectionId }).then(setClips);
    setActiveContextMenu(null);
  };

  const handleClipLabelColor = (id: string, color: ColorTheme | null) => {
    const clip = clips.find(c => c.id === id);
    if (clip) {
        invoke<Clip[]>('set_clip_label', { id, text: clip.labelText || '', color }).then(setClips);
    }
  };

  const initiateClipLabelText = (id: string, currentText: string) => {
    setClipToLabel({ id, text: currentText });
    setIsLabelModalOpen(true);
  };

  const handleRemoveClipLabel = (id: string) => {
     invoke<Clip[]>('delete_clip_label', { id }).then(setClips);
  };

  const handleSaveClipLabelText = (text: string) => {
    if (clipToLabel) {
      const clip = clips.find(c => c.id === clipToLabel.id);
      invoke<Clip[]>('set_clip_label', { 
        id: clipToLabel.id, 
        text, 
        color: clip?.labelColor || null 
      }).then(setClips);
    }
  };

  const handleClipColor = (id: string, bg: string) => {
    invoke<Clip[]>('set_clip_color', { id, color: bg }).then(setClips);
  };

  const initiateClipEdit = (id: string, currentContent: string) => {
    setClipToEdit({ id, content: currentContent });
    setIsEditClipOpen(true);
  };

  const handleSaveClipEdit = (newContent: string) => {
    if (clipToEdit) {
      invoke<Clip[]>('update_clip', { id: clipToEdit.id, content: newContent }).then(setClips);
    }
  };

  // --- Settings Handlers ---
  
  const handleClearHistory = () => {
    setClips([]);
    setIsSettingsOpen(false);
  };

  // --- Filter & Sort Logic ---

  const filteredClips = useMemo(() => {
    let result = clips.filter(clip => {
      // 1. Collection Filter (If not "All History")
      if (activeCollectionId && activeCollectionId !== 'all' && clip.collectionId !== activeCollectionId) {
        return false;
      }

      // 2. Search Filter
      if (searchQuery.trim() !== '') {
        const query = searchQuery.toLowerCase();
        // Safely handle clips that might not have text content (like images)
        const contentMatch = clip.content ? clip.content.toLowerCase().includes(query) : false;
        const dateMatch = clip.createdAt.toLowerCase().includes(query);
        const labelMatch = clip.labelText ? clip.labelText.toLowerCase().includes(query) : false;
        
        return contentMatch || dateMatch || labelMatch;
      }

      return true;
    });

    // 3. Sorting
    result.sort((a, b) => {
      // Always prioritize pinned items
      if (a.isPinned && !b.isPinned) return -1;
      if (!a.isPinned && b.isPinned) return 1;

      // Then standard sort options
      switch (sortOption) {
        case 'newest':
          return b.timestamp - a.timestamp;
        case 'oldest':
          return a.timestamp - b.timestamp;
        case 'alphabetical':
          const textA = a.content || '';
          const textB = b.content || '';
          return textA.localeCompare(textB);
        default:
          return 0;
      }
    });

    return result;
  }, [clips, activeCollectionId, searchQuery, sortOption]);

  // --- Keyboard Navigation ---
  const [selectedIndex, setSelectedIndex] = useState(0);

  // Reset selection when list changes
  useEffect(() => {
    setSelectedIndex(0);
  }, [searchQuery, activeCollectionId, sortOption]); // Also maybe when clips change? 
  // If clips change dynamically (e.g. new copy), we might want to stay on 0 (newest).

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Ignore if modals are open
      if (isModalOpen || isSettingsOpen || isEditClipOpen || isLabelModalOpen) return;
      
      const isInput = document.activeElement instanceof HTMLInputElement || document.activeElement instanceof HTMLTextAreaElement;
      if (isInput && e.key !== 'Enter' && e.key !== 'Escape') {
          if (e.key === 'ArrowDown' && document.activeElement?.id === 'search-input') {
              e.preventDefault();
              (document.activeElement as HTMLElement).blur();
          }
          return;
      }

      if (e.key === 'ArrowDown') {
        e.preventDefault();
        setSelectedIndex(prev => Math.min(prev + 1, filteredClips.length - 1));
      } else if (e.key === 'ArrowUp') {
        e.preventDefault();
        setSelectedIndex(prev => Math.max(prev - 1, 0));
      } else if (e.key === 'Enter') {
        e.preventDefault();
        const selectedClip = filteredClips[selectedIndex];
        if (selectedClip) {
          handlePasteClip(selectedClip.id);
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [filteredClips, selectedIndex, isModalOpen, isSettingsOpen, isEditClipOpen, isLabelModalOpen]);

  return (
    <div className="flex h-screen bg-white dark:bg-slate-950 overflow-hidden font-sans transition-colors duration-200">
      {/* Sidebar (Push Layout) */}
      <div className={`flex-shrink-0 h-full z-20 bg-white dark:bg-slate-950 border-r border-gray-100 dark:border-slate-800 transition-all duration-300 ease-in-out overflow-hidden ${isSidebarOpen ? 'w-[170px]' : 'w-0'}`}>
        <div className="w-[170px] h-full"> 
          <Sidebar 
            isOpen={true} 
            toggleSidebar={toggleSidebar}
            activeCollectionId={activeCollectionId}
            onSelectCollection={(id) => { setActiveCollectionId(id); }} 
            collections={collectionsWithCounts} 
            onAddCollection={handleAddCollectionClick}
            onEditCollection={handleEditCollectionClick}
            onUpdateCollection={handleUpdateCollection}
            onDeleteCollection={handleDeleteCollection}
            onReorderCollections={handleReorderCollections}
          />
        </div>
      </div>

      {/* Right Pane (Main Window) */}
      <main className="flex-1 flex flex-col h-full overflow-hidden relative bg-white dark:bg-slate-950 min-w-0">
        
        <div className="flex flex-col h-full">
          {/* Header */}
          <div className="flex-none bg-white/95 dark:bg-slate-950/95 backdrop-blur-sm z-10 px-4 pt-4 transition-colors duration-200" style={{ height: 'min-content' }}>
            <Header 
              searchQuery={searchQuery}
              onSearchChange={setSearchQuery}
              sortOption={sortOption}
              onSortChange={setSortOption}
              onOpenSettings={() => setIsSettingsOpen(true)}
              isAppPinned={isAppPinned}
              onToggleAppPin={handleToggleAppPin}
              onToggleSidebar={toggleSidebar}
            />
            <div className="h-px w-full bg-gray-100 dark:bg-slate-800 mt-2 transition-colors duration-200"></div>
          </div>

          {/* Clips List Area */}
          <div className="flex-1 overflow-y-auto px-4 pb-4 custom-scrollbar">
            <div className="w-full">
              {/* Clips List */}
              <div className="space-y-2 mt-2">
                {filteredClips.length > 0 ? (
                  filteredClips.map((clip, index) => {
                    const collection = collections.find(c => c.id === clip.collectionId);
                    const isMenuOpen = activeContextMenu?.id === clip.id;
                    
                    return (
                      <ClipItem 
                        key={clip.id} 
                        clip={clip} 
                        collection={collection}
                        collections={collections}
                        isSelected={index === selectedIndex}
                        onDelete={handleClipDelete}
                        onPin={handleClipPin}
                        onEdit={initiateClipEdit}
                        onMoveToCollection={handleMoveToCollection}
                        onLabelColor={handleClipLabelColor}
                        onLabelText={initiateClipLabelText}
                        onRemoveLabel={handleRemoveClipLabel}
                        onColor={handleClipColor}
                        isMenuOpen={isMenuOpen}
                        menuPosition={isMenuOpen ? activeContextMenu : null}
                        onContextMenuOpen={handleContextMenuOpen}
                        onClick={() => {
                            setSelectedIndex(index); // update selection on click
                            handlePasteClip(clip.id);
                        }}
                      />
                    );
                  })
                ) : (
                  <div className="py-20 text-center text-gray-400 dark:text-slate-600">
                    <p>No clips found{searchQuery ? ` matching "${searchQuery}"` : ''}.</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </main>
      
      {/* Collection Modal */}
      <CollectionModal 
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSave={handleSaveCollection}
        initialData={editingCollection}
      />

      {/* Edit Clip Modal */}
      <EditClipModal 
        isOpen={isEditClipOpen}
        onClose={() => setIsEditClipOpen(false)}
        onSave={handleSaveClipEdit}
        initialContent={clipToEdit?.content || ''}
      />

      {/* Label Modal */}
      <LabelModal
        isOpen={isLabelModalOpen}
        onClose={() => setIsLabelModalOpen(false)}
        onSave={handleSaveClipLabelText}
        initialText={clipToLabel?.text || ''}
      />

      {/* Settings Modal */}
      <SettingsModal 
        isOpen={isSettingsOpen}
        onClose={() => setIsSettingsOpen(false)}
        onClearHistory={handleClearHistory}
        currentTheme={theme}
        onThemeChange={setTheme}
      />

    </div>
  );
};

export default App;