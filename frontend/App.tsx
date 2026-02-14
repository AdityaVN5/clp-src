import React, { useState, useMemo, useEffect } from 'react';
import { Sidebar } from './components/Sidebar';
import { Header } from './components/Header';
import { ClipItem } from './components/ClipItem';
import { CollectionModal } from './components/CollectionModal';
import { SettingsModal } from './components/SettingsModal';
import { EditClipModal } from './components/EditClipModal';
import { LabelModal } from './components/LabelModal';
import { MOCK_CLIPS, COLLECTIONS as INITIAL_COLLECTIONS } from './constants';
import { Collection, ColorTheme, Clip, SortOption, AppTheme } from './types';

const App: React.FC = () => {
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [activeCollectionId, setActiveCollectionId] = useState<string | null>('all'); // Default to All History
  
  // State for Collections
  const [collections, setCollections] = useState<Collection[]>(INITIAL_COLLECTIONS);
  
  // State for Clips (moved from constant to state to allow deletion)
  const [clips, setClips] = useState<Clip[]>(MOCK_CLIPS);
  
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
      setCollections(prev => prev.map(c => 
        c.id === editingCollection.id 
          ? { ...c, ...data } 
          : c
      ));
    } else {
      // Create new
      const newCollection: Collection = {
        id: `c${Date.now()}`,
        name: data.name,
        count: 0,
        color: data.color,
        iconName: data.iconName,
      };
      setCollections(prev => [...prev, newCollection]);
      setActiveCollectionId(newCollection.id);
    }
    setIsModalOpen(false);
  };

  const handleDeleteCollection = (id: string) => {
    if (window.confirm('Are you sure you want to delete this collection?')) {
      setCollections(prev => prev.filter(c => c.id !== id));
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
    setClips(prev => prev.filter(c => c.id !== id));
  };

  const handleClipPin = (id: string) => {
    setClips(prev => prev.map(c => 
      c.id === id ? { ...c, isPinned: !c.isPinned } : c
    ));
  };

  const handleMoveToCollection = (clipId: string, collectionId: string | null) => {
    setClips(prev => prev.map(c => 
      c.id === clipId ? { ...c, collectionId } : c
    ));
    setActiveContextMenu(null);
  };

  const handleClipLabelColor = (id: string, color: ColorTheme | null) => {
    setClips(prev => prev.map(c => 
      c.id === id ? { ...c, labelColor: color } : c
    ));
  };

  const initiateClipLabelText = (id: string, currentText: string) => {
    setClipToLabel({ id, text: currentText });
    setIsLabelModalOpen(true);
  };

  const handleRemoveClipLabel = (id: string) => {
     setClips(prev => prev.map(c => 
        c.id === id ? { ...c, labelText: undefined } : c
      ));
  };

  const handleSaveClipLabelText = (text: string) => {
    if (clipToLabel) {
      setClips(prev => prev.map(c => 
        c.id === clipToLabel.id ? { ...c, labelText: text } : c
      ));
    }
  };

  const handleClipColor = (id: string, bg: string) => {
    setClips(prev => prev.map(c => 
      c.id === id ? { ...c, backgroundColor: bg } : c
    ));
  };

  const initiateClipEdit = (id: string, currentContent: string) => {
    setClipToEdit({ id, content: currentContent });
    setIsEditClipOpen(true);
  };

  const handleSaveClipEdit = (newContent: string) => {
    if (clipToEdit) {
      setClips(prev => prev.map(c => 
        c.id === clipToEdit.id ? { ...c, content: newContent } : c
      ));
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

  return (
    <div className="flex h-screen bg-white dark:bg-slate-950 overflow-hidden font-sans transition-colors duration-200">
      {/* Left Pane */}
      <aside className="h-full z-20 shadow-xl shadow-gray-100/50 dark:shadow-none border-r border-transparent dark:border-slate-800">
        <Sidebar 
          isOpen={isSidebarOpen} 
          toggleSidebar={toggleSidebar}
          activeCollectionId={activeCollectionId}
          onSelectCollection={setActiveCollectionId}
          collections={collectionsWithCounts} // Use computed collections
          onAddCollection={handleAddCollectionClick}
          onEditCollection={handleEditCollectionClick}
          onUpdateCollection={handleUpdateCollection}
          onDeleteCollection={handleDeleteCollection}
          onReorderCollections={handleReorderCollections}
        />
      </aside>

      {/* Right Pane (Main Window) */}
      <main className="flex-1 flex flex-col h-full overflow-hidden relative bg-white dark:bg-slate-950">
        <div className="absolute top-0 left-0 w-full h-2 bg-gradient-to-b from-gray-50/50 dark:from-slate-900/50 to-transparent z-10 pointer-events-none"></div>
        
        <div className="flex-1 overflow-y-auto px-8 md:px-12 pb-8 custom-scrollbar">
           <div className="max-w-5xl mx-auto w-full">
            {/* Header */}
            <div className="sticky top-0 bg-white/95 dark:bg-slate-950/95 backdrop-blur-sm z-10 pt-8 pb-2 transition-colors duration-200">
              <Header 
                searchQuery={searchQuery}
                onSearchChange={setSearchQuery}
                sortOption={sortOption}
                onSortChange={setSortOption}
                onOpenSettings={() => setIsSettingsOpen(true)}
                isAppPinned={isAppPinned}
                onToggleAppPin={() => setIsAppPinned(!isAppPinned)}
              />
              <div className="h-px w-full bg-gray-100 dark:bg-slate-800 mt-4 mb-2 transition-colors duration-200"></div>
            </div>

            {/* Clips List */}
            <div className="space-y-1">
              {filteredClips.length > 0 ? (
                filteredClips.map(clip => {
                  const collection = collections.find(c => c.id === clip.collectionId);
                  const isMenuOpen = activeContextMenu?.id === clip.id;
                  
                  return (
                    <ClipItem 
                      key={clip.id} 
                      clip={clip} 
                      collection={collection}
                      collections={collections} // Pass collections list
                      onDelete={handleClipDelete}
                      onPin={handleClipPin}
                      onEdit={initiateClipEdit}
                      onMoveToCollection={handleMoveToCollection} // Pass move handler
                      onLabelColor={handleClipLabelColor}
                      onLabelText={initiateClipLabelText}
                      onRemoveLabel={handleRemoveClipLabel}
                      onColor={handleClipColor}
                      isMenuOpen={isMenuOpen}
                      menuPosition={isMenuOpen ? activeContextMenu : null}
                      onContextMenuOpen={handleContextMenuOpen}
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