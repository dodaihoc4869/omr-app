import {it,expect} from 'vitest'
import {gradeHomework,homeworkQuestions,homeworkKeys} from '../server/src/btvn-grading'
import {parseKhoDeJson,buildTeacherSourceFromKhoDe} from '../src/lib/exam-kho-de-import'
it('khôi phục mã đề ghép, đúng sai và dấu phẩy số thập phân',()=>{
 const keys=new Map([['D-II-1','DSDD'],['D-III-1','0.39']])
 const r=gradeHomework(keys,{'D-DS,D-TLN-II-1':'DSDD','D-DS,D-TLN-III-1':'0,39'},'D-DS,D-TLN')
 expect(r.soDung).toBe(2);expect(r.answers).toEqual({'D-II-1':'DSDD','D-III-1':'0,39'})
})
it('không đoán nếu hai tờ có cùng phần và số câu; không chấm khi mất đáp án',()=>{
 expect(()=>gradeHomework(new Map([['A-I-1','A'],['B-I-1','B']]),{'A,B-I-1':'A'},'A,B')).toThrow('trùng mã')
 expect(()=>gradeHomework(new Map(),{},'A')).toThrow('Chưa tải')
})
it('mã chính xác luôn ưu tiên, bỏ trống không được điểm',()=>{
 const r=gradeHomework(new Map([['D-I-1','A'],['D-I-2','B']]),{'D-I-1':'B','D-TN-I-1':'A'},'D-TN')
 expect(r.soDung).toBe(0);expect(r.qidSai).toHaveLength(2)
})
it('gói nhiều đề giữ mã nguồn qua bộ nạp dùng chung, không đè câu số 1',async()=>{
 const env={DE:{get:async(key:string)=>({body:JSON.stringify({cau:[{phan:'I',so:1,de:key,pa:{A:'a',B:'b',C:'c',D:'d'},dap_an:'A'}]})})}}
 const cau=await homeworkQuestions(env as never,'A-TN,B-TN')
 expect(homeworkKeys(cau).size).toBe(2)
 const p=parseKhoDeJson({ma_de:'A-TN,B-TN',cau});expect(p.ok).toBe(true)
 const source=buildTeacherSourceFromKhoDe(p.json!).source
 expect(source.phanI.map(q=>q.id)).toEqual(['A-I-1','B-I-1'])
})
it('chuẩn hoá Phần II và Phần III: đơn vị, dấu phẩy, chữ Đ, số 0 đuôi',()=>{
 const keys=new Map([
  ['DE-II-1','DSDD'],
  ['DE-III-1','12'],
  ['DE-III-2','0.5'],
  ['DE-III-3','+5'],
 ])
 const raw={
  'DE-II-1': 'Đ, S, Đ, Đ',
  'DE-III-1': '12 gam',
  'DE-III-2': '0,50 mol',
  'DE-III-3': '5',
 }
 const r=gradeHomework(keys,raw,'DE')
 expect(r.soDung).toBe(4)
 expect(r.qidSai).toHaveLength(0)
})
