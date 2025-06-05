// Windowing functions ands changes in the opacity
// Deployment of information functions - abstraction or higher order functions

import { is } from '@electron-toolkit/utils'
import {
  applicationName,
  WindowType,
  SEND_TOGGLE_EDIT,
  SEND_NOTES_LIST,
  CONTROL_PANEL_ID,
  SEND_OPACITY
} from '@shared/constants'
import { NoteDetails, WindowBounds } from '@shared/types'
import { BrowserWindow, IpcMainInvokeEvent, shell } from 'electron'
import { join } from 'path'
import { appState } from './state'
let nextWindowId = 1
export const CONTROL_PANEL_CLOSED: WindowBounds = {
  width: 700,
  height: 45,
  x: 100,
  y: 100
}

export const CONTROL_PANEL_OPEN: WindowBounds = {
  width: 700,
  height: 500,
  x: 100,
  y: 100
}

const updateOpacity = (opacity: number) => {
  console.log(`    [WINDOW LAYER] Helper: updateOpacity(${opacity})`)

  if (appState.windows.controlPanel === null) return
  appState.windows.controlPanel.setOpacity(opacity)
  for (const note of appState.windows.titleToNote.values()) {
    if (!note.isDestroyed()) {
      note.setOpacity(opacity)
    }
  }
}

const updateEdit = (state: boolean, main: boolean = false) => {
  console.log(`    [WINDOW LAYER] Helper: updateEdit(${state})`)

  if (main) appState.windows.controlPanel!.setIgnoreMouseEvents(!state)
  for (const win of appState.windows.titleToNote.values()) {
    if (!win.isDestroyed()) {
      win.setIgnoreMouseEvents(!state)
    }
  }
}

export const WindowLayer = {
  closeWindow: (event: IpcMainInvokeEvent) => {
    console.log(`    [WINDOW LAYER] closeWindow()`)

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

  closeNoteWindow: (title: string) => {
    console.log(`    [WINDOW LAYER] closeNoteWindow(${title})`)

    if (appState.windows.titleToNote.has(title)) {
      const noteWindow = appState.windows.titleToNote.get(title)
      if (noteWindow && !noteWindow.isDestroyed()) {
        noteWindow.close()
        appState.windows.titleToNote.delete(title)
        appState.windows.noteToTitle.delete(noteWindow)
      }
    }
  },

  createControlPanel: (handleWindowUpdate: (title: string, bounds: WindowBounds) => void) => {
    console.log(`    [WINDOW LAYER] createControlPanel()`)

    const windowState = appState.windows.windows[CONTROL_PANEL_ID]
      ? appState.windows.windows[CONTROL_PANEL_ID]
      : CONTROL_PANEL_CLOSED

    const windowSize = appState.config.expanded ? CONTROL_PANEL_OPEN : CONTROL_PANEL_CLOSED

    const controlPanelWindow = new BrowserWindow({
      title: applicationName,
      x: windowState.x,
      y: windowState.y,
      width: windowSize.width,
      height: windowSize.height,
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

    if (is.dev && process.env['ELECTRON_RENDERER_URL']) {
      controlPanelWindow.loadURL(`${process.env['ELECTRON_RENDERER_URL']}?${windowParams}`)
    } else {
      controlPanelWindow.loadFile(join(__dirname, '../renderer/index.html'), {
        search: windowParams
      })
    }

    const windowBounds = controlPanelWindow.getBounds()

    appState.windows.windows[CONTROL_PANEL_ID] = {
      x: windowBounds.x,
      y: windowBounds.y,
      width: windowBounds.width,
      height: windowBounds.height
    }

    appState.windows.controlPanel = controlPanelWindow
    controlPanelWindow.setOpacity(appState.config.opacity)
    controlPanelWindow.setVisibleOnAllWorkspaces(true, { visibleOnFullScreen: true })
    controlPanelWindow.setMenuBarVisibility(false)
    controlPanelWindow.setAlwaysOnTop(true, 'screen-saver')
    controlPanelWindow.setSkipTaskbar(true)

    controlPanelWindow.on('closed', () => {
      appState.windows.controlPanel = null
      appState.windows.titleToNote.values().forEach((win) => {
        if (!win.isDestroyed()) win.close()
      })
    })

    controlPanelWindow.on('resize', () => {
      const bounds = controlPanelWindow.getBounds()
      handleWindowUpdate(CONTROL_PANEL_ID, bounds)
    })

    controlPanelWindow.on('move', () => {
      const bounds = controlPanelWindow.getBounds()
      handleWindowUpdate(CONTROL_PANEL_ID, bounds)
    })
  },

  openWindowArrangement: async (
    noteContent: Array<[string, string] | null>,
    handleWindowUpdate: (title: string, bounds: WindowBounds) => void
  ) => {
    console.log(`    [WINDOW LAYER] openWindowArrangement()`)

    for (const note of noteContent) {
      if (note) {
        const [title, content] = note
        const bounds = appState.windows.windows[title]
        WindowLayer.openNote(title, content, handleWindowUpdate, bounds)
      }
    }
    console.log(`    [WINDOW LAYER] openWindowArrangement() Completed`)
  },

  checkNoteOpen: (title: string) => {
    console.log(`    [WINDOW LAYER] checkNoteOpen(${title})`)
    return appState.windows.titleToNote.has(title)
  },

  focusNote: (title: string) => {
    console.log(`    [WINDOW LAYER] focuseNote(${title})`)

    const noteWindow = appState.windows.titleToNote.get(title)

    if (noteWindow) {
      noteWindow.focus()
      noteWindow.setAlwaysOnTop(true)
    }
  },

  openNote: async (
    title: string,
    content: string,
    handleWindowUpdate: (title: string, bounds: WindowBounds) => void,
    bounds?: WindowBounds | undefined
  ) => {
    console.log(`    [WINDOW LAYER] openNote(${title})`)

    const windowId = nextWindowId++

    console.log(`    [WINDOW LAYER] WindowId: ${windowId}`)

    const noteWindow = new BrowserWindow({
      x: bounds ? bounds.x : undefined,
      y: bounds ? bounds.y : undefined,
      width: bounds ? bounds.width : 400,
      height: bounds ? bounds.height : 500,
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
    noteWindow.setVisibleOnAllWorkspaces(true, { visibleOnFullScreen: true })
    noteWindow.setAlwaysOnTop(true, 'screen-saver')

    const windowBounds = noteWindow.getBounds()

    appState.windows.windows[title] = {
      x: windowBounds.x,
      y: windowBounds.y,
      width: windowBounds.width,
      height: windowBounds.height
    }

    noteWindow.on('resize', () => {
      const title = appState.windows.noteToTitle.get(noteWindow)

      if (title) {
        const bounds = noteWindow.getBounds()
        handleWindowUpdate(title, bounds)
      } else console.error(`    [WINDOW LAYER] on => resize`)
    })

    noteWindow.on('move', () => {
      const title = appState.windows.noteToTitle.get(noteWindow)

      if (title) {
        const bounds = noteWindow.getBounds()
        handleWindowUpdate(title, bounds)
      } else console.error(`    [WINDOW LAYER] on => move`)
    })

    noteWindow.webContents.setWindowOpenHandler(({ url }) => {
      shell.openExternal(url)
      return { action: 'deny' }
    })
  },

  updateNoteTitle(event: IpcMainInvokeEvent, title: string) {
    console.log(`    [WINDOW LAYER] updateNoteTitle(${title})`)

    const window = BrowserWindow.fromWebContents(event.sender)

    if (window) {
      window?.setTitle(title)
    }
  },

  updateOpacity: () => {
    console.log(`    [WINDOW LAYER] updateOpacity()`)

    const opacity = appState.config.opacity

    if (opacity < 0 || opacity > 1 || !appState.windows.controlPanel) return

    updateOpacity(opacity)
  },

  updateHide: () => {
    console.log(`    [WINDOW LAYER] updateHide()`)

    const hidden = appState.config.hidden

    console.log(`    [WINDOW LAYER]   Hidden: ${hidden}`)

    if (hidden) {
      updateOpacity(0)
      updateEdit(false, true)
    } else {
      updateOpacity(appState.config.opacity)
      updateEdit(appState.config.editable, true)
    }
  },

  updateEdit: () => {
    console.log(`    [WINDOW LAYER] updateEdit()`)

    if (appState.windows.controlPanel === null) return

    const editable = appState.config.editable

    console.log(`    [WINDOW LAYER]   Editable: ${editable}`)

    appState.windows.controlPanel.webContents.send(SEND_TOGGLE_EDIT, editable)
    for (const note of appState.windows.titleToNote.values())
      if (!note.isDestroyed()) note.webContents.send(SEND_TOGGLE_EDIT, editable)

    updateEdit(editable)
  },

  updateExpand: () => {
    console.log(`    [WINDOW LAYER] updateExpand()`)

    if (appState.windows.controlPanel === null) return

    const expanded = appState.config.expanded
    const controlPanel = appState.windows.controlPanel
    const dimensions = expanded ? CONTROL_PANEL_OPEN : CONTROL_PANEL_CLOSED

    console.log(`    [WINDOW LAYER]   Expanded: ${expanded}`)

    controlPanel.setResizable(true)
    controlPanel.setSize(dimensions.width, dimensions.height)
    controlPanel.setResizable(false)
  },

  updateControlPanel: (notes: Array<NoteDetails>) => {
    console.log(`    [WINDOW LAYER] updateControlPanel()`)

    if (appState.windows.controlPanel === null) return
    appState.windows.controlPanel.webContents.send(SEND_NOTES_LIST, notes)
  },

  broadcastOpacity: (opacity: number) => {
    console.log(`    [WINDOW LAYER] broadcastOpacity()`)

    if (appState.windows.controlPanel === null) return
    appState.windows.controlPanel.webContents.send(SEND_OPACITY, opacity)
  }
}
