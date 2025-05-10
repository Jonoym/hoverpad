import React, { useEffect, useState } from 'react'
import { ControlPanel, Frame, Note } from './components'
import './index.css'

const App = (): React.ReactElement => {
  const [windowInfo, setWindowInfo] = useState<{
    windowType: string
    windowId: number | null
    data: Record<string, string>
  } | null>(null)

  useEffect(() => {
    // Get window information from the electron API
    const info = window.api.getWindowInfo()
    setWindowInfo(info)
  }, [])

  if (!windowInfo) {
    return (
      <Frame>
        <div style={{ width: '100vw', height: '100vh' }}></div>
      </Frame>
    )
  }

  // Render different components based on window type
  switch (windowInfo.windowType) {
    case 'NOTE':
      return <Note editable={windowInfo.data.editable == 'true'} />
    default:
      return <ControlPanel />
  }
}

export default App
