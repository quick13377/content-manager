import { 
  Calendar as CalendarIcon, 
  ChevronDown, 
  ChevronUp, 
  GripVertical, 
  MoreHorizontal, 
  Plus, 
  Search, 
  Image as ImageIcon, 
  Globe, 
  FileText, 
  ChevronLeft, 
  ChevronRight, 
  Filter, 
  Edit, 
  Trash2, 
  Video as VideoIcon,
  Heart, // New icon
  Star,  // New icon
  Bell   // New icon
} from 'lucide-react'

// You can now use these icons in your components, for example:
export function IconExample() {
  return (
    <div>
      <CalendarIcon className="w-6 h-6" />
      <ChevronDown className="w-6 h-6" />
      <Heart className="w-6 h-6" /> // New icon usage
      <Star className="w-6 h-6" />  // New icon usage
      <Bell className="w-6 h-6" />  // New icon usage
      {/* ... other icons ... */}
    </div>
  )
}