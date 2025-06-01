import { useEffect, useState, MouseEvent, ReactNode } from 'react'
import './Frame.css'

interface Position {
  x: number
  y: number
}

interface FrameProps {
  children?: ReactNode
  className?: string
}

function Frame({ children, className }: FrameProps) {
  const [isDragging, setIsDragging] = useState(false)
  const [startPos, setStartPos] = useState<Position>({ x: 0, y: 0 })

  const handleMouseDown = (e: MouseEvent<HTMLDivElement>): void => {
    if ((e.target as HTMLElement).classList.contains('drag')) {
      setIsDragging(true)
      setStartPos({ x: e.clientX, y: e.clientY })
    }
  }

  const handleMouseMove = (e: MouseEvent<HTMLDivElement>): void => {
    if (isDragging) {
      const dx = e.clientX - startPos.x
      const dy = e.clientY - startPos.y
      window.electron.ipcRenderer.send('move-window', { dx, dy })
      setStartPos({ x: e.clientX, y: e.clientY })
    }
  }

  const handleMouseUp = (): void => {
    if (isDragging) setIsDragging(false)
  }

  useEffect(() => {
    const handleGlobalMouseUp = (): void => setIsDragging(false)

    window.addEventListener('mouseup', handleGlobalMouseUp)
    return () => window.removeEventListener('mouseup', handleGlobalMouseUp)
  }, [])

  return (
    <div
      className={`frame-container ${className ? className : ''}`}
      onMouseDown={handleMouseDown}
      onMouseMove={handleMouseMove}
      onMouseUp={handleMouseUp}
      onMouseLeave={handleMouseUp}
    >
      <div className="title-bar">{children}</div>
    </div>
  )
}

export default Frame
