import type { CharacterOut } from '@/core/api/types'

interface CharacterListProps {
  characters: CharacterOut[]
  activeCharacterId?: number | null
  onSelectCharacter?: (id: number) => void
}

export function CharacterList({ characters, activeCharacterId, onSelectCharacter }: CharacterListProps) {
  if (!characters.length) {
    return <p className="text-sm text-muted-foreground p-4 text-center">暂无角色</p>
  }

  return (
    <div className="space-y-2 py-2">
      {characters.map((char) => (
        <button
          key={char.id}
          type="button"
          onClick={() => onSelectCharacter?.(char.id)}
          className={`w-full text-left p-3 rounded-lg border transition-colors ${
            activeCharacterId === char.id
              ? 'border-brand-300 bg-brand-50'
              : 'border-border/60 hover:border-brand-200 hover:bg-gray-50'
          }`}
        >
          <div className="flex items-center gap-2 mb-1">
            <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-purple-100 text-purple-600 text-xs font-bold">
              {char.name.charAt(0)}
            </div>
            <span className="font-medium text-sm">{char.name}</span>
          </div>
          {char.description && (
            <p className="text-xs text-muted-foreground line-clamp-2 ml-9">{char.description}</p>
          )}
        </button>
      ))}
    </div>
  )
}
