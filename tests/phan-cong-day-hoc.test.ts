import {it,expect} from 'vitest'
import {phanCongDayHoc} from '../src/lib/phan-cong-day-hoc'
import type {CauChua,EmGoi} from '../src/lib/phan-cong'
const qs=Array.from({length:31},(_,i)=>({id:String(i),mucDo:'biet'} as CauChua))
const es=[0,0,0,9].map((n,i)=>({sbd:String(i),hoTen:String(i),coMat:true,soLanLenBang:n} as EmGoi))
it('phân toàn bộ câu, không trùng em trong một cặp, cân bằng lượt và ưu tiên ít lượt',()=>{
 const r=phanCongDayHoc(qs,es,()=>0.5)
 expect(r.phanCong.map(p=>p.cau.id)).toEqual(qs.map(q=>q.id))
 for(let i=0;i<30;i+=2)expect(r.phanCong[i].sbd).not.toBe(r.phanCong[i+1].sbd)
 expect(r.phanCong.slice(0,20).every(p=>p.sbd!=='3')).toBe(true)
 expect(r.chuaPhan).toHaveLength(0)
})
it('bốc ngẫu nhiên khi ngang lượt và loại học sinh vắng',()=>{
 expect(phanCongDayHoc(qs,es,()=>0).phanCong[0].sbd).not.toBe(phanCongDayHoc(qs,es,()=>0.99).phanCong[0].sbd)
 expect(phanCongDayHoc(qs,es.map((e,i)=>({...e,coMat:i!==0}))).phanCong.every(p=>p.sbd!=='0')).toBe(true)
 expect(()=>phanCongDayHoc(qs,es.slice(0,1))).toThrow()
})

it('ghép đúng bậc thang sư phạm 3 nấc (nền tảng, kỹ năng, bứt phá)', () => {
  const cauHoc: CauChua[] = [
    { id: 'q1', phan: 'I', so: 1, chuyenDe: 'Ester', mucDo: 'biet', sao: 0, tomTat: 'Câu nhận biết', viTri: 0, lyDoSao: '' },
    { id: 'q2', phan: 'I', so: 2, chuyenDe: 'Ester', mucDo: 'van_dung', sao: 2, tomTat: 'Câu vận dụng', viTri: 1, lyDoSao: '' },
  ]
  const hs: EmGoi[] = [
    {
      sbd: 'yeu',
      hoTen: 'Em Yếu',
      coMat: true,
      soLanLenBang: 0,
      chuyenDe: [{ ten: 'Ester', soCau: 10, soSai: 8 }],
      daGoiTheoCd: {},
      daGoiCau: [],
    },
    {
      sbd: 'gioi',
      hoTen: 'Em Giỏi',
      coMat: true,
      soLanLenBang: 0,
      chuyenDe: [{ ten: 'Ester', soCau: 10, soSai: 1 }],
      daGoiTheoCd: {},
      daGoiCau: [],
    },
  ]
  const r = phanCongDayHoc(cauHoc, hs)
  expect(r.phanCong[0].sbd).toBe('yeu') // Câu nhận biết Nấc 1 ghép cho em Yếu
  expect(r.phanCong[0].viSao).toContain('Nấc 1: Khởi động & Nền tảng')
  expect(r.phanCong[1].sbd).toBe('gioi') // Câu vận dụng Nấc 3 ghép cho em Giỏi
  expect(r.phanCong[1].viSao).toContain('Nấc 3: Mở rộng bứt phá')
})
