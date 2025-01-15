export function formatDate(date: Date | string): string {
  return new Date(date).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  })
}

export function classNames(...classes: (string | boolean | undefined)[]): string {
  return classes.filter(Boolean).join(' ')
}

export function truncateText(text: string, maxLength: number): string {
  if (text.length <= maxLength) return text
  return text.slice(0, maxLength) + '...'
}

export function getJobStatusColor(status: string): {
  text: string
  bg: string
  border: string
} {
  switch (status.toLowerCase()) {
    case 'applied':
      return {
        text: 'text-blue-800',
        bg: 'bg-blue-100',
        border: 'border-blue-200'
      }
    case 'interview':
      return {
        text: 'text-green-800',
        bg: 'bg-green-100',
        border: 'border-green-200'
      }
    case 'rejected':
      return {
        text: 'text-red-800',
        bg: 'bg-red-100',
        border: 'border-red-200'
      }
    default:
      return {
        text: 'text-gray-800',
        bg: 'bg-gray-100',
        border: 'border-gray-200'
      }
  }
}

export function generateUrlSearchParams(params: Record<string, string | number | boolean | undefined>): URLSearchParams {
  const searchParams = new URLSearchParams()
  
  Object.entries(params).forEach(([key, value]) => {
    if (value !== undefined && value !== '') {
      searchParams.set(key, String(value))
    }
  })
  
  return searchParams
}

export async function fetcher<T>(
  url: string,
  options: RequestInit = {}
): Promise<T> {
  const response = await fetch(url, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...options.headers,
    },
  })

  if (!response.ok) {
    throw new Error(`HTTP error! status: ${response.status}`)
  }

  return response.json()
}

export function debounce<T extends (...args: any[]) => any>(
  func: T,
  wait: number
): (...args: Parameters<T>) => void {
  let timeout: NodeJS.Timeout

  return function executedFunction(...args: Parameters<T>) {
    const later = () => {
      clearTimeout(timeout)
      func(...args)
    }

    clearTimeout(timeout)
    timeout = setTimeout(later, wait)
  }
} 