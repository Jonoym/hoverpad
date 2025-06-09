import {
  MDXEditor,
  codeBlockPlugin,
  codeMirrorPlugin,
  toolbarPlugin,
  headingsPlugin,
  thematicBreakPlugin,
  linkPlugin,
  linkDialogPlugin,
  quotePlugin,
  listsPlugin,
  BoldItalicUnderlineToggles,
  InsertCodeBlock,
  markdownShortcutPlugin,
  ListsToggle
} from '@mdxeditor/editor'
import '@mdxeditor/editor/style.css'
import './editor.css'
import { codeblockLanguages } from './editorLanguages'

import { textSearchPlugin } from '@renderer/plugins/find'

interface EditorProps {
  content: string
  setContent: (value: string) => void
  setEditing: () => void
}

function Editor({ content, setContent, setEditing }: EditorProps) {
  return (
    <MDXEditor
      className="dark-theme"
      contentEditableClassName="prose"
      markdown={content}
      trim={false}
      onChange={(e) => {
        setEditing()
        setContent(e)
      }}
      plugins={[
        headingsPlugin(),
        linkPlugin(),
        linkDialogPlugin(),
        quotePlugin(),
        textSearchPlugin(),
        // highlightPlugin({
        //   searchTerm: searchTerm,
        //   highlightColor: 'blue'
        // }),
        listsPlugin(),
        codeBlockPlugin({ defaultCodeBlockLanguage: 'markdown' }),
        codeMirrorPlugin({
          codeBlockLanguages: codeblockLanguages
        }),
        thematicBreakPlugin(),
        toolbarPlugin({
          toolbarContents: () => (
            <>
              <BoldItalicUnderlineToggles />
              <ListsToggle />
              <InsertCodeBlock />
            </>
          )
        }),
        markdownShortcutPlugin()
      ]}
    />
  )
}

export default Editor
