import { useRef, useState, useCallback } from 'react'
import { cn } from '@/lib/utils'
import { FolderOpen, FileText, X, Upload } from 'lucide-react'
import { Button } from '@/components/ui/button'

interface FileUploadZoneProps {
  files: File[]
  onFilesChange: (files: File[]) => void
  maxFiles?: number
  maxSizeMB?: number
  accept?: string
  className?: string
}

const ACCEPTED_EXTENSIONS = ['.txt', '.md']

export function FileUploadZone({
  files,
  onFilesChange,
  maxFiles = 50,
  maxSizeMB = 50,
  accept = '.txt,.md',
  className,
}: FileUploadZoneProps) {
  const [isDragOver, setIsDragOver] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const folderInputRef = useRef<HTMLInputElement>(null)

  const maxSizeBytes = maxSizeMB * 1024 * 1024

  const filterValidFiles = useCallback(
    (incoming: File[]) => {
      const valid = incoming.filter((f) => {
        const ext = '.' + f.name.split('.').pop()?.toLowerCase()
        if (!ACCEPTED_EXTENSIONS.includes(ext)) return false
        if (f.size > maxSizeBytes) return false
        return true
      })
      const merged = [...files, ...valid].slice(0, maxFiles)
      onFilesChange(merged)
    },
    [files, maxFiles, maxSizeBytes, onFilesChange],
  )

  function handleDrop(e: React.DragEvent) {
    e.preventDefault()
    setIsDragOver(false)
    const dropped = Array.from(e.dataTransfer.files)
    filterValidFiles(dropped)
  }

  function handleDragOver(e: React.DragEvent) {
    e.preventDefault()
    setIsDragOver(true)
  }

  function handleDragLeave() {
    setIsDragOver(false)
  }

  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    if (e.target.files) {
      filterValidFiles(Array.from(e.target.files))
    }
    // Reset input value so re-selecting the same file works
    e.target.value = ''
  }

  function removeFile(index: number) {
    onFilesChange(files.filter((_, i) => i !== index))
  }

  function formatSize(bytes: number) {
    if (bytes < 1024) return bytes + ' B'
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB'
    return (bytes / (1024 * 1024)).toFixed(1) + ' MB'
  }

  return (
    <div className={cn('space-y-4', className)}>
      {/* Drop zone */}
      <div
        onDrop={handleDrop}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        className={cn(
          'relative rounded-2xl border-2 border-dashed p-10 text-center transition-all duration-200',
          isDragOver
            ? 'border-brand-400 bg-brand-50/40 scale-[1.01]'
            : 'border-gray-300 bg-gray-50/30 hover:border-gray-400 hover:bg-gray-50',
        )}
      >
        <FolderOpen className="h-12 w-12 mx-auto text-muted-foreground/50 mb-3" />
        <p className="text-base font-medium text-foreground mb-1">
          拖拽文件或文件夹到此处
        </p>
        <p className="text-sm text-muted-foreground mb-5">
          支持 .txt / .md 格式，最多 {maxFiles} 个文件，单文件 ≤ {maxSizeMB}MB
        </p>
        <div className="flex items-center justify-center gap-3">
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => fileInputRef.current?.click()}
          >
            <FileText className="h-4 w-4 mr-1.5" />
            选择文件
          </Button>
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => folderInputRef.current?.click()}
          >
            <FolderOpen className="h-4 w-4 mr-1.5" />
            选择文件夹
          </Button>
        </div>
        <input
          ref={fileInputRef}
          type="file"
          multiple
          accept={accept}
          onChange={handleFileChange}
          className="hidden"
        />
        <input
          ref={folderInputRef}
          type="file"
          // @ts-expect-error webkitdirectory is not in React types
          webkitdirectory=""
          // @ts-expect-error directory is not in React types
          directory=""
          onChange={handleFileChange}
          className="hidden"
        />
      </div>

      {/* File list */}
      {files.length > 0 && (
        <div className="rounded-xl border bg-white">
          <div className="px-4 py-2.5 border-b bg-gray-50/50 flex items-center justify-between">
            <span className="text-sm font-medium text-foreground">
              已选择 {files.length} 个文件
            </span>
            <span className="text-xs text-muted-foreground">
              总大小 {formatSize(files.reduce((acc, f) => acc + f.size, 0))}
            </span>
          </div>
          <div className="max-h-[200px] overflow-y-auto">
            {files.map((f, i) => (
              <div
                key={i}
                className="flex items-center gap-3 px-4 py-2.5 border-b border-gray-100 last:border-0 hover:bg-gray-50/50 transition-colors"
              >
                <FileText className="h-4 w-4 shrink-0 text-muted-foreground" />
                <span className="flex-1 truncate text-sm">{f.name}</span>
                <span className="text-xs text-muted-foreground shrink-0">
                  {formatSize(f.size)}
                </span>
                <button
                  type="button"
                  onClick={() => removeFile(i)}
                  className="p-1 rounded-md hover:bg-gray-200 text-muted-foreground hover:text-foreground transition-colors shrink-0"
                >
                  <X className="h-3.5 w-3.5" />
                </button>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
