import { ApplicationState } from '@shared/types'

export const appState: ApplicationState = {
  windows: {
    controlPanel: null,
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
  }
}
