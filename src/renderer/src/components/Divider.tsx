import './Divider.css'

interface DividerProps {
  vertical?: boolean
  horizontal?: boolean
}

function Divider({ vertical, horizontal }: DividerProps) {
  if (vertical) return <div className="vertical-divider" />
  if (horizontal) return <div className="horizontal-divider" />
  return <></>
}

export default Divider
