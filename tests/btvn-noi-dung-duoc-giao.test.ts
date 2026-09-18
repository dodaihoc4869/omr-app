import {expect,it} from 'vitest'
import {homeworkQuestions} from '../server/src/btvn-grading'
import type {Env} from '../server/src/kieu'
it('giữ thứ tự tờ/phần đã chọn, tải mỗi tờ một lần và không thêm câu ngoài phần',async()=>{
 const reads:string[]=[]
 const env={DE:{get:async(key:string)=>{reads.push(key);return {body:JSON.stringify({cau:[{phan:'I',so:1,dap_an:'A'},{phan:'II',so:1,dap_an:'DSDD'},{phan:'III',so:1,dap_an:'2'}]})}}}} as unknown as Env
 const questions=await homeworkQuestions(env,'B-DS,A-TN,B-TLN,B-DS')
 expect(questions.map(q=>q.qid)).toEqual(['B-II-1','A-I-1','B-III-1'])
 expect(reads).toEqual(['kho/B.json','kho/A.json'])
})
