export function formatWordCount(count: number): string {
  if (count >= 10000) {
    return `${(count / 10000).toFixed(1)} 万字`
  }
  if (count >= 1000) {
    return `${(count / 1000).toFixed(1)} 千字`
  }
  return `${count} 字`
}

export function formatCredits(amount: number): string {
  return amount.toFixed(2)
}

export function formatDate(isoString: string): string {
  const d = new Date(isoString)
  const y = d.getFullYear()
  const m = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  const h = String(d.getHours()).padStart(2, '0')
  const min = String(d.getMinutes()).padStart(2, '0')
  return `${y}-${m}-${day} ${h}:${min}`
}

export function parseReviewDimensions(dimensionsJson: string): Array<{
  label: string
  score: number
  comment: string
  suggestions: string
}> {
  try {
    return JSON.parse(dimensionsJson)
  } catch {
    return []
  }
}
