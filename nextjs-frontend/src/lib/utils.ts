import { type ClassValue, clsx } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function formatDate(date: string | Date) {
  if (!date) return 'Date not available'
  
  const parsedDate = new Date(date)
  if (isNaN(parsedDate.getTime())) {
    return 'Invalid date'
  }
  
  return new Intl.DateTimeFormat('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  }).format(parsedDate)
}

export function getInitials(name: string) {
  return name
    .split(' ')
    .map(n => n.charAt(0))
    .join('')
    .toUpperCase()
    .slice(0, 2)
}

export function getStatusColor(status: string) {
  switch (status.toLowerCase()) {
    case 'pending':
      return 'bg-yellow-100 text-yellow-800 border-yellow-200'
    case 'confirmed':
      return 'bg-blue-100 text-blue-800 border-blue-200'
    case 'completed':
      return 'bg-green-100 text-green-800 border-green-200'
    case 'cancelled':
      return 'bg-red-100 text-red-800 border-red-200'
    default:
      return 'bg-gray-100 text-gray-800 border-gray-200'
  }
}

export function getPriorityIcon(priority: string) {
  switch (priority.toLowerCase()) {
    case 'urgent':
      return '🚨'
    case 'high':
      return '🔴'
    case 'medium':
      return '🟡'
    case 'low':
      return '🟢'
    default:
      return '🟡'
  }
}
