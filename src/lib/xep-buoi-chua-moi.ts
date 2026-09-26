// XẾP BUỔI CHỮA THEO LUẬT MỚI — LÕI THUẦN (thầy chốt 25/09: THAY Engine E).
//
// Nút "Xếp giờ & phân công lên bảng" trước đây chạy `xepBuoiChua` (Engine E 14/09: ưu tiên theo SAO, sàn 20 EM,
// "một em một lần"). Luật mới thầy chốt 25/09 thay cả cách CHỌN câu lẫn cách GÁN em:
//   · CHỌN CÂU — `xepUuTienCau`: cả lớp SAI nhiều nhất → sai ít dần → KHÓ ít em làm được → CỐT TỦY → còn lại.
//   · NGÂN SÁCH + KHOÁ SÀN 80 % — `ruiCauLenBang`: số câu CHỮA ≥ 80 % số câu LỌC RA; câu CẢ LỚP SAI không chữa
//     kịp thì BÁO rõ cần thêm bao nhiêu phút (không im lặng bỏ).
//   · GÁN EM — `phanBoLuotEm`: mọi em có mặt ≥ 1 lượt TRƯỚC khi ai được lượt hai; lượt thêm phát CÂN BẰNG; ngang
//     điểm thì bốc thăm bằng SEED tất định (mở lại buổi cũ ra đúng bảng cũ).
//
// KHÔNG còn: lane L0–L3 (giáo án), ZPD chặn bậc (`diemHopCau`), "học nhiều nhất", nối buổi giữ em (`emDaDinh`).
// GIỮ LẠI: M6 — hiệu chỉnh giây theo mẫu thật (`heSoHieuChinh` truyền qua `CauVaoRui.heSo`), vì nó độc lập
// với cách CHỌN câu / GÁN em.
//
// TƯƠNG THÍCH ĐẦU RA — trả ĐÚNG kiểu `KetQuaBuoiChua` để tờ chiếu / lưu buổi / render bảng không phải viết lại:
// `hocNhieu` chỉ còn giữ `soCauDoiBuoiSau` (số câu chỉ đọc đáp án), các trường "học nhiều" khác để 0 (màn hình
// không còn hiện chúng); `soEmToiThieu` = số em CÓ MẶT (đích "mọi em một lượt" của luật mới, không phải sàn 20 em).
//
// THUẦN + TẤT ĐỊNH: không IO, không đồng hồ, không `Math.random` (seed đi qua `phanBoLuotEm`).
import { CAU_HINH_LEN_BANG_MAC_DINH, type CauHinhLenBang } from './len-bang-cau-hinh'
import type { CauChua } from './phan-cong'
import { phanBoLuotEm, ruiCauLenBang, type CauVaoRui, type ChamEm } from './rui-cau-btvn-len-bang'
import type { HoSoEmDayDu } from './ho-so-lop'
import type { CauVaoXep, DongChua, KetQuaBuoiChua } from './xep-buoi-chua'

/**
 * Câu của buổi (nguồn CA, `CauVaoXep`) → đầu vào luật mới (`CauVaoRui`).
 *
 * `soEmLam`/`tiLeDung` của ca được quy về `soEmSai`/`soEmDung` (làm tròn trong [0, soEmLam]).
 * Nguồn CA KHÔNG có nhãn "câu cốt tủy" của bài giao về nhà — nên "câu BẮT BUỘC chữa" (lớp sai nhiều / thầy chốt /
 * câu cần dạy lại) ĐÓNG VAI ấy, để câu phải chữa không bị đẩy xuống cuối bảng.
 */
export function cauRuiTuCauVaoXep(d: CauVaoXep): CauVaoRui {
  const soEmLam = Math.max(0, Math.floor(d.soEmLam || 0))
  const soEmDung = d.tiLeDung === null ? 0 : Math.max(0, Math.min(soEmLam, Math.round(soEmLam * d.tiLeDung)))
  return {
    qid: d.cau.id,
    dang: d.cau.chuyenDe || '',
    chuyenDe: d.cau.chuyenDe || '',
    phan: d.cau.phan,
    sao: d.cau.sao,
    loi: d.batBuoc,
    soEmLam,
    soEmSai: soEmLam - soEmDung,
    soEmDung,
    noiDung: d.noiDung,
    heSo: d.heSoHieuChinh,
  }
}

/**
 * XẾP BUỔI CHỮA THEO LUẬT MỚI. Tất định. Trả `KetQuaBuoiChua` (tương thích màn hình).
 *
 * `cham` (tuỳ chọn): chấm mức HỢP giữa em và câu khi gán lượt (ví dụ "em sai chính câu này" ⇒ điểm cao hơn).
 * Bỏ trống ⇒ mọi em ngang nhau, `phanBoLuotEm` phát lượt vòng tròn + bốc thăm bằng seed.
 */
export function xepBuoiChuaMoi(
  dsCau: readonly CauVaoXep[],
  hoSo: readonly HoSoEmDayDu[],
  ch: CauHinhLenBang = CAU_HINH_LEN_BANG_MAC_DINH,
  cham?: ChamEm,
): KetQuaBuoiChua {
  const theoQid = new Map<string, CauChua>()
  for (const d of dsCau) theoQid.set(d.cau.id, d.cau)

  // 1 — CHỌN CÂU theo luật mới (sai nhiều → … → cốt tủy) + rút vào ngân sách, khoá sàn 80 %.
  const kq = ruiCauLenBang(dsCau.map(cauRuiTuCauVaoXep), ch)

  // 2 — GÁN EM: mọi em CÓ MẶT ≥ 1 lượt, lượt thêm cân bằng, seed tất định.
  const hoSoTheoSbd = new Map<string, HoSoEmDayDu>()
  for (const e of hoSo) if (e.sbd && e.coMat) hoSoTheoSbd.set(e.sbd, e)
  const em = [...hoSoTheoSbd.values()].map((e) => ({ sbd: e.sbd, hoTen: e.hoTen }))
  const pb = phanBoLuotEm(kq.chua, em, cham ?? (() => ({ diem: 0 })))

  // 3 — DỰNG `dong`: nhóm CHỮA (kèm em được gọi) rồi nhóm CHỈ ĐỌC ĐÁP ÁN, đúng thứ tự ưu tiên.
  const dong: DongChua[] = []
  for (const l of pb.luot) {
    const cau = theoQid.get(l.cau.qid)
    if (!cau) continue
    dong.push({ tang: 'len_bang', cau, giay: l.cau.giay, em: hoSoTheoSbd.get(l.sbd) ?? null, viSao: l.viSao || l.cau.lyDo, hop: l.diem })
  }
  for (const c of kq.docDapAn) {
    const cau = theoQid.get(c.qid)
    if (!cau) continue
    dong.push({ tang: 'doc_dap_an', cau, giay: c.giay, em: null, viSao: c.lyDo, hop: 0 })
  }

  const cauDocDapAn = kq.docDapAn.map((c) => theoQid.get(c.qid)).filter((c): c is CauChua => Boolean(c))
  const soEmLenBang = pb.soEmCoLuot
  const soEmToiThieu = em.length
  const datSan = kq.dat80
  const thieu = datSan
    ? null
    : { soEmConThieu: Math.max(0, em.length - soEmLenBang), viSao: `Chữa ${Math.round(kq.tiLeChua * 100)} % số câu lọc ra — dưới sàn 80 %` }
  const cauChiemCaBang = dong
    .filter((d) => d.tang === 'len_bang' && dsCau.find((c) => c.cau.id === d.cau.id)?.bacUoc === 5)
    .map((d) => d.cau)

  return {
    dong,
    soEmLenBang,
    soEmToiThieu,
    datSan,
    thieu,
    tongGiay: kq.tongGiay,
    nganSach: kq.nganSach,
    cauDocDapAn,
    batBuocChuaChua: [],
    cauChiemCaBang,
    canhBao: [...kq.canhBao, ...pb.canhBao],
    hocNhieu: {
      tongGiaTri: 0,
      soDangYeu: 0,
      soDangYeuDaPhu: 0,
      dangYeuChuaPhu: [],
      soCauDoiBuoiSau: cauDocDapAn.length,
      tomTat: `${soEmLenBang} em lên bảng · ${cauDocDapAn.length} câu chỉ đọc đáp án · chữa ${Math.round(kq.tiLeChua * 100)} % số câu lọc ra`,
    },
  }
}

/** Chuỗi bảng để thầy copy sang giáo án / nhóm Zalo — cùng tinh thần `bangChuBuoiChua`. */
export function bangChuBuoiChuaMoi(kq: KetQuaBuoiChua, tenNguon: string): string {
  const d: string[] = [
    `Buổi chữa (luật mới) · ${tenNguon}`,
    `${kq.dong.filter((x) => x.tang === 'len_bang').length} câu chữa · ${Math.round(kq.tongGiay / 60)}/${Math.round(kq.nganSach / 60)} phút · ${kq.datSan ? 'đạt sàn 80 %' : 'CHƯA đạt sàn 80 %'}`,
  ]
  const lenBang = kq.dong.filter((x) => x.tang === 'len_bang')
  if (lenBang.length > 0) {
    d.push('', 'GỌI LÊN BẢNG')
    lenBang.forEach((x, i) => {
      const sao = x.cau.sao ? ' ' + '★'.repeat(x.cau.sao) : ''
      d.push(`${i + 1}. Phần ${x.cau.phan} câu ${x.cau.so}${sao} (${Math.round(x.giay / 60)} phút) → ${x.em?.hoTen || x.em?.sbd} · ${x.viSao}`)
    })
  }
  if (kq.cauDocDapAn.length > 0) {
    d.push('', `CHỈ ĐỌC ĐÁP ÁN — ${kq.cauDocDapAn.length} câu, chiếu lên bảng`)
    d.push(kq.cauDocDapAn.map((c) => `Phần ${c.phan} câu ${c.so}`).join(' · '))
  }
  for (const c of kq.canhBao) d.push('', `⚠ ${c}`)
  return d.join('\n')
}
