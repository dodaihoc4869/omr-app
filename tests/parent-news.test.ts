import {it,expect} from 'vitest'
import {newsDay,analyzeParent,spreadTopics,applyPracticeOutcomes,tinhDuDoanDiem} from '../server/src/parent-news'
import type {KeHoachChoPhuHuynh} from '../server/src/parent-news-chon-cau'

it('đổi ngày chính xác 00:01 giờ Việt Nam',()=>{
  expect(newsDay(Date.parse('2026-09-16T17:00:59Z'))).toBe('2026-09-16')
  expect(newsDay(Date.parse('2026-09-16T17:01:00Z'))).toBe('2026-09-17')
})

const now = Date.parse('2026-09-16T12:00:00Z')
const details = Array.from({length:30},(_,i)=>({qid:`q${i}`,dung_sai:0,giay:120,chuyen_de:'Ester'}))

// Kế hoạch ngày của con (GĐ 5, Kênh 5): số câu phụ huynh giao = mục tiêu − việc bắt buộc còn lại − số câu đã làm.
const kh = (o: Partial<KeHoachChoPhuHuynh> = {}): KeHoachChoPhuHuynh => ({
  mucTieuCau: 10, taiCung: 0, daLamCau: 0, toiHanSai: 0, toiHanDuyTri: 0, chuaKhacPhuc: 0, vanTocGiay: 90, ...o,
})

it('số câu đề xuất là phần dư của ngân sách ngày, chia theo nguồn đúng thứ tự chọn câu',()=>{
  const r = analyzeParent('x',[],details,0,now,undefined,kh({mucTieuCau:10,taiCung:2,daLamCau:1,toiHanSai:3,toiHanDuyTri:1,chuaKhacPhuc:5}))
  expect(r.questionCount).toBe(7)
  expect(r.assignmentCount).toBe(1)
  expect(r.speedMeasured).toBe(true)
  expect(r.weak[0].name).toBe('Ester')
  expect(r.keHoach).toMatchObject({tongCau:7,soCauSuaLoi:3,soCauOnBaiCu:1,soCauTienBo:3})
  expect(r.wrong).toBe(5)
  // Lý do nói bằng số, không dùng gạch ngang dài.
  for (const n of ['10 câu','2 câu','1 câu','7 câu']) expect(r.reason).toContain(n)
  expect(r.reason).not.toContain('—')
})

it('con đã đủ việc Thầy giao thì không giao thêm, và lý do nói bằng số',()=>{
  const r = analyzeParent('x',[],details,40,now,undefined,kh({mucTieuCau:10,taiCung:12}))
  expect(r.assignmentCount).toBe(0)
  expect(r.questionCount).toBe(0)
  expect(r.keHoach?.tongCau).toBe(0)
  expect(r.reason).toContain('Mục tiêu hôm nay 10 câu')
  expect(r.reason).toContain('12 câu')
  expect(r.reason).toContain('Chưa cần giao thêm')
})

it('con đã làm đủ mục tiêu trong ngày thì cũng không giao thêm',()=>{
  const r = analyzeParent('x',[],details,0,now,undefined,kh({mucTieuCau:8,taiCung:0,daLamCau:9}))
  expect(r.questionCount).toBe(0)
  expect(r.assignmentCount).toBe(0)
})

it('chưa có câu sai, chưa có câu đến hạn: vẫn giao đúng phần dư, toàn câu mới cùng dạng yếu hoặc bù',()=>{
  const r = analyzeParent('x',[],[],0,now,undefined,kh({mucTieuCau:12}))
  expect(r.score).toBeNull()
  expect(r.speedMeasured).toBe(false)
  expect(r.questionCount).toBe(12)
  expect(r.assignmentCount).toBe(1)
  expect(r.keHoach).toMatchObject({tongCau:12,soCauSuaLoi:0,soCauOnBaiCu:0,soCauTienBo:12})
})

it('thiếu kế hoạch ngày thì không đoán số câu: không giao và nói rõ lý do',()=>{
  const r = analyzeParent('x',[],details,0,now)
  expect(r.questionCount).toBe(0)
  expect(r.assignmentCount).toBe(0)
  expect(r.reason).toContain('Chưa lập được kế hoạch ngày')
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

it('học sinh chăm chỉ cũng không vượt trần 16 câu của ngân sách ngày (thay cho mức 18/24/36 câu cũ)',()=>{
  const exam4 = [
    {nop_luc:'2026-09-16T11:00:00Z',tong:9.0},
    {nop_luc:'2026-09-16T10:00:00Z',tong:8.5},
    {nop_luc:'2026-09-16T09:00:00Z',tong:8.0},
    {nop_luc:'2026-09-16T08:00:00Z',tong:7.5}
  ]
  for (const ca of [[], exam4.slice(0,1), exam4.slice(0,2), exam4]) {
    const r = analyzeParent('x',ca,details,0,now,undefined,kh({mucTieuCau:16}))
    expect(r.questionCount).toBe(16)
    expect(r.reason).not.toContain('36 câu')
  }
})

