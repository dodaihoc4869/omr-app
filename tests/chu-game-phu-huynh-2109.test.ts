// @vitest-environment node
// APP PHỤ HUYNH KHÔNG CÒN GÌ CỦA GAME (thầy lệnh 21/09, prompt-ph-giao-them-bai-2109.md mục B — phần MÁY CHỦ): mọi chữ dành cho phụ huynh do máy chủ sinh KHÔNG nhắc thần thú, EXP, khiên, mảnh khiên,
// game, Đoàn Hộ Tống, Đảo thần thú, Võ đài. Quét: mẫu nhắc nộp cho phụ huynh, cảnh báo của thầy (lời mặc định), bài tin hằng ngày, và lời Bộ não A.I cho phụ huynh (lớp phòng thủ ở bo-nao-doc).
import { describe, expect, it } from 'vitest'
import { chuGameTrong, coChuGame } from '../server/src/chu-game'
import { loiPhGop, loiPhMotBai, type DauVaoLoi } from '../server/src/nhac-tu-dong'
import { loiChoPhuHuynh } from '../server/src/canh-bao-thay'
import { analyzeParent } from '../server/src/parent-news'
import { taoD1That, type D1That } from './_d1-that'

describe('chuGameTrong: bắt đúng chữ game, không bắt chữ học tập', () => {
  it('bắt: thần thú, EXP, khiên, mảnh khiên, game, trò chơi, Đoàn Hộ Tống, Đảo thần thú, Võ đài (mọi kiểu hoa/thường)', () => {
    for (const c of ['Con nuôi thần thú', 'THẦN THÚ', 'em được +20 EXP', 'mất 1 khiên', 'đủ mảnh khiên', 'chơi game', 'Game', 'trò chơi', 'Đoàn Hộ Tống', 'đoàn hộ tống', 'Đảo thần thú', 'Võ đài', 'võ  đài']) {
      expect(coChuGame(c), c).toBe(true)
    }
  })
  it('KHÔNG bắt chữ học tập giữ lại: điểm, số câu, lên bậc, dạng con vấp, lịch ôn, bài tập về nhà, hạn nộp, vinh danh; "exp" trong từ khác', () => {
    for (const c of ['Con đúng 7 trong 8 câu.', 'Dạng Thuỷ phân ester con đang vấp, mai ôn lại 3 câu.', 'Bài tập về nhà hạn nộp 12:00 trưa mai', 'Vinh danh hôm nay', 'Lên bậc Hiểu', 'expert', 'gamer', 'experience']) {
      // "gamer"/"expert": \bgame\b và \bEXP\b (hoa) không khớp
      expect(chuGameTrong(c), c).toEqual([])
    }
  })
})

describe('mẫu chữ do máy chủ sinh cho phụ huynh không có chữ game', () => {
  const BAY_GIO = Date.parse('2026-09-21T05:00:00.000Z')
  const HAN = '2026-09-22T05:00:00.000Z'
  const dv = (o: Partial<DauVaoLoi> = {}): DauVaoLoi => ({ tenBai: 'Este', hanIso: HAN, nowMs: BAY_GIO, hoTen: 'Nguyễn Thu Hà', ...o })
  it('nhắc nộp bài cho phụ huynh (M2 / M4, một bài, gộp nhiều bài; có tên / không tên; có chặng / không)', () => {
    const mau: DauVaoLoi[] = [dv(), dv({ hoTen: '' }), dv({ tongChang: 5, daXongChang: 2 }), dv({ soNgayQuaHan: 2, daLam: 4, tongCau: 12 }), dv({ tenBai: '' })]
    for (const x of mau) for (const m of ['M2', 'M4'] as const) expect(chuGameTrong(loiPhMotBai(m, x)), `${m} ${JSON.stringify(x)}`).toEqual([])
    expect(chuGameTrong(loiPhGop('Nguyễn Thu Hà', [{ m: 'M2', x: dv() }, { m: 'M4', x: dv({ tenBai: 'Amin', daLam: 3, tongCau: 9 }) }]))).toEqual([])
  })
  it('cảnh báo của thầy: lời mặc định cho phụ huynh ở mọi trạng thái', () => {
    for (const st of [
      { trangThai: 'qua_han', nhan: '', soNgayQuaHan: 2 }, { trangThai: 'chua_mo', nhan: '', soNgayQuaHan: 0 },
      { trangThai: 'do_chang', nhan: '', chang: { daXong: 1, tong: 4, hienTai: 2 }, soNgayQuaHan: 0 }, { trangThai: 'do_chang', nhan: '', soNgayQuaHan: 0 },
    ]) for (const ten of ['Nguyễn Thu Hà', '']) expect(chuGameTrong(loiChoPhuHuynh(st as never, ten, HAN, BAY_GIO)), JSON.stringify(st)).toEqual([])
  })
  it('bài tin hằng ngày cho phụ huynh (analyzeParent): mọi chữ hiển thị sạch, kể cả khi có ca thi, câu sai, kế hoạch, chuyên đề yếu', () => {
    const exams = [{ sbd: 'S', ma_ca: 'C1', nop_luc: '2026-09-21T02:00:00.000Z', tong: 7.5, ten_ca: 'Ca giữa kỳ' }]
    const details = [{ sbd: 'S', qid: 'q1', chuyen_de: 'Este', dung_sai: 0, giay: 60, muc_do: 'hieu', nop_luc: '2026-09-21T02:00:00.000Z' }, { sbd: 'S', qid: 'q2', chuyen_de: 'Amin', dung_sai: 1, giay: 50, muc_do: 'biet', nop_luc: '2026-09-21T02:00:00.000Z' }]
    const kh = { mucTieuCau: 12, taiCung: 4, daLamCau: 5, toiHanSai: 3, toiHanDuyTri: 2, chuaKhacPhuc: 6 } as never
    for (const x of [analyzeParent('S', exams as never, details as never, 2, BAY_GIO, { btvn: 1, mom: 0, daily: 1 }, kh), analyzeParent('S', [], [], 0, BAY_GIO), analyzeParent('S', exams as never, details as never, 0, BAY_GIO, undefined, { ...(kh as object), toiHanSai: 0, toiHanDuyTri: 0 } as never)]) {
      const chu = JSON.stringify([x.mode, x.reason, x.keHoach, x.weak, x.duDoanDiem, x.today])
      expect(chuGameTrong(chu), chu).toEqual([])
    }
  })
})
