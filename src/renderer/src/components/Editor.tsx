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

function Editor() {
  return (
    <MDXEditor
      className="dark-theme"
      contentEditableClassName="prose"
      markdown="> This is a quote"
      // onChange={(value) => setContent(value)}
      plugins={[
        headingsPlugin(),
        linkPlugin(),
        linkDialogPlugin(),
        quotePlugin(),
        listsPlugin(),
        codeBlockPlugin({ defaultCodeBlockLanguage: 'markdown' }),
        codeMirrorPlugin({
          codeBlockLanguages: {
            markdown: 'Markdown',
            txt: 'Plain Text'
          }
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
