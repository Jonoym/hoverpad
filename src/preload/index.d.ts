import { ElectronAPI } from '@electron-toolkit/preload'

interface API {
  changeOpacity(value: number): Promise<{ success: boolean; error?: string }>

  createNote: (data?: {
    name: string
  }) => Promise<{ success: boolean; windowId?: number; error?: string }>

  openNote: (data?: {
    name: string
  }) => Promise<{ success: boolean; windowId?: number; error?: string }>

  closeWindow: () => Promise<{ success: boolean; error?: string }>

  buttonToggleHide: () => Promise<{ success: boolean; error?: string }>

  buttonToggleEdit: () => Promise<{ success: boolean; error?: string }>

  onToggleEdit: (callback: (editable: boolean) => void) => void

  getWindowInfo: () => {
    windowType: string
    windowId: number | null
    editable: boolean
    data: Record<string, string>
  }
  // onReceive: (channel: string, callback: (...args: any[]) => void) => () => void
}

declare global {
  interface Window {
    electron: ElectronAPI
    api: API
  }
}
