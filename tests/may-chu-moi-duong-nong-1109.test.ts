// ĐỢT 3 — CHUYỂN ĐƯỜNG NÓNG SANG MÁY CHỦ MỚI.
//
// Phép kiểm ở đây nhắm đúng bốn chỗ mà hỏng là MẤT BÀI HỌC SINH, không phải
// chỉ chậm:
//   1. Máy em gửi `maCa`+`sbd` (chữ ký hàm cũ) mà Worker vẫn tìm đúng lượt.
//   2. Máy chủ mới im lặng ⇒ mọi lệnh PHẢI rơi về Apps Script, không nuốt.
//   3. Lượt không nằm ở máy chủ mới ⇒ cũng phải rơi về, không báo "đã lưu".
//   4. Nộp: máy chủ mới đã cất bài thì Apps Script hỏng KHÔNG được báo đỏ.
import { beforeEach, describe, expect, it } from 'vitest'
import { dieuKienLuot } from '../server/src/index'
import { chuanHoaMayChu } from '../src/lib/cau-hinh-may-chu'
import { caDaBiGatCauDao, luuTamMoi, nopMoi, phongChoMoi, quenCaVang, trangThaiMoi } from '../src/lib/may-chu-moi'

const BAT = chuanHoaMayChu({ BAT: true, URL: 'https://x.workers.dev', SO_LAN_THU: 1, HAN_GIAY: 1 })

// Cầu dao sống theo tiến trình (đúng như trong app: chỉ xoá khi thầy đổi cấu
// hình hoặc tải lại trang). Không reset ở đây thì phép kiểm trước rỉ sang phép
// kiểm sau — và chính chỗ rỉ đó đã làm một phép kiểm đỏ, nên giữ dòng này.
beforeEach(() => quenCaVang())
const TAT = chuanHoaMayChu({ BAT: false, URL: '' })

function gia(tra: unknown, status = 200) {
  return async () => new Response(JSON.stringify(tra), { status, headers: { 'content-type': 'application/json' } })
}

describe('dieuKienLuot — Worker nhận maCa+sbd thay cho khoá', () => {
  it('có khoá thì dùng khoá chính, một tham số', () => {
    const dk = dieuKienLuot({ khoaLuot: 'C1|E1|2' })
    expect(dk).toEqual({ sql: 'khoa = ?', tham: ['C1|E1|2'] })
  })

  it('chỉ có maCa+sbd thì lấy LẦN THỬ CAO NHẤT, không phải lượt bất kỳ', () => {
    const dk = dieuKienLuot({ maCa: 'C1', sbd: 'E1' })!
    // Em được thầy cho thi lại ⇒ có lượt 1 (đã nộp) và lượt 2 (đang làm). Thiếu
    // MAX(lan_thu) là câu lưu tạm đè vào lượt 1 — mất bài lần 2 của em.
    expect(dk.sql).toContain('MAX(lan_thu)')
    expect(dk.tham).toEqual(['C1', 'E1', 'C1', 'E1'])
  })

  it('thiếu cả hai thì trả null, KHÔNG dựng câu đụng mọi dòng', () => {
    expect(dieuKienLuot({})).toBeNull()
    expect(dieuKienLuot({ maCa: 'C1' })).toBeNull()
    expect(dieuKienLuot({ sbd: 'E1' })).toBeNull()
  })
})

describe('rơi về Apps Script', () => {
  it('cờ tắt ⇒ trangThaiMoi trả null ngay, không gọi mạng', async () => {
    let goi = 0
    globalThis.fetch = (async () => { goi++; return new Response('{}') }) as typeof fetch
    const r = await trangThaiMoi(TAT, {
      sbd: 'E1', maCa: 'C1', lop: '', dangLam: true, batDauLuc: '', daLamCauHoi: 0,
      tongCauHoi: 0, soLanRoiApp: 0, blocked: false,
    })
    expect(r).toBeNull()
    expect(goi).toBe(0)
  })

  it('mạng hỏng ⇒ luuTamMoi trả null (chỗ gọi đi Apps Script)', async () => {
    globalThis.fetch = (async () => { throw new Error('mạng') }) as typeof fetch
    expect(await luuTamMoi(BAT, 'C1', 'E1', { c1: 'A' })).toBeNull()
  })

  it('lượt không nằm ở máy chủ mới ⇒ null, KHÔNG phải false', async () => {
    // false nghĩa là "máy chủ mới đã trả lời, lưu không được" — chỗ gọi sẽ bỏ
    // qua nhịp. null nghĩa là "đi đường cũ đi". Nhầm hai cái này là em vào thi
    // bằng Apps Script rồi lưu tạm bốc hơi hết cả ca.
    globalThis.fetch = gia({ ok: false, lyDo: 'khong_dang_lam' }) as typeof fetch
    expect(await luuTamMoi(BAT, 'C1', 'E1', { c1: 'A' })).toBeNull()
  })

  it('máy chủ mới lưu được ⇒ true, không gọi Apps Script nữa', async () => {
    globalThis.fetch = gia({ ok: true }) as typeof fetch
    expect(await luuTamMoi(BAT, 'C1', 'E1', { c1: 'A' })).toBe(true)
  })
})

describe('nộp bài', () => {
  it('máy chủ mới nhận rồi ⇒ trả ok để chỗ gọi khỏi báo đỏ', async () => {
    globalThis.fetch = gia({ ok: true, nopLuc: '2026-09-11T02:00:00.000Z' }) as typeof fetch
    const r = await nopMoi(BAT, 'C1', 'E1', { c1: 'A' }, {})
    expect(r?.ok).toBe(true)
  })

  it('gửi lại lượt ĐÃ NỘP ⇒ vẫn ok kèm daNhan, không báo lỗi', async () => {
    // Em mất sóng lúc bấm Nộp rồi bấm lại. Báo đỏ ở đây là em tưởng mất bài.
    globalThis.fetch = gia({ ok: true, daNhan: true, nopLuc: '2026-09-11T02:00:00.000Z' }) as typeof fetch
    const r = await nopMoi(BAT, 'C1', 'E1', { c1: 'A' }, {})
    expect(r?.daNhan).toBe(true)
  })

  it('không tìm thấy lượt ⇒ null để rơi về Apps Script, KHÔNG nuốt bài', async () => {
    globalThis.fetch = gia({ ok: false, lyDo: 'khong_tim_thay' }) as typeof fetch
    expect(await nopMoi(BAT, 'C1', 'E1', { c1: 'A' }, {})).toBeNull()
  })
})

// ---------------------------------------------------------------------------
// CẦU DAO — phép kiểm cho chỗ suýt làm app CHẬM HƠN lúc chưa bật cờ.
//
// Hôm nay vào thi vẫn đi Apps Script, nên dòng `luot` nằm ở Sheet chứ không ở
// D1. Không có cầu dao thì mỗi nhịp lưu tạm và mỗi nhịp hỏi phòng chờ đều tốn
// một lượt gọi Worker chắc chắn trượt trước khi đi đường cũ.
describe('cầu dao ca chưa lên máy chủ mới', () => {
  it('trượt một lần rồi THÔI gọi cho cả ca', async () => {
    let goi = 0
    globalThis.fetch = (async () => {
      goi++
      return new Response(JSON.stringify({ ok: false, lyDo: 'khong_dang_lam' }), {
        headers: { 'content-type': 'application/json' },
      })
    }) as typeof fetch

    expect(await luuTamMoi(BAT, 'CA-CU', 'E1', { c1: 'A' })).toBeNull()
    expect(goi).toBe(1)
    // 134 nhịp còn lại của em: KHÔNG được gọi thêm lượt nào.
    for (let i = 0; i < 20; i++) expect(await luuTamMoi(BAT, 'CA-CU', 'E1', { c1: 'A' })).toBeNull()
    expect(goi).toBe(1)
    expect(caDaBiGatCauDao('CA-CU')).toBe(true)
  })

  it('cầu dao chỉ chặn ĐÚNG ca đó, ca khác vẫn gọi bình thường', async () => {
    let goi = 0
    globalThis.fetch = (async () => {
      goi++
      return new Response(JSON.stringify({ ok: false, lyDo: 'khong_dang_lam' }), {
        headers: { 'content-type': 'application/json' },
      })
    }) as typeof fetch
    await luuTamMoi(BAT, 'CA-CU', 'E1', {})
    await luuTamMoi(BAT, 'CA-MOI', 'E1', {})
    expect(goi).toBe(2)
    expect(caDaBiGatCauDao('CA-MOI')).toBe(true)
  })

  it('MẠNG HỎNG thì KHÔNG gạt cầu dao — đó là sự cố tạm, không phải ca vắng', async () => {
    // Gạt nhầm ở đây là mất máy chủ mới cho cả ca chỉ vì một nhịp rớt sóng.
    globalThis.fetch = (async () => {
      throw new Error('mạng')
    }) as typeof fetch
    expect(await luuTamMoi(BAT, 'CA-THAT', 'E1', {})).toBeNull()
    expect(caDaBiGatCauDao('CA-THAT')).toBe(false)
  })

  it('phòng chờ: ca không có trên máy chủ ⇒ gạt ngay, em hỏi lại 3 giây một lần', async () => {
    let goi = 0
    globalThis.fetch = (async () => {
      goi++
      return new Response(JSON.stringify({ ok: false, error: 'Không tìm thấy ca kiểm tra' }), {
        headers: { 'content-type': 'application/json' },
      })
    }) as typeof fetch
    expect(await phongChoMoi(BAT, 'CA-CU')).toBeNull()
    for (let i = 0; i < 10; i++) await phongChoMoi(BAT, 'CA-CU')
    expect(goi).toBe(1)
  })

  it('phòng chờ MẠNG HỎNG cũng KHÔNG gạt cầu dao', async () => {
    // Đường trượt riêng của `phongChoMoi` (không đi qua `goiWorker`), nên phải
    // có phép kiểm riêng — phá mã lần đầu không bắt được chỗ này.
    globalThis.fetch = (async () => {
      throw new Error('mạng')
    }) as typeof fetch
    expect(await phongChoMoi(BAT, 'CA-THAT-2')).toBeNull()
    expect(caDaBiGatCauDao('CA-THAT-2')).toBe(false)
  })

  it('lưu tạm gạt cầu dao thì phòng chờ cùng ca cũng im theo', async () => {
    let goi = 0
    globalThis.fetch = (async () => {
      goi++
      return new Response(JSON.stringify({ ok: false, lyDo: 'khong_dang_lam' }), {
        headers: { 'content-type': 'application/json' },
      })
    }) as typeof fetch
    await luuTamMoi(BAT, 'CA-CU', 'E1', {})
    await phongChoMoi(BAT, 'CA-CU')
    expect(goi).toBe(1)
  })
})
