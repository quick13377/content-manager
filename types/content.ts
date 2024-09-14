export interface ContentItem {
  id: string
  title: string
  type: 'image' | 'webpage' | 'text'
  content: string
  date: Date
  startTime: string
  endTime: string
  tags: string[]
}