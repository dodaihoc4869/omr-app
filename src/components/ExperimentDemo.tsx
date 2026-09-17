import {experimentHtml,experimentCanReplaceImage} from '../lib/experiments/render'
export default function ExperimentDemo({text}:{text?:string}){const html=experimentHtml(text??'');return html?<div dangerouslySetInnerHTML={{__html:html}}/>:null}
export function ExperimentOriginal({text,children,hasImages=true}:{text?:string;hasImages?:boolean;children:import('react').ReactNode}){return hasImages&&experimentCanReplaceImage(text??'')?<details className="ex-original"><summary>Xem hình gốc của đề</summary>{children}</details>:<>{children}</>}
