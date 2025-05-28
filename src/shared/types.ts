import { BrowserWindow } from 'electron'

export type NoteDetails = {
  title: string
  active: boolean
  lastModifiedTime: number
}

export type ApplicationConfiguration = {
  hidden: boolean
  editable: boolean
  opacity: number
  expanded: boolean
}

export type WindowRegistry = {
  controlPanel: BrowserWindow | null
  titleToNote: Map<string, BrowserWindow>
  noteToTitle: Map<BrowserWindow, string>
  windows: Record<string, WindowBounds>
}

export type FileRegistry = {
  titles: Set<string>
}

export type ApplicationState = {
  windows: WindowRegistry
  files: FileRegistry
  config: ApplicationConfiguration
}

export type WindowBounds = {
  x: number
  y: number
  width: number
  height: number
}
