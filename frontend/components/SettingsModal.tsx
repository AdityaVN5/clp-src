import React, { useState } from 'react';
import { 
  X, Trash2, Shield, Monitor, Keyboard, Info, Camera, Command, 
  Database, Save, Edit2, Moon, Sun, Laptop, Bell, HardDrive, Check,
  Eye, EyeOff, FileText, Image as ImageIcon, ToggleLeft, Activity,
  Download, Upload
} from 'lucide-react';
import { AppTheme } from '../types';

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  onClearHistory: () => void;
  currentTheme: AppTheme;
  onThemeChange: (theme: AppTheme) => void;
}

type Tab = 'general' | 'hotkeys' | 'storage' | 'appearance' | 'about';

interface Shortcut {
  id: string;
  label: string;
  keys: string[];
}

export const SettingsModal: React.FC<SettingsModalProps> = ({ 
  isOpen, 
  onClose, 
  onClearHistory,
  currentTheme,
  onThemeChange
}) => {
  const [activeTab, setActiveTab] = useState<Tab>('general');
  
  // General State
  const [monitoringEnabled, setMonitoringEnabled] = useState(true);
  const [captureText, setCaptureText] = useState(true);
  const [captureImages, setCaptureImages] = useState(true);
  const [ignoreSensitive, setIgnoreSensitive] = useState(true);
  const [incognitoMode, setIncognitoMode] = useState(false);

  // Hotkeys State
  const [isEditingHotkeys, setIsEditingHotkeys] = useState(false);
  const [shortcuts, setShortcuts] = useState<Shortcut[]>([
    { id: '1', label: 'Open Clipboard History', keys: ['Ctrl', 'Shift', 'V'] },
    { id: '2', label: 'Paste Last Copied Item', keys: ['Ctrl', 'Alt', 'V'] },
    { id: '3', label: 'Paste Without Formatting', keys: ['Ctrl', 'Shift', 'Alt', 'V'] },
    { id: '4', label: 'Cycle Previous Item', keys: ['Ctrl', 'Shift', '↑'] },
    { id: '5', label: 'Cycle Next Item', keys: ['Ctrl', 'Shift', '↓'] },
  ]);

  // Storage State
  const [maxClips, setMaxClips] = useState(''); // Empty = Unlimited
  const [autoDeleteTime, setAutoDeleteTime] = useState('never');
  const [deleteOnLogout, setDeleteOnLogout] = useState(false);
  const [memoryLimit, setMemoryLimit] = useState('512');

  // Appearance State
  const [panelStyle, setPanelStyle] = useState('center');
  const [trayBehavior, setTrayBehavior] = useState({
    quickAccess: true,
    pause: false,
    openHistory: true,
    exit: true
  });
  const [notifications, setNotifications] = useState(true);
  const [windowBehavior, setWindowBehavior] = useState('auto-close');

  if (!isOpen) return null;

  const handleClear = () => {
    if (window.confirm('Are you sure you want to clear all clipboard history? This action cannot be undone.')) {
      onClearHistory();
      onClose();
    }
  };

  const handleShortcutChange = (id: string, value: string) => {
    // Simple parser for UI demo: splits by + or space
    const newKeys = value.split(/[ +]+/).filter(k => k.trim() !== '');
    setShortcuts(prev => prev.map(s => s.id === id ? { ...s, keys: newKeys } : s));
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 backdrop-blur-sm p-4 sm:p-6">
      <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-2xl w-full max-w-3xl overflow-hidden animate-in fade-in zoom-in duration-200 flex flex-col md:flex-row h-full md:h-[600px] max-h-[90vh]">
        
        {/* Sidebar / Top Bar */}
        <div className="w-full md:w-64 bg-gray-50 dark:bg-slate-950 border-b md:border-b-0 md:border-r border-gray-100 dark:border-slate-800 p-2 md:p-4 flex flex-row md:flex-col gap-1 overflow-x-auto md:overflow-y-auto shrink-0 scrollbar-hide">
          <h2 className="hidden md:block text-lg font-bold text-slate-800 dark:text-white px-4 mb-4 mt-2">Settings</h2>
          
          <NavButton active={activeTab === 'general'} onClick={() => setActiveTab('general')} icon={<Shield size={18} />} label="General" />
          <NavButton active={activeTab === 'hotkeys'} onClick={() => setActiveTab('hotkeys')} icon={<Keyboard size={18} />} label="Hotkeys" />
          <NavButton active={activeTab === 'storage'} onClick={() => setActiveTab('storage')} icon={<Database size={18} />} label="History" />
          <NavButton active={activeTab === 'appearance'} onClick={() => setActiveTab('appearance')} icon={<Monitor size={18} />} label="Appearance" />
          <NavButton active={activeTab === 'about'} onClick={() => setActiveTab('about')} icon={<Info size={18} />} label="About" />
        </div>

        {/* Content */}
        <div className="flex-1 flex flex-col min-w-0 bg-white dark:bg-slate-900 transition-colors overflow-hidden">
          <div className="flex justify-between items-center p-4 md:p-6 border-b border-gray-100 dark:border-slate-800 flex-shrink-0">
             <h3 className="font-bold text-slate-700 dark:text-slate-200 text-base md:text-lg capitalize flex items-center gap-2">
               {activeTab === 'storage' ? 'History & Storage' : activeTab === 'hotkeys' ? 'Hotkeys & Shortcuts' : activeTab}
             </h3>
             <button onClick={onClose} className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 p-1 rounded-full hover:bg-gray-100 dark:hover:bg-slate-800 transition-colors">
               <X size={20} />
             </button>
          </div>

          <div className="p-6 overflow-y-auto flex-1 custom-scrollbar text-slate-700 dark:text-slate-300">
            
            {/* --- GENERAL TAB --- */}
            {activeTab === 'general' && (
              <div className="space-y-6">
                
                {/* 1) Enable Clipboard Monitoring */}
                <div className="flex items-center justify-between">
                  <div>
                    <h4 className="font-medium text-slate-800 dark:text-white flex items-center gap-2">
                       <Activity size={16} className="text-blue-500" />
                       Clipboard Monitoring
                    </h4>
                    <p className="text-sm text-gray-500 dark:text-gray-400">Master switch to enable or disable recording</p>
                  </div>
                  <Switch checked={monitoringEnabled} onChange={() => setMonitoringEnabled(!monitoringEnabled)} />
                </div>

                <div className="h-px bg-gray-100 dark:bg-slate-800" />

                {/* 2 & 3) Content Types */}
                <div className="space-y-4">
                   <h4 className="text-xs font-bold text-gray-400 uppercase tracking-wider">Content Types</h4>
                   <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2 text-sm font-medium">
                        <FileText size={16} className="text-slate-400" /> Capture Text
                      </div>
                      <Switch checked={captureText} onChange={() => setCaptureText(!captureText)} disabled={!monitoringEnabled} />
                   </div>
                   <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2 text-sm font-medium">
                        <ImageIcon size={16} className="text-slate-400" /> Capture Images
                      </div>
                      <Switch checked={captureImages} onChange={() => setCaptureImages(!captureImages)} disabled={!monitoringEnabled} />
                   </div>
                </div>

                 <div className="h-px bg-gray-100 dark:bg-slate-800" />

                {/* 4) Ignore Sensitive */}
                <div className="flex items-center justify-between">
                  <div>
                    <h4 className="font-medium text-slate-800 dark:text-white flex items-center gap-2">
                       {ignoreSensitive ? <EyeOff size={16} className="text-slate-400" /> : <Eye size={16} className="text-slate-400" />}
                       Ignore Sensitive Data
                    </h4>
                    <p className="text-sm text-gray-500 dark:text-gray-400">Don't save items that look like passwords or cards</p>
                  </div>
                  <Switch checked={ignoreSensitive} onChange={() => setIgnoreSensitive(!ignoreSensitive)} disabled={!monitoringEnabled} />
                </div>

                {/* 5) Incognito Mode */}
                <div className="p-4 bg-purple-50 dark:bg-purple-900/20 border border-purple-100 dark:border-purple-800/50 rounded-xl">
                  <div className="flex items-center justify-between">
                    <div>
                      <h4 className="font-bold text-purple-900 dark:text-purple-300 flex items-center gap-2">
                         <Camera size={16} />
                         Incognito Mode
                      </h4>
                      <p className="text-sm text-purple-700 dark:text-purple-400/80">Stop recording history temporarily</p>
                    </div>
                    <Switch checked={incognitoMode} onChange={() => setIncognitoMode(!incognitoMode)} activeColor="bg-purple-500" />
                  </div>
                </div>
              </div>
            )}

            {/* --- HOTKEYS TAB --- */}
            {activeTab === 'hotkeys' && (
               <div className="space-y-4">
                  <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-100 dark:border-blue-900/50 rounded-xl p-4 mb-2">
                    <p className="text-blue-800 dark:text-blue-300 text-sm flex items-start gap-2">
                       <Command size={16} className="mt-0.5 shrink-0" />
                       Global hotkeys allow you to access Clp features from any application.
                    </p>
                  </div>

                  <div className="flex justify-end mb-2">
                    {isEditingHotkeys ? (
                      <button 
                        onClick={() => setIsEditingHotkeys(false)}
                        className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 transition-colors shadow-sm"
                      >
                        <Save size={16} /> Save Changes
                      </button>
                    ) : (
                      <button 
                        onClick={() => setIsEditingHotkeys(true)}
                        className="flex items-center gap-2 px-4 py-2 bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-700 text-slate-700 dark:text-slate-200 rounded-lg text-sm font-medium hover:bg-gray-50 dark:hover:bg-slate-700 transition-colors shadow-sm"
                      >
                        <Edit2 size={16} /> Edit Hotkeys
                      </button>
                    )}
                  </div>

                  <div className="space-y-1">
                    {shortcuts.map((shortcut) => (
                      <div key={shortcut.id} className="flex items-center justify-between py-3 border-b border-gray-50 dark:border-slate-800 last:border-0 group">
                        <span className="text-slate-700 dark:text-slate-300 font-medium text-sm">{shortcut.label}</span>
                        <div className="flex gap-1">
                          {isEditingHotkeys ? (
                            <input 
                              type="text" 
                              defaultValue={shortcut.keys.join(' + ')}
                              className="px-3 py-1.5 bg-white dark:bg-slate-800 border border-gray-300 dark:border-slate-600 rounded-md text-sm text-slate-800 dark:text-white font-medium focus:ring-2 focus:ring-blue-100 outline-none w-48 text-center"
                              onChange={(e) => handleShortcutChange(shortcut.id, e.target.value)}
                            />
                          ) : (
                            shortcut.keys.map((k, i) => (
                              <kbd key={i} className="px-2 py-1 bg-gray-100 dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-md text-xs font-bold text-gray-600 dark:text-gray-400 min-w-[24px] text-center shadow-sm font-sans">
                                {k}
                              </kbd>
                            ))
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
               </div>
            )}

            {/* --- STORAGE TAB --- */}
            {activeTab === 'storage' && (
              <div className="space-y-8">
                
                {/* Limits */}
                <section>
                  <h4 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-4 flex items-center gap-2">
                    <HardDrive size={14} /> Storage Limits
                  </h4>
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <span className="text-slate-700 dark:text-slate-300 font-medium text-sm block">Max Stored Clips</span>
                        <span className="text-xs text-gray-500 dark:text-gray-500">Oldest clips will be removed when limit is reached</span>
                      </div>
                      <input 
                        type="number" 
                        placeholder="Unlimited" 
                        value={maxClips}
                        onChange={(e) => setMaxClips(e.target.value)}
                        className="w-32 px-3 py-2 bg-gray-50 dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-lg text-sm outline-none focus:ring-2 focus:ring-blue-100 transition-all text-right dark:text-white"
                      />
                    </div>
                    
                    <div className="flex items-center justify-between">
                      <div>
                        <span className="text-slate-700 dark:text-slate-300 font-medium text-sm block">Memory Usage Limit</span>
                        <span className="text-xs text-gray-500 dark:text-gray-500">Soft limit for application memory</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <input 
                          type="range" 
                          min="128" 
                          max="2048" 
                          step="128"
                          value={memoryLimit}
                          onChange={(e) => setMemoryLimit(e.target.value)}
                          className="w-32 accent-blue-600"
                        />
                        <span className="text-sm font-medium text-slate-700 dark:text-slate-300 w-16 text-right">{memoryLimit} MB</span>
                      </div>
                    </div>
                  </div>
                </section>

                <div className="h-px bg-gray-100 dark:bg-slate-800" />

                {/* Cleanup */}
                <section>
                  <h4 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-4 flex items-center gap-2">
                    <Trash2 size={14} /> Auto Cleanup
                  </h4>
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <span className="text-slate-700 dark:text-slate-300 font-medium text-sm">Auto-delete after</span>
                      <select 
                        value={autoDeleteTime}
                        onChange={(e) => setAutoDeleteTime(e.target.value)}
                        className="px-3 py-2 bg-gray-50 dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-lg text-sm outline-none focus:ring-2 focus:ring-blue-100 dark:text-white"
                      >
                        <option value="never">Never</option>
                        <option value="1h">1 Hour</option>
                        <option value="24h">24 Hours</option>
                        <option value="7d">7 Days</option>
                        <option value="30d">30 Days</option>
                      </select>
                    </div>

                    <div className="flex items-center justify-between">
                      <span className="text-slate-700 dark:text-slate-300 font-medium text-sm">Delete on PC Logout / Shutdown</span>
                      <Switch checked={deleteOnLogout} onChange={() => setDeleteOnLogout(!deleteOnLogout)} />
                    </div>

                    <div className="pt-2">
                       <button 
                         onClick={handleClear}
                         className="text-red-600 dark:text-red-400 text-sm font-medium hover:text-red-700 dark:hover:text-red-300 flex items-center gap-2 px-3 py-2 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors -ml-3"
                       >
                         <Trash2 size={16} /> Clear All History Now
                       </button>
                    </div>
                  </div>
                </section>
                
                <div className="h-px bg-gray-100 dark:bg-slate-800" />

                {/* Backup */}
                <section>
                   <h4 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-4 flex items-center gap-2">
                    <Database size={14} /> Backup & Restore
                   </h4>
                   <div className="flex gap-3">
                      <button className="flex-1 py-2.5 bg-gray-50 dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-lg text-sm font-medium text-slate-700 dark:text-slate-300 hover:bg-gray-100 dark:hover:bg-slate-700 flex items-center justify-center gap-2 transition-colors">
                        <Download size={16} /> Export Backup
                      </button>
                      <button className="flex-1 py-2.5 bg-gray-50 dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-lg text-sm font-medium text-slate-700 dark:text-slate-300 hover:bg-gray-100 dark:hover:bg-slate-700 flex items-center justify-center gap-2 transition-colors">
                        <Upload size={16} /> Restore from File
                      </button>
                   </div>
                </section>
              </div>
            )}

            {/* --- APPEARANCE TAB --- */}
            {activeTab === 'appearance' && (
              <div className="space-y-8">
                
                {/* Theme */}
                <section>
                   <h4 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-4">Theme</h4>
                   <div className="grid grid-cols-3 gap-3">
                      <ThemeOption 
                        label="System" 
                        icon={<Laptop size={20} />} 
                        active={currentTheme === 'system'} 
                        onClick={() => onThemeChange('system')} 
                      />
                      <ThemeOption 
                        label="Light" 
                        icon={<Sun size={20} />} 
                        active={currentTheme === 'light'} 
                        onClick={() => onThemeChange('light')} 
                      />
                      <ThemeOption 
                        label="Dark" 
                        icon={<Moon size={20} />} 
                        active={currentTheme === 'dark'} 
                        onClick={() => onThemeChange('dark')} 
                      />
                   </div>
                </section>

                {/* Window Style */}
                <section>
                  <h4 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-4">Window & Panel</h4>
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <span className="text-slate-700 dark:text-slate-300 font-medium text-sm">Popup / Panel Style</span>
                      <select 
                        value={panelStyle}
                        onChange={(e) => setPanelStyle(e.target.value)}
                        className="px-3 py-2 bg-gray-50 dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-lg text-sm outline-none focus:ring-2 focus:ring-blue-100 dark:text-white w-48"
                      >
                        <option value="cursor">Floating near cursor</option>
                        <option value="center">Center window</option>
                        <option value="sidebar">Sidebar panel</option>
                      </select>
                    </div>

                    <div className="flex items-center justify-between">
                      <span className="text-slate-700 dark:text-slate-300 font-medium text-sm">Window Behavior</span>
                      <select 
                        value={windowBehavior}
                        onChange={(e) => setWindowBehavior(e.target.value)}
                        className="px-3 py-2 bg-gray-50 dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-lg text-sm outline-none focus:ring-2 focus:ring-blue-100 dark:text-white w-48"
                      >
                        <option value="auto-close">Auto close after paste</option>
                        <option value="stay-open">Stay open</option>
                        <option value="minimize">Minimize to tray</option>
                      </select>
                    </div>
                  </div>
                </section>

                {/* Notifications */}
                <section>
                   <h4 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-4">Notifications</h4>
                   <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2 text-slate-700 dark:text-slate-300 font-medium text-sm">
                        <Bell size={16} className="text-slate-400" />
                        Show notification on copy
                      </div>
                      <Switch checked={notifications} onChange={() => setNotifications(!notifications)} />
                   </div>
                </section>

                {/* Tray Icon */}
                <section>
                   <h4 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-4">Tray Icon Menu</h4>
                   <div className="grid grid-cols-2 gap-3">
                      <Checkbox label="Quick Access" checked={trayBehavior.quickAccess} onChange={() => setTrayBehavior({...trayBehavior, quickAccess: !trayBehavior.quickAccess})} />
                      <Checkbox label="Pause Recording" checked={trayBehavior.pause} onChange={() => setTrayBehavior({...trayBehavior, pause: !trayBehavior.pause})} />
                      <Checkbox label="Open History" checked={trayBehavior.openHistory} onChange={() => setTrayBehavior({...trayBehavior, openHistory: !trayBehavior.openHistory})} />
                      <Checkbox label="Exit App" checked={trayBehavior.exit} onChange={() => setTrayBehavior({...trayBehavior, exit: !trayBehavior.exit})} />
                   </div>
                </section>

              </div>
            )}

            {/* --- ABOUT TAB --- */}
            {activeTab === 'about' && (
              <div className="text-center py-8">
                 <div className="w-20 h-20 bg-slate-800 dark:bg-slate-700 text-white rounded-3xl flex items-center justify-center mx-auto mb-6 shadow-xl shadow-slate-200 dark:shadow-none">
                    <span className="font-black text-2xl tracking-tighter">clp</span>
                 </div>
                 <h3 className="font-bold text-2xl text-slate-800 dark:text-white mb-1">Clp - Clipboard Protocol</h3>
                 <p className="text-gray-500 font-medium mb-8">Copy Like a Pro</p>
                 <p className="text-gray-500 font-medium mb-8">Version 1.0.0 (Beta)</p>
                 
                 <div className="max-w-sm mx-auto space-y-4">
                    <div className="p-4 bg-gray-50 dark:bg-slate-800 rounded-xl border border-gray-100 dark:border-slate-700 text-sm text-gray-600 dark:text-gray-400">
                       <p className="font-semibold text-slate-800 dark:text-slate-200 mb-1">Credits</p>
                       <p>Designed with ❤️ for productivity lovers.</p>
                       <p>Clipboard by Aditya</p>
                    </div>
                    <p className="text-xs text-gray-400">&copy; 2026 Clp Inc. All rights reserved.</p>
                 </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

// Helper Components

const NavButton = ({ active, onClick, icon, label }: { active: boolean, onClick: () => void, icon: React.ReactNode, label: string }) => (
  <button 
    onClick={onClick}
    className={`flex items-center gap-2 md:gap-3 px-3 md:px-4 py-2 md:py-3 rounded-xl text-xs md:text-sm font-medium transition-all duration-200 flex-shrink-0 md:w-full text-left whitespace-nowrap ${
      active 
        ? 'bg-white dark:bg-slate-800 shadow-md text-blue-600 dark:text-blue-400 ring-1 ring-gray-100 dark:ring-0' 
        : 'text-slate-500 dark:text-slate-400 hover:bg-white dark:hover:bg-slate-800 hover:shadow-sm hover:text-slate-700 dark:hover:text-slate-200'
    }`}
  >
    <span className={active ? 'text-blue-600 dark:text-blue-400' : 'text-slate-400 dark:text-slate-500'}>{icon}</span>
    {label}
  </button>
);

const Switch = ({ checked, onChange, disabled, activeColor = 'bg-blue-500' }: { checked: boolean, onChange: () => void, disabled?: boolean, activeColor?: string }) => (
  <button 
    onClick={onChange}
    disabled={disabled}
    className={`w-11 h-6 rounded-full transition-colors relative flex-shrink-0 ${disabled ? 'opacity-50 cursor-not-allowed bg-gray-200 dark:bg-gray-700' : checked ? activeColor : 'bg-gray-200 dark:bg-slate-700'}`}
  >
    <span className={`absolute top-1 left-1 bg-white w-4 h-4 rounded-full transition-transform shadow-sm ${checked ? 'translate-x-5' : ''}`} />
  </button>
);

const ThemeOption = ({ label, icon, active, onClick }: { label: string, icon: React.ReactNode, active: boolean, onClick: () => void }) => (
  <button 
    onClick={onClick}
    className={`
      flex flex-col items-center justify-center gap-2 p-4 rounded-xl border transition-all
      ${active 
        ? 'bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-800 text-blue-700 dark:text-blue-300 shadow-sm' 
        : 'bg-white dark:bg-slate-800 border-gray-100 dark:border-slate-700 text-slate-500 dark:text-slate-400 hover:bg-gray-50 dark:hover:bg-slate-750 hover:border-gray-200'}
    `}
  >
    {icon}
    <span className="text-xs font-semibold">{label}</span>
  </button>
);

const Checkbox = ({ label, checked, onChange }: { label: string, checked: boolean, onChange: () => void }) => (
  <button 
    onClick={onChange}
    className="flex items-center gap-3 p-3 rounded-lg border border-transparent hover:bg-gray-50 dark:hover:bg-slate-800 transition-colors text-left"
  >
    <div className={`w-5 h-5 rounded border flex items-center justify-center transition-colors ${checked ? 'bg-blue-500 border-blue-500 text-white' : 'bg-white dark:bg-slate-800 border-gray-300 dark:border-slate-600'}`}>
       {checked && <Check size={12} className="stroke-[3]" />}
    </div>
    <span className="text-sm text-slate-700 dark:text-slate-300 font-medium">{label}</span>
  </button>
);