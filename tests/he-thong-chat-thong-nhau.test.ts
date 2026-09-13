import { describe, expect, it, beforeEach } from 'vitest'
import {
  guiTinNhan,
  layHoiThoai,
  danhDauDocHoiThoai,
  demSoTinChuaDoc,
} from '../src/lib/tro-ly/he-thong-chat'
import { giaiBaiTapAI } from '../src/lib/tro-ly/ai-giai-bai'

beforeEach(() => {
  localStorage.clear()
})

describe('Hệ thống 3 bong bóng chat thông nhau & Trợ lý Gemini AI', () => {
  it('Phụ huynh gửi cho Thầy và Thầy trả lời', () => {
    const ph = { vai: 'ph' as const, sbd: '12001', hoTen: 'Phụ huynh em Nam' }
    const thay = { vai: 'gv' as const, hoTen: 'Thầy Đỗ Đại Học' }

    // Phụ huynh nhắn
    guiTinNhan({
      nguoiGui: ph,
      nguoiNhan: thay,
      noiDung: 'Thầy cho em hỏi tình hình làm bài hôm nay của cháu thế nào ạ?',
    })

    // Thầy kiểm tra hộp thoại
    let hoiThoai = layHoiThoai(thay, ph)
    expect(hoiThoai.length).toBe(1)
    expect(hoiThoai[0].noiDung).toContain('tình hình làm bài')

    // Thầy trả lời
    guiTinNhan({
      nguoiGui: thay,
      nguoiNhan: ph,
      noiDung: 'Chào anh chị, hôm nay em làm bài rất tốt, đạt 9.5 điểm nhé!',
    })

    // Cả hai bên đều thấy đầy đủ 2 tin
    hoiThoai = layHoiThoai(ph, thay)
    expect(hoiThoai.length).toBe(2)
    expect(hoiThoai[1].noiDung).toContain('đạt 9.5 điểm')
  })

  it('Phụ huynh nhắn cho Con (SBD 12001) và Con trả lời', () => {
    const ph = { vai: 'ph' as const, sbd: '12001', hoTen: 'Mẹ của Nam' }
    const con = { vai: 'hs' as const, sbd: '12001', hoTen: 'Nguyễn Văn Nam' }

    guiTinNhan({
      nguoiGui: ph,
      nguoiNhan: con,
      noiDung: 'Con cố gắng hoàn thành bài tập Mom giao trong 2 tiếng nhé!',
    })

    let hoiThoaiCon = layHoiThoai(con, ph)
    expect(hoiThoaiCon.length).toBe(1)
    expect(hoiThoaiCon[0].noiDung).toContain('Mom giao')

    guiTinNhan({
      nguoiGui: con,
      nguoiNhan: ph,
      noiDung: 'Dạ vâng con đang làm rồi mẹ yên tâm nhé!',
    })

    const hoiThoaiPH = layHoiThoai(ph, con)
    expect(hoiThoaiPH.length).toBe(2)
    expect(hoiThoaiPH[1].noiDung).toContain('con đang làm rồi')
  })

  it('Học sinh nhắn tin cho bạn bè qua Số Báo Danh (SBD)', () => {
    const hsA = { vai: 'hs' as const, sbd: '12001', hoTen: 'Học sinh A' }
    const hsB = { vai: 'hs' as const, sbd: '12002', hoTen: 'Học sinh B' }

    // A nhập đúng SBD của B để nhắn
    guiTinNhan({
      nguoiGui: hsA,
      nguoiNhan: hsB,
      noiDung: 'Cậu làm xong câu Este số 5 chưa, chỉ tớ với?',
    })

    // B mở chat xem với SBD của A
    const hoiThoaiB = layHoiThoai(hsB, hsA)
    expect(hoiThoaiB.length).toBe(1)
    expect(hoiThoaiB[0].noiDung).toContain('câu Este số 5')

    // B trả lời A
    guiTinNhan({
      nguoiGui: hsB,
      nguoiNhan: hsA,
      noiDung: 'Câu đó dùng bảo toàn khối lượng là ra 8.2g nhé!',
    })

    const hoiThoaiA = layHoiThoai(hsA, hsB)
    expect(hoiThoaiA.length).toBe(2)
  })

  it('Trợ lý Gemini AI giải bài bằng ngôn ngữ tự nhiên và format chuẩn HTML', async () => {
    const kq = await giaiBaiTapAI({
      noiDung: 'Cho 8.8 gam ethyl acetate tác dụng vừa đủ với NaOH. Tính khối lượng muối thu được?',
      hoTen: 'Minh Anh',
    })

    expect(kq.loiNhanTuNhien).toBeTruthy()
    expect(kq.loiNhanTuNhien).toContain('Minh Anh')
    expect(kq.phuongPhap).toContain('bảo toàn')
    expect(kq.loiGiaiChiTiet).toContain('CH₃COOC₂H₅')
    expect(kq.dapAn).toContain('8.2')
    expect(kq.htmlToanBo).toContain('loi-giai-ai')
    expect(kq.htmlToanBo).toContain('Phương pháp giải')
    expect(kq.htmlToanBo).toContain('Đáp án')
  })

  it('Đánh dấu đã đọc và đếm số tin chưa đọc', () => {
    const hs = { vai: 'hs' as const, sbd: '12001' }
    const ph = { vai: 'ph' as const, sbd: '12001' }

    guiTinNhan({ nguoiGui: ph, nguoiNhan: hs, noiDung: 'Tin 1' })
    guiTinNhan({ nguoiGui: ph, nguoiNhan: hs, noiDung: 'Tin 2' })

    expect(demSoTinChuaDoc(hs)).toBe(2)

    danhDauDocHoiThoai(hs, ph)
    expect(demSoTinChuaDoc(hs)).toBe(0)
  })
})
