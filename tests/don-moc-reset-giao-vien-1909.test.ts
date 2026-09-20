// DỌN MÁY THẦY THEO `mocReset` (0.Planer duyệt 19/09/2026, thầy chốt reset 00:01 thứ Hai 21/09).
//
// Kiểm ba lớp:
//   1. LUẬT: khoá nào DỌN, khoá nào GIỮ; mốc hợp lệ; khi nào chạy, khi nào không (thay thế được bằng `pt` để không chạm IndexedDB).
//   2. GIAO DỊCH nguyên tử trên một IndexedDB GIẢ trong bộ nhớ (repo không có fake-indexeddb): xoá đúng, giữ đúng, ghi dấu cùng
//      giao dịch, hỏng giữa chừng thì không đổi gì. Bản THẬT trong Chromium: xem `scripts/do-moc-reset-indexeddb.mjs`.
//   3. ĐAI + DÂY cho đường đẩy `capNhatKeyBank`: bank ca không còn trên máy chủ không bao giờ được đẩy.
// Và khoá nguồn: không mốc cứng theo đồng hồ, không chạm localStorage/sessionStorage, đúng chỗ gọi.
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { readFileSync } from 'node:fs'

// ───────────── IndexedDB giả (đủ cho phần `exam-db.ts` dùng) ─────────────
type Kho = Map<string, Map<string, unknown>>
const nen: { kho: Kho; hong: boolean } = { kho: new Map(), hong: false }
const dat = (ten: string, v: [string, unknown][]) => nen.kho.set(ten, new Map(v))

function taoDbGia() {
  const store = (kho: Kho, ten: string) => {
    const m = kho.get(ten)!
    return {
      count: async () => m.size,
      clear: async () => void m.clear(),
      getAllKeys: async () => [...m.keys()],
      delete: async (k: string) => {
        if (nen.hong) throw new Error('IDB hỏng giữa giao dịch')
        m.delete(k)
      },
      put: async (v: unknown, k: string) => void m.set(k, v),
    }
  }
  return {
    transaction: (ds: string[]) => {
      // sao chép khi mở, chỉ GHI ĐÈ khi `done` — không ai `await tx.done` (do ném lỗi trước) thì coi như bị huỷ
      const lam: Kho = new Map(ds.map((t) => [t, new Map(nen.kho.get(t))]))
      return {
        objectStore: (t: string) => store(lam, t),
        // getter: chỉ khi code `await tx.done` (tức đã làm xong mọi thao tác mà không ném lỗi) thì mới ghi đè
        get done() {
          return Promise.resolve().then(() => {
            for (const [t, m] of lam) nen.kho.set(t, new Map(m))
          })
        },
      }
    },
    get: async (t: string, k: string) => nen.kho.get(t)?.get(k),
    put: async (t: string, v: unknown, k?: string) => void nen.kho.get(t)!.set(String(k), v),
    delete: async (t: string, k: string) => void nen.kho.get(t)!.delete(k),
    getAllKeys: async (t: string) => [...(nen.kho.get(t)?.keys() ?? [])],
  }
}
vi.mock('idb', () => ({ openDB: async () => taoDbGia() }))

const EXAM = await import('../src/lib/exam-db')
const MOC = await import('../src/lib/don-moc-reset-giao-vien')
const SYNC_NGUON = readFileSync('src/lib/exam-sync.ts', 'utf8')
const EXAM_DB = readFileSync('src/lib/exam-db.ts', 'utf8')

function napMayCu() {
  dat('sessionCache', [['111111', { maCa: '111111' }], ['222222', { maCa: '222222' }]])
  dat('sessionBankTeacher', [['111111', [{ maDe: 'D1' }]], ['222222', [{ maDe: 'D2' }]]])
  dat('attempts', [['111111:12000', { key: '111111:12000' }]])
  dat('examSources', [['D1', { maDe: 'D1' }], ['D2', { maDe: 'D2' }]])
  dat('settings', [
    // nhóm DỌN
    ['soCauCa:111111', {}], ['khoChuaCa:111111', []], ['deRiengCa:111111', {}], ['cheDoDeRieng:111111', true], ['qidRaPhieu:12000', ['q1']],
    ['buoiChua:-|Lop|111111', { phienBan: 1 }], ['diemCuaEm', {}],
    // nhóm GIỮ (kể cả độ khó theo câu và hàng đợi ôn giãn cách)
    ['khoDoKho', {}], ['lichOnLai', {}],
    ['scriptUrl', 'https://x'], ['mayChuMoi', {}], ['teacherSecret', 'bi-mat'], ['khoaApp', {}], ['khoaVanTay', {}], ['khoaPhien', {}], ['giuPhien', true],
    ['soSuaDang', { q1: 'D01' }], ['tokenHocSinh', 't1'], ['tokenPhuHuynh', 't2'], ['myStudentSbd', '12000'], ['myParentPhone', '09'],
  ])
}
beforeEach(() => {
  nen.kho = new Map()
  nen.hong = false
  napMayCu()
})

describe('mốc hợp lệ và câu thông báo', () => {
  it('chấp nhận chuỗi ngắn "an toàn"; mọi thứ khác coi như KHÔNG có mốc', () => {
    for (const ok of ['2026-09-21', 'reset-2', 'a', 'A1_b.c:d']) expect(MOC.chuanMocReset(ok), ok).toBe(ok)
    expect(MOC.chuanMocReset(' 2026-09-21 ')).toBe('2026-09-21')
    for (const xau of ['', '   ', 21, null, undefined, {}, [], true, '../x', 'a b', 'x'.repeat(41), '-bat-dau-bang-gach', 'dấu']) {
      expect(MOC.chuanMocReset(xau), String(xau)).toBeNull()
    }
  })
  it('một dòng cho thầy: mốc ngày thì nói ngày, mốc khác thì nói chung', () => {
    expect(MOC.chuThongBaoMocReset('2026-09-21')).toBe('Hệ thống đã làm mới ngày 21/09 — dữ liệu ca cũ trong máy đã được dọn')
    expect(MOC.chuThongBaoMocReset('lan-2')).toBe('Hệ thống đã làm mới — dữ liệu ca cũ trong máy đã được dọn')
  })
})

describe('khoá nào DỌN, khoá nào GIỮ', () => {
  const DON = ['soCauCa:1', 'khoChuaCa:x', 'deRiengCa:x', 'cheDoDeRieng:x', 'qidRaPhieu:12000', 'buoiChua:-|Lop|1', 'diemCuaEm']
  const GIU = [
    'scriptUrl', 'mayChuMoi', 'teacherSecret', 'khoaApp', 'khoaVanTay', 'khoaPhien', 'giuPhien', 'soSuaDang',
    'tokenHocSinh', 'tokenPhuHuynh', 'myStudentSbd', 'myParentPhone', 'mocResetDaDon',
    // Boss chốt 21/09 (reset GIỮ hồ sơ mạnh yếu): độ khó theo câu và hàng đợi ôn giãn cách CHỈ có ở máy thầy ⇒ giữ
    'khoDoKho', 'lichOnLai',
  ]
  it('đúng bảng 0.Planer đã duyệt', () => {
    for (const k of DON) expect(EXAM.khoaSettingsThuocNhomDon(k), k).toBe(true)
    for (const k of GIU) expect(EXAM.khoaSettingsThuocNhomDon(k), k).toBe(false)
  })
  it('store xoá sạch là ba store theo ca/em; KHO ĐỀ `examSources` không nằm trong đó', () => {
    expect([...EXAM.STORE_DON_KHI_RESET].sort()).toEqual(['attempts', 'sessionBankTeacher', 'sessionCache'])
  })
  it('KHOÁ MỚI trong `settings` phải được PHÂN LOẠI: mọi khoá exam-db.ts dùng nằm ở danh sách DỌN hoặc GIỮ của test này (thêm khoá là phải quyết)', () => {
    const hang = new Map([...EXAM_DB.matchAll(/const (KHOA_[A-Z_]+) = '([^']+)'/g)].map((m) => [m[1], m[2]]))
    const dungDung = new Set<string>()
    for (const dong of EXAM_DB.split('\n')) {
      if (!dong.includes('STORE_SETTINGS') || dong.includes('createObjectStore') || dong.includes('.transaction(') || dong.includes('const STORE_SETTINGS')) continue
      const cuoi = [...dong.matchAll(/'([^']+)'|(KHOA_[A-Z_]+)/g)].pop()
      if (cuoi) dungDung.add(cuoi[1] ?? hang.get(cuoi[2]) ?? cuoi[2])
    }
    const tienTo = new Set([...EXAM_DB.matchAll(/`([A-Za-z]+:)\$\{/g)].map((m) => m[1]))
    // cả hai tập phải có thật (đề phòng regex hỏng thành xanh suông)
    expect([...dungDung].sort()).toEqual(expect.arrayContaining(['scriptUrl', 'teacherSecret', 'khoDoKho', 'diemCuaEm', 'lichOnLai', 'mocResetDaDon', 'soSuaDang', 'tokenHocSinh']))
    expect(dungDung.size).toBeGreaterThanOrEqual(15)
    expect([...dungDung].sort()).toEqual(expect.arrayContaining(['khoDoKho', 'lichOnLai']))
    expect([...tienTo].sort()).toEqual(['buoiChua:', 'cheDoDeRieng:', 'deRiengCa:', 'khoChuaCa:', 'qidRaPhieu:', 'soCauCa:'])
    const chuaPhanLoai = [...dungDung].filter((k) => !DON.includes(k) && !GIU.includes(k))
    expect(chuaPhanLoai, 'khoá settings mới chưa được xếp DỌN/GIỮ khi reset').toEqual([])
    for (const t of tienTo) expect((EXAM.TIEN_TO_SETTINGS_DON_KHI_RESET as readonly string[]).includes(t), t).toBe(true)
  })
})

describe('donTheoMocReset — khi nào chạy', () => {
  const pt = (o: Partial<import('../src/lib/don-moc-reset-giao-vien').PhuThuocDonMoc> = {}) => ({
    laThay: () => true,
    docDaDon: async () => '',
    don: vi.fn(async () => ({ soBanGhi: 3, soKhoaSettings: 5 })),
    baoThay: vi.fn(),
    ...o,
  })

  it('không có mốc (máy chủ chưa reset / đường Apps Script cũ) ⇒ KHÔNG dọn, KHÔNG báo', async () => {
    const p = pt()
    for (const v of [undefined, null, '', 20260921, {}]) expect(await MOC.donTheoMocReset(v, p)).toEqual({ daDon: false, lyDo: 'khong_co_moc' })
    expect(p.don).not.toHaveBeenCalled()
    expect(p.baoThay).not.toHaveBeenCalled()
  })

  it('KHÔNG phải vai giáo viên ⇒ không dọn (cổng học sinh / phụ huynh có bộ dọn riêng)', async () => {
    const p = pt({ laThay: () => false })
    expect(await MOC.donTheoMocReset('2026-09-21', p)).toEqual({ daDon: false, lyDo: 'khong_phai_thay' })
    expect(p.don).not.toHaveBeenCalled()
  })

  it('mốc MỚI ⇒ dọn đúng một lần, báo thầy một dòng đúng chữ đã duyệt', async () => {
    const p = pt()
    const kq = await MOC.donTheoMocReset('2026-09-21', p)
    expect(kq).toEqual({ daDon: true, ket: { soBanGhi: 3, soKhoaSettings: 5 }, moc: '2026-09-21' })
    expect(p.don).toHaveBeenCalledWith('2026-09-21')
    expect(p.baoThay).toHaveBeenCalledTimes(1)
    expect(p.baoThay).toHaveBeenCalledWith('Hệ thống đã làm mới ngày 21/09 — dữ liệu ca cũ trong máy đã được dọn')
  })

  it('đã dọn theo ĐÚNG mốc này rồi ⇒ không dọn lại, không báo lại', async () => {
    const p = pt({ docDaDon: async () => '2026-09-21' })
    expect(await MOC.donTheoMocReset('2026-09-21', p)).toEqual({ daDon: false, lyDo: 'da_don_roi' })
    expect(p.don).not.toHaveBeenCalled()
    expect(p.baoThay).not.toHaveBeenCalled()
  })

  it('một mốc reset LẦN SAU (khác mốc đã dọn) ⇒ dọn lại', async () => {
    const p = pt({ docDaDon: async () => '2026-09-21' })
    expect((await MOC.donTheoMocReset('2026-10-05', p)).daDon).toBe(true)
    expect(p.don).toHaveBeenCalledWith('2026-10-05')
  })

  it('máy mới tinh (không có gì để dọn) ⇒ vẫn ghi dấu nhưng KHÔNG báo thầy', async () => {
    const p = pt({ don: vi.fn(async () => ({ soBanGhi: 0, soKhoaSettings: 0 })) })
    expect((await MOC.donTheoMocReset('2026-09-21', p)).daDon).toBe(true)
    expect(p.baoThay).not.toHaveBeenCalled()
  })

  it('dọn HỎNG ⇒ không ném lỗi ra ngoài (danh sách ca quan trọng hơn), không báo, lần sau thử lại', async () => {
    const p = pt({ don: vi.fn(async () => { throw new Error('IDB chết') }) })
    const spy = vi.spyOn(console, 'warn').mockImplementation(() => {})
    await expect(MOC.donTheoMocReset('2026-09-21', p)).resolves.toEqual({ daDon: false, lyDo: 'loi' })
    expect(p.baoThay).not.toHaveBeenCalled()
    spy.mockRestore()
    // lần sau (đã hết lỗi) dọn được
    const p2 = pt()
    expect((await MOC.donTheoMocReset('2026-09-21', p2)).daDon).toBe(true)
  })

  it('nhiều lệnh `danhSachCa` cùng nhận mốc một lúc ⇒ chỉ MỘT lượt dọn', async () => {
    let xong!: () => void
    const p = pt({ don: vi.fn(() => new Promise<{ soBanGhi: number; soKhoaSettings: number }>((r) => { xong = () => r({ soBanGhi: 1, soKhoaSettings: 1 }) })) })
    const a = MOC.donTheoMocReset('2026-09-21', p)
    const b = MOC.donTheoMocReset('2026-09-21', p)
    await new Promise((r) => setTimeout(r, 0))
    xong()
    const [ka, kb] = await Promise.all([a, b])
    expect(ka).toEqual(kb)
    expect(p.don).toHaveBeenCalledTimes(1)
    expect(p.baoThay).toHaveBeenCalledTimes(1)
  })
})

describe('giao dịch dọn trên IndexedDB giả', () => {
  it('xoá đúng nhóm DỌN, GIỮ đúng nhóm GIỮ (kể cả KHO ĐỀ), ghi dấu, đếm đúng', async () => {
    const kq = await EXAM.donDuLieuTheoMocReset('2026-09-21')
    expect(kq).toEqual({ soBanGhi: 2 + 2 + 1, soKhoaSettings: 7 })
    for (const s of ['sessionCache', 'sessionBankTeacher', 'attempts']) expect(nen.kho.get(s)!.size, s).toBe(0)
    expect([...nen.kho.get('examSources')!.keys()].sort()).toEqual(['D1', 'D2'])
    const conLai = [...nen.kho.get('settings')!.keys()].sort()
    expect(conLai).toEqual(
      ['giuPhien', 'khoDoKho', 'khoaApp', 'khoaPhien', 'khoaVanTay', 'lichOnLai', 'mayChuMoi', 'mocResetDaDon', 'myParentPhone', 'myStudentSbd', 'scriptUrl', 'soSuaDang', 'teacherSecret', 'tokenHocSinh', 'tokenPhuHuynh'].sort(),
    )
    expect(nen.kho.get('settings')!.get('mocResetDaDon')).toBe('2026-09-21')
    expect(nen.kho.get('settings')!.get('teacherSecret')).toBe('bi-mat')
    expect(await EXAM.docMocResetDaDon()).toBe('2026-09-21')
  })

  it('HỎNG GIỮA CHỪNG ⇒ không dọn nửa vời và KHÔNG ghi dấu (giao dịch bị huỷ)', async () => {
    nen.hong = true
    await expect(EXAM.donDuLieuTheoMocReset('2026-09-21')).rejects.toThrow('IDB hỏng')
    expect(nen.kho.get('sessionBankTeacher')!.size).toBe(2)
    expect(nen.kho.get('settings')!.has('soCauCa:111111')).toBe(true)
    expect(await EXAM.docMocResetDaDon()).toBe('')
  })

  it('dọn hai lần liên tiếp vô hại (idempotent) và đếm 0 lần hai', async () => {
    await EXAM.donDuLieuTheoMocReset('2026-09-21')
    expect(await EXAM.donDuLieuTheoMocReset('2026-09-21')).toEqual({ soBanGhi: 0, soKhoaSettings: 0 })
  })

  it('toàn tuyến `donTheoMocReset` (không thay phụ thuộc) dọn máy giả và báo thầy', async () => {
    const baoThay = vi.fn()
    const kq = await MOC.donTheoMocReset('2026-09-21', { laThay: () => true, baoThay })
    expect(kq.daDon).toBe(true)
    expect(baoThay).toHaveBeenCalledTimes(1)
    expect(nen.kho.get('sessionBankTeacher')!.size).toBe(0)
    expect(await MOC.donTheoMocReset('2026-09-21', { laThay: () => true, baoThay })).toEqual({ daDon: false, lyDo: 'da_don_roi' })
    expect(baoThay).toHaveBeenCalledTimes(1)
  })
})

describe('khoá nguồn — không mốc cứng, không chạm web-storage, đúng chỗ gọi', () => {
  const nguon = readFileSync('src/lib/don-moc-reset-giao-vien.ts', 'utf8')
  const bo = (s: string) => s.replace(/\/\/[^\n]*/g, '').replace(/\/\*[\s\S]*?\*\//g, '')

  it('KHÔNG có đồng hồ: kích hoạt chỉ theo mốc máy chủ (thầy còn cờ huỷ reset tới phút chót)', () => {
    const ma = bo(nguon)
    expect(ma).not.toMatch(/Date\.now|new Date|performance\.now|setTimeout|setInterval|2026-09-21/)
  })

  it('KHÔNG đụng localStorage/sessionStorage (việc của `don-moc-reset.ts`) và không nhắc khoá đăng nhập của học sinh/phụ huynh', () => {
    const ma = bo(nguon)
    expect(ma).not.toMatch(/localStorage|sessionStorage|omr_student_portal_auth|omr_ph_sbd|ddh\.em\./)
    expect(bo(EXAM_DB.slice(EXAM_DB.indexOf('DỌN THEO MỐC RESET')))).not.toMatch(/localStorage|sessionStorage|indexedDB\.deleteDatabase|clear\(\)\s*;?\s*\/\/ tất cả/)
  })

  it('CHỈ vai giáo viên: mặc định hỏi `laManThayQuanLy`', () => {
    expect(nguon).toContain('laManThayQuanLy(location.search, location.pathname)')
  })

  it('MỌI đường nhận `danhSachCa` dọn NGAY khi phản hồi có mốc, trước khi trả danh sách: đường máy chủ mới (`danhSachCaMoi`) và đường `postJson`', () => {
    const moi = readFileSync('src/lib/man-ca-may-chu-moi.ts', 'utf8')
    const hamMoi = moi.slice(moi.indexOf('export async function danhSachCaMoi('), moi.indexOf('/** ĐẨY MỘT LÔ CA VÀ LƯỢT'))
    expect(hamMoi.indexOf('await donTheoMocReset(r.mocReset)')).toBeGreaterThan(0)
    expect(hamMoi.indexOf('await donTheoMocReset(r.mocReset)')).toBeLessThan(hamMoi.indexOf('return { items, dau'))
    // cổng an toàn "chưa chuyển xong thì đi đường cũ" vẫn đứng TRƯỚC (mốc chỉ được đọc khi phản hồi đã qua cổng)
    expect(hamMoi.indexOf("if (!dau || dau.ma !== 'ca_day_du') return null")).toBeLessThan(hamMoi.indexOf('await donTheoMocReset(r.mocReset)'))
    const api = readFileSync('src/lib/exam-api.ts', 'utf8')
    const post = api.slice(api.indexOf('async function postJson'), api.indexOf('// VÀO THI — một SBD một lượt mỗi ca'))
    expect(post).toContain("(body as { action?: unknown } | null)?.action === 'danhSachCa') await donTheoMocReset(r.mocReset)")
    expect(post.indexOf('await donTheoMocReset(r.mocReset)')).toBeLessThan(post.lastIndexOf('return r'))
    // `danhSachCaThat` giữ NGUYÊN các dòng mà test cổng an toàn (man-ca-thi-may-chu-moi-1109) khoá
    expect(api).toContain('if (rMoi) return chuanCaTomTat(rMoi.items)')
  })
})

// ───────────── ĐAI + DÂY: không đẩy bank ca ma lên máy chủ ─────────────
const ma = { danhSachCa: vi.fn(), capNhatKeyBank: vi.fn(), danhSachDe: vi.fn(), layDe: vi.fn() }
vi.mock('../src/lib/exam-api', () => ({
  danhSachCa: (...a: unknown[]) => ma.danhSachCa(...a),
  capNhatKeyBank: (...a: unknown[]) => ma.capNhatKeyBank(...a),
  danhSachDe: (...a: unknown[]) => ma.danhSachDe(...a),
  layDe: (...a: unknown[]) => ma.layDe(...a),
}))

const bankCa = (maCa: string) => ({ maCa })
const mk = (ds: string[]) => ds.map(bankCa)

describe('chiaBankTheoCaMayChu — chỉ đẩy cho ca máy chủ còn giữ', () => {
  it('chưa hỏi được máy chủ (null) ⇒ KHÔNG đẩy gì và KHÔNG xoá gì', async () => {
    const { chiaBankTheoCaMayChu } = await import('../src/lib/exam-sync')
    expect(chiaBankTheoCaMayChu(mk(['1', '2']), null)).toEqual({ duocDay: [], canXoaKhoiMay: [] })
  })

  it('danh sách máy chủ RỖNG ⇒ không ca nào được đẩy, và KHÔNG xoá bank nào (rỗng có thể là lỗi/cắt trang)', async () => {
    const { chiaBankTheoCaMayChu } = await import('../src/lib/exam-sync')
    expect(chiaBankTheoCaMayChu(mk(['1', '2', '3']), [])).toEqual({ duocDay: [], canXoaKhoiMay: [] })
  })

  it('bank có trong danh sách ⇒ được đẩy; bank NGOÀI danh sách ⇒ không đẩy, và bị xoá khỏi máy khi danh sách đủ tin', async () => {
    const { chiaBankTheoCaMayChu } = await import('../src/lib/exam-sync')
    const banks = mk(['1', '2', '3', '4', '5', '6', '7', '8', '9', 'MA'])
    const r = chiaBankTheoCaMayChu(banks, ['1', '2', '3', '4', '5', '6', '7', '8', '9', 'KHAC'])
    expect(r.duocDay.map((b) => b.maCa)).toEqual(['1', '2', '3', '4', '5', '6', '7', '8', '9'])
    expect(r.canXoaKhoiMay.map((b) => b.maCa)).toEqual(['MA'])
  })

  it('quá 20% bank nằm ngoài danh sách ⇒ nghi danh sách bị cắt: không xoá bank nào (nhưng vẫn không đẩy bank ngoài danh sách)', async () => {
    const { chiaBankTheoCaMayChu } = await import('../src/lib/exam-sync')
    const banks = mk(['1', '2', '3', '4', '5', '6', '7', '8', '9', '10'])
    const r = chiaBankTheoCaMayChu(banks, ['1', '2', '3', '4', '5', '6', '7'])
    expect(r.duocDay).toHaveLength(7)
    expect(r.canXoaKhoiMay).toEqual([])
  })

  it('mã ca so bằng CHUỖI (máy chủ trả số, IndexedDB giữ chuỗi)', async () => {
    const { chiaBankTheoCaMayChu } = await import('../src/lib/exam-sync')
    const r = chiaBankTheoCaMayChu(mk(['111111']), [111111 as unknown as string])
    expect(r.duocDay).toHaveLength(1)
  })

  it('`maCaConTrenMayChu` gộp ca đang dùng + ca THÙNG RÁC (khôi phục được nên không xoá bank của nó); một lượt hỏng ⇒ null', async () => {
    const { maCaConTrenMayChu } = await import('../src/lib/exam-sync')
    ma.danhSachCa.mockReset()
    ma.danhSachCa.mockImplementation(async (_u: string, _s: string, daXoa: boolean) => (daXoa ? [{ maCa: '9' }] : [{ maCa: '1' }, { maCa: 2 }]))
    expect((await maCaConTrenMayChu('u', 's'))!.sort()).toEqual(['1', '2', '9'])
    ma.danhSachCa.mockImplementation(async (_u: string, _s: string, daXoa: boolean) => {
      if (daXoa) throw new Error('mất mạng')
      return [{ maCa: '1' }]
    })
    expect(await maCaConTrenMayChu('u', 's')).toBeNull()
  })
})

describe('capNhatCaDaMo — không tái tạo khoá của ca đã xoá trên máy chủ', () => {
  const nguonDe = (maDe: string) => ({ maDe, phanI: [], phanII: [], phanIII: [] }) as never

  it('ca ma (không có trên máy chủ) KHÔNG bị đẩy; ca thật được đẩy; ca ma bị xoá khỏi máy khi đủ tin', async () => {
    ma.danhSachCa.mockReset()
    ma.capNhatKeyBank.mockReset()
    ma.capNhatKeyBank.mockResolvedValue({})
    // 10 bank: 9 thật + 1 ma; cả 10 đều dùng đề D1
    nen.kho.set('sessionBankTeacher', new Map(['1', '2', '3', '4', '5', '6', '7', '8', '9', 'MA'].map((c) => [c, [{ maDe: 'D1', phanI: [], phanII: [], phanIII: [] }]] as [string, unknown])))
    ma.danhSachCa.mockImplementation(async (_u: string, _s: string, daXoa: boolean) => (daXoa ? [] : ['1', '2', '3', '4', '5', '6', '7', '8', '9'].map((maCa) => ({ maCa }))))
    const { capNhatCaDaMo } = await import('../src/lib/exam-sync')
    const n = await capNhatCaDaMo('u', 's', nguonDe('D1'))
    expect(n).toBe(9)
    const daDay = ma.capNhatKeyBank.mock.calls.map((c) => c[2]).sort()
    expect(daDay).toEqual(['1', '2', '3', '4', '5', '6', '7', '8', '9'])
    expect(daDay).not.toContain('MA')
    expect(nen.kho.get('sessionBankTeacher')!.has('MA')).toBe(false)
  })

  it('danh sách ca máy chủ RỖNG (ví dụ ngay sau reset) ⇒ KHÔNG đẩy bank nào, và không xoá bank nào', async () => {
    ma.danhSachCa.mockReset()
    ma.capNhatKeyBank.mockReset()
    ma.danhSachCa.mockResolvedValue([])
    nen.kho.set('sessionBankTeacher', new Map([['111111', [{ maDe: 'D1', phanI: [], phanII: [], phanIII: [] }]]]))
    const { capNhatCaDaMo } = await import('../src/lib/exam-sync')
    expect(await capNhatCaDaMo('u', 's', nguonDe('D1'))).toBe(0)
    expect(ma.capNhatKeyBank).not.toHaveBeenCalled()
    expect(nen.kho.get('sessionBankTeacher')!.has('111111')).toBe(true)
  })

  it('không hỏi được máy chủ ⇒ không đẩy gì (đẩy mù là đúng thứ gây ca ma)', async () => {
    ma.danhSachCa.mockReset()
    ma.capNhatKeyBank.mockReset()
    ma.danhSachCa.mockRejectedValue(new Error('mất mạng'))
    nen.kho.set('sessionBankTeacher', new Map([['111111', [{ maDe: 'D1', phanI: [], phanII: [], phanIII: [] }]]]))
    const { capNhatCaDaMo } = await import('../src/lib/exam-sync')
    expect(await capNhatCaDaMo('u', 's', nguonDe('D1'))).toBe(0)
    expect(ma.capNhatKeyBank).not.toHaveBeenCalled()
  })

  it('màn Ngân hàng đề dùng CÙNG bộ lọc trước khi đẩy (khoá nguồn: lọc đứng trước capNhatKeyBank, ca ngoài danh sách bị bỏ)', () => {
    const nh = readFileSync('src/screens/NganHangDeScreen.tsx', 'utf8')
    const i = nh.indexOf('capNhat: async () => {')
    const khoi = nh.slice(i, nh.indexOf('showToast(`Đã cập nhật đáp án cho', i))
    expect(khoi.indexOf('chiaBankTheoCaMayChu(banks,')).toBeGreaterThan(0)
    expect(khoi.indexOf('chiaBankTheoCaMayChu(banks,')).toBeLessThan(khoi.indexOf('await capNhatKeyBank('))
    expect(khoi).toContain('if (daBo.has(b.maCa)) continue')
    expect(khoi).toContain('if (!duocDay.has(b.maCa)) {')
    expect(khoi).toContain('await xoaSessionTeacherBank(x.maCa)')
    // và KHÔNG còn đường đẩy nào chạy vòng bank mà không lọc
    expect(SYNC_NGUON).toContain('const { duocDay, canXoaKhoiMay } = chiaBankTheoCaMayChu(banks, await maCaConTrenMayChu(scriptUrl, secret))')
  })
})
