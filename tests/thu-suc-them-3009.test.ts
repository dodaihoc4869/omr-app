// @vitest-environment node
// LUẬT THẦY 05/10 ("chặn chuẩn 100% không được rút nhầm kho khác khối"): kênh tự động chặn câu KHÔNG RÕ khối ⇒ câu trong kho giả ghi khối `lop` (đúng khối em).
// THỬ SỨC THÊM (thầy chốt 30/09): chiến dịch bật "Rải đều câu mới" ⇒ em chăm làm xong kế hoạch hôm nay rất sớm (thật: SBD 11084 chỉ 8/49 lượt).
// Nút "Thử sức thêm (không bắt buộc)": xong kế hoạch + đã mở rương ⇒ lấy TRƯỚC một lô câu mới của NGÀY MAI = min(quota ngày mai theo rải đều, trần − tong).
// D1 thật = node:sqlite (mẫu tests/srs2-rai-deu-d1-3009.test.ts, tests/sanh2-tam-giu-3009.test.ts).
import { beforeEach, describe, expect, it } from 'vitest'
import { taoD1That } from './_d1-that'
import { gvChienDich } from '../server/src/srs2-gv'
import { layKeHoachHomNay, qidGoc, sanh2, thuSucThem, tranKeHoachHomNay, xoaDemChienDich, type ChienDich } from '../server/src/srs2-d1'
import { coLoThuSucThem, quotaCauMoi } from '../server/src/srs2-loi'
import { hoa2Action, startDao2 } from '../server/src/srs2-game'
import { biaAction } from '../server/src/bi-a'
import { xoaDemCaBaoVe } from '../server/src/game-v2-bank'
import { ghiSuKien } from '../server/src/su-kien-hoc'
import type { Env } from '../server/src/kieu'

const NGAY = 86_400_000
const T0 = Date.parse('2026-09-29T03:00:00Z') // 10:00 VN thứ Ba 29/09
const HAN = '2026-10-05' // D = 7 tính từ 29/09 ⇒ ngày giao câu mới cuối = 02/10 (D = 4)
const ngayCua = (ms: number) => new Date(ms + 7 * 3_600_000).toISOString().slice(0, 10)

function cauJson(qid: string) {
  return JSON.stringify({ qid, maDe: 'DE1', lop: '12', version: 'v1', group: `g-${qid}`, phan: 'I', text: `Câu ${qid}`, choices: ['a', 'b', 'c', 'd'], ideas: [], hinhAnh: [], dang: 'D1', tenDang: 'Dạng 1', mucDo: 'NB', sao: 1, kienThuc: ['k'], correct: 'B', reviewed: true, solution: { chot: 'c' } })
}
function dung(soCau = 120) {
  const d = taoD1That()
  const env = d.env as unknown as Env
  d.sql.exec("INSERT INTO hoc_sinh(sbd,ho_ten,lop,mat_khau,cap_nhat_luc) VALUES('S1','Nguyễn An','12A1','mk1','x')")
  d.sql.exec(`INSERT INTO de_kho(ma_de,ten_de,so_cau,da_xoa,cap_nhat_luc) VALUES('DE1','Ester',${soCau},0,'v1')`)
  d.sql.exec("INSERT INTO game_v2_index(ma_de,source_version,indexed_at) VALUES('DE1','v1','x')")
  const st = d.sql.prepare('INSERT INTO game_v2_question(ma_de,qid,version,content_group,dang,json) VALUES(?,?,?,?,?,?)')
  for (let i = 1; i <= soCau; i++) st.run('DE1', `Q${i}`, 'v1', `g-Q${i}`, 'D1', cauJson(`Q${i}`))
  d.sql.exec(`INSERT INTO cau_hinh(khoa,gia_tri,cap_nhat_luc) VALUES('game_hoa_2','{"bat":true,"lop":["12A1"]}','x')`)
  return { d, env }
}
type D = ReturnType<typeof dung>['d']
async function tao(env: Env, them: Record<string, unknown> = {}) {
  const r = await gvChienDich(env, { action: 'tao', ten: 'Ester – Lipid', lop: '12A1', maDe: ['DE1'], hanNop: HAN, theLucNgay: 49, ...them }, T0)
  expect(r.ok).toBe(true)
  return String(r.id)
}
/** Em làm ĐÚNG mọi câu còn lại của kế hoạch hôm nay (mỗi khoá một lần làm; `qid#2` = lần thứ hai). Trả các khoá vừa làm. */
async function lamHet(env: Env, nay: number): Promise<string[]> {
  const { kh } = await layKeHoachHomNay(env, 'S1', nay)
  const khoa = [...kh.conDoan, ...kh.conDao]
  if (khoa.length) await ghiSuKien(env, khoa.map((k, i) => ({ nguon: 'game' as const, maNguon: `phien-${k}-${nay}-${i}`, sbd: 'S1', qid: qidGoc(k), lan: 1, ketQua: 1 as const, luc: new Date(nay).toISOString() })))
  return khoa
}
const moRuong = (env: Env, nay: number) => hoa2Action(env, 'S1', 'hoa2-ruong-mo', {}, nay)
const tss = async (env: Env, nay: number) => (await sanh2(env, 'S1', nay)).thuSucThem as { duoc: boolean; soCau: number }
const hang = (d: D, ngay = '2026-09-29') => d.sql.prepare("SELECT dao_json, doan_json, tong FROM srs2_ke_hoach WHERE sbd = 'S1' AND ngay = ?").get(ngay) as { dao_json: string; doan_json: string; tong: number }
const khoaCua = (d: D, ngay = '2026-09-29') => { const h = hang(d, ngay); return [...JSON.parse(h.dao_json), ...JSON.parse(h.doan_json)] as string[] }
/** Làm hết kế hoạch 29/09 rồi mở rương (bước chung của hầu hết ca). */
async function xongVaMoRuong(env: Env, nay = T0) {
  await lamHet(env, nay)
  const r = await moRuong(env, nay)
  expect(r).toMatchObject({ ok: true, lapLai: false })
}

beforeEach(() => { xoaDemCaBaoVe(); xoaDemChienDich() })

describe('công thức (lõi thuần)', () => {
  it('quotaCauMoi = ceil(mới/(D−3)); ba ngày ôn cuối ⇒ mọi câu mới còn lại', () => {
    expect(quotaCauMoi(120, 7)).toBe(30)
    expect(quotaCauMoi(90, 6)).toBe(30)
    expect(quotaCauMoi(71, 6)).toBe(24)
    expect(quotaCauMoi(5, 3)).toBe(5)
    expect(quotaCauMoi(0, 7)).toBe(0)
  })
  it('coLoThuSucThem = min(quota NGÀY MAI, trần − tong); hôm nay là hạn nộp ⇒ 0', () => {
    expect(coLoThuSucThem(90, '2026-09-29', HAN, 30, 49)).toBe(19) // quota mai ceil(90/3) = 30, còn chỗ 19
    expect(coLoThuSucThem(45, '2026-09-29', HAN, 15, 49)).toBe(15) // quota mai ceil(45/3) = 15 < 34
    expect(coLoThuSucThem(10, '2026-10-04', HAN, 5, 49)).toBe(10) // mai = hạn (D = 1) ⇒ quota = mọi câu mới
    expect(coLoThuSucThem(10, HAN, HAN, 5, 49)).toBe(0) // không còn ngày mai
    expect(coLoThuSucThem(90, '2026-09-29', HAN, 49, 49)).toBe(0) // đủ trần
  })
  it('trần hôm nay: ngày thường = thể lực; ngày Huyết Chiến = trần Huyết Chiến hiện hành (tắt Huyết Chiến ⇒ thể lực)', () => {
    const cd = { theLucNgay: 49, huyetChien: true } as ChienDich
    expect(tranKeHoachHomNay(cd, false)).toBe(49)
    expect(tranKeHoachHomNay(cd, true)).toBe(98)
    expect(tranKeHoachHomNay({ ...cd, huyetChien: false }, true)).toBe(49)
  })
})

describe('điều kiện hiện nút', () => {
  it('(1) kế hoạch còn câu ⇒ không được; lệnh trả chua_xong, KHÔNG ghi gì', async () => {
    const { d, env } = dung()
    await tao(env)
    expect(await tss(env, T0)).toEqual({ duoc: false, soCau: 0 })
    const truoc = hang(d)
    const r = await thuSucThem(env, 'S1', T0)
    expect(r).toMatchObject({ ok: false, ma: 'chua_xong' })
    expect(hang(d)).toEqual(truoc)
  })
  it('(2) xong kế hoạch nhưng CHƯA mở rương ⇒ không được (chua_mo_ruong); mở rương ⇒ được, soCau = min(quota mai 30, 49 − 30) = 19', async () => {
    const { env } = dung()
    await tao(env)
    await lamHet(env, T0)
    expect(await tss(env, T0)).toEqual({ duoc: false, soCau: 0 })
    expect(await thuSucThem(env, 'S1', T0)).toMatchObject({ ok: false, ma: 'chua_mo_ruong' })
    await moRuong(env, T0)
    expect(await tss(env, T0)).toEqual({ duoc: true, soCau: 19 })
  })
  it('(3) không có chiến dịch ⇒ không được', async () => {
    const { env } = dung()
    expect(await tss(env, T0)).toEqual({ duoc: false, soCau: 0 })
    expect(await thuSucThem(env, 'S1', T0)).toMatchObject({ ok: false, ma: 'chua_co_chien_dich' })
  })
  it('(4a) hết câu mới (ba ngày ôn cuối đã giao hết) ⇒ không hiện nút', async () => {
    const { env } = dung(20)
    await tao(env, { hanNop: '2026-10-01' }) // D = 3 ⇒ quota = mọi câu mới
    await xongVaMoRuong(env)
    expect(await tss(env, T0)).toEqual({ duoc: false, soCau: 0 })
    expect(await thuSucThem(env, 'S1', T0)).toMatchObject({ ok: false, ma: 'het_cau_moi' })
  })
  it('(4b) hôm nay là hạn nộp ⇒ không còn "ngày mai" để lấy trước', async () => {
    const { env } = dung()
    await tao(env, { hanNop: '2026-09-29' })
    await xongVaMoRuong(env)
    expect(await tss(env, T0)).toEqual({ duoc: false, soCau: 0 })
    expect(await thuSucThem(env, 'S1', T0)).toMatchObject({ ok: false, ma: 'het_ngay' })
  })
})

describe('cỡ lô, trần, bấm nhiều lần', () => {
  it('(5) 60 câu, thể lực 49: lô 15 → 10 → 7 → 2 rồi hết trần; tong không vượt 49; lô chỉ câu MỚI, vào Đảo, không trùng; Đảo phát đúng câu của lô', async () => {
    const { d, env } = dung(60)
    await tao(env)
    expect((await layKeHoachHomNay(env, 'S1', T0)).kh.tong).toBe(15) // ceil(60/4)
    await xongVaMoRuong(env)
    const loDaThay: number[] = []
    for (let lan = 0; lan < 6; lan++) {
      const t = await tss(env, T0)
      if (!t.duoc) break
      const truoc = khoaCua(d)
      const r = await thuSucThem(env, 'S1', T0)
      expect(r).toMatchObject({ ok: true, them: t.soCau })
      const sau = khoaCua(d)
      const lo = sau.slice(truoc.length)
      expect(lo).toHaveLength(t.soCau)
      expect(JSON.parse(hang(d).doan_json)).toEqual([]) // lô vào Đảo (câu mới)
      expect(new Set(sau.map(qidGoc)).size).toBe(sau.length) // không trùng câu
      expect(hang(d).tong).toBe(sau.length)
      expect(hang(d).tong).toBeLessThanOrEqual(49)
      // Sảnh: còn đúng lô, không được bấm tiếp tới khi làm xong; Đảo phát câu của lô
      const s = await sanh2(env, 'S1', T0)
      expect(s.theLuc).toEqual({ con: t.soCau, tong: sau.length })
      expect(s.thuSucThem).toEqual({ duoc: false, soCau: 0 })
      expect(await thuSucThem(env, 'S1', T0)).toMatchObject({ ok: false, ma: 'chua_xong' })
      if (lan === 0) {
        const dao = await startDao2(env, 'S1', T0)
        const qs = (dao.questions as { qid: string }[]).map((q) => q.qid)
        expect(qs.length).toBeGreaterThan(0)
        for (const q of qs) expect(lo).toContain(q)
      }
      loDaThay.push(t.soCau)
      await lamHet(env, T0)
    }
    expect(loDaThay).toEqual([15, 10, 7, 2]) // mới còn 45→30→20→13: ceil(45/3)=15, ceil(30/3)=10, ceil(20/3)=7, min(ceil(13/3)=5, 49−47=2)
    expect(hang(d).tong).toBe(49)
    expect(await tss(env, T0)).toEqual({ duoc: false, soCau: 0 })
    expect(await thuSucThem(env, 'S1', T0)).toMatchObject({ ok: false, ma: 'du_tran' })
  })
})

describe('bộ lọc câu', () => {
  it('(6) câu tự luận / đã rút khỏi kho / đang bảo vệ cho ca KHÔNG vào lô; cỡ lô tính trên câu lấy được', async () => {
    const { d, env } = dung(60)
    await tao(env)
    await xongVaMoRuong(env)
    const daLam = new Set(khoaCua(d).map(qidGoc))
    const conMoi = Array.from({ length: 60 }, (_, i) => `Q${i + 1}`).filter((q) => !daLam.has(q))
    expect(conMoi).toHaveLength(45)
    const tuLuan = conMoi.slice(0, 15), rut = conMoi.slice(15, 20), baoVe = conMoi.slice(20, 40), duoc = conMoi.slice(40)
    // Tự luận (luật #107: Phần III đáp án công thức) — lập lại chỉ mục đổi version như thật; rút khỏi kho = xoá dòng chỉ mục.
    for (const q of tuLuan) d.sql.prepare("UPDATE game_v2_question SET version = 'v2', json = json_set(json, '$.version', 'v2', '$.phan', 'III', '$.choices', json('[]'), '$.correct', 'Fe3O4') WHERE qid = ?").run(q)
    for (const q of rut) d.sql.prepare('DELETE FROM game_v2_question WHERE qid = ?').run(q)
    d.objects.set('de/CA-MO.json', { phanI: baoVe.map((id) => ({ id, text: id, choices: ['a', 'b', 'c', 'd'], correct: 'B' })), phanII: [], phanIII: [] })
    d.sql.prepare(`INSERT INTO ca(ma_ca,ten_ca,trang_thai,bat_dau,het_han_vao,thoi_gian_phut,loai,cong_bo,bank_r2,cap_nhat_luc) VALUES('CA-MO','Ca giữa kỳ','mo',?,?,45,'thi','ca_lop_xong','de/CA-MO.json',?)`)
      .run(new Date(Date.now() - 60_000).toISOString(), new Date(Date.now() + 30 * 60_000).toISOString(), new Date(Date.now()).toISOString())
    xoaDemCaBaoVe()
    // Mới còn (đúng tập ngày mai thấy) = 45 − 15 tự luận − 5 rút = 25 ⇒ quota mai ceil(25/3) = 9; lấy được ngay chỉ 5 (20 câu đang bảo vệ) ⇒ lô 5.
    expect(await tss(env, T0)).toEqual({ duoc: true, soCau: 5 })
    const truoc = khoaCua(d)
    expect(await thuSucThem(env, 'S1', T0)).toMatchObject({ ok: true, them: 5 })
    const lo = khoaCua(d).slice(truoc.length)
    expect([...lo].sort()).toEqual([...duoc].sort())
    for (const q of [...tuLuan, ...rut, ...baoVe]) expect(lo).not.toContain(q)
  })
})

describe('tranh chấp', () => {
  it('(7) hai lần bấm CÙNG LÚC ⇒ chỉ MỘT lô (19 câu), không nhân đôi', async () => {
    const { d, env } = dung()
    await tao(env)
    await xongVaMoRuong(env)
    const [a, b] = await Promise.all([thuSucThem(env, 'S1', T0), thuSucThem(env, 'S1', T0)])
    const them = [a, b].map((r) => (r.ok === true ? Number(r.them) : 0))
    expect(them.reduce((x, y) => x + y, 0)).toBe(19)
    expect(them).toContain(0)
    const k = khoaCua(d)
    expect(k).toHaveLength(49)
    expect(new Set(k).size).toBe(49)
    expect(hang(d).tong).toBe(49)
  })
  it('(8) máy khác vừa ghi kế hoạch giữa lúc đọc và ghi ⇒ KHÔNG ghi (so khớp thua), trả them 0 để tải lại', async () => {
    const { d, env } = dung()
    await tao(env)
    await xongVaMoRuong(env)
    const goc = env.DB.prepare.bind(env.DB)
    let chen = false
    ;(env.DB as { prepare: typeof goc }).prepare = (q: string) => {
      if (!chen && q.startsWith('SELECT dao_json, doan_json FROM srs2_ke_hoach')) {
        chen = true
        const h = hang(d)
        d.sql.prepare("UPDATE srs2_ke_hoach SET dao_json = ?, tong = ? WHERE sbd = 'S1' AND ngay = '2026-09-29'").run(JSON.stringify([...JSON.parse(h.dao_json), 'Q120']), h.tong + 1)
      }
      return goc(q)
    }
    const r = await thuSucThem(env, 'S1', T0)
    expect(chen).toBe(true)
    expect(r).toEqual({ ok: true, them: 0, lapLai: true })
    expect(khoaCua(d)).toHaveLength(31) // chỉ câu máy kia thêm
  })
})

describe('rương không khoá lại', () => {
  it('(9) thêm lô sau khi mở rương: Sảnh vẫn daMo; mở rương lần nữa ⇒ lapLai, KHÔNG cộng vàng lần hai; làm xong lô ⇒ vẫn đã mở', async () => {
    const { d, env } = dung()
    await tao(env)
    await xongVaMoRuong(env)
    expect(await thuSucThem(env, 'S1', T0)).toMatchObject({ ok: true, them: 19 })
    const s = await sanh2(env, 'S1', T0)
    expect(s.ruong).toMatchObject({ daLam: 30, tong: 49, daMo: true, qua: { vang: 20 } })
    expect(await moRuong(env, T0)).toMatchObject({ ok: true, lapLai: true, qua: { vang: 20 } })
    await lamHet(env, T0)
    const sau = await sanh2(env, 'S1', T0)
    expect(sau.ruong).toMatchObject({ daLam: 49, tong: 49, daMo: true })
    expect(await moRuong(env, T0)).toMatchObject({ ok: true, lapLai: true })
    expect(d.dem('ruong_bat_linh')).toBe(1)
    expect(d.dem('vang_so', "khoa_yeu_cau = 'ruong-2026-09-29'")).toBe(1)
  })
})

describe('Bi-a: trần 40% theo tong mới', () => {
  it('(10) sau lô: trần Bi-a = floor(40% × 49) = 19, không vượt số câu còn lại của kế hoạch', async () => {
    const { d, env } = dung()
    d.sql.exec(`INSERT INTO cau_hinh(khoa,gia_tri,cap_nhat_luc) VALUES('bi_a','{"bat":true,"lop":["12A1"]}','x')`)
    await tao(env)
    await xongVaMoRuong(env)
    const truoc = await biaAction(env, 'S1', 'bia-sanh', {}, T0)
    expect(truoc.lyDoKhoa).toBe('xong_ke_hoach')
    await thuSucThem(env, 'S1', T0)
    const s = await biaAction(env, 'S1', 'bia-sanh', {}, T0)
    expect(s).not.toHaveProperty('lyDoKhoa')
    const tran = s.tran as { con: number; tong: number; tranMoi: number; tranOn: number }
    expect(tran.tong).toBe(19)
    expect(tran.tranMoi + tran.tranOn).toBe(19)
    expect(tran.con).toBeLessThanOrEqual((s.theLuc as { con: number }).con)
    expect(s.theLuc).toEqual({ con: 19, tong: 49 })
  })
})

describe('ngày mai tự giảm quota — tổng câu mới cả chiến dịch không đổi, không quá hạn', () => {
  it('(11) lấy trước 19 câu hôm nay ⇒ ngày mai quota = ceil(71/3) = 24 (không lấy trước: ceil(90/3) = 30)', async () => {
    const co = dung()
    await tao(co.env)
    await xongVaMoRuong(co.env)
    await thuSucThem(co.env, 'S1', T0)
    await lamHet(co.env, T0)
    const mai = await layKeHoachHomNay(co.env, 'S1', T0 + NGAY)
    expect(mai.kh.tong).toBe(24)

    const khong = dung()
    await tao(khong.env)
    await xongVaMoRuong(khong.env)
    await lamHet(khong.env, T0)
    expect((await layKeHoachHomNay(khong.env, 'S1', T0 + NGAY)).kh.tong).toBe(30)
  })

  /** Mô phỏng cả chiến dịch 29/09 → 05/10: ngày nào cũng làm hết (đúng hết), mở rương; `thuSuc` ⇒ bấm Thử sức thêm tới trần. */
  async function moPhong(thuSuc: boolean) {
    const { d, env } = dung()
    await tao(env)
    const lanDau = new Map<string, string>()
    const moiTheoNgay: Record<string, number> = {}
    for (let i = 0; i <= 6; i++) {
      const nay = T0 + i * NGAY
      const ngay = ngayCua(nay)
      xoaDemChienDich()
      const ghi = (khoa: string[]) => { for (const k of khoa) if (!lanDau.has(qidGoc(k))) { lanDau.set(qidGoc(k), ngay); moiTheoNgay[ngay] = (moiTheoNgay[ngay] ?? 0) + 1 } }
      ghi(await lamHet(env, nay))
      ghi(await lamHet(env, nay)) // ngày cuối: phần bổ sung (nếu có)
      await moRuong(env, nay)
      for (let n = 0; thuSuc && n < 10 && (await tss(env, nay)).duoc; n++) {
        expect(await thuSucThem(env, 'S1', nay)).toMatchObject({ ok: true })
        ghi(await lamHet(env, nay))
      }
      const h = d.sql.prepare("SELECT tong, dao_json, doan_json FROM srs2_ke_hoach WHERE sbd = 'S1' AND ngay = ?").get(ngay) as { tong: number } | undefined
      if (h) expect(h.tong).toBeLessThanOrEqual(49)
    }
    return { lanDau, moiTheoNgay }
  }

  it('(12) mô phỏng 7 ngày: có/không Thử sức thêm đều giao ĐỦ 120 câu mới, mỗi câu một lần, câu mới cuối cùng ≤ hạn − 3 (02/10)', async () => {
    for (const thuSuc of [false, true]) {
      const { lanDau, moiTheoNgay } = await moPhong(thuSuc)
      expect(lanDau.size).toBe(120)
      expect(Object.values(moiTheoNgay).reduce((a, b) => a + b, 0)).toBe(120)
      expect([...lanDau.values()].every((n) => n <= '2026-10-02')).toBe(true)
      if (thuSuc) expect(moiTheoNgay['2026-09-29']).toBe(49) // 30 + lô 19
      else expect(moiTheoNgay['2026-09-29']).toBe(30)
    }
  })
})
