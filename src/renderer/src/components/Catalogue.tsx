import './catalogue.css'

function Catalogue() {
  return (
    <div className="note-catalogue transition no-drag">
      <div className="note-catalogue-header">
        <div className="note-catalogue-tags">
          <div className="note-catalogue-tag"></div>
          <div className="note-catalogue-tag"></div>
          <div className="note-catalogue-tag"></div>
          <div className="note-catalogue-tag"></div>
          <div className="note-catalogue-tag"></div>
        </div>
        <input className="note-catalogue-search"></input>
      </div>
    </div>
  )
}

export default Catalogue
