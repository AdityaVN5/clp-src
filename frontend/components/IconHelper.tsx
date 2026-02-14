import React from 'react';
import { 
  Image as ImageIcon, 
  Mail, 
  Youtube, 
  Twitter, 
  Book, 
  Plus,
  LayoutGrid,
  Star,
  Music,
  Code,
  Archive
} from 'lucide-react';

interface IconHelperProps {
  name: string;
  size?: number;
  className?: string;
}

export const IconHelper: React.FC<IconHelperProps> = ({ name, size = 20, className = "" }) => {
  switch (name) {
    case 'image': return <ImageIcon size={size} className={className} />;
    case 'mail': return <Mail size={size} className={className} />;
    case 'video': return <Youtube size={size} className={className} />;
    case 'twitter': return <Twitter size={size} className={className} />;
    case 'book': return <Book size={size} className={className} />;
    case 'plus': return <Plus size={size} className={className} />;
    case 'star': return <Star size={size} className={className} />;
    case 'music': return <Music size={size} className={className} />;
    case 'code': return <Code size={size} className={className} />;
    case 'archive': return <Archive size={size} className={className} />;
    default: return <LayoutGrid size={size} className={className} />;
  }
};