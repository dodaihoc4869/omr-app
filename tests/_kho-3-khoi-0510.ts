// KHO 3 KHỐI + CÂU KHÔNG RÕ KHỐI + CÂU MÂU THUẪN KHỐI — dựng chung cho tests/chan-khac-khoi-*-0510 (luật thầy 05/10: "chặn chuẩn 100% không được rút nhầm kho khác khối").
// D1 THẬT (node:sqlite, đủ migration) + R2 giả: tờ kho đúng khuôn `kho/<mã>.json`, chỉ mục game dựng bằng đường thật `dongBoCacTo`.
//   TO[10] DH-10-C1-B1 (de_kho.lop 10) · TO[11] DH-11-C1-B1 (lop 11) · TO[12] DH-12-C1-B1 (lop 12, LỚN NHẤT để bộ lọc hở là dính)
//   TO_LA  LA-C1-B1     (không đọc ra khối: mã lạ, lop rỗng)
//   TO_MT  DH-11-C9-B1  (MÂU THUẪN: tờ nói 11, mã câu `DH-10-C9-B1-…` nói 10)
// CÙNG mã dạng `DANG`, cùng chuyên đề `CD1` ở mọi tờ — đúng cái bẫy ngoài đời (dạng/chuyên đề trùng tên giữa các khối).
// Em: S1, S2, S4 lớp 11 ("11 - Tinh Hoa"), S3 lớp 10, SX chưa xếp lớp. Sổ của S1/S2/S4: SAI câu MỌI tờ ở MỌI nguồn (ca đã công bố, Lên bảng,
// Kiểm tra đầu giờ, game — nguồn thứ 4, BTVN, Luyện đề) — đúng cảnh "câu lớp 10 nằm trong sổ của em lớp 11".
import { dongBoCacTo } from '../server/src/game-v2-bank'
import { ghiSuKien, type SuKien } from '../server/src/su-kien-hoc'
import { dungLaiHoSo } from '../server/src/ho-so-nam-kt'
import { taoD1That, type D1That } from './_d1-that'
import type { Khoi } from '../src/lib/khoi-cau'

export const TO: Record<Khoi, string> = { 10: 'DH-10-C1-B1', 11: 'DH-11-C1-B1', 12: 'DH-12-C1-B1' }
export const TO_LA = 'LA-C1-B1'
export const TO_MT = 'DH-11-C9-B1'
const QID_MT = 'DH-10-C9-B1' // tiền tố mã câu của tờ mâu thuẫn
export const CAC_TO = [TO[10], TO[11], TO[12], TO_LA, TO_MT]
/** Mã dạng ba tầng DÙNG CHUNG mọi tờ (đoạn đầu KHÔNG phải mã chương ⇒ không thêm nguồn khối) — bẫy "dạng trùng giữa các khối". */
export const DANG = 'CHUNG.DANG_A.NHAN_DANG'
const SO_I: Record<string, number> = { [TO[10]]: 8, [TO[11]]: 8, [TO[12]]: 20, [TO_LA]: 8, [TO_MT]: 8 }
const LOP_TO: Record<string, string> = { [TO[10]]: '10', [TO[11]]: '11', [TO[12]]: '12', [TO_LA]: '', [TO_MT]: '11' }
const PA = { A: 'Phương án A', B: 'Phương án B', C: 'Phương án C', D: 'Phương án D' }
const MUC = ['biet', 'hieu', 'van_dung'] as const

/** Mã câu thật của tờ (`<mã tờ>-<phần>-<số>`); tờ mâu thuẫn dùng tiền tố khối 10. */
export const qidCua = (to: string, phan: 'I' | 'II' | 'III', so: number): string => `${to === TO_MT ? QID_MT : to}-${phan}-${so}`
/** Câu có thuộc tờ ĐÚNG khối 11 duy nhất (TO[11]) không — bỏ hậu tố song sinh/lượt. */
export const laCauDung11 = (qid: string): boolean => String(qid).split(/[~#]/)[0]!.startsWith(`${TO[11]}-`)
export const laCauDung = (khoi: Khoi) => (qid: string): boolean => String(qid).split(/[~#]/)[0]!.startsWith(`${TO[khoi]}-`)

function cauKho(to: string, phan: 'I' | 'II' | 'III', so: number) {
  const muc = MUC[so % 3]!
  const chung = { qid: qidCua(to, phan, so), so, dang: { ma: DANG, ten: 'Dạng A' }, kienThuc: ['K1'], chuyen_de: 'CD1', muc_do: muc, loi_giai: { chot: `Lời giải ${to} ${phan}${so}.`, trang_thai: 'khop' } }
  if (phan === 'I') return { ...chung, phan, de: `Câu ${so} của ${to}: chọn phát biểu đúng.`, pa: PA, dap_an: 'B' }
  if (phan === 'II') return { ...chung, phan, de: `Cho các phát biểu ${so} của ${to}:`, y: { a: 'ý a', b: 'ý b', c: 'ý c', d: 'ý d' }, dap_an: 'DSDS' }
  return { ...chung, phan, de: `Tính số mol ${so} của ${to} (mol).`, dap_an: '0,5', loi_giai: { chot: 'Tính số mol.', ket_qua: '0,5', trang_thai: 'khop' } }
}
export const cacQidCua = (to: string): string[] => [
  ...Array.from({ length: SO_I[to]! }, (_, i) => qidCua(to, 'I', i + 1)),
  ...[1, 2, 3].map((i) => qidCua(to, 'II', i)),
  ...[1, 2, 3].map((i) => qidCua(to, 'III', i)),
]

/** Dựng kho + em (chưa có sổ). */
export async function dungKho(): Promise<D1That> {
  const d = taoD1That()
  for (const to of CAC_TO) {
    const cau = [
      ...Array.from({ length: SO_I[to]! }, (_, i) => cauKho(to, 'I', i + 1)),
      ...[1, 2, 3].map((i) => cauKho(to, 'II', i)),
      ...[1, 2, 3].map((i) => cauKho(to, 'III', i)),
    ]
    d.sql.prepare("INSERT INTO de_kho(ma_de,ten_de,lop,so_cau,r2_khoa,da_xoa,cap_nhat_luc) VALUES(?,?,?,?,?,0,'v1')").run(to, `Tờ ${to}`, LOP_TO[to]!, cau.length, `kho/${to}.json`)
    d.objects.set(`kho/${to}.json`, { ma_de: to, cau })
    for (const c of cau) d.sql.prepare("INSERT INTO cau_hoi(qid,ma_de,chuyen_de,muc_do,phan,lop,co_loi_giai,cap_nhat_luc) VALUES(?,?,'CD1',?,?,?,1,'x')").run(c.qid, to, c.muc_do, c.phan, LOP_TO[to]!)
    await dongBoCacTo(d.env, [to])
  }
  const em = [['S1', 'Em Một', '11', '11 - Tinh Hoa'], ['S2', 'Em Hai', '11', '11 - Tinh Hoa'], ['S4', 'Em Bốn', '11', '11 - Tinh Hoa'], ['S3', 'Em Ba', '10', '10 - Nền tảng'], ['SX', 'Em Lạ', '', null]] as const
  for (const [sbd, ten, lop, tenLop] of em) d.sql.prepare('INSERT INTO hoc_sinh(sbd,ho_ten,lop,ten_lop,mat_khau,cap_nhat_luc) VALUES(?,?,?,?,?,?)').run(sbd, ten, lop, tenLop, 'mk', 'x')
  return d
}

/** Ca ĐÃ CÔNG BỐ để sổ có nguồn `thi` hợp lệ. */
export function themCaCongBo(d: D1That, maCa: string, luc: string) {
  d.sql.prepare("INSERT OR IGNORE INTO ca(ma_ca,ten_ca,trang_thai,bat_dau,het_han_vao,thoi_gian_phut,loai,cong_bo,bank_r2,lop,cap_nhat_luc) VALUES(?,?,'dong',?,?,45,'thi','ngay','','11','x')").run(maCa, `Ca ${maCa}`, luc, luc)
}

/** Sổ: em `sbd` làm SAI các câu `qids` ở mọi nguồn (ca đã công bố, Lên bảng, đầu giờ, game, BTVN, Luyện đề) lúc `luc` (ISO); `soLan` lần mỗi câu. */
export async function ghiSai(d: D1That, sbd: string, qids: readonly string[], lucMs: number, o: { soLan?: number; nguon?: SuKien['nguon'][] } = {}) {
  const nguon = o.nguon ?? (['thi', 'len_bang', 'dau_gio', 'game', 'btvn', 'luyen'] as SuKien['nguon'][])
  const ds: SuKien[] = []
  qids.forEach((qid, i) => {
    const n = nguon[i % nguon.length]!
    for (let lan = 1; lan <= (o.soLan ?? 1); lan++) {
      const luc = new Date(lucMs + i * 1000 + lan * 60_000).toISOString()
      ds.push({ nguon: n, maNguon: n === 'thi' ? 'CA-SAI' : `${n}-${sbd}-${i}-${lan}`, sbd, qid, lan, ketQua: 0, luc })
    }
  })
  themCaCongBo(d, 'CA-SAI', new Date(lucMs - 3_600_000).toISOString())
  const r = await ghiSuKien(d.env, ds)
  if (!r.ok) throw new Error('ghi sổ lỗi')
  await dungLaiHoSo(d.env, [sbd], new Date(lucMs + 86_400_000).toISOString())
}

/** Câu của mọi tờ, `n` câu phần I đầu mỗi tờ (đủ khối 10/11/12, không rõ, mâu thuẫn). */
export const mauMoiTo = (n: number): string[] => CAC_TO.flatMap((to) => Array.from({ length: n }, (_, i) => qidCua(to, 'I', i + 1)))
export const mauMoiToPhan = (phan: 'II' | 'III', n: number): string[] => CAC_TO.flatMap((to) => Array.from({ length: n }, (_, i) => qidCua(to, phan, i + 1)))
