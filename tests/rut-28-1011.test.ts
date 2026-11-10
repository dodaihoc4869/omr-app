// @vitest-environment node
// ĐỀ 28 THEO SUẤT (thầy 10/11: «mỗi ngày chỉ 28 câu nhưng chuẩn chính xác ma trận của đề thi đại học … Sửa cũng 28 câu theo cấu trúc … ôn lại … cá nhân hóa
// … trọn vẹn»; duyệt «bản kịp hạn, build và đẩy lên bản sống luôn, kiểm tra ôn tập để đúng 28 câu bỏ 12 câu»). Đặc tả: docs/de-xuat-28-cau-v6-1011.md.
// Khoá: (1) lõi `rut28` — 28 suất 12·4·2 / 2·2 / 3·3, nguồn chính lệch mức trong cùng phần, không lệch phần khi kho còn câu; (2) `chonGoi7` theo suất trên
// bài THẬT lệch ô (số đo workflow do-ma-tran-28-1011); (3) nợ ôn theo dạng; (4) ngày Kiểm tra ôn tập từ 11/11 không còn 12 câu bài; (5) nối vào `lapGoi7`.
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { taoKhoOmni, themChienDich, lam } from './omni-3-ke-hoach-chung'
import { dongBoGoi7, lapGoi7 } from '../server/src/goi-bai-7'
import { chonGoi7, type CauGoi7 } from '../server/src/goi-bai-7-loi'
import { rut28, rut28Lech, noOnDang, xepOnTheoNo, NGAY_DE_28, O_28, SUAT_28, TRAN_H, TRAN_H_CUOI, type UngVien28 } from '../server/src/rut-28'
import { oMaTran, MA_TRAN_RUT_MOI } from '../server/src/ma-tran-rut-moi'
import { KHUNG_KT_2026 } from '../server/src/kiem-tra-ca-nhan-ma-tran'
import { dongGoiDe2026 } from '../server/src/kiem-tra-ca-nhan-chu-ky'
import { coHocNgayKt, metaKt, tomTatKt } from '../server/src/kiem-tra-ca-nhan'
import { damBaoKtCn } from '../server/src/kiem-tra-ca-nhan-schema'
import { damBaoBangBaiDaDay, xoaDemPhamVi } from '../server/src/bai-da-day'
import { xoaDemChienDich } from '../server/src/srs2-d1'
import { xoaDemCaBaoVe } from '../server/src/game-v2-bank'
import { xoaMoiDem } from '../server/src/dem-chung'

const tao = (tt: string, so: readonly number[], tang: number): UngVien28[] => O_28.flatMap((o, i) => Array.from({ length: so[i]! }, (_, k) => ({ qid: `${tt}-${o}-${k}`, o, tang })))
const oCuaId = (qid: string) => qid.split('-')[1]!
const demO = (ids: readonly string[]) => O_28.map((o) => ids.filter((q) => oCuaId(q) === o).length)
const phan = (ids: readonly string[]) => ['I', 'II', 'III'].map((p) => ids.filter((q) => oCuaId(q).split('|')[0] === p).length)

describe('rut28 — lõi thuần', () => {
  it('28 suất = ma trận blueprint 12·4·2 / 2·2 / 3·3', () => {
    expect(O_28).toEqual(['I|biet', 'I|hieu', 'I|van_dung', 'II|hieu', 'II|van_dung', 'III|hieu', 'III|van_dung'])
    expect(SUAT_28).toEqual([12, 4, 2, 2, 2, 3, 3])
    expect(SUAT_28.reduce((a, b) => a + b, 0)).toBe(28)
    expect(KHUNG_KT_2026).toBe(MA_TRAN_RUT_MOI) // một bảng cho mọi đường rút của máy chủ
  })
  it('kho dư mọi ô ⇒ đúng từng ô; trả về theo thứ tự ứng viên', () => {
    const ung = tao('moi', [30, 30, 30, 30, 30, 30, 30], 0)
    const ra = rut28({ ung, can: 28 })
    expect(demO(ra)).toEqual([12, 4, 2, 2, 2, 3, 3])
    expect(ra).toEqual(ung.map((u) => u.qid).filter((q) => ra.includes(q)))
  })
  it('nguồn chính dư một ô ⇒ lệch MỨC trong cùng phần, KHÔNG lệch phần; suất phần khác lấy nguồn phụ đúng ô', () => {
    // câu mới chỉ có Phần I mức Hiểu (40 câu); nguồn phụ (ôn) đủ mọi ô
    const ung = [...tao('moi', [0, 40, 0, 0, 0, 0, 0], 0), ...tao('on', [20, 20, 20, 20, 20, 20, 20], 1)]
    const ra = rut28({ ung, can: 28 })
    expect(phan(ra)).toEqual([18, 4, 6])
    expect(ra.filter((q) => q.startsWith('moi'))).toHaveLength(18) // 18 suất Phần I đều là câu mới (4 đúng ô + 14 lệch mức)
    expect(demO(ra.filter((q) => q.startsWith('on')))).toEqual([0, 0, 0, 2, 2, 3, 3])
  })
  it('nguồn phụ: đúng ô trước; chỉ lệch khi ô ấy cả kho hết câu, và lệch trong cùng phần trước', () => {
    const ra = rut28({ ung: tao('on', [40, 0, 0, 9, 0, 9, 9], 1), can: 28 })
    expect(phan(ra)).toEqual([18, 4, 6]) // I-Hiểu, I-VD, II-VD trống ⇒ lấy I-Biết / II-Hiểu, không lấy sang phần khác
  })
  it('một phần hết sạch câu ⇒ vẫn đủ 28 (bù phần khác)', () => {
    const ra = rut28({ ung: tao('on', [40, 10, 10, 0, 0, 9, 9], 1), can: 28 })
    expect(ra).toHaveLength(28)
    expect(phan(ra)[1]).toBe(0)
  })
  it('câu đã làm hôm nay chiếm suất trước ⇒ phần còn lại bù đúng cấu trúc', () => {
    const daLamO = Array.from({ length: 18 }, (_, i) => (i < 12 ? 'I|biet' : i < 16 ? 'I|hieu' : 'I|van_dung'))
    const ra = rut28({ ung: tao('moi', [30, 30, 30, 30, 30, 30, 30], 0), can: 10, daLamO })
    expect(demO(ra)).toEqual([0, 0, 0, 2, 2, 3, 3])
  })
  it('`lech` đếm câu phải lấy lệch ô ở nguồn phụ (nguồn chính lệch mức không tính) — nơi gọi dựa vào đó để nạp ôn sớm', () => {
    expect(rut28Lech({ ung: tao('moi', [0, 40, 0, 9, 9, 9, 9], 0), can: 28 }).lech).toBe(0)
    expect(rut28Lech({ ung: tao('on', [40, 9, 9, 9, 9, 9, 9], 1), can: 28 }).lech).toBe(0)
    expect(rut28Lech({ ung: tao('on', [40, 0, 0, 9, 9, 9, 9], 1), can: 28 }).lech).toBe(6) // 4 suất I-Hiểu + 2 suất I-VD lấy câu I-Biết
  })
  it('3000 kho ngẫu nhiên: không lặp, đủ số, đúng 18/4/6 khi mỗi phần đủ câu', () => {
    let s = 12345
    const rnd = (n: number) => { s = (Math.imul(s, 1103515245) + 12345) >>> 0; return s % n }
    for (let lan = 0; lan < 3000; lan++) {
      const ung = [...tao('a', O_28.map(() => rnd(9)), 0), ...tao('b', O_28.map(() => rnd(14)), 1), ...tao('c', O_28.map(() => rnd(14)), 1)]
      const ra = rut28({ ung, can: 28 })
      expect(new Set(ra).size).toBe(ra.length)
      expect(ra).toHaveLength(Math.min(28, ung.length))
      const co = phan(ung.map((u) => u.qid))
      if (co[0]! >= 18 && co[1]! >= 4 && co[2]! >= 6) expect(phan(ra)).toEqual([18, 4, 6])
    }
  })
})

describe('chonGoi7 theo suất — bài thật lệch ô', () => {
  // Bài 9. Amino acid (P1), số đo thật 10/11: I 18·51·17 · II 3·11·12 · III 6·21·12 (ô Biết của Phần II, III quy về Hiểu như `oMaTran`).
  const SO: [string, string, number][] = [['I', 'biet', 18], ['I', 'hieu', 51], ['I', 'van_dung', 17], ['II', 'biet', 3], ['II', 'hieu', 11], ['II', 'van_dung', 12], ['III', 'biet', 6], ['III', 'hieu', 21], ['III', 'van_dung', 12]]
  const cau: CauGoi7[] = SO.flatMap(([p, m, n]) => Array.from({ length: n }, (_, k) => ({ qid: `moi-${p}|${m}-${k}`, maDe: 'B9', version: 'v1', group: `g${p}${m}${k}`, phan: p as 'I', kho: false, tinhToan: false, kyNang: [], mucDo: m })))
  const cu = (tt: string, n: number) => SO.flatMap(([p, m]) => Array.from({ length: n }, (_, k) => `${tt}-${p}|${m}-${k}`))
  const oCua = (qid: string) => { const [p, m] = qid.split('-')[1]!.split('|'); return oMaTran(p, m) }
  const phanId = (ids: readonly string[]) => ['I', 'II', 'III'].map((p) => ids.filter((q) => q.split('-')[1]!.split('|')[0] === p).length)

  it('ngày Học mới và ngày Sửa đều 18/4/6; câu mới hết sau 7 ngày Học mới (Phần II 26 câu ÷ 4 suất)', () => {
    const daGap = new Set<string>()
    let sua = cu('sua', 6), on = cu('on', 40) // đủ câu Phần I cho 10 ngày (180 suất: 86 mới + 18 sửa + 120 ôn)
    let ngayMoi = 0
    for (const loai of ['moi', 'moi', 'sua', 'moi', 'moi', 'sua', 'moi', 'moi', 'sua', 'moi'] as const) {
      const conMoi = cau.filter((c) => !daGap.has(c.qid)).length
      const ra = chonGoi7({ cau, daGap, daLamNgay: new Set(), quotaCon: 0, sanSang: new Set([...cau.map((c) => c.qid), ...sua, ...on]), chan: new Set(), sua, on, mucTieuNgay: 28, chiTrongMuc: true,
        nhomPhu: [{ qids: cau.map((c) => c.qid), quota: loai === 'sua' ? 0 : conMoi }], ngay: '2026-11-11', loaiNgay: loai, suat: { oCua, daLamO: [] } }).viec
      expect(ra).toHaveLength(28)
      expect(phanId(ra.map((v) => v.qid))).toEqual([18, 4, 6])
      const moi = ra.filter((v) => v.vai === 'moi').map((v) => v.qid)
      if (loai === 'moi' && moi.length) ngayMoi++
      if (loai === 'sua') expect(ra[0]!.vai).toBe('sua') // câu sai đứng đầu ngày Sửa
      if (loai === 'moi' && conMoi >= 28) expect(ra[0]!.vai).toBe('moi')
      for (const q of moi) daGap.add(q)
      const lay = new Set(ra.map((v) => v.qid)); sua = sua.filter((q) => !lay.has(q)); on = on.filter((q) => !lay.has(q))
    }
    expect(cau.filter((c) => !daGap.has(c.qid))).toHaveLength(0)
    expect(ngayMoi).toBe(7)
  })
  it('thiếu câu đúng ô ⇒ `lech` > 0; nạp ôn sớm thì hết lệch (ôn sớm lấp đúng ô, đứng cuối đề)', () => {
    const sua = Array.from({ length: 40 }, (_, k) => `sua-I|hieu-${k}`), som = cu('som', 8)
    const vao = { cau, daGap: new Set(cau.map((c) => c.qid)), daLamNgay: new Set<string>(), quotaCon: 0, sanSang: new Set([...sua, ...som]), chan: new Set<string>(), sua, on: [], mucTieuNgay: 28, chiTrongMuc: true,
      nhomPhu: [{ qids: cau.map((c) => c.qid), quota: 0 }], ngay: '2026-11-11', loaiNgay: 'sua' as const, suat: { oCua, daLamO: [] } }
    const thieu = chonGoi7(vao)
    expect(thieu.viec).toHaveLength(28)
    expect(thieu.lech).toBe(10) // 18 suất Phần I do câu sai lấp (nguồn chính); 10 suất Phần II, III không có câu ⇒ lệch phần
    const du = chonGoi7({ ...vao, onSom: som })
    expect(du.lech).toBe(0)
    expect(phanId(du.viec.map((v) => v.qid))).toEqual([18, 4, 6])
    expect(du.viec.slice(0, 18).every((v) => v.vai === 'sua')).toBe(true)
  })
  it('nhóm phụ = cả kho dùng lại thứ tự `moi` (không sắp lần hai) và quota 0 bỏ qua nhóm: kết quả y như đường sắp đủ', () => {
    const base = { cau, daGap: new Set(cau.slice(0, 20).map((c) => c.qid)), daLamNgay: new Set<string>(), quotaCon: 0, sanSang: new Set(cau.map((c) => c.qid)), chan: new Set<string>(), sua: [], on: [], mucTieuNgay: 28, chiTrongMuc: true, ngay: '2026-11-12' }
    const ids = cau.map((c) => c.qid)
    for (const quota of [0, 9, 28, 200]) {
      const nhanh = chonGoi7({ ...base, nhomPhu: [{ qids: ids, quota }] })
      const cham = chonGoi7({ ...base, nhomPhu: [{ qids: [...ids, 'khong-co-trong-kho'], quota }] }) // ids.size ≠ kho ⇒ đường sắp đủ
      expect(nhanh).toEqual(cham)
    }
  })
  it('không truyền `suat` ⇒ hành vi cũ nguyên vẹn (ngày Sửa lấy câu sai theo thứ tự, không theo ô)', () => {
    const sua = Array.from({ length: 30 }, (_, k) => `sua-I|hieu-${k}`)
    const ra = chonGoi7({ cau, daGap: new Set(), daLamNgay: new Set(), quotaCon: 0, sanSang: new Set(sua), chan: new Set(), sua, on: [], mucTieuNgay: 28, chiTrongMuc: true, nhomPhu: [{ qids: cau.map((c) => c.qid), quota: 0 }], loaiNgay: 'sua' }).viec
    expect(ra.map((v) => v.qid)).toEqual(sua.slice(0, 28))
  })
})

describe('nợ ôn theo dạng', () => {
  const ls = (...x: [string, boolean][]) => ({ lichSu: x.map(([ngay, dung]) => ({ ngay, dung })) })
  const tt = new Map([
    ['a1', ls(['2026-11-01', true], ['2026-11-05', true])], // dạng A: giữ đúng 01 → 05/11 ⇒ h = 1 + 4 = 5, chạm cuối 05/11
    ['b1', ls(['2026-11-05', true], ['2026-11-09', false])], // dạng B: vừa sai ở lần chạm cuối ⇒ h = 1
    ['c1', ls(['2026-09-01', true])], ['c2', ls(['2026-09-07', true])], // dạng C (hai câu): giữ đúng 01 → 07/09 ⇒ h = 7, chạm cuối 07/09
    ['e1', ls(['2026-08-01', false], ['2026-08-02', true], ['2026-10-12', true])], // dạng E: sai 01/08, giữ đúng tới 12/10 (72 ngày) ⇒ h chạm trần
  ])
  const dang = (q: string) => q[0]!.toUpperCase()
  it('nợ = số ngày chưa chạm ÷ h; h = 1 + quãng em đã giữ đúng dạng ấy, trần 30 ngày (3 tháng cuối: 14)', () => {
    const no = noOnDang(tt, dang, '2026-11-11')
    expect(no.get('A')).toBe(6 / 5)
    expect(no.get('B')).toBe(2)
    expect(no.get('C')).toBeCloseTo(65 / 7, 10)
    expect(no.get('E')).toBeCloseTo(30 / TRAN_H, 10)
    expect(noOnDang(tt, dang, '2027-03-22').get('E')).toBeCloseTo(161 / TRAN_H_CUOI, 10)
  })
  it('xếp: dạng nợ lớn trước, mỗi dạng một câu rồi mới tới câu thứ hai; dạng chưa chạm = nợ 1', () => {
    const no = noOnDang(tt, dang, '2026-11-11') // C 9,29 · B 2 · A 1,2 · D (chưa chạm) 1 · E 1 (đứng sau D vì cùng nợ, vào hàng sau)
    expect(xepOnTheoNo(['a1', 'a2', 'b1', 'c1', 'c2', 'd1', 'e1'], dang, no)).toEqual(['c1', 'b1', 'a1', 'd1', 'e1', 'c2', 'a2'])
  })
})

describe('ngày Kiểm tra ôn tập đúng 28 câu (bỏ 12 câu bài) từ 11/11', () => {
  const de = { phienBan: 3, baiNgayToiThieu: 12, lyDo: 'Kiểm tra', bai: [], muc: [], cau: [], soPhu: 0, phut: 50, thieu: [], chang: [] }
  const dong = (ngay: string) => ({ id: `ktcn:S1:${ngay}`, sbd: 'S1', ngay, mo_luc: 0, han_luc: 9e15, trang_thai: 'hen', nop_luc: null, json: JSON.stringify(de), tra_json: '{}' })
  it('lịch đã lập kèm 12 câu: ngày trước mốc giữ 12; từ mốc đọc là «chỉ làm bài kiểm tra» — không sửa dữ liệu', () => {
    expect(NGAY_DE_28).toBe('2026-11-11')
    expect(coHocNgayKt(dong('2026-11-10'))).toBe(true)
    expect(coHocNgayKt(dong('2026-11-11'))).toBe(false)
    expect(tomTatKt(dong('2026-11-10'), 1)).toMatchObject({ baiNgayToiThieu: 12 })
    expect(tomTatKt(dong('2026-11-11'), 1)).not.toHaveProperty('baiNgayToiThieu')
  })
  it('đề lập mới: ngày từ mốc không ghi 12 câu bài', () => {
    const a = { qids: [], nguon: [], muc: [], viKyNang: [], anhXa: new Map<string, string>(), bai: [], thieu: [], soDe: 1, lan: 1, chuKyPhu: 0, seed: 's', lyDo: 'x' }
    expect(dongGoiDe2026({ ...a, ngay: '2026-11-10' }).de).toMatchObject({ baiNgayToiThieu: 12 })
    expect(dongGoiDe2026({ ...a, ngay: '2026-11-11' }).de).not.toHaveProperty('baiNgayToiThieu')
  })
})

describe('lapGoi7 từ 11/11 — đề 28 theo suất', () => {
  const NOW = Date.parse('2026-11-11T02:00:00Z') // 09:00 Thứ Tư 11/11 giờ VN
  const NGAY_MS = 86_400_000
  beforeEach(() => { vi.useFakeTimers({ toFake: ['Date'] }); vi.setSystemTime(NOW) })
  afterEach(() => { vi.useRealTimers(); xoaDemPhamVi(); xoaDemChienDich(); xoaDemCaBaoVe(); xoaMoiDem() })
  async function kho(n = 127) {
    const k = taoKhoOmni({ 'DH-B8': n })
    await damBaoBangBaiDaDay(k.env)
    k.d.sql.exec(`INSERT INTO de_kho(ma_de,ten_de,so_cau,da_xoa,cap_nhat_luc) VALUES('DH-B8','Bài 8. Amine',${n},0,'v1');INSERT INTO game_v2_index(ma_de,source_version,indexed_at) VALUES('DH-B8','v1','x');
      INSERT INTO cau_hinh(khoa,gia_tri,cap_nhat_luc) VALUES('goi_bai_7_v1','{"bat":true,"batDau":"2026-11-05"}','x')`)
    k.d.sql.prepare('INSERT INTO bai_da_day(id,lop,khoa_bai,ten_bai,vi_tri,ma_to_json,tick_luc) VALUES(?,?,?,?,?,?,?)')
      .run('amine', '12A1', 'B8', 'Bài 8. Amine', 8, '["DH-B8-TN","DH-B8-DS","DH-B8-TLN"]', '2026-11-08T11:00:00Z')
    themChienDich(k.d, { id: 'hanh-trinh-v3-khoi-12', qids: k.qids('DH-B8'), maDe: ['DH-B8'], sbd: ['S1'], hanNop: '9999-12-31', taoLuc: '2026-10-01T00:00:00Z', theLuc: 24, huyetChien: false })
    await dongBoGoi7(k.env, NOW - 2 * NGAY_MS)
    return k
  }
  const phanCuaKho = (k: Awaited<ReturnType<typeof kho>>, ids: readonly string[]) => {
    const p = new Map((k.d.sql.prepare("SELECT qid, json_extract(json,'$.phan') p FROM game_v2_question").all() as { qid: string; p: string }[]).map((r) => [r.qid, r.p]))
    return ['I', 'II', 'III'].map((x) => ids.filter((q) => p.get(q.replace(/~.*$/, '')) === x).length)
  }
  it('ngày Học mới: 28 câu, đúng 18 trắc nghiệm · 4 đúng/sai · 6 trả lời ngắn', async () => {
    const k = await kho()
    const lap = await lapGoi7(k.env, 'S1', NOW)
    expect(lap!.loaiNgay).toBe('moi')
    expect(lap!.plan.viec).toHaveLength(28)
    expect(phanCuaKho(k, lap!.plan.viec.map((v) => v.qid))).toEqual([18, 4, 6])
  })
  it('em đã làm dở trong ngày: phần còn lại bù cho đủ cấu trúc cả ngày', async () => {
    const k = await kho()
    const dau = (await lapGoi7(k.env, 'S1', NOW))!.plan.viec.map((v) => v.qid)
    for (const q of dau.slice(0, 10)) await lam(k.env, 'S1', q, NOW - 3_600_000, true)
    xoaMoiDem()
    vi.setSystemTime(NOW + 1_200_000)
    const sau = (await lapGoi7(k.env, 'S1', NOW + 1_200_000))!
    expect(sau.daLamNgay).toBe(10)
    expect(sau.plan.viec).toHaveLength(18)
    expect(phanCuaKho(k, [...dau.slice(0, 10), ...sau.plan.viec.map((v) => v.qid)])).toEqual([18, 4, 6])
  })
  it('lịch Kiểm tra ôn tập hôm nay (đã lập kèm 12 câu): không còn «ngày học nhẹ 12 câu», không giao câu mới theo lịch', async () => {
    const k = await kho()
    await damBaoKtCn(k.env)
    const d = { phienBan: 3, baiNgayToiThieu: 12, lyDo: 'Kiểm tra', bai: [{ khoa: 'B8', ten: 'Bài 8. Amine' }], muc: [], cau: [], soPhu: 0, phut: 50, thieu: [], chang: [] }
    k.d.sql.exec(`INSERT INTO cau_hinh(khoa,gia_tri,cap_nhat_luc) VALUES('kiem_tra_ca_nhan_v1','{"bat":true}','x')`)
    k.d.sql.prepare("INSERT INTO kiem_tra_ca_nhan(id,sbd,lop,ngay,mo_luc,han_luc,trang_thai,json,cap_nhat_luc) VALUES('ktcn:S1:2026-11-11','S1','12A1','2026-11-11',?,?,'hen',?,?)").run(NOW - 3_600_000, NOW + 82_800_000, JSON.stringify(d), NOW)
    k.d.sql.prepare('INSERT INTO kiem_tra_ca_nhan_meta(id,meta_json) VALUES(?,?)').run('ktcn:S1:2026-11-11', JSON.stringify(metaKt(d as Parameters<typeof metaKt>[0])))
    xoaMoiDem()
    const lap = await lapGoi7(k.env, 'S1', NOW)
    expect(lap!.goi.some((g) => g.kiemNhe)).toBe(false)
    expect(lap!.goi.reduce((n, g) => n + g.quota, 0)).toBe(0)
  })
})
