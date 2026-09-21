// @vitest-environment node
// VÁ LỖ CHỐT NGÀY (Boss + Code 1, 21/09): `chotExpNgayQua` cũ chạy MỘT lần/đêm và chỉ 40 em ⇒ em đạt mà chưa được ghi mất mảnh ngày ấy, và `matKhienVangNgay` chạy liền sau đếm ngày đó là VẮNG.
// Nay: chốt theo CON TRỎ (lô 40 em/lượt, cron mỗi phút chạy tiếp tới khi xong) và trừ khiên CHỈ SAU KHI chốt xong cho mọi em, một lần mỗi ngày, trong khung 00:02–05:00 giờ VN.
import { describe, expect, it } from 'vitest'
import { chotExpNgayQua, chotExpNgayQuaDayDu } from '../server/src/exp-d1'
import { chotNgayRoiTruKhien } from '../server/src/khien-mat'
import { ghiSuKien } from '../server/src/su-kien-hoc'
import { taoD1That, type D1That } from './_d1-that'

const HOM_QUA = '2026-09-27'
const TU = '2026-09-01T00:00:00.000Z'
const T = (s: string): number => Date.parse(`${s}+07:00`)
const VN_00_01 = T('2026-09-28T00:01:00')
const VN_00_02 = T('2026-09-28T00:02:00')
const VN_12_00 = T('2026-09-28T12:00:00')
const hoSoGame = (o: Record<string, unknown> = {}) => ({ pet: 'dat_quy', choice: false, legacy: null, cap: 5, exp: 0, wallet: 0, earned: 0, tower: 1, mastery: [], arena: null, cutover: '2026-08-01T00:00:00.000Z', ...o })

/** N em (E00…): đã làm 4 câu hôm qua bằng đường CHƯA gọi capNhatExp, kế hoạch hôm qua đã chốt "dat"; cờ EXP mới BẬT cho toàn trường; mỗi em có hồ sơ game (để mảnh cộng được). */
async function dung(n: number, o: { moc?: boolean } = {}): Promise<D1That> {
  const d = taoD1That()
  d.sql.prepare("INSERT OR REPLACE INTO cau_hinh(khoa,gia_tri,cap_nhat_luc) VALUES('exp_moi',?,'x')").run(JSON.stringify({ tu: TU, toanBo: true, dsSbd: [] }))
  if (o.moc !== false) d.sql.prepare("INSERT OR REPLACE INTO cau_hinh(khoa,gia_tri,cap_nhat_luc) VALUES('khien_moc','2026-09-21','x')").run()
  for (let i = 0; i < n; i++) {
    const sbd = `E${String(i).padStart(2, '0')}`
    d.sql.prepare("INSERT OR IGNORE INTO hoc_sinh(sbd,ho_ten,cap_nhat_luc) VALUES(?,'x','x')").run(sbd)
    d.sql.prepare('INSERT INTO game_v2_profile(sbd,revision,json,created_at) VALUES(?,0,?,?)').run(sbd, JSON.stringify(hoSoGame({ khienRen: { manh: 0, daRen: 1 } })), 'x')
    d.sql.prepare(
      `INSERT OR REPLACE INTO ke_hoach_ngay(khoa,sbd,ngay,phien_ban,seed,ngan_sach_json,viec_json,canh_bao_json,ket_qua,la_ngay_nghi,so_su_kien,cap_nhat_luc) VALUES(?,?,?,1,1,?,?,'[]','dat',0,0,'x')`,
    ).run(`${sbd}|${HOM_QUA}`, sbd, HOM_QUA, JSON.stringify({ mucTieuCau: 8, toiThieuCau: 4 }), JSON.stringify({ viec: [], tienBo: { soCauToiHan: 0, treNhip: false } }))
    const sk = [1, 2, 3, 4].map((k) => ({ nguon: 'btvn' as const, maNguon: 'B', sbd, qid: `DE1-I-${k}`, lan: k, ketQua: 1 as const, luc: `${HOM_QUA}T05:0${k}:00.000Z` }))
    expect((await ghiSuKien(d.env, sk)).ok).toBe(true)
  }
  return d
}
const soDat = (d: D1That): string[] => (d.sql.prepare("SELECT sbd FROM manh_khien_so WHERE loai = 'dat' AND ngay_vn = ? ORDER BY sbd").all(HOM_QUA) as { sbd: string }[]).map((x) => x.sbd)
const trangThai = (d: D1That) => JSON.parse((d.sql.prepare("SELECT gia_tri FROM cau_hinh WHERE khoa = 'chot_exp_ngay_qua'").get() as { gia_tri: string } | undefined)?.gia_tri ?? '{}') as { ngay?: string; sbdCuoi?: string; xong?: boolean }

describe('chốt "đạt ngày" đầy đủ theo con trỏ', () => {
  it('lỗ cũ được chứng minh: chotExpNgayQua (một lô) bỏ sót em thứ 41+ và chạy lại KHÔNG bao giờ tới họ nếu tiếp tục cùng ngày cũ (đối chứng, giữ nguyên hàm cũ)', async () => {
    const d = await dung(45)
    const r = await chotExpNgayQua(d.env, VN_00_01)
    expect(r.soEm).toBe(40)
  })
  it('45 em, lô 40: lượt 1 xử lý 40 (chưa xong), lượt 2 xử lý 5 (xong); MỌI em đều có mảnh ngày đạt; lượt 3 không làm gì', async () => {
    const d = await dung(45)
    const l1 = await chotExpNgayQuaDayDu(d.env, VN_00_01)
    expect(l1).toMatchObject({ soEm: 40, xong: false, ngay: HOM_QUA })
    expect(trangThai(d)).toMatchObject({ ngay: HOM_QUA, xong: false, sbdCuoi: 'E39' })
    expect(soDat(d)).toHaveLength(40)
    const l2 = await chotExpNgayQuaDayDu(d.env, VN_00_02)
    expect(l2).toMatchObject({ soEm: 5, xong: true })
    expect(soDat(d)).toHaveLength(45) // em thứ 41–45 KHÔNG còn mất mảnh
    const truoc = d.chup('manh_khien_so')
    expect(await chotExpNgayQuaDayDu(d.env, VN_00_02 + 60_000)).toMatchObject({ soEm: 0, xong: true })
    expect(d.chup('manh_khien_so')).toBe(truoc)
  })
  it('lô đúng bằng 40 em: lượt sau xử lý 0 rồi mới xong (không bỏ sót, không xong sớm)', async () => {
    const d = await dung(6)
    expect(await chotExpNgayQuaDayDu(d.env, VN_00_01, { toiDa: 3 })).toMatchObject({ soEm: 3, xong: false })
    expect(await chotExpNgayQuaDayDu(d.env, VN_00_02, { toiDa: 3 })).toMatchObject({ soEm: 3, xong: false }) // lô đầy ⇒ chưa biết còn không
    expect(await chotExpNgayQuaDayDu(d.env, VN_00_02 + 60_000, { toiDa: 3 })).toMatchObject({ soEm: 0, xong: true })
    expect(soDat(d)).toHaveLength(6)
  })
  it('em KHÔNG tạo khoản (kế hoạch chốt "dat" nhưng luật EXP không đạt) không làm chốt kẹt mãi: con trỏ vẫn chạy hết và `xong`', async () => {
    const d = await dung(4)
    d.sql.prepare("DELETE FROM su_kien_hoc WHERE sbd = 'E01'").run() // E01: kế hoạch 'dat' nhưng sổ trống ⇒ capNhatExp không tạo `dat|`
    let xong = false
    for (let i = 0; i < 6 && !xong; i++) xong = (await chotExpNgayQuaDayDu(d.env, VN_00_01 + i * 60_000, { toiDa: 2 })).xong
    expect(xong).toBe(true)
  })
  it('đã `xong` thì DỪNG: em có kế hoạch chốt "dat" xuất hiện SAU đó không bị xử lý lại trong cùng đêm; sang ngày mới con trỏ về đầu (em có sbd nhỏ hơn con trỏ cũ vẫn được chốt)', async () => {
    const d = await dung(3)
    await chotExpNgayQuaDayDu(d.env, VN_00_01)
    expect(trangThai(d)).toMatchObject({ xong: true, sbdCuoi: 'E02' })
    // em E99 có kế hoạch 'dat' hôm qua nhưng xuất hiện sau khi chốt xong
    d.sql.prepare("INSERT OR IGNORE INTO hoc_sinh(sbd,ho_ten,cap_nhat_luc) VALUES('E99','x','x')").run()
    d.sql.prepare("INSERT INTO game_v2_profile(sbd,revision,json,created_at) VALUES('E99',0,?,'x')").run(JSON.stringify(hoSoGame()))
    d.sql.prepare(`INSERT INTO ke_hoach_ngay(khoa,sbd,ngay,phien_ban,seed,ngan_sach_json,viec_json,canh_bao_json,ket_qua,la_ngay_nghi,so_su_kien,cap_nhat_luc) VALUES('E99|${HOM_QUA}','E99','${HOM_QUA}',1,1,?,?,'[]','dat',0,0,'x')`)
      .run(JSON.stringify({ mucTieuCau: 8, toiThieuCau: 4 }), JSON.stringify({ viec: [], tienBo: { soCauToiHan: 0, treNhip: false } }))
    expect(await chotExpNgayQuaDayDu(d.env, VN_00_02)).toMatchObject({ soEm: 0, xong: true })
    // ngày 28: kế hoạch 'dat' của E00 (sbd NHỎ hơn con trỏ cũ E02) phải được chốt vào đêm 29
    d.sql.prepare(`INSERT INTO ke_hoach_ngay(khoa,sbd,ngay,phien_ban,seed,ngan_sach_json,viec_json,canh_bao_json,ket_qua,la_ngay_nghi,so_su_kien,cap_nhat_luc) VALUES('E00|2026-09-28','E00','2026-09-28',1,1,?,?,'[]','dat',0,0,'x')`)
      .run(JSON.stringify({ mucTieuCau: 8, toiThieuCau: 4 }), JSON.stringify({ viec: [], tienBo: { soCauToiHan: 0, treNhip: false } }))
    const r = await chotExpNgayQuaDayDu(d.env, T('2026-09-29T00:02:00'))
    expect(r).toMatchObject({ ngay: '2026-09-28', soEm: 1 })
  })
  it('sang NGÀY MỚI con trỏ đặt lại (không xong nhầm theo ngày cũ); cờ EXP mới tắt ⇒ xong ngay, không làm gì', async () => {
    const d = await dung(3)
    await chotExpNgayQuaDayDu(d.env, VN_00_01)
    expect(trangThai(d)).toMatchObject({ ngay: HOM_QUA, xong: true })
    const ngayMoi = T('2026-09-29T00:02:00')
    const r = await chotExpNgayQuaDayDu(d.env, ngayMoi)
    expect(r.ngay).toBe('2026-09-28')
    expect(r.xong).toBe(true) // ngày 28 chưa có kế hoạch 'dat' nào ⇒ lô rỗng ⇒ xong
    expect(trangThai(d)).toMatchObject({ ngay: '2026-09-28', xong: true })
    const tat = taoD1That()
    expect(await chotExpNgayQuaDayDu(tat.env, VN_00_01)).toMatchObject({ soEm: 0, xong: true })
  })
})

describe('trừ khiên chỉ sau khi chốt ngày xong cho mọi em, một lần mỗi ngày, trong khung 00:02–05:00', () => {
  const dungKhien = async (n: number) => {
    const d = await dung(n)
    // Em Z: vắng 21→27/09 (7 ngày), có 1 khiên rèn: SẼ bị trừ nếu trừ khiên chạy; em E00 đạt hôm qua (sẽ có `dat|27/09`) nên KHÔNG bị trừ nhờ chốt ngày.
    d.sql.prepare('INSERT INTO game_v2_profile(sbd,revision,json,created_at) VALUES(?,0,?,?)').run('ZZ', JSON.stringify(hoSoGame({ khienRen: { manh: 0, daRen: 1 } })), 'x')
    d.sql.prepare("INSERT OR IGNORE INTO hoc_sinh(sbd,ho_ten,cap_nhat_luc) VALUES('ZZ','x','x')").run()
    for (let i = 0; i < n; i++) { // mọi E?? đã có khiên rèn 1 (dung) — đạt các ngày 21..26 để chỉ ngày 27 quyết định
      for (let k = 0; k <= 5; k++) d.sql.prepare("INSERT OR IGNORE INTO manh_khien_so(khoa,sbd,ngay_vn,loai,so,luc,ghi_chu) VALUES(?,?,?,'dat',1,?,'x')").run(`E${String(i).padStart(2, '0')}|manh|dat|2026-09-2${1 + k}`, `E${String(i).padStart(2, '0')}`, `2026-09-2${1 + k}`, `2026-09-2${1 + k}T05:00:00.000Z`)
    }
    return d
  }
  const daTru = (d: D1That) => (d.sql.prepare('SELECT sbd FROM khien_mat_so ORDER BY sbd').all() as { sbd: string }[]).map((x) => x.sbd)

  it('chốt CHƯA xong ⇒ KHÔNG trừ khiên (em đạt nhưng chưa được ghi mảnh không bị đếm là vắng); chốt xong ⇒ trừ đúng em vắng thật, MỘT lần', async () => {
    const d = await dungKhien(5)
    const l1 = await chotNgayRoiTruKhien(d.env, VN_00_02, { toiDa: 2 })
    expect(l1).toMatchObject({ trongKhung: true, chotXong: false, truKhien: null })
    expect(daTru(d)).toEqual([])
    expect(await chotNgayRoiTruKhien(d.env, VN_00_02 + 60_000, { toiDa: 2 })).toMatchObject({ chotXong: false, truKhien: null })
    expect(daTru(d)).toEqual([])
    const l3 = await chotNgayRoiTruKhien(d.env, VN_00_02 + 120_000, { toiDa: 2 }) // lô cuối chỉ 1 em (< 2) ⇒ chốt XONG ⇒ mới trừ khiên, ngay lượt này
    expect(l3.chotXong).toBe(true)
    expect(l3.truKhien).toMatchObject({ chay: true, soTru: 1 })
    expect(daTru(d)).toEqual(['ZZ']) // chỉ ZZ (vắng thật); E?? đã đạt 27/09 nhờ chốt ngày ⇒ không mất khiên
    const ll = await chotNgayRoiTruKhien(d.env, VN_00_02 + 180_000, { toiDa: 2 })
    expect(ll).toMatchObject({ chotXong: true, truKhien: null }) // đã trừ hôm nay: KHÔNG chạy lại
    expect(daTru(d)).toEqual(['ZZ'])
    expect(soDat(d)).toHaveLength(5)
  })

  it('ngoài khung 00:02–05:00 (00:01, 05:00, 12:00) không làm gì và không truy vấn', async () => {
    const d = await dungKhien(2)
    for (const luc of [VN_00_01, T('2026-09-28T05:00:00'), VN_12_00, T('2026-09-28T23:59:00')]) {
      expect(await chotNgayRoiTruKhien(d.env, luc)).toEqual({ trongKhung: false, chotXong: false, truKhien: null, soEmChot: 0 })
    }
    expect(daTru(d)).toEqual([]); expect(soDat(d)).toHaveLength(0)
    expect(await chotNgayRoiTruKhien(d.env, T('2026-09-28T04:59:00'))).toMatchObject({ trongKhung: true, chotXong: true })
  })

  it('chưa đặt mốc khiên ⇒ chốt ngày vẫn chạy nhưng không trừ khiên và không đánh dấu đã chạy (mốc đặt sau thì lượt sau chạy)', async () => {
    const d = await dungKhien(2)
    d.sql.exec("DELETE FROM cau_hinh WHERE khoa = 'khien_moc'")
    const a = await chotNgayRoiTruKhien(d.env, VN_00_02)
    expect(a.chotXong).toBe(true); expect(a.truKhien).toMatchObject({ chay: false, lyDo: 'chua_dat_moc' })
    expect(d.sql.prepare("SELECT 1 FROM cau_hinh WHERE khoa = 'khien_mat_ngay'").get()).toBeUndefined()
    d.sql.prepare("INSERT INTO cau_hinh(khoa,gia_tri,cap_nhat_luc) VALUES('khien_moc','2026-09-21','x')").run()
    expect((await chotNgayRoiTruKhien(d.env, VN_00_02 + 60_000)).truKhien).toMatchObject({ chay: true, soTru: 1 })
  })
})
