import { type ClassValue, clsx } from 'clsx'
import { twMerge } from 'tailwind-merge'

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

const STOP_WORDS = new Set(['with', 'and', 'for', 'the', 'that', 'this', 'from', 'sets', 'into', 'over'])

export function extractSearchTokens(keywords: string, maxTokens = 4): string {
  return keywords
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, ' ')
    .split(/\s+/)
    .filter(w => w.length >= 4 && !STOP_WORDS.has(w))
    .slice(0, maxTokens)
    .join(' ')
}
