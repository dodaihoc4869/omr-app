// @vitest-environment node
// PHẢN BIỆN #108 (vòng 1, 30/09) — khoá các lỗ hổng của bản sửa "Chưa tải được câu hôm nay" / rương kẹt 48/49 + rải đều câu mới:
// (K1/SOÁT) câu không phục vụ được giữa ngày ⇒ CHỈ thay đúng câu ấy (mới thay mới, ôn thay ôn), KHÔNG lập lại cả ngày theo cờ rải đều hiện tại —
//          "kế hoạch đã chốt hôm nay không đổi"; Huyết Chiến đã chốt giữ nguyên.
// (K2/K2b/K3) kế hoạch và game dùng CÙNG một phép kiểm tự luận (`laCauTuLuan` trên câu của chỉ mục) ⇒ phương án rỗng chữ không lọt; Đảo–Đoàn không khoá vòng.
// (vang) câu vắng khi nạp mà meta còn ⇒ lỗi tạm `chua_nap_duoc`, không "xong" trái với Sảnh.
// (CAS) ghi kế hoạch giữa ngày chỉ khi bản ghi chưa bị máy khác đổi.
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { taoD1That } from './_d1-that'
import { gvChienDich } from '../server/src/srs2-gv'
import { docMetaCau, layKeHoachHomNay, qidGoc, sanh2, tuLuanTuMeta, xoaDemChienDich } from '../server/src/srs2-d1'
import { boQuaMoi, logChuaNap, lyDoLuotRong, startDao2, startDoan2 } from '../server/src/srs2-game'
import { laCauTuLuan } from '../server/src/cam-tu-luan'
import { xoaDemCaBaoVe } from '../server/src/game-v2-bank'
import { ghiSuKien, type SuKien } from '../server/src/su-kien-hoc'
import type { Env } from '../server/src/kieu'

const NGAY = 86_400_000
const LOI_CHUA_NAP = 'Chưa tải được câu hôm nay'

function cauJson(qid: string, phan: 'I' | 'II' | 'III', mucDo: string, dang: string, correct: string) {
  return JSON.stringify({
    qid, maDe: 'DE1', version: 'v1', group: `g-${qid}`, phan, text: `Câu ${qid}`, choices: phan === 'I' ? ['a', 'b', 'c', 'd'] : [], ideas: phan === 'II' ? ['a', 'b', 'c', 'd'] : [],
    hinhAnh: [], dang, tenDang: `Dạng ${dang}`, mucDo, sao: 1, kienThuc: ['k'], correct, reviewed: true, solution: { chot: `Cốt lõi ${qid}` },
  })
}
const dapAn = (i: number) => (i % 4 === 0 ? 'DSDS' : i % 5 === 0 ? '4' : 'B')

function fixture(soCau = 30) {
  const d = taoD1That()
  const env = d.env as unknown as Env
  d.sql.exec("INSERT INTO hoc_sinh(sbd,ho_ten,lop,mat_khau,cap_nhat_luc) VALUES('S1','Nguyễn An','12A1','mk1','x')")
  d.sql.exec(`INSERT INTO de_kho(ma_de,ten_de,so_cau,da_xoa,cap_nhat_luc) VALUES('DE1','Ester',${soCau},0,'v1')`)
  d.sql.exec("INSERT INTO game_v2_index(ma_de,source_version,indexed_at) VALUES('DE1','v1','x')")
  const st = d.sql.prepare('INSERT INTO game_v2_question(ma_de,qid,version,content_group,dang,json) VALUES(?,?,?,?,?,?)')
  for (let i = 1; i <= soCau; i++) {
    const phan = i % 4 === 0 ? 'II' : i % 5 === 0 ? 'III' : 'I'
    st.run('DE1', `Q${i}`, 'v1', `g-Q${i}`, `D${i % 3}`, cauJson(`Q${i}`, phan, ['NB', 'TH', 'VD'][i % 3]!, `D${i % 3}`, dapAn(i)))
  }
  d.sql.exec(`INSERT INTO cau_hinh(khoa,gia_tri,cap_nhat_luc) VALUES('game_hoa_2','{"bat":true,"lop":["12A1"]}','x')`)
  d.sql.exec(`INSERT INTO cau_hinh(khoa,gia_tri,cap_nhat_luc) VALUES('bi_a','{"bat":true,"lop":["12A1"]}','x')`)
  return { d, env }
}
type D = ReturnType<typeof fixture>['d']
/** Giao chiến dịch tạo 3 ngày trước, hạn `soNgayHan` ngày sau hôm nay (D = soNgayHan + 1). Rải đều mặc định BẬT (thầy 30/09), trừ khi `raiDeu: false`. */
async function giao(env: Env, o: { theLucNgay?: number; soNgayHan?: number; raiDeu?: boolean } = {}) {
  const nay = Date.now()
  const r = await gvChienDich(env, { action: 'tao', ten: 'Ester – Lipid', lop: '12A1', maDe: ['DE1'], hanNop: new Date(nay + (o.soNgayHan ?? 5) * NGAY).toISOString().slice(0, 10), ...(o.theLucNgay ? { theLucNgay: o.theLucNgay } : {}), ...(o.raiDeu === false ? { raiDeu: false } : {}) }, nay - 3 * NGAY)
  expect(r.ok).toBe(true)
}
const suKien = (qid: string, msLuc: number, dung: boolean): SuKien => ({ nguon: 'game', maNguon: `phien-${qid}-${msLuc}`, sbd: 'S1', qid, lan: 1, ketQua: dung ? 1 : 0, luc: new Date(msLuc).toISOString() })
async function lamXong(env: Env, qids: string[], nay: number) { if (qids.length) await ghiSuKien(env, qids.map((q) => suKien(q, nay, true))) }
/** Chốt kế hoạch hôm nay rồi làm xong mọi câu trừ `soGiu` câu cuối (như em 11084: 48/49). Trả các câu còn lại + tổng kế hoạch đã chốt. */
async function conLai(env: Env, soGiu: number, nay: number): Promise<{ giu: string[]; tong: number }> {
  const { kh } = await layKeHoachHomNay(env, 'S1', nay)
  expect(kh.conDoan).toEqual([])
  const ds = kh.conDao.map(qidGoc)
  const giu = ds.slice(-soGiu)
  await lamXong(env, ds.filter((q) => !giu.includes(q)), nay)
  return { giu, tong: kh.tong }
}
/** Sau khi lập lại chỉ mục với #107: câu mang nhãn kho `kieu: 'tu_luan'` được gắn cờ `tuLuan` — version KHÔNG đổi (versionCau bỏ cờ này). */
const gatCoTuLuan = (d: D, qid: string) => d.sql.prepare("UPDATE game_v2_question SET json = json_set(json, '$.tuLuan', json('true')) WHERE qid = ?").run(qid)
/** Luật mới #107: Phần III đáp án không đọc được thành MỘT số (công thức) ⇒ tự luận. Đổi cả cột version lẫn JSON như lập lại chỉ mục thật (chỉ mục CŨ: không có cờ `tuLuan`). */
const thanhPhanIIICongThuc = (d: D, qid: string) =>
  d.sql.prepare("UPDATE game_v2_question SET version = 'v2', json = json_set(json, '$.version', 'v2', '$.phan', 'III', '$.choices', json('[]'), '$.ideas', json('[]'), '$.correct', 'Fe3O4') WHERE qid = ?").run(qid)
const qidsCua = (r: Record<string, unknown>) => ((r.questions as { qid: string }[]) ?? []).map((q) => q.qid)
const ruong = (s: Record<string, unknown>) => s.ruong as { daLam: number; tong: number; moDuoc: boolean }


beforeEach(() => { xoaDemCaBaoVe(); xoaDemChienDich() })

const tatCaQid = (kh: { dao: string[]; doan: string[] }) => [...kh.dao, ...kh.doan].map(qidGoc)
const hangKeHoach = (d: D) => d.sql.prepare("SELECT dao_json, doan_json, tong, huyet_chien FROM srs2_ke_hoach WHERE sbd = 'S1'").get() as { dao_json: string; doan_json: string; tong: number; huyet_chien: number }
const PA_RONG = JSON.stringify(['a', 'b', 'c', ''])

describe('K1 / SOÁT #108 — câu hỏng giữa ngày: chỉ thay đúng câu ấy, không lập lại cả ngày theo cờ rải đều hiện tại', () => {
  it('chiến dịch TẮT rải đều, kế hoạch chốt 40, em làm 5; thầy BẬT rải đều; 1 câu còn lại thành tự luận ⇒ tong vẫn 40, chỉ câu hỏng bị thay (bằng câu MỚI)', async () => {
    const { d, env } = fixture(60)
    await giao(env, { theLucNgay: 40, soNgayHan: 7, raiDeu: false })
    const nay = Date.now()
    const { kh: truoc } = await layKeHoachHomNay(env, 'S1', nay)
    expect(truoc.tong).toBe(40)
    const ds = truoc.conDao.map(qidGoc)
    await lamXong(env, ds.slice(0, 5), nay)
    const bang = (await gvChienDich(env, { action: 'danh-sach' }, nay)) as Record<string, unknown>
    const id = ((bang.ds ?? bang.chienDich ?? []) as { id: string }[])[0]!.id
    expect((await gvChienDich(env, { action: 'rai-deu', id, bat: true }, nay)).ok).toBe(true)
    const { kh: giua } = await layKeHoachHomNay(env, 'S1', nay)
    expect(giua.tong).toBe(40) // đổi công tắc KHÔNG đụng kế hoạch đã chốt hôm nay
    const hong = ds[ds.length - 1]!
    gatCoTuLuan(d, hong)
    const { kh: sau } = await layKeHoachHomNay(env, 'S1', nay)
    expect(sau.tong).toBe(40)
    expect(sau.tamHoan).toBeUndefined()
    const q = tatCaQid(sau)
    expect(q).not.toContain(hong)
    expect(q.filter((x) => !tatCaQid(truoc).includes(x))).toHaveLength(1) // đúng MỘT câu mới thay vào
    expect(tatCaQid(truoc).filter((x) => x !== hong).every((x) => q.includes(x))).toBe(true) // 39 câu cũ còn nguyên
    expect(hangKeHoach(d).tong).toBe(40)
  })
  it('chiến dịch CŨ (không dòng cờ ⇒ bật) kế hoạch chốt theo luật đổ đầy, em làm 20, 1 câu tự luận ⇒ tong vẫn 40, Sảnh {con: 20, tong: 40}', async () => {
    const { d, env } = fixture(60)
    await giao(env, { theLucNgay: 40, soNgayHan: 7, raiDeu: false })
    const nay = Date.now()
    const { kh: truoc } = await layKeHoachHomNay(env, 'S1', nay)
    const ds = truoc.conDao.map(qidGoc)
    d.sql.exec('DELETE FROM chien_dich_tuy_chon')
    xoaDemChienDich()
    await lamXong(env, ds.slice(0, 20), nay)
    gatCoTuLuan(d, ds[ds.length - 1]!)
    const { kh: sau } = await layKeHoachHomNay(env, 'S1', nay)
    expect(sau.tong).toBe(truoc.tong)
    const s = await sanh2(env, 'S1', nay)
    expect(s.theLuc).toEqual({ con: 20, tong: 40 })
  })
  it('K1 (không còn câu mới để thay): 30 câu đều đã trong kế hoạch, em làm 5, 1 câu tự luận ⇒ bản ghi KHÔNG đổi, tong 29 (bỏ đúng 1 câu), không co cả ngày', async () => {
    const { d, env } = fixture(30)
    await giao(env, { raiDeu: false, soNgayHan: 5 })
    const nay = Date.now()
    const { kh } = await layKeHoachHomNay(env, 'S1', nay)
    const tongSang = kh.tong
    const ds = kh.conDao.map(qidGoc)
    await lamXong(env, ds.slice(0, 5), nay)
    d.sql.exec('DELETE FROM chien_dich_tuy_chon')
    xoaDemChienDich()
    const truocGhi = hangKeHoach(d)
    gatCoTuLuan(d, ds[ds.length - 1]!)
    const { kh: kh2 } = await layKeHoachHomNay(env, 'S1', nay)
    expect(kh2.tong).toBe(tongSang - 1)
    expect(kh2.tamHoan).toMatchObject({ tuLuan: 1 })
    expect(hangKeHoach(d)).toEqual(truocGhi)
  })
  it('câu ÔN (Đoàn) hỏng ⇒ thay bằng câu ôn Đoàn khác tới lịch, không kéo câu mới vào Đoàn; Huyết Chiến đã chốt giữ nguyên', async () => {
    const { d, env } = fixture(30)
    await giao(env, { soNgayHan: 5 })
    const nay = Date.now()
    // Hai câu phần I đã làm sai hôm qua ⇒ hôm nay tới lịch ôn ở Đoàn.
    await ghiSuKien(env, ['Q1', 'Q2'].map((q) => suKien(q, nay - NGAY, false)))
    const { kh } = await layKeHoachHomNay(env, 'S1', nay)
    expect(kh.conDoan.map(qidGoc).sort()).toEqual(['Q1', 'Q2'])
    // Mô phỏng kế hoạch chốt khi Q2 chưa tới lịch: bỏ Q2 khỏi bản ghi (Q2 thành ứng viên thay), đặt Huyết Chiến = 1 để kiểm giữ nguyên.
    const h = hangKeHoach(d)
    const doan = (JSON.parse(h.doan_json) as string[]).filter((k) => k !== 'Q2')
    d.sql.prepare("UPDATE srs2_ke_hoach SET doan_json = ?, tong = tong - 1, huyet_chien = 1 WHERE sbd = 'S1'").run(JSON.stringify(doan))
    gatCoTuLuan(d, 'Q1')
    const { kh: sau } = await layKeHoachHomNay(env, 'S1', nay)
    expect(sau.conDoan).toEqual(['Q2'])
    expect(sau.huyetChien).toBe(true)
    expect(sau.dao).toEqual(kh.dao)
  })
})

describe('K2 / K2b / K3 — kế hoạch và game cùng MỘT phép kiểm tự luận', () => {
  it('K2: câu Phần I có phương án rỗng chữ (không ảnh) ⇒ meta tuLuan = laCauTuLuan = true; có ảnh ở phương án ấy (mảng ảnh / hình sau_pa_D) ⇒ cả hai false', async () => {
    const { d, env } = fixture(8)
    const q = { ...JSON.parse(cauJson('Q1', 'I', 'NB', 'D1', 'B')), choices: ['a', 'b', 'c', ''] }
    expect(laCauTuLuan(q)).toBe(true)
    d.sql.prepare('UPDATE game_v2_question SET json = ? WHERE qid = ?').run(JSON.stringify(q), 'Q1')
    const q2 = { ...JSON.parse(cauJson('Q2', 'I', 'NB', 'D1', 'B')), choices: ['a', 'b', 'c', ''], choiceImgs: ['', '', '', 'data:image/png;base64,AAAA'] }
    expect(laCauTuLuan(q2)).toBe(false)
    d.sql.prepare('UPDATE game_v2_question SET json = ? WHERE qid = ?').run(JSON.stringify(q2), 'Q2')
    const q3 = { ...JSON.parse(cauJson('Q3', 'I', 'NB', 'D1', 'B')), choices: ['a', 'b', 'c', ''], hinhAnh: [{ viTri: 'sau_pa_D', src: 'data:image/png;base64,BBBB' }] }
    expect(laCauTuLuan(q3)).toBe(false)
    d.sql.prepare('UPDATE game_v2_question SET json = ? WHERE qid = ?').run(JSON.stringify(q3), 'Q3')
    const meta = await docMetaCau(env, ['Q1', 'Q2', 'Q3', 'Q4'])
    expect(['Q1', 'Q2', 'Q3', 'Q4'].map((x) => meta.get(x)?.tuLuan)).toEqual([true, false, false, false])
    // Hàm thuần nhận dòng rút gọn: JSON không đọc được ⇒ không phục vụ; ảnh phương án là cờ 0/1.
    expect(tuLuanTuMeta({ gon: '{hỏng' })).toBe(true)
    const { choiceImgs: _bo, ...q2Gon } = q2
    expect(tuLuanTuMeta({ gon: JSON.stringify(q2Gon), anh_pa: '[0,0,0,1]' })).toBe(false)
    expect(tuLuanTuMeta({ gon: JSON.stringify(q2Gon), anh_pa: '[0,0,0,0]' })).toBe(true)
  })
  it('K2b (D1 thật): câu cuối Phần I phương án D rỗng ⇒ được THAY, Đảo phát câu thay, Sảnh {con:1, tong}; không "xong" trái với rương', async () => {
    const { d, env } = fixture()
    await giao(env)
    const nay = Date.now()
    const { giu, tong } = await conLai(env, 1, nay)
    d.sql.prepare("UPDATE game_v2_question SET json = json_set(json, '$.phan', 'I', '$.choices', json(?), '$.ideas', json('[]'), '$.correct', 'B') WHERE qid = ?").run(PA_RONG, giu[0]!)
    const dao = await startDao2(env, 'S1', nay)
    expect(dao.lyDo).toBeUndefined()
    expect(qidsCua(dao)).toHaveLength(1)
    expect(qidsCua(dao)[0]).not.toBe(giu[0])
    const s = await sanh2(env, 'S1', nay)
    expect(s.theLuc).toMatchObject({ con: 1, tong })
    expect(ruong(s)).toMatchObject({ daLam: tong - 1, tong, moDuoc: false })
  })
  it('K3: câu ôn Đoàn duy nhất Phần I phương án rỗng (chỉ mục cũ) ⇒ Đảo KHÔNG khoá chờ Đoàn; Sảnh không khoá Đảo', async () => {
    const { d, env } = fixture()
    await giao(env)
    const nay = Date.now()
    await ghiSuKien(env, ['Q1'].map((q) => suKien(q, nay - NGAY, false)))
    const { kh } = await layKeHoachHomNay(env, 'S1', nay)
    expect(kh.conDoan.map(qidGoc)).toEqual(['Q1'])
    d.sql.prepare("UPDATE game_v2_question SET json = json_set(json, '$.choices', json(?)) WHERE qid = 'Q1'").run(PA_RONG)
    const dao = await startDao2(env, 'S1', nay)
    expect(dao.lyDo).not.toBe('khoa_cho_doan')
    expect(qidsCua(dao).length).toBeGreaterThan(0)
    const doan = await startDoan2(env, 'S1', nay)
    expect(doan.lyDo).toBe('xong_on_hom_nay')
    const s = await sanh2(env, 'S1', nay)
    expect(s.khoaDao).toBe(false)
  })
})

describe('vang — câu vắng khi nạp mà meta còn', () => {
  it('lyDoLuotRong: vắng + meta còn ⇒ chua_nap_duoc (lỗi tạm, thử lại được); tự luận / mất meta ⇒ xong', () => {
    const m = { qid: 'Q1', maDe: 'DE1', version: 'v1', group: 'g-Q1', phan: 'I' as const, mucDo: null, dang: null, tenDang: null, sao: 0, tuLuan: false }
    const hs = { meta: new Map([['Q1', m]]) }
    const vang = boQuaMoi()
    vang.vang.add('Q1')
    expect(lyDoLuotRong(['Q1'], hs, new Set(), new Set(), vang)).toBe('chua_nap_duoc')
    const tl = boQuaMoi()
    tl.tuLuan.add('Q1')
    expect(lyDoLuotRong(['Q1'], hs, new Set(), new Set(), tl)).toBe('xong')
    expect(lyDoLuotRong(['Q9'], hs, new Set(), new Set(), boQuaMoi())).toBe('xong') // mất meta = đã rút khỏi kho
  })
})

describe('CAS — ghi kế hoạch giữa ngày không đè bản máy khác vừa ghi', () => {
  it('máy khác đổi kế hoạch ngay trước lúc ghi ⇒ không ghi đè, trả bản ĐÃ CHỐT của máy khác', async () => {
    const { d, env } = fixture(60)
    await giao(env, { theLucNgay: 40, soNgayHan: 7, raiDeu: false })
    const nay = Date.now()
    const { kh } = await layKeHoachHomNay(env, 'S1', nay)
    const ds = kh.conDao.map(qidGoc)
    await lamXong(env, ds.slice(0, 3), nay)
    const hong = ds[ds.length - 1]!
    gatCoTuLuan(d, hong)
    const banMayKhac = [...kh.dao.filter((k) => k !== hong), 'Q60']
    const db = env.DB as unknown as { prepare: (q: string) => unknown }
    const goc = db.prepare.bind(db)
    let chen = false
    db.prepare = (q: string) => {
      if (!chen && q.startsWith('UPDATE srs2_ke_hoach')) {
        chen = true
        d.sql.prepare("UPDATE srs2_ke_hoach SET dao_json = ? WHERE sbd = 'S1'").run(JSON.stringify(banMayKhac))
      }
      return goc(q)
    }
    const { kh: sau } = await layKeHoachHomNay(env, 'S1', nay)
    expect(chen).toBe(true)
    expect(JSON.parse(hangKeHoach(d).dao_json)).toEqual(banMayKhac)
    expect(sau.dao).toEqual(banMayKhac)
  })
})

describe('PHẢN BIỆN vòng 2 #110', () => {
  it('ĐỐI CHỨNG ngày cuối: làm hết kế hoạch, 1 câu sai ⇒ bổ sung lần 2 trong ngày', async () => {
    const { env } = fixture(10)
    await giao(env, { soNgayHan: 0 })
    const nay = Date.now()
    const { kh } = await layKeHoachHomNay(env, 'S1', nay)
    const ds = kh.conDao.map(qidGoc)
    await ghiSuKien(env, [suKien(ds[0]!, nay - 60_000, false)])
    await lamXong(env, ds.slice(1), nay)
    const { kh: sau } = await layKeHoachHomNay(env, 'S1', nay)
    expect(sau.tong).toBeGreaterThan(kh.tong)
    expect([...sau.conDao, ...sau.conDoan].map(qidGoc)).toContain(ds[0])
  })
  it('[VỪA] NGÀY CUỐI: còn 1 câu hỏng (tự luận) không có câu thay ⇒ phần bổ sung "làm lại câu sai trong ngày" VẪN có (không bị chặn cả ngày)', async () => {
    const { d, env } = fixture(10)
    await giao(env, { soNgayHan: 0 })
    const nay = Date.now()
    const { kh } = await layKeHoachHomNay(env, 'S1', nay)
    const ds = kh.conDao.map(qidGoc)
    const hong = ds[ds.length - 1]!
    await ghiSuKien(env, [suKien(ds[0]!, nay - 60_000, false)])
    await lamXong(env, ds.slice(1, -1), nay)
    gatCoTuLuan(d, hong)
    const { kh: sau } = await layKeHoachHomNay(env, 'S1', nay)
    expect(sau.tong).toBeGreaterThan(kh.tong - 1)
    expect([...sau.conDao, ...sau.conDoan].map(qidGoc)).toContain(ds[0])
    expect(tatCaQid(sau).filter((q) => q === hong)).toHaveLength(0) // câu hỏng vẫn bị tạm hoãn khỏi tong
  })
  it('[NHẸ] câu THAY không lấy câu đang bảo vệ cho ca ⇒ lấy câu hợp lệ kế tiếp, tong giữ nguyên, không tạm hoãn "ca"', async () => {
    const { d, env } = fixture(40)
    await giao(env, { theLucNgay: 10, soNgayHan: 7, raiDeu: false })
    const nay = Date.now()
    const { kh } = await layKeHoachHomNay(env, 'S1', nay)
    const ds = kh.conDao.map(qidGoc)
    expect(kh.conDoan).toEqual([])
    await lamXong(env, ds.slice(0, 5), nay)
    const ngoai = Array.from({ length: 40 }, (_, i) => `Q${i + 1}`).filter((q) => !ds.includes(q))
    const tuDo = ngoai[ngoai.length - 1]!
    const bank = { phanI: ngoai.filter((q) => q !== tuDo).map((id) => ({ id, text: `Câu ${id}`, choices: ['a', 'b', 'c', 'd'], correct: 'B' })), phanII: [], phanIII: [] }
    d.objects.set('de/CA-CU.json', bank)
    const luc = nay - 2 * 3_600_000
    d.sql.prepare(`INSERT INTO ca(ma_ca,ten_ca,trang_thai,bat_dau,het_han_vao,thoi_gian_phut,loai,cong_bo,bank_r2,cap_nhat_luc) VALUES('CA-CU','Ca cũ','dong',?,?,45,'thi','khong','de/CA-CU.json',?)`)
      .run(new Date(luc).toISOString(), new Date(luc + 20 * 60_000).toISOString(), new Date(luc).toISOString())
    xoaDemCaBaoVe()
    gatCoTuLuan(d, ds[ds.length - 1]!)
    const { kh: kh2 } = await layKeHoachHomNay(env, 'S1', nay)
    expect(kh2.tong).toBe(kh.tong)
    expect(tatCaQid(kh2)).toContain(tuDo)
    expect(kh2.tamHoan?.ca ?? 0).toBe(0)
  })
  it('[NHẸ] chua_nap_duoc ⇒ log có SBD + mãĐề|qid (đánh dấu câu vắng khi nạp), không tên em', () => {
    const loi = vi.spyOn(console, 'error').mockImplementation(() => undefined)
    const bq = boQuaMoi()
    bq.vang.add('Q2')
    const meta = new Map([['Q1', { maDe: 'DE1' }], ['Q2', { maDe: 'DE1' }]]) as never
    logChuaNap('dao', 'S1', ['Q1', 'Q2', 'Q2#2'], { meta }, bq)
    const dong = loi.mock.calls.map((c) => c.join(' ')).join('\n')
    loi.mockRestore()
    expect(dong).toContain('"sbd":"S1"')
    expect(dong).toContain('DE1|Q1')
    expect(dong).toContain('DE1|Q2 (vắng khi nạp)')
    expect(dong).not.toContain('Nguyễn')
  })
})
