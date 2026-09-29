// Shared, offline, teacher-authorised in-question illustrations. No runtime keyword guessing.
import {EXPANDED} from './expanded'
import {SCENES} from './catalog'
import {renderScene} from './scene'
import {experimentKey,htmlMinhHoaNhe} from './nhe'
export {experimentKey,experimentOriginal,experimentCanReplaceImage} from './nhe'
export function experimentHtml(text:string):string{
 const scenes=EXPANDED[experimentKey(text)];if(scenes)return scenes.map(id=>SCENES[id]?renderScene(SCENES[id]):'').join('')
 return htmlMinhHoaNhe(text)
}
