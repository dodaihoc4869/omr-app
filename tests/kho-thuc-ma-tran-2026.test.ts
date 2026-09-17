import {it,expect} from 'vitest'
import {readdirSync,readFileSync} from 'node:fs'
import {parseKhoDeJson,buildTeacherSourceFromKhoDe} from '../src/lib/exam-kho-de-import'
import {rutDeChuan2026,laBoDe12} from '../src/lib/ma-tran-hoa-2026'
// Kiểm tra riêng trên bản kho tại máy khi chạy nghiệm thu; CI không có kho riêng.
const dir=process.env.KHO_NGHIEM_THU
it.skipIf(!dir)('kho BỘ ĐỀ thật đủ từng ô của ma trận, rút lặp 100 lần',()=>{
 const files=readdirSync(dir!).filter(x=>x.endsWith('.json'))
 const sources=files.flatMap(f=>{const r=parseKhoDeJson(JSON.parse(readFileSync(`${dir}/${f}`,'utf8')));if(!r.ok||!r.json)return [];const b=buildTeacherSourceFromKhoDe(r.json);return b.errors.length?[]:[b.source]}).filter(laBoDe12)
 expect(sources.length).toBeGreaterThan(0)
 for(let i=0;i<100;i++){const chosen=rutDeChuan2026(sources,String(i));expect(chosen.reduce((n,s)=>n+s.phanI.length+s.phanII.length+s.phanIII.length,0)).toBe(28)}
})
