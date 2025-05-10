import { BrowserWindow } from 'electron'
import { ApplicationConfiguration, WindowMetadata } from '@shared/types'

type WindowRegistry = {
  main: BrowserWindow | null
  idToNoteBrowser: Map<number, BrowserWindow>
}

type FileRegistry = {
  titles: Set<string>
  browserToTitle: Map<BrowserWindow, string>
  titleToBrowser: Map<string, BrowserWindow>
}

type ApplicationState = {
  windows: WindowRegistry
  files: FileRegistry
  config: ApplicationConfiguration
  metadata: Record<string, WindowMetadata>
}

export const appState: ApplicationState = {
  windows: {
    main: null,
    idToNoteBrowser: new Map()
  },
  files: {
    titles: new Set(),
    browserToTitle: new Map(),
    titleToBrowser: new Map()
  },
  config: {
    hidden: false,
    editable: true,
    opacity: 1,
    expanded: false
  },
  metadata: {}
}
