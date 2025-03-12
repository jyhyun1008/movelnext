import { marked } from "marked"
import parse from 'html-react-parser'

function EpParser(props) {

    const raw = props.raw
    const parsed = marked.parse(raw)
    let devided = parsed.replace(/\>\n\<h1\>/gm, `></div><div className="divider"><h1>${process.env.NEXT_PUBLIC_EMOJI} `)
    devided = devided.replace(/\>\n\<hr/gm, `></div><div className="divider"`)
    const data = parse(devided)
    return data
}
  
export default EpParser