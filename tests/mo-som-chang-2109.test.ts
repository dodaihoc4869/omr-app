// @vitest-environment node
// ĐIỀU 6 — MỞ SỚM CHẶNG (Dồn về đích/Đợt 3, Boss chốt phương án B): em đúng ≥ 80 % chặng vừa xong thì MỞ SỚM ĐÚNG 1 chặng kế trong ngày VN; hạn nộp KHÔNG đổi; EXP đúng nhịp không đổi (dungNhipTruoc giữ);
// thích nghi sau chặng chạy trước khi mở. Luật thuần: src/lib/mo-som-chang.ts (Code 1). SQLite thật.
import { afterEach, describe, expect, it, vi } from 'vitest'
import { BAY_GIO, DAP_AN_DUNG, boCuaEm, dung, giao, gio, mo, nopChang } from './_btvn-nang-do-mau'
import type { D1That } from './_d1-que'

afterEach(() => vi.useRealTimers())
const lichCua = (d: D1That) => JSON.parse((d.sql.prepare("SELECT chang_mo_json FROM btvn_em WHERE sbd='S1'").get() as { chang_mo_json: string }).chang_mo_json) as { chang: { moLuc: string; dungNhipTruoc?: string }[]; moSom?: { chiSo: number; luc: string }[] }
const qsChang = (d: D1That, k: number) => boCuaEm(d).filter((x) => x.chang === k).map((x) => x.qid)
const lam = (d: D1That, k: number, sai = 0) => nopChang(d, k, Object.fromEntries(qsChang(d, k).map((q, i) => [q, i < sai ? 'B' : DAP_AN_DUNG(q)]))) as Promise<any>

describe('mở sớm chặng kế', () => {
  it('đúng ≥ 80 % chặng 0 ⇒ chặng 1 mở NGAY (mốc đổi thành bây giờ), nộp được hôm nay; hạn nộp và dungNhipTruoc KHÔNG đổi; phản hồi có moSom + changDangMo = 1', async () => {
    gio(BAY_GIO)
    const d = dung(); await giao(d); await mo(d)
    const truoc = lichCua(d)
    const han0 = (d.sql.prepare('SELECT han_nop FROM btvn').get() as { han_nop: string }).han_nop
    expect(Date.parse(truoc.chang[1]!.moLuc)).toBeGreaterThan(BAY_GIO.getTime()) // chặng 1 vốn mở 00:00 ngày mai
    const r = await lam(d, 0)
    expect(r).toMatchObject({ ok: true, loDaXong: 1, changDangMo: 1, moSom: { duoc: true, lyDo: null } })
    expect(r.moSom.chu).toMatch(/Em làm tốt chặng 1 \(đúng \d+\/\d+\)\. Em được mở sớm chặng 2 ngay hôm nay\./)
    const sau = lichCua(d)
    expect(sau.chang[1]!.moLuc).toBe(BAY_GIO.toISOString())
    expect(sau.chang.map((c) => c.dungNhipTruoc)).toEqual(truoc.chang.map((c) => c.dungNhipTruoc)) // EXP đúng nhịp không đổi
    expect(sau.moSom).toEqual([{ chiSo: 1, luc: BAY_GIO.toISOString() }])
    expect((d.sql.prepare('SELECT han_nop FROM btvn').get() as { han_nop: string }).han_nop).toBe(han0)
    // chặng 1 làm được NGAY hôm nay
    expect(await lam(d, 1)).toMatchObject({ ok: true, loDaXong: 2 })
  })

  it('ĐÚNG 1 chặng/ngày VN: chặng 0 mở sớm chặng 1; xong chặng 1 ngay cũng KHÔNG mở sớm chặng 2 hôm nay (da_mo_som_hom_nay); sang ngày mới (chặng đúng ≥ 80 %) lại được mở sớm', async () => {
    gio(BAY_GIO)
    const d = dung(); await giao(d); await mo(d)
    await lam(d, 0)
    const r1 = await lam(d, 1)
    expect(r1).toMatchObject({ ok: true, loDaXong: 2, moSom: { duoc: false, lyDo: 'da_mo_som_hom_nay' } })
    expect(r1.moSom.chu).toContain('mở 00:00 ngày mai')
    expect(lichCua(d).moSom).toHaveLength(1)
    // NGÀY SAU (chặng 2 vốn mở 00:00 ngày +2): làm chặng 2 chưa được — nhưng bài mới ở ngày +1 của em khác: dùng ngày +2 để chặng 2 đã mở, làm xong ⇒ chặng 3 (mở 00:00 ngày +3) được mở sớm
    gio(new Date(BAY_GIO.getTime() + 2 * 24 * 3_600_000))
    const r2 = await lam(d, 2)
    expect(r2).toMatchObject({ ok: true, loDaXong: 3, moSom: { duoc: true, lyDo: null } }) // hôm nay chưa mở sớm chặng nào ⇒ được
    expect(lichCua(d).moSom).toHaveLength(2)
    expect(await lam(d, 3)).toMatchObject({ ok: true, loDaXong: 4 }) // chặng 3 làm được ngay hôm nay
  })

  it('chặng kế ĐÃ mở sẵn theo lịch (đang nợ / tới giờ) ⇒ không cần mở sớm, không ghi moSom, không tốn hạn mức', async () => {
    gio(BAY_GIO)
    const d = dung(); await giao(d); await mo(d)
    gio(new Date(BAY_GIO.getTime() + 24 * 3_600_000)) // đã sang ngày +1: chặng 1 đã mở theo lịch
    const r = await lam(d, 0)
    expect(r).toMatchObject({ ok: true, loDaXong: 1, moSom: { duoc: false, lyDo: 'da_mo_san' } })
    expect(lichCua(d).moSom).toBeUndefined()
  })

  it('đúng dưới 80 % ⇒ KHÔNG mở sớm (chua_du_ti_le), chặng kế vẫn mở 00:00 ngày mai; lời nói thật', async () => {
    gio(BAY_GIO)
    const d = dung(); await giao(d); await mo(d)
    const n = qsChang(d, 0).length
    const r = await lam(d, 0, Math.max(1, Math.ceil(n * 0.5)))
    expect(r).toMatchObject({ ok: true, loDaXong: 1, moSom: { duoc: false, lyDo: 'chua_du_ti_le' } })
    expect(r.changDangMo).toBeNull()
    expect(lichCua(d).moSom).toBeUndefined()
    expect(await lam(d, 1)).toMatchObject({ ok: false, lyDo: 'chang_chua_mo' })
  })

  it("cờ LÙI NHANH `cau_hinh.btvn_mo_som = 'tat'` ⇒ không mở sớm (chặng kế chỉ mở theo lịch như trước), không moSom", async () => {
    gio(BAY_GIO)
    const d = dung(); await giao(d); await mo(d)
    d.sql.prepare("INSERT INTO cau_hinh(khoa,gia_tri,cap_nhat_luc) VALUES('btvn_mo_som','tat','x')").run()
    const r = await lam(d, 0)
    expect(r).toMatchObject({ ok: true, loDaXong: 1, changDangMo: null }); expect(r).not.toHaveProperty('moSom')
    expect(lichCua(d).moSom).toBeUndefined()
  })

  it('chặng CUỐI xong ⇒ không có moSom (het_chang không phát ra: đã tự nộp); lịch hỏng/thiếu ⇒ không mở sớm, không lỗi', async () => {
    gio(BAY_GIO)
    const d = dung(); await giao(d); await mo(d)
    d.sql.exec("UPDATE btvn_em SET chang_mo_json = NULL WHERE sbd='S1'") // bài chốt trước bản 1.1: không có lịch lưu
    const r = await lam(d, 0)
    expect(r.ok).toBe(true); expect(r).not.toHaveProperty('moSom')
  })
})
