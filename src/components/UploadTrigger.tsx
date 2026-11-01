import { useRef } from 'react'

interface UploadTriggerProps {
  onFile: (file: File, previewUrl: string) => void
  hidden?: boolean
  triggerRef?: React.RefObject<HTMLInputElement | null>
}

export function UploadTrigger({ onFile, hidden, triggerRef }: UploadTriggerProps) {
  const localRef = useRef<HTMLInputElement>(null)
  const ref = triggerRef ?? localRef

  function handleChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    if (!file.type.startsWith('image/')) {
      alert('Please choose an image file.')
      return
    }
    const previewUrl = URL.createObjectURL(file)
    onFile(file, previewUrl)
    e.target.value = ''
  }

  return (
    <input
      ref={ref}
      type="file"
      accept="image/*"
      capture="environment"
      className={hidden ? 'sr-only' : undefined}
      onChange={handleChange}
      aria-label="Upload bird photo"
    />
  )
}
