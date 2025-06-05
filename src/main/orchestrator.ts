// The orchestrator is responsible for receiving data and calling the necessary
// functions to use it somewhere

// ASYNC and EXCEPTION HANDLING

import { IpcMainInvokeEvent } from 'electron'
import { FileLayer } from './fileLayer'
import { StateLayer } from './stateLayer'
import { WindowLayer } from './windowLayer'
import { WindowBounds } from '@shared/types'

// Dependencies are on the stateLayer and fileLayer

const refreshWindowStates = async () => {
  console.log(`[ORCHESTRATOR    ] refreshWindowStates()`)
  FileLayer.saveWindowArrangement()

  const notes = await FileLayer.getNotesList()

  const updateNoteDetails = StateLayer.updateActiveStatus(notes)

  WindowLayer.updateControlPanel(updateNoteDetails)
}

const handleWindowUpdate = async (title: string, bounds: WindowBounds) => {
  console.log(`[ORCHESTRATOR    ] handleWindowUpdate(${title}, ${JSON.stringify(bounds)})`)
  StateLayer.updateWindowArrangement(title, bounds)

  FileLayer.saveWindowArrangement()
}

export const Orchestrator = {
  initialiseState: async () => {
    console.log(`[ORCHESTRATOR    ] initialiseState()`)

    const titles = (await FileLayer.getNotesList()).map((note) => note.title)
    StateLayer.saveTitles(titles)
  },

  // Windows
  createWindow: async () => {
    console.log(`[ORCHESTRATOR    ] createWindow()`)

    const [config, windowArrangement] = await Promise.all([
      FileLayer.getConfig(),
      FileLayer.getWindowArrangement()
    ])

    StateLayer.saveConfig(config)
    StateLayer.saveWindowArrangement(windowArrangement)

    const content = await FileLayer.getNoteContentBatch()

    WindowLayer.createControlPanel(handleWindowUpdate)
    await WindowLayer.openWindowArrangement(content, handleWindowUpdate)

    refreshWindowStates()
  },

  closeWindow: async (event: IpcMainInvokeEvent) => {
    console.log(`[ORCHESTRATOR    ] closeWindow()`)
    const title = StateLayer.getWindowName(event)
    StateLayer.removeWindow(title)

    WindowLayer.closeWindow(event)

    refreshWindowStates()
  },

  // Control Panel
  changeOpacity: async (_, opacity: number) => {
    console.log(`[ORCHESTRATOR    ] changeOpacity()`)
    StateLayer.updateOpacity(opacity)

    WindowLayer.updateOpacity()

    FileLayer.saveConfig()
  },

  toggleHide: async () => {
    console.log(`[ORCHESTRATOR    ] toggleHide()`)
    StateLayer.toggleHide()

    WindowLayer.updateHide()

    FileLayer.saveConfig()
  },

  toggleEdit: async () => {
    console.log(`[ORCHESTRATOR    ] toggleEdit()`)
    StateLayer.toggleEdit()

    WindowLayer.updateEdit()

    FileLayer.saveConfig()
  },

  toggleExpand: async () => {
    console.log(`[ORCHESTRATOR    ] toggleExpand()`)
    StateLayer.toggleExpand()

    WindowLayer.updateExpand()

    FileLayer.saveConfig()
  },

  // Note
  createNote: async () => {
    console.log(`[ORCHESTRATOR    ] createNote()`)

    const defaultTitle = FileLayer.getDefaultTitle()

    WindowLayer.openNote(defaultTitle, '', handleWindowUpdate)

    await FileLayer.saveNote(defaultTitle, defaultTitle, '')

    const notes = await FileLayer.getNotesList()

    const updateNoteDetails = StateLayer.updateActiveStatus(notes)

    WindowLayer.updateControlPanel(updateNoteDetails)
  },

  openNote: async (_, title: string) => {
    console.log(`[ORCHESTRATOR    ] openNote()`)
    const content = await FileLayer.getNoteContent(title)

    if (!WindowLayer.checkNoteOpen(title)) WindowLayer.openNote(title, content, handleWindowUpdate)
    else WindowLayer.focusNote(title)

    const notes = await FileLayer.getNotesList()

    const updateNoteDetails = StateLayer.updateActiveStatus(notes)

    WindowLayer.updateControlPanel(updateNoteDetails)
  },

  deleteNote: async (_, title: string) => {
    console.log(`[ORCHESTRATOR    ] deleteNote(${title})`)

    StateLayer.removeWindow(title)

    WindowLayer.closeNoteWindow(title)

    StateLayer.deleteNote(title)

    await FileLayer.deleteNote(title)

    refreshWindowStates()
  },

  saveNote: async (
    event: IpcMainInvokeEvent,
    title: string,
    previousTitle: string,
    content: string
  ) => {
    if (title === '') return // TODO: Return Error
    console.log(`[ORCHESTRATOR    ] saveNote()`)

    WindowLayer.updateNoteTitle(event, title)

    StateLayer.saveNote(event, title, previousTitle)

    await FileLayer.saveNote(title, previousTitle, content)

    refreshWindowStates()
  },

  // Notes
  refreshNotes: async () => {
    console.log(`[ORCHESTRATOR    ] refreshNotes()`)

    refreshWindowStates()
  },

  decreaseOpacity: () => {
    console.log(`[ORCHESTRATOR    ] decreaseOpacity()`)

    const updatedOpacity = Math.max(0.2, StateLayer.getOpacity() - 0.1)

    Orchestrator.changeOpacity(null, updatedOpacity)

    WindowLayer.broadcastOpacity(updatedOpacity)
  },

  increaseOpacity: () => {
    console.log(`[ORCHESTRATOR    ] increaseOpacity()`)

    const updatedOpacity = Math.min(1, StateLayer.getOpacity() + 0.1)

    Orchestrator.changeOpacity(null, updatedOpacity)

    WindowLayer.broadcastOpacity(updatedOpacity)
  }
}
