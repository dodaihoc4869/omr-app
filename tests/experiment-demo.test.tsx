import {describe,it,expect} from 'vitest'
import {renderToStaticMarkup} from 'react-dom/server'
import {experimentHtml} from '../src/lib/experiments/render'
import TheCau from '../src/components/TheCau'
const text='Trong thí nghiệm bắn phá lá vàng của Rutherford, hầu hết các hạt alpha xuyên thẳng qua lá vàng mà không bị lệch hướng. Điều này chứng tỏ:'
describe('verified experimental illustrations',()=>{
 it('matches verified stem and fails closed when text changes',()=>{expect(experimentHtml(text)).toContain('ex-demo');expect(experimentHtml(text+' Thay bằng lá nhôm.')).toBe('');expect(experimentHtml('Cho hai chất chưa biết vào ống nghiệm')).toBe('')})
 it('shows the authorised phenomenon in both exam and review without choosing an answer',()=>{const p={phan:'I' as const,stt:1,text,choices:['A','B','C','D'],choicePerm:[0,1,2,3],selected:null,correct:'A' as const};expect(renderToStaticMarkup(<TheCau {...p} cheDo="thi"/>)).toContain('ex-demo');expect(renderToStaticMarkup(<TheCau {...p} cheDo="xem_lai"/>)).toContain('ex-demo')})
 it('contains offline animation, replay and reduced-motion support',()=>{const h=experimentHtml(text);expect(h).toContain('<details');expect(h).toContain('prefers-reduced-motion');expect(h).not.toContain('<script');expect(h).not.toContain('<iframe')})
})
