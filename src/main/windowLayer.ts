// Windowing functions ands changes in the opacity
// Deployment of information functions - abstraction or higher order functions

import { is } from '@electron-toolkit/utils'
import { SEND_TOGGLE_EDIT, SEND_NOTES_LIST, WindowType } from '@shared/constants'
import { NoteDetails, WindowBounds } from '@shared/types'
import { BrowserWindow, IpcMainInvokeEvent, shell } from 'electron'
import { join } from 'path'
import { appState } from './state'
let nextWindowId = 1

const CONTROL_PANEL_CLOSED: WindowBounds = {
  width: 883,
  height: 62,
  x: 0,
  y: 0
}

const CONTROL_PANEL_OPEN: WindowBounds = {
  width: 883,
  height: 500,
  x: 0,
  y: 0
}

const updateOpacity = (opacity: number) => {
  console.log(`[WINDOW_LAYER] Helper: updateOpacity(${opacity})`)

  if (appState.windows.controlPanel === null) return
  appState.windows.controlPanel.setOpacity(opacity)
  for (const note of appState.windows.titleToNote.values()) {
    if (!note.isDestroyed()) {
      note.setOpacity(opacity)
    }
  }
}

const updateEdit = (state: boolean) => {
  console.log(`[WINDOW_LAYER] Helper: updateEdit(${state})`)

  for (const win of appState.windows.titleToNote.values()) {
    if (!win.isDestroyed()) {
      win.setIgnoreMouseEvents(!state)
    }
  }
}

export const WindowLayer = {
  closeWindow: (event: IpcMainInvokeEvent) => {
    console.log(`[WINDOW_LAYER] closeWindow()`)

    const window = BrowserWindow.fromWebContents(event.sender)
    if (window && !window.isDestroyed()) {
      if (appState.windows.noteToTitle.has(window)) {
        const title = appState.windows.noteToTitle.get(window)
        appState.windows.noteToTitle.delete(window)
        if (title) appState.windows.titleToNote.delete(title)
      }

      window.close()
    }
  },

  createControlPanel: () => {
    console.log(`[WINDOW_LAYER] createControlPanel()`)

    const windowState = appState.config.expanded ? CONTROL_PANEL_OPEN : CONTROL_PANEL_CLOSED

    const controlPanelWindow = new BrowserWindow({
      x: 100,
      y: 100,
      width: windowState.width,
      height: windowState.height,
      resizable: false,
      frame: false,
      transparent: true,
      hasShadow: true,
      alwaysOnTop: true,
      fullscreenable: false,
      icon: join(__dirname, '../../resources/icon.png'),
      ...(process.platform === 'linux'
        ? { icon: join(__dirname, '../../resources/icon.png') }
        : {}),
      webPreferences: {
        preload: join(__dirname, '../preload/index.js'),
        sandbox: false
      }
    })

    const windowParams = new URLSearchParams({
      windowType: WindowType.ControlPanel,
      opacity: appState.config.opacity.toString(),
      editable: appState.config.editable.toString(),
      expanded: appState.config.expanded.toString()
    }).toString()

    controlPanelWindow.on('move', () => {
      const bounds = controlPanelWindow.getBounds()
      console.log(`Window moved to: x=${bounds.x}, y=${bounds.y}`)
    })

    if (is.dev && process.env['ELECTRON_RENDERER_URL']) {
      controlPanelWindow.loadURL(`${process.env['ELECTRON_RENDERER_URL']}?${windowParams}`)
    } else {
      controlPanelWindow.loadFile(join(__dirname, '../renderer/index.html'), {
        search: windowParams
      })
    }

    appState.windows.controlPanel = controlPanelWindow
    controlPanelWindow.setOpacity(appState.config.opacity)

    controlPanelWindow.on('closed', () => {
      appState.windows.controlPanel = null
      appState.windows.titleToNote.values().forEach((win) => {
        if (!win.isDestroyed()) win.close()
      })
    })
  },

  checkNoteOpen: (title: string) => {
    return appState.windows.titleToNote.has(title)
  },

  focusNote: (title: string) => {
    const noteWindow = appState.windows.titleToNote.get(title)

    if (noteWindow) {
      noteWindow.focus()
      noteWindow.setAlwaysOnTop(true)
    }
  },

  openNote: async (title: string, content: string) => {
    console.log(`[WINDOW_LAYER] openNote(${title})`)

    const windowId = nextWindowId++

    console.log(`[WINDOW_LAYER] WindowId: ${windowId}`)

    const noteWindow = new BrowserWindow({
      width: 400,
      height: 500,
      frame: false,
      transparent: true,
      alwaysOnTop: true,
      fullscreenable: false,
      parent: appState.windows.controlPanel || undefined,
      icon: join(__dirname, '../../resources/icon.png'),
      ...(process.platform === 'linux'
        ? { icon: join(__dirname, '../../resources/icon.png') }
        : {}),
      webPreferences: {
        preload: join(__dirname, '../preload/index.js'),
        sandbox: false
      }
    })

    const windowParams = new URLSearchParams({
      windowType: WindowType.Note,
      windowId: windowId.toString(),
      ...{
        editable: appState.config.editable.toString(),
        title: title,
        content: content
      }
    }).toString()

    if (is.dev && process.env['ELECTRON_RENDERER_URL']) {
      noteWindow.loadURL(`${process.env['ELECTRON_RENDERER_URL']}?${windowParams}`)
    } else {
      noteWindow.loadFile(join(__dirname, '../renderer/index.html'), { search: windowParams })
    }

    appState.windows.titleToNote.set(title, noteWindow)
    appState.windows.noteToTitle.set(noteWindow, title)
    appState.files.titles.add(title)

    noteWindow.setIgnoreMouseEvents(!appState.config.editable)
    noteWindow.setOpacity(appState.config.opacity)

    noteWindow.webContents.setWindowOpenHandler(({ url }) => {
      shell.openExternal(url)
      return { action: 'deny' }
    })
  },

  closeNote: (title: string) => {
    console.log(`[WINDOW_LAYER] closeNote(${title})`)

    const note = appState.windows.titleToNote.get(title)
    if (note && !note.isDestroyed()) note.close()
  },

  updateOpacity: () => {
    console.log(`[WINDOW_LAYER] updateOpacity()`)

    const opacity = appState.config.opacity

    if (opacity < 0 || opacity > 1 || !appState.windows.controlPanel) return

    updateOpacity(opacity)
  },

  updateHide: () => {
    console.log(`[WINDOW_LAYER] updateHide()`)

    const hidden = appState.config.hidden

    console.log(`[WINDOW_LAYER]   Hidden: ${hidden}`)

    if (hidden) {
      updateOpacity(0)
      updateEdit(false)
    } else {
      updateOpacity(appState.config.opacity)
      updateEdit(appState.config.editable)
    }
  },

  updateEdit: () => {
    console.log(`[WINDOW_LAYER] updateEdit()`)

    if (appState.windows.controlPanel === null) return

    const editable = appState.config.editable

    console.log(`[WINDOW_LAYER]   Editable: ${editable}`)

    appState.windows.controlPanel.webContents.send(SEND_TOGGLE_EDIT, editable)
    for (const note of appState.windows.titleToNote.values())
      if (!note.isDestroyed()) note.webContents.send(SEND_TOGGLE_EDIT, editable)

    updateEdit(editable)
  },

  updateExpand: () => {
    console.log(`[WINDOW_LAYER] updateExpand()`)

    if (appState.windows.controlPanel === null) return

    const expanded = appState.config.expanded
    const controlPanel = appState.windows.controlPanel
    const dimensions = expanded ? CONTROL_PANEL_OPEN : CONTROL_PANEL_CLOSED

    console.log(`[WINDOW_LAYER]   Expanded: ${expanded}`)

    controlPanel.setResizable(true)
    controlPanel.setSize(dimensions.width, dimensions.height)
    controlPanel.setResizable(false)
  },

  updateControlPanel: (notes: Array<NoteDetails>) => {
    console.log(`[WINDOW_LAYER] updateControlPanel()`)

    if (appState.windows.controlPanel === null) return
    appState.windows.controlPanel.webContents.send(SEND_NOTES_LIST, notes)
  }
}
