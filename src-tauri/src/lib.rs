use arboard::Clipboard;
use chrono::{Local, TimeZone};
use serde::{Deserialize, Serialize};
use std::fs;
use std::path::PathBuf;
use std::sync::{Arc, Mutex};
use std::time::{Duration, SystemTime, UNIX_EPOCH};
use tauri::{AppHandle, Emitter, Manager, State};
use uuid::Uuid;

// --- DATA STRUCTURES ---

#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct Collection {
    id: String,
    name: String,
    count: usize,
    color: String,    // "green", "yellow", etc.
    iconName: String, // "image", "mail", etc.
}

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

#[derive(Serialize, Deserialize, Default, Clone)]
struct AppData {
    clips: Vec<Clip>,
    collections: Vec<Collection>,
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
        }
    }

    fn save(&self) {
        let data = self.data.lock().unwrap();
        let content = serde_json::to_string_pretty(&*data).unwrap();
        let _ = fs::write(&self.data_path, content);
    }

    fn add_clip(&self, text: Option<String>, image_data: Option<String>) {
        let mut data = self.data.lock().unwrap();
        
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
        
        // Cap size
        if data.clips.len() > 100 {
            data.clips.truncate(100);
        }

        let clips_snapshot = data.clips.clone();
        drop(data); // Release lock
        
        self.save();
        
        // Emit update event with just the new clip or full list? 
        // Emitting just the new clip is efficient, but for simplicity let's rely on commands or specific updates.
        // Actually, let's emit the full list or just the new clip.
        // Frontend expects full sync usually or granular updates. 
        // Let's create an event "clipboard-changed" that sends the new clip.
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
fn set_always_on_top(value: bool, app_handle: AppHandle) {
    if let Some(window) = app_handle.get_webview_window("main") {
        window.set_always_on_top(value).unwrap_or_else(|e| eprintln!("Failed to set always on top: {}", e));
    }
}

#[tauri::command]
fn paste_clip(id: String, state: State<Arc<ClipboardManager>>, app_handle: AppHandle) {
     let manager = state.inner();
     let data = manager.data.lock().unwrap();
     
     if let Some(clip) = data.clips.iter().find(|c| c.id == id) {
         if let Some(content) = &clip.content {
             // 1. Write to clipboard
             let mut clipboard = Clipboard::new().unwrap();
             clipboard.set_text(content.clone()).unwrap();
             
             // 2. Hide window (optional but good UX for "paste into other app")
             // app_handle.get_webview_window("main").unwrap().hide().unwrap();
             
             // 3. Simulate Ctrl+V
             use enigo::{Enigo, Key, Keyboard, Settings};
             // Enigo::new() might fail if not checked, but usually ok on desktop
             let mut enigo = Enigo::new(&Settings::default()).unwrap();
             
             #[cfg(target_os = "macos")]
             {
                 enigo.key(Key::Meta, enigo::Direction::Press).ok();
                 enigo.key(Key::Unicode('v'), enigo::Direction::Click).ok();
                 enigo.key(Key::Meta, enigo::Direction::Release).ok();
             }
             
             #[cfg(not(target_os = "macos"))]
             {
                 enigo.key(Key::Control, enigo::Direction::Press).ok();
                 enigo.key(Key::Unicode('v'), enigo::Direction::Click).ok();
                 enigo.key(Key::Control, enigo::Direction::Release).ok();
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
            
            // Manage state
            app.manage(manager.clone());

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
            paste_clip
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
