'use client'

import * as React from 'react'
import dynamic from 'next/dynamic';
import { DragDropContext, Droppable, Draggable, DropResult } from 'react-beautiful-dnd'
import { format, parseISO, startOfMonth, endOfMonth, isSameMonth, isSameDay, addDays, startOfWeek, endOfWeek, isToday, eachDayOfInterval, differenceInMilliseconds, set, addMilliseconds } from 'date-fns'
import { Calendar as CalendarIcon, ChevronDown, ChevronUp, GripVertical, MoreHorizontal, Plus, Search, Image as ImageIcon, Globe, FileText, ChevronLeft, ChevronRight, Filter, Edit, Trash2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Calendar } from '@/components/ui/calendar'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter, DialogDescription } from '@/components/ui/dialog'
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { useToast } from "@/components/ui/toast"
import { cn } from "@/lib/utils"
import { Textarea } from "@/components/ui/textarea"
import { Progress } from "@/components/ui/progress"
import { Video as VideoIcon } from 'lucide-react' // Add this import for VideoIcon
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog"

interface ContentItem {
  id: string
  title: string
  type: 'image' | 'webpage' | 'text' | 'video' // Added 'video' type
  content: string
  startDateTime: string // ISO 8601 format
  endDateTime: string // ISO 8601 format
  tags: string[]
}

const DynamicDragDropContext = dynamic(
  () => import('react-beautiful-dnd').then(mod => mod.DragDropContext),
  { ssr: false }
);

const DynamicDroppable = dynamic(
  () => import('react-beautiful-dnd').then(mod => mod.Droppable),
  { ssr: false }
);

const DynamicDraggable = dynamic(
  () => import('react-beautiful-dnd').then(mod => mod.Draggable),
  { ssr: false }
);

export default function ContentManagement() {
  const { toast } = useToast()
  const [items, setItems] = React.useState<ContentItem[]>(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('contentItems')
      return saved ? JSON.parse(saved) : []
    }
    return []
  })
  const [searchTerm, setSearchTerm] = React.useState('')
  const [sortConfig, setSortConfig] = React.useState<{ key: keyof ContentItem; direction: 'ascending' | 'descending' }>({ key: 'startDateTime', direction: 'ascending' })
  const [viewMode, setViewMode] = React.useState<'list' | 'calendar' | 'grid'>('list')
  const [isDialogOpen, setIsDialogOpen] = React.useState(false)
  const [newItem, setNewItem] = React.useState<Partial<ContentItem>>({})
  const [editingId, setEditingId] = React.useState<string | null>(null)
  const [uploadProgress, setUploadProgress] = React.useState(0)
  const [currentMonth, setCurrentMonth] = React.useState(new Date())
  const [filterType, setFilterType] = React.useState<'image' | 'webpage' | 'text' | 'video' | 'all'>('all')
  const [filterDateRange, setFilterDateRange] = React.useState<{ start: Date | null; end: Date | null }>({ start: null, end: null })
  const [filterTags, setFilterTags] = React.useState<string[]>([])
  const [deleteDialogOpen, setDeleteDialogOpen] = React.useState(false)
  const [itemToDelete, setItemToDelete] = React.useState<ContentItem | null>(null)
  const [videoUploadProgress, setVideoUploadProgress] = React.useState(0) // Add state for video upload progress

  React.useEffect(() => {
    if (typeof window !== 'undefined') {
      try {
        localStorage.setItem('contentItems', JSON.stringify(items))
      } catch (error) {
        console.error('Error saving to localStorage:', error)
      }
    }
  }, [items])

  const filteredItems = React.useMemo(() => {
    return items.filter(item =>
      (item.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.type.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (item.tags && item.tags.some(tag => tag.toLowerCase().includes(searchTerm.toLowerCase())))) &&
      (filterType === 'all' || item.type === filterType) &&
      (!filterDateRange.start || !filterDateRange.end || (new Date(item.startDateTime) >= filterDateRange.start && new Date(item.endDateTime) <= filterDateRange.end)) &&
      (filterTags.length === 0 || filterTags.every(tag => item.tags.includes(tag)))
    )
  }, [items, searchTerm, filterType, filterDateRange, filterTags])

  const sortedItems = React.useMemo(() => {
    return [...filteredItems].sort((a, b) => {
      if (sortConfig.key === 'startDateTime' || sortConfig.key === 'endDateTime') {
        return sortConfig.direction === 'ascending'
          ? new Date(a[sortConfig.key]).getTime() - new Date(b[sortConfig.key]).getTime()
          : new Date(b[sortConfig.key]).getTime() - new Date(a[sortConfig.key]).getTime()
      }
      if (a[sortConfig.key] < b[sortConfig.key]) {
        return sortConfig.direction === 'ascending' ? -1 : 1
      }
      if (a[sortConfig.key] > b[sortConfig.key]) {
        return sortConfig.direction === 'ascending' ? 1 : -1
      }
      return 0
    })
  }, [filteredItems, sortConfig])

  const onDragEnd = (result: DropResult) => {
    if (!result.destination) return
    const newItems = Array.from(items)
    const [reorderedItem] = newItems.splice(result.source.index, 1)
    
    if (viewMode === 'calendar' && result.destination.droppableId !== result.source.droppableId) {
      const newDate = parseISO(result.destination.droppableId)
      const oldStartDate = parseISO(reorderedItem.startDateTime)
      const oldEndDate = parseISO(reorderedItem.endDateTime)
      const duration = differenceInMilliseconds(oldEndDate, oldStartDate)
      
      const newStartDateTime = set(newDate, {
        hours: oldStartDate.getHours(),
        minutes: oldStartDate.getMinutes(),
        seconds: oldStartDate.getSeconds()
      })
      
      reorderedItem.startDateTime = newStartDateTime.toISOString()
      reorderedItem.endDateTime = addMilliseconds(newStartDateTime, duration).toISOString()
    }
    
    newItems.splice(result.destination.index, 0, reorderedItem)
    setItems(newItems)
  }

  const handleSort = (key: keyof ContentItem) => {
    setSortConfig(prevConfig => ({
      key,
      direction: prevConfig.key === key && prevConfig.direction === 'ascending' ? 'descending' : 'ascending'
    }))
  }

  const handleAddOrUpdateItem = () => {
    if (!newItem.title || !newItem.type || !newItem.content || !newItem.startDateTime || !newItem.endDateTime) {
      toast({
        title: "Veuillez remplir tous les champs obligatoires",
        description: "Tous les champs sont requis pour ajouter ou mettre à jour le contenu.",
        variant: "destructive"
      })
      return
    }

    const itemToAddOrUpdate = {
      ...newItem,
      id: editingId || Math.random().toString(36).substr(2, 9),
      startDateTime: newItem.startDateTime || new Date().toISOString(),
      endDateTime: newItem.endDateTime || new Date().toISOString(),
      tags: newItem.tags || []
    }

    // Handle video upload
    if (newItem.type === 'video' && newItem.content) {
      const isYouTubeLink = newItem.content.includes('youtube.com') || newItem.content.includes('youtu.be');
      if (!isYouTubeLink) {
        const videoFile = newItem.content; // Assuming content holds the file data
        if (videoFile instanceof Blob) {
          const reader = new FileReader();
          reader.onloadstart = () => setVideoUploadProgress(0); // Reset progress
          reader.onprogress = (e) => {
            if (e.lengthComputable) {
              setVideoUploadProgress((e.loaded / e.total) * 100); // Update progress
            }
          };
          reader.onloadend = () => {
            setVideoUploadProgress(100); // Complete progress
            itemToAddOrUpdate.content = reader.result as string; // Set the base64 string to content
            addItem(itemToAddOrUpdate); // Add item to the list
            setIsDialogOpen(false); // Close the dialog after adding
          };
          reader.readAsDataURL(videoFile);
          return; // Exit to prevent adding the item before the file is read
        }
      }
    }

    // Update existing item if editingId is set
    if (editingId) {
      setItems(prevItems => prevItems.map(item => item.id === editingId ? itemToAddOrUpdate : item));
    } else {
      // Add item directly if it's a YouTube link or other types
      addItem(itemToAddOrUpdate); // Add item to the list
    }
    
    setIsDialogOpen(false); // Close the dialog after adding/updating
  }

  const handleDeleteItem = (id: string) => {
    setItems(prevItems => prevItems.filter(item => item.id !== id))
    toast({
      title: "Contenu supprimé avec succès",
      description: "L'élément a été supprimé de votre liste de contenu."
    })
  }

  const handleEditItem = React.useCallback((item: ContentItem) => {
    setNewItem({
      ...item,
      startDateTime: item.startDateTime,
      endDateTime: item.endDateTime,
    })
    setEditingId(item.id)
    setIsDialogOpen(true)
  }, [])

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (file) {
      try {
        const reader = new FileReader()
        reader.onloadstart = () => setUploadProgress(0)
        reader.onprogress = (e) => {
          if (e.lengthComputable) {
            setUploadProgress((e.loaded / e.total) * 100)
          }
        }
        reader.onloadend = () => {
          setUploadProgress(100)
          setNewItem({ ...newItem, content: reader.result as string })
          toast({
            title: "Image téléchargée avec succès",
            description: "L'image a été téléchargée et ajoutée au contenu."
          })
        }
        reader.readAsDataURL(file)
      } catch (error) {
        console.error('Error uploading file:', error)
        toast({
          title: "Erreur lors du téléchargement de l'image",
          description: "Une erreur s'est produite lors du téléchargement de l'image.",
          variant: "destructive"
        })
      }
    }
  }

  const renderContentPreview = React.useCallback((item: ContentItem) => {
    switch (item.type) {
      case 'image':
        return (
          <div className="relative w-full h-full">
            <img
              src={item.content}
              alt={item.title}
              className="rounded object-cover w-full h-full"
            />
          </div>
        )
      case 'webpage':
        return (
          <div className="flex items-center h-full">
            <Globe className="w-8 h-8 mr-2" />
            <a href={item.content} target="_blank" rel="noopener noreferrer" className="text-sm truncate text-blue-500 hover:underline">
              {item.content}
            </a>
          </div>
        )
      case 'text':
        return (
          <div className="text-sm overflow-hidden h-full">
            {item.content.substring(0, 100)}...
          </div>
        )
      case 'video': // Updated case for video to show thumbnail
        const videoId = item.content.split('v=')[1]?.split('&')[0]; // Extract video ID from URL
        const thumbnailUrl = `https://img.youtube.com/vi/${videoId}/hqdefault.jpg`; // YouTube thumbnail URL
        return (
          <div className="relative w-full h-full">
            <img
              src={thumbnailUrl}
              alt={item.title}
              className="rounded object-cover w-full h-full"
            />
          </div>
        )
      default:
        return null
    }
  }, [])

  const renderGridItem = React.useCallback((item: ContentItem, index: number) => (
    <DynamicDraggable key={item.id} draggableId={item.id} index={index}>
      {(provided) => (
        <div
          ref={provided.innerRef}
          {...provided.draggableProps}
          {...provided.dragHandleProps}
          className="bg-white rounded-lg shadow-md p-4 flex flex-col h-full w-full" // Added w-full for full width
        >
          <h3 className="font-semibold text-lg mb-2">{item.title}</h3>
          <div className="flex-grow mb-2"> {/* Allow content to grow */}
            {item.type === 'image' ? (
              <div className="relative w-full h-40"> {/* Set a fixed height for the image container */}
                <img
                  src={item.content}
                  alt={item.title}
                  className="rounded object-cover w-full h-full" // Ensure the image has rounded corners
                />
              </div>
            ) : (
              renderContentPreview(item) // For other types, use the existing preview function
            )}
          </div>
          <p className="text-sm text-muted-foreground mt-2">
            {format(parseISO(item.startDateTime), 'PPp')}
          </p>
          <div className="flex mt-2 space-x-2 flex-wrap">
            {item.tags.map((tag, index) => (
              <span key={index} className="px-2 py-1 text-xs bg-primary/10 text-primary rounded-full mb-1">{tag}</span>
            ))}
          </div>
          <div className="flex justify-between mt-4 space-x-2"> {/* Use justify-between for better spacing */}
            <Button variant="outline" size="sm" className="hover:bg-gray-200" onClick={() => handleEditItem(item)}>
              <Edit className="h-4 w-4 mr-2" />
              Modifier
            </Button>
            <Button
              variant="outline"
              size="sm"
              className="hover:bg-gray-200"
              onClick={() => {
                setItemToDelete(item)
                setDeleteDialogOpen(true)
              }}
            >
              <Trash2 className="h-5 w-5 mr-1" />
            </Button>
          </div>
        </div>
      )}
    </DynamicDraggable>
  ), [handleEditItem])

  const renderCalendar = React.useCallback(() => {
    const monthStart = startOfMonth(currentMonth)
    const monthEnd = endOfMonth(monthStart)
    const calendarStart = startOfWeek(monthStart)
    const calendarEnd = endOfWeek(monthEnd)

    const weekDays = ['Dim', 'Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam']
    const dayHeaders = weekDays.map(weekDay => (
      <div key={weekDay} className="font-semibold text-center p-2 text-gray-600">
        {weekDay}
      </div>
    ))

    const calendarDays = eachDayOfInterval({ start: calendarStart, end: calendarEnd })

    const weeks = []
    for (let i = 0; i < calendarDays.length; i += 7) {
      const week = calendarDays.slice(i, i + 7)
      weeks.push(
        <div className="grid grid-cols-7 gap-1" key={week[0].toString()}>
          {week.map(day => {
            const dayItems = sortedItems.filter(item => {
              const startDate = parseISO(item.startDateTime)
              return isSameDay(startDate, day) // Only show items that start on the same day
            })
            
            return (
              <DynamicDroppable key={day.toString()} droppableId={format(day, 'yyyy-MM-dd')}>
                {(provided, snapshot) => (
                  <div
                    ref={provided.innerRef}
                    {...provided.droppableProps}
                    className={cn(
                      "border p-2 h-32 overflow-y-auto",
                      !isSameMonth(day, monthStart) ? "bg-gray-100" : "bg-white",
                      isToday(day) && "border-blue-500 border-2",
                      snapshot.isDraggingOver ? "bg-blue-50" : ""
                    )}
                  >
                    <span className={cn(
                      "text-sm font-semibold",
                      !isSameMonth(day, monthStart) && "text-gray-400",
                      isToday(day) && "text-blue-600"
                    )}>
                      {format(day, 'd')}
                    </span>
                    {dayItems.map((item, index) => (
                      <DynamicDraggable key={item.id} draggableId={item.id} index={index}>
                        {(provided) => (
                          <div
                            ref={provided.innerRef}
                            {...provided.draggableProps}
                            {...provided.dragHandleProps}
                            className={cn(
                              "text-xs p-1 mt-1 rounded cursor-pointer",
                              item.type === 'image' ? "bg-green-100 text-green-800" :
                              item.type === 'webpage' ? "bg-blue-100 text-blue-800" :
                              item.type === 'video' ? "bg-purple-100 text-purple-800" :
                              "bg-yellow-100 text-yellow-800"
                            )}
                            onClick={() => handleEditItem(item)}
                          >
                            <div className="font-semibold">{item.title}</div>
                            <div className="text-xxs">
                              {format(parseISO(item.startDateTime), 'HH:mm')} - {format(parseISO(item.endDateTime), 'HH:mm')}
                            </div>
                          </div>
                        )}
                      </DynamicDraggable>
                    ))}
                    {provided.placeholder}
                  </div>
                )}
              </DynamicDroppable>
            )
          })}
        </div>
      )
    }

    return (
      <div className="calendar space-y-1">
        <div className="grid grid-cols-7 gap-1">{dayHeaders}</div>
        {weeks}
      </div>
    )
  }, [currentMonth, sortedItems, handleEditItem])

  const renderListItem = React.useCallback((item: ContentItem, index: number) => (
    <DynamicDraggable key={item.id} draggableId={item.id} index={index}>
      {(provided) => (
        <div
          ref={provided.innerRef}
          {...provided.draggableProps}
          {...provided.dragHandleProps}
          className="bg-white rounded-lg shadow-md p-4 mb-4 flex items-center justify-between"
        >
          <div className="flex items-center space-x-4">
            <div className="w-16 h-16 flex-shrink-0">
              {renderContentPreview(item)}
            </div>
            <div>
              <h3 className="font-semibold text-lg">{item.title}</h3>
              <p className="text-sm text-muted-foreground">
                {format(parseISO(item.startDateTime), 'PPp')} - {format(parseISO(item.endDateTime), 'PPp')}
              </p>
              <div className="flex mt-2 space-x-2">
                {item.tags.map((tag, index) => (
                  <span key={index} className="px-2 py-1 text-xs bg-primary/10 text-primary rounded-full">{tag}</span>
                ))}
              </div>
            </div>
          </div>
          <div className="flex items-center space-x-2 ">
            <Button variant="outline" size="sm" className="hover:bg-gray-200" onClick={() => handleEditItem(item)}>
              <Edit className="h-4 w-4 mr-2" />
              Modifier
            </Button>
            <Button
              variant="outline"
              size="sm"
              className="hover:bg-gray-200"
              onClick={() => {
                setItemToDelete(item)
                setDeleteDialogOpen(true)
              }}
            >
              <Trash2 className="h-4 w-4 mr-2" />
              Supprimer
            </Button>
          </div>
        </div>
      )}
    </DynamicDraggable>
  ), [handleEditItem, handleDeleteItem])

  const DeleteDialog = ({ item, isOpen, onClose, onDelete }: { item: ContentItem, isOpen: boolean, onClose: () => void, onDelete: (id: string) => void }) => (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[425px] bg-white"> {/* Set background to white */}
        <DialogHeader>
          <DialogTitle>Supprimer le contenu</DialogTitle>
          <DialogDescription>
            Êtes-vous sûr de vouloir supprimer ce contenu ? Cette action ne peut pas être annulée.
          </DialogDescription>
        </DialogHeader>
        <div className="mt-4">
          <h3 className="font-semibold">{item.title}</h3>
          <p className="text-sm text-gray-500">
            {format(parseISO(item.startDateTime), 'PPp')} - {format(parseISO(item.endDateTime), 'PPp')}
          </p>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={onClose} className="hover:bg-gray-200">Annuler</Button>
          <Button variant="outline" onClick={() => { onDelete(item.id); onClose(); }} className="hover:bg-gray-200">Supprimer</Button> {/* Change to outline variant */}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )

  const addItem = (item: ContentItem) => {
    setItems(prevItems => [...prevItems, item]);
  }

  return (
    <div className="container mx-auto p-4 space-y-8">
      <header className="flex flex-col sm:flex-row justify-between items-center gap-4">
        <h1 className="text-3xl font-bold text-primary">Gestion de contenu</h1>
        <div className="flex items-center gap-4">
          <div className="relative">
            <Search className="absolute left-2 top-1/2 transform -translate-y-1/2 text-muted-foreground" />
            <Input
              type="search"
              placeholder="Rechercher du contenu..."
              className="pl-8"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          <Popover>
            <PopoverTrigger asChild>
              <Button variant="outline">
                <Filter className="mr-2 h-4 w-4" />
                Filtrer
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-80 bg-white">
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="filterType">Type de contenu</Label>
                  <Select value={filterType} onValueChange={(value) => setFilterType(value)}>
                    <SelectTrigger id="filterType" className="bg-white">
                      <SelectValue placeholder="Sélectionner le type de contenu" />
                    </SelectTrigger>
                    <SelectContent className="bg-white">
                      <SelectItem value="all" className="hover:bg-gray-200">Tout</SelectItem>
                      <SelectItem value="image" className="hover:bg-gray-200">Image</SelectItem>
                      <SelectItem value="webpage" className="hover:bg-gray-200">Page Web</SelectItem>
                      <SelectItem value="text" className="hover:bg-gray-200">Texte</SelectItem>
                      <SelectItem value="video" className="hover:bg-gray-200">Vidéo</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="filterDateRange">Plage de dates</Label>
                  <div className="flex space-x-2">
                    <Popover>
                      <PopoverTrigger asChild>
                        <Button variant="outline" className="w-[150px] justify-start text-left font-normal">
                          <CalendarIcon className="mr-1 h-4 w-3" />
                          {filterDateRange.start ? format(filterDateRange.start, 'PP') : <span>Date de début</span>}
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-auto bg-white" align="start">
                        <Calendar
                          mode="single"
                          selected={filterDateRange.start}
                          onSelect={(date) => setFilterDateRange((prev) => ({ ...prev, start: date }))}
                          initialFocus
                          className="mt-2"
                          hideDayHeaders
                        />
                      </PopoverContent>
                    </Popover>
                    <Popover>
                      <PopoverTrigger asChild>
                        <Button variant="outline" className="w-[150px] justify-start text-left font-normal">
                          <CalendarIcon className="mr-1 h-4 w-3" />
                          {filterDateRange.end ? format(filterDateRange.end, 'PP') : <span>Date de fin</span>}
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-auto bg-white" align="start">
                        <Calendar
                          mode="single"
                          selected={filterDateRange.end}
                          onSelect={(date) => setFilterDateRange((prev) => ({ ...prev, end: date }))}
                          initialFocus
                          className="mt-2"
                          hideDayHeaders
                        />
                      </PopoverContent>
                    </Popover>
                  </div>
                  <Button variant="outline" onClick={() => setFilterDateRange({ start: null, end: null })}>Réinitialiser</Button>
                </div>
                <div className="space-y-1">
                  <Label htmlFor="filterTags">Étiquettes</Label>
                  <Input
                    id="filterTags"
                    placeholder="Entrez des étiquettes, séparées par des virgules"
                    value={filterTags.join(', ')}
                    onChange={(e) => setFilterTags(e.target.value.split(',').map(tag => tag.trim()))}
                  />
                </div>
              </div>
            </PopoverContent>
          </Popover>
          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild>
              <Button onClick={() => { setNewItem({}); setEditingId(null); }}>
                <Plus className="mr-2 h-4 w-4" />
                Ajouter du contenu
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[600px] bg-white p-6">
              <DialogHeader>
                <DialogTitle className="text-2xl font-semibold mb-4">{editingId ? 'Modifier le contenu' : 'Ajouter un nouveau contenu'}</DialogTitle>
              </DialogHeader>
              <div className="space-y-6">
                <div className="space-y-2">
                  <Label htmlFor="title">Titre</Label>
                  <Input
                    id="title"
                    value={newItem.title || ''}
                    onChange={(e) => setNewItem({ ...newItem, title: e.target.value })}
                    placeholder="Entrez le titre du contenu"
                  />
                </div>
                <div className="space-y-2">
                  <Label>Type de contenu</Label>
                  <div className="flex space-x-4">
                    <Button
                      variant={newItem.type === 'image' ? 'default' : 'outline'}
                      className={newItem.type === 'image' ? 'bg-gray-200' : 'hover:bg-gray-200'}
                      onClick={() => setNewItem({ ...newItem, type: 'image' })}
                    >
                      <ImageIcon className="mr-2 h-4 w-4" />
                      Image
                    </Button>
                    <Button
                      variant={newItem.type === 'webpage' ? 'default' : 'outline'}
                      className={newItem.type === 'webpage' ? 'bg-gray-200' : 'hover:bg-gray-200'}
                      onClick={() => setNewItem({ ...newItem, type: 'webpage' })}
                    >
                      <Globe className="mr-2 h-4 w-4" />
                      Site Web
                    </Button>
                    <Button
                      variant={newItem.type === 'text' ? 'default' : 'outline'}
                      className={newItem.type === 'text' ? 'bg-gray-200' : 'hover:bg-gray-200'}
                      onClick={() => setNewItem({ ...newItem, type: 'text' })}
                    >
                      <FileText className="mr-2 h-4 w-4" />
                      Texte
                    </Button>
                    <Button
                      variant={newItem.type === 'video' ? 'default' : 'outline'}
                      className={newItem.type === 'video' ? 'bg-gray-200' : 'hover:bg-gray-200'}
                      onClick={() => setNewItem({ ...newItem, type: 'video' })}
                    >
                      <VideoIcon className="mr-2 h-4 w-4" />
                      Vidéo
                    </Button>
                  </div>
                </div>
                {newItem.type === 'image' && (
                  <div 
                    className="border-2 border-dashed rounded-md p-4 text-center cursor-pointer"
                    onDragOver={(e) => e.preventDefault()}
                    onDrop={(e) => {
                      e.preventDefault()
                      if (e.dataTransfer.files && e.dataTransfer.files[0]) {
                        const file = e.dataTransfer.files[0]
                        const reader = new FileReader()
                        reader.onloadend = () => {
                          setNewItem({ ...newItem, content: reader.result as string })
                        }
                        reader.readAsDataURL(file)
                      }
                    }}
                  >
                    <ImageIcon className="mx-auto h-12 w-12 text-gray-400" />
                    <div className="mt-4 flex text-sm leading-6 text-gray-600">
                      <label
                        htmlFor="file-upload"
                        className="relative cursor-pointer rounded-md bg-white font-semibold text-indigo-600 focus-within:outline-none focus-within:ring-2 focus-within:ring-indigo-600 focus-within:ring-offset-2 hover:text-indigo-500"
                      >
                        <span>Télécharger un fichier</span>
                        <input 
                          id="file-upload" 
                          name="file-upload" 
                          type="file" 
                          className="sr-only"
                          onChange={(e) => {
                            if (e.target.files && e.target.files[0]) {
                              const file = e.target.files[0]
                              const reader = new FileReader()
                              reader.onloadend = () => {
                                setNewItem({ ...newItem, content: reader.result as string })
                              }
                              reader.readAsDataURL(file)
                            }
                          }}
                        />
                      </label>
                    </div>
                    <p className="text-xs leading-5 text-gray-600">PNG, JPG, GIF jusqu'à 10 Mo</p>
                  </div>
                )}
                {newItem.type === 'webpage' && (
                  <div className="space-y-2">
                    <Label htmlFor="url">URL du site Web</Label>
                    <Input
                      id="url"
                      type="url"
                      value={newItem.content || ''}
                      onChange={(e) => setNewItem({ ...newItem, content: e.target.value })}
                      placeholder="https://exemple.com"
                    />
                  </div>
                )}
                {newItem.type === 'text' && (
                  <div className="space-y-2">
                    <Label htmlFor="text-content">Contenu textuel</Label>
                    <Textarea
                      id="text-content"
                      value={newItem.content || ''}
                      onChange={(e) => setNewItem({ ...newItem, content: e.target.value })}
                      placeholder="Entrez votre contenu textuel ici"
                      rows={5}
                    />
                  </div>
                )}
                {newItem.type === 'video' && (
                  <div className="space-y-2">
                    <Label htmlFor="video-url">URL de la vidéo ou téléchargez un fichier vidéo</Label>
                    <Input
                      id="video-url"
                      type="url"
                      value={newItem.content || ''}
                      onChange={(e) => setNewItem({ ...newItem, content: e.target.value })}
                      placeholder="https://exemple.com/video.mp4"
                    />
                    <div 
                      className="border-2 border-dashed rounded-md p-4 text-center cursor-pointer"
                      onDragOver={(e) => e.preventDefault()}
                      onDrop={(e) => {
                        e.preventDefault();
                        if (e.dataTransfer.files && e.dataTransfer.files[0]) {
                          const file = e.dataTransfer.files[0];
                          const reader = new FileReader();
                          reader.onloadend = () => {
                            setNewItem({ ...newItem, content: reader.result as string });
                          };
                          reader.readAsDataURL(file);
                        }
                      }}
                    >
                      <VideoIcon className="mx-auto h-12 w-12 text-gray-400" />
                      <div className="mt-4 flex text-sm leading-6 text-gray-600">
                        <label
                          htmlFor="video-upload"
                          className="relative cursor-pointer rounded-md bg-white font-semibold text-indigo-600 focus-within:outline-none focus-within:ring-2 focus-within:ring-indigo-600 focus-within:ring-offset-2 hover:text-indigo-500"
                        >
                          <span>Télécharger un fichier vidéo</span>
                          <input 
                            id="video-upload" 
                            name="video-upload" 
                            type="file" 
                            className="sr-only"
                            accept="video/*"
                            onChange={(e) => {
                              if (e.target.files && e.target.files[0]) {
                                const file = e.target.files[0];
                                const reader = new FileReader();
                                reader.onloadend = () => {
                                  setNewItem({ ...newItem, content: reader.result as string });
                                };
                                reader.readAsDataURL(file);
                              }
                            }}
                          />
                        </label>
                      </div>
                      <p className="text-xs leading-5 text-gray-600">Formats pris en charge : MP4, AVI, jusqu'à 100 Mo</p>
                    </div>
                    {videoUploadProgress > 0 && (
                      <Progress value={videoUploadProgress} className="mt-4" /> // Display progress bar
                    )}
                  </div>
                )}
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="startDateTime">Date et heure de début</Label>
                    <Input
                      id="startDateTime"
                      type="datetime-local"
                      value={newItem.startDateTime || ''}
                      onChange={(e) => setNewItem({ ...newItem, startDateTime: e.target.value })}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="endDateTime">Date et heure de fin</Label>
                    <Input
                      id="endDateTime"
                      type="datetime-local"
                      value={newItem.endDateTime || ''}
                      onChange={(e) => setNewItem({ ...newItem, endDateTime: e.target.value })}
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="tags">Étiquettes</Label>
                  <Input
                    id="tags"
                    value={newItem.tags?.join(', ') || ''}
                    onChange={(e) => setNewItem({ ...newItem, tags: e.target.value.split(',').map(tag => tag.trim()) })}
                    placeholder="Entrez des étiquettes, séparées par des virgules"
                  />
                </div>
              </div>
              <DialogFooter className="mt-6 flex justify-end space-x-2">
                <Button variant="outline" onClick={() => setIsDialogOpen(false)} className="hover:bg-gray-200">Annuler</Button>
                <Button variant="outline" onClick={handleAddOrUpdateItem} className="hover:bg-gray-200">{editingId ? 'Mettre à jour' : 'Ajouter'} du contenu</Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>
      </header>
      
      <div className="flex justify-between items-center mb-4">
        <div className="flex space-x-2">
          <Button
            variant={viewMode === 'list' ? 'default' : 'outline'}
            className={viewMode === 'list' ? 'bg-gray-200' : ''}
            onClick={() => setViewMode('list')}
          >
            Liste
          </Button>
          <Button
            variant={viewMode === 'calendar' ? 'default' : 'outline'}
            className={viewMode === 'calendar' ? 'bg-gray-200' : ''}
            onClick={() => setViewMode('calendar')}
          >
            Calendrier
          </Button>
          <Button
            variant={viewMode === 'grid' ? 'default' : 'outline'}
            className={viewMode === 'grid' ? 'bg-gray-200' : ''}
            onClick={() => setViewMode('grid')}
          >
            Grille
          </Button>
        </div>
        {viewMode === 'calendar' && (
          <div className="flex items-center space-x-2">
            <Button variant="outline" onClick={() => setCurrentMonth(addDays(currentMonth, -30))}>
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <span className="font-medium">
              {format(currentMonth, 'MMMM yyyy')}
            </span>
            <Button variant="outline" onClick={() => setCurrentMonth(addDays(currentMonth, 30))}>
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        )}
      </div>

      <DynamicDragDropContext onDragEnd={onDragEnd}>
        {viewMode === 'list' && (
          <DynamicDroppable droppableId="list">
            {(provided) => (
              <div {...provided.droppableProps} ref={provided.innerRef}>
                {sortedItems.map((item, index) => renderListItem(item, index))}
                {provided.placeholder}
              </div>
            )}
          </DynamicDroppable>
        )}
        {viewMode === 'calendar' && renderCalendar()}
        {viewMode === 'grid' && (
          <DynamicDroppable droppableId="grid">
            {(provided) => (
              <div
                {...provided.droppableProps}
                ref={provided.innerRef}
                className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4"
              >
                {sortedItems.map((item, index) => renderGridItem(item, index))}
                {provided.placeholder}
              </div>
            )}
          </DynamicDroppable>
        )}
      </DynamicDragDropContext>

      {itemToDelete && (
        <DeleteDialog
          item={itemToDelete}
          isOpen={deleteDialogOpen}
          onClose={() => setDeleteDialogOpen(false)}
          onDelete={handleDeleteItem}
        />
      )}
    </div>
  )
}