import { useEffect, useState } from 'react'
import { ControlPanel, Note } from './windows'
import { Frame } from './components'
import { WindowType } from '@shared/constants' // Import the WindowType type
import './index.css'
import { WindowInfo } from './windows/Note'

function App() {
  const [windowInfo, setWindowInfo] = useState<WindowInfo | null>(null)

  useEffect(() => {
    const windowInfo = window.api.getWindowInfo()
    setWindowInfo(windowInfo)
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
      return <Note windowInfo={windowInfo} />
    default:
      return <ControlPanel windowInfo={windowInfo} />
  }
}

export default App
