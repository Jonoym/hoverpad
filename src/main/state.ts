import { ApplicationState } from '@shared/types'

export const DEFAULT_CONFIG = {
  hidden: false,
  editable: true,
  opacity: 1,
  expanded: false
}

export const appState: ApplicationState = {
  windows: {
    controlPanel: null, // Reference to the Control Panel Window
    titleToNote: new Map(), // Mapping from Title to Note Windows
    noteToTitle: new Map(), // Mapping from Note Window to Titles
    windows: [] // Current Window Configurations
  },
  files: {
    titles: new Set() // Set of all Titles
  },
  config: DEFAULT_CONFIG
}
