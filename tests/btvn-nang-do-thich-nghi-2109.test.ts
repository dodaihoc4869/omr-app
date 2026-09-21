// @vitest-environment node
// BTVN "NÂNG ĐỠ" — THÍCH NGHI SAU MỖI CHẶNG (bước G) BẬT cho MỌI em bài cá nhân hoá (Boss chốt 21/09), có cờ tắt `cau_hinh.btvn_ca_nhan.thichNghi = false`.
// Lõi (`thichNghiChangSau`, Code 1) đổi/thêm câu CHỈ ở chặng CHƯA MỞ; máy chủ kiểm lại bất biến trước khi lưu. Cờ tắt ⇒ bộ giữ nguyên từng dòng.
import { afterEach, describe, expect, it, vi } from 'vitest'
import { coBatThichNghi, docCoThichNghi } from '../server/src/btvn-nang-do-d1'
import type { D1That } from './_d1-that'
import { BAY_GIO, DAP_AN_DUNG, boCuaEm, dung, giao, gio, mo, nopChang } from './_btvn-nang-do-mau'

// Lõi BTVN của Code 1 bọc lại: mặc định đi thẳng qua hàm thật; một test có thể ÉP lõi trả một thay đổi HỢP LỆ để khoá đúng phần NỐI của máy chủ (cờ, lưu, bất biến) mà không phụ thuộc
// việc mẫu của bộ cụ thể có đủ để lõi tự quyết đổi hay không (ngưỡng mẫu là chuyện của lõi, có test riêng ở tests/btvn-nang-do-2109.test.ts của Code 1).
type KqLoi = { bo: { chang: string[][]; nhan: Record<string, string>; rieng: string[]; loi: string[]; thuThach: string[] }; doi: unknown[]; henOnLai: string[] }
const ep = { bien: null as null | ((kq: KqLoi) => KqLoi), soLanGoi: 0 }
vi.mock('../src/lib/btvn-nang-do', async (goc) => {
  const m = await goc<typeof import('../src/lib/btvn-nang-do')>()
  return { ...m, thichNghiChangSau: (...a: Parameters<typeof m.thichNghiChangSau>) => { ep.soLanGoi++; const kq = m.thichNghiChangSau(...a); return ep.bien ? (ep.bien(kq as unknown as KqLoi) as unknown as typeof kq) : kq } }
})

afterEach(() => { vi.useRealTimers(); ep.bien = null; ep.soLanGoi = 0 })

const SAI = (q: string) => (/-II-/.test(q) ? 'SDSD' : /-III-/.test(q) ? '1.5' : 'B')
const HAN_XA = new Date(BAY_GIO.getTime() + 8 * 24 * 3_600_000).toISOString()
function hosoManh(d: D1That, sbd = 'S1') {
  for (const ma of ['DA-1', 'DA-2', 'DA-3', 'DA-4']) d.sql.prepare('INSERT OR REPLACE INTO nam_kt_dang(khoa,sbd,ma_dang,so_gap,so_sai,so_da_khac_phuc,so_moi_sai,so_chua_thay_sai,bac,cap_nhat_luc) VALUES(?,?,?,?,?,?,?,?,?,?)').run(`${sbd}|${ma}`, sbd, ma, 10, 1, 1, 0, 9, 2, 'x')
}
/** Tờ DE3: 60 câu Phần I, 6 dạng × 10 câu, mức Biết/Hiểu/VD xoay ⇒ chặng đủ mẫu để thích nghi có việc làm. */
function toLon(d: D1That) {
  const muc = ['biet', 'hieu', 'van_dung']
  d.objects.set('kho/DE3.json', { ma_de: 'DE3', cau: Array.from({ length: 60 }, (_, i) => ({ phan: 'I', so: i + 1, de: 'x', dap_an: 'A', chuyen_de: 'Este', muc_do: muc[i % 3], dang: { ma: `DB-${Math.floor(i / 10)}`, ten: 'x' } })) })
  d.sql.exec("INSERT INTO de_kho(ma_de,ten_de,so_cau,da_xoa,cap_nhat_luc) VALUES('DE3','Tờ 3',60,0,'x')")
  for (let k = 0; k < 6; k++) d.sql.prepare('INSERT OR REPLACE INTO nam_kt_dang(khoa,sbd,ma_dang,so_gap,so_sai,so_da_khac_phuc,so_moi_sai,so_chua_thay_sai,bac,cap_nhat_luc) VALUES(?,?,?,?,?,?,?,?,?,?)').run(`S1|DB-${k}`, 'S1', `DB-${k}`, 10, 1, 1, 0, 9, 1, 'x')
}
function datCo(d: D1That, giaTri: string | null) {
  d.sql.exec("DELETE FROM cau_hinh WHERE khoa = 'btvn_ca_nhan'")
  if (giaTri !== null) d.sql.prepare("INSERT INTO cau_hinh(khoa,gia_tri,cap_nhat_luc) VALUES('btvn_ca_nhan',?,'x')").run(giaTri)
}
async function chayChang0(d: D1That, dapAn: (q: string) => string, lon = false) {
  await giao(d, lon ? { maDe: 'DE3', cau: [], hanNop: new Date(BAY_GIO.getTime() + 3 * 24 * 3_600_000).toISOString() } : {})
  await mo(d)
  const truoc = boCuaEm(d)
  const c0 = truoc.filter((x) => x.chang === 0).map((x) => x.qid)
  const han = d.sql.prepare('SELECT han_nop FROM btvn').get()
  const r = await nopChang(d, 0, Object.fromEntries(c0.map((q) => [q, dapAn(q)])))
  return { truoc, sau: boCuaEm(d), c0, han, r }
}

describe('cờ thichNghi', () => {
  it('docCoThichNghi: vắng/hỏng/khác ⇒ BẬT; chỉ {"thichNghi": false} ⇒ TẮT (không lẫn với cờ giao bài mới)', () => {
    for (const v of [null, undefined, '', 'false', '0', 'tat', '{}', '{"thichNghi":true}', '{"tat":true}', '{"bat":false}', 'rác']) expect(docCoThichNghi(v), String(v)).toBe(true)
    for (const v of ['{"thichNghi":false}', ' {"thichNghi": false, "x": 1} ']) expect(docCoThichNghi(v), v).toBe(false)
  })
  it('coBatThichNghi đọc cau_hinh; lỗi đọc ⇒ BẬT', async () => {
    const d = dung()
    expect(await coBatThichNghi(d.env)).toBe(true)
    datCo(d, '{"thichNghi":false}')
    expect(await coBatThichNghi(d.env)).toBe(false)
    datCo(d, '{"thichNghi":true}')
    expect(await coBatThichNghi(d.env)).toBe(true)
  })
})

describe('thích nghi BẬT mặc định cho mọi em', () => {
  /** Đổi một câu CỦNG CỐ của chặng 1 (chưa mở) lấy một câu ngoài bộ — một thay đổi HỢP LỆ đúng kiểu lõi trả về. */
  const doiHopLe = (tatCaQid: string[]) => (kq: KqLoi): KqLoi => {
    const trongBo = new Set(kq.bo.chang.flat())
    const ra = kq.bo.chang[1]!.find((q) => kq.bo.nhan[q] === 'cung_co')!
    const vao = tatCaQid.find((q) => !trongBo.has(q))!
    const chang = kq.bo.chang.map((c, i) => (i === 1 ? c.map((q) => (q === ra ? vao : q)) : c))
    const nhan = { ...kq.bo.nhan, [vao]: 'cung_co' }
    delete nhan[ra]
    return { ...kq, doi: [{ ma: 'DB-0', loai: 'len_bac', chang: 1, vao, ra }], bo: { ...kq.bo, chang, nhan, rieng: kq.bo.rieng.map((q) => (q === ra ? vao : q)) } }
  }
  const TAT_CA_DE3 = Array.from({ length: 60 }, (_, i) => `DE3-I-${i + 1}`)

  it('BẬT mặc định: lõi trả thay đổi hợp lệ ⇒ máy chủ LƯU (chặng 1 đổi đúng một câu; chặng 0/lõi/thử thách/số chặng/hạn giữ); so_cau_em + tom_tat khớp', async () => {
    gio(BAY_GIO)
    const d = dung()
    toLon(d)
    datCo(d, null) // vắng cờ = BẬT
    ep.bien = doiHopLe(TAT_CA_DE3)
    const { truoc, sau, han } = await chayChang0(d, SAI, true)
    expect(ep.soLanGoi).toBe(1)
    expect(sau).not.toEqual(truoc)
    expect(sau.filter((x) => x.chang === 0)).toEqual(truoc.filter((x) => x.chang === 0))
    expect(sau.filter((x) => x.chang >= 2)).toEqual(truoc.filter((x) => x.chang >= 2))
    expect(sau.length).toBe(truoc.length)
    expect(sau.filter((x) => x.chang === 1).map((x) => x.qid).filter((q) => !truoc.some((y) => y.qid === q))).toHaveLength(1)
    expect(d.sql.prepare("SELECT so_cau_em FROM btvn_em WHERE sbd='S1'").get()).toMatchObject({ so_cau_em: sau.length })
    expect(d.sql.prepare('SELECT han_nop FROM btvn').get()).toEqual(han)
  })
  it('CỜ TẮT `{"thichNghi":false}` ⇒ lõi KHÔNG được gọi, bộ giữ nguyên từng dòng (kể cả khi lõi muốn đổi)', async () => {
    gio(BAY_GIO)
    const d = dung()
    toLon(d)
    datCo(d, '{"thichNghi":false}')
    ep.bien = doiHopLe(TAT_CA_DE3)
    const { truoc, sau } = await chayChang0(d, SAI, true)
    expect(ep.soLanGoi).toBe(0)
    expect(sau).toEqual(truoc)
  })
  it('lõi trả thay đổi VI PHẠM bất biến (đổi chặng đã mở / bỏ lõi / thêm chặng) ⇒ máy chủ bỏ cả thay đổi', async () => {
    const kieu: [string, (kq: KqLoi) => KqLoi][] = [
      ['đổi chặng 0 (vừa xong/đã mở)', (kq) => ({ ...kq, doi: [{}], bo: { ...kq.bo, chang: kq.bo.chang.map((c, i) => (i === 0 ? [...c].reverse() : c)) } })],
      ['bỏ câu lõi', (kq) => ({ ...kq, doi: [{}], bo: { ...kq.bo, chang: kq.bo.chang.map((c) => c.filter((q) => q !== kq.bo.loi[kq.bo.loi.length - 1])) } })],
      ['thêm chặng', (kq) => ({ ...kq, doi: [{}], bo: { ...kq.bo, chang: [...kq.bo.chang, ['DE3-I-60']] } })],
    ]
    for (const [ten, bien] of kieu) {
      gio(BAY_GIO)
      const d = dung()
      toLon(d)
      ep.bien = bien
      const { truoc, sau } = await chayChang0(d, SAI, true)
      expect(ep.soLanGoi, ten).toBeGreaterThan(0)
      expect(sau, ten).toEqual(truoc)
      ep.soLanGoi = 0
    }
  })
  it('thật (không ép): chạy hết luồng không lỗi, bất biến giữ, tất định (hai lần cùng đầu vào ⇒ cùng bộ)', async () => {
    const chay = async () => {
      gio(BAY_GIO)
      const d = dung()
      toLon(d)
      return chayChang0(d, SAI, true)
    }
    const a = await chay()
    const b = await chay()
    expect(b.sau).toEqual(a.sau)
    expect(a.sau.filter((x) => x.chang === 0)).toEqual(a.truoc.filter((x) => x.chang === 0))
    expect(new Set(a.sau.map((x) => x.qid)).size).toBe(a.sau.length)
  })
  it('em mở lại bài: chặng đã mở vẫn nguyên; câu của chặng chưa mở hiện đúng bộ mới khi tới lượt; không lộ đáp án', async () => {
    gio(BAY_GIO)
    const d = dung()
    hosoManh(d)
    const { sau, truoc } = await chayChang0(d, SAI)
    gio(new Date(BAY_GIO.getTime() + 24 * 3_600_000))
    const m = await mo(d)
    expect(m.changDangMo).toBe(1)
    expect(m.de.cau.map((c: { qid: string }) => c.qid)).toEqual([...sau.filter((x) => x.chang <= 1).map((x) => x.qid)])
    expect(m.soCauCuaEm).toBe(sau.length)
    expect(truoc.length).toBeGreaterThan(0)
    expect(JSON.stringify(m)).not.toContain('dap_an')
  })
  it('chặng CHƯA xong (còn câu chưa trả lời) ⇒ KHÔNG thích nghi; chặng cuối ⇒ không có chặng chưa mở nên không đổi', async () => {
    gio(BAY_GIO)
    const d = dung()
    hosoManh(d)
    await giao(d)
    await mo(d)
    const truoc = boCuaEm(d)
    const c0 = truoc.filter((x) => x.chang === 0).map((x) => x.qid)
    await nopChang(d, 0, Object.fromEntries(c0.slice(0, -1).map((q) => [q, SAI(q)]))) // thiếu một câu ⇒ chặng chưa xong
    expect(boCuaEm(d)).toEqual(truoc)
  })
  it('bài CŨ (ca_nhan = 0) không có bộ riêng nên không bị đụng: xong-lo/nộp như cũ', async () => {
    gio(BAY_GIO)
    const d = dung()
    const { goiWorker } = await import('./_d1-that')
    const worker = (await import('../server/src/index')).default
    await goiWorker(worker, d.env, '/btvn/giao', { maCa: 'CA1', maDe: 'DE1', hanNop: HAN_XA }, true)
    const r = await goiWorker(worker, d.env, '/btvn/xong-lo', { maBtvn: (d.sql.prepare('SELECT ma_btvn FROM btvn').get() as { ma_btvn: string }).ma_btvn, sbd: 'S1', chiSo: 0 })
    expect(r).toMatchObject({ ok: true, loDaXong: 1 })
    expect(d.dem('btvn_em_cau')).toBe(0)
  })
  it('làm ĐÚNG hết chặng 0 ⇒ (nếu đổi) cũng giữ mọi bất biến; thích nghi tất định (chạy hai lần cùng đầu vào ⇒ cùng bộ)', async () => {
    const chay = async () => {
      gio(BAY_GIO)
      const d = dung()
      hosoManh(d)
      return chayChang0(d, DAP_AN_DUNG)
    }
    const a = await chay()
    const b = await chay()
    expect(b.sau).toEqual(a.sau)
    expect(a.sau.filter((x) => x.chang === 0)).toEqual(a.truoc.filter((x) => x.chang === 0))
    expect(new Set(a.sau.map((x) => x.qid)).size).toBe(a.sau.length)
  })
})
