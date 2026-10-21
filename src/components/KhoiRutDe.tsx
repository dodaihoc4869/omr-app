// KHỐI RÚT ĐỀ trong màn Mở ca — thầy chốt đúng bộ câu sẽ ra.
//
// Vì sao khối này tồn tại: xem đầu file `src/lib/rut-de.ts`. Ở đây chỉ là giao
// diện; mọi luật chọn câu nằm trong lib và có test.
//
// BA VIỆC KHỐI NÀY LÀM RÕ, KHÔNG ĐỂ THẦY ĐOÁN:
//   · Thiếu câu thì hiện ô cam ghi rõ thiếu mấy câu ở phần nào.
//   · Câu đã ra ở ca trước thì gắn nhãn "đã ra", không lặng lẽ phát lại.
//   · Cỡ gói đề gửi lên hiện thành số KB, vì đó chính là thứ mỗi em phải tải.
import { useEffect, useMemo, useState } from 'react'
import { Dices, RefreshCw, X, ImageIcon, ChevronDown } from 'lucide-react'
import { MA_TRAN_HOA_2026 } from '../lib/ma-tran-hoa-2026'
import type { TeacherExamSource } from '../data/examContent'
import { Nhan, OThongBao } from './DesignSystem'
import { boMotCau, demDangUngVien, demMucDo, doiMotCau, dsChuyenDe, dungUngVien, giayUocTinh, moiIdDaRut, MOI_MUC, PHAN_DE, PHUT_TOI_DA_LEN_BANG, rutDe, rutDeLenBang, rutKhoChua, soCauCua, soCauLenBang, soTinHieu, TEN_MUC, tongCau, type CauUngVien, type KetQuaRut, type MucDoRut, type PhanDe, type SoCauPhan, type YeuCauRut } from '../lib/rut-de'
import { MOI_LOC_DANG, LOC_DANG_MAC_DINH, soCauDung, TEN_DANG, TEN_LOC_DANG, type LocDang } from '../lib/dang-cau'
import { demSao, LOC_SAO_MAC_DINH, MOI_LOC_SAO, soCauHopSao, TEN_LOC_SAO, type LocSao } from '../lib/loc-sao'
import { type CauHinhDeRieng, type PhamViHoiLaiCa } from '../lib/cau-hinh-de-rieng'
import { chuPhanBo, phanBoMaTran2026, soCauTheoPhan } from '../lib/rut-de-da-dung'

const NHAN_NHO: React.CSSProperties = { fontFamily: 'var(--sans)', fontSize: 'var(--cx-1)', color: 'var(--nhat)' }
const SO: React.CSSProperties = { fontFamily: 'var(--sans)', fontVariantNumeric: 'tabular-nums' }

/** Cấu trúc đề 14 câu chuẩn Thầy chốt (9 trắc nghiệm, 2 đúng/sai, 3 trả lời ngắn) */
export const SO_CAU_14: SoCauPhan = { I: 9, II: 2, III: 3 }

/** Cấu trúc đề tốt nghiệp THPT hiện hành — mặc định khi thầy không đổi gì. */
export const SO_CAU_CHUAN: SoCauPhan = { I: 18, II: 4, III: 6 }

function Chip({ chon, onClick, children, mau = 'muc' }: { chon: boolean; onClick: () => void; children: React.ReactNode; mau?: 'muc' | 'tim' }) {
  const nenChon = mau === 'tim' ? 'var(--tim-nen)' : 'var(--muc)'
  const chuChon = mau === 'tim' ? 'var(--tim)' : 'var(--muc-nguoc)'
  return (
    <button
      type="button"
      role="checkbox"
      aria-checked={chon}
      onClick={onClick}
      className="tap-target font-bold"
      style={{
        ...SO,
        fontSize: 'var(--cx-1)',
        minHeight: 36,
        padding: '0 var(--k3)',
        borderRadius: 'var(--bo-tron)',
        background: chon ? nenChon : 'var(--the-2)',
        color: chon ? chuChon : 'var(--nhat)',
        border: `1.5px solid ${chon && mau === 'tim' ? 'var(--tim)' : 'transparent'}`,
        transitionProperty: 'background-color, color, border-color',
        transitionDuration: 'var(--nhanh)',
      }}
    >
      {children}
    </button>
  )
}

function OSo({ nhan, tri, doi, tran }: { nhan: string; tri: number; doi: (n: number) => void; tran: number }) {
  return (
    <label className="flex flex-col" style={{ gap: 4 }}>
      <span style={NHAN_NHO}>
        {nhan} <span style={{ ...SO, color: tran === 0 ? 'var(--cam)' : 'var(--mo)' }}>/ {tran}</span>
      </span>
      <input
        type="number"
        inputMode="numeric"
        min={0}
        max={tran}
        value={tri}
        onChange={(e) => doi(Math.max(0, Math.min(tran, Math.floor(Number(e.target.value) || 0))))}
        aria-label={`Số câu ${nhan}`}
        style={{
          ...SO,
          height: 48,
          width: 84,
          textAlign: 'center',
          borderRadius: 'var(--bo-1)',
          background: 'var(--the-2)',
          border: '1.5px solid transparent',
          fontSize: 'var(--cx-3)',
          fontWeight: 700,
          color: 'var(--muc)',
        }}
      />
    </label>
  )
}

function HangCau({ c, stt, doi, bo, conDoi }: { c: CauUngVien; stt: number; doi: () => void; bo: () => void; conDoi: boolean }) {
  const [mo, setMo] = useState(false)
  return (
    <div style={{ background: 'var(--the-2)', borderRadius: 'var(--bo-1)', padding: 'var(--k3)' }}>
      <div className="flex items-start" style={{ gap: 'var(--k3)' }}>
        <span className="shrink-0 font-bold flex items-center justify-center" style={{ ...SO, width: 26, height: 26, borderRadius: 'var(--bo-tron)', background: 'var(--nen)', fontSize: 'var(--cx-1)' }}>
          {stt}
        </span>
        <button type="button" onClick={() => setMo((v) => !v)} className="flex-1 min-w-0 text-left" aria-expanded={mo}>
          <div
            style={{
              fontFamily: 'var(--sans)',
              fontSize: 'var(--cx-1)',
              color: 'var(--muc)',
              lineHeight: 1.45,
              display: '-webkit-box',
              WebkitLineClamp: mo ? 99 : 2,
              WebkitBoxOrient: 'vertical',
              overflow: 'hidden',
            }}
          >
            {c.text || '(câu chỉ có ảnh)'}
          </div>
          <div className="flex flex-wrap items-center" style={{ gap: 6, marginTop: 6 }}>
            <span style={{ ...NHAN_NHO, ...SO }}>
              {c.maDe} · câu {c.soGoc}
            </span>
            {c.sao > 0 && (
              <span title={c.lyDoSao || undefined} style={{ ...NHAN_NHO, color: 'var(--cam)', letterSpacing: '.05em' }}>
                {'★'.repeat(c.sao)}
              </span>
            )}
            {c.mucDo && <Nhan tone={c.mucDo === 'biet' ? 'xam' : c.mucDo === 'hieu' ? 'tim' : 'cam'}>{TEN_MUC[c.mucDo]}</Nhan>}
            {c.coHinh && (
              <span title="Câu có hình" style={{ color: 'var(--mo)' }}>
                <ImageIcon size={14} />
              </span>
            )}
            {c.canXem && <Nhan tone="do">cần xem lại</Nhan>}
          </div>
        </button>
        <span className="shrink-0 flex items-center" style={{ gap: 2 }}>
          <button type="button" onClick={doi} disabled={!conDoi} className="tap-target" aria-label="Đổi câu khác" title={conDoi ? 'Đổi câu khác' : 'Hết câu hợp bộ lọc để đổi'} style={{ color: conDoi ? 'var(--nhat)' : 'var(--mo)', padding: 6 }}>
            <RefreshCw size={16} />
          </button>
          <button type="button" onClick={bo} className="tap-target" aria-label="Bỏ câu này" title="Bỏ câu này" style={{ color: 'var(--nhat)', padding: 6 }}>
            <X size={16} />
          </button>
        </span>
      </div>
    </div>
  )
}

export interface KhoiRutDeProps {
  nguon: TeacherExamSource[]
  /** Câu đã ra ở các ca trước — đẩy xuống cuối khi rút. */
  qidCaTruoc: string[]
  /** Thời lượng làm bài của ca (phút) — chế độ "Phân công lên bảng" chia ngân
   * sách giây theo con số này để tự quyết số câu. */
  phutLamBai: number
  /** Gọi mỗi khi bộ câu đổi. `null` = thầy chọn lấy trọn kho, không rút.
   *
   * `lenBang` = bộ này rút cho buổi chữa bài ⇒ ca đẩy dữ liệu sang màn Gọi lên
   * bảng. `idsChua` = KHO CHỮA rộng hơn đề em làm, chỉ có ở chế độ đó. */
  onDoi: (kq: { ids: Set<string>; soCau: SoCauPhan; lenBang: boolean; idsChua?: Set<string>; deRieng?: boolean; phamViHoiLai?: PhamViHoiLaiCa } | null) => void
  /** CÁCH RA ĐỀ — màn Mở ca giữ (MỘT tầng, bốn thẻ — thầy chốt 21/10). Khối này
   * chỉ còn các ô con của cách đã chọn. Giữ ở màn cha nên mở lại / đổi đề KHÔNG
   * kéo chế độ về "Rút đề thông minh" như bản hộp nổi cũ. */
  cheDo: CheDoCa
  /** Đề riêng từng em: bật = có ô câu chữa lỗi (tối đa 30% mỗi phần), tắt = 100% câu mới. */
  coCauChuaLoi: boolean
  onDoiCoCauChuaLoi?: (bat: boolean) => void
  /** Kho có đề nhóm "12 · bộ đề" ⇒ hiện chip Chuẩn Bộ 2026 ở thẻ Cả lớp cùng một đề. */
  coBoDe12?: boolean
  /** Chuẩn Bộ 2026 đang bật (màn cha tính). */
  chuan2026?: boolean
  onDoiChuan2026?: (bat: boolean) => void
}

/** Bốn cách ra đề trên màn Mở ca (thầy chốt 21/10).
 *  · `ca_lop`  Cả lớp cùng một đề — kho vừa một đề thì lấy trọn, lớn hơn thì rút thông minh.
 *  · `rieng`   Đề riêng từng em — có / không câu chữa lỗi.
 *  · `diem_yeu` Kiểm tra điểm yếu — 15 phút, mỗi em một bộ (rut-de-v2 chế độ diem_yeu).
 *  · `da_dung` Kiểm chứng câu đã đúng. */
export type CheDoCa = 'ca_lop' | 'rieng' | 'diem_yeu' | 'da_dung'

/** Ma trận 2026 thành một câu đọc được — lấy thẳng từ hằng số, không gõ tay số. */
function chuMaTran2026(): string {
  const ten = { biet: 'Biết', hieu: 'Hiểu', van_dung: 'Vận dụng' } as const
  return (['I', 'II', 'III'] as const)
    .map((p) => `Phần ${p}: ${(['biet', 'hieu', 'van_dung'] as const).filter((m) => MA_TRAN_HOA_2026[p][m] > 0).map((m) => `${ten[m]} ${MA_TRAN_HOA_2026[p][m]}`).join(' · ')}`)
    .join('; ')
}

/** Kho vừa đúng một đề: mỗi phần không quá cấu trúc THPT 18/4/6 ⇒ lấy trọn cũng là cả lớp cùng đề. */
export function khoVuaMotDe(co: SoCauPhan): boolean {
  return co.I <= SO_CAU_CHUAN.I && co.II <= SO_CAU_CHUAN.II && co.III <= SO_CAU_CHUAN.III
}

/** Số câu mỗi em chọn nhanh ở chế độ "Kiểm chứng câu đã đúng" (chia theo tỷ lệ ma trận 2026). */
const SO_CAU_DA_DUNG_NHANH = [10, 14, 28] as const

/** Kho ca rộng gấp mấy lần số câu mỗi em, để hai em ngồi cạnh nhau nhận đề
 * khác nhau. Gấp 3 là mỗi em lấy 1/3 kho: đủ khác nhau mà gói đề chưa phình. */
const HE_SO_KHO = 3

export default function KhoiRutDe({ nguon, qidCaTruoc, phutLamBai, onDoi, cheDo, coCauChuaLoi, onDoiCoCauChuaLoi, coBoDe12 = false, chuan2026 = false, onDoiChuan2026 }: KhoiRutDeProps) {
  const uv = useMemo(() => dungUngVien(nguon), [nguon])
  const co: SoCauPhan = useMemo(() => ({ I: uv.I.length, II: uv.II.length, III: uv.III.length }), [uv])
  const tongKho = tongCau(co)
  const dsCd = useMemo(() => dsChuyenDe(uv), [uv])
  const demMuc = useMemo(() => demMucDo(uv), [uv])
  const demDang = useMemo(() => demDangUngVien(uv), [uv])
  // Đếm theo sao trên CÙNG tập ứng viên với đếm theo dạng, để hai hàng chip
  // nói về cùng một kho.
  const demSaoKho = useMemo(() => demSao([...uv.I, ...uv.II, ...uv.III]), [uv])

  // CẢ LỚP CÙNG MỘT ĐỀ: kho vừa một đề (mỗi phần ≤ 18/4/6) thì mặc định lấy
  // trọn — rút ở đó chỉ thêm một bước. Kho lớn hơn thì BẮT BUỘC rút (bỏ hẳn
  // đường "lấy nguyên đề" với kho lớn — thầy chốt 21/10: mỗi em bốc ngẫu nhiên
  // một bộ khác nhau là điểm không so được, gói đề lại nặng vài MB).
  const vuaDe = khoVuaMotDe(co)
  const [layTronChon, setLayTron] = useState(true)
  const layTron = cheDo === 'ca_lop' && vuaDe && layTronChon && !chuan2026
  const rut = cheDo === 'ca_lop' && !layTron && !chuan2026
  const lenBang = cheDo === 'diem_yeu'
  const daDung = cheDo === 'da_dung'
  const deRieng = cheDo === 'rieng'
  // Phạm vi câu sai gửi máy chủ: chỉ còn MỘT công tắc. "Ca gần nhất" và "3 ca
  // gần nhất" cho cùng kết quả ở đường rút v2 (de-rieng-v2.ts chỉ ghi biên bản)
  // nên gộp làm một. Kiểm tra điểm yếu LUÔN có câu sai (sửa lỗi 21/10: trước kia
  // kế thừa "Không rút câu sai" từ chế độ khác ⇒ rơi về đường 100% câu mới).
  const phamViHoiLai: CauHinhDeRieng['PHAM_VI_HOI_LAI'] = deRieng && !coCauChuaLoi ? 'khong' : 'gan_nhat'
  // KIỂM CHỨNG CÂU ĐÃ ĐÚNG: thầy chọn TỔNG số câu; app chia theo tỷ lệ từng ô (phần × mức độ) của ma trận 2026.
  const [tongDaDung, setTongDaDung] = useState(14)
  const phanBoDaDung = useMemo(() => phanBoMaTran2026(tongDaDung), [tongDaDung])
  // SỐ CÂU MỖI EM LÀM — mặc định cấu trúc chuẩn 14 câu (9 - 2 - 3) Thầy chốt.
  const [soCau, setSoCau] = useState<SoCauPhan>(() => ({
    I: Math.min(SO_CAU_14.I, co.I),
    II: Math.min(SO_CAU_14.II, co.II),
    III: Math.min(SO_CAU_14.III, co.III),
  }))
  const [chonCd, setChonCd] = useState<string[]>([])
  const [chonDang, setChonDang] = useState<LocDang>(LOC_DANG_MAC_DINH)
  // MỨC SAO — thầy chốt 07/09. Chồng lên lọc dạng, không thay nó.
  const [chonSao, setChonSao] = useState<LocSao>(LOC_SAO_MAC_DINH)
  const [chonMuc, setChonMuc] = useState<MucDoRut[]>([])
  const [seed, setSeed] = useState(() => Math.floor(Math.random() * 1e9))
  const [moChiTiet, setMoChiTiet] = useState(false)
  const [kq, setKq] = useState<KetQuaRut | null>(null)
  // SỐ CÂU RÚT VÀO KHO CỦA CA. Đề riêng: kho xem trước gấp HE_SO_KHO lần số câu
  // mỗi em (bộ thật của từng em rút lúc Bắt đầu). Cả lớp ⇒ kho đúng bằng số câu mỗi em.
  const rieng = deRieng
  const khongRutCauSai = phamViHoiLai === 'khong'
  // Câu thầy đã bấm đổi/bỏ trong lượt này — không cho quay lại ngay.
  const [daBo, setDaBo] = useState<string[]>([])

  // Đổi đề đã chọn thì số câu và bộ lọc tính lại từ đầu. CÁCH RA ĐỀ thì GIỮ
  // nguyên (nằm ở màn cha) — bản cũ kéo về "Rút đề thông minh" mỗi lần đổi đề.
  useEffect(() => {
    setSoCau({
      I: Math.min(SO_CAU_14.I, co.I),
      II: Math.min(SO_CAU_14.II, co.II),
      III: Math.min(SO_CAU_14.III, co.III),
    })
    setChonCd([])
    setChonMuc([])
    setDaBo([])
    setLayTron(true)
  }, [co.I, co.II, co.III, tongKho])

  // Kho của ca: gấp HE_SO_KHO lần số câu mỗi em, chặn trên bằng số câu thật có.
  const soCauKho: SoCauPhan = useMemo(
    () => (rieng ? { I: Math.min(co.I, soCau.I * HE_SO_KHO), II: Math.min(co.II, soCau.II * HE_SO_KHO), III: Math.min(co.III, soCau.III * HE_SO_KHO) } : soCau),
    [rieng, soCau, co],
  )

  const yc: YeuCauRut = useMemo(() => ({ soCau: soCauKho, chuyenDe: chonCd, mucDo: chonMuc, dang: chonDang, sao: chonSao, tranhQid: qidCaTruoc, seed }), [soCauKho, chonCd, chonMuc, chonDang, chonSao, qidCaTruoc, seed])

  // BỘ CÂU CHO BUỔI CHỮA BÀI: máy tự chọn hết, thầy không gõ số nào. Số câu
  // theo ngân sách giây của chính ca này.
  const soCauChuaBai = useMemo(() => soCauLenBang(uv, phutLamBai), [uv, phutLamBai])

  useEffect(() => {
    setKq(lenBang ? rutDeLenBang(uv, { phut: phutLamBai, tranhQid: qidCaTruoc, seed }) : rutDe(uv, yc))
    setDaBo([])
  }, [uv, yc, lenBang, phutLamBai, qidCaTruoc, seed])

  // Báo bộ câu lên màn Mở ca. Không rút thì báo null = giữ nguyên đường cũ.
  useEffect(() => {
    // Lấy trọn kho (kho vừa một đề) hoặc Chuẩn Bộ 2026 (màn cha tự rút theo ma trận) ⇒ null.
    if (layTron || chuan2026 || !kq) {
      onDoi(null)
      return
    }
    // KIỂM CHỨNG CÂU ĐÃ ĐÚNG (02/10): ca đề riêng từng em, mỗi em chỉ nhận câu CHÍNH EM đã tự làm đúng trong các chiến dịch, theo tỷ
    // lệ ma trận 2026 (src/lib/rut-de-da-dung.ts). Kho rộng (mọi câu đã tích) để câu em đã đúng có sẵn trong kho ca thì khỏi nối thêm.
    if (daDung) {
      onDoi({
        ids: new Set(nguon.flatMap((s) => [...s.phanI, ...s.phanII, ...s.phanIII].map((q) => q.id))),
        soCau: soCauTheoPhan(phanBoDaDung),
        lenBang: false,
        deRieng: true,
        phamViHoiLai: 'da_dung',
      })
      return
    }
    // KIỂM TRA ĐIỂM YẾU (Rút đề v2, 02/10): BỘ RIÊNG TỪNG EM. Số câu = số câu chẩn đoán theo thời lượng ca (`soCauCua(kq)`);
    // lúc Bắt đầu, app rút cho từng em từ câu em đã sửa đúng nhưng chưa kiểm chứng và lỗi đến hạn của chính em (ưu tiên câu song
    // sinh), thiếu thì lấp bằng câu cùng dạng rồi câu mới (src/lib/rut-de-v2.ts). Ca tự bật phòng chờ (cờ đề riêng). Kho chữa
    // (`idsChua`) vẫn cất cho màn Gọi lên bảng.
    if (lenBang) {
      const kho = soCauCua(kq)
      const chua = rutKhoChua(uv, kq, { phut: phutLamBai, tranhQid: qidCaTruoc, seed })
      onDoi({ ids: moiIdDaRut(kq), soCau: kho, lenBang: true, idsChua: moiIdDaRut(chua), deRieng: true, phamViHoiLai })
      return
    }
    // soCau báo lên là SỐ CÂU MỖI EM LÀM, không phải cỡ kho. Kho lớn hơn thì
    // máy bốc riêng cho từng em; bằng nhau thì cả lớp cùng một đề.
    const kho = soCauCua(kq)
    // ĐỀ RIÊNG TỪNG EM: đẩy lên KHO RỘNG (toàn bộ các câu trong những đề đã tích),
    // không cắt xuống số câu mỗi em hay bộ câu đã rút trước. Bộ câu của từng em
    // rút lúc thầy bấm Bắt đầu, từ đúng những em đang đứng ở phòng chờ.
    onDoi({
      ids: deRieng ? new Set(nguon.flatMap((s) => [...s.phanI, ...s.phanII, ...s.phanIII].map((q) => q.id))) : moiIdDaRut(kq),
      soCau: deRieng ? soCau : { I: Math.min(soCau.I, kho.I), II: Math.min(soCau.II, kho.II), III: Math.min(soCau.III, kho.III) },
      lenBang: false,
      deRieng,
      phamViHoiLai,
    })
  }, [layTron, chuan2026, lenBang, daDung, phanBoDaDung, kq, soCau, onDoi, uv, phutLamBai, qidCaTruoc, seed, deRieng, phamViHoiLai, nguon])

  const daRut = kq ? soCauCua(kq) : { I: 0, II: 0, III: 0 }
  const thieu = kq ? PHAN_DE.filter((p) => kq.thieu[p] > 0) : []
  const capNhat = (p: PhanDe, n: number) => {
    setLayTron(false)
    setSoCau((cu) => ({ ...cu, [p]: n }))
  }
  /** Cấu trúc nhanh, kẹp theo số câu có thật trong kho. */
  const kep = (s: SoCauPhan): SoCauPhan => ({ I: Math.min(s.I, co.I), II: Math.min(s.II, co.II), III: Math.min(s.III, co.III) })
  const dungCauTruc = (s: SoCauPhan) => {
    const k = kep(s)
    return soCau.I === k.I && soCau.II === k.II && soCau.III === k.III
  }
  const chonCauTruc = (s: SoCauPhan) => {
    setSoCau(kep(s))
    setLayTron(false)
    onDoiChuan2026?.(false)
  }
  const boLocDangBat = chonCd.length > 0 || chonMuc.length > 0 || chonDang !== LOC_DANG_MAC_DINH || chonSao !== LOC_SAO_MAC_DINH

  const doiCau = (p: PhanDe, id: string) => {
    if (!kq) return
    setKq(doiMotCau(uv, yc, kq, p, id, daBo))
    setDaBo((cu) => [...cu, id])
  }
  const boCau = (p: PhanDe, id: string) => {
    if (!kq) return
    setKq(boMotCau(kq, p, id))
    setDaBo((cu) => [...cu, id])
  }

  if (tongKho === 0) return null

  return (
    <div className="flex flex-col" style={{ gap: 'var(--k3)', marginTop: 'var(--k3)', paddingTop: 'var(--k3)', borderTop: '1px solid var(--vien)' }}>
      <div className="flex items-center justify-between" style={{ gap: 'var(--k3)' }}>
        <div className="min-w-0">
          <div className="font-bold" style={{ fontFamily: 'var(--serif)', fontSize: 'var(--cx-3)', color: 'var(--muc)' }}>
            Bộ câu ra đề
          </div>
          <div style={NHAN_NHO}>
            Kho đã chọn có <b style={{ ...SO, color: 'var(--muc)' }}>{tongKho}</b> câu (I {co.I} · II {co.II} · III {co.III})
          </div>
        </div>
      </div>

      {daDung ? (
        <div className="flex flex-col" style={{ gap: 'var(--k2)' }} data-khoi="da-dung">
          <div style={NHAN_NHO}>
            Mỗi em một đề riêng CHỈ gồm câu chính em đã tự làm đúng trong các chiến dịch em tham gia (không tính lần có hỗ trợ hay chỉ đọc lời giải, không câu tự luận). App bốc ngẫu nhiên đúng tỷ lệ ma trận 2026
            theo từng phần và mức độ. Mỗi câu ghi rõ em đã làm đúng ở đâu, ngày nào, mức độ gì.
          </div>
          <div style={NHAN_NHO}>Số câu mỗi em làm</div>
          <div className="flex flex-wrap items-end" style={{ gap: 'var(--k2)' }} role="radiogroup" aria-label="Số câu mỗi em">
            {SO_CAU_DA_DUNG_NHANH.map((n) => (
              <Chip key={n} chon={tongDaDung === n} onClick={() => setTongDaDung(n)}>
                {n} câu
              </Chip>
            ))}
            <OSo nhan="Tổng số câu" tri={tongDaDung} doi={(n) => setTongDaDung(Math.max(1, n))} tran={40} />
          </div>
          <div style={{ ...NHAN_NHO, color: 'var(--muc)' }} data-khoi="phan-bo-da-dung">
            {chuPhanBo(phanBoDaDung)}
          </div>
          <OThongBao tone="xanh">
            Em nào chưa làm đúng đủ câu ở một ô thì app bù câu khác trong kho ca cùng mức độ (câu bù không có nhãn “đã làm đúng”); em chưa làm đúng câu nào vẫn vào thi với đề bù đủ câu. Ca tự bật
            phòng chờ; thầy xem trước em nào được bù bao nhiêu câu ở màn Theo dõi ca trước khi bấm Bắt đầu thi.
          </OThongBao>
        </div>
      ) : lenBang ? (
        <div className="flex flex-col" style={{ gap: 'var(--k2)' }} data-khoi="len-bang">
          <div style={NHAN_NHO}>
            App tự chọn câu trong kho thầy đã tích: phủ đều chuyên đề trước, trong mỗi chuyên đề lấy câu nhiều sao nhất, đẩy câu nghi đáp án và câu đã ra ca trước xuống cuối. Ca này để ĐO điểm yếu; muốn tự tay chọn bài chữa thì
            chọn ở màn Gọi lên bảng.
          </div>
          <div style={{ ...NHAN_NHO, color: 'var(--muc)' }}>
            <b style={SO}>{tongCau(soCauChuaBai)}</b> câu (I {soCauChuaBai.I} · II {soCauChuaBai.II} · III {soCauChuaBai.III}) · ước{' '}
            <b style={SO}>{Math.round(giayUocTinh(soCauChuaBai) / 60)}</b> phút · <b style={SO}>{soTinHieu(soCauChuaBai)}</b> tín hiệu chẩn đoán
          </div>
          {phutLamBai > PHUT_TOI_DA_LEN_BANG && (
            <div style={{ ...NHAN_NHO, color: 'var(--cam)' }}>
              Ca đặt <b style={SO}>{phutLamBai}</b> phút nhưng bộ câu chẩn đoán chốt cứng tối đa <b style={SO}>{PHUT_TOI_DA_LEN_BANG}</b> phút — phần giờ còn lại để chữa bài. Nên đặt ca <b style={SO}>{PHUT_TOI_DA_LEN_BANG}</b> phút.
            </div>
          )}
          <OThongBao tone="xanh">
            Mỗi em một bộ câu riêng: câu em đã sửa đúng nhưng chưa kiểm chứng và câu sai đến lịch ôn lại của chính em, ưu tiên câu song sinh; thiếu thì app lấp bằng câu cùng dạng rồi câu mới, đủ{' '}
            <b style={SO}>{tongCau(soCauChuaBai)}</b> câu. Ca tự bật phòng chờ; thầy xem trước phân bổ từng em ở màn Theo dõi ca trước khi bấm Bắt đầu thi.
          </OThongBao>
          <div className="flex flex-wrap" style={{ gap: 'var(--k2)' }}>
            <button
              type="button"
              onClick={() => setSeed(Math.floor(Math.random() * 1e9))}
              className="tap-target font-bold inline-flex items-center"
              style={{ ...SO, gap: 6, height: 48, padding: '0 var(--k4)', borderRadius: 'var(--bo-1)', background: 'var(--the-2)', color: 'var(--muc)', fontSize: 'var(--cx-1)' }}
            >
              <Dices size={16} /> Trộn lại
            </button>
          </div>
        </div>
      ) : (
        <>
          {/* CẤU TRÚC ĐỀ — thẻ Cả lớp cùng một đề (thầy chốt 21/10): Trọn đề chỉ hiện khi kho vừa một đề;
              Chuẩn Bộ 2026 hiện rõ thành chip, không còn tự bật âm thầm. */}
          {cheDo === 'ca_lop' && (
            <div className="flex flex-wrap" style={{ gap: 'var(--k2)' }} role="radiogroup" aria-label="Cấu trúc đề">
              {vuaDe && (
                <Chip
                  chon={layTron}
                  onClick={() => {
                    setLayTron(true)
                    onDoiChuan2026?.(false)
                  }}
                >
                  Trọn đề ({tongKho} câu)
                </Chip>
              )}
              <Chip chon={rut && dungCauTruc(SO_CAU_14)} onClick={() => chonCauTruc(SO_CAU_14)}>
                14 câu (9 · 2 · 3)
              </Chip>
              <Chip chon={rut && dungCauTruc(SO_CAU_CHUAN)} onClick={() => chonCauTruc(SO_CAU_CHUAN)}>
                28 câu (18 · 4 · 6)
              </Chip>
              {coBoDe12 && (
                <Chip chon={chuan2026} onClick={() => onDoiChuan2026?.(true)}>
                  Chuẩn Bộ 2026 · 50 phút
                </Chip>
              )}
            </div>
          )}

          {chuan2026 ? (
            <div style={NHAN_NHO} data-khoi="chuan-2026">
              Máy rút <b style={SO}>18 · 4 · 6</b> câu từ nhóm 12 · bộ đề, đúng ma trận mức độ: {chuMaTran2026()}. Thời gian khoá{' '}
              <b style={SO}>{MA_TRAN_HOA_2026.phut}</b> phút. Ô nào thiếu câu thì ca không mở được và màn báo rõ ô thiếu.
            </div>
          ) : layTron ? (
            <div style={NHAN_NHO} data-khoi="tron-de">
              Cả lớp cùng làm đủ <b style={SO}>{tongKho}</b> câu của đề. Muốn chọn chuyên đề, mức độ hay bớt câu thì bấm 14 hoặc 28 câu.
            </div>
          ) : (
            <>
              {/* VÌ SAO Ô SỐ CÂU KHÔNG LÊN ĐƯỢC — thầy chốt 12/09: trần của mỗi ô là SỐ CÂU CÓ THẬT trong
                  những tờ đề đang tích; nói thẳng con số và cách chữa thay vì kẹp im lặng. */}
              {(co.I < SO_CAU_CHUAN.I || co.II < SO_CAU_CHUAN.II || co.III < SO_CAU_CHUAN.III) && (
                <div style={{ ...NHAN_NHO, color: 'var(--cam)' }}>
                  Đề đang tích chỉ có <b style={SO}>{co.I}</b> câu phần I · <b style={SO}>{co.II}</b> phần II · <b style={SO}>{co.III}</b> phần III. Ô số câu không vượt được con số ấy —
                  muốn nhiều hơn thì tích thêm đề.
                </div>
              )}
              {deRieng && (
                <div className="flex flex-wrap" style={{ gap: 'var(--k2)' }} role="radiogroup" aria-label="Số câu mỗi em">
                  <Chip chon={dungCauTruc(SO_CAU_14)} onClick={() => chonCauTruc(SO_CAU_14)}>
                    14 câu (9 · 2 · 3)
                  </Chip>
                  <Chip chon={dungCauTruc(SO_CAU_CHUAN)} onClick={() => chonCauTruc(SO_CAU_CHUAN)}>
                    28 câu (18 · 4 · 6)
                  </Chip>
                </div>
              )}
              <div style={NHAN_NHO}>Số câu mỗi em làm</div>
              <div className="flex flex-wrap items-end" style={{ gap: 'var(--k4)' }}>
                <OSo nhan="Phần I" tri={soCau.I} doi={(n) => capNhat('I', n)} tran={co.I} />
                <OSo nhan="Phần II" tri={soCau.II} doi={(n) => capNhat('II', n)} tran={co.II} />
                <OSo nhan="Phần III" tri={soCau.III} doi={(n) => capNhat('III', n)} tran={co.III} />
                {rut && (
                  <button
                    type="button"
                    onClick={() => setSeed(Math.floor(Math.random() * 1e9))}
                    className="tap-target font-bold inline-flex items-center"
                    style={{ ...SO, gap: 6, height: 48, padding: '0 var(--k4)', borderRadius: 'var(--bo-1)', background: 'var(--the-2)', color: 'var(--muc)', fontSize: 'var(--cx-1)' }}
                  >
                    <Dices size={16} /> Trộn lại
                  </button>
                )}
              </div>

              {deRieng ? (
                <div className="flex flex-col" style={{ gap: 'var(--k2)' }} data-khoi="de-rieng">
                  {/* MỘT CÔNG TẮC thay ba nút phạm vi (thầy chốt 21/10). */}
                  <label className="flex items-start" style={{ gap: 'var(--k3)', minHeight: 44 }}>
                    <input
                      type="checkbox"
                      role="switch"
                      aria-label="Có câu chữa lỗi"
                      checked={coCauChuaLoi}
                      onChange={(e) => onDoiCoCauChuaLoi?.(e.target.checked)}
                      style={{ width: 20, height: 20, marginTop: 2 }}
                    />
                    <span style={{ ...NHAN_NHO, color: 'var(--muc)' }}>
                      <b>Có câu chữa lỗi</b> —{' '}
                      {khongRutCauSai
                        ? 'đang tắt: 100% câu mới, bỏ mọi câu em đã gặp ở các ca kiểm tra trước.'
                        : 'tối đa 30% mỗi phần là câu sai đến lịch ôn lại của chính em (câu song sinh đổi số khi cần, không có thì câu cùng dạng em chưa gặp); còn lại là câu mới.'}
                    </span>
                  </label>
                  <div style={{ fontFamily: 'var(--sans)', fontSize: 'var(--cx-2)', color: 'var(--muc)' }}>
                    Kho câu ứng viên: <b style={SO}>{tongKho}</b> câu (I {co.I} · II {co.II} · III {co.III}) · mỗi em làm <b style={SO}>{tongCau(soCau)}</b> câu
                  </div>
                  <OThongBao tone="xanh">
                    Ca này <b>tự bật phòng chờ</b>. Em vào thì đứng ở màn chờ; thầy bấm <b>Bắt đầu thi</b> thì app mới rút bộ câu riêng cho ĐÚNG những em đang có mặt, rồi mới phát đề.
                  </OThongBao>
                </div>
              ) : (
                <>
                  {thieu.length > 0 && kq && (
                    <OThongBao tone="cam">
                      Kho không đủ câu hợp bộ lọc: {thieu.map((p) => `phần ${p} thiếu ${kq.thieu[p]} câu`).join(', ')}. Bỏ bớt bộ lọc chuyên đề hoặc mức độ, hoặc hạ số câu xuống.
                    </OThongBao>
                  )}
                  {kq && kq.lapLai > 0 && <OThongBao tone="cam">{kq.lapLai} câu trong bộ này đã ra ở ca trước — kho hết câu mới hợp bộ lọc.</OThongBao>}

                  {/* TUỲ CHỈNH gập sẵn — bộ lọc chỉ có nghĩa với Cả lớp cùng một đề (đề riêng rút lúc Bắt đầu, không dùng bộ lọc này). */}
                  <details data-khoi="tuy-chinh">
                    <summary className="tap-target font-bold" style={{ ...NHAN_NHO, color: 'var(--muc)', cursor: 'pointer' }}>
                      Tuỳ chỉnh: chuyên đề · dạng câu · mức sao · mức độ{boLocDangBat ? ' (đang lọc)' : ''}
                    </summary>
                    <div className="flex flex-col" style={{ gap: 'var(--k3)', marginTop: 'var(--k2)' }}>
                      {dsCd.length > 1 && (
                        <div>
                          <div style={{ ...NHAN_NHO, marginBottom: 'var(--k2)' }}>Chuyên đề được lấy {chonCd.length === 0 ? '(tất cả)' : `(${chonCd.length} chuyên đề)`}</div>
                          <div className="flex flex-wrap" style={{ gap: 'var(--k2)' }}>
                            {dsCd.map((c) => (
                              <Chip key={c.ten} mau="tim" chon={chonCd.includes(c.ten)} onClick={() => setChonCd((cu) => (cu.includes(c.ten) ? cu.filter((x) => x !== c.ten) : [...cu, c.ten]))}>
                                {c.ten} <span style={{ opacity: 0.7 }}>{c.soCau}</span>
                              </Chip>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* DẠNG CÂU — thầy chốt 06/09. Suy từ mặt chữ; câu không đủ chắc xếp "chưa rõ", chỉ vào đề khi Ngẫu nhiên. */}
                      <div>
                        <div style={{ ...NHAN_NHO, marginBottom: 'var(--k2)' }}>Dạng câu</div>
                        <div className="flex flex-wrap" style={{ gap: 'var(--k2)' }} role="radiogroup" aria-label="Dạng câu được lấy">
                          {MOI_LOC_DANG.map((d) => (
                            <Chip key={d} mau="tim" chon={chonDang === d} onClick={() => setChonDang(d)}>
                              {TEN_LOC_DANG[d]} <span style={{ opacity: 0.7 }}>{soCauDung(demDang, d)}</span>
                            </Chip>
                          ))}
                        </div>
                        <div style={{ ...NHAN_NHO, marginTop: 'var(--k1)' }}>
                          Kho đang có {demDang.ly_thuyet} câu {TEN_DANG.ly_thuyet.toLowerCase()}, {demDang.bai_tap} câu {TEN_DANG.bai_tap.toLowerCase()}
                          {demDang.chua_ro > 0 ? `, và ${demDang.chua_ro} câu app chưa phân loại chắc chắn — số này chỉ vào đề khi chọn Ngẫu nhiên.` : '.'}
                        </div>
                      </div>

                      {/* MỨC SAO — thầy chốt 07/09. */}
                      <div>
                        <div style={{ ...NHAN_NHO, marginBottom: 'var(--k2)' }}>Mức sao</div>
                        <div className="flex flex-wrap" style={{ gap: 'var(--k2)' }} role="radiogroup" aria-label="Mức sao được lấy">
                          {MOI_LOC_SAO.map((v) => (
                            <Chip key={v} mau="tim" chon={chonSao === v} onClick={() => setChonSao(v)}>
                              {TEN_LOC_SAO[v]} <span style={{ opacity: 0.7 }}>{soCauHopSao(demSaoKho, v)}</span>
                            </Chip>
                          ))}
                        </div>
                        <div style={{ ...NHAN_NHO, marginTop: 'var(--k1)' }}>2 sao là câu khó có bẫy, 1 sao là câu bản chất. Câu chưa gắn sao chỉ vào đề khi chọn Mọi mức.</div>
                      </div>

                      <div>
                        <div style={{ ...NHAN_NHO, marginBottom: 'var(--k2)' }}>Mức độ được lấy {chonMuc.length === 0 ? '(tất cả)' : ''}</div>
                        <div className="flex flex-wrap" style={{ gap: 'var(--k2)' }}>
                          {MOI_MUC.map((m) => (
                            <Chip key={m} chon={chonMuc.includes(m)} onClick={() => setChonMuc((cu) => (cu.includes(m) ? cu.filter((x) => x !== m) : [...cu, m]))}>
                              {TEN_MUC[m]} <span style={{ opacity: 0.7 }}>{demMuc[m]}</span>
                            </Chip>
                          ))}
                          {demMuc[''] > 0 && <span style={NHAN_NHO}>· {demMuc['']} câu chưa gắn mức, chỉ vào đề khi để trống bộ lọc mức độ</span>}
                        </div>
                      </div>
                    </div>
                  </details>

                  <div className="flex items-center justify-between" style={{ gap: 'var(--k3)' }}>
                    <div style={{ fontFamily: 'var(--sans)', fontSize: 'var(--cx-2)', color: 'var(--muc)' }}>
                      Kho của ca: <b style={SO}>{tongCau(daRut)}</b> câu (I {daRut.I} · II {daRut.II} · III {daRut.III})
                    </div>
                    <button type="button" onClick={() => setMoChiTiet((v) => !v)} className="tap-target font-bold inline-flex items-center" style={{ ...NHAN_NHO, gap: 4, color: 'var(--muc)' }} aria-expanded={moChiTiet}>
                      {moChiTiet ? 'Thu lại' : 'Xem từng câu'}
                      <ChevronDown size={16} style={{ transform: moChiTiet ? 'rotate(180deg)' : 'none', transitionProperty: 'transform', transitionDuration: 'var(--nhanh)' }} />
                    </button>
                  </div>

                  {moChiTiet && kq && (
                    <div className="flex flex-col" style={{ gap: 'var(--k3)' }}>
                      {PHAN_DE.filter((p) => kq.chon[p].length > 0).map((p) => (
                        <div key={p} className="flex flex-col" style={{ gap: 'var(--k2)' }}>
                          <div className="font-bold" style={{ ...NHAN_NHO, color: 'var(--muc)' }}>
                            Phần {p} — {kq.chon[p].length} câu
                          </div>
                          {kq.chon[p].map((c, i) => (
                            <HangCau key={c.id} c={c} stt={i + 1} conDoi={kq.conLai[p] > 0} doi={() => doiCau(p, c.id)} bo={() => boCau(p, c.id)} />
                          ))}
                        </div>
                      ))}
                    </div>
                  )}

                  <div style={NHAN_NHO}>Cả lớp làm cùng bộ câu này, chỉ đảo thứ tự câu và thứ tự A–D riêng từng em. Điểm hai em so được trực tiếp với nhau.</div>
                </>
              )}
            </>
          )}
        </>
      )}
    </div>
  )
}
