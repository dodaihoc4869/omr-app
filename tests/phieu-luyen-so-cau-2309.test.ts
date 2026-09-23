// @vitest-environment node
import { describe, expect, it } from 'vitest'
import type { TeacherExamSource } from '../src/data/examContent'
import { phanTichBoLocCau, phanTichTyLeDang, rutLuyenTheoBoLoc, rutLuyenThemDangCauSai, type CauSaiDauVao } from '../src/lib/thuat-toan-rut-cau-sai'

const choices=['A. a','B. b','C. c','D. d']
const info={hoTen:'Fixture',sbd:'S1'}
const filter={sao:'tat_ca',dang:'tat_ca'} as const
const wrong=(i:number):CauSaiDauVao=>({qid:`OLD${i}`,soCau:i,phan:'I',dangMa:`D${i}`,dang:`Tên ${i}`,dapAnDung:'A',text:`Câu sai ${i}`,choices,kienThuc:['K']})
const source=(rows:{id:string;code:string;text?:string;knowledge?:string[]}[]):TeacherExamSource=>({maDe:'DE',nhom:'12 · Bài tập',phanI:rows.map(q=>({id:q.id,text:q.text??`Câu ${q.id}`,choices,correct:'A',mucDo:'biet',sao:0,dang:{ma:q.code,ten:'Tên 1'},kienThuc:q.knowledge??['K'],chuyenDe:'Ester'})),phanII:[],phanIII:[]}) as TeacherExamSource

describe('Phiếu luyện giữ đúng phạm vi và số câu chọn',()=>{
  it.each(['dang','loc'] as const)('%s: chọn 1 không tự chèn câu sai; 0 trả rỗng; kho thiếu không bịa',mode=>{
    const old=[wrong(1),wrong(2),wrong(3)],bank=[source([1,2,3].map(i=>({id:`NEW${i}`,code:`D${i}`})))]
    const run=(n:number)=>mode==='dang'?rutLuyenThemDangCauSai(old,bank,n,info):rutLuyenTheoBoLoc(old,bank,filter,n,info)
    expect(run(1).dsCau).toHaveLength(1)
    expect(run(0).dsCau).toHaveLength(0)
    expect(run(10).dsCau.map(q=>q.id).sort()).toEqual(['NEW1','NEW2','NEW3'])
  })
  it('cả hai chế độ chặn tên trùng mã khác và kiến thức nền chưa học',()=>{
    const bank=[source([{id:'good',code:'D1'},{id:'bad-code',code:'D2'},{id:'bad-knowledge',code:'D1',knowledge:['K','X']}])]
    for(const r of [phanTichTyLeDang([wrong(1)],bank),phanTichBoLocCau([wrong(1)],bank,filter)]){
      expect(r.thongKe[0]!.ungVien.map(q=>q.id)).toEqual(['good'])
      expect(r.tongToiDa).toBe(1)
    }
  })
  it('khử bản sao nội dung và bù các suất chồng nhau bằng câu hợp lệ còn lại',()=>{
    const old=[wrong(1),{...wrong(1),qid:'OLD2',soCau:2},wrong(3)]
    const bank=[source([{id:'A',code:'D1',text:'Cùng câu'},{id:'COPY',code:'D1',text:'Cùng câu'},{id:'B',code:'D3'},{id:'C',code:'D3'}])]
    const r=rutLuyenThemDangCauSai(old,bank,3,info)
    expect(r.dsCau).toHaveLength(3)
    expect(new Set(r.dsCau.map(q=>q.text)).size).toBe(3)
  })
})
