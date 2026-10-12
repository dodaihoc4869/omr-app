// TẤM "HỒ SƠ LÀM BÀI" CỦA MỘT EM — mở từ Hành trình › Nhịp học hoặc › Bài hằng ngày (bấm một em).
// LỊCH SỬ: 09/10 khuya thầy: "bấm vào từng học sinh hiển thị rõ toàn bộ lịch sử, câu làm sai số giây làm mỗi câu, mọi thứ về học sinh đó" ⇒ tấm
// "Lịch sử làm câu". 12/10 THẦY: "Khi tôi bấm vào học sinh tôi muốn biết mọi thông tin làm bài của học sinh, câu sai, câu đúng, câu đã làm, câu đã ôn
// tôi muốn biết rõ học sinh đó chăm chỉ hay lười biếng hay đối phó làm bài tập mọi thứ phải hiển thị khoa học trực quan đẹp mắt" ⇒ TRÙNG TU:
//   · ĐẦU TẤM (điểm nhấn duy nhất): nhãn thái độ "Chăm chỉ" / "Chưa đều" / "Có dấu hiệu đối phó" / "Chưa đủ dữ liệu" + lý do BẰNG SỐ — lệnh CHỈ ĐỌC
//     `/gv/ho-so-thai-do` (`src/lib/bai-hang-ngay-api.ts`, luật + ngưỡng một chỗ ở `server/src/bai-hang-ngay-kieu.ts`). Không tự phán thêm gì.
//   · "Hôm nay" (dòng Nhịp học khi mở từ Nhịp học; mở từ Bài hằng ngày thì lấy ngày hôm nay của lịch).
//   · TỪ 12/10: năm ô số (đã làm · đúng · sai · đã ôn · giây trung bình) · lịch làm bài theo ngày (ô màu như bảng Bài hằng ngày) · biểu đồ độ đúng
//     theo ngày (cột CSS) · phân bố số giây (nhóm quá nhanh tô riêng) · sáu tín hiệu, mỗi tín hiệu có số + ngưỡng.
//   · TOÀN BỘ SỔ (`/gv/lich-su-lam-cau`, giữ nguyên số và chữ cũ): bốn ô số + bốn thẻ con Câu sai · Câu đúng · Câu đã ôn · Toàn bộ lịch sử
//     (Câu đúng / Câu đã ôn từ lệnh hồ sơ thái độ). Giây ƯỚC TÍNH ghi "≈", không đo được ghi "chưa đo giờ"; 100 dòng mỗi đợt + "Xem thêm".
//   · Tấm bên phải trên máy tính (rộng ≤ 760 px, nền che), TOÀN MÀN trên điện thoại. Esc / Đóng / bấm nền che ⇒ đóng; Tab giữ trong tấm; đóng xong
//     focus về đúng nút đã bấm (thẻ mở tấm lo). Lệnh hồ sơ thái độ lỗi / máy chủ cũ chưa có ⇒ một dòng nói thật + Thử lại, phần lịch sử vẫn đủ.
//   · "Mở hồ sơ đầy đủ" ⇒ màn Học sinh mở hồ sơ em (ca kiểm tra, EXP, thần thú, phụ huynh…) — `moHoSoEm`.
// Mảnh riêng nạp LƯỜI (ngoài precache, vite.config.ts). Biểu đồ bằng CSS, không thư viện. Màu chỉ biến --gvm-* (bai-hang-ngay.css).
import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { Check, ExternalLink, RotateCcw, X } from 'lucide-react'
import { gioPhutVN, ngayThuChu, ngayVN } from '../../lib/em-toan-canh'
import { lyDoDeHieu } from '../../lib/loi-de-hieu'
import { layLichSuLamCau, TRAN_GIOI_HAN, type CauEmSai, type KetQuaLichSuLamCau, type LanLamCau, type NguonGiay } from '../../lib/lich-su-lam-cau-api'
import { layHoSoThaiDo, NGUONG_THAI_DO, type CauTomTat, type KetQuaHoSoThaiDo, type NgayHoatDong } from '../../lib/bai-hang-ngay-api'
import { useAppStore } from '../../store/appStore'
import { chuCaiTen, chuHomNay, coMucNhip, nhomNhipCuaEm, TEN_NHOM_NHIP, tenKhoi, tenTang, type DongNhip, type LoaiNhomNhip } from './nhip-hanh-trinh'
import { chuO, MO_TA_NHAN, mucO, ngayNgan, TEN_MUC_TIN_HIEU, thuNgan } from './bai-hang-ngay-ui'
import './bai-hang-ngay.css'

/** Em mở tấm: bắt buộc SBD · tên · khối; số Nhịp học (mức hôm nay, tầng…) có khi mở từ Nhịp học; `lop` khi mở từ Bài hằng ngày. */
export type EmHoSo = Pick<DongNhip, 'sbd' | 'ten' | 'khoi'> & Partial<Omit<DongNhip, 'sbd' | 'ten' | 'khoi'>> & { lop?: string }

/** Số lần hiện mỗi đợt ở "Toàn bộ lịch sử" (danh sách dài — chuẩn B16). */
export const MOI_DOT = 100

// ------------------------------------------------------------------ PHÉP THUẦN (test gọi thẳng)

/** Mức độ câu theo chữ chương trình (bảng từ chuẩn A2: Nhận biết · Thông hiểu · Vận dụng). Không rõ ⇒ ''. */
export function tenMucDo(m: string): string {
  const k = m.trim().toLowerCase()
  if (k === 'biet' || k === 'nb') return 'Nhận biết'
  if (k === 'hieu' || k === 'th') return 'Thông hiểu'
  if (k === 'vd' || k === 'van_dung') return 'Vận dụng'
  if (k === 'vdc' || k === 'van_dung_cao') return 'Vận dụng cao'
  return ''
}

/** "45 giây" · "1 phút 5 giây" · "2 phút". */
export function doiGiay(giay: number): string {
  const s = Math.max(1, Math.round(giay))
  if (s < 60) return `${s} giây`
  const p = Math.floor(s / 60)
  const du = s % 60
  return du ? `${p} phút ${du} giây` : `${p} phút`
}

/** Chữ số giây một lần làm: đo thật ⇒ "45 giây"; ƯỚC TÍNH ⇒ "≈ 45 giây"; không đo được ⇒ "chưa đo giờ". `nguon` 'khong-ro' = có số nhưng không
 *  biết nguồn (câu sai không khớp được với lần nào trong danh sách) ⇒ ghi số trơn. */
export function chuGiay(giay: number | null, nguon: NguonGiay | 'khong-ro'): string {
  if (giay === null || nguon === null) return 'chưa đo giờ'
  return nguon === 'uoc' ? `≈ ${doiGiay(giay)}` : doiGiay(giay)
}

export const tieuDeCau = (c: Pick<LanLamCau, 'tieuDe' | 'qid'>): string => c.tieuDe.trim() || `Câu ${c.qid}`
export const chuKetQua = (dung: boolean | null): string => (dung === true ? 'Đúng' : dung === false ? 'Sai' : 'Bỏ trống')

/** Gom các lần theo ngày lịch Việt Nam, GIỮ thứ tự máy chủ (mới trước). */
export function gomTheoNgay(lan: readonly LanLamCau[]): { ngay: string; lan: LanLamCau[] }[] {
  const ra: { ngay: string; lan: LanLamCau[] }[] = []
  for (const l of lan) {
    const ngay = l.ngay || ngayVN(l.luc)
    const cuoi = ra[ra.length - 1]
    if (cuoi && cuoi.ngay === ngay) cuoi.lan.push(l)
    else ra.push({ ngay, lan: [l] })
  }
  return ra
}

/** Số giây các lần SAI của một câu kèm nguồn đo: lấy từ các lần sai của câu ấy trong `lan` (cũ → mới) khi khớp đúng số lần với `giaySai`;
 *  không khớp (lần cũ nằm ngoài `lan` được trả) ⇒ số trơn từ `giaySai`, nguồn 'khong-ro' (không ghi "≈" khi không chắc). */
export function giayCacLanSai(c: Pick<CauEmSai, 'qid' | 'giaySai'>, lan: readonly LanLamCau[]): { giay: number | null; nguon: NguonGiay | 'khong-ro' }[] {
  const sai = lan.filter((l) => l.qid === c.qid && l.dung === false).sort((a, b) => a.luc.localeCompare(b.luc))
  if (sai.length === c.giaySai.length)
    return sai.map((l, i) => {
      const giay = c.giaySai[i] ?? l.giay
      return { giay, nguon: giay === null ? null : (l.nguonGiay ?? 'khong-ro') }
    })
  return c.giaySai.map((g) => ({ giay: g, nguon: g === null ? null : 'khong-ro' }))
}

const ngayGio = (iso: string) => {
  const ngay = ngayThuChu(ngayVN(iso))
  const gio = gioPhutVN(iso)
  return gio && ngay ? `${gio} · ${ngay}` : ''
}

// ------------------------------------------------------------------ GIAO DIỆN

const CHON_FOCUS = 'button:not([disabled]), [href], input:not([disabled]), select, textarea, [tabindex]:not([tabindex="-1"])'

function XuongTam() {
  return (
    <div className="gvv2-hs-xuong" role="status" aria-label="Đang tải lịch sử làm câu">
      <div className="gvv2-hs-so">
        {[0, 1, 2, 3].map((i) => (
          <span key={i} className="gvv2-cc-xuong-khoi tt-xuong" style={{ height: 76, borderRadius: 16 }} />
        ))}
      </div>
      {[0, 1, 2].map((i) => (
        <span key={i} className="gvv2-cc-xuong-khoi tt-xuong" style={{ width: '100%', height: 64, borderRadius: 12 }} />
      ))}
    </div>
  )
}

function OSo({ nhan, so, phu }: { nhan: string; so: string; phu: string }) {
  return (
    <div className="gvv2-hs-o">
      <dt>{nhan}</dt>
      <dd>
        <b className="gvv2-so">{so}</b>
        <small className="gvv2-so">{phu}</small>
      </dd>
    </div>
  )
}

function DsCauSai({ cauSai, lan }: { cauSai: readonly CauEmSai[]; lan: readonly LanLamCau[] }) {
  if (cauSai.length === 0) return <p className="gvv2-trong">Em chưa sai câu nào trong các lượt đã ghi.</p>
  return (
    <ul className="gvv2-hs-cau-ds">
      {cauSai.map((c) => {
        const giay = giayCacLanSai(c, lan)
        const muc = tenMucDo(c.mucDo)
        const lanCuoi = ngayGio(c.lanCuoi)
        return (
          <li key={c.qid} className="gvv2-hs-cau" data-sua={c.lanCuoiDung ? 'true' : 'false'}>
            <div className="gvv2-hs-cau-dau">
              <b>{tieuDeCau(c)}</b>
              <span className="gvv2-hs-nhan" data-sua={c.lanCuoiDung ? 'true' : 'false'}>
                {c.lanCuoiDung ? <Check size={14} aria-hidden="true" /> : <RotateCcw size={14} aria-hidden="true" />}
                {c.lanCuoiDung ? 'Đã sửa được' : 'Chưa sửa được'}
              </span>
            </div>
            <p className="gvv2-hs-cau-phu gvv2-so">
              {muc ? `${muc} · ` : ''}sai {c.soSai} lần · đúng {c.soDung} lần{lanCuoi ? ` · lần cuối ${lanCuoi}` : ''}
            </p>
            {giay.length > 0 && (
              <p className="gvv2-hs-cau-giay gvv2-so">
                <span>Số giây các lần sai:</span> {giay.map((g) => chuGiay(g.giay, g.nguon)).join(' · ')}
              </p>
            )}
          </li>
        )
      })}
    </ul>
  )
}

function LichSu({ kq, onTaiThem, dangTai }: { kq: KetQuaLichSuLamCau; onTaiThem: () => void; dangTai: boolean }) {
  const [chiSai, setChiSai] = useState(false)
  const [soHien, setSoHien] = useState(MOI_DOT)
  const loc = useMemo(() => (chiSai ? kq.lan.filter((l) => l.dung === false) : kq.lan), [kq.lan, chiSai])
  const ngay = useMemo(() => gomTheoNgay(loc.slice(0, soHien)), [loc, soHien])
  const con = loc.length - Math.min(soHien, loc.length)
  return (
    <div className="gvv2-hs-ls">
      <div className="gvv2-hs-ls-dau">
        <p className="gvv2-so" aria-live="polite">
          Đang hiện <b>{Math.min(soHien, loc.length)}</b>/{loc.length} {chiSai ? 'lần sai' : 'lượt'}
          {kq.conNua ? ` · ${kq.lan.length} lượt gần nhất` : ''}
        </p>
        <button
          type="button"
          className="gvv2-nut-vien tt-nhan gvv2-hs-loc"
          aria-pressed={chiSai}
          onClick={() => {
            setChiSai((x) => !x)
            setSoHien(MOI_DOT)
          }}
        >
          {chiSai ? <Check size={16} aria-hidden="true" /> : null}
          Chỉ lần sai
        </button>
      </div>
      {loc.length === 0 ? (
        <p className="gvv2-trong">{chiSai ? 'Em chưa có lần sai nào trong các lượt đã tải.' : 'Chưa có lượt nào.'}</p>
      ) : (
        ngay.map((n) => (
          <section key={n.ngay} className="gvv2-hs-ngay" aria-label={ngayThuChu(n.ngay) || n.ngay}>
            <h4 className="gvv2-hs-ngay-tieu">
              {ngayThuChu(n.ngay) || n.ngay}
              <span className="gvv2-so"> · {n.lan.length} lượt</span>
            </h4>
            <ol className="gvv2-hs-lan-ds">
              {n.lan.map((l, i) => {
                const muc = tenMucDo(l.mucDo)
                const phu = [l.noi, muc, l.chon ? `Chọn ${l.chon}` : '', chuGiay(l.giay, l.nguonGiay), l.coGoiY ? 'có dùng gợi ý' : ''].filter(Boolean).join(' · ')
                const k = l.dung === true ? 'dung' : l.dung === false ? 'sai' : 'trong'
                return (
                  <li key={`${l.luc}-${l.qid}-${i}`} className="gvv2-hs-lan" data-kq={k}>
                    <time className="gvv2-so" dateTime={l.luc}>
                      {gioPhutVN(l.luc)}
                    </time>
                    <span className="gvv2-hs-lan-chu">
                      <b>{tieuDeCau(l)}</b>
                      <small className="gvv2-so">{phu}</small>
                    </span>
                    <span className="gvv2-hs-kq" data-kq={k}>
                      {chuKetQua(l.dung)}
                    </span>
                  </li>
                )
              })}
            </ol>
          </section>
        ))
      )}
      {con > 0 && (
        <button type="button" className="gvv2-nut-vien tt-nhan gvv2-hs-them" onClick={() => setSoHien((s) => s + MOI_DOT)}>
          Xem thêm {Math.min(MOI_DOT, con)} {chiSai ? 'lần sai' : 'lượt'} (còn {con})
        </button>
      )}
      {con === 0 && kq.conNua && kq.lan.length < TRAN_GIOI_HAN && (
        <button type="button" className="gvv2-nut-vien tt-nhan gvv2-hs-them" onClick={onTaiThem} disabled={dangTai} aria-busy={dangTai}>
          {dangTai ? 'Đang tải…' : 'Tải thêm lượt cũ hơn'}
        </button>
      )}
      {con === 0 && kq.conNua && kq.lan.length >= TRAN_GIOI_HAN && <p className="gvv2-hs-ghi">Máy chủ gửi tối đa {TRAN_GIOI_HAN} lượt gần nhất; lượt cũ hơn không hiện ở đây.</p>}
    </div>
  )
}

// ------------------------------------------------------------------ HỒ SƠ THÁI ĐỘ (từ 12/10)

const phan = (tu: number, mau: number): number | null => (mau > 0 ? Math.round((100 * tu) / mau) : null)
/** Khoảng xem: "12/10 – 14/10" (một ngày ⇒ "12/10"). */
export const chuKhoang = (tu: string, den: string): string => (tu === den ? ngayNgan(tu) : `${ngayNgan(tu)} – ${ngayNgan(den)}`)

function XuongThaiDo() {
  return (
    <div className="gvv2-tdo-xuong" role="status" aria-label="Đang tải hồ sơ thái độ làm bài">
      <span className="gvv2-cc-xuong-khoi tt-xuong" style={{ width: '100%', height: 132, borderRadius: 20 }} />
      <span className="gvv2-cc-xuong-khoi tt-xuong" style={{ width: '100%', height: 84, borderRadius: 16 }} />
    </div>
  )
}

function DauThaiDo({ td }: { td: KetQuaHoSoThaiDo }) {
  const k = td.ketLuan
  return (
    <section className="gvv2-tdo-dau" data-nhan={k.nhan} aria-labelledby="gvv2-tdo-nhan">
      <small className="gvv2-tdo-mat gvv2-so">Thái độ làm bài · {chuKhoang(td.tu, td.den)}</small>
      <h3 id="gvv2-tdo-nhan" className="gvv2-tdo-nhan">
        {k.chu}
      </h3>
      <p className="gvv2-tdo-mo-ta">{MO_TA_NHAN[k.nhan]}</p>
      {k.lyDo.length > 0 && (
        <ul className="gvv2-tdo-ly-do gvv2-so" aria-label="Lý do">
          {k.lyDo.map((l) => (
            <li key={l}>{l}</li>
          ))}
        </ul>
      )}
    </section>
  )
}

function OSoTd({ nhan, so, phu }: { nhan: string; so: string; phu: string }) {
  return (
    <div className="gvv2-tdo-o">
      <dt>{nhan}</dt>
      <dd>
        <b className="gvv2-so">{so}</b>
        <small className="gvv2-so">{phu}</small>
      </dd>
    </div>
  )
}

function LichNgay({ ngay }: { ngay: readonly NgayHoatDong[] }) {
  return (
    <ol className="gvv2-tdo-lich" aria-label="Lịch làm bài theo ngày">
      {ngay.map((n) => (
        <li key={n.ngay} className="gvv2-tdo-ngay" data-muc={mucO(n)} data-hom-nay={n.homNay ? 'true' : undefined} title={chuO(n)}>
          <small className="gvv2-so" aria-hidden="true">
            {n.homNay ? 'Hôm nay' : thuNgan(n.ngay)} · {ngayNgan(n.ngay)}
          </small>
          <b className="gvv2-so" aria-hidden="true">
            {n.daLam}/{n.mucToiThieu}
          </b>
          <small className="gvv2-so" aria-hidden="true">
            {n.datMuc ? 'đủ mức' : `thiếu ${n.thieu}`}
          </small>
          <span className="gvv2-an-chu">{chuO(n)}</span>
        </li>
      ))}
    </ol>
  )
}

function CotDoDung({ ngay }: { ngay: readonly NgayHoatDong[] }) {
  return (
    <ol className="gvv2-tdo-cot" aria-label="Độ đúng theo ngày">
      {ngay.map((n) => {
        const coKq = n.soDung + n.soSai
        return (
          <li key={n.ngay} className="gvv2-tdo-cot-o">
            <span className="gvv2-tdo-cot-so gvv2-so" aria-hidden="true">
              {n.tiLeDung === null ? '—' : `${n.tiLeDung}%`}
            </span>
            <span className="gvv2-tdo-cot-khung" aria-hidden="true">
              <i style={{ height: `${n.tiLeDung ?? 0}%` }} />
            </span>
            <span className="gvv2-tdo-cot-ngay gvv2-so" aria-hidden="true">
              {ngayNgan(n.ngay)}
            </span>
            <small className="gvv2-so" aria-hidden="true">
              {coKq} lượt
            </small>
            <span className="gvv2-an-chu">
              {ngayNgan(n.ngay)}: {coKq ? `đúng ${n.soDung}/${coKq} lượt (${n.tiLeDung}%)` : 'chưa có lượt có kết quả'}
            </span>
          </li>
        )
      })}
    </ol>
  )
}

function PhanBoGiay({ td }: { td: KetQuaHoSoThaiDo }) {
  const lon = Math.max(1, ...td.phanBoGiay.map((g) => g.soLuot))
  if (td.dem.soLuotCoGiay === 0) return <p className="gvv2-hs-ghi">Chưa có lượt nào đo được số giây trong khoảng này.</p>
  return (
    <>
      <ul className="gvv2-tdo-giay">
        {td.phanBoGiay.map((g) => {
          const d = phan(g.soDung, g.soLuot)
          return (
            <li key={g.nhan} className="gvv2-tdo-giay-dong">
              <span className="gvv2-tdo-giay-nhan">{g.nhan}</span>
              <span className="gvv2-tdo-giay-thanh" aria-hidden="true">
                {g.soNhanh > 0 && <i data-nhanh="true" style={{ width: `${(100 * g.soNhanh) / lon}%` }} />}
                {g.soLuot - g.soNhanh > 0 && <i style={{ width: `${(100 * (g.soLuot - g.soNhanh)) / lon}%` }} />}
              </span>
              <span className="gvv2-tdo-giay-so gvv2-so">
                {g.soLuot} lượt{g.soNhanh > 0 ? ` · ${g.soNhanh} quá nhanh` : ''}
                {d !== null ? ` · đúng ${d}%` : ''}
              </span>
            </li>
          )
        })}
      </ul>
      <p className="gvv2-tdo-giay-ghi">
        <span className="gvv2-tdo-giay-mau" aria-hidden="true" />
        Phần thanh cùng màu ô này là lượt quá nhanh: dưới {NGUONG_THAI_DO.giayNhanhTracNghiem} giây với câu trắc nghiệm, dưới {NGUONG_THAI_DO.giayNhanhTuTinh}{' '}
        giây với câu tự tính. Số giây gồm cả ước tính ở lượt game cũ.
      </p>
    </>
  )
}

function TinHieu({ td }: { td: KetQuaHoSoThaiDo }) {
  return (
    <ul className="gvv2-tdo-th">
      {td.tinHieu.map((t) => (
        <li key={t.ma} className="gvv2-tdo-th-o" data-muc={t.muc} data-ma={t.ma}>
          <div className="gvv2-tdo-th-dau">
            <b>{t.ten}</b>
            <span className="gvv2-tdo-chip" data-muc={t.muc}>
              {TEN_MUC_TIN_HIEU[t.muc]}
            </span>
          </div>
          <p className="gvv2-tdo-th-chu gvv2-so">{t.chu}</p>
          <small className="gvv2-tdo-th-nguong">Ngưỡng: {t.nguong}.</small>
        </li>
      ))}
    </ul>
  )
}

function DsCauTomTat({ cau, loai }: { cau: readonly CauTomTat[]; loai: 'dung' | 'on' }) {
  const [soHien, setSoHien] = useState(MOI_DOT)
  if (cau.length === 0)
    return <p className="gvv2-trong">{loai === 'dung' ? 'Em chưa làm đúng câu nào trong các lượt đã ghi.' : 'Em chưa ôn câu nào (Ôn lại, hoặc làm lại câu từng sai).'}</p>
  const con = cau.length - Math.min(soHien, cau.length)
  return (
    <>
      <ul className="gvv2-hs-cau-ds">
        {cau.slice(0, soHien).map((c) => {
          const muc = tenMucDo(c.mucDo)
          const lanCuoi = ngayGio(c.lanCuoi)
          const chip =
            loai === 'dung'
              ? { k: c.dungLanDau ? 'dung-ngay' : 'dung-sau', chu: c.dungLanDau ? 'Đúng ngay lần đầu' : `Đúng sau ${c.soSai} lần sai` }
              : { k: c.lanCuoiDung ? 'dung-ngay' : 'chua', chu: c.lanCuoiDung ? 'Đã sửa được' : 'Chưa sửa được' }
          return (
            <li key={c.qid} className="gvv2-hs-cau" data-sua={loai === 'on' && !c.lanCuoiDung ? 'false' : 'true'}>
              <div className="gvv2-hs-cau-dau">
                <b>{tieuDeCau(c)}</b>
                <span className="gvv2-tdo-nhan-cau" data-loai={chip.k}>
                  {chip.k === 'chua' ? <RotateCcw size={14} aria-hidden="true" /> : <Check size={14} aria-hidden="true" />}
                  {chip.chu}
                </span>
              </div>
              <p className="gvv2-hs-cau-phu gvv2-so">
                {muc ? `${muc} · ` : ''}
                {loai === 'on' ? `ôn ${c.soLanOn} lần · ` : ''}làm {c.soLan} lần · đúng {c.soDung} · sai {c.soSai}
                {lanCuoi ? ` · lần cuối ${lanCuoi}` : ''}
              </p>
            </li>
          )
        })}
      </ul>
      {con > 0 && (
        <button type="button" className="gvv2-nut-vien tt-nhan gvv2-hs-them" onClick={() => setSoHien((s) => s + MOI_DOT)}>
          Xem thêm {Math.min(MOI_DOT, con)} câu (còn {con})
        </button>
      )}
    </>
  )
}

type TheCon = 'cau-sai' | 'cau-dung' | 'da-on' | 'lich-su'

export default function HoSoLamCauEm({ em, nhom, onDong }: { em: EmHoSo; nhom?: LoaiNhomNhip; onDong: () => void }) {
  const [kq, setKq] = useState<KetQuaLichSuLamCau | null>(null)
  const [loi, setLoi] = useState('')
  const [dangTai, setDangTai] = useState(true)
  const [td, setTd] = useState<KetQuaHoSoThaiDo | null>(null)
  const [loiTd, setLoiTd] = useState('')
  const [dangTaiTd, setDangTaiTd] = useState(true)
  const [the, setThe] = useState<TheCon>('cau-sai')
  const tam = useRef<HTMLElement>(null)
  const nutDong = useRef<HTMLButtonElement>(null)
  const moHoSoEm = useAppStore((s) => s.moHoSoEm)

  const lan = useRef(0)
  const tai = useCallback(
    async (gioiHan?: number) => {
      const l = ++lan.current
      setDangTai(true)
      setLoi('')
      let r: Awaited<ReturnType<typeof layLichSuLamCau>>
      try {
        r = await layLichSuLamCau(em.sbd, gioiHan)
      } catch (e) {
        r = { ok: false, loai: 'mang', chu: lyDoDeHieu(e) }
      }
      if (l !== lan.current) return
      if (r.ok) setKq(r.du)
      else setLoi(r.loai === 'chua_co_lenh' ? r.chu : lyDoDeHieu(r.chu))
      setDangTai(false)
    },
    [em.sbd],
  )
  const lanTd = useRef(0)
  const taiTd = useCallback(async () => {
    const l = ++lanTd.current
    setDangTaiTd(true)
    setLoiTd('')
    let r: Awaited<ReturnType<typeof layHoSoThaiDo>>
    try {
      r = await layHoSoThaiDo(em.sbd)
    } catch (e) {
      r = { ok: false, loai: 'mang', chu: lyDoDeHieu(e) }
    }
    if (l !== lanTd.current) return
    if (r.ok) setTd(r.du)
    else setLoiTd(r.loai === 'chua_co_lenh' ? r.chu : lyDoDeHieu(r.chu))
    setDangTaiTd(false)
  }, [em.sbd])
  useEffect(() => {
    void tai()
    void taiTd()
    return () => {
      lan.current++
      lanTd.current++
    }
  }, [tai, taiTd])

  // Mở tấm ⇒ focus vào nút Đóng (đầu tấm); Esc đóng; Tab / Shift+Tab vòng trong tấm.
  useEffect(() => {
    nutDong.current?.focus()
  }, [])
  useEffect(() => {
    const phim = (ev: KeyboardEvent) => {
      if (ev.key === 'Escape') {
        ev.preventDefault()
        onDong()
        return
      }
      if (ev.key !== 'Tab' || !tam.current) return
      const ds = [...tam.current.querySelectorAll<HTMLElement>(CHON_FOCUS)]
      if (ds.length === 0) return
      const dau = ds[0]!
      const cuoi = ds[ds.length - 1]!
      const dang = document.activeElement
      if (ev.shiftKey && (dang === dau || !tam.current.contains(dang))) {
        ev.preventDefault()
        cuoi.focus()
      } else if (!ev.shiftKey && (dang === cuoi || !tam.current.contains(dang))) {
        ev.preventDefault()
        dau.focus()
      }
    }
    document.addEventListener('keydown', phim)
    return () => document.removeEventListener('keydown', phim)
  }, [onDong])

  const ten = kq?.em.hoTen || td?.em.hoTen || em.ten || em.sbd
  // Lớp: cùng nguồn với bảng đã mở tấm (hồ sơ thái độ / dòng bảng) trước, rồi lịch sử làm câu.
  const tenLop = td?.em.lop || em.lop || kq?.em.lop || ''
  const lop = tenLop ? `Lớp ${tenLop}` : tenKhoi(em.khoi)
  const t = kq?.tong
  const chuaSua = kq ? kq.cauSai.filter((c) => !c.lanCuoiDung).length : 0
  const tiLe = t && t.soLuot > 0 ? `${Math.round((100 * t.soDung) / t.soLuot)}%` : '—'

  // "Hôm nay": dòng Nhịp học (mức hôm nay của kế hoạch Hành trình) khi mở từ Nhịp học; không thì ngày hôm nay của lịch hồ sơ thái độ.
  const hn = useMemo(() => {
    if (em.toiThieu !== undefined && em.daLam !== undefined) {
      const e = { sbd: em.sbd, ten: em.ten, daLam: em.daLam, toiThieu: em.toiThieu }
      return { chu: chuHomNay(e), nhom: nhom ?? nhomNhipCuaEm(e), tang: tenTang(em.tang ?? null), con: coMucNhip(e) ? Math.max(0, (e.toiThieu ?? 0) - e.daLam) : 0 }
    }
    const n = td?.ngay.find((x) => x.homNay)
    if (!n) return null
    return { chu: `${n.daLam}/${n.mucToiThieu} câu`, nhom: nhomNhipCuaEm({ sbd: em.sbd, ten: em.ten, daLam: n.daLam, toiThieu: n.mucToiThieu }), tang: tenTang(n.tang), con: n.thieu }
  }, [em, nhom, td])
  const d = td?.dem
  const coKq = d ? d.soDung + d.soSai : 0
  const the4: [TheCon, string, number | null][] = [
    ['cau-sai', 'Câu sai', kq ? kq.cauSai.length : null],
    ['cau-dung', 'Câu đúng', td ? td.cauDung.length : null],
    ['da-on', 'Câu đã ôn', td ? td.cauDaOn.length : null],
    ['lich-su', 'Toàn bộ lịch sử', t ? t.soLuot : null],
  ]

  return (
    <>
      <div className="gvv2-hs-che" aria-hidden="true" onClick={onDong} />
      <section ref={tam} className="gvv2-hs gvv2-hs--rong" role="dialog" aria-modal="true" aria-labelledby="gvv2-hs-ten" aria-describedby="gvv2-hs-phu">
        <header className="gvv2-hs-dau">
          <span className="gvv2-avatar" aria-hidden="true">
            {chuCaiTen(ten)}
          </span>
          <div className="gvv2-hs-dau-chu">
            <small className="gvv2-hs-mat">Hồ sơ làm bài</small>
            <h2 id="gvv2-hs-ten" className="gvv2-h2">
              {ten}
            </h2>
            <p id="gvv2-hs-phu" className="gvv2-so">
              SBD {em.sbd} · {lop}
            </p>
          </div>
          <button ref={nutDong} type="button" className="gvv2-nut-chu tt-nhan gvv2-hs-dong" onClick={onDong}>
            <X size={18} aria-hidden="true" />
            Đóng
          </button>
        </header>

        <div className="gvv2-hs-than">
          {/* 1 · Thái độ làm bài — điểm nhấn của tấm */}
          {td ? (
            <DauThaiDo td={td} />
          ) : dangTaiTd ? (
            <XuongThaiDo />
          ) : (
            <div className="gvv2-tdo-loi" role="status">
              <p>Chưa tải được hồ sơ thái độ làm bài của em. {loiTd}</p>
              <button type="button" className="gvv2-nut-vien tt-nhan" onClick={() => void taiTd()} disabled={dangTaiTd}>
                Tải lại hồ sơ thái độ
              </button>
            </div>
          )}

          {/* 2 · Hôm nay */}
          {hn && (
            <div className="gvv2-hs-hn" data-nhom={hn.nhom}>
              <span className="gvv2-hs-hn-chu">
                <small>Hôm nay</small>
                <b className="gvv2-so">{hn.chu}</b>
              </span>
              <span className="gvv2-hs-hn-chu">
                <small>Tầng hiện tại</small>
                <b>{hn.tang}</b>
              </span>
              <span className="gvv2-hs-nhom" data-nhom={hn.nhom}>
                {TEN_NHOM_NHIP[hn.nhom]}
              </span>
              {hn.nhom !== 'du' && hn.con > 0 && <small className="gvv2-hs-hn-phu gvv2-so">Còn {hn.con} câu tới mức tối thiểu</small>}
              {!!em.conThieu && em.conThieu > 0 && <small className="gvv2-hs-hn-phu gvv2-so">Kho thiếu {em.conThieu} câu phù hợp cho em hôm nay</small>}
            </div>
          )}
          {!!em.canBoSung?.length && (
            <div className="gvv2-hs-bo-sung">
              <b>Kiến thức cần bổ sung</b>
              <ul>
                {em.canBoSung.map((c, i) => (
                  <li key={i}>
                    {c.ten} · {c.lyDo === 'can_sua_nen' ? 'Cần câu củng cố nền' : 'Cần thêm câu đã duyệt'}
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* 3 · Từ 12/10: số · lịch · biểu đồ · tín hiệu */}
          {td && d && (
            <>
              <section className="gvv2-tdo-khoi" aria-labelledby="gvv2-tdo-so-tieu">
                <h3 id="gvv2-tdo-so-tieu" className="gvv2-tdo-tieu">
                  Làm bài từ {chuKhoang(td.tu, td.den)}
                </h3>
                <dl className="gvv2-tdo-so">
                  <OSoTd nhan="Đã làm" so={`${d.soLuot} lượt`} phu={`${d.soCau} câu khác nhau`} />
                  <OSoTd nhan="Đúng" so={`${d.soDung} lượt`} phu={phan(d.soDung, coKq) === null ? 'chưa có lượt có kết quả' : `${phan(d.soDung, coKq)}% lượt có kết quả`} />
                  <OSoTd nhan="Sai" so={`${d.soSai} lượt`} phu={`${d.soBoTrong} lượt bỏ trống`} />
                  <OSoTd nhan="Đã ôn" so={`${d.soCauOn} câu`} phu={`${d.soLuotOn} lượt ôn`} />
                  <OSoTd
                    nhan="Giây trung bình"
                    so={d.giayTb !== null && d.giayTb > 0 ? doiGiay(d.giayTb) : 'Chưa đo'}
                    phu={d.giayTrungVi !== null ? `trung vị ${doiGiay(d.giayTrungVi)} · ${d.soLuotCoGiay} lượt có số giây` : 'chưa có lượt có số giây'}
                  />
                </dl>
              </section>
              <section className="gvv2-tdo-khoi" aria-labelledby="gvv2-tdo-lich-tieu">
                <h3 id="gvv2-tdo-lich-tieu" className="gvv2-tdo-tieu">
                  Lịch làm bài theo ngày <small>· đã làm/mức tối thiểu</small>
                </h3>
                <LichNgay ngay={td.ngay} />
              </section>
              <section className="gvv2-tdo-khoi" aria-labelledby="gvv2-tdo-dung-tieu">
                <h3 id="gvv2-tdo-dung-tieu" className="gvv2-tdo-tieu">
                  Độ đúng theo ngày <small>· % lượt đúng trên lượt có kết quả</small>
                </h3>
                <CotDoDung ngay={td.ngay} />
              </section>
              <section className="gvv2-tdo-khoi" aria-labelledby="gvv2-tdo-giay-tieu">
                <h3 id="gvv2-tdo-giay-tieu" className="gvv2-tdo-tieu">
                  Số giây mỗi lượt
                </h3>
                <PhanBoGiay td={td} />
              </section>
              <section className="gvv2-tdo-khoi" aria-labelledby="gvv2-tdo-th-tieu">
                <h3 id="gvv2-tdo-th-tieu" className="gvv2-tdo-tieu">
                  Sáu tín hiệu và ngưỡng
                </h3>
                <TinHieu td={td} />
              </section>
              {td.canhBao.map((c) => (
                <p key={c} className="gvv2-hs-ghi">
                  {c}
                </p>
              ))}
            </>
          )}

          {/* 4 · Toàn bộ sổ: bốn ô số + bốn thẻ con */}
          <h3 className="gvv2-tdo-tieu gvv2-tdo-tieu--so">Toàn bộ sổ của em</h3>
          {kq === null && dangTai ? (
            <XuongTam />
          ) : kq === null ? (
            <div className="gvv2-loi gvv2-cc-loi" role="alert">
              <p>Chưa tải được lịch sử làm câu của em. {loi}</p>
              <button type="button" className="gvv2-nut-vien tt-nhan" onClick={() => void tai()} disabled={dangTai}>
                Thử lại
              </button>
            </div>
          ) : (
            <>
              {loi && (
                <div className="gvv2-loi gvv2-cc-loi" role="alert">
                  <p>Chưa tải thêm được lượt cũ hơn. {loi}</p>
                  <button type="button" className="gvv2-nut-vien tt-nhan" onClick={() => void tai(TRAN_GIOI_HAN)} disabled={dangTai}>
                    Thử lại
                  </button>
                </div>
              )}
              <dl className="gvv2-hs-so">
                <OSo nhan="Số lượt làm câu" so={String(t!.soLuot)} phu={`${t!.soCau} câu khác nhau`} />
                <OSo nhan="Tỉ lệ đúng" so={tiLe} phu={`${t!.soDung} đúng · ${t!.soSai} sai · ${t!.soBoTrong} bỏ trống`} />
                <OSo nhan="Câu từng sai" so={String(t!.soCauSai)} phu={`${chuaSua} câu chưa sửa được`} />
                <OSo nhan="Trung bình mỗi câu" so={t!.giayTb !== null && t!.giayTb > 0 ? doiGiay(t!.giayTb) : 'Chưa đo'} phu="lượt đo được, gồm ước tính" />
              </dl>
              {kq.catBot && <p className="gvv2-hs-ghi">Số liệu tính trên 5000 lượt gần nhất của em.</p>}

              {t!.soLuot === 0 ? (
                <p className="gvv2-trong">Sổ chưa ghi lượt làm câu nào của em. Khi em làm bài hằng ngày, ca kiểm tra hay Ôn lại, lượt sẽ hiện ở đây.</p>
              ) : (
                <>
                  <div className="gvv2-con" data-so="4" role="tablist" aria-label="Toàn bộ sổ của em">
                    {the4.map(([k, nhan, so]) => (
                      <button
                        key={k}
                        type="button"
                        role="tab"
                        id={`gvv2-hs-the-${k}`}
                        aria-controls={`gvv2-hs-o-${k}`}
                        aria-selected={the === k}
                        className="gvv2-con-nut tt-nhan"
                        onClick={() => setThe(k)}
                      >
                        {nhan} {so !== null && <span className="gvv2-so">· {so}</span>}
                      </button>
                    ))}
                  </div>
                  <div role="tabpanel" id={`gvv2-hs-o-${the}`} aria-labelledby={`gvv2-hs-the-${the}`} className="gvv2-hs-o-the">
                    {the === 'cau-sai' ? (
                      <DsCauSai cauSai={kq.cauSai} lan={kq.lan} />
                    ) : the === 'lich-su' ? (
                      <LichSu kq={kq} dangTai={dangTai} onTaiThem={() => void tai(TRAN_GIOI_HAN)} />
                    ) : td ? (
                      <DsCauTomTat key={the} cau={the === 'cau-dung' ? td.cauDung : td.cauDaOn} loai={the === 'cau-dung' ? 'dung' : 'on'} />
                    ) : (
                      <p className="gvv2-trong">{dangTaiTd ? 'Đang tải danh sách…' : 'Chưa tải được danh sách này. Bấm "Tải lại hồ sơ thái độ" ở đầu tấm.'}</p>
                    )}
                  </div>
                </>
              )}
            </>
          )}
        </div>

        <footer className="gvv2-hs-chan">
          <button type="button" className="gvv2-nut-vien tt-nhan" onClick={() => moHoSoEm(em.sbd)}>
            <ExternalLink size={18} aria-hidden="true" />
            Mở hồ sơ đầy đủ
          </button>
          <small>Ca kiểm tra, EXP, phụ huynh của em</small>
        </footer>
      </section>
    </>
  )
}
