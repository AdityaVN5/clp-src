import { ReactNode } from 'react';

export type ColorTheme = 'green' | 'yellow' | 'pink' | 'blue' | 'purple' | 'gray';
export type AppTheme = 'system' | 'light' | 'dark';

export interface Collection {
  id: string;
  name: string;
  count: number;
  color: ColorTheme;
  iconName: string; // Used to map to actual icon component
}

export interface Clip {
  id: string;
  type: 'text' | 'image';
  content?: string; // For text clips
  imageSrc?: string; // For image clips
  collectionId: string | null;
  createdAt: string; // Formatted time string for display (e.g. "Today 4:18 PM")
  timestamp: number; // For sorting
  // New properties
  isPinned?: boolean;
  labelColor?: ColorTheme | null; // For the small colored label
  labelText?: string; // Custom text for the label
  backgroundColor?: string; // Custom background color (hex or class)
}

export type SortOption = 'newest' | 'oldest' | 'alphabetical';