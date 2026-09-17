import {describe,it,expect} from 'vitest'
import {renderToStaticMarkup} from 'react-dom/server'
import {SCENES} from '../src/lib/experiments/catalog'
import {EXPANDED} from '../src/lib/experiments/expanded'
import {renderScene} from '../src/lib/experiments/scene'
import {experimentHtml,experimentOriginal} from '../src/lib/experiments/render'
import {MomQuestionStem} from '../src/components/MomQuestionMedia'
import {ThanCauGame} from '../src/components/CauHoiTrongGame'
import TheCau from '../src/components/TheCau'
const text='Khi cho glucose phản ứng với Cu(OH)₂ trong môi trường kiềm đun nóng, hiện tượng nào sau đây sẽ xảy ra?'
describe('shared experiment catalogue',()=>{
 it('has no broken references or duplicate scenes per question',()=>{for(const ids of Object.values(EXPANDED)){expect(new Set(ids).size).toBe(ids.length);for(const id of ids)expect(SCENES[id],id).toBeDefined()}})
 it('shows the same observed reaction in exams, Mom exercises and game questions',()=>{
 const variants=[renderToStaticMarkup(<TheCau phan="I" stt={1} text={text} choices={['A','B','C','D']} choicePerm={[0,1,2,3]} selected={null} cheDo="thi"/>),renderToStaticMarkup(<MomQuestionStem q={{text}}/>),renderToStaticMarkup(<ThanCauGame c={{cau:text,phuongAn:[]}}/>)];
 for(const h of variants){expect(h).toContain('Cu₂O');expect(h).toContain('đỏ gạch');expect(h).toContain('class="ex-demo" open')}
 })
 it('does not apply the heated-glucose reaction to modified or unspecified experiments',()=>{expect(experimentHtml(text.replace('đun nóng','ở nhiệt độ thường'))).toBe('');expect(experimentHtml('Lắp đặt thí nghiệm như hình vẽ.')).toBe('')})
 it('retains source diagrams and entire stem crops alongside general illustrations',()=>{
 expect(experimentOriginal(text,'<img src="labelled-apparatus.png">')).toBe('<img src="labelled-apparatus.png">');
 const h=renderToStaticMarkup(<TheCau phan="I" stt={1} text={text} thanCauImg="whole-stem.png" imageDataUrl="data-chart.png" choices={[]} choicePerm={[]} selected={null} cheDo="thi"/>);expect(h).toContain('whole-stem.png');expect(h).toContain('data-chart.png');expect(h).toContain('Cu₂O')
 })
 it('escapes source-like captions without executing HTML',()=>{const h=renderScene({title:'<img src=x onerror=alert(1)>',phases:[{title:'A',note:'<script>bad()</script>',vessels:[{label:'" onclick="bad()'}]}]});expect(h).not.toContain('<script>');expect(h).not.toContain('<img');expect(h).toContain('&lt;script&gt;')})
 it('distinguishes cold glucose from heated glucose and sealed gas from liquid',()=>{expect(renderScene(SCENES['glucose-cold'])).not.toContain('đỏ gạch');expect(renderScene(SCENES['glucose-hot'])).toContain('đỏ gạch');expect(renderScene(SCENES['no2-cold'])).toContain('Ống khí kín')})
 it('all scenes work offline and have accessible labelled graphics',()=>{for(const scene of Object.values(SCENES)){const h=renderScene(scene);expect(h).not.toMatch(/<script|<iframe|https?:\/\//);expect(h).toContain('aria-label=');expect(h).toContain('prefers-reduced-motion')}})
})
