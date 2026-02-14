import { Clip, Collection, ColorTheme } from './types';

export const COLORS: ColorTheme[] = ['green', 'yellow', 'pink', 'blue', 'purple', 'gray'];
export const ICONS = ['image', 'mail', 'video', 'twitter', 'book', 'star', 'music', 'code', 'archive'];

export const COLLECTIONS: Collection[] = [
  { id: 'c1', name: 'Images', count: 12, color: 'green', iconName: 'image' },
  { id: 'c2', name: 'Letters', count: 12, color: 'yellow', iconName: 'mail' },
  { id: 'c3', name: 'Video links', count: 12, color: 'pink', iconName: 'video' },
  { id: 'c4', name: 'Twitter', count: 12, color: 'blue', iconName: 'twitter' },
  { id: 'c5', name: 'Project notes', count: 36, color: 'purple', iconName: 'book' },
];

export const MOCK_CLIPS: Clip[] = [
  {
    id: '1',
    type: 'text',
    content: "I never loved you. Ummm...to eBay? I was all of history's great robot actors - Acting Unit 0.8; Thespomat; David Duchovny! There's no part of that sentence I didn't like!",
    collectionId: 'c1',
    createdAt: 'Today 4:18 PM',
    timestamp: Date.now(),
    isPinned: true,
    labelColor: 'purple'
  },
  {
    id: '2',
    type: 'text',
    content: "So it's time for us to interfere in his life. Michelle, I don't regret this, but I both rue and lament it. When the lights go out, it's nobody's business what goes on between...",
    collectionId: 'c3',
    createdAt: 'Today 2:23 PM',
    timestamp: Date.now() - 3600000,
  },
  {
    id: '3',
    type: 'text',
    content: "So far we've covered text generators based on movies and authors.",
    collectionId: 'c2',
    createdAt: 'Today 11:48 AM',
    timestamp: Date.now() - 7200000,
    backgroundColor: '#fffbeb' // light yellow
  },
  {
    id: '4',
    type: 'text',
    content: "All year long, the grasshopper kept burying acorns for winter, while the octopus mooched off his girlfriend and watched TV. But then the winter came, and the grass...",
    collectionId: null,
    createdAt: 'Ytd 22:45',
    timestamp: Date.now() - 86400000,
  },
  {
    id: '5',
    type: 'image',
    imageSrc: 'https://picsum.photos/400/200',
    collectionId: 'c5',
    createdAt: 'Ytd 18:22',
    timestamp: Date.now() - 90000000,
  },
  {
    id: '6',
    type: 'text',
    content: "All year long, the grasshopper kept burying acorns for winter, while the octopus mooched off his girlfriend and watched TV.",
    collectionId: 'c4',
    createdAt: '14.06 19:00',
    timestamp: Date.now() - 172800000,
  },
  {
    id: '7',
    type: 'image',
    imageSrc: 'https://picsum.photos/400/201',
    collectionId: null,
    createdAt: '14.06 3:00 PM',
    timestamp: Date.now() - 180000000,
  },
];