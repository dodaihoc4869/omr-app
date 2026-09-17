import {it,expect} from 'vitest'
import {newsDay,analyzeParent,spreadTopics,applyPracticeOutcomes,tinhDuDoanDiem} from '../server/src/parent-news'

it('đổi ngày chính xác 00:01 giờ Việt Nam',()=>{
  expect(newsDay(Date.parse('2026-09-16T17:00:59Z'))).toBe('2026-09-16')
  expect(newsDay(Date.parse('2026-09-16T17:01:00Z'))).toBe('2026-09-17')
})

const now = Date.parse('2026-09-16T12:00:00Z')
const details = Array.from({length:30},(_,i)=>({qid:`q${i}`,dung_sai:0,giay:120,chuyen_de:'Ester'}))

it('cá nhân hoá số câu theo phương pháp nâng đỡ: luôn đề xuất ít nhất 12 câu',()=>{
  const r = analyzeParent('x',[],details,0,now)
  expect(r.questionCount).toBeGreaterThanOrEqual(12)
  expect(r.assignmentCount).toBe(1)
  expect(r.speedMeasured).toBe(true)
  expect(r.weak[0].name).toBe('Ester')
  expect(r.keHoach?.soCauSuaLoi).toBeGreaterThan(0)
})

it('không giao chồng thêm khi con còn quá nhiều câu đang chờ dồn ứ',()=>{
  const r = analyzeParent('x',[],details,40,now)
  expect(r.assignmentCount).toBe(0)
  expect(r.questionCount).toBe(0)
})

it('dù chưa có câu sai, vẫn đề xuất ít nhất 12 câu để chống quên và tiến bộ',()=>{
  const r = analyzeParent('x',[],[],0,now)
  expect(r.score).toBeNull()
  expect(r.speedMeasured).toBe(false)
  expect(r.questionCount).toBe(12)
  expect(r.assignmentCount).toBe(1)
  expect(r.keHoach?.tongCau).toBe(12)
})

it('cập nhật điểm hôm nay và dự đoán điểm thi thật theo tháng chuẩn xác',()=>{
  const exams = [{nop_luc:'2026-09-16T10:00:00Z',tong:8.5},{nop_luc:'2026-09-16T08:00:00Z',tong:7.5}]
  const r = analyzeParent('x',exams,details,0,now)
  expect(r.today).toHaveLength(2)
  expect(r.score).toBe(8)
  expect(r.duDoanDiem).toBeDefined()
  expect(r.duDoanDiem?.diem).toBeGreaterThan(0)
  expect(r.duDoanDiem?.thang).toContain('Tháng 9/2026')
})

it('dự đoán điểm thi thật làm tròn bước 0.25 theo chuẩn Bộ GD&ĐT',()=>{
  const p = tinhDuDoanDiem([{tong: 7.7}], [{dung_sai: 1},{dung_sai: 1},{dung_sai: 0}], now)
  expect(p.diem % 0.25).toBe(0)
  expect(p.khoangDiem).toContain('–')
  expect(p.nhanXet.length).toBeGreaterThan(10)
})

it('rải câu qua các nhóm yếu thay vì chỉ lấy một nhóm',()=>{
  expect(spreadTopics([{qid:'a',chuyenDe:'A'},{qid:'b',chuyenDe:'A'},{qid:'c',chuyenDe:'B'}],['A','B']).map(q=>q.qid)).toEqual(['a','c','b'])
})

it('chỉ kết quả luyện chấm sau bài thi mới thay đổi lỗi cần ôn',()=>{
  const d = [{sbd:'1',qid:'q',dung_sai:0,nop_luc:'2026-09-16T10:00:00Z'}]
  const p = {sbd:'1',submitted_at:'2026-09-16T11:00:00Z',result:JSON.stringify({questionOutcomes:[{qid:'q',correct:true}]})}
  expect(applyPracticeOutcomes(d,[p])[0].dung_sai).toBe(1)
  expect(applyPracticeOutcomes(d,[{...p,sbd:'2'}])[0].dung_sai).toBe(0)
  expect(applyPracticeOutcomes(d,[{...p,submitted_at:'2026-09-16T09:00:00Z'}])[0].dung_sai).toBe(0)
})

it('phân tách chi tiết số câu chưa nộp cho BTVN, Mom giao và Đề xuất',()=>{
  const r = analyzeParent('x',[],details,15,now,{btvn:5,mom:4,daily:6})
  expect(r.pending).toBe(15)
  expect(r.pendingDetails).toEqual({btvn:5,mom:4,daily:6})
})
