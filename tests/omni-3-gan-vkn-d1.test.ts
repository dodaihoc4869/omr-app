// @vitest-environment node
// OMNI 3 · D1 — lớp D1 của bộ gắn vi kỹ năng (server/src/omni-gan-vkn.ts) chạy SQL THẬT trên SQLite trong bộ nhớ (tests/_d1-that.ts, lược đồ =
// schema.sql + mọi migration). ganVknChoMaDe: ghi omni_q (y −1 / 0..3), omni_vkn, omni_q_gan; nhãn bước theo băm (loi_giai_cau), băm tính lại,
// qid_mau; không đè 'thay'; idempotent. chayGanVknDem: ưu tiên tờ bài tick, ≤ N câu/lượt, con trỏ, không đụng TU LUYỆN, gắn lại khi đổi phiên bản /
// đổi nội dung / mất dòng omni_q, không bao giờ ném lỗi. kiemDinhQTuan: thêm đúng nhãn trên dữ liệu có cấu trúc rõ, đánh dấu câu nghi, gợi ý (không
// sửa) câu thầy duyệt, Phần II theo từng ý, idempotent theo tuần, thiếu dữ liệu ⇒ không đổi gì.
import { describe, expect, it } from 'vitest'
import { taoD1That, type D1That } from './_d1-that'
import { chayGanVknDem, ganVknChoMaDe, kiemDinhQTuan, KHOA_CON_TRO_GAN, PHIEN_BAN_GAN, TEN_LOI_NEN } from '../server/src/omni-gan-vkn'
import { TEN_NEN } from '../server/src/thang-tu-go'
import { bamCau, cauTrongGoi } from '../src/lib/loi-giai-kiem'
import type { Env } from '../server/src/kieu'

const NAY = Date.parse('2026-10-05T17:01:00Z') // 00:01 thứ Ba 06/10 giờ VN
const NGAY = 86_400_000
type Row = Record<string, unknown>
interface CauGame { qid: string; phan: 'I' | 'II' | 'III'; text: string; choices?: string[]; ideas?: string[]; correct: string; solution?: unknown; dang?: string; kienThuc?: string[]; version?: string }
function napCau(d: D1That, maDe: string, q: CauGame) {
  const dang = q.dang ?? 'HOA.DANG.MAU'
  d.sql.prepare('INSERT INTO game_v2_question (ma_de, qid, version, content_group, dang, json) VALUES (?,?,?,?,?,?)').run(maDe, q.qid, q.version ?? 'v1', `g-${q.qid}`, dang,
    JSON.stringify({ qid: q.qid, maDe, version: q.version ?? 'v1', group: `g-${q.qid}`, phan: q.phan, text: q.text, choices: q.choices ?? [], ideas: q.ideas ?? [], hinhAnh: [],
      dang, tenDang: 'Dạng mẫu', mucDo: 'van_dung', sao: 1, kienThuc: q.kienThuc ?? [], correct: q.correct, solution: q.solution ?? null, reviewed: true }))
}
const qRow = (d: D1That, qid: string) => (d.sql.prepare('SELECT y, vkn_json, nguon FROM omni_q WHERE qid = ? ORDER BY y').all(qid) as Row[])
  .map((x) => ({ y: Number(x.y), vkn: JSON.parse(String(x.vkn_json)) as string[], nguon: String(x.nguon) }))
const ca = (d: D1That, qid: string) => qRow(d, qid).find((x) => x.y === -1)

// ---------------------------------------------------------------- ganVknChoMaDe
const TO = 'DH-12-T1'
const PA6 = { A: '2Al + 6HCl → 2AlCl₃ + 3H₂', B: 'Al + 3HCl → AlCl₃ + H₂', C: '2Al + 3HCl → 2AlCl₃ + 3H₂', D: 'Al + HCl → AlCl₃ + H₂' }
async function chuanBiTo(d: D1That) {
  napCau(d, TO, { qid: `${TO}-III-1`, phan: 'III', text: 'Lên men 36 gam glucose với hiệu suất 80%. Tính khối lượng ethanol.', correct: '14,72', solution: { buoc: ['n(glucose) = 36 : 180 = 0,2 mol.', 'm = 0,4 · 46 · 80% = 14,72 gam.'] } })
  napCau(d, TO, { qid: `${TO}-I-2`, phan: 'I', text: 'Chất nào là chất điện li mạnh?', choices: ['NaCl', 'C₂H₅OH', 'C₆H₁₂O₆', 'CH₃COOH'], correct: 'A', solution: { chot: 'NaCl phân li hoàn toàn.' } })
  napCau(d, TO, { qid: `${TO}-II-3`, phan: 'II', text: 'Cho phản ứng H₂ + I₂ ⇌ 2HI trong bình 2 lít.', ideas: ['Phản ứng thuận toả nhiệt.', 'Nồng độ HI lúc cân bằng là 0,85 M.', 'Hiệu suất là 85%.', 'Thêm chất đầu làm cân bằng chuyển dịch.'], correct: 'DDDD',
    solution: { tungY: { a: { dung: true, viSao: 'ΔrH < 0.' }, b: { dung: true, viSao: '[HI] = 1,7/2 = 0,85 M.' }, c: { dung: true, viSao: 'H = 0,85 : 1 × 100% = 85%.' }, d: { dung: true, viSao: 'Theo Le Chatelier.' } } } })
  napCau(d, TO, { qid: `${TO}-III-4`, phan: 'III', text: 'Đốt cháy 4,4 gam propane. Tính số mol CO₂.', correct: '0,3', solution: { buoc: ['n = 4,4 : 44 = 0,1 mol.', 'Bảo toàn C: n(CO₂) = 0,3 mol.'] } })
  napCau(d, TO, { qid: `${TO}-III-5`, phan: 'III', text: 'Hoà tan 0,2 mol NaOH được 500 mL dung dịch. Tính nồng độ.', correct: '0,4', solution: { buoc: ['CM = 0,2 : 0,5 = 0,4 M.'] } })
  napCau(d, TO, { qid: `${TO}-I-6`, phan: 'I', text: 'Phương trình nào cân bằng đúng?', choices: Object.values(PA6), correct: 'A', solution: { chot: 'Đếm nguyên tử hai vế.' } })
  napCau(d, TO, { qid: `${TO}-I-7`, phan: 'I', text: 'Câu thầy đã duyệt Q.', choices: ['a', 'b', 'c', 'd'], correct: 'B' })
  const nay = new Date(NAY).toISOString()
  // (1) nhãn bước qua qid_mau
  d.sql.prepare('INSERT INTO cau_bo_tro (bam, qid_mau, song_sinh_json, cau_kiem_json, nhan_nen_json, buoc_json, cap_nhat_luc) VALUES (?,?,?,?,?,?,?)')
    .run('bam-q4', `${TO}-III-4`, '[]', '[]', JSON.stringify([{ buoc: 0, nen: 'doi_mol_khoi_luong' }, { buoc: 1, nen: 'bao_toan_nguyen_to' }, { buoc: 2, nen: 'lam_tron_ket_qua' }]), '[]', nay)
  // (2) nhãn bước qua băm nội dung trong loi_giai_cau (qid_mau là câu ở tờ khác cùng nội dung)
  d.sql.prepare('INSERT INTO cau_bo_tro (bam, qid_mau, song_sinh_json, cau_kiem_json, nhan_nen_json, buoc_json, cap_nhat_luc) VALUES (?,?,?,?,?,?,?)')
    .run('bam-q5', 'DE-KHAC-III-9', '[]', '[]', JSON.stringify([{ buoc: 0, nen: 'nong_do_mol' }]), '[]', nay)
  d.sql.prepare('INSERT INTO loi_giai_cau (qid, bam, ma_de, dang, lop, bo, cap_nhat_luc) VALUES (?,?,?,?,?,?,?)').run(`${TO}-III-5`, 'bam-q5', TO, 'tln', '12', 'HOA', nay)
  // (3) nhãn bước chỉ tìm được bằng BĂM TÍNH LẠI từ nội dung câu (chưa có loi_giai_cau, qid_mau khác) — băm độc lập từ câu kho thô.
  const kho = cauTrongGoi(TO, { cau: [{ qid: `${TO}-I-6`, phan: 'I', so: 6, de: 'Phương trình nào cân bằng đúng?', pa: PA6, dap_an: 'A' }] })[0]!
  d.sql.prepare('INSERT INTO cau_bo_tro (bam, qid_mau, song_sinh_json, cau_kiem_json, nhan_nen_json, buoc_json, cap_nhat_luc) VALUES (?,?,?,?,?,?,?)')
    .run(await bamCau(kho), 'DE-CU-I-1', '[]', '[]', JSON.stringify([{ buoc: 0, nen: 'can_bang_phuong_trinh' }]), '[]', nay)
  // (4) dòng thầy đã duyệt
  d.sql.prepare("INSERT INTO omni_q (qid, y, vkn_json, nguon, duyet_luc) VALUES (?, -1, ?, 'thay', ?)").run(`${TO}-I-7`, JSON.stringify(['dang:HOA.DANG.MAU', 'HOA.DANG.MAU#2']), '2026-10-04T10:00:00.000Z')
}

describe('ganVknChoMaDe — ghi ma trận Q của các tờ', () => {
  it('gắn đúng từng câu, Phần II đủ 4 ý, nhãn bước theo băm/băm tính lại/qid_mau, không đè dòng thầy, omni_vkn + omni_q_gan đủ', async () => {
    const d = taoD1That()
    await chuanBiTo(d)
    const thayTruoc = JSON.stringify(qRow(d, `${TO}-I-7`))
    const kq = await ganVknChoMaDe(d.env, [TO], NAY)
    expect(kq.soCau).toBe(7)
    expect(kq.theoNguon).toEqual({ mau: 2, dang: 1, buoc: 3, thay: 1 })
    expect(ca(d, `${TO}-III-1`)).toEqual({ y: -1, vkn: ['dang:HOA.DANG.MAU', 'nen:doi_mol_khoi_luong', 'nen:hieu_suat'], nguon: 'goi_y' })
    expect(ca(d, `${TO}-I-2`)!.vkn).toEqual(['dang:HOA.DANG.MAU'])
    expect(qRow(d, `${TO}-II-3`)).toEqual([
      { y: -1, vkn: ['dang:HOA.DANG.MAU', 'nen:nong_do_mol', 'nen:hieu_suat'], nguon: 'goi_y' },
      { y: 0, vkn: ['dang:HOA.DANG.MAU'], nguon: 'goi_y' },
      { y: 1, vkn: ['dang:HOA.DANG.MAU', 'nen:nong_do_mol'], nguon: 'goi_y' },
      { y: 2, vkn: ['dang:HOA.DANG.MAU', 'nen:hieu_suat'], nguon: 'goi_y' },
      { y: 3, vkn: ['dang:HOA.DANG.MAU'], nguon: 'goi_y' },
    ])
    expect(ca(d, `${TO}-III-4`)!.vkn).toEqual(['dang:HOA.DANG.MAU', 'nen:doi_mol_khoi_luong', 'nen:bao_toan_nguyen_to']) // lam_tron bỏ khỏi cổng AND
    expect(ca(d, `${TO}-III-5`)!.vkn).toEqual(['dang:HOA.DANG.MAU', 'nen:nong_do_mol'])
    expect(ca(d, `${TO}-I-6`)!.vkn).toEqual(['dang:HOA.DANG.MAU', 'nen:can_bang_phuong_trinh'])
    expect(JSON.stringify(qRow(d, `${TO}-I-7`))).toBe(thayTruoc) // không đè 'thay', không thêm dòng goi_y
    const gan = d.sql.prepare('SELECT qid, phien_ban, ban_cau, nguon_nhan, do_tin FROM omni_q_gan ORDER BY qid').all() as Row[]
    expect(gan).toHaveLength(7)
    for (const g of gan) { expect(g.phien_ban).toBe(PHIEN_BAN_GAN); expect(g.ban_cau).toBe('v1') }
    expect(gan.find((g) => g.qid === `${TO}-III-4`)).toMatchObject({ nguon_nhan: 'buoc', do_tin: 1 })
    expect(gan.find((g) => g.qid === `${TO}-III-1`)).toMatchObject({ nguon_nhan: 'mau', do_tin: 0.8 })
    expect(gan.find((g) => g.qid === `${TO}-I-7`)).toMatchObject({ nguon_nhan: 'thay' })
    const vkn = d.sql.prepare("SELECT * FROM omni_vkn WHERE id LIKE 'nen:%' ORDER BY id").all() as Row[]
    expect(vkn.map((x) => x.id)).toEqual(['nen:bao_toan_nguyen_to', 'nen:can_bang_phuong_trinh', 'nen:doi_mol_khoi_luong', 'nen:hieu_suat', 'nen:nong_do_mol'])
    for (const x of vkn) {
      const n = String(x.nhan_nen)
      expect(x).toMatchObject({ ma_dang: '', ten: TEN_NEN[n], ten_loi: TEN_LOI_NEN[n] })
    }
  })

  it('gọi lại không ghi gì (idempotent); omni_vkn thầy sửa không bị đè; tờ tách phần chỉ lấy đúng phần', async () => {
    const d = taoD1That()
    await chuanBiTo(d)
    d.sql.prepare("INSERT INTO omni_vkn (id, ma_dang, ten, ten_loi, nhan_nen, thu_tu) VALUES ('nen:hieu_suat', '', 'Hiệu suất (thầy đặt)', 'quên nhân hiệu suất', 'hieu_suat', 0)").run()
    await ganVknChoMaDe(d.env, [TO], NAY)
    const q = d.chup('omni_q')
    const lan2 = await ganVknChoMaDe(d.env, [TO], NAY + 60_000)
    expect(lan2.soGhi).toBe(0)
    expect(d.chup('omni_q')).toBe(q)
    expect(d.sql.prepare("SELECT ten, ten_loi FROM omni_vkn WHERE id = 'nen:hieu_suat'").get()).toEqual({ ten: 'Hiệu suất (thầy đặt)', ten_loi: 'quên nhân hiệu suất' })
    const d2 = taoD1That()
    await chuanBiTo(d2)
    const kq = await ganVknChoMaDe(d2.env, [`${TO}-DS`], NAY)
    expect(kq.soCau).toBe(1)
    expect(d2.dem('omni_q')).toBe(5 + 1) // câu Phần II (5 dòng) + dòng 'thay' có sẵn
  })

  it('câu đã sửa nội dung (băm hiện tại khác) ⇒ KHÔNG dùng dòng cau_bo_tro qid_mau cũ — lùi về dò mẫu', async () => {
    const d = taoD1That()
    const nay = new Date(NAY).toISOString()
    napCau(d, 'DH-S', { qid: 'DH-S-III-1', phan: 'III', text: 'Lên men glucose với hiệu suất 75% (đề đã sửa).', correct: '7,5', solution: { buoc: ['m = 10 · 75% = 7,5 gam.'] } })
    d.sql.prepare('INSERT INTO loi_giai_cau (qid, bam, ma_de, dang, lop, bo, cap_nhat_luc) VALUES (?,?,?,?,?,?,?)').run('DH-S-III-1', 'bam-moi', 'DH-S', 'tln', '12', 'HOA', nay)
    d.sql.prepare('INSERT INTO cau_bo_tro (bam, qid_mau, song_sinh_json, cau_kiem_json, nhan_nen_json, buoc_json, cap_nhat_luc) VALUES (?,?,?,?,?,?,?)')
      .run('bam-cu', 'DH-S-III-1', '[]', '[]', JSON.stringify([{ buoc: 0, nen: 'ti_khoi_khi' }]), '[]', nay)
    const kq = await ganVknChoMaDe(d.env, ['DH-S'], NAY)
    expect(kq.theoNguon).toEqual({ mau: 1 })
    expect(ca(d, 'DH-S-III-1')!.vkn).toEqual(['dang:HOA.DANG.MAU', 'nen:hieu_suat'])
  })

  it('tờ không có câu ⇒ 0; vi kỹ năng riêng của dạng khớp kienThuc được đưa vào', async () => {
    const d = taoD1That()
    expect(await ganVknChoMaDe(d.env, ['KHONG-CO'], NAY)).toEqual({ soCau: 0, soGhi: 0, theoNguon: {} })
    d.sql.prepare("INSERT INTO omni_vkn (id, ma_dang, ten, ten_loi, nhan_nen, thu_tu) VALUES ('HOA.DANG.MAU#1', 'HOA.DANG.MAU', 'Ester của phenol', NULL, NULL, 1)").run()
    napCau(d, 'DH-K', { qid: 'DH-K-I-1', phan: 'I', text: 'Ester nào phản ứng với NaOH theo tỉ lệ 1 : 2?', choices: ['a', 'b', 'c', 'd'], correct: 'C', kienThuc: ['ester của phenol'] })
    await ganVknChoMaDe(d.env, ['DH-K'], NAY)
    expect(ca(d, 'DH-K-I-1')!.vkn).toEqual(['dang:HOA.DANG.MAU', 'HOA.DANG.MAU#1'])
  })
})

// ---------------------------------------------------------------- chayGanVknDem
function chuanBiDem(d: D1That) {
  const t = (maDe: string, n: number, phan: 'I' | 'III' = 'III') => { for (let i = 1; i <= n; i++) napCau(d, maDe, { qid: `${maDe}-${phan}-${i}`, phan, text: `Câu ${i} của ${maDe}: tính hiệu suất.`, correct: '80', solution: { buoc: ['H = 8 : 10 × 100% = 80%.'] } }) }
  t('DH-12-A', 2, 'I'); t('DH-12-A', 1, 'III')
  t('DH-12-B', 2)
  t('DE-TU-LUYEN', 2)
  t('DH-12-D', 1)
  t('KHAC-E', 1, 'I'); t('KHAC-E', 1, 'III')
  t('DH-12-F', 1, 'I'); t('DH-12-F', 1, 'III')
  const nay = new Date(NAY).toISOString()
  const bai = d.sql.prepare('INSERT INTO bai_da_day (id, lop, khoa_bai, ten_bai, vi_tri, ma_to_json, tick_luc, nguoi, chien_dich_id, bo_tick_luc) VALUES (?,?,?,?,?,?,?,?,?,?)')
  bai.run('b1', '12A1', 'B1', 'Bài 1', 1, JSON.stringify(['DH-12-A-TN']), '2026-10-01T03:00:00.000Z', 'thay', null, null)
  bai.run('b2', '12A1', 'B2', 'Bài 2', 2, JSON.stringify(['DH-12-B']), '2026-10-04T03:00:00.000Z', 'thay', null, null)
  bai.run('b0', '12A1', 'B0', 'Bài đã bỏ tick', 0, JSON.stringify(['DE-TU-LUYEN']), '2026-10-05T03:00:00.000Z', 'thay', null, '2026-10-05T04:00:00.000Z')
  const tm = d.sql.prepare('INSERT INTO de_kho_thu_muc (ma_de, thu_muc, cap_nhat_luc) VALUES (?,?,?)')
  tm.run('DH-12-D', 'TU_LUYEN', nay) // mã DH- nhưng thầy xếp vào TU LUYỆN
  tm.run('KHAC-E-TN', 'DAY_HOC', nay) // chỉ phần trắc nghiệm của tờ này thuộc DẠY HỌC
  tm.run('DH-12-F-TN', 'TU_LUYEN', nay) // tờ DH- có dòng tách phần: phần TN sang TU LUYỆN, phần chưa có dòng theo luật lùi DH- ⇒ DẠY HỌC
}
const daGan = (d: D1That) => (d.sql.prepare('SELECT qid FROM omni_q_gan ORDER BY qid').all() as Row[]).map((x) => String(x.qid))

describe('chayGanVknDem — việc đêm', () => {
  it('ưu tiên tờ bài tick gần nhất, ≤ N câu/lượt, con trỏ; xong trong ngày thì lượt sau trả ngay; không đụng TU LUYỆN', async () => {
    const d = taoD1That()
    chuanBiDem(d)
    const r1 = await chayGanVknDem(d.env, NAY, { toiDa: 2 })
    expect(r1).toMatchObject({ ok: true, soCau: 2, xong: false })
    expect(daGan(d)).toEqual(['DH-12-B-III-1', 'DH-12-B-III-2']) // bài tick MỚI NHẤT trước
    const r2 = await chayGanVknDem(d.env, NAY + 60_000, { toiDa: 2 })
    expect(r2).toMatchObject({ soCau: 2, xong: false })
    expect(daGan(d)).toEqual(['DH-12-A-I-1', 'DH-12-A-I-2', 'DH-12-B-III-1', 'DH-12-B-III-2']) // rồi phần trắc nghiệm của bài tick trước
    const r3 = await chayGanVknDem(d.env, NAY + 120_000, { toiDa: 5 })
    expect(r3).toMatchObject({ soCau: 3, xong: true })
    expect(daGan(d)).toEqual(['DH-12-A-I-1', 'DH-12-A-I-2', 'DH-12-A-III-1', 'DH-12-B-III-1', 'DH-12-B-III-2', 'DH-12-F-III-1', 'KHAC-E-I-1'])
    expect(d.dem('omni_q', "qid LIKE 'DE-TU-LUYEN%' OR qid LIKE 'DH-12-D%' OR qid = 'KHAC-E-III-1' OR qid = 'DH-12-F-I-1'")).toBe(0)
    const ct = JSON.parse(String((d.sql.prepare('SELECT gia_tri FROM cau_hinh WHERE khoa = ?').get(KHOA_CON_TRO_GAN) as Row).gia_tri))
    expect(ct).toMatchObject({ pb: PHIEN_BAN_GAN, ngay: '2026-10-06', xong: true })
    const r4 = await chayGanVknDem(d.env, NAY + 180_000, { toiDa: 5 })
    expect(r4).toMatchObject({ ok: true, soCau: 0, boQua: 'da_xong_hom_nay' })
    // Hôm sau không có gì mới ⇒ không ghi omni_q
    const q = d.chup('omni_q')
    expect(await chayGanVknDem(d.env, NAY + NGAY, { toiDa: 5 })).toMatchObject({ soCau: 0, soGhi: 0, xong: true })
    expect(d.chup('omni_q')).toBe(q)
  })

  it('gắn lại khi đổi phiên bản bộ gắn, đổi nội dung câu (version) hoặc mất dòng omni_q', async () => {
    const d = taoD1That()
    chuanBiDem(d)
    await chayGanVknDem(d.env, NAY, { toiDa: 50 })
    expect(daGan(d)).toHaveLength(7)
    d.sql.prepare("UPDATE omni_q_gan SET phien_ban = 'gan-vkn-cu' WHERE qid = 'DH-12-B-III-1'").run()
    d.sql.prepare("UPDATE game_v2_question SET version = 'v2', json = replace(json, 'tính hiệu suất', 'tính pH') WHERE qid = 'DH-12-B-III-2'").run()
    d.sql.prepare("DELETE FROM omni_q WHERE qid = 'DH-12-A-I-1'").run()
    const r = await chayGanVknDem(d.env, NAY + NGAY, { toiDa: 50 })
    expect(r).toMatchObject({ ok: true, soCau: 3, xong: true })
    expect(d.sql.prepare("SELECT phien_ban FROM omni_q_gan WHERE qid = 'DH-12-B-III-1'").get()).toEqual({ phien_ban: PHIEN_BAN_GAN })
    expect(d.sql.prepare("SELECT ban_cau FROM omni_q_gan WHERE qid = 'DH-12-B-III-2'").get()).toEqual({ ban_cau: 'v2' })
    expect(ca(d, 'DH-12-A-I-1')!.vkn).toEqual(['dang:HOA.DANG.MAU', 'nen:hieu_suat'])
  })

  it('không bao giờ ném lỗi', async () => {
    const hong = { DB: { prepare() { throw new Error('D1 sập') }, batch() { throw new Error('D1 sập') } } } as unknown as Env
    await expect(chayGanVknDem(hong, NAY)).resolves.toMatchObject({ ok: false })
    await expect(kiemDinhQTuan(hong, NAY)).resolves.toMatchObject({ ok: false })
  })
})

// ---------------------------------------------------------------- kiemDinhQTuan
const EM = Array.from({ length: 40 }, (_, i) => `E${String(i + 1).padStart(2, '0')}`)
const em = (a: number, b: number) => EM.slice(a - 1, b)
let demKhoa = 0
function lam(d: D1That, sbd: string, qid: string, dung: boolean, tuy: { luc?: string; assistance?: string; purpose?: string; y?: (0 | 1)[] } = {}) {
  const luc = tuy.luc ?? '2026-10-03T12:00:00.000Z'
  d.sql.prepare('INSERT INTO su_kien_hoc (khoa, sbd, qid, nguon, ma_nguon, lan, ket_qua, luc, ngay_vn, assistance, purpose, visibility, subitem_json, received_at) VALUES (?,?,?,?,?,1,?,?,?,?,?,?,?,?)')
    .run(`k${++demKhoa}`, sbd, qid, 'game', 'G', dung ? 1 : 0, luc, luc.slice(0, 10), tuy.assistance ?? 'none', tuy.purpose ?? null, 'released', tuy.y ? JSON.stringify(tuy.y) : null, Date.parse(luc))
}
function vung(d: D1That, sbd: string, vkn: string) {
  d.sql.prepare("INSERT INTO omni_p_vkn (sbd, vkn_id, p, n_tu_lam, n_ngay, trang_thai, phien_ban, cap_nhat_luc) VALUES (?,?,0.97,12,4,'vung','omni3-0510-v1','2026-10-05T00:00:00.000Z')").run(sbd, vkn)
}
const DANG = 'dang:HOA.DANG.MAU'
function chuanBiKiem(d: D1That, coVung = true) {
  for (const [qid, phan] of [['Q1', 'III'], ['Q2', 'I'], ['Q3', 'I'], ['Q4', 'III'], ['Q5', 'III'], ['Q6', 'II']] as const) {
    napCau(d, 'DH-KD', { qid, phan, text: `Câu ${qid}`, correct: phan === 'II' ? 'DDDD' : 'A', choices: phan === 'I' ? ['a', 'b', 'c', 'd'] : [], ideas: phan === 'II' ? ['a', 'b', 'c', 'd'] : [] })
    const nguon = qid === 'Q5' ? 'thay' : 'goi_y'
    d.sql.prepare('INSERT INTO omni_q (qid, y, vkn_json, nguon, duyet_luc) VALUES (?, -1, ?, ?, ?)').run(qid, JSON.stringify([DANG]), nguon, '2026-10-01T00:00:00.000Z')
    if (phan === 'II') for (let y = 0; y < 4; y++) d.sql.prepare("INSERT INTO omni_q (qid, y, vkn_json, nguon, duyet_luc) VALUES (?, ?, ?, 'goi_y', ?)").run(qid, y, JSON.stringify([DANG]), '2026-10-01T00:00:00.000Z')
  }
  if (coVung) {
    for (const s of EM) vung(d, s, DANG)
    for (const s of em(1, 20)) vung(d, s, 'nen:hieu_suat')
    for (const s of [...em(1, 15), ...em(21, 25)]) vung(d, s, 'nen:nong_do_mol')
  }
  // Q1: đúng ⇔ vững hiệu suất (em vững cả dạng chỉ đúng 50 %). E01 có một lượt SAI cũ hơn — chỉ lượt cuối được tính.
  lam(d, 'E01', 'Q1', false, { luc: '2026-09-30T12:00:00.000Z' })
  for (const s of EM) lam(d, s, 'Q1', em(1, 20).includes(s))
  // Q2: đúng 30 %, không nhãn nào tách được (mỗi nhóm con đều 30 %) ⇒ câu nghi.
  const dungQ2 = ['E01', 'E02', 'E03', 'E16', 'E17', 'E18', 'E21', 'E22', 'E23', 'E26', 'E27', 'E28']
  for (const s of EM) lam(d, s, 'Q2', dungQ2.includes(s))
  // Q3: 90 % đúng ⇒ giữ nguyên. Thêm 30 lượt có hỗ trợ / đọc lời giải / lướt (phải bị bỏ qua).
  for (const s of EM) lam(d, s, 'Q3', !em(1, 4).includes(s))
  for (const s of em(1, 10)) { lam(d, s, 'Q3', false, { assistance: 'assisted', luc: '2026-10-04T12:00:00.000Z' }); lam(d, s, 'Q3', false, { purpose: 'xem_loi_giai', luc: '2026-10-04T12:00:00.000Z' }); lam(d, s, 'Q3', false, { purpose: 'luot', luc: '2026-10-04T12:00:00.000Z' }) }
  // Q4: chỉ 20 lượt tự làm (+ 15 lượt đọc lời giải không tính) ⇒ chưa đủ 30 lượt.
  for (const s of em(1, 20)) lam(d, s, 'Q4', false)
  for (const s of em(21, 35)) lam(d, s, 'Q4', false, { purpose: 'xem_loi_giai' })
  // Q5: như Q1 nhưng Q do THẦY duyệt ⇒ chỉ gợi ý vào nhật ký.
  for (const s of EM) lam(d, s, 'Q5', em(1, 20).includes(s))
  // Q6 (Phần II): ý c đúng ⇔ vững hiệu suất; các ý khác luôn đúng.
  for (const s of EM) { const c = em(1, 20).includes(s) ? 1 : 0; lam(d, s, 'Q6', c === 1, { y: [1, 1, c, 1] }) }
}
const nhatKy = (d: D1That) => d.sql.prepare('SELECT qid, y, loai, cu, moi, vkn_them, ly_do, ban_cau FROM omni_q_nhat_ky ORDER BY id').all() as Row[]

describe('kiemDinhQTuan — tự kiểm định ma trận Q theo dữ liệu', () => {
  it('thêm đúng nhãn tách nhóm vững tốt nhất; câu không nhãn nào giải thích ⇒ nghi; câu thầy duyệt chỉ gợi ý; Phần II theo từng ý', async () => {
    const d = taoD1That()
    chuanBiKiem(d)
    const kq = await kiemDinhQTuan(d.env, NAY)
    expect(kq).toMatchObject({ ok: true, chay: true, tuan: '2026-10-05', soCauXet: 5, soThemNhan: 2, soGoiYThay: 1, soNghi: 1 })
    expect(ca(d, 'Q1')).toEqual({ y: -1, vkn: [DANG, 'nen:hieu_suat'], nguon: 'goi_y' }) // hiệu suất (chênh 1,0) thắng nồng độ mol (chênh 0,5)
    expect(ca(d, 'Q2')!.vkn).toEqual([DANG])
    expect(ca(d, 'Q3')!.vkn).toEqual([DANG])
    expect(ca(d, 'Q4')!.vkn).toEqual([DANG])
    expect(ca(d, 'Q5')).toEqual({ y: -1, vkn: [DANG], nguon: 'thay' }) // không bao giờ sửa Q thầy duyệt
    expect(qRow(d, 'Q6').map((x) => x.vkn)).toEqual([[DANG, 'nen:hieu_suat'], [DANG], [DANG], [DANG, 'nen:hieu_suat'], [DANG]])
    const nghi = d.sql.prepare("SELECT * FROM omni_q_nghi WHERE qid = 'Q2'").get() as Row
    expect(nghi).toMatchObject({ so_lan: 40, so_sai: 28 })
    expect(Number(nghi.ty_le_sai)).toBeCloseTo(0.7, 9)
    expect(String(nghi.ghi_chu)).toContain('A.I Đỗ Đại Học kiểm ma trận Q')
    expect(d.dem('omni_q_nghi')).toBe(1)
    expect(d.dem('cau_nghi_dap_an')).toBe(0) // không đụng bảng nghi đáp án ⇒ rút đề ca kiểm tra không bị bỏ câu
    const nk = nhatKy(d)
    expect(nk.map((x) => [x.qid, x.y, x.loai, x.vkn_them])).toEqual([
      ['Q1', -1, 'them_nhan', 'nen:hieu_suat'], ['Q2', -1, 'nghi', null], ['Q5', -1, 'goi_y_thay', 'nen:hieu_suat'], ['Q6', 2, 'them_nhan', 'nen:hieu_suat'],
    ])
    expect(JSON.parse(String(nk[0]!.cu))).toEqual([DANG])
    expect(JSON.parse(String(nk[0]!.moi))).toEqual([DANG, 'nen:hieu_suat'])
    expect(String(nk[0]!.ly_do)).toMatch(/40 em vững mọi vi kỹ năng đã gắn nhưng chỉ đúng 50 %.*đúng 100 % \(20 em\).*đúng 0 % \(20 em\)/)
    expect(nk[0]!.ban_cau).toBe('v1')
    expect(d.sql.prepare("SELECT ten_loi FROM omni_vkn WHERE id = 'nen:hieu_suat'").get()).toEqual({ ten_loi: 'tính hiệu suất phản ứng' })
  })

  it('idempotent theo tuần; tuần sau không lặp thay đổi; gắn lại câu vẫn giữ nhãn đã thêm (trừ khi câu đổi nội dung)', async () => {
    const d = taoD1That()
    chuanBiKiem(d)
    await kiemDinhQTuan(d.env, NAY)
    const chup = () => [d.chup('omni_q'), d.chup('omni_q_nhat_ky'), d.chup('omni_q_nghi')].join('\n')
    const sau1 = chup()
    expect(await kiemDinhQTuan(d.env, NAY + 2 * NGAY)).toMatchObject({ ok: true, chay: false, lyDo: 'da_chay_tuan_nay' })
    expect(chup()).toBe(sau1)
    const tuanSau = await kiemDinhQTuan(d.env, NAY + 7 * NGAY)
    expect(tuanSau).toMatchObject({ ok: true, chay: true, soThemNhan: 0, soNghi: 1 }) // Q1, Q6 nay đã giải thích được; Q2 vẫn nghi nhưng không ghi lặp
    expect(chup()).toBe(sau1)
    // Việc đêm / nạp đề gắn lại từ chữ đề: nhãn kiểm định đã thêm vẫn giữ (cùng phiên bản câu).
    await ganVknChoMaDe(d.env, ['DH-KD'], NAY + 8 * NGAY)
    expect(ca(d, 'Q1')!.vkn).toEqual([DANG, 'nen:hieu_suat'])
    expect(qRow(d, 'Q6').map((x) => x.vkn)[3]).toEqual([DANG, 'nen:hieu_suat'])
    // Câu đổi nội dung ⇒ bằng chứng cũ hết hiệu lực.
    d.sql.prepare("UPDATE game_v2_question SET version = 'v2' WHERE qid = 'Q1'").run()
    await ganVknChoMaDe(d.env, ['DH-KD'], NAY + 9 * NGAY)
    expect(ca(d, 'Q1')!.vkn).toEqual([DANG])
  })

  it('thiếu dữ liệu (chưa có trạng thái vững) ⇒ không đổi gì', async () => {
    const d = taoD1That()
    chuanBiKiem(d, false)
    const truoc = [d.chup('omni_q'), d.chup('omni_q_nghi')].join('\n')
    const kq = await kiemDinhQTuan(d.env, NAY)
    expect(kq).toMatchObject({ ok: true, chay: true, soThemNhan: 0, soNghi: 0, soGoiYThay: 0 })
    expect([d.chup('omni_q'), d.chup('omni_q_nghi')].join('\n')).toBe(truoc)
    expect(d.dem('omni_q_nhat_ky')).toBe(0)
    const rong = taoD1That()
    expect(await kiemDinhQTuan(rong.env, NAY)).toMatchObject({ ok: true, chay: true, soCauXet: 0 })
  })

  it('câu nghi KHÔNG BAO GIỜ vào cau_nghi_dap_an (rút đề ca kiểm tra không bị ảnh hưởng) — chỉ vào omni_q_nghi', async () => {
    const d = taoD1That()
    chuanBiKiem(d)
    const kq = await kiemDinhQTuan(d.env, NAY)
    expect(kq).toMatchObject({ ok: true, soNghi: 1, soThemNhan: 2 })
    expect(d.sql.prepare('SELECT qid, so_lan, so_sai FROM omni_q_nghi').all()).toEqual([{ qid: 'Q2', so_lan: 40, so_sai: 28 }])
    expect(d.dem('cau_nghi_dap_an')).toBe(0)
  })

  it('không đè quyết định cũ của thầy trong cau_nghi_dap_an', async () => {
    const d = taoD1That()
    chuanBiKiem(d)
    d.sql.prepare("INSERT INTO cau_nghi_dap_an (qid, so_lan, so_sai, ty_le_sai, trang_thai, ghi_chu, luc) VALUES ('Q2', 9, 1, 0.1, 'dung_dap_an', 'Thầy đã kiểm: đáp án đúng', '2026-10-01T00:00:00.000Z')").run()
    await kiemDinhQTuan(d.env, NAY)
    expect(d.sql.prepare("SELECT trang_thai, ghi_chu FROM cau_nghi_dap_an WHERE qid = 'Q2'").get()).toEqual({ trang_thai: 'dung_dap_an', ghi_chu: 'Thầy đã kiểm: đáp án đúng' })
  })
})
