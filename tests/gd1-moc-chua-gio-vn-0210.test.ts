import { expect, it } from 'vitest'
import { phatLaiCau } from '../server/src/srs2-loi'

// Vòng học khép kín v2 · GĐ1 (02/10): mốc "Thầy đã chữa" bấm lúc 01:30 sáng 02/10 giờ VN (= 18:30 UTC ngày 01/10) phải hẹn ôn NGÀY
// HÔM SAU theo giờ VN (03/10). Bản cũ lấy ngày UTC của mốc (01/10) + 1 = 02/10 ⇒ câu đến hạn ngay trong ngày thầy vừa chữa.
it('mốc chữa lúc 0–7 giờ sáng VN ⇒ hẹn ôn đúng ngày hôm sau theo giờ VN', () => {
  const lan = [{ qid: 'Q1', ngay: '2026-09-30', luc: '2026-09-30T03:00:00.000Z', dung: false, nguon: 'game' }]
  const tt = phatLaiCau('Q1', lan as never, null, ['2026-10-01T18:30:00.000Z'])
  expect(tt.henOn).toBe('2026-10-03')
})
it('mốc chữa ban ngày giữ như cũ', () => {
  const lan = [{ qid: 'Q1', ngay: '2026-09-30', luc: '2026-09-30T03:00:00.000Z', dung: false, nguon: 'game' }]
  const tt = phatLaiCau('Q1', lan as never, null, ['2026-10-02T03:00:00.000Z'])
  expect(tt.henOn).toBe('2026-10-03')
})
