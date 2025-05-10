import { contextBridge, ipcRenderer } from 'electron'
import { electronAPI } from '@electron-toolkit/preload'

// Custom APIs for renderer
const api = {
  changeOpacity: (value: number) => ipcRenderer.invoke('change-opacity', value),

  createNote: (data?: { name: string }) => ipcRenderer.invoke('create-note', data),

  openNote: (data?: { name: string }) => ipcRenderer.invoke('open-note', data),

  closeWindow: () => ipcRenderer.invoke('close-window'),

  buttonToggleHide: () => ipcRenderer.invoke('button-toggle-hide'),

  buttonToggleEdit: () => ipcRenderer.invoke('button-toggle-edit'),

  onToggleEdit: (callback: (state: { edit: boolean; shortcut: boolean }) => void) =>
    ipcRenderer.on('shortcut-toggle-edit', (_event, value) => callback(value)),

  // Communication between windows
  // sendToWindow: (targetId: number | 'main', channel: string, ...args: any[]) =>
  //   ipcRenderer.invoke('send-to-window', targetId, channel, ...args),

  // Get a list of all secondary window IDs
  // listSecondaryWindows: () => ipcRenderer.invoke('list-secondary-windows'),

  // Window info
  getWindowInfo: () => {
    // Parse query parameters to get window type and ID
    const urlParams = new URLSearchParams(window.location.search)
    const windowType = urlParams.get('windowType') || 'main'
    const windowId = urlParams.get('windowId') ? parseInt(urlParams.get('windowId')!, 10) : null

    // Additional data passed when creating the window
    const data: Record<string, string> = {}
    urlParams.forEach((value, key) => {
      if (key !== 'windowType' && key !== 'windowId') {
        data[key] = value
      }
    })

    return { windowType, windowId, data }
  }

  // Receive messages from other windows
  // onReceive: (channel: string, callback: (...args: any[]) => void) => {
  //   const subscription = (_event: any, ...args: any[]) => callback(...args)
  //   ipcRenderer.on(channel, subscription)

  //   // Return a function to remove the event listener
  //   return () => {
  //     ipcRenderer.removeListener(channel, subscription)
  //   }
  // }
}

// Use `contextBridge` APIs to expose Electron APIs to
// renderer only if context isolation is enabled, otherwise
// just add to the DOM global.

if (process.contextIsolated) {
  try {
    contextBridge.exposeInMainWorld('electron', electronAPI)
    contextBridge.exposeInMainWorld('api', api)
  } catch (error) {
    console.error(error)
  }
} else {
  // @ts-ignore (define in dts)
  window.electron = electronAPI
  // @ts-ignore (define in dts)
  window.api = api
}
