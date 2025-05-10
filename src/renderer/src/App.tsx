import { useEffect, useState } from 'react'
import { ControlPanel, Note } from './windows'
import { Frame } from './components'
import { WindowType } from '@shared/constants' // Import the WindowType type
import './index.css'

interface WindowInfo {
  windowType: string
  windowId: number | null
  data: Record<string, string>
}

function App() {
  const [windowInfo, setWindowInfo] = useState<WindowInfo | null>(null)

  useEffect(() => {
    setWindowInfo(window.api.getWindowInfo())
  }, [])

  if (!windowInfo) {
    return (
      <Frame>
        <div className="default-window"></div>
      </Frame>
    )
  }

  switch (windowInfo.windowType) {
    case WindowType.Note:
      return <Note editable={windowInfo.data.editable == 'true'} />
    default:
      return <ControlPanel />
  }
}

export default App
