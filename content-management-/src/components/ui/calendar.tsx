"use client"

import React, { useState } from 'react'
import { ChevronLeft, ChevronRight } from 'lucide-react'

const DAYS = ['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa']
const MONTHS = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December']

interface CalendarProps {
  onSelect: (date: Date) => void; // Add this prop
}

export const Calendar: React.FC<CalendarProps> = ({ onSelect }) => {
  const [currentDate, setCurrentDate] = useState(new Date(2024, 8, 1)) // September 2024

  const daysInMonth = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 0).getDate()
  const firstDayOfMonth = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1).getDay()

  const changeMonth = (increment: number) => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + increment, 1))
  }

  return (
    <div className="p-4 w-[300px]"> {/* Removed bg-white shadow-md rounded-lg */}
      <div className="flex items-center justify-between mb-4">
        <button onClick={() => changeMonth(-1)} className="p-1 hover:bg-gray-100 rounded">
          <ChevronLeft className="h-5 w-5 text-gray-600" />
        </button>
        <h2 className="text-lg font-semibold text-gray-800">
          {MONTHS[currentDate.getMonth()]} {currentDate.getFullYear()}
        </h2>
        <button onClick={() => changeMonth(1)} className="p-1 hover:bg-gray-100 rounded">
          <ChevronRight className="h-5 w-5 text-gray-600" />
        </button>
      </div>
      <div className="grid grid-cols-7 gap-1 mb-2">
        {DAYS.map(day => (
          <div key={day} className="text-center text-sm font-medium text-gray-500">
            {day}
          </div>
        ))}
      </div>
      <div className="grid grid-cols-7 gap-1">
        {Array.from({ length: firstDayOfMonth }, (_, i) => (
          <div key={`empty-${i}`} className="w-10 h-10" />
        ))}
        {Array.from({ length: daysInMonth }, (_, i) => (
          <div
            key={i + 1}
            className="w-10 h-10 flex items-center justify-center text-sm hover:bg-gray-100 rounded-full cursor-pointer"
            onClick={() => onSelect(new Date(currentDate.getFullYear(), currentDate.getMonth(), i + 1))} // Call onSelect with the selected date
          >
            {i + 1}
          </div>
        ))}
      </div>
    </div>
  )
}