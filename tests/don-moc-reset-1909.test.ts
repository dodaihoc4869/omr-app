// MỐC ĐẶT LẠI MÙA 00:01 thứ Hai 21/09 (thầy chốt): máy chủ xoá toàn bộ dữ liệu học sinh ⇒ máy học sinh/phụ huynh dọn bộ nhớ trong máy
// theo bảng DỌN/GIỮ 0.Planer duyệt. Ba điều không được hỏng: (1) mốc vắng ⇒ KHÔNG dọn (kẻo xoá nháp tối Chủ nhật), (2) GIỮ đăng nhập +
// id thiết bị + cài đặt, (3) không bao giờ làm hỏng màn khi storage lỗi.
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import {
  KHOA_LOCAL_DON,
  KHOA_LOCAL_GIU,
  KHOA_MOC_RESET,
  KHOA_SESSION_GIU,
  TIEN_TO_LOCAL_DON,
  TIEN_TO_SESSION_DON,
  donKhiDoiMocReset,
  quenMocDaDonTrongPhien,
} from '../src/components/bang-nhiem-vu/don-moc-reset'
import { taiCaDangMo, taiKeHoachNgay } from '../src/components/bang-nhiem-vu/may-chu'

vi.mock('../src/lib/dia-chi-may-chu', () => ({ layDiaChiMayChu: async () => 'https://may.test' }))

/** Khoá THẬT của hai cổng (grep src, 19/09) — mỗi khoá một giá trị riêng để so trước/sau. */
const DON_LOCAL = [
  'omr_bnv_ke_hoach:12121212',
  'omr_bnv_ke_hoach:12000001',
  'omr_cauon:12121212:on_lai:2026-09-20',
  'omr_mom_draft_12121212_M1',
  'omr_mom_draft_M1_12121212',
  'omr_mom_btvn_12121212',
  'omr_mom_sent_12121212_M1',
  'ddh.lam.abcd1234',
  'ddh.lam.abcd1234.k7f9z2',
  'ddh.lam.abcd1234.k7f9z2.cho',
  'ddh.btvn.draft.BT1.12121212',
  'ddh.khacphuc.history.12121212',
  'ddh.luyen2026.12121212.P1',
  'ddh.xemlai.abcd1234.12121212',
  'omr_than_thu_hoa_hoc_data',
  'omr_than_thu_da_nhan_exp',
  'omr_than_thu_qid_thanh_tay',
  'omr_he_thong_chat_v2',
]
const GIU_LOCAL = [
  'omr_student_portal_auth',
  'omr_ph_sbd',
  'ddh_id_thiet_bi',
  'ddh.vai',
  'ddh.boQuaCaiApp',
  'ddh.phienBanDuLieu',
  'ddh.phieu.mau',
  'omr.settings.v1',
  'omr_msgfab_pos_v1',
  'rongBenTrai',
  'game-v2-low',
  'game-battle-quiet',
  'game-battle-muted',
  'omr_than_thu_khong_3d',
  'omr_gemini_key',
  'mc-projector-palette',
  'mc-projector-scale',
  'khoa-la-cua-app-khac',
]
const DON_SESSION = ['game-v2:12121212', 'game-room:abc', 'escort:xyz']
const GIU_SESSION = ['omr_presence_session', 'khoa-session-la']

function nap() {
  for (const k of DON_LOCAL) localStorage.setItem(k, `du-lieu:${k}`)
  for (const k of GIU_LOCAL) localStorage.setItem(k, `giu:${k}`)
  for (const k of DON_SESSION) sessionStorage.setItem(k, `du-lieu:${k}`)
  for (const k of GIU_SESSION) sessionStorage.setItem(k, `giu:${k}`)
}
const chup = (kho: Storage) => Object.fromEntries(Array.from({ length: kho.length }, (_, i) => kho.key(i)!).sort().map((k) => [k, kho.getItem(k)]))

beforeEach(() => {
  localStorage.clear()
  sessionStorage.clear()
  quenMocDaDonTrongPhien()
})
afterEach(() => {
  vi.restoreAllMocks()
  vi.unstubAllGlobals()
})

describe('mốc VẮNG hoặc SAI ⇒ không dọn gì (kẻo xoá nháp học sinh tối Chủ nhật khi job reset chưa chạy)', () => {
  it.each([undefined, null, '', '   ', 0, 20260921, {}, [], true, '21/09/2026', '2026-9-21', '2026-09-21T00:01:00Z', 'hôm nay'])('mốc %j', (moc) => {
    nap()
    const truoc = { l: chup(localStorage), s: chup(sessionStorage) }
    expect(donKhiDoiMocReset(moc)).toEqual({ don: false, soKhoa: 0 })
    expect({ l: chup(localStorage), s: chup(sessionStorage) }).toEqual(truoc)
    expect(localStorage.getItem(KHOA_MOC_RESET)).toBeNull()
  })
})

describe('mốc MỚI ⇒ dọn đúng danh sách DỌN, GIỮ nguyên từng khoá trong danh sách GIỮ', () => {
  it('máy chưa từng thấy mốc: dọn mọi khoá DỌN (localStorage + sessionStorage), lưu mốc, GIỮ y nguyên từng khoá GIỮ', () => {
    nap()
    const giuLocal = Object.fromEntries(GIU_LOCAL.map((k) => [k, localStorage.getItem(k)]))
    const giuSession = Object.fromEntries(GIU_SESSION.map((k) => [k, sessionStorage.getItem(k)]))
    const kq = donKhiDoiMocReset('2026-09-21')
    expect(kq).toEqual({ don: true, soKhoa: DON_LOCAL.length + DON_SESSION.length })
    for (const k of DON_LOCAL) expect(localStorage.getItem(k), k).toBeNull()
    for (const k of DON_SESSION) expect(sessionStorage.getItem(k), k).toBeNull()
    for (const k of GIU_LOCAL) expect(localStorage.getItem(k), k).toBe(giuLocal[k])
    for (const k of GIU_SESSION) expect(sessionStorage.getItem(k), k).toBe(giuSession[k])
    expect(localStorage.getItem(KHOA_MOC_RESET)).toBe('2026-09-21')
    // hai khoá QUAN TRỌNG NHẤT nêu đích danh
    expect(localStorage.getItem('ddh_id_thiet_bi')).toBe('giu:ddh_id_thiet_bi')
    expect(localStorage.getItem('omr_student_portal_auth')).toBe('giu:omr_student_portal_auth')
  })

  it('CHẠY LẦN HAI cùng mốc ⇒ không làm gì (nháp mới viết sau khi dọn còn nguyên)', () => {
    nap()
    expect(donKhiDoiMocReset('2026-09-21').don).toBe(true)
    localStorage.setItem('omr_cauon:12121212:on_lai:2026-09-21', 'nháp mới')
    localStorage.setItem('omr_bnv_ke_hoach:12121212', 'bản nhớ mới')
    expect(donKhiDoiMocReset('2026-09-21')).toEqual({ don: false, soKhoa: 0 })
    quenMocDaDonTrongPhien() // sang phiên trang mới: chỉ còn mốc lưu trong máy
    expect(donKhiDoiMocReset('2026-09-21')).toEqual({ don: false, soKhoa: 0 })
    expect(localStorage.getItem('omr_cauon:12121212:on_lai:2026-09-21')).toBe('nháp mới')
    expect(localStorage.getItem('omr_bnv_ke_hoach:12121212')).toBe('bản nhớ mới')
  })

  it('mốc đã lưu KHÁC và mới hơn thì dọn tiếp; mốc CŨ hơn mốc đã lưu (máy chủ lùi) thì KHÔNG dọn', () => {
    localStorage.setItem(KHOA_MOC_RESET, '2026-09-21')
    localStorage.setItem('omr_cauon:1:a', 'x')
    expect(donKhiDoiMocReset('2026-09-14')).toEqual({ don: false, soKhoa: 0 })
    expect(localStorage.getItem('omr_cauon:1:a')).toBe('x')
    expect(donKhiDoiMocReset('2026-10-05').don).toBe(true)
    expect(localStorage.getItem('omr_cauon:1:a')).toBeNull()
    expect(localStorage.getItem(KHOA_MOC_RESET)).toBe('2026-10-05')
  })

  it('máy không có gì để dọn vẫn ghi mốc (lần sau khỏi quét); khoá lạ của app khác không bị đụng', () => {
    localStorage.setItem('khoa-la', 'v')
    expect(donKhiDoiMocReset('2026-09-21')).toEqual({ don: true, soKhoa: 0 })
    expect(localStorage.getItem(KHOA_MOC_RESET)).toBe('2026-09-21')
    expect(localStorage.getItem('khoa-la')).toBe('v')
  })
})

describe('storage lỗi ⇒ không ném, màn vẫn chạy', () => {
  it('removeItem ném: bỏ qua từng khoá, các khoá khác vẫn được dọn', () => {
    nap()
    const goc = Storage.prototype.removeItem
    vi.spyOn(Storage.prototype, 'removeItem').mockImplementation(function (this: Storage, k: string) {
      if (k === 'omr_mom_draft_M1_12121212') throw new Error('khoá này bị chặn')
      goc.call(this, k)
    })
    expect(() => donKhiDoiMocReset('2026-09-21')).not.toThrow()
    expect(localStorage.getItem('omr_mom_draft_M1_12121212')).not.toBeNull()
    expect(localStorage.getItem('omr_cauon:12121212:on_lai:2026-09-20')).toBeNull()
    expect(localStorage.getItem('ddh_id_thiet_bi')).toBe('giu:ddh_id_thiet_bi')
  })

  it('getItem/setItem/key ném (trình duyệt chặn storage): trả không dọn, không ném', () => {
    vi.spyOn(Storage.prototype, 'getItem').mockImplementation(() => {
      throw new Error('bị chặn')
    })
    vi.spyOn(Storage.prototype, 'setItem').mockImplementation(() => {
      throw new Error('đầy')
    })
    vi.spyOn(Storage.prototype, 'key').mockImplementation(() => {
      throw new Error('bị chặn')
    })
    expect(() => donKhiDoiMocReset('2026-09-21')).not.toThrow()
  })

  it('không ghi được mốc (máy đầy): dọn MỘT lần trong phiên trang, không dọn lặp mỗi lần gọi', () => {
    nap()
    vi.spyOn(Storage.prototype, 'setItem').mockImplementation((k: string) => {
      if (k === KHOA_MOC_RESET) throw new Error('đầy')
    })
    expect(donKhiDoiMocReset('2026-09-21').don).toBe(true)
    localStorage.removeItem('x')
    Storage.prototype.setItem.call(localStorage, 'omr_cauon:1:b', 'nháp mới') // ghi thẳng, bỏ qua spy cho khoá khác
    vi.restoreAllMocks()
    expect(donKhiDoiMocReset('2026-09-21')).toEqual({ don: false, soKhoa: 0 })
  })
})

describe('bảo hiểm: danh sách DỌN không bao giờ chạm danh sách GIỮ', () => {
  it('không khoá GIỮ nào khớp khoá DỌN hoặc tiền tố DỌN (chặn việc thêm tiền tố rộng sau này)', () => {
    for (const k of GIU_LOCAL) {
      expect(KHOA_LOCAL_DON.includes(k), k).toBe(false)
      expect(TIEN_TO_LOCAL_DON.some((t) => k.startsWith(t)), k).toBe(false)
    }
    for (const k of KHOA_LOCAL_GIU) {
      expect(KHOA_LOCAL_DON.includes(k), k).toBe(false)
      expect(TIEN_TO_LOCAL_DON.some((t) => k.startsWith(t)), k).toBe(false)
    }
    for (const k of GIU_SESSION.concat([...KHOA_SESSION_GIU])) expect(TIEN_TO_SESSION_DON.some((t) => k.startsWith(t)), k).toBe(false)
    // mọi khoá GIỮ mà bộ test này nạp đều nằm trong danh sách GIỮ chính thức (trừ khoá lạ)
    for (const k of GIU_LOCAL.filter((x) => x !== 'khoa-la-cua-app-khac')) expect(KHOA_LOCAL_GIU.includes(k), k).toBe(true)
  })

  it('kể cả khi ai đó lỡ thêm tiền tố rộng, khoá trong KHOA_LOCAL_GIU vẫn không bị xoá (lớp bảo hiểm cuối)', () => {
    // `ddh` trần sẽ khớp mọi khoá ddh.*, kể cả `ddh_id_thiet_bi`? Không: tiền tố `ddh.` không khớp `ddh_`; nhưng `ddh.vai` sẽ khớp — và phải vẫn được giữ.
    ;(TIEN_TO_LOCAL_DON as string[]).push('ddh.')
    try {
      nap()
      donKhiDoiMocReset('2026-09-21')
      for (const k of ['ddh.vai', 'ddh.boQuaCaiApp', 'ddh.phienBanDuLieu', 'ddh.phieu.mau', 'ddh_id_thiet_bi', 'omr_student_portal_auth']) expect(localStorage.getItem(k), k).not.toBeNull()
    } finally {
      ;(TIEN_TO_LOCAL_DON as string[]).pop()
    }
  })
})

describe('nối vào lớp gọi máy chủ của HAI CỔNG (/hs/ke-hoach-ngay, /hs/ca-dang-mo)', () => {
  function gia(duong: Record<string, unknown>) {
    vi.stubGlobal(
      'fetch',
      vi.fn(async (url: string) => {
        const d = duong[new URL(String(url)).pathname]
        return { ok: true, status: 200, json: async () => d ?? {} }
      }),
    )
  }
  const KH = { ok: true, viec: [], nganSach: { mucTieuCau: 12 }, tienBo: { daLamCau: 0 } }

  it('/hs/ke-hoach-ngay có mocReset MỚI: dọn TRƯỚC khi trả kế hoạch (kế hoạch vẫn trả bình thường); vắng ⇒ không dọn', async () => {
    nap()
    gia({ '/hs/ke-hoach-ngay': KH })
    expect(await taiKeHoachNgay({ token: 't' })).toMatchObject({ ok: true })
    expect(localStorage.getItem('omr_bnv_ke_hoach:12121212')).not.toBeNull() // mốc vắng ⇒ KHÔNG dọn
    gia({ '/hs/ke-hoach-ngay': { ...KH, mocReset: '2026-09-21' } })
    expect(await taiKeHoachNgay({ token: 't' })).toMatchObject({ ok: true })
    expect(localStorage.getItem('omr_bnv_ke_hoach:12121212')).toBeNull()
    expect(localStorage.getItem('omr_student_portal_auth')).toBe('giu:omr_student_portal_auth')
    expect(localStorage.getItem('ddh_id_thiet_bi')).toBe('giu:ddh_id_thiet_bi')
  })

  it('/hs/ca-dang-mo cũng báo mốc; kế hoạch lỗi (không hợp lệ) vẫn đọc được mốc để dọn', async () => {
    nap()
    gia({ '/hs/ca-dang-mo': { ok: true, coCaMo: false, mocReset: '2026-09-21' } })
    expect(await taiCaDangMo({ token: 't' })).toBe(false)
    expect(localStorage.getItem('omr_cauon:12121212:on_lai:2026-09-20')).toBeNull()
    quenMocDaDonTrongPhien()
    localStorage.clear()
    nap()
    gia({ '/hs/ke-hoach-ngay': { ok: false, mocReset: '2026-09-28' } })
    expect(await taiKeHoachNgay({ token: 't' })).toBeNull()
    expect(localStorage.getItem('omr_cauon:12121212:on_lai:2026-09-20')).toBeNull()
  })

  it('mất mạng/máy chủ lỗi: không dọn, không ném', async () => {
    nap()
    vi.stubGlobal('fetch', vi.fn(async () => { throw new Error('mất mạng') }))
    expect(await taiKeHoachNgay({ token: 't' })).toBeNull()
    expect(await taiCaDangMo({ token: 't' })).toBe(false)
    expect(localStorage.getItem('omr_bnv_ke_hoach:12121212')).not.toBeNull()
  })
})
