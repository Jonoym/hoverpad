import {
  MDXEditor,
  codeBlockPlugin,
  codeMirrorPlugin,
  toolbarPlugin,
  headingsPlugin,
  tablePlugin,
  thematicBreakPlugin,
  linkPlugin,
  linkDialogPlugin,
  quotePlugin,
  InsertTable,
  listsPlugin,
  BoldItalicUnderlineToggles,
  markdownShortcutPlugin,
  ListsToggle
} from '@mdxeditor/editor'
import '@mdxeditor/editor/style.css'
import './editor.css'
import { codeblockLanguages } from './editorLanguages'

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
      onChange={(e) => {
        setEditing()
        setContent(e)
      }}
      plugins={[
        headingsPlugin(),
        linkPlugin(),
        linkDialogPlugin(),
        quotePlugin(),
        listsPlugin(),
        codeBlockPlugin({ defaultCodeBlockLanguage: 'markdown' }),
        codeMirrorPlugin({
          codeBlockLanguages: codeblockLanguages
        }),
        thematicBreakPlugin(),
        tablePlugin(),
        toolbarPlugin({
          toolbarContents: () => (
            <>
              <InsertTable />
              <BoldItalicUnderlineToggles />
              <ListsToggle />
            </>
          )
        }),
        markdownShortcutPlugin()
      ]}
    />
  )
}

export default Editor
