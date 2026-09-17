import {it,expect} from 'vitest'
import {newsDay,analyzeParent,spreadTopics,applyPracticeOutcomes} from '../server/src/parent-news'
it('đổi ngày chính xác 00:01 giờ Việt Nam',()=>{expect(newsDay(Date.parse('2026-09-16T17:00:59Z'))).toBe('2026-09-16');expect(newsDay(Date.parse('2026-09-16T17:01:00Z'))).toBe('2026-09-17')})
const now=Date.parse('2026-09-16T12:00:00Z')
const details=Array.from({length:30},(_,i)=>({qid:`q${i}`,dung_sai:0,giay:120,chuyen_de:'Ester'}))
it('cá nhân hoá số câu theo tốc độ có thật, giới hạn tải học',()=>{const r=analyzeParent('x',[],details,0,now);expect(r.questionCount).toBe(10);expect(r.speedMeasured).toBe(true);expect(r.minutes).toBe(20);expect(r.weak[0].name).toBe('Ester')})
it('không giao chồng thêm khi con còn nhiều câu đang chờ',()=>{const r=analyzeParent('x',[],details,40,now);expect(r.assignmentCount).toBe(0);expect(r.questionCount).toBe(0)})
it('không bịa điểm hoặc tốc độ khi chưa có dữ liệu',()=>{const r=analyzeParent('x',[],[],0,now);expect(r.score).toBeNull();expect(r.speedMeasured).toBe(false);expect(r.questionCount).toBe(0)})
it('thi nhiều trong ngày giảm lượng ôn, cập nhật điểm hôm nay',()=>{const r=analyzeParent('x',[{nop_luc:'2026-09-16T10:00:00Z',tong:4},{nop_luc:'2026-09-16T08:00:00Z',tong:6}],details,0,now);expect(r.today).toHaveLength(2);expect(r.score).toBe(5);expect(r.questionCount).toBe(5)})

it('rải câu qua các nhóm yếu thay vì chỉ lấy một nhóm',()=>{expect(spreadTopics([{qid:'a',chuyenDe:'A'},{qid:'b',chuyenDe:'A'},{qid:'c',chuyenDe:'B'}],['A','B']).map(q=>q.qid)).toEqual(['a','c','b'])})
it('chỉ kết quả luyện chấm sau bài thi mới thay đổi lỗi cần ôn',()=>{const d=[{sbd:'1',qid:'q',dung_sai:0,nop_luc:'2026-09-16T10:00:00Z'}];const p={sbd:'1',submitted_at:'2026-09-16T11:00:00Z',result:JSON.stringify({questionOutcomes:[{qid:'q',correct:true}]})};expect(applyPracticeOutcomes(d,[p])[0].dung_sai).toBe(1);expect(applyPracticeOutcomes(d,[{...p,sbd:'2'}])[0].dung_sai).toBe(0);expect(applyPracticeOutcomes(d,[{...p,submitted_at:'2026-09-16T09:00:00Z'}])[0].dung_sai).toBe(0)})

it('phân tách chi tiết số câu chưa nộp cho BTVN, Mom giao và Đề xuất',()=>{
  const r=analyzeParent('x',[],details,15,now,{btvn:5,mom:4,daily:6})
  expect(r.pending).toBe(15)
  expect(r.pendingDetails).toEqual({btvn:5,mom:4,daily:6})
})
