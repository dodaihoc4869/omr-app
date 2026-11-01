// HÔM NAY · 4 BẢNG — LÕI THUẦN (thầy chốt bản vẽ 01/11, docs/ban-ve-hom-nay-4-bang-0111; hợp đồng src/lib/bon-bang-kieu.ts). Không đọc D1 (xem bon-chi-so-d1.ts).
//
// Hai trục, mỗi em bốn điểm 0–100, cửa sổ 14 ngày TRỌN tới hết hôm qua:
//   · CHẤT LƯỢNG — dựng trên ĐÚNG lượt làm câu + Mức làm của bộ xếp Học thật (danh-gia-hoc-that*.ts: giây đo thật, T_đọc, Thuộc, treo máy, song sinh, KTCN):
//       Học thật = 35% sửa ĐÚNG câu từng sai (cùng câu / song sinh, không phải lướt) + 25% lượt đọc đủ thời gian + 20% đúng ở câu mới lần đầu tự làm
//                  + 20% kiểm tra cá nhân khớp luyện tập; mỗi tỉ lệ lấy CẬN DƯỚI Wilson 90%; thiếu thành phần nào thì chia lại trọng số.
//       Đối phó  = 1,5 × phạt «chọn khi chưa đọc hết đề mà sai» + 1,5 × phạt «bấm lặp» + phạt treo máy / xem lời giải trước / thuộc đáp án không hiểu / rời
//                  màn khi thi (đúng số phạt có trần của bộ Học thật) + 20 khi luyện ≥ 70% mà kiểm tra cá nhân TB ≤ 5 + tới 15 khi bỏ mặc ≥ 50% câu sai. Trần 100.
//       Đối phó ≥ 30 ⇒ Học thật không quá 100 − Đối phó. Dưới 40 lượt có giây đo thật ⇒ cả hai = null (chưa đủ dữ liệu).
//   · CHĂM CHỈ — dựng trên ĐÚNG mức ngày / đã làm của Nhịp học (nhip-hoc.ts, ngày vào app, ngày bảo trì đã bỏ):
//       Chăm = 50% ngày đủ mức + 30% câu làm KỸ / câu được giao (câu chọn vội mà sai không tính) + 20% chuỗi ngày đủ mức gần nhất (đủ 7 ngày = trọn). Lười = 100 − Chăm.
//       Dưới 3 ngày phải làm ⇒ null.
// Bằng chứng: mỗi bảng 3–4 thẻ, CHỈ số đo + ví dụ có giờ (thầy 01/11: «ẩn phần cách tính, chỉ hiện các thông số sắc bén»). `so` của thẻ cùng khoá với `soLieu`
// ⇒ lệnh thầy điền «cả lớp» (trung vị) lúc trả lời.
import { canDuoiWilson, type DauVaoDanhGia, type KetQuaDanhGia, type LuotDanhGia } from './danh-gia-hoc-that'
import { LUOT_TOI_THIEU_BON, NGUONG_BANG, type DiemBon, type MaBang, type NgayBon, type TheBangChung, type ViDuBon } from '../../src/lib/bon-bang-kieu'

/** Ví dụ thô: `qid` để lệnh thầy tra tên bài + đầu đề lúc trả lời. */
export type ViDuTho = Omit<ViDuBon, 'cau'> & { qid: string; cau?: string }
export type TheTho = Omit<TheBangChung, 'viDu'> & { viDu?: ViDuTho[] }

export interface NgayNhip { ngay: string; muc: number; lam: number }
export interface DauVaoBon {
  /** Kết quả + đầu vào của bộ Học thật trên CÙNG cửa sổ (null = không đọc được sổ lượt). */
  dg: { kq: KetQuaDanhGia; dauVao: DauVaoDanhGia } | null
  /** Ngày phải làm trong cửa sổ (đã bỏ hôm nay, ngày trước khi vào app, ngày bảo trì chưa đủ mức). */
  ngay: readonly NgayNhip[]
  /** Ngày gần nhất em có làm câu (mọi lúc, kể cả ngoài cửa sổ); '' = chưa bao giờ. */
  lanCuoiHoc: string
  /** Hôm qua (ngày cuối cửa sổ) — để nói «N ngày trước». */
  den: string
}

/** Số đo của em — khoá trùng `TheBangChung.so` để lệnh thầy tính trung vị cả lớp. Mọi tỉ lệ là phần trăm 0–100. */
export interface SoLieuBon {
  soLuot: number
  soDo: number
  /** % lượt chọn khi chưa đọc hết đề (Mức 1), % lượt đủ thời gian đọc (không vội-sai, không treo). */
  voi: number | null
  ky: number | null
  /** % câu từng sai được sửa đúng thật; % câu sai bỏ mặc. */
  sua: number | null
  boMac: number | null
  /** % đúng câu mới lần đầu tự làm; % đúng bản song sinh của câu từng sai. */
  dungMoi: number | null
  songSinh: number | null
  /** % ngày đủ mức; % ngày có làm; % câu đã làm / được giao. */
  ngayDu: number | null
  ngayCoLam: number | null
  cauLam: number | null
  /** Giây trung vị mỗi lượt (đo thật). */
  giayTV: number | null
}

export interface KetQuaBon {
  diem: DiemBon
  soLieu: SoLieuBon
  /** MỘT bằng chứng sắc nhất cho dòng bảng (nhấn bằng **…**). */
  bc: Record<MaBang, string>
  ketLuan: Record<MaBang, string>
  the: Record<MaBang, TheTho[]>
  ngay: NgayBon[]
}

const pt = (k: number, n: number): number | null => (n > 0 ? Math.round((100 * k) / n) : null)
const tron = (x: number) => Math.round(x)
const kep = (x: number, a = 0, b = 100) => Math.max(a, Math.min(b, x))
const so1 = (x: number) => (Math.round(x * 10) / 10).toString().replace('.', ',')
const ngayNgan = (n: string) => (n ? `${n.slice(8, 10)}/${n.slice(5, 7)}` : '')
const cachNgay = (a: string, b: string) => Math.round((Date.parse(b + 'T00:00:00Z') - Date.parse(a + 'T00:00:00Z')) / 86_400_000)
const theoLuc = (a: LuotDanhGia, b: LuotDanhGia) => (a.luc < b.luc ? -1 : a.luc > b.luc ? 1 : 0)
const chuKq = (l: LuotDanhGia) => (l.dung === true ? 'đúng' : l.dung === false ? 'sai' : '—')
const trungVi = (xs: number[]): number | null => {
  if (!xs.length) return null
  const s = [...xs].sort((a, b) => a - b)
  const g = Math.floor(s.length / 2)
  return s.length % 2 ? s[g]! : (s[g - 1]! + s[g]!) / 2
}

/** Chuỗi bấm lặp dài nhất (Phần I, cùng ngày, cùng một chữ, ≥ 6 câu khác nhau, sai ≥ 50%) — đúng luật B2 của bộ Học thật. */
function chuoiLap(lam: readonly LuotDanhGia[]): { so: number; dai: LuotDanhGia[] } {
  const tn = lam.filter((l) => l.phan === 'I' && l.chon && /^[ABCD]$/.test(l.chon)).sort(theoLuc)
  let so = 0, dai: LuotDanhGia[] = []
  for (let i = 0; i < tn.length;) {
    let j = i + 1
    while (j < tn.length && tn[j]!.chon === tn[i]!.chon && tn[j]!.ngay === tn[i]!.ngay) j++
    const c = tn.slice(i, j)
    if (new Set(c.map((l, k) => l.cau ?? `#${i + k}`)).size >= 6 && c.filter((l) => l.dung === false).length >= 0.5 * c.length) {
      so++
      if (c.length > dai.length) dai = c
    }
    i = j
  }
  return { so, dai }
}

/** Câu từng sai (lần sai ĐẦU trong cửa sổ, cách ngày cuối ≥ 3 ngày ⇒ đã có thời gian sửa): sửa thật = sau đó đúng (cùng câu / song sinh) mà không phải bấm vội. */
function suaCauSai(lam: readonly LuotDanhGia[], den: string): { tong: number; sua: number; viDuSua: { sai: LuotDanhGia; dung: LuotDanhGia }[]; viDuBo: LuotDanhGia[] } {
  const sx = [...lam].sort(theoLuc)
  const saiDau = new Map<string, LuotDanhGia>()
  const suaBoi = new Map<string, LuotDanhGia>()
  for (const l of sx) {
    if (!l.cau) continue
    const s = saiDau.get(l.cau)
    if (!s) { if (l.dung === false) saiDau.set(l.cau, l); continue }
    if (!suaBoi.has(l.cau) && l.dung === true && l.ma !== 1) suaBoi.set(l.cau, l)
  }
  const du = [...saiDau.values()].filter((l) => l.ngay && cachNgay(l.ngay, den) >= 3)
  const da = du.filter((l) => suaBoi.has(l.cau!))
  return {
    tong: du.length,
    sua: da.length,
    viDuSua: da.slice(-2).reverse().map((sai) => ({ sai, dung: suaBoi.get(sai.cau!)! })),
    viDuBo: du.filter((l) => !suaBoi.has(l.cau!)).slice(-2).reverse(),
  }
}

/** Một em ⇒ 4 điểm + số đo + bằng chứng. Thuần. */
export function tinhBon(v: DauVaoBon): KetQuaBon {
  const lam = (v.dg?.dauVao.luot ?? []).filter((l) => l.dung !== null)
  const doLuot = lam.filter((l) => l.ma !== null && !l.treo)
  const treo = lam.filter((l) => l.treo)
  const voi = doLuot.filter((l) => l.ma === 1)
  const voiSai = voi.filter((l) => l.dung === false)
  const kyN = doLuot.length - voiSai.length
  const kyMau = doLuot.length + treo.length
  const sc = suaCauSai(lam, v.den)
  const lap = chuoiLap(lam)
  // Câu mới lần đầu tự làm: không phải song sinh, chưa gặp trước đó trong cửa sổ, không mở gợi ý.
  const daGap = new Set<string>()
  const moi: LuotDanhGia[] = []
  for (const l of [...lam].sort(theoLuc)) {
    if (l.cau && !daGap.has(l.cau) && !l.songSinh && !l.coGoiY) moi.push(l)
    if (l.cau) daGap.add(l.cau)
  }
  const ss = lam.filter((l) => l.songSinh)
  const kt = v.dg?.dauVao.ktcn
  const ktTB = kt && kt.diem.length ? kt.diem.reduce((s, x) => s + x, 0) / kt.diem.length : null
  const dungLuyen = lam.length ? lam.filter((l) => l.dung === true).length / lam.length : null
  const phat = (ma: string) => v.dg?.kq.phat.filter((p) => p.ma === ma).reduce((s, p) => s + p.diem, 0) ?? 0
  const giays = doLuot.map((l) => l.giay).filter((g): g is number => typeof g === 'number' && g > 0)
  const duDuLieu = doLuot.length >= LUOT_TOI_THIEU_BON

  // ───── Đối phó
  const lechKt = ktTB !== null && dungLuyen !== null && dungLuyen >= 0.7 && ktTB <= 5
  const boMacTiLe = sc.tong >= 5 ? (sc.tong - sc.sua) / sc.tong : 0
  const dpTho = 1.5 * phat('nhanMaSai') + 1.5 * phat('bamLap') + phat('treo') + phat('goiY') + phat('thuocKhongHieu') + phat('thi') + (lechKt ? 20 : 0) + (boMacTiLe >= 0.5 ? 15 * kep((boMacTiLe - 0.5) / 0.5, 0, 1) : 0)
  const dp = duDuLieu ? tron(kep(dpTho)) : null
  // ───── Học thật
  const tp: [number, number | null][] = [
    [0.35, sc.tong >= 3 ? canDuoiWilson(sc.sua, sc.tong) : null],
    [0.25, kyMau >= 20 ? canDuoiWilson(kyN, kyMau) : null],
    [0.2, moi.length >= 10 ? canDuoiWilson(moi.filter((l) => l.dung === true).length, moi.length) : null],
    [0.2, ktTB !== null && dungLuyen !== null ? kep(1 - Math.max(0, dungLuyen - ktTB / 10) / 0.4, 0, 1) : null],
  ]
  const tw = tp.reduce((s, [w, x]) => s + (x === null ? 0 : w), 0)
  let ht = duDuLieu && tw > 0 ? tron((100 * tp.reduce((s, [w, x]) => s + (x === null ? 0 : w * x), 0)) / tw) : null
  if (ht !== null && dp !== null && dp >= NGUONG_BANG.htDpDuoi) ht = Math.min(ht, 100 - dp)
  // ───── Chăm / Lười
  const ngay = v.ngay.filter((n) => n.muc > 0)
  const du = ngay.filter((n) => n.lam >= n.muc).length
  const coLam = ngay.filter((n) => n.lam > 0).length
  const giao = ngay.reduce((s, n) => s + n.muc, 0)
  const daLam = ngay.reduce((s, n) => s + n.lam, 0)
  const tlKy = kyMau > 0 ? kyN / kyMau : 1
  let chuoi = 0
  for (let i = ngay.length - 1; i >= 0 && ngay[i]!.lam >= ngay[i]!.muc; i--) chuoi++
  const ch = ngay.length >= 3 ? tron(100 * (0.5 * (du / ngay.length) + 0.3 * Math.min(1, (daLam * tlKy) / Math.max(1, giao)) + 0.2 * Math.min(1, chuoi / 7))) : null
  const lu = ch === null ? null : 100 - ch

  const soLieu: SoLieuBon = {
    soLuot: lam.length, soDo: doLuot.length,
    voi: pt(voi.length, doLuot.length), ky: pt(kyN, kyMau), sua: pt(sc.sua, sc.tong), boMac: pt(sc.tong - sc.sua, sc.tong),
    dungMoi: pt(moi.filter((l) => l.dung === true).length, moi.length), songSinh: pt(ss.filter((l) => l.dung === true).length, ss.length),
    ngayDu: pt(du, ngay.length), ngayCoLam: pt(coLam, ngay.length), cauLam: pt(daLam, giao), giayTV: trungVi(giays),
  }

  // ───── Ví dụ
  const viDuVoi = (l: LuotDanhGia): ViDuTho => ({
    luc: l.luc, qid: l.qid ?? l.cau ?? '',
    phu: l.giayDoc ? `cần ít nhất ${tron(l.giayDoc)} giây để đọc đề` : 'chọn trước khi đọc xong đề',
    kq: `chọn sau ${l.giay ? tron(l.giay) : '?'} giây${l.chon ? ` · ${l.chon}` : ''} · ${chuKq(l)}`, dung: l.dung,
  })
  const ngayVi = (l: LuotDanhGia) => ngayNgan(l.ngay)

  // ───── Thẻ Đối phó (xếp từ mạnh tới nhẹ theo phạt)
  const theDp: (TheTho & { w: number })[] = []
  if (voi.length) theDp.push({ w: 1.5 * phat('nhanMaSai') + 0.1, ma: 'voi', tieu: 'Chọn đáp án khi chưa kịp đọc hết đề', lon: `${voi.length}/${doLuot.length}`, nhoSo: `lượt · ${soLieu.voi}%`, so: soLieu.voi ?? undefined,
    viDu: voiSai.sort(theoLuc).slice(-3).reverse().map(viDuVoi),
    chu: `Trong ${voi.length} câu này em sai ${voiSai.length} câu (${pt(voiSai.length, voi.length)}%).${doLuot.length > voi.length ? ` Ở những câu đọc đủ thời gian, em đúng ${pt(doLuot.filter((l) => l.ma !== 1 && l.dung === true).length, doLuot.length - voi.length)}%.` : ''}` })
  if (lap.so) {
    const d = lap.dai
    const giay = Math.max(1, (Date.parse(d[d.length - 1]!.luc) - Date.parse(d[0]!.luc)) / 1000)
    theDp.push({ w: 1.5 * phat('bamLap') + 0.1, ma: 'lap', tieu: 'Bấm cùng một chữ nhiều câu liền', lon: `${lap.so}`, nhoSo: 'chuỗi từ 6 câu', chuoi: { chu: d.map((l) => l.chon).join(''), dung: d.map((l, i) => (l.dung === true ? i : -1)).filter((i) => i >= 0) },
      chu: `Dài nhất: ${ngayVi(d[0]!)} **${d.length} câu liền chọn ${d[0]!.chon} trong ${tron(giay)} giây** (trung bình ${tron(giay / d.length)} giây/câu), đúng ${d.filter((l) => l.dung === true).length}/${d.length}.` })
  }
  if (lechKt && ktTB !== null && dungLuyen !== null) theDp.push({ w: 20, ma: 'lech', tieu: 'Luyện tập cao, kiểm tra thấp', lon: `${tron(dungLuyen * 100)}% → ${so1(ktTB)}`,
    hai: [{ nhan: 'Luyện tập · 14 ngày', so: `${tron(dungLuyen * 100)}%`, phu: `${lam.filter((l) => l.dung === true).length}/${lam.length} câu đúng` }, { nhan: `Kiểm tra cá nhân · ${kt!.diem.length} bài`, so: `${so1(ktTB)}/10`, phu: 'tự làm một lần, không lời giải', lech: true }],
    chu: 'Khi có lời giải và làm lại được, em đúng nhiều; khi phải tự làm một lần, điểm thấp hẳn.' })
  if (sc.tong >= 5 && sc.tong - sc.sua > 0) theDp.push({ w: boMacTiLe >= 0.5 ? 15 * boMacTiLe : 1, ma: 'boMac', tieu: 'Câu sai để đó không sửa', lon: `${sc.tong - sc.sua}/${sc.tong}`, nhoSo: 'câu', so: soLieu.boMac ?? undefined,
    viDu: sc.viDuBo.map((l) => ({ luc: l.luc, qid: l.qid ?? l.cau ?? '', phu: `sai ${ngayVi(l)}, quá 3 ngày chưa làm lại đúng`, kq: 'chưa sửa', dung: false })),
    chu: `Chỉ ${sc.sua}/${sc.tong} câu sai được em làm lại đúng sau 3 ngày.` })
  if (treo.length) theDp.push({ w: phat('treo'), ma: 'treo', tieu: 'Treo máy cho đủ giờ', lon: `${treo.length}`, nhoSo: 'lượt', chu: `${treo.length} lượt để máy đứng quá lâu mà không làm${v.dg?.kq.soLieu.ngayCoTinh ? `, ${v.dg.kq.soLieu.ngayCoTinh} ngày cố tình treo máy` : ''}.` })
  const goiY = lam.filter((l) => l.coGoiY).length
  if (phat('goiY') > 0) theDp.push({ w: phat('goiY'), ma: 'goiY', tieu: 'Mở lời giải trước khi tự làm', lon: `${goiY}/${lam.length}`, nhoSo: 'lượt' })
  if (phat('thuocKhongHieu') > 0) theDp.push({ w: phat('thuocKhongHieu'), ma: 'songSinh', tieu: 'Thuộc đáp án, đổi số liệu là sai', lon: `${soLieu.songSinh ?? 0}%`, nhoSo: 'đúng câu song sinh', so: soLieu.songSinh ?? undefined,
    chu: v.dg!.kq.phat.find((p) => p.ma === 'thuocKhongHieu')?.chu.replace(/^câu từng sai: /, 'Câu từng sai: ') })
  if (phat('thi') > 0) theDp.push({ w: phat('thi'), ma: 'thi', tieu: 'Rời màn hình khi thi', lon: v.dg!.kq.phat.find((p) => p.ma === 'thi')?.chu.match(/^\d+/)?.[0] ?? '!', nhoSo: 'bài', chu: v.dg!.kq.phat.filter((p) => p.ma === 'thi').map((p) => p.chu).join(' · ') })
  theDp.sort((a, b) => b.w - a.w)

  // ───── Thẻ Học thật
  const theHt: TheTho[] = []
  if (sc.tong) theHt.push({ ma: 'sua', tieu: 'Sửa câu sai đến khi đúng', lon: `${sc.sua}/${sc.tong}`, nhoSo: `câu · ${soLieu.sua}%`, so: soLieu.sua ?? undefined,
    viDu: sc.viDuSua.map(({ sai, dung }) => ({ luc: dung.luc, qid: dung.qid ?? dung.cau ?? '', phu: `sai ${ngayVi(sai)} → làm lại${dung.songSinh ? ' câu song sinh khác số liệu' : ''} ${ngayVi(dung)}`, kq: `đúng${dung.giay ? ` · ${tron(dung.giay)} giây` : ''}`, dung: true })) })
  if (ss.length >= 3) theHt.push({ ma: 'songSinh', tieu: 'Làm đúng câu song sinh khác số liệu', lon: `${ss.filter((l) => l.dung === true).length}/${ss.length}`, so: soLieu.songSinh ?? undefined, chu: 'Câu song sinh giữ cách làm nhưng đổi số liệu và thứ tự phương án — đúng câu này là hiểu cách làm, không nhớ đáp án.' })
  if (kyMau) theHt.push({ ma: 'ky', tieu: 'Đọc kỹ trước khi chọn', lon: `${soLieu.ky}%`, nhoSo: 'lượt đủ thời gian đọc', so: soLieu.ky ?? undefined, chu: soLieu.giayTV !== null ? `Trung vị ${tron(soLieu.giayTV)} giây mỗi câu.` : undefined })
  if (ktTB !== null && dungLuyen !== null) theHt.push({ ma: 'khop', tieu: lechKt ? 'Kiểm tra thấp hơn luyện tập' : 'Kiểm tra khớp luyện tập', lon: `${tron(dungLuyen * 100)}% → ${so1(ktTB)}`,
    hai: [{ nhan: 'Luyện tập · 14 ngày', so: `${tron(dungLuyen * 100)}%`, phu: `${lam.filter((l) => l.dung === true).length}/${lam.length} câu đúng` }, { nhan: `Kiểm tra cá nhân · ${kt!.diem.length} bài`, so: `${so1(ktTB)}/10`, phu: 'tự làm một lần', ...(lechKt ? { lech: true } : {}) }] })
  if (moi.length >= 10) theHt.push({ ma: 'dungMoi', tieu: 'Đúng ở câu mới lần đầu tự làm', lon: `${moi.filter((l) => l.dung === true).length}/${moi.length}`, so: soLieu.dungMoi ?? undefined })

  // ───── Thẻ Chăm / Lười
  const theCh: TheTho[] = []
  if (ngay.length) theCh.push({ ma: 'ngayDu', tieu: 'Đủ mức mỗi ngày', lon: `${du}/${ngay.length}`, nhoSo: 'ngày', so: soLieu.ngayDu ?? undefined })
  if (giao) theCh.push({ ma: 'cauLam', tieu: 'Làm đủ số câu được giao', lon: `${daLam}/${giao}`, nhoSo: 'câu', so: Math.min(100, soLieu.cauLam ?? 0) })
  if (kyMau) theCh.push({ ma: 'ky', tieu: 'Câu nào cũng làm thật', lon: `${soLieu.ky}%`, nhoSo: 'câu làm kỹ', so: soLieu.ky ?? undefined, chu: 'Câu chọn khi chưa đọc hết đề mà sai KHÔNG được tính vào Chăm.' })
  theCh.push({ ma: 'chuoi', tieu: 'Chuỗi ngày đủ mức', lon: `${chuoi}`, nhoSo: 'ngày liền' })
  const theLu: TheTho[] = []
  const khong = ngay.length - coLam
  if (ngay.length) theLu.push({ ma: 'ngayCoLam', tieu: khong ? 'Ngày không làm câu nào' : 'Ngày có làm', lon: `${khong ? khong : coLam}/${ngay.length}`, nhoSo: 'ngày', so: soLieu.ngayCoLam ?? undefined, chu: khong ? `Có làm ${coLam}/${ngay.length} ngày, đủ mức ${du} ngày.` : undefined })
  if (v.lanCuoiHoc) theLu.push({ ma: 'lanCuoi', tieu: 'Lần cuối học', lon: ngayNgan(v.lanCuoiHoc), nhoSo: cachNgay(v.lanCuoiHoc, v.den) > 0 ? `${cachNgay(v.lanCuoiHoc, v.den) + 1} ngày trước` : 'hôm qua' })
  else theLu.push({ ma: 'lanCuoi', tieu: 'Lần cuối học', lon: 'chưa có', nhoSo: 'em chưa làm câu nào' })
  if (giao) theLu.push({ ma: 'cauLam', tieu: 'Câu được giao chưa làm', lon: `${Math.max(0, giao - daLam)}/${giao}`, nhoSo: 'câu', so: Math.min(100, soLieu.cauLam ?? 0) })
  if (sc.tong - sc.sua > 0) theLu.push({ ma: 'boMac', tieu: 'Câu sai chưa sửa', lon: `${sc.tong - sc.sua}`, nhoSo: 'câu', so: soLieu.boMac ?? undefined })

  // ───── Một dòng + kết luận
  const nhan = (x: string) => `**${x}**`
  const bcDp = theDp[0] ? (theDp[0].ma === 'voi' ? `${nhan(`${soLieu.voi}%`)} câu chọn khi chưa đọc hết đề` : theDp[0].ma === 'lap' ? `Chọn ${nhan(lap.dai[0]!.chon ?? '')} liền ${nhan(`${lap.dai.length} câu`)}` : theDp[0].ma === 'lech' ? `Luyện đúng ${tron((dungLuyen ?? 0) * 100)}% · kiểm tra ${nhan(so1(ktTB ?? 0))}` : theDp[0].ma === 'boMac' ? `${nhan(`${sc.tong - sc.sua}/${sc.tong}`)} câu sai để đó không sửa` : `${theDp[0].tieu}: ${nhan(theDp[0].lon)}`) : ''
  const bc: Record<MaBang, string> = {
    ht: sc.tong >= 3 ? `Sửa đúng ${nhan(`${sc.sua}/${sc.tong}`)} câu từng sai` : soLieu.ky !== null ? `Đọc kỹ ${nhan(`${soLieu.ky}%`)} lượt` : '',
    dp: bcDp,
    ch: `Đủ mức ${nhan(`${du}/${ngay.length}`)} ngày${daLam ? ` · ${daLam} câu` : ''}`,
    lu: khong >= ngay.length && ngay.length ? `${nhan(`${khong}/${ngay.length}`)} ngày không làm${v.lanCuoiHoc ? ` · lần cuối ${ngayNgan(v.lanCuoiHoc)}` : ''}` : khong ? `${nhan(`${khong}/${ngay.length}`)} ngày không làm` : `Làm ${nhan(`${daLam}/${giao}`)} câu được giao`,
  }
  const kl: Record<MaBang, string> = {
    dp: [`Em làm ${du}/${ngay.length} ngày đủ mức`, theDp.slice(0, 2).map((t) => t.ma === 'voi' ? `${nhan(`${soLieu.voi}%`)} số câu em chọn đáp án khi chưa kịp đọc hết đề và sai ${voiSai.length}/${voi.length} trong số đó` : t.ma === 'lap' ? `có ${nhan(`${lap.so} lần`)} bấm cùng một chữ từ 6 câu liền` : t.ma === 'lech' ? `luyện tập đúng ${tron((dungLuyen ?? 0) * 100)}% nhưng kiểm tra cá nhân chỉ ${nhan(so1(ktTB ?? 0))}` : t.ma === 'boMac' ? `${nhan(`${sc.tong - sc.sua}/${sc.tong}`)} câu sai để đó không sửa` : `${t.tieu.toLowerCase()}: ${nhan(t.lon)}`).join('; ')].filter(Boolean).join(' nhưng làm cho có: ') + '.',
    ht: `Em học thật: ${[sc.tong >= 3 ? `sửa đúng ${nhan(`${sc.sua}/${sc.tong}`)} câu từng sai` : '', soLieu.ky !== null ? `đọc kỹ đề (${nhan(`${soLieu.ky}%`)} lượt đủ thời gian)` : '', ktTB !== null && !lechKt ? `kiểm tra cá nhân ${nhan(so1(ktTB))} khớp mức luyện tập ${tron((dungLuyen ?? 0) * 100)}%` : ''].filter(Boolean).join(', ')}.`,
    ch: `Em đủ mức ${nhan(`${du}/${ngay.length} ngày`)}, làm ${nhan(`${daLam} câu`)} (mức giao ${giao})${soLieu.ky !== null ? `, ${nhan(`${soLieu.ky}%`)} số câu làm kỹ` : ''}; chuỗi ngày đủ mức hiện tại ${nhan(`${chuoi} ngày`)}.`,
    lu: `${khong ? `${nhan(`${khong}/${ngay.length} ngày`)} gần nhất em không làm câu nào` : `Em có làm nhưng chỉ đủ mức ${nhan(`${du}/${ngay.length} ngày`)}`}${v.lanCuoiHoc ? `; lần cuối em học là ${nhan(ngayNgan(v.lanCuoiHoc))}` : '; em chưa làm câu nào'}. ${nhan(`${Math.max(0, giao - daLam)} câu`)} được giao chưa làm${sc.tong - sc.sua > 0 ? `, ${nhan(`${sc.tong - sc.sua} câu sai`)} vẫn để nguyên` : ''}.`,
  }

  // ───── 14 ngày (cột chồng)
  const voiNgay = new Map<string, number>()
  for (const l of voiSai) voiNgay.set(l.ngay, (voiNgay.get(l.ngay) ?? 0) + 1)
  const ngay14: NgayBon[] = v.ngay.map((n) => { const vo = Math.min(n.lam, voiNgay.get(n.ngay) ?? 0); return { ngay: n.ngay, muc: n.muc, ky: Math.max(0, n.lam - vo), voi: vo } })

  return {
    diem: { ht, dp, ch, lu }, soLieu, bc, ketLuan: kl,
    the: { dp: theDp.map(({ w: _w, ...t }) => t).slice(0, 4), ht: theHt.slice(0, 4), ch: theCh.slice(0, 4), lu: theLu.slice(0, 4) },
    ngay: ngay14,
  }
}

/** Em có vào bảng không (ngưỡng hợp đồng). Thuần. */
export function vaoBang(d: DiemBon, b: MaBang): boolean {
  if (b === 'ht') return d.ht !== null && d.ht >= NGUONG_BANG.ht && (d.dp ?? 0) < NGUONG_BANG.htDpDuoi
  if (b === 'dp') return d.dp !== null && d.dp >= NGUONG_BANG.dp
  if (b === 'ch') return d.ch !== null && d.ch >= NGUONG_BANG.ch
  return d.lu !== null && d.lu >= NGUONG_BANG.lu
}

export { trungVi }
