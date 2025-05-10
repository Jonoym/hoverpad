import React, { useEffect, useState, MouseEvent, ReactNode } from 'react'

import './Frame.css'

interface Position {
  x: number
  y: number
}

interface FrameProps {
  children?: ReactNode
}

const Frame: React.FC<FrameProps> = ({ children }) => {
  // State for dragging window
  const [isDragging, setIsDragging] = useState<boolean>(false)
  const [startPos, setStartPos] = useState<Position>({ x: 0, y: 0 })

  //   const closeWindow = (): void => {
  //     window.electron.ipcRenderer.send('close-window')
  //   }

  // For window dragging
  const handleMouseDown = (e: MouseEvent<HTMLDivElement>): void => {
    // Only allow dragging from the custom title bar area
    if ((e.target as HTMLElement).classList.contains('draggable')) {
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
    if (isDragging) {
      setIsDragging(false)
    }
  }
  useEffect(() => {
    const handleGlobalMouseUp = (): void => {
      setIsDragging(false)
    }

    window.addEventListener('mouseup', handleGlobalMouseUp)
    return () => window.removeEventListener('mouseup', handleGlobalMouseUp)
  }, [])

  return (
    <div
      className="frame-container"
      onMouseDown={handleMouseDown}
      onMouseMove={handleMouseMove}
      onMouseUp={handleMouseUp}
      onMouseLeave={handleMouseUp}
    >
      <div className="title-bar">{children}</div>
      {/* 
      <div className="resize-handle top" onMouseDown={handleResizeStart('top')} />
      <div className="resize-handle right" onMouseDown={handleResizeStart('right')} />
      <div className="resize-handle bottom" onMouseDown={handleResizeStart('bottom')} />
      <div className="resize-handle left" onMouseDown={handleResizeStart('left')} />
      <div className="resize-handle top-left" onMouseDown={handleResizeStart('top-left')} />
      <div className="resize-handle top-right" onMouseDown={handleResizeStart('top-right')} />
      <div className="resize-handle bottom-left" onMouseDown={handleResizeStart('bottom-left')} />
      <div className="resize-handle bottom-right" onMouseDown={handleResizeStart('bottom-right')} /> */}
    </div>
  )
}

export default Frame
