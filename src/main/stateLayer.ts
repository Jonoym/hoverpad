// Receives information or will provide information about the state
// Only needs to know about the data models - does not need to know about anything else
import { BrowserWindow, IpcMainInvokeEvent } from 'electron'
import { ApplicationConfiguration, NoteDetails, WindowBounds } from '@shared/types'
import { appState } from './state'

export const StateLayer = {
  saveConfig: (config: ApplicationConfiguration) => {
    console.log(`    [STATE LAYER ] saveConfig(${JSON.stringify(config)})`)
    appState.config = config
    appState.config.hidden = false
  },

  getWindowName: (event: IpcMainInvokeEvent): string => {
    console.log(`    [STATE LAYER ] getWindowName()`)
    const window = BrowserWindow.fromWebContents(event.sender)
    if (window && appState.windows.noteToTitle.has(window)) {
      const title = appState.windows.noteToTitle.get(window)!
      console.log(`    [STATE LAYER ]   Window Title: ${title}`)
      return title
    } else {
      console.error(`    [STATE LAYER ]   No Window Found`)
      return ''
    }
  },

  removeWindow: (title: string) => {
    console.log(`    [STATE LAYER ] removeWindow(${title})`)

    if (appState.windows.titleToNote.has(title)) {
      delete appState.windows.windows[title]
    }
  },

  deleteNote: (title: string) => {
    appState.files.titles.delete(title)
  },

  updateWindowArrangement: (title: string, bounds: WindowBounds) => {
    console.log(`    [STATE LAYER ] updateWindowArrangement(${title}, ${JSON.stringify(bounds)})`)

    appState.windows.windows[title] = bounds
  },

  saveWindowArrangement: (windowArrangement: Record<string, WindowBounds>) => {
    console.log(`    [STATE LAYER ] saveConfig(${JSON.stringify(windowArrangement)})`)

    appState.windows.windows = windowArrangement
  },

  titleAvailable: (title: string): boolean => {
    return !appState.files.titles.has(title)
  },

  saveTitles: (titles: string[]) => {
    console.log(`    [STATE LAYER ] saveTitles(${JSON.stringify(titles)})`)

    for (const title of titles) appState.files.titles.add(title)
  },

  updateOpacity: (opacity: number) => {
    console.log(`    [STATE LAYER ] updateOpacity(${opacity})`)

    appState.config.opacity = opacity
  },

  toggleHide: () => {
    console.log(`    [STATE LAYER ] toggleHide()`)

    appState.config.hidden = !appState.config.hidden
  },

  toggleEdit: () => {
    console.log(`    [STATE LAYER ] toggleEdit()`)
    appState.config.editable = !appState.config.editable
  },

  toggleExpand: () => {
    console.log(`    [STATE LAYER ] toggleExpand()`)
    appState.config.expanded = !appState.config.expanded
  },

  // Notes
  saveNote: (event: IpcMainInvokeEvent, title: string, previousTitle: string | null) => {
    console.log(`    [STATE LAYER ] saveNote(${title}, ${previousTitle})`)
    if (previousTitle) {
      const window = BrowserWindow.fromWebContents(event.sender)
      if (window) {
        appState.windows.titleToNote.set(title, window)
        appState.windows.windows[title] = window.getBounds()
        appState.files.titles.add(title)
        if (previousTitle !== '' && title != previousTitle) {
          StateLayer.removeWindow(previousTitle)
          appState.windows.titleToNote.delete(previousTitle)
          appState.files.titles.delete(previousTitle)
        }
      } else console.error(`    [STATE LAYER ]   Missing Window for ${previousTitle}`)
    }
  },

  updateActiveStatus: (noteDetails: Array<NoteDetails>) => {
    for (const note of noteDetails) {
      if (!appState.windows.titleToNote.has(note.title)) note.active = false
    }
    return noteDetails
  },

  getOpacity: (): number => {
    return appState.config.opacity
  }
}
