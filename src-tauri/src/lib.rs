use arboard::Clipboard;
use chrono::Local;
use serde::{Deserialize, Serialize};
use std::fs;
use std::path::PathBuf;
use std::sync::{Arc, Mutex};
use std::time::{Duration, SystemTime, UNIX_EPOCH};
use tauri::{AppHandle, Emitter, Manager, State};
use std::str::FromStr;
use uuid::Uuid;
use tauri_plugin_global_shortcut::{GlobalShortcutExt, ShortcutState, Shortcut};

// --- DATA STRUCTURES ---

#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct Clip {
    id: String,
    #[serde(rename = "type")]
    clip_type: String, // "text" or "image"
    content: Option<String>,
    imageSrc: Option<String>, // Base64 string for images
    collectionId: Option<String>,
    createdAt: String, // Formatted string
    timestamp: u128,   // Unix timestamp in millis
    #[serde(default)]
    isPinned: bool,
    #[serde(default)]
    labelColor: Option<String>,
    #[serde(default)]
    labelText: Option<String>,
    #[serde(default)]
    backgroundColor: Option<String>,
}

#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct Collection {
    id: String,
    name: String,
    count: usize,
    color: String,    // "green", "yellow", etc.
    iconName: String, // "image", "mail", etc.
}

#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct Settings {
    pub monitoring_enabled: bool,
    pub capture_text: bool,
    pub capture_images: bool,
    pub ignore_sensitive: bool,
    pub incognito_mode: bool,
    pub global_hotkey: String,
    pub max_clips: Option<usize>,
    pub memory_limit_mb: usize,
    pub auto_delete_hours: Option<u64>,
    pub delete_on_logout: bool,
    pub theme: String,
    pub window_behavior: String,
}

impl Default for Settings {
    fn default() -> Self {
        Self {
            monitoring_enabled: true,
            capture_text: true,
            capture_images: true,
            ignore_sensitive: true,
            incognito_mode: false,
            global_hotkey: "Ctrl+Shift+V".to_string(),
            max_clips: None, // Unlimited
            memory_limit_mb: 512,
            auto_delete_hours: None, // Never
            delete_on_logout: false,
            theme: "system".to_string(),
            window_behavior: "auto-close".to_string(),
        }
    }
}

#[derive(Serialize, Deserialize, Default, Clone)]
struct AppData {
    clips: Vec<Clip>,
    collections: Vec<Collection>,
    #[serde(default)]
    settings: Settings,
}

struct ClipboardManager {
    data: Arc<Mutex<AppData>>,
    app_handle: AppHandle,
    data_path: PathBuf,
}

impl ClipboardManager {
    fn new(app: AppHandle) -> Self {
        let app_data_dir = app.path().app_data_dir().unwrap();
        if !app_data_dir.exists() {
            let _ = fs::create_dir_all(&app_data_dir);
        }
        let data_path = app_data_dir.join("clipboard_data.json");

        let data = if data_path.exists() {
            let content = fs::read_to_string(&data_path).unwrap_or_default();
            serde_json::from_str(&content).unwrap_or_else(|_| Self::default_data())
        } else {
            Self::default_data()
        };

        Self {
            data: Arc::new(Mutex::new(data)),
            app_handle: app,
            data_path,
        }
    }

    fn default_data() -> AppData {
        let default_collections = vec![
            Collection { id: "c1".to_string(), name: "Images".to_string(), count: 0, color: "green".to_string(), iconName: "image".to_string() },
            Collection { id: "c2".to_string(), name: "Letters".to_string(), count: 0, color: "yellow".to_string(), iconName: "mail".to_string() },
            Collection { id: "c3".to_string(), name: "Video links".to_string(), count: 0, color: "pink".to_string(), iconName: "video".to_string() },
        ];
        AppData {
            collections: default_collections,
            clips: vec![],
            settings: Settings::default(),
        }
    }

    fn save(&self) {
        let data = self.data.lock().unwrap();
        let content = serde_json::to_string_pretty(&*data).unwrap();
        let _ = fs::write(&self.data_path, content);
    }

    fn enforce_limits(&self, data: &mut AppData) {
        // Enforce Max Clips
        if let Some(max) = data.settings.max_clips {
            if max > 0 && data.clips.len() > max {
                let diff = data.clips.len() - max;
                // Remove oldest, but maybe keep pinned? For now, simple truncate.
                // To support pinned, we'd need to sort or filter.
                // Let's just truncate for simplicity as per requirements for now.
                data.clips.truncate(max);
            }
        }

        // Enforce Memory Limit
        let limit_bytes = data.settings.memory_limit_mb * 1024 * 1024;
        let mut current_size = 0;
        let mut keep_count = 0;

        for clip in &data.clips {
            let content_size = clip.content.as_ref().map(|s: &String| s.len()).unwrap_or(0);
            let image_size = clip.imageSrc.as_ref().map(|s: &String| s.len()).unwrap_or(0);
            current_size += content_size + image_size;
            
            if current_size > limit_bytes && keep_count > 0 {
                break;
            }
            keep_count += 1;
        }

        if keep_count < data.clips.len() {
             data.clips.truncate(keep_count);
        }
    }

    fn add_clip(&self, text: Option<String>, image_data: Option<String>) {
        let mut data = self.data.lock().unwrap();

        // Check if monitoring is enabled
        if !data.settings.monitoring_enabled {
            return;
        }
        
        // Dedup: Check if the last clip is identical
        if let Some(last_clip) = data.clips.first() { 
             if let Some(ref t) = text {
                 if let Some(ref last_t) = last_clip.content {
                     if t == last_t { return; }
                 }
             }
        }

        let now = SystemTime::now();
        let timestamp = now.duration_since(UNIX_EPOCH).unwrap().as_millis();
        let created_at = Local::now().format("Today %I:%M %p").to_string();

        let new_clip = Clip {
            id: Uuid::new_v4().to_string(),
            clip_type: if text.is_some() { "text".to_string() } else { "image".to_string() },
            content: text,
            imageSrc: image_data,
            collectionId: None,
            createdAt: created_at,
            timestamp,
            isPinned: false,
            labelColor: None,
            labelText: None,
            backgroundColor: None,
        };

        // Insert at beginning
        data.clips.insert(0, new_clip.clone());
        
        // Enforce limits
        // We can't call self.enforce_limits because we hold the lock. 
        // Logic duplicated or extract to static method / helper that takes &mut AppData
        
        // Enforce Max Clips
        if let Some(max) = data.settings.max_clips {
            if max > 0 && data.clips.len() > max {
               data.clips.truncate(max);
            }
        } else if data.clips.len() > 1000 { // Default safety cap if unlimited
             data.clips.truncate(1000);
        }

        // Enforce Memory Limit
        let limit_bytes = data.settings.memory_limit_mb * 1024 * 1024;
        let mut current_size = 0;
        let mut keep_count = 0;

        for clip in &data.clips {
            let content_size = clip.content.as_ref().map(|s: &String| s.len()).unwrap_or(0);
            let image_size = clip.imageSrc.as_ref().map(|s: &String| s.len()).unwrap_or(0);
            current_size += content_size + image_size;
            
            if current_size > limit_bytes && keep_count > 0 {
                break;
            }
            keep_count += 1;
        }

        if keep_count < data.clips.len() {
             data.clips.truncate(keep_count);
        }

        let clips_snapshot = data.clips.clone();
        drop(data); // Release lock
        
        self.save();
        
        let _ = self.app_handle.emit("clipboard-changed", &new_clip);
    }
}

// --- COMMANDS ---

#[tauri::command]
fn get_clips(state: State<Arc<ClipboardManager>>) -> Vec<Clip> {
    let data = state.data.lock().unwrap();
    data.clips.clone()
}

#[tauri::command]
fn get_collections(state: State<Arc<ClipboardManager>>) -> Vec<Collection> {
    let data = state.data.lock().unwrap();
    data.collections.clone()
}

#[tauri::command]
fn delete_clip(id: String, state: State<Arc<ClipboardManager>>) -> Vec<Clip> {
    let manager = state.inner();
    let mut data = manager.data.lock().unwrap();
    data.clips.retain(|c| c.id != id);
    drop(data);
    manager.save();
    manager.data.lock().unwrap().clips.clone()
}

#[tauri::command]
fn toggle_pin(id: String, state: State<Arc<ClipboardManager>>) -> Vec<Clip> {
    let manager = state.inner();
    let mut data = manager.data.lock().unwrap();
    if let Some(clip) = data.clips.iter_mut().find(|c| c.id == id) {
        clip.isPinned = !clip.isPinned;
    }
    // Re-sort needs to happen on frontend or here. Frontend does sorting.
    drop(data);
    manager.save();
    manager.data.lock().unwrap().clips.clone()
}

#[tauri::command]
fn update_clip(id: String, content: String, state: State<Arc<ClipboardManager>>) -> Vec<Clip> {
    let manager = state.inner();
    let mut data = manager.data.lock().unwrap();
    if let Some(clip) = data.clips.iter_mut().find(|c| c.id == id) {
        clip.content = Some(content);
    }
    drop(data);
    manager.save();
    manager.data.lock().unwrap().clips.clone()
}

#[tauri::command]
fn move_clip(id: String, collection_id: Option<String>, state: State<Arc<ClipboardManager>>) -> Vec<Clip> {
    let manager = state.inner();
    let mut data = manager.data.lock().unwrap();
    if let Some(clip) = data.clips.iter_mut().find(|c| c.id == id) {
        clip.collectionId = collection_id;
    }
    drop(data);
    manager.save();
    manager.data.lock().unwrap().clips.clone()
}

#[tauri::command]
fn create_collection(name: String, color: String, icon_name: String, state: State<Arc<ClipboardManager>>) -> Vec<Collection> {
    let manager = state.inner();
    let mut data = manager.data.lock().unwrap();
    let new_collection = Collection {
        id: Uuid::new_v4().to_string(),
        name,
        count: 0,
        color,
        iconName: icon_name,
    };
    data.collections.push(new_collection);
    drop(data);
    manager.save();
    manager.data.lock().unwrap().collections.clone()
}

#[tauri::command]
fn delete_collection(id: String, state: State<Arc<ClipboardManager>>) -> Vec<Collection> {
    let manager = state.inner();
    let mut data = manager.data.lock().unwrap();
    data.collections.retain(|c| c.id != id);
    // Also remove collectionId from clips? Optional but good practice.
    for clip in &mut data.clips {
        if clip.collectionId.as_deref() == Some(&id) {
            clip.collectionId = None;
        }
    }
    drop(data);
    manager.save();
    manager.data.lock().unwrap().collections.clone()
}

#[tauri::command]
fn update_collection(id: String, name: Option<String>, color: Option<String>, icon_name: Option<String>, state: State<Arc<ClipboardManager>>) -> Vec<Collection> {
    let manager = state.inner();
    let mut data = manager.data.lock().unwrap();
    if let Some(col) = data.collections.iter_mut().find(|c| c.id == id) {
        if let Some(n) = name { col.name = n; }
        if let Some(c) = color { col.color = c; }
        if let Some(i) = icon_name { col.iconName = i; }
    }
    drop(data);
    manager.save();
    manager.data.lock().unwrap().collections.clone()
}

#[tauri::command]
fn set_clip_color(id: String, color: String, state: State<Arc<ClipboardManager>>) -> Vec<Clip> {
    let manager = state.inner();
    let mut data = manager.data.lock().unwrap();
    if let Some(clip) = data.clips.iter_mut().find(|c| c.id == id) {
        clip.backgroundColor = Some(color);
    }
    drop(data);
    manager.save();
    manager.data.lock().unwrap().clips.clone()
}

#[tauri::command]
fn set_clip_label(id: String, text: String, color: Option<String>, state: State<Arc<ClipboardManager>>) -> Vec<Clip> {
    let manager = state.inner();
    let mut data = manager.data.lock().unwrap();
    if let Some(clip) = data.clips.iter_mut().find(|c| c.id == id) {
        clip.labelText = Some(text);
        if color.is_some() {
            clip.labelColor = color;
        }
    }
    drop(data);
    manager.save();
    manager.data.lock().unwrap().clips.clone()
}

#[tauri::command]
fn delete_clip_label(id: String, state: State<Arc<ClipboardManager>>) -> Vec<Clip> {
    let manager = state.inner();
    let mut data = manager.data.lock().unwrap();
    if let Some(clip) = data.clips.iter_mut().find(|c| c.id == id) {
        clip.labelText = None;
        clip.labelColor = None;
    }
    drop(data);
    manager.save();
    manager.data.lock().unwrap().clips.clone()
}

#[tauri::command]
fn get_settings(state: State<Arc<ClipboardManager>>) -> Settings {
    let data = state.data.lock().unwrap();
    data.settings.clone()
}

#[tauri::command]
fn update_settings(new_settings: Settings, app_handle: AppHandle, state: State<Arc<ClipboardManager>>) -> Result<Settings, String> {
    let manager = state.inner();
    let mut data = manager.data.lock().unwrap();
    
    // Check if hotkey changed
    let old_hotkey_str = data.settings.global_hotkey.clone();
    let new_hotkey_str = new_settings.global_hotkey.clone();

    if old_hotkey_str != new_hotkey_str {
        // Unregister old
        if let Ok(old_shortcut) = Shortcut::from_str(&old_hotkey_str) {
             let _ = app_handle.global_shortcut().unregister(old_shortcut);
        }

        // Register new
        match Shortcut::from_str(&new_hotkey_str) {
            Ok(new_shortcut) => {
                if let Err(e) = app_handle.global_shortcut().register(new_shortcut) {
                     // Registration failed (collision or invalid)
                     // Revert to old setting? Or just warn?
                     // Return error string
                     return Err(format!("Failed to register hotkey '{}': {}", new_hotkey_str, e));
                }
                // Success
                data.settings = new_settings;
            }
            Err(e) => {
                 return Err(format!("Invalid hotkey format '{}': {}", new_hotkey_str, e));
            }
        }
    } else {
        data.settings = new_settings;
    }
    
    // Enforce limits immediately
    manager.enforce_limits(&mut data);
    
    drop(data);
    manager.save();
    Ok(manager.data.lock().unwrap().settings.clone())
}

#[tauri::command]
fn clear_all_clips(state: State<Arc<ClipboardManager>>) {
    let manager = state.inner();
    let mut data = manager.data.lock().unwrap();
    data.clips.clear();
    drop(data);
    manager.save();
}

#[tauri::command]
fn set_always_on_top(value: bool, app_handle: AppHandle) {
    if let Some(window) = app_handle.get_webview_window("main") {
        window.set_always_on_top(value).unwrap_or_else(|e| eprintln!("Failed to set always on top: {}", e));
    }
}

#[tauri::command]
fn paste_clip(id: String, state: State<Arc<ClipboardManager>>) { // app_handle removed as not used directly here
     let manager = state.inner();
     let data = manager.data.lock().unwrap();
     
     if let Some(clip) = data.clips.iter().find(|c| c.id == id) {
         if let Some(content) = &clip.content {
             // 1. Write to clipboard
             let mut clipboard = Clipboard::new().unwrap();
             clipboard.set_text(content.clone()).unwrap();
             
             // 2. Simulate Alt+Tab to switch focus to previous window
             use enigo::{Enigo, Key, Keyboard, Settings, Direction};
             let mut enigo = Enigo::new(&Settings::default()).unwrap();
             
             // Alt+Tab simulation
             enigo.key(Key::Alt, Direction::Press).ok();
             enigo.key(Key::Tab, Direction::Click).ok();
             enigo.key(Key::Alt, Direction::Release).ok();

             // Wait for focus switch
             std::thread::sleep(Duration::from_millis(150));

             // 3. Simulate Paste (Ctrl+V)
             #[cfg(target_os = "macos")]
             {
                 enigo.key(Key::Meta, Direction::Press).ok();
                 enigo.key(Key::Unicode('v'), Direction::Click).ok();
                 enigo.key(Key::Meta, Direction::Release).ok();
             }
             
             #[cfg(not(target_os = "macos"))]
             {
                 enigo.key(Key::Control, Direction::Press).ok();
                 enigo.key(Key::Unicode('v'), Direction::Click).ok();
                 enigo.key(Key::Control, Direction::Release).ok();
             }
         }
     }
}

// --- INITIALIZATION ---

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .plugin(tauri_plugin_shell::init())
        .setup(|app| {
            let handle = app.handle();
            let manager = Arc::new(ClipboardManager::new(handle.clone()));
            
            // Set window icon
            if let Some(window) = app.get_webview_window("main") {
                let icon = tauri::image::Image::from_bytes(include_bytes!("../icons/clp_logo.png"))?;
                let _ = window.set_icon(icon);
            }
            
            // Manage state
            app.manage(manager.clone());

            // Global Shortcut
            // Register hotkey from settings
            let settings = manager.data.lock().unwrap().settings.clone();
            let hotkey_str = settings.global_hotkey;

            app.handle().plugin(
                tauri_plugin_global_shortcut::Builder::new().with_handler(move |app, shortcut, event| {
                    if event.state == ShortcutState::Pressed  {
                         // We need to match against current hotkey? 
                         // Or just toggle main window?
                         // The handler receives ALL shortcuts registered by this plugin.
                         // So we just check if it's THE shortcut we care about?
                         
                         // Simple logic: Toggle main window for ANY registered shortcut in this handler context
                         // for now, since we only have one global hotkey feature.
                         // Or we can check if shortcut matches current settings.
                         
                           if let Some(window) = app.get_webview_window("main") {
                               if window.is_visible().unwrap_or(false) {
                                   window.hide().unwrap();
                               } else {
                                   window.show().unwrap();
                                   window.set_focus().unwrap();
                               }
                           }
                    }
                })
                .build(),
            )?;

            // Register initial
            if let Ok(shortcut) = Shortcut::from_str(&hotkey_str) {
                let _ = app.handle().global_shortcut().register(shortcut);
            } else {
                 eprintln!("Failed to parse initial hotkey: {}", hotkey_str);
            }

            // Background Thread for Clipboard Polling
            let manager_clone = manager.clone();
            std::thread::spawn(move || {
                let mut clipboard = Clipboard::new().unwrap(); 
                let mut last_text = String::new();
                
                loop {
                    if let Ok(text) = clipboard.get_text() {
                         // Simple check
                        if !text.is_empty() && text != last_text {
                            last_text = text.clone();
                            manager_clone.add_clip(Some(text), None);
                        }
                    }
                    std::thread::sleep(Duration::from_millis(1000));
                }
            });

            Ok(())
        })
        .invoke_handler(tauri::generate_handler![
            get_clips,
            get_collections,
            delete_clip,
            toggle_pin,
            update_clip,
            move_clip,
            create_collection,
            delete_collection,
            update_collection,
            set_clip_color,
            set_clip_label,
            delete_clip_label,
            set_always_on_top,
            paste_clip,
            get_settings,
            update_settings,
            clear_all_clips
        ])
        .build(tauri::generate_context!())
        .expect("error while building tauri application")
        .run(|app_handle, event| {
             if let tauri::RunEvent::ExitRequested { .. } = event {
                 let manager = app_handle.state::<Arc<ClipboardManager>>();
                 // We need to lock to check settings
                 // Note: inner() gives &Arc<ClipboardManager>, so we deref
                 let manager = manager.inner();
                 let mut data = manager.data.lock().unwrap();
                 if data.settings.delete_on_logout {
                     data.clips.clear();
                     drop(data); // release lock before save
                     manager.save();
                 }
             }
        });
}
