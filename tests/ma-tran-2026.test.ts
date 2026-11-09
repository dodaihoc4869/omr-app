import { describe,it,expect } from 'vitest'
import { rutDeChuan2026,MA_TRAN_HOA_2026,laBoDe12 } from '../src/lib/ma-tran-hoa-2026'
import { chamDeChuan } from '../server/src/luyen-de'
import { mergeAndStrip,type TeacherExamSource } from '../src/data/examContent'
import { assignStudentQuestions } from '../src/lib/exam-assign'
const source=():TeacherExamSource=>{
 const s:TeacherExamSource={maDe:'X',nhom:'12 · BỘ ĐỀ/Bộ 8+',phanI:[],phanII:[],phanIII:[]}
 for(const phan of ['I','II','III'] as const)for(const mucDo of ['biet','hieu','van_dung'] as const)for(let i=0;i<25;i++){
  const q={id:`${phan}-${mucDo}-${i}`,text:`Câu ${phan}-${mucDo}-${i}`,mucDo}
  if(phan==='I')s.phanI.push({...q,choices:['a','b','c','d'],correct:'A'})
  else if(phan==='II')s.phanII.push({...q,ideas:['a','b','c','d'],correct:['D','S','D','S']})
  else s.phanIII.push({...q,correct:'1.5'})
 }
 return s
}
describe('Rút đề đúng từng ô ma trận',()=>{
 it('100 lượt luôn đúng số câu, mức độ; không trùng; cấp cho học sinh không phá ma trận',()=>{
  const bank=source()
  for(let n=0;n<100;n++){
   const r=rutDeChuan2026([bank],String(n))[0]
   for(const p of ['I','II','III'] as const)for(const m of ['biet','hieu','van_dung'] as const)expect(r[`phan${p}`].filter(q=>q.mucDo===m)).toHaveLength(MA_TRAN_HOA_2026[p][m])
   const a=assignStudentQuestions(mergeAndStrip([r],{I:18,II:4,III:6}),'CA','HS')
   expect([a.phanI.length,a.phanII.length,a.phanIII.length]).toEqual([18,4,6])
  }
 })
 it('cùng seed tái hiện đúng đề; đổi lượt có câu khác',()=>{expect(rutDeChuan2026([source()],'a')).toEqual(rutDeChuan2026([source()],'a'));expect(rutDeChuan2026([source()],'a')).not.toEqual(rutDeChuan2026([source()],'b'))})
 it('(thầy 09/11 «đủ 28, chuẩn nhất có thể») ô thiếu ⇒ lấy ô gần nhất CÙNG PHẦN, vẫn đủ 28 và đúng hình dạng 18/4/6; không lấy kho khác khối',()=>{
  const s=source();s.phanI=s.phanI.filter(q=>q.mucDo!=='van_dung')
  const de=rutDeChuan2026([s,{...source(),nhom:'11 · BỘ ĐỀ'}],'x')
  expect(de.map(d=>d.nhom)).toEqual(['12 · BỘ ĐỀ/Bộ 8+'])
  const I=de.flatMap(d=>d.phanI),II=de.flatMap(d=>d.phanII),III=de.flatMap(d=>d.phanIII)
  expect([I.length,II.length,III.length]).toEqual([18,4,6])
  expect(I.filter(q=>q.mucDo==='hieu').length).toBe(6) // 4 suất Hiểu + 2 suất VD lấy Hiểu (gần nhất)
 })
 it('chỉ chặn khi CẢ KHO không đủ 28 câu sạch',()=>{
  const s:TeacherExamSource={...source(),phanI:source().phanI.slice(0,10),phanII:source().phanII.slice(0,3),phanIII:source().phanIII.slice(0,4)}
  expect(()=>rutDeChuan2026([s],'x')).toThrow('chưa đủ 28 câu sạch')
 })
 it('không nhận câu chưa có nhãn hoặc nghi sai (vẫn đủ 28 nhờ ô gần nhất; câu nghi sai không lọt vào đề)',()=>{const s=source();s.phanIII.forEach(q=>{q.canXem=true});const de=rutDeChuan2026([s],'x');expect(de.flatMap(d=>d.phanIII)).toHaveLength(0);expect(de.reduce((n,d)=>n+d.phanI.length+d.phanII.length+d.phanIII.length,0)).toBe(28)})
 it('chỉ nhận nhánh BỘ ĐỀ lớp 12, hỗ trợ Unicode NFD',()=>{expect(laBoDe12({nhom:'12 · BỘ ĐỀ/Bộ 8+'.normalize('NFD')})).toBe(true);expect(laBoDe12({nhom:'12 · DẠNG BÀI'})).toBe(false)})
 it('chấm thang 10 và điểm từng ý đúng/sai chuẩn',()=>{
  const s=rutDeChuan2026([source()],'x'),a:Record<string,string>={}
  s.forEach(s=>{s.phanI.forEach(q=>a[q.id]='A');s.phanII.forEach(q=>a[q.id]='DSDS');s.phanIII.forEach(q=>a[q.id]='1,5')})
  expect(chamDeChuan(s,a).score).toBe(10)
  expect(chamDeChuan(s,{}).score).toBe(0)
  a[s[0].phanII[0].id]='D---';expect(chamDeChuan(s,a).score).toBe(9.1)
 })
})
