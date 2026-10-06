// CHI TIẾT MỘT CA THI (QUANLYCATHI.md mục 2 + 5, nền cho mục 6): đi từ Lịch
// sử ca thi hoặc ngay sau khi mở ca. Dữ liệu lượt thi từ máy chủ
// (chiTietCa); ĐIỂM chấm tại máy thầy bằng ngân hàng CÓ đáp án đã lưu khi mở
// ca (đáp án không rời máy thầy) rồi tự ghi điểm + chi tiết từng câu lên
// Sheet (ghiDiem) để phân tích về sau. Mỗi em một hàng `.ca-hang` kèm <Nhan>:
// xám chờ thi lại · tím đang làm · cam rời màn N lần · đỏ bị khoá · xanh đã nộp.
// Xoá ca = xoá mềm, phải gõ đúng mã ca.
import { useEffect, useMemo, useRef, useState } from 'react'
import { BANG_NHIP_THAY, NHIP_PHONG_CHO_THAY, TUY_CHON_NHIP_THAY, useNhipThay } from '../lib/nhip-may-thay'
import DongMatKetNoiCa from '../components/theo-doi-ca/DongMatKetNoiCa'
import { useHoa2Bat } from '../components/chien-dich/co-hoa2'
import GiaoChienDich from '../components/chien-dich/GiaoChienDich'
import { maDeTuBoCau } from '../components/chien-dich/tinh'
import { Check, Trash2, ChevronRight, Unlock, Pencil, LogIn, BarChart3, ArrowLeft } from 'lucide-react'
import { Nhan, OThongBao, NutChinh, TheNoiDung } from '../components/DesignSystem'
import KhungBaiBoSung from '../components/KhungBaiBoSung'
import { classify } from '../engine/score'
import { danhSachCa, danhSachEm, type CaTomTat, batDauThi, capNhatKeyBank, chiTietCa, doiTenCa, dongBoTenCa, moTaLyDoChan, ghiDiem, khoaCa, moKhoa, moKhoaCa, sendTeacherMessage, xoaCa, type ChiTietCa, type ChiTietCauRow, type LuotThiRow, type PhamViCa, type CongBoDiem } from '../lib/exam-api'
import { chuanTenCa, tenHienCua, TEN_CA_TOI_DA } from '../lib/ten-ca'
import { taoBaiGhiDiem, taoChiTietCau } from '../lib/chi-tiet-cau'
import { emLechDiem, loiBaoLechDiem } from '../lib/lech-diem'
import { dongSoCauHoiLai } from '../lib/dem-cau-hoi-lai'
import { maCaLay, vaBienBanCu } from '../lib/va-bien-ban-cu'
import { sinhBoTheoEm, TEN_MUC_PHAN_TANG } from '../lib/de-rieng-blueprint'
import { docCheDoDeRieng, docDeRiengCa, docSoCauCa, loadScriptUrl, loadSessionTeacherBank, luuDeRiengCa, luuSoCauCa, saveSessionTeacherBank, loadTeacherSecret, type BienBanDeRieng, type DeRiengCaLuu } from '../lib/exam-db'
import { loiKhongTimThayCa } from '../lib/cau-chu-ca'
import { CHU_LY_DO_THIEU } from '../lib/de-rieng'
import { CAU_HINH_DE_RIENG_MAC_DINH, docPhamViHoiLai, laCaDaDung } from '../lib/cau-hinh-de-rieng'
import { chayThuRutDeDaDung, chotRutDeDaDung, docRutThuDaDung, type RutThuDaDung } from '../lib/de-rieng-da-dung'
import { xepSaiLaiDaDung, type EmSaiLaiDaDung } from '../lib/rut-de-da-dung'
import { BangRutThuDaDung, KhoiSaiLaiDaDung } from '../components/ca-thi/KhoiDaDung'
import { dungDeRiengChoCa, dungLapTuMayChu } from '../lib/de-rieng-nguon'
import { chayThuRutDeCa, chotRutDeCa, docRutThu, type RutThuCa } from '../lib/de-rieng-v2'
import { demBac, MOI_BAC_LAP, PHAN_V2, TEN_BAC_LAP } from '../lib/rut-de-v2'
import { choEmThiLai } from '../lib/thi-lai'
import { gradeSubmissionFull, type GradedSubmission } from '../lib/exam-grade'
import { dongBoGioMayChu, gioMayChu } from '../lib/gio-may-chu'
import { CACH_TAI_DAY_MS, NHIP_SONG_CA_MS, goiNhipCa, gopTienDoSong, hetLucMuonNhat, phuTienDoSong, type TienDoSong } from '../lib/nhip-song-ca'
import { soanTinRoiMan } from '../lib/tin-nhan-thay'
import { mergeKeepAnswers, type SoCauMoiPhan, type TeacherExamSource } from '../data/examContent'
import { chuTatDe } from '../lib/giu-de-doc'
import { useAppStore } from '../store/appStore'
import { cuaVaoCa } from '../lib/cua-vao-ca'
import { trangThaiCa } from './LichSuCaScreen'
import KhoiThoiGianCa from '../components/KhoiThoiGianCa'
import TamPhuChieuMa, { gopEmDaVao } from '../components/TamPhuChieuMa'
import { moTaCaChieuMa } from '../lib/mo-ta-ca-chieu-ma'
import { themPhutCa, cauKetQuaThemPhut } from '../lib/them-phut-api'
import ThanhTabCa, { type MucTabCa } from '../components/ThanhTabCa'
import { demCauDaLam, tongSoCauCa } from '../lib/con-lai-ca'
import './ca-thi-m3.css'
// CA THI 28/09 (docs/ban-ve-ca-thi-2809): đầu màn Theo dõi, màn Kết thúc ca, Báo cáo chi tiết — THAY khối gập BaoCaoCaLop + trang BaoCaoMotEm cũ.
import TheoDoiCa, { type EmTheoDoi } from '../components/ca-thi/TheoDoiCa'
import NutThemPhutCa from '../components/ca-thi/NutThemPhutCa'
import PhongChoCa from '../components/ca-thi/PhongChoCa'
import KetThucCa from '../components/ca-thi/KetThucCa'
import BaoCaoChiTiet from '../components/ca-thi/BaoCaoChiTiet'
import { congBoDiemCa, dongCuaVaoCa, layBaoCaoCaDayDu, type ThemBaoCaoCa } from '../lib/bao-cao-chi-tiet'
import { tinhBaoCaoCaLop, tomTatCaLop, type BaoCaoCaLop, type EmChoBaoCao } from '../lib/bao-cao-ca-lop'
import { ghepBaoCaoMotEm, layBaoCaoEmMayChu, type BaoCaoEmMayChu } from '../lib/bao-cao-may-chu'
import { nguonCauTuNganHang, tinhBaoCaoMotEm } from '../lib/bao-cao-mot-em'

const SO: React.CSSProperties = { fontFamily: 'var(--sans)', fontVariantNumeric: 'tabular-nums' }
const NHAN_NHO: React.CSSProperties = { fontFamily: 'var(--sans)', fontSize: 'var(--cx-1)', color: 'var(--nhat)' }
const TIEU_DE_MUC: React.CSSProperties = { fontFamily: 'var(--serif)', fontSize: 'var(--cx-3)', fontWeight: 700, color: 'var(--muc)' }
const O_NHAP: React.CSSProperties = {
  height: 52,
  borderRadius: 'var(--bo-1)',
  padding: '0 var(--k4)',
  background: 'var(--the-2)',
  border: '1.5px solid transparent',
  fontFamily: 'var(--sans)',
  fontSize: 'var(--cx-2)',
  color: 'var(--muc)',
  width: '100%',
}

const TEN_CONG_BO: Record<CongBoDiem, string> = { khong: 'Không công bố trên máy em', ngay: 'Xem điểm ngay khi nộp', ca_lop_xong: 'Xem điểm khi cả lớp xong' }
const TEN_PHAM_VI: Record<PhamViCa, string> = { tu_do: 'Tự do', khoi: 'Theo khối', chon: 'Chọn từng em', sbd: 'Số báo danh' }

function gio(iso: string): string {
  const d = new Date(iso)
  return Number.isFinite(d.getTime()) ? d.toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' }) : ''
}
function ngayGio(iso: string): string {
  const d = new Date(iso)
  if (!Number.isFinite(d.getTime())) return ''
  return `${d.toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit' })} ${gio(iso)}`
}

/** Chữ mức độ của CÂU (bảng từ chuẩn: Nhận biết · Thông hiểu · Vận dụng). */
const TEN_MUC_CAU: Record<string, string> = { biet: 'Nhận biết', hieu: 'Thông hiểu', van_dung: 'Vận dụng', '': 'Chưa gắn mức' }
const tenMucCau = (m: string) => TEN_MUC_CAU[m] ?? m

/** XEM TRƯỚC PHÂN BỔ (Rút đề v2, 02/10) — kết quả CHẠY THỬ thang lấp cho từng em lúc ca đề riêng còn ở phòng chờ: em nào thiếu ô
 * nào và được lấp bằng gì. Bấm Bắt đầu thi thì app dùng lại đúng bảng này, chỉ rút thêm cho em vào phòng sau. */
export function BangRutThuV2({ rt, dang, loi, tenCua, onChayLai }: { rt: RutThuCa | null; dang: boolean; loi: string; tenCua: Record<string, string>; onChayLai: () => void }) {
  const [moHet, setMoHet] = useState(false)
  const tong = rt ? Object.keys(rt.kq.theoEm).length : 0
  const dem = useMemo(() => {
    const ra = { muc_dich: 0, song_sinh: 0, cung_dang: 0, moi: 0, nhac_lai: 0 }
    for (const ds of Object.values(rt?.kq.theoEm ?? {})) {
      const d = demBac(ds)
      for (const b of MOI_BAC_LAP) ra[b] += d[b]
    }
    return ra
  }, [rt])
  const emThieu = useMemo(
    () => Object.entries(rt?.kq.thieu ?? {}).sort((a, b) => b[1].length - a[1].length || a[0].localeCompare(b[0])),
    [rt],
  )
  const hien = moHet ? emThieu : emThieu.slice(0, 12)
  return (
    <section data-khoi="rut-thu-v2" aria-label="Xem trước phân bổ" style={{ display: 'flex', flexDirection: 'column', gap: 'var(--k2)', padding: 'var(--k4)', borderRadius: 'var(--bo-2)', background: 'var(--the)' }}>
      <div className="flex items-center justify-between" style={{ gap: 'var(--k3)' }}>
        <div style={TIEU_DE_MUC}>Xem trước phân bổ</div>
        <button type="button" className="tap-target" onClick={onChayLai} disabled={dang} style={{ ...NHAN_NHO, textDecoration: 'underline', color: dang ? 'var(--mo)' : 'var(--nhat)' }}>
          Chạy thử lại
        </button>
      </div>
      <div style={NHAN_NHO}>
        Chạy thử — chưa phát cho em. Bấm Bắt đầu thi thì app dùng đúng bảng này, chỉ rút thêm cho em vào phòng sau.
      </div>
      {dang && !rt ? (
        <div style={NHAN_NHO} role="status">Đang chạy thử bộ câu cho từng em…</div>
      ) : loi && !rt ? (
        <div style={{ ...NHAN_NHO, color: 'var(--cam)' }} role="alert">
          Chưa chạy thử được: {loi}. Bấm Bắt đầu thi vẫn rút đề như cũ; hoặc bấm Chạy thử lại.
        </div>
      ) : !rt ? (
        <div style={NHAN_NHO}>Chưa có em nào trong lớp hay phòng chờ để chạy thử.</div>
      ) : (
        <>
          <div style={{ ...NHAN_NHO, color: 'var(--muc)' }}>
            <b style={SO}>{tong}</b> em ·{' '}
            {PHAN_V2.filter((p) => rt.kq.mucTieu[p].length > 0)
              .map((p) => {
                const theoMuc = new Map<string, number>()
                for (const m of rt.kq.mucTieu[p]) theoMuc.set(m, (theoMuc.get(m) ?? 0) + 1)
                return `Phần ${p}: ${rt.kq.mucTieu[p].length} câu (${[...theoMuc].map(([m, n]) => `${tenMucCau(m)} ${n}`).join(' · ')})`
              })
              .join(' · ')}
            {rt.kq.mucDoCung ? ' · mức độ giữ đúng ma trận' : ' · mức độ sát nhất có thể'}
          </div>
          <div className="flex flex-wrap" style={{ gap: 'var(--k2)' }}>
            {MOI_BAC_LAP.map((b) => (
              <Nhan key={b} tone={b === 'nhac_lai' ? 'cam' : b === 'moi' ? 'xam' : 'tim'}>
                {TEN_BAC_LAP[b]}: <span style={SO}>{dem[b]}</span>
              </Nhan>
            ))}
          </div>
          {rt.hongHoSo.length > 0 && (
            <div style={{ ...NHAN_NHO, color: 'var(--cam)' }}>
              <b style={SO}>{rt.hongHoSo.length}</b> em chưa đọc được hồ sơ lỗi — các em đó nhận đề không có câu ôn lại.
            </div>
          )}
          {emThieu.length === 0 ? (
            <div style={NHAN_NHO}>Mọi em đủ ô đúng ma trận bằng câu mới hoặc câu ôn lại — không em nào thiếu ô.</div>
          ) : (
            <>
              <div style={NHAN_NHO}>
                <b style={SO}>{emThieu.length}</b> em có ô phải lấp thay:
              </div>
              <div style={{ overflowX: 'auto' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', fontFamily: 'var(--sans)', fontSize: 'var(--cx-1)', color: 'var(--muc)' }}>
                  <thead>
                    <tr style={{ textAlign: 'left', color: 'var(--nhat)' }}>
                      <th style={{ padding: '4px 8px 4px 0' }}>Em</th>
                      <th style={{ padding: '4px 8px' }}>Ô thiếu</th>
                      <th style={{ padding: '4px 0 4px 8px' }}>Lấp bằng</th>
                    </tr>
                  </thead>
                  <tbody>
                    {hien.flatMap(([sbd, ds]) =>
                      ds.map((o, i) => (
                        <tr key={`${sbd}-${i}`} style={{ borderTop: i === 0 ? '1px solid var(--vien)' : undefined, verticalAlign: 'top' }}>
                          <td style={{ padding: '4px 8px 4px 0', whiteSpace: 'nowrap' }}>{i === 0 ? tenCua[sbd] || `Số báo danh ${sbd}` : ''}</td>
                          <td style={{ padding: '4px 8px', whiteSpace: 'nowrap' }}>
                            Phần {o.phan} · {tenMucCau(o.mucDo)}
                          </td>
                          <td style={{ padding: '4px 0 4px 8px' }}>
                            <b>{o.bac === 'trong' ? 'Để trống' : TEN_BAC_LAP[o.bac]}</b> — {o.lyDo}
                          </td>
                        </tr>
                      )),
                    )}
                  </tbody>
                </table>
              </div>
              {emThieu.length > hien.length && (
                <button type="button" className="tap-target" onClick={() => setMoHet(true)} style={{ ...NHAN_NHO, textDecoration: 'underline', alignSelf: 'flex-start' }}>
                  Xem thêm {emThieu.length - hien.length} em
                </button>
              )}
            </>
          )}
        </>
      )}
    </section>
  )
}

interface HangEm {
  sbd: string
  hoTen: string
  lop: string
  sdt: string
  moiNhat: LuotThiRow
  cacLuotCu: LuotThiRow[]
  graded: GradedSubmission | null
  /** Điểm hiện ra: chấm tại máy (ưu tiên) hoặc điểm đã ghi trên Sheet. */
  diem: number | null
  /** CA ĐỀ RIÊNG TỪNG EM (DE-RIENG-TUNG-EM mục 6): ba con số của riêng em này,
   * kèm CHI TIẾT từng câu để thầy đọc thẳng chứ không phải mở phiếu từng em.
   * `null` ở ca thường — cột biến mất chứ không hiện số 0 giả. */
  lap?: {
    tong: number
    daSua: number
    saiLai: number
    /** Câu hỏi lại mà em VẪN SAI, kèm sai lần thứ mấy. Đây là thứ thầy cần. */
    saiLaiChiTiet: { phan: 'I' | 'II' | 'III'; soCau: number; qid: string; chuyenDe: string; soLanSai: number; dapAnDung: string; dapAnChon: string }[]
    /** Câu hỏi lại em đã làm đúng — tin tốt, cũng phải đếm được. */
    daSuaChiTiet: { phan: 'I' | 'II' | 'III'; soCau: number; qid: string; chuyenDe: string }[]
  } | null
  /** Ca "Kiểm chứng câu đã đúng": câu em đã làm đúng trước đây có trong đề + câu nay sai lại (kèm nhãn). `null` ở ca khác. */
  daDung?: EmSaiLaiDaDung | null
}

/** BIÊN BẢN LÚC RÚT ĐỀ RIÊNG — trả lời "vì sao em này không có câu hỏi lại".
 *
 * Trước đây mấy con số này chỉ chạy qua một toast rồi mất; thầy mở ca ra sau đó
 * không thấy gì. Bày thẳng: mỗi em một dòng, cần mấy câu, được mấy câu, vì sao
 * thiếu. Không có con số nào tự bịa — mọi thứ ở đây do chính lượt rút ghi lại. */
export function BangBienBanLap({ bb, tenCua }: { bb: BienBanDeRieng; tenCua: (sbd: string) => string }) {
  const ds = Object.keys(bb.canCua)
  const thieuCua = new Map(bb.thieu.map((t) => [t.sbd, t]))
  return (
    <div style={{ background: 'var(--the-2)', borderRadius: 'var(--bo-1)', padding: 'var(--k3)' }}>
      <div className="font-bold" style={{ fontFamily: 'var(--sans)', fontSize: 'var(--cx-2)', color: 'var(--muc)' }}>
        Biên bản rút câu hỏi lại
      </div>
      <div style={{ ...NHAN_NHO, ...SO }}>
        {/* NÓI ĐÚNG PHẠM VI THẦY CHỌN. Bản trước ghi cứng "quét N ca gần nhất"
            cho cả hai chế độ, nên thầy chọn "Ca gần nhất" mà đọc ra "3 ca gần
            nhất" và tưởng máy rút sai (thầy bắt được 08/09). Quét mấy ca là
            chuyện tìm ca em có nộp; LẤY mấy ca mới là điều thầy chốt. */}
        {bb.caDaQuet.length === 0
          ? 'không quét được ca nào trước đó'
          : bb.phamVi === 'khong'
            ? `không rút câu sai — bỏ mọi câu em đã làm ở ${bb.caDaQuet.length} ca đã dò: ${bb.caDaQuet.join(' · ')}`
            : bb.phamVi === 'ba_ca'
            ? `mỗi em lấy tối đa 3 ca gần nhất CHÍNH EM có nộp — đã dò ${bb.caDaQuet.length} ca: ${bb.caDaQuet.join(' · ')}`
            : `lấy ca gần nhất em có nộp — đã dò ${bb.caDaQuet.length} ca: ${bb.caDaQuet.join(' · ')}`}
        {bb.lucRut ? ` · rút lúc ${ngayGio(bb.lucRut)}` : ''}
      </div>
      {/* PHẠM VI QUÉT — thầy phải đọc được đã quét ĐÚNG thư mục chưa.
          Ngày 10/09 cả lớp ra "mới vào lớp, chưa có ca nào" chỉ vì tên ca không
          còn bắt đầu bằng năm sinh nên bộ lọc tự tắt và quét sang khối khác.
          Máy biết chuyện đó ngay lúc chạy mà không nói ra một chữ. */}
      {bb.nguonNam !== undefined && (
        <div
          style={{
            ...NHAN_NHO,
            ...SO,
            color: bb.nguonNam === 'khong_xac_dinh' ? 'var(--do)' : 'var(--nhat)',
            marginTop: 2,
            lineHeight: 1.6,
          }}
        >
          {bb.nguonNam === 'khong_xac_dinh'
            ? '⚠ KHÔNG xác định được năm sinh của ca này (hồ sơ em thiếu năm sinh, và tên ca không bắt đầu bằng năm) — đã quét MỌI khối, câu hỏi lại có thể lấy nhầm lớp. Sửa: đặt tên ca dạng "2009 - Lớp 1 - L3".'
            : `thư mục năm sinh ${bb.namQuet} · ${bb.soCaThuMuc ?? 0} ca trong thư mục · nguồn năm sinh: ${bb.nguonNam === 'hoc_sinh' ? 'hồ sơ học sinh' : 'tên ca'}`}
        </div>
      )}
      {bb.boQua.length > 0 && (
        <div style={{ ...NHAN_NHO, color: 'var(--cam)', marginTop: 4, lineHeight: 1.6 }}>
          Ca không đọc được: {bb.boQua.map((b) => `${b.maCa} (${b.vi_sao})`).join(' · ')}
        </div>
      )}
      {/* GHI CHÚ LÚC RÚT (19/09). Tin thầy CẦN LÀM GÌ ĐÓ (kho mỏng, hồ sơ không đọc
          được) in cam; tin tốt (em vắng đã có đề sẵn, em đã tự khắc phục) in màu
          thường. Biên bản cũ không có `ghiChu` thì khối này không in gì. */}
      {(bb.ghiChu ?? []).map((g, i) => (
        <div key={`ghi-chu-${i}`} style={{ ...NHAN_NHO, color: g.loai === 'canh_bao' ? 'var(--cam)' : 'var(--nhat)', marginTop: 4, lineHeight: 1.6 }}>
          {g.loai === 'canh_bao' ? '⚠ ' : ''}
          {g.loi}
        </div>
      ))}
      <div className="flex flex-col" style={{ gap: 4, marginTop: 'var(--k2)' }}>
        {ds.map((sbd) => {
          const can = bb.canCua[sbd] ?? 0
          const duoc = bb.soLapCua[sbd] ?? 0
          const sai = bb.saiCaTruocCua[sbd] ?? 0
          const t = thieuCua.get(sbd)
          return (
            <div key={`bb-${sbd}`} style={{ ...NHAN_NHO, color: 'var(--muc)', lineHeight: 1.6 }}>
              <b>{tenCua(sbd) || `SBD ${sbd}`}</b>
              <span style={{ ...SO, color: 'var(--nhat)' }}>
                {' '}
                {maCaLay(bb, sbd) ? ` · lấy từ ca ${maCaLay(bb, sbd)}` : ''} · sai {sai} câu · cần {can} · rút được {duoc}
              </span>
              {t && (
                <span style={{ color: 'var(--cam)' }}>
                  {' '}
                  — {CHU_LY_DO_THIEU[t.lyDo as keyof typeof CHU_LY_DO_THIEU] ?? t.lyDo}
                </span>
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}

/** Nhãn trạng thái cho 1 em (màu theo QUANLYCATHI mục 6). */
export function nhanCuaLuot(l: Pick<LuotThiRow, 'trangThai' | 'soLanRoiMan'>): { ten: string; tone: 'xanh' | 'cam' | 'do' | 'tim' | 'xam' } {
  if (l.trangThai === 'khoa') return { ten: 'Bị khoá', tone: 'do' }
  if (l.trangThai === 'duoc_duyet_lai') return { ten: 'Chờ thi lại', tone: 'xam' }
  if (l.trangThai === 'dang_lam') return l.soLanRoiMan > 0 ? { ten: `Rời màn ${l.soLanRoiMan} lần`, tone: 'cam' } : { ten: 'Đang làm', tone: 'tim' }
  return { ten: 'Đã nộp', tone: 'xanh' }
}

export default function ExamMonitorScreen() {
  const showToast = useAppStore((s) => s.showToast)
  // HỒ SƠ MỘT EM mở ngay trong màn này: thầy đang xem ca, chạm tên em là thấy
  // luôn mạnh–yếu và soạn được phiếu gửi phụ huynh — không phải nhớ số báo danh
  // rồi sang tab Học sinh tìm lại.
  const [sbdHoSo, setSbdHoSo] = useState('')
  const setScreen = useAppStore((s) => s.setScreen)
  const classList = useAppStore((s) => s.classList)
  const maCaTheoDoi = useAppStore((s) => s.maCaTheoDoi)
  const sbdBaoCaoCa = useAppStore((s) => s.sbdBaoCaoCa)
  const xongSbdBaoCaoCa = useAppStore((s) => s.xongSbdBaoCaoCa)
  const moToanCanh = useAppStore((s) => s.moToanCanh)
  const datSbdGiaoRieng = useAppStore((s) => s.datSbdGiaoRieng)
  // GAME HÓA 2.0: ca đã kết thúc ⇒ thẻ "BƯỚC TIẾP THEO · Giao chiến dịch luyện" (chỉ khi cờ bật; tắt thì màn như cũ).
  // Thầy 29/09: "phần này có một nút bật lên thì mới giao chiến dịch, còn mặc định là tắt để theo dõi ca thi bình thường" ⇒ MẶC ĐỊNH TẮT (ẩn cả khối),
  // một công tắc ở thanh đầu màn bật khối lên; KHÔNG nhớ giữa các lần mở ca (đổi ca ⇒ tắt lại).
  const hoa2 = useHoa2Bat()
  const [moGiao, setMoGiao] = useState(false)

  const [scriptUrl, setScriptUrl] = useState('')
  const [secret, setSecret] = useState('')
  const [maCa, setMaCa] = useState(maCaTheoDoi)
  const [dangTai, setDangTai] = useState(false)
  const [loi, setLoi] = useState('')
  const [chiTiet, setChiTiet] = useState<ChiTietCa | null>(null)
  const [deRiengCa, setDeRiengCa] = useState<DeRiengCaLuu | null>(null)
  /** Ca này MỞ ở chế độ đề riêng — cờ đánh lúc mở ca. Bộ câu thì rút lúc bấm
   * Bắt đầu, nên hai thứ này tách nhau. */
  const [caCanDeRieng, setCaCanDeRieng] = useState(false)
  /** BẢN ĐỒ BỘ CÂU DÙNG ĐỂ CHẤM — MỘT nguồn cho cả màn.
   *
   * Máy chủ trước, IndexedDB của máy này sau. Thầy bắt được 08/09: mọi chỗ ở
   * đây đọc thẳng bản đồ trong IndexedDB, tức bản chỉ nằm ở đúng cái máy đã bấm
   * Bắt đầu. Mở ca ở máy khác là chấm lại bằng luật hash — khối "câu em sai
   * buổi trước" đếm ra 0 dù máy chủ có đủ, và điểm trên bảng cũng lệch. */
  const boTheoEmDung = chiTiet?.boTheoEmCa ?? deRiengCa?.boTheoEm
  /** BẢN DỰNG LẠI TỪ MÁY CHỦ cho khối "còn sai lại" — dùng khi ô trên máy chủ
   * không chở sẵn (ca mở trước 08/09, hoặc bấm Bắt đầu bằng máy chưa cập nhật).
   * Nhờ nó, MÁY NÀO mở ca cũng thấy đủ khối đỏ, không phải đúng máy đã bấm. */
  const [lapDungLai, setLapDungLai] = useState<{ lapTheoEm: Record<string, string[]>; demSai: Record<string, Record<string, number>> } | null>(null)
  const [teacherBank, setTeacherBank] = useState<TeacherExamSource[] | null>(null)
  // Số câu mỗi phần của ca này (màn Rút đề chốt lúc mở ca). Chấm lại PHẢI dùng
  // đúng con số đó, nếu không thầy rút 25 câu phần I mà máy chỉ lấy 18 ⇒ điểm
  // chấm lại khác điểm đã gửi phụ huynh mà không có dấu hiệu gì.
  const [soCauCa, setSoCauCa] = useState<SoCauMoiPhan | undefined>(undefined)
  // TAB LỌC danh sách em (G4): chỉ đổi cái được hiện. Mặc định 'tat_ca' để thầy không bị ẩn em nào lúc mới mở.
  const [tabEm, setTabEm] = useState('tat_ca')
  // CHIẾU MÃ VÀO THI (thầy duyệt 21/09): tấm phủ toàn màn cho máy chiếu.
  const [chieuMa, setChieuMa] = useState(false)
  const [daCopy, setDaCopy] = useState(false)
  const [daCopyDiem, setDaCopyDiem] = useState(false)
  const [xacNhanSbd, setXacNhanSbd] = useState<string | null>(null)
  const [dangDuyet, setDangDuyet] = useState<string | null>(null)
  const [hoiXoa, setHoiXoa] = useState(false)
  const [maXoa, setMaXoa] = useState('')
  // BÁO PHỤ HUYNH việc rời màn (BA-APP mục 4D): tin soạn sẵn, THẦY sửa rồi mới
  // gửi — máy không tự gửi vì một cuộc gọi đến cũng cho đúng tín hiệu này.
  const [tinBao, setTinBao] = useState<{ sbd: string; noiDung: string } | null>(null)
  const [dangGuiBao, setDangGuiBao] = useState(false)
  const [dangXoa, setDangXoa] = useState(false)
  const [hoiKhoa, setHoiKhoa] = useState(false)
  // ĐÓNG CỬA VÀO (bản vẽ 28/09): hỏi lại trước khi gọi `/gv/dong-cua-vao`.
  const [hoiDongCua, setHoiDongCua] = useState(false)
  const [dangDongCua, setDangDongCua] = useState(false)
  const [dangKhoa, setDangKhoa] = useState(false)
  // ĐỔI TÊN CA (thầy báo 07/09). `null` = đang không sửa; chuỗi = ô nhập đang
  // mở và giữ bản nháp. Bản nháp tách khỏi `chiTiet` để thầy gõ dở rồi bấm Huỷ
  // là tên cũ còn nguyên, không phải tải lại ca.
  const [tenNhap, setTenNhap] = useState<string | null>(null)
  const [dangDoiTen, setDangDoiTen] = useState(false)
  // Đồng bộ họ tên từ danh sách lớp vào ca. Em vào thi chỉ gõ số báo danh nên
  // cột tên của lượt bỏ trống, phiếu gửi phụ huynh in "SBD 10038" thay vì tên.
  const [dangDongBoTen, setDangDongBoTen] = useState(false)
  // PHÒNG CHỜ (thầy chốt 07/09): ca bật phòng chờ thì em đứng ở màn trắng cho
  // tới khi thầy bấm Bắt đầu thi ngay tại đây.
  const [dangBatDau, setDangBatDau] = useState(false)
  // RÚT ĐỀ v2 (02/10): CHẠY THỬ thang lấp cho từng em lúc ca đề riêng còn ở phòng chờ ⇒ bảng Xem trước phân bổ.
  const [rutThu, setRutThu] = useState<RutThuCa | null>(null)
  const [dangRutThu, setDangRutThu] = useState(false)
  const [loiRutThu, setLoiRutThu] = useState('')
  /** Ca "Kiểm chứng câu đã đúng": tiến độ bước tìm câu thay (thầy 06/10) — "đã xong / tổng số em", rỗng khi không chạy. */
  const [tienDoThay, setTienDoThay] = useState<{ xong: number; tong: number } | null>(null)
  const [tenEmLop, setTenEmLop] = useState<Record<string, string>>({})
  // KIỂM CHỨNG CÂU ĐÃ ĐÚNG (02/10): kết quả chạy thử riêng của chế độ này (src/lib/de-rieng-da-dung.ts).
  const [rutThuDaDung, setRutThuDaDung] = useState<RutThuDaDung | null>(null)
  const daRutThuRef = useRef<string>('')
  const [gioChungTheoCa, setGioChungTheoCa] = useState<Record<string, boolean>>({})
  // Đã ghi điểm lên Sheet cho lượt nào (khoá `${sbd}:${lanThu}:${nopLuc}`) — không ghi lặp mỗi lần tải lại.
  const daGhiRef = useRef<Set<string>>(new Set())
  /** Ca nào đã vá khoá `key/<maCa>.json` rồi — vá một lần là đủ. */
  const daVaKeyRef = useRef<Set<string>>(new Set())

  // (Hồ sơ `hoSoEm` cũ của trang một em đã bỏ: Báo cáo chi tiết ca thi 28/09 dùng số của ca + `/gv/bao-cao-ca`.)

  const [dsCaGoiY, setDsCaGoiY] = useState<CaTomTat[]>([])

  useEffect(() => {
    loadScriptUrl().then(setScriptUrl)
    loadTeacherSecret().then(setSecret)
  }, [])

  useEffect(() => {
    if (!chiTiet) {
      Promise.all([loadScriptUrl(), loadTeacherSecret()])
        .then(([u, m]) => {
          if (u.trim() && m.trim()) {
            return danhSachCa(u.trim(), m.trim(), false)
          }
          return []
        })
        .then((list) => {
          if (list && list.length > 0) {
            setDsCaGoiY(list.slice(0, 8))
          }
        })
        .catch(() => {})
    }
  }, [chiTiet, scriptUrl, secret])

  /** Đang có một lượt tải chạy (tay hoặc nền): lượt NỀN không chồng lên (kế hoạch giờ cao điểm 21/09 — không gọi chồng). */
  const dangTaiRef = useRef(false)
  /** Số lần tải HỤT liền nhau (nền hoặc tay) + giờ của lần tải TỐT cuối: ≥ 2 hụt ⇒ dòng "Mất kết nối · số lúc HH:MM" (số trên màn đã cũ). */
  const [soHut, setSoHut] = useState(0)
  const [gioTot, setGioTot] = useState<number | null>(null)
  /** Trả `true` = tải được; `false` = lỗi / thiếu cấu hình (vòng tự làm mới dùng để LÙI DẦN). */
  const tai = async (ma: string, imLang = false): Promise<boolean> => {
    const url = (scriptUrl || (await loadScriptUrl())).trim()
    const mat = (secret || (await loadTeacherSecret())).trim()
    if (!url) { setLoi('Chưa cấu hình địa chỉ máy chủ — vào Cài đặt → Kết nối máy chủ'); return false }
    if (!mat) { setLoi('Chưa nhập mã bí mật — vào Cài đặt → Kết nối máy chủ'); return false }
    if (!ma.trim()) { setLoi('Nhập mã ca'); return false }
    if (imLang && dangTaiRef.current) return true
    dangTaiRef.current = true
    if (!imLang) setDangTai(true)
    setLoi('')
    try {
      // Máy này chưa có bản đề CÓ đáp án của ca (ca mở ở máy/điện thoại khác)
      // thì XIN LUÔN từ máy chủ và cất lại — nếu không, thầy ngồi máy tính sẽ
      // không chấm lại, không xuất bảng điểm, không tải phiếu được. Lệnh đã đòi
      // mã bí mật nên không mở rộng quyền cho ai.
      const banksCu = await loadSessionTeacherBank(ma.trim())
      const ct = await chiTietCa(url, mat, ma.trim(), !banksCu)
      setChiTiet(ct)
      let bank = banksCu
      if (!bank && ct.keyBank && (ct.keyBank.phanI.length || ct.keyBank.phanII.length || ct.keyBank.phanIII.length)) {
        bank = [{ maDe: ct.ca.maCa, phanI: ct.keyBank.phanI, phanII: ct.keyBank.phanII, phanIII: ct.keyBank.phanIII }]
        await saveSessionTeacherBank(ma.trim(), bank)
      }
      setTeacherBank(bank ?? null)
      // Ưu tiên số câu lưu ở máy này; ca mở ở máy khác thì lấy theo gói đáp án
      // máy chủ vừa trả (mergeKeepAnswers đã đính soCau vào đó) rồi cất lại.
      const scLocal = await docSoCauCa(ma.trim())
      const scServer = (ct.keyBank as { soCau?: SoCauMoiPhan } | undefined)?.soCau
      const sc = scLocal ?? (scServer && scServer.I + scServer.II + scServer.III > 0 ? scServer : undefined)
      setSoCauCa(sc)
      if (!scLocal && sc) await luuSoCauCa(ma.trim(), sc)
      setSoHut(0)
      setGioTot(Date.now())
      // CA ĐỀ RIÊNG TỪNG EM: bản đồ sbd → câu PHẢI có mặt trước khi chấm. Chấm
      // bằng luật hash trong khi em nhận bộ câu theo bản đồ là ra bộ câu của
      // người khác — sai điểm mà màn hình không báo gì.
      setDeRiengCa((await docDeRiengCa(ma.trim()).catch(() => undefined)) ?? null)
      // MÁY CHỦ LÀ NGUỒN CHÍNH. IndexedDB chỉ còn là bản sao cho ca mở trước
      // 08/09 — hồi đó cờ chế độ chỉ nằm ở máy mở ca, nên mở ca ở điện thoại
      // rồi bấm Bắt đầu trên máy tính là máy tính im lặng coi đây là ca thường
      // (ca 933467).
      const drMayChu = (ct.ca as { deRieng?: boolean }).deRieng === true
      setCaCanDeRieng(drMayChu || (await docCheDoDeRieng(ma.trim()).catch(() => false)))
      return true
    } catch (e) {
      const msg = e instanceof Error ? e.message : 'lỗi không rõ'
      if (msg.includes('Không tìm thấy ca kiểm tra')) {
        setLoi(loiKhongTimThayCa(ma, dsCaGoiY.length > 0))
      } else {
        setLoi(`Không tải được ca: ${msg}`)
      }
      setSoHut((n) => n + 1)
      return false
    } finally {
      dangTaiRef.current = false
      setDangTai(false)
    }
  }

  // ĐI TỪ MÀN HỌC SINH (nút Báo cáo một ca): modal báo cáo HS cũ đã gộp vào đây ⇒ tải xong đúng ca thì mở Báo cáo chi tiết › Từng em.
  useEffect(() => {
    if (!sbdBaoCaoCa || !chiTiet || chiTiet.ca.maCa !== maCaTheoDoi) return
    setSbdHoSo(sbdBaoCaoCa)
    setMoBaoCao('em')
    xongSbdBaoCaoCa?.()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sbdBaoCaoCa, chiTiet?.ca.maCa, maCaTheoDoi])

  useEffect(() => {
    if (maCaTheoDoi) tai(maCaTheoDoi)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [maCaTheoDoi])

  // DỰNG LẠI KHỐI ĐỎ TỪ MÁY CHỦ khi ô của ca không chở sẵn (thầy chốt 08/09:
  // "đồng bộ phần màu đỏ đấy vào tất cả các thiết bị").
  //
  // Chỉ chạy khi THIẾU: có sẵn thì không tốn thêm lệnh nào. Hỏng thì im lặng —
  // khối đỏ đã có sẵn dòng nói máy này không giữ biên bản.
  useEffect(() => {
    if (!chiTiet) return
    const url = scriptUrl.trim()
    const mat = secret.trim()
    if (!url || !mat) return
    const bo = boTheoEmDung
    if (!bo || Object.keys(bo).length === 0) return
    const daCoLap = Object.keys(chiTiet.lapTheoEm ?? {}).length > 0 || Object.keys(deRiengCa?.lapTheoEm ?? {}).length > 0
    const daCoDem = Object.keys(chiTiet.demSaiTheoEm ?? {}).length > 0 || Object.keys(deRiengCa?.lapCua ?? {}).length > 0
    if (daCoLap && daCoDem) return
    let huy = false
    dungLapTuMayChu(url, mat, chiTiet.ca.maCa, bo)
      .then((ra) => {
        if (!huy && Object.keys(ra.lapTheoEm).length > 0) setLapDungLai(ra)
      })
      .catch(() => {})
    return () => {
      huy = true
    }
  }, [chiTiet, scriptUrl, secret, deRiengCa])

  // Gom theo SBD: lượt mới nhất + các lượt cũ; chấm tại máy nếu có ngân hàng.
  const dsEm: HangEm[] = useMemo(() => {
    if (!chiTiet) return []
    const theoSbd = new Map<string, LuotThiRow[]>()
    for (const l of chiTiet.luot) {
      const arr = theoSbd.get(l.sbd) ?? []
      arr.push(l)
      theoSbd.set(l.sbd, arr)
    }
    const out: HangEm[] = []
    theoSbd.forEach((arr, sbd) => {
      arr.sort((a, b) => b.lanThu - a.lanThu)
      const moiNhat = arr[0]
      const hs = classList.find((c) => c.sbd === sbd)
      let graded: GradedSubmission | null = null
      if (teacherBank && moiNhat.dapAn && (moiNhat.trangThai === 'da_nop' || moiNhat.trangThai === 'khoa')) {
        try {
          graded = gradeSubmissionFull(teacherBank, chiTiet.ca.maCa, sbd, moiNhat.dapAn, soCauCa, boTheoEmDung)
        } catch {
          graded = null
        }
      }
      // Ba con số câu lặp, đếm từ ĐÚNG bảng chấm của em, không ước lượng.
      let lap: HangEm['lap'] = null
      // NGUỒN 1 (đủ nhất): bản đồ máy này ghi lúc bấm Bắt đầu — có cả SỐ LẦN
      // em đã sai từng câu. NGUỒN 2: bản đồ máy chủ trả về, chỉ có DANH SÁCH
      // câu lặp. Thầy bấm Bắt đầu ở điện thoại rồi mở ca trên máy tính thì chỉ
      // còn nguồn 2 — vẫn đếm được "sửa được / còn sai", chỉ không có số lần.
      // Số 0 ở đây nghĩa là CHƯA BIẾT, và chỗ hiển thị phải im về số lần chứ
      // không được in "sai lần thứ 1".
      const lapEm: Record<string, number> | undefined =
        deRiengCa?.lapCua?.[sbd] ??
        chiTiet.demSaiTheoEm?.[sbd] ??
        // Bản dựng lại từ máy chủ: có ĐỦ số lần sai, nên nhãn "sai lần thứ N"
        // vẫn đúng trên máy chưa từng mở ca này.
        lapDungLai?.demSai?.[sbd] ??
        (chiTiet.lapTheoEm?.[sbd]?.length ? Object.fromEntries(chiTiet.lapTheoEm[sbd].map((q) => [q, 0])) : undefined)
      if (lapEm && teacherBank && moiNhat.dapAn && graded) {
        try {
          const rows = taoChiTietCau(mergeKeepAnswers(teacherBank, soCauCa, boTheoEmDung), chiTiet.ca.maCa, sbd, moiNhat.dapAn, moiNhat.giayCau)
          const cua = rows.filter((r) => typeof lapEm[r.qid] === 'number')
          lap = {
            tong: cua.length,
            daSua: cua.filter((r) => r.dungSai).length,
            saiLai: cua.filter((r) => r.dungSai === false).length,
            // `soLanSai` = số lần sai TRƯỚC ca này cộng lần này. Cùng một phép
            // tính với nhãn trong báo cáo (`dungCauSai`), không đếm kiểu khác.
            saiLaiChiTiet: cua
              .filter((r) => r.dungSai === false)
              // `soLanSai` = 0 nghĩa là máy này không giữ số lần sai cũ. In số
              // 1 vào đó là bịa: em có thể đã sai câu này ba lần rồi.
              .map((r) => ({
                phan: r.phan,
                soCau: r.soCau,
                qid: r.qid,
                chuyenDe: r.chuyenDe || '',
                soLanSai: (lapEm[r.qid] ?? 0) > 0 ? (lapEm[r.qid] ?? 0) + 1 : 0,
                dapAnDung: r.dapAnDung || '',
                dapAnChon: r.dapAnChon || '',
              })),
            daSuaChiTiet: cua.filter((r) => r.dungSai).map((r) => ({ phan: r.phan, soCau: r.soCau, qid: r.qid, chuyenDe: r.chuyenDe || '' })),
          }
        } catch {
          lap = null
        }
      }
      // KIỂM CHỨNG CÂU ĐÃ ĐÚNG: câu nào trong đề là câu em đã làm đúng trước đây (bản đồ máy chủ `daDung`), nay đúng hay sai.
      let daDung: HangEm['daDung'] = null
      const nhanEm = chiTiet.daDungTheoEm?.[sbd]
      if (nhanEm && Object.keys(nhanEm).length > 0 && teacherBank && moiNhat.dapAn && graded) {
        try {
          const rows = taoChiTietCau(mergeKeepAnswers(teacherBank, soCauCa, boTheoEmDung), chiTiet.ca.maCa, sbd, moiNhat.dapAn, moiNhat.giayCau)
          const cua = rows.filter((r) => r.qid in nhanEm)
          const demEm = chiTiet.demDaDungTheoEm?.[sbd] ?? {}
          daDung = {
            sbd,
            hoTen: hs?.hoTen ?? moiNhat.hoTen ?? '',
            tong: cua.length,
            sai: cua
              .filter((r) => r.dungSai !== true)
              .map((r) => ({ soCau: r.soCau, phan: r.phan, qid: r.qid, nhan: nhanEm[r.qid] ?? '', soLanDung: demEm[r.qid]?.[0], soLanSai: demEm[r.qid]?.[1] })),
          }
        } catch {
          daDung = null
        }
      }
      out.push({
        sbd,
        hoTen: hs?.hoTen ?? moiNhat.hoTen ?? '',
        lop: hs?.lop ?? '',
        sdt: hs?.sdt ?? '',
        moiNhat,
        cacLuotCu: arr.slice(1),
        graded,
        diem: graded ? graded.score.total : moiNhat.tong,
        lap,
        daDung,
      })
    })
    // Đã nộp/khoá lên trước theo giờ nộp mới nhất, rồi đang làm, rồi chờ thi lại.
    const thuTu = (l: LuotThiRow) => (l.trangThai === 'dang_lam' ? 1 : l.trangThai === 'duoc_duyet_lai' ? 2 : 0)
    out.sort((a, b) => thuTu(a.moiNhat) - thuTu(b.moiNhat) || (a.hoTen || a.sbd).localeCompare(b.hoTen || b.sbd, 'vi'))
    return out
  }, [chiTiet, teacherBank, soCauCa, classList, deRiengCa, lapDungLai])

  // BÁO CÁO CẢ LỚP (Xem điểm bản 2 · GV-1): chỉ GOM số đã có ở máy này — không chấm lại, không gọi mạng.
  // TÍNH LƯỜI: màn tự làm mới suốt giờ kiểm tra, nên dòng gập chỉ dùng phần RẺ (`tomTatLop`: đếm bài nộp + điểm trung bình);
  // phần nặng (bảng chấm từng câu của MỌI em) chỉ chạy khi thầy mở khối / ca đã đóng, và nhớ theo `khoaBaoCaoLop`.
  const tomTatLop = useMemo(() => tomTatCaLop(dsEm.map((e) => ({ trangThai: e.moiNhat.trangThai, diem: e.diem }))), [dsEm])
  // (đổi ca ⇒ khối dựng lại nhờ `key` ở chỗ vẽ, nên khoá không cần mã ca)
  const khoaBaoCaoLop = [
    tomTatLop.nop,
    Math.round(dsEm.reduce((t, e) => t + (e.diem ?? 0), 0) * 100),
    dsEm.reduce((t, e) => t + e.moiNhat.soLanRoiMan, 0),
    teacherBank ? teacherBank.length : -1,
    soCauCa ? soCauCa.I + soCauCa.II + soCauCa.III : 0,
  ].join('|')
  const dungNganHangBaoCao = () => {
    try {
      return teacherBank ? mergeKeepAnswers(teacherBank, soCauCa, boTheoEmDung) : null
    } catch {
      return null
    }
  }
  const dungEmChoBaoCao = (bank: ReturnType<typeof dungNganHangBaoCao>): EmChoBaoCao[] =>
    dsEm.map((e) => {
      let rows: ChiTietCauRow[] | null = null
      if (bank && chiTiet && e.graded && e.moiNhat.dapAn) {
        try {
          rows = taoChiTietCau(bank, chiTiet.ca.maCa, e.sbd, e.moiNhat.dapAn, e.moiNhat.giayCau)
        } catch {
          rows = null
        }
      }
      return { sbd: e.sbd, hoTen: e.hoTen, lop: e.lop, trangThai: e.moiNhat.trangThai, diem: e.diem, score: e.graded?.score ?? null, vaoLuc: e.moiNhat.vaoLuc, nopLuc: e.moiNhat.nopLuc, soLanRoiMan: e.moiNhat.soLanRoiMan, tongGiayRoiMan: e.moiNhat.tongGiayRoiMan, rows }
    })
  const tinhBaoCaoLop = () => tinhBaoCaoCaLop(dungEmChoBaoCao(dungNganHangBaoCao()), dsEm.length)
  // BÁO CÁO MỘT EM (GV-2): chỉ dựng khi thầy MỞ trang của một em (sbdHoSo), nhớ theo cùng khoá — không chạy khi màn chỉ làm mới.
  // eslint-disable-next-line react-hooks/exhaustive-deps -- khoá `khoaBaoCaoLop` quyết định lúc nào tính lại
  const baoCaoMotEm = useMemo(() => {
    if (!sbdHoSo || !chiTiet) return null
    const bank = dungNganHangBaoCao()
    const lop = dungEmChoBaoCao(bank)
    const em = lop.find((e) => e.sbd === sbdHoSo)
    return em ? tinhBaoCaoMotEm(em, lop, nguonCauTuNganHang(bank)) : null
  }, [sbdHoSo, khoaBaoCaoLop])
  // Máy thầy KHÔNG có bảng chấm của em (chưa có đáp án của ca) ⇒ hỏi máy chủ `/gv/bao-cao-ca-em` (có kho câu) để điền các khối còn trống (dạng, câu cần xem lại). Có bảng chấm ⇒ không hỏi.
  // Không có lệnh / lỗi ⇒ giữ nguyên số ở máy.
  const [baoCaoEmMay, setBaoCaoEmMay] = useState<{ khoa: string; may: BaoCaoEmMayChu } | null>(null)
  const khoaEmMay = chiTiet && sbdHoSo ? `${chiTiet.ca.maCa}|${sbdHoSo}` : ''
  const canHoiMayChu = !!baoCaoMotEm && !baoCaoMotEm.coBangCham && baoCaoMotEm.daNop
  useEffect(() => {
    if (!khoaEmMay || !canHoiMayChu || !chiTiet) return
    let huy = false
    void layBaoCaoEmMayChu(chiTiet.ca.maCa, sbdHoSo).then((may) => {
      if (!huy && may) setBaoCaoEmMay({ khoa: khoaEmMay, may })
    })
    return () => {
      huy = true
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps -- chỉ đổi em / ca / việc "cần hỏi" mới hỏi lại
  }, [khoaEmMay, canHoiMayChu])
  const baoCaoMotEmHienThi = useMemo(
    () => (baoCaoMotEm && baoCaoEmMay && baoCaoEmMay.khoa === khoaEmMay && !baoCaoMotEm.coBangCham ? ghepBaoCaoMotEm(baoCaoMotEm, baoCaoEmMay.may) : baoCaoMotEm),
    [baoCaoMotEm, baoCaoEmMay, khoaEmMay],
  )

  // BÁO CÁO CA TỪ MÁY CHỦ (ca thi 28/09): MỘT lần gọi `/gv/bao-cao-ca` cho màn Kết thúc ca + Báo cáo chi tiết (hocSinh, maTran, tbCaTruoc…). Chỉ hỏi khi ca đã đóng
  // hoặc thầy mở báo cáo; nhớ theo `khoaBaoCaoLop` (đổi số liệu mới hỏi lại). Máy chủ không trả ⇒ số tính ở máy (`tinhBaoCaoLop`).
  const [moBaoCao, setMoBaoCao] = useState<'lop' | 'em' | null>(null)
  const [bcMay, setBcMay] = useState<{ khoa: string; lop: BaoCaoCaLop | null; them: ThemBaoCaoCa | null; loi: string } | null>(null)
  const [dangTaiBc, setDangTaiBc] = useState(false)
  const [dangCongBo, setDangCongBo] = useState(false)
  const caDaDong = !!chiTiet && chiTiet.ca.trangThai !== 'mo'
  const canBaoCao = !!chiTiet && (caDaDong || moBaoCao !== null || !!sbdHoSo)
  const khoaBcMay = chiTiet ? `${chiTiet.ca.maCa}|${chiTiet.ca.congBo}|${khoaBaoCaoLop}` : ''
  useEffect(() => {
    if (!canBaoCao || !chiTiet || bcMay?.khoa === khoaBcMay) return
    let huy = false
    setDangTaiBc(true)
    void layBaoCaoCaDayDu(chiTiet.ca.maCa, dsEm.map((e) => ({ sbd: e.sbd, hoTen: e.hoTen, lop: e.lop, soLanRoiMan: e.moiNhat.soLanRoiMan, tongGiayRoiMan: e.moiNhat.tongGiayRoiMan })))
      .then((r) => {
        if (huy) return
        let lop = r.lop
        if (!lop) {
          try {
            lop = tinhBaoCaoLop()
          } catch {
            lop = null
          }
        }
        setBcMay({ khoa: khoaBcMay, lop, them: r.them, loi: r.loi })
      })
      .finally(() => {
        if (!huy) setDangTaiBc(false)
      })
    return () => {
      huy = true
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps -- khoá quyết định lúc hỏi lại
  }, [canBaoCao, khoaBcMay])
  const congBoNgay = async () => {
    if (!chiTiet) return
    setDangCongBo(true)
    const loiCb = await congBoDiemCa(chiTiet.ca.maCa)
    setDangCongBo(false)
    if (loiCb) showToast(`Chưa công bố được: ${loiCb}`, 'error')
    else {
      showToast('Đã công bố điểm — em và phụ huynh thấy ngay', 'success')
      await tai(chiTiet.ca.maCa, true)
    }
  }

  // VÁ NGƯỢC KHOÁ `key/<maCa>.json` CHO CA CŨ — TỰ LÀNH KHI THẦY MỞ MÀN.
  //
  // Trước 12/09, ngân hàng CÓ đáp án chỉ được đẩy lên máy chủ khi ca công bố
  // NGAY. Ca 195422 sáng 12/09 đặt `ca_lop_xong`, nên máy chủ không có khoá ấy
  // và LINK XEM ĐIỂM của cả ca báo "Máy chủ chưa gửi đề của ca này".
  //
  // 15/09: việc này TỪNG nằm trong `handleTaiPhieuHangLoat` của thẻ "Xuất kết
  // quả". Thầy chốt gỡ thẻ ấy, nên nó phải dọn ra đây — nó KHÔNG dính gì tới
  // việc xuất phiếu, chỉ tình cờ ở nhờ trong đó. Gỡ mà không dọn là ca cũ mất
  // đường tự lành trong im lặng.
  //
  // Chạy MỘT LẦN mỗi ca: `daVaKeyRef` chặn lặp mỗi lần màn vẽ lại. Lệnh
  // `capNhatKeyBank` chỉ ghi MỘT đối tượng R2, không đụng dòng ca. Hỏng thì im
  // lặng — đây là việc vá nền, không được chặn màn của thầy.
  useEffect(() => {
    if (!chiTiet || !teacherBank || teacherBank.length === 0) return
    const ma = chiTiet.ca.maCa
    if (daVaKeyRef.current.has(ma)) return
    daVaKeyRef.current.add(ma)
    const keyBank = mergeKeepAnswers(teacherBank, soCauCa, boTheoEmDung)
    void capNhatKeyBank(scriptUrl, secret, chiTiet.ca.maCa, keyBank).catch(() => {})
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [chiTiet, teacherBank, soCauCa])

  // Tự ghi điểm + chi tiết từng câu (mục 5) cho lượt vừa chấm được mà chưa ghi.
  useEffect(() => {
    if (!chiTiet || !teacherBank) return
    const bank = mergeKeepAnswers(teacherBank, soCauCa, boTheoEmDung)
    const can = dsEm.filter((e) => e.graded && !daGhiRef.current.has(`${e.sbd}:${e.moiNhat.lanThu}:${e.moiNhat.nopLuc}`))
    if (can.length === 0) return
    const bai = can.map((e) => taoBaiGhiDiem(bank, chiTiet.ca.maCa, e.sbd, e.moiNhat.lanThu, e.moiNhat.dapAn!, e.graded!, e.moiNhat.giayCau))
    let huy = false
    // MẪU SỐ đã dùng để chấm — lấy từ CHÍNH bank vừa gộp, không lấy `soCauCa`
    // thô, để con số khai lên máy chủ đúng bằng con số đã chia. Xem `ghiDiem`.
    ghiDiem(scriptUrl.trim(), secret.trim(), chiTiet.ca.maCa, bai, {
      I: bank.phanI.length,
      II: bank.phanII.length,
      III: bank.phanIII.length,
    })
      .then((kq) => {
        if (huy) return
        for (const e of can) if (kq.daGhi.includes(e.sbd)) daGhiRef.current.add(`${e.sbd}:${e.moiNhat.lanThu}:${e.moiNhat.nopLuc}`)
        if (kq.tuChoi.length > 0) showToast(`Không ghi được điểm ${kq.tuChoi.length} em lên Sheet`, 'error')
        // GHI ĐÈ ĐIỂM CŨ THÌ PHẢI NÓI RA. Màn này chấm lại tại chỗ rồi ghi
        // đè con số trên Sheet — con số mà màn Học sinh, bảng điểm, bản xuất
        // Excel và phiếu gửi phụ huynh đều đọc. Đổi mà im lặng thì thầy thấy
        // hai điểm khác nhau ở hai màn và không biết vì sao (đúng việc thầy
        // báo 08/09). Xem lech-diem.ts.
        const lech = emLechDiem(
          can
            .filter((e) => kq.daGhi.includes(e.sbd))
            .map((e) => ({ sbd: e.sbd, hoTen: e.hoTen, tongSheet: e.moiNhat.tong, tongChamLai: e.graded!.score.total })),
        )
        if (lech.length > 0) showToast(loiBaoLechDiem(lech), 'warn')
      })
      .catch(() => {
        // mất mạng — lần tải sau ghi lại
      })
    return () => {
      huy = true
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [dsEm])

  // Ca đang mở và còn em đang làm → tự tải lại mỗi 20 giây (theo dõi gần thời gian thực). Nhịp THEO LUẬT app thầy (src/lib/nhip-may-thay.ts): tab ẩn thì dừng, không gọi chồng (trước đây
  // `setInterval` trần: một lượt chậm 20 s dồn thêm lượt, lỗi cũng cứ 20 s một lần), lỗi ⇒ lùi dần 30 → 60 → 120 s. Vòng chạy MỘT mạch (không dựng lại mỗi lần chiTiet đổi).
  const conDangLam = !!chiTiet && chiTiet.luot.some((l) => l.trangThai === 'dang_lam')
  const maCaTheoDoiNen = chiTiet?.ca.maCa
  useNhipThay(() => (maCaTheoDoiNen ? tai(maCaTheoDoiNen, true) : true), BANG_NHIP_THAY.theoDoiCa, conDangLam, TUY_CHON_NHIP_THAY.theoDoiCa)
  // PHÒNG CHỜ (thầy 28/09: "tự đồng bộ hs vào phòng chờ sau 5 giây"): ca chưa bấm Bắt đầu thi ⇒ tải lại chi tiết ca 5 s/lần QUA NHỊP CHUNG (tab ẩn dừng,
  // không chồng, lỗi lùi 30 → 40 s, hụt liền ⇒ DongMatKetNoiCa + chấm "mất kết nối" ở khối). Màn Chiếu mã đang mở thì nó tự hỏi 5 s ⇒ vòng này nghỉ, không gọi trùng.
  // (Chưa bấm Bắt đầu thì chưa em nào đang làm ⇒ vòng 20 s ở trên không chạy cùng lúc.)
  const dangPhongCho = !!chiTiet?.ca.phongCho && !chiTiet?.ca.batDauThiLuc
  useNhipThay(() => (maCaTheoDoiNen ? tai(maCaTheoDoiNen, true) : true), NHIP_PHONG_CHO_THAY, dangPhongCho && !chieuMa, TUY_CHON_NHIP_THAY.phongCho)

  // NHỊP SỐNG — THỜI GIAN THỰC (thầy 29/09: "phần trên cho đồng bộ trực tiếp thời gian thực luôn"). Ca ĐANG MỞ đã bấm Bắt đầu (hoặc không phòng chờ) ⇒ hỏi lệnh NHẸ
  // `/ca/nhip` 3 s/lần (tab ẩn dừng, không chồng, lỗi lùi 10 → 20 s): tiến độ từng em đổi từ mốc `sau` phủ ngay lên thẻ em; dấu vết đổi (em vào / nộp / bị khoá,
  // thêm phút, đóng cửa) ⇒ tải lại cả ca, cách lần tải đầy trước ≥ 4 s. Vòng 20 s ở trên vẫn chạy làm lưới an toàn. Chi tiết + ước tải: src/lib/nhip-song-ca.ts.
  const [tienDoSong, setTienDoSong] = useState<Record<string, TienDoSong>>({})
  const [songOn, setSongOn] = useState(false)
  const nhipRef = useRef<{ maCa: string; moc: string; dauVet: string | null; taiDayLuc: number }>({ maCa: '', moc: '', dauVet: null, taiDayLuc: 0 })
  const caDangChay = !!chiTiet && chiTiet.ca.trangThai === 'mo' && !dangPhongCho
  useEffect(() => {
    // Đổi ca ⇒ quên tiến độ sống của ca cũ.
    nhipRef.current = { maCa: maCaTheoDoiNen ?? '', moc: '', dauVet: null, taiDayLuc: Date.now() }
    setMoGiao(false) // công tắc Giao chiến dịch: mỗi lần mở ca đều TẮT (thầy 29/09)
    setTienDoSong({})
    setSongOn(false)
  }, [maCaTheoDoiNen])
  useNhipThay(
    async () => {
      const ma = maCaTheoDoiNen
      if (!ma) return true
      const mat = (secret || (await loadTeacherSecret())).trim()
      const n = nhipRef.current
      const kq = await goiNhipCa(mat, ma, n.maCa === ma ? n.moc : '')
      if (!kq) {
        setSongOn(false)
        return false
      }
      if (kq.gioMayChu) dongBoGioMayChu(kq.gioMayChu)
      if (nhipRef.current.maCa !== ma || !kq.coCa) return true
      setSongOn(true)
      if (kq.tt.length) setTienDoSong((c) => gopTienDoSong(c, kq.tt))
      nhipRef.current.moc = kq.moc
      if (nhipRef.current.dauVet === null) {
        nhipRef.current.dauVet = kq.dauVet
      } else if (kq.dauVet !== nhipRef.current.dauVet && Date.now() - nhipRef.current.taiDayLuc >= CACH_TAI_DAY_MS) {
        nhipRef.current.dauVet = kq.dauVet
        nhipRef.current.taiDayLuc = Date.now()
        await tai(ma, true)
      }
      return true
    },
    NHIP_SONG_CA_MS,
    caDangChay && !chieuMa,
    TUY_CHON_NHIP_THAY.songCa,
  )

  const handleChoThiLai = async (sbd: string) => {
    if (!chiTiet) return
    setXacNhanSbd(null)
    setDangDuyet(sbd)
    try {
      // CHO THI LẠI nay là ba việc trong một (thầy chốt 08/09): xoá lịch sử
      // lượt cũ, khoá đúng máy em đã thi, và rút ĐỀ MỚI.
      const kq = await choEmThiLai(scriptUrl.trim(), secret.trim(), chiTiet.ca.maCa, sbd)
      const phan = [`xoá ${kq.soLuotXoa} lượt cũ`, kq.daDoiDe ? `đề mới ${kq.soCauKhac}/${kq.soCauMoi} câu khác đề cũ` : 'GIỮ ĐỀ CŨ']
      phan.push(kq.khoaMay ? 'chỉ vào được ở máy cũ (máy cũ hỏng thì bấm "Cho vào bằng máy khác")' : 'lượt cũ không ghi máy nên KHÔNG khoá được máy')
      showToast(`Đã cho thi lại: ${phan.join(' · ')}.`, kq.daDoiDe && kq.khoaMay ? 'success' : 'warn')
      await tai(chiTiet.ca.maCa, true)
    } catch (e) {
      showToast(`Không duyệt được: ${e instanceof Error ? e.message : 'lỗi không rõ'}`, 'error')
    } finally {
      setDangDuyet(null)
    }
  }

  // Mở khoá (mục 6): lượt về dang_lam, em mở lại link trên cùng máy là làm tiếp.
  const [xacNhanMoKhoa, setXacNhanMoKhoa] = useState<string | null>(null)
  const handleMoKhoa = async (sbd: string) => {
    if (!chiTiet) return
    setXacNhanMoKhoa(null)
    setDangDuyet(sbd)
    try {
      await moKhoa(scriptUrl.trim(), secret.trim(), chiTiet.ca.maCa, sbd)
      showToast('Đã mở khoá — em mở lại link trên đúng máy đang làm để tiếp tục', 'success')
      await tai(chiTiet.ca.maCa, true)
    } catch (e) {
      showToast(`Không mở khoá được: ${e instanceof Error ? e.message : 'lỗi không rõ'}`, 'error')
    } finally {
      setDangDuyet(null)
    }
  }

  // CHO VÀO BẰNG MÁY KHÁC: sau "Cho thi lại" em chỉ vào được ĐÚNG MÁY CŨ; máy cũ hỏng / mất thì thầy gỡ khoá máy. Cùng lệnh `moKhoa` của
  // máy chủ (lượt vẫn chờ thi lại, chỉ xoá id máy — đề mới giữ nguyên). Máy chủ báo `goKhoaMay`: nói ĐÚNG kết quả, không mặc định là đã gỡ.
  const [xacNhanMayKhac, setXacNhanMayKhac] = useState<string | null>(null)
  const handleChoVaoMayKhac = async (sbd: string) => {
    if (!chiTiet) return
    setXacNhanMayKhac(null)
    setDangDuyet(sbd)
    try {
      const kq = await moKhoa(scriptUrl.trim(), secret.trim(), chiTiet.ca.maCa, sbd)
      if (kq.goKhoaMay === true) showToast('Đã gỡ khoá máy: em đăng nhập lại bằng MÁY KHÁC là vào được (đề mới giữ nguyên)', 'success')
      else if (kq.goKhoaMay === false) showToast('Lượt này không còn khoá máy (đã gỡ trước đó, hoặc lượt cũ không ghi máy) — em vào được ở máy nào cũng được', 'warn')
      else showToast('Đã gửi lệnh nhưng máy chủ chưa báo có gỡ khoá máy hay không — nhờ em thử vào bằng máy khác, không được thì báo thầy', 'warn')
      await tai(chiTiet.ca.maCa, true)
    } catch (e) {
      showToast(`Không gỡ được khoá máy: ${e instanceof Error ? e.message : 'lỗi không rõ'}`, 'error')
    } finally {
      setDangDuyet(null)
    }
  }

  const handleXoa = async () => {
    if (!chiTiet) return
    setDangXoa(true)
    try {
      await xoaCa(scriptUrl.trim(), secret.trim(), chiTiet.ca.maCa, maXoa.trim())
      showToast(`Đã xoá ca ${chiTiet.ca.maCa}`, 'success')
      setHoiXoa(false)
      setScreen('lichsuca')
    } catch (e) {
      showToast(`Không xoá được: ${e instanceof Error ? e.message : 'lỗi không rõ'}`, 'error')
    } finally {
      setDangXoa(false)
    }
  }

  const moBaoPhuHuynh = (sbd: string, hoTen: string, l: LuotThiRow) => {
    setTinBao({
      sbd,
      noiDung: soanTinRoiMan({
        hoTen: hoTen || `SBD ${sbd}`,
        maCa: chiTiet?.ca.maCa ?? '',
        tenCa: chiTiet?.ca.tenCa || '',
        ngay: l.nopLuc || l.vaoLuc || new Date().toISOString(),
        soLan: l.soLanRoiMan || 0,
        tongGiay: l.tongGiayRoiMan || 0,
        daKhoa: l.trangThai === 'khoa',
      }),
    })
  }

  const guiBaoPhuHuynh = async () => {
    if (!tinBao || !tinBao.noiDung.trim()) return
    setDangGuiBao(true)
    try {
      await sendTeacherMessage(scriptUrl.trim(), secret.trim(), tinBao.sbd, tinBao.noiDung.trim())
      showToast('Đã gửi vào hộp thư của em — phụ huynh thấy khi mở app', 'success')
      setTinBao(null)
    } catch (e) {
      showToast(`Không gửi được: ${e instanceof Error ? e.message : 'lỗi không rõ'}`, 'error')
    } finally {
      setDangGuiBao(false)
    }
  }

  const copyLink = () => {
    if (!chiTiet) return
    const link = `${location.origin}${import.meta.env.BASE_URL}t/${chiTiet.ca.maCa}`
    navigator.clipboard.writeText(link).then(() => {
      setDaCopy(true)
      showToast('Đã copy link mời vào thi', 'success')
    })
  }

  // ĐỔI TÊN CA. Ghi xong thì lấy tên MÁY CHỦ TRẢ VỀ mà hiển thị, không lấy
  // chuỗi vừa gõ: máy chủ mới là chỗ chuẩn hoá cuối cùng (cắt 80 ký tự, cắt
  // `=` `+` `@` đầu chuỗi), nên hai bên chỉ chắc chắn khớp khi màn hình đọc lại
  // của máy chủ.
  const luuTenCa = async () => {
    if (!chiTiet || tenNhap === null) return
    const moi = chuanTenCa(tenNhap)
    if (moi === chuanTenCa(chiTiet.ca.tenCa)) {
      setTenNhap(null)
      return
    }
    setDangDoiTen(true)
    try {
      const kq = await doiTenCa(scriptUrl.trim(), secret.trim(), chiTiet.ca.maCa, moi)
      setChiTiet((c) => (c ? { ...c, ca: { ...c.ca, tenCa: kq.tenCa } } : c))
      setTenNhap(null)
      showToast(kq.tenCa ? `Đã đổi tên ca thành "${kq.tenCa}"` : 'Đã xoá tên ca, ca gọi theo mã', 'success')
    } catch (e) {
      showToast(`Không đổi được tên: ${e instanceof Error ? e.message : 'lỗi không rõ'}`, 'error')
    } finally {
      setDangDoiTen(false)
    }
  }

  // LINK XEM ĐIỂM (thầy báo 07/09). Link mời vào thi `/t/…` sau khi nộp là
  // đường cụt trên máy khác; link này em nhập lại danh tính rồi vào thẳng phiếu.
  const copyLinkDiem = () => {
    if (!chiTiet) return
    const link = `${location.origin}${import.meta.env.BASE_URL}d/${chiTiet.ca.maCa}`
    navigator.clipboard.writeText(link).then(() => {
      setDaCopyDiem(true)
      showToast('Đã copy link xem điểm', 'success')
    })
  }

  /** Em trong ca đang KHÔNG có họ tên. Phiếu của những em này in "SBD 10038"
   * thay vì tên con, phụ huynh mở link ra không biết là phiếu của ai. */
  const emThieuTen = useMemo(() => dsEm.filter((e) => !e.hoTen.trim()).map((e) => e.sbd), [dsEm])

  // CÂU HỎI LẠI — thầy chốt 08/09: "kết thúc mỗi ca thi thì trong mục ca thi
  // phải có nút báo rõ những học sinh nào vẫn sai tiếp các câu đã rút, liệt kê
  // chi tiết". Gom sẵn ở đây để cả nút lẫn bảng đọc cùng một nguồn.
  const [moSaiLai, setMoSaiLai] = useState(false)
  /** Ca này có phải ca đề riêng không — hỏi CẢ HAI nguồn.
   *
   * `caCanDeRieng` là cờ máy này ghi lúc mở ca; `deRiengCa` là bản đồ máy này
   * ghi lúc bấm Bắt đầu. Thầy mở ca ở điện thoại rồi xem trên máy tính thì máy
   * tính không có cờ, nhưng `chiTiet.ca` vẫn nói ca có bộ câu riêng. */
  const laCaDeRieng =
    caCanDeRieng ||
    Boolean(deRiengCa) ||
    Object.keys(chiTiet?.lapTheoEm ?? {}).length > 0 ||
    Object.keys(lapDungLai?.lapTheoEm ?? {}).length > 0 ||
    (chiTiet?.ca as { deRieng?: boolean } | undefined)?.deRieng === true
  // Biên bản: bản ở máy này trước (đầy đủ nhất), rồi tới bản máy chủ đã cất
  // lúc bấm Bắt đầu — nhờ nó mà máy thứ hai vẫn đọc được.
  const bienBanGoc = deRiengCa?.bienBan ?? (chiTiet?.bienBanDeRieng as BienBanDeRieng | undefined) ?? null
  // BIÊN BẢN CŨ NÓI SAI THÌ VÁ LÚC ĐỌC. Bản cất trước 08/09 không có `phamVi`,
  // `tuCaCua` và chưa biết lý do `het_cho`, nên màn này in "lấy từ ca —" và dán
  // nhãn "ngoài kho" cho em thật ra chỉ hết chỗ trong đề (thầy hỏi đúng chỗ đó).
  // Không sửa bản đã cất — đó là bằng chứng của lượt rút. Xem va-bien-ban-cu.ts.
  const bienBanLap = useMemo(() => {
    if (!bienBanGoc) return null
    const kho = teacherBank
      ? new Set(teacherBank.flatMap((t) => [...t.phanI, ...t.phanII, ...t.phanIII].map((q) => q.id)))
      : null
    return vaBienBanCu(bienBanGoc, {
      phamViCa: (chiTiet?.ca as { phamViHoiLai?: 'gan_nhat' | 'ba_ca' | 'khong' } | undefined)?.phamViHoiLai ?? null,
      lapTheoEm: deRiengCa?.lapTheoEm ?? chiTiet?.lapTheoEm ?? lapDungLai?.lapTheoEm ?? null,
      qidTrongKho: kho,
    })
  }, [bienBanGoc, teacherBank, chiTiet, deRiengCa, lapDungLai])
  // KIỂM CHỨNG CÂU ĐÃ ĐÚNG: em sai nhiều câu đã làm đúng nhất lên đầu (thầy: "hiển thị lên trên trước cho tôi biết").
  const laCaDaDungNay = laCaDaDung((chiTiet?.ca as { phamViHoiLai?: unknown } | undefined)?.phamViHoiLai) || Object.keys(chiTiet?.daDungTheoEm ?? {}).length > 0
  const emSaiLaiDaDung = useMemo(() => xepSaiLaiDaDung(dsEm.flatMap((e) => (e.daDung ? [e.daDung] : []))), [dsEm])
  const tongKetLap = useMemo(() => {
    const co = dsEm.filter((e) => e.lap && e.lap.tong > 0)
    return {
      soEmCoLap: co.length,
      tongCauLap: co.reduce((n, e) => n + (e.lap?.tong ?? 0), 0),
      tongDaSua: co.reduce((n, e) => n + (e.lap?.daSua ?? 0), 0),
      tongSaiLai: co.reduce((n, e) => n + (e.lap?.saiLai ?? 0), 0),
      // Xếp em sai nhiều nhất lên đầu: thầy đọc từ trên xuống là gặp ngay em
      // cần gọi lên bảng.
      emSaiLai: co.filter((e) => (e.lap?.saiLai ?? 0) > 0).sort((a, b) => (b.lap?.saiLai ?? 0) - (a.lap?.saiLai ?? 0)),
      emSachTron: co.filter((e) => (e.lap?.saiLai ?? 0) === 0),
    }
  }, [dsEm])

  const dongBoTenChoCa = async () => {
    if (!chiTiet) return
    setDangDongBoTen(true)
    try {
      const kq = await dongBoTenCa(scriptUrl.trim(), secret.trim(), chiTiet.ca.maCa)
      const phan: string[] = []
      if (kq.daDien.length) phan.push(`điền ${kq.daDien.length} tên`)
      if (kq.daSua.length) phan.push(`sửa ${kq.daSua.length} tên lệch`)
      if (kq.khongCo.length) phan.push(`${kq.khongCo.length} SBD không có trong danh sách`)
      showToast(
        phan.length ? `Đã đồng bộ: ${phan.join(' · ')}. Dựng lại phiếu để tên hiện đúng.` : 'Mọi em trong ca đã đúng tên danh sách.',
        kq.khongCo.length ? 'error' : 'success',
      )
      await tai(chiTiet.ca.maCa)
    } catch (e) {
      showToast(`Không đồng bộ được tên: ${e instanceof Error ? e.message : 'lỗi không rõ'}`, 'error')
    } finally {
      setDangDongBoTen(false)
    }
  }

  // ------------------------------------------------ RÚT ĐỀ v2: CHẠY THỬ lúc mở ca (bảng Xem trước phân bổ)
  // Ca đề riêng còn ở phòng chờ ⇒ app rút thử bộ câu cho TỪNG em của lớp (danh sách lớp ∪ em tích ∪ phòng chờ) bằng đúng thang lấp
  // sẽ dùng lúc Bắt đầu. "Kiểm tra điểm yếu" = ca đề riêng mở ở chế độ lên bảng.
  const cheDoRutV2: 'ca' | 'diem_yeu' = chiTiet?.ca.lenBang === true ? 'diem_yeu' : 'ca'
  const pvCa = chiTiet ? docPhamViHoiLai((chiTiet.ca as { phamViHoiLai?: unknown }).phamViHoiLai) : 'gan_nhat'
  const canRutThu = !!chiTiet && caCanDeRieng && !chiTiet.ca.batDauThiLuc && pvCa !== 'khong' && !!teacherBank && !!soCauCa
  const chayRutThu = async () => {
    if (!chiTiet) return
    const maCaNay = chiTiet.ca.maCa
    setDangRutThu(true)
    setLoiRutThu('')
    try {
      const ten: Record<string, string> = {}
      const ds = new Set<string>()
      for (const x of chiTiet.dsCho ?? []) if (x.sbd) { ds.add(x.sbd); ten[x.sbd] = x.hoTen || '' }
      if (Array.isArray(chiTiet.ca.danhSachMoi)) for (const x of chiTiet.ca.danhSachMoi as unknown[]) if (String(x ?? '').trim()) ds.add(String(x).trim())
      const lop = String(chiTiet.ca.lop ?? '').trim()
      if (lop) {
        const dsLop = await danhSachEm(scriptUrl.trim(), secret.trim()).catch(() => [])
        for (const e of dsLop) if (String(e.lop ?? '').trim() === lop && e.sbd) { ds.add(e.sbd); if (!ten[e.sbd]) ten[e.sbd] = e.hoTen || '' }
      }
      setTenEmLop(ten)
      if (ds.size === 0) { setRutThu(null); return }
      if (laCaDaDungNay) setRutThuDaDung(await chayThuRutDeDaDung(scriptUrl.trim(), secret.trim(), maCaNay, [...ds], { tienDo: (xong, tong) => setTienDoThay({ xong, tong }) }))
      else setRutThu(await chayThuRutDeCa(scriptUrl.trim(), secret.trim(), maCaNay, [...ds], { cheDo: cheDoRutV2 }))
    } catch (e) {
      setLoiRutThu(e instanceof Error ? e.message : 'lỗi không rõ')
    } finally {
      setDangRutThu(false)
      setTienDoThay(null)
    }
  }
  useEffect(() => {
    if (!canRutThu || !chiTiet || !scriptUrl.trim() || !secret.trim()) return
    const khoa = `${chiTiet.ca.maCa}|${laCaDaDungNay ? 'da_dung' : cheDoRutV2}`
    if (daRutThuRef.current === khoa) return
    daRutThuRef.current = khoa
    void chayRutThu()
    // Chạy MỘT lần mỗi ca (chiTiet tự làm mới 5 giây — không chạy lại theo nó); thầy bấm "Chạy thử lại" khi muốn.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [canRutThu, chiTiet?.ca.maCa, cheDoRutV2, laCaDaDungNay, scriptUrl, secret])

  const batDauCaNay = async () => {
    if (!chiTiet) return
    setDangBatDau(true)
    try {
      // ĐỀ RIÊNG TỪNG EM — rút ĐÚNG LÚC NÀY, cho ĐÚNG những em đang đứng chờ.
      //
      // Vì sao không rút lúc mở ca: lúc đó chưa biết em nào tới. Bản đầu bó
      // vào phạm vi "tích từng em" và thầy bắt được ngay — mở ca test32 ở chế
      // độ khác thì không có bộ nào, không có gì để báo (thầy chốt 08/09).
      let boTheoEm: Record<string, string[]> | undefined
      let lapTheoEm: Record<string, string[]> | undefined
      // BIÊN BẢN VÀ SỐ LẦN SAI ĐI LÊN MÁY CHỦ luôn. Để lại ở IndexedDB thì chỉ
      // đúng cái máy bấm Bắt đầu mới đọc được — thầy bấm ở điện thoại rồi mở ca
      // trên máy tính là màn hình trống (thầy chốt 08/09: "máy nào cũng được").
      let bienBan: BienBanDeRieng | undefined
      let demSai: Record<string, Record<string, number>> | undefined
      let daLamLaiTheoEm: Record<string, Record<string, string>> | undefined
      let bacTheoEm: Record<string, Record<string, string>> | undefined
      let banDoDaDung: { daDung: Record<string, Record<string, string>>; demDaDung: Record<string, Record<string, [number, number]>> } | undefined
      if (caCanDeRieng) {
        // ĐÚNG NHỮNG EM TRONG PHÒNG CHỜ — không ∪ cả lớp đăng ký (vá 19/09). Bản 17/09
        // gộp thêm mọi em cùng lớp: em vắng cũng chiếm một suất chia vòng tròn, nên
        // kho mỏng bị chia cho 40 em trong khi chỉ 25 em ngồi thi — đỉnh trùng của
        // các em CÓ MẶT cao lên vô cớ, và biên bản đếm "thiếu câu hỏi lại" cho cả em
        // không tới. Em vào sau khi bấm Bắt đầu rơi về bốc theo hash như ca thường.
        const dsCho = (chiTiet.dsCho ?? []).map((x) => x.sbd).filter(Boolean)
        if (dsCho.length === 0) {
          showToast('Chưa em nào vào phòng chờ — chưa rút được đề riêng.', 'error')
          setDangBatDau(false)
          return
        }
        // PHẠM VI thầy chọn lúc mở ca, đọc từ máy chủ nên máy nào bấm Bắt đầu
        // cũng rút đúng thứ thầy đã chốt.
        const pv = docPhamViHoiLai((chiTiet.ca as { phamViHoiLai?: unknown }).phamViHoiLai)
        // RÚT ĐỀ v2 (02/10) — ĐƯỜNG CHÍNH: dùng lại kết quả chạy thử lúc mở ca (bảng Xem trước phân bổ), chỉ rút thêm cho em
        // vào phòng sau; thang lấp: câu sai đến lịch ôn lại → câu song sinh → câu cùng dạng → câu mới (src/lib/rut-de-v2.ts).
        // Máy chủ chưa có lệnh lỗi đến hạn / máy này thiếu kho ⇒ đi đường rút cũ ngay bên dưới, và nói ra.
        // Ca "Không rút câu sai" giữ đường cũ (không có ô ôn lại nào để lấp).
        if (laCaDaDungNay) {
          // KIỂM CHỨNG CÂU ĐÃ ĐÚNG (02/10): dùng lại chạy thử, chốt MỘT lệnh. Hỏng thì KHÔNG đi đường rút cũ (đường cũ lấp câu em chưa đúng
          // — trái yêu cầu "chỉ chọn câu làm đúng"): báo thầy và dừng, chưa bắt đầu ca.
          try {
            const dd = await chotRutDeDaDung(scriptUrl.trim(), secret.trim(), chiTiet.ca.maCa, dsCho)
            boTheoEm = dd.boTheoEm
            lapTheoEm = {}
            demSai = {}
            banDoDaDung = dd.banDoDaDung
            bienBan = dd.bienBan as unknown as BienBanDeRieng
            await luuDeRiengCa(chiTiet.ca.maCa, dd.boTheoEm, {}, {}, bienBan)
            setRutThuDaDung(docRutThuDaDung(chiTiet.ca.maCa) ?? null)
            if (dd.soEmRutThem > 0) showToast(`Đã rút thêm bộ câu cho ${dd.soEmRutThem} em vào phòng sau lượt chạy thử.`, 'success')
            if (dd.soCauNoiThem > 0) showToast(`Đã nối ${dd.soCauNoiThem} câu (câu thay và câu em đã làm đúng nằm ngoài kho ca) vào đề ca này.`, 'success')
            if (dd.soCauThay.thaySo + dd.soCauThay.cungDang > 0) showToast(`Đã thay câu em đã làm đúng: ${dd.soCauThay.thaySo} câu thay số · ${dd.soCauThay.cungDang} câu thay bằng câu cùng dạng${dd.soCauThay.giuNguyen > 0 ? ` · ${dd.soCauThay.giuNguyen} câu giữ nguyên văn` : ''}.`, 'success')
            for (const c of dd.canhBao) showToast(c, 'warn')
          } catch (e) {
            showToast(`Chưa rút được đề "Kiểm chứng câu đã đúng" (${e instanceof Error ? e.message : 'lỗi không rõ'}) — ca chưa bắt đầu, thầy bấm lại.`, 'error')
            setDangBatDau(false)
            return
          }
        } else if (pv !== 'khong') {
          try {
            const v2 = await chotRutDeCa(scriptUrl.trim(), secret.trim(), chiTiet.ca.maCa, dsCho, { cheDo: cheDoRutV2, phamVi: pv })
            boTheoEm = v2.boTheoEm
            lapTheoEm = v2.lapTheoEm
            bacTheoEm = v2.bacTheoEm
            bienBan = v2.bienBan as unknown as BienBanDeRieng
            demSai = {}
            await luuDeRiengCa(chiTiet.ca.maCa, v2.boTheoEm, {}, v2.lapTheoEm, bienBan)
            setRutThu(docRutThu(chiTiet.ca.maCa) ?? null)
            if (v2.soEmCapNhat > 0) showToast(`Đã cập nhật đề của ${v2.soEmCapNhat} em theo bài các em vừa làm.`, 'success')
            if (v2.soEmRutThem > 0) showToast(`Đã rút thêm bộ câu cho ${v2.soEmRutThem} em vào phòng sau lượt chạy thử.`, 'success')
            if (v2.soCauNoiThem > 0) showToast(`Đã nối ${v2.soCauNoiThem} câu ngoài kho (câu sai cũ, câu song sinh) vào đề ca này.`, 'success')
            for (const c of v2.canhBao) showToast(c, 'warn')
          } catch (e) {
            showToast(`Chưa rút được theo cách mới (${e instanceof Error ? e.message : 'lỗi không rõ'}) — app rút theo cách cũ.`, 'warn')
          }
        }
        if (!boTheoEm) {
          // LƯỢT HAI (19/09): em CÙNG LỚP chưa kịp vào phòng chờ vẫn được chuẩn bị đề
          // riêng, nhưng tính SAU khi mọi em trong `dsCho` đã chốt — không chiếm suất
          // chia của ai, không vào con số nào của biên bản. Ca không ghi lớp thì thôi.
          const ra = await dungDeRiengChoCa(scriptUrl.trim(), secret.trim(), chiTiet.ca.maCa, dsCho, { ...CAU_HINH_DE_RIENG_MAC_DINH, PHAM_VI_HOI_LAI: pv }, { lopCa: chiTiet.ca.lop })
          boTheoEm = ra.boTheoEm
          lapTheoEm = ra.lapTheoEm
          // BIÊN BẢN cất cùng bản đồ. Toast biến mất sau ba giây; câu hỏi "vì sao
          // em này không có câu hỏi lại" thì còn nguyên cả buổi.
          bienBan = {
            canCua: ra.canCua,
            soLapCua: ra.soLapCua,
            saiCaTruocCua: ra.saiCaTruocCua,
            tuCaCua: ra.tuCaCua,
            phamVi: pv,
            thieu: ra.thieu,
            boQua: ra.boQua,
            caDaQuet: ra.caDaQuet,
            namQuet: ra.namQuet,
            cauGocTheoEm: ra.cauGocTheoEm,
            songSinhTheoEm: ra.songSinhTheoEm,
            ghiChu: ra.ghiChu,
            ...(Object.keys(ra.daLamLaiTheoEm).length > 0 ? { daLamLaiTheoEm: ra.daLamLaiTheoEm } : {}),
            lucRut: new Date().toISOString(),
          }
          daLamLaiTheoEm = ra.daLamLaiTheoEm
          demSai = ra.lapCua
          await luuDeRiengCa(chiTiet.ca.maCa, ra.boTheoEm, ra.lapCua, ra.lapTheoEm, bienBan)
          const tongSongSinh = Object.values(ra.songSinhTheoEm ?? {}).reduce((s, a) => s + (a?.length ?? 0), 0)
          if (tongSongSinh > 0) showToast(`Đã sinh ${tongSongSinh} câu song sinh cùng dạng đổi số chống học vẹt.`, 'success')
          if (ra.cauNoiThem.soCau > 0) showToast(`Đã kéo ${ra.cauNoiThem.soCau} câu em từng sai từ kho vào đề ca này.`, 'success')
          if (ra.thieu.length > 0) showToast(`${ra.thieu.length} em không đủ câu hỏi lại — xem chi tiết trong ca.`, 'warn')
        }
      }
      // CHẶN TRẦN TRÙNG CÂU — DE-RIENG-CHAN-TRAN-TRUNG.md.
      //
      // Ca thường (không phải ca chẩn đoán) mà có phòng chờ thì ĐÚNG LÚC NÀY là
      // chỗ duy nhất biết chính xác em nào đang ngồi trong phòng. Bốc độc lập
      // theo `hash(maCa:sbd)` luôn để lọt một cặp xui xẻo trùng 3–7 lần trung
      // bình (đo được: kho 600 câu vẫn còn cặp chung 3–4 câu). Điều phối cả lớp
      // một lượt thì chặn được cái đuôi đó, và kho đủ lớn thì trùng bằng 0.
      //
      // Không đụng ca chẩn đoán: ca đó đã có bản đồ riêng theo hồ sơ từng em.
      // Em vào sau khi bấm Bắt đầu không có tên trong bản đồ ⇒ rơi về bốc độc
      // lập như cũ, vẫn thi được, chỉ là không được bảo đảm trần trùng.
      let bcTranTrung: string[] = []
      if (!caCanDeRieng && !boTheoEm) {
        const dsCho = (chiTiet.dsCho ?? []).map((x) => x.sbd).filter(Boolean)
        const kho = teacherBank ?? []
        const sc = soCauCa
        if (dsCho.length >= 2 && kho.length > 0 && sc && sc.I + sc.II + sc.III > 0) {
          try {
            const ra = sinhBoTheoEm(kho, dsCho, sc, chiTiet.ca.maCa)
            if (Object.keys(ra.boTheoEm).length > 0) {
              boTheoEm = ra.boTheoEm
              bcTranTrung = [
                ra.dinhTrung === 0
                  ? `Đề riêng từng em: KHÔNG cặp nào trùng câu nào (${dsCho.length} em, chia theo ${TEN_MUC_PHAN_TANG[ra.mucPhanTang]}).`
                  : `Đề riêng từng em: cặp trùng nhiều nhất ${ra.dinhTrung} câu (${dsCho.length} em, chia theo ${TEN_MUC_PHAN_TANG[ra.mucPhanTang]})` +
                    (ra.thieuDeVeKhong > 0 ? `. Muốn về 0 cần thêm ${ra.thieuDeVeKhong} câu vào kho.` : '.'),
                ...ra.canhBao,
              ]
            }
          } catch (e) {
            // KHÔNG NUỐT: hỏng thì ca vẫn chạy bằng luật cũ, nhưng thầy phải biết.
            bcTranTrung = ['Không dựng được đề riêng chặn trùng — ca chạy theo luật cũ. ' + (e instanceof Error ? e.message : '')]
          }
        }
      }
      const kq = await batDauThi(scriptUrl.trim(), secret.trim(), chiTiet.ca.maCa, boTheoEm, lapTheoEm, demSai, bienBan as unknown as Record<string, unknown>, gioChungTheoCa[chiTiet.ca.maCa] ?? chiTiet.ca.dongBoGio ?? false, daLamLaiTheoEm, bacTheoEm, banDoDaDung)
      for (const d of bcTranTrung) showToast(d, d.startsWith('Không dựng được') ? 'error' : 'success')
      if (kq.thieuBoTheoEm) {
        // KHÔNG NUỐT. Ca đã phát đề trước khi có bản đồ ⇒ em làm một bộ câu,
        // máy thầy chấm một bộ khác. Ghi đè bản đồ lúc này còn tệ hơn, nên
        // việc duy nhất đúng là báo thầy mở ca lại.
        showToast('Ca này đã phát đề TRƯỚC khi có bộ câu riêng — điểm chấm sẽ sai. Huỷ ca và mở lại.', 'error')
      } else {
        showToast(kq.daBatTruoc ? 'Ca này đã bắt đầu từ trước.' : 'Đã bắt đầu — cả lớp hiện đề ngay bây giờ.', 'success')
      }
      // KHÔNG NUỐT. Mốc bắt đầu chưa sang máy chủ mới thì cả lớp tụt về đường
      // cũ suốt ca — chạy được, nhưng chậm như trước và thầy phải biết.
      if (kq.chuaSangMayChuMoi) {
        showToast('Mốc bắt đầu CHƯA sang máy chủ mới — cả lớp sẽ chạy bằng đường cũ. Bấm Bắt đầu lại một lần.', 'error')
      }
      await tai(chiTiet.ca.maCa)
    } catch (e) {
      showToast(`Không bắt đầu được: ${e instanceof Error ? e.message : 'lỗi không rõ'}`, 'error')
    } finally {
      setDangBatDau(false)
    }
  }

  /** HUỶ CA ĐANG CHỜ. Chưa em nào làm bài nên không mất gì; xoá vẫn là xoá MỀM
   * nên bấm nhầm thì vào Lịch sử ca khôi phục lại được. */
  const huyCaCho = async () => {
    if (!chiTiet) return
    setDangXoa(true)
    try {
      await xoaCa(scriptUrl.trim(), secret.trim(), chiTiet.ca.maCa, chiTiet.ca.maCa)
      showToast('Đã huỷ ca. Em đang chờ sẽ thấy báo ca đã huỷ.', 'success')
      setScreen('lichsuca')
    } catch (e) {
      showToast(`Không huỷ được ca: ${e instanceof Error ? e.message : 'lỗi không rõ'}`, 'error')
    } finally {
      setDangXoa(false)
    }
  }





  const now = gioMayChu()
  const tk = chiTiet
    ? {
        daVao: dsEm.filter((e) => e.moiNhat.trangThai !== 'duoc_duyet_lai').length,
        daNop: dsEm.filter((e) => e.moiNhat.trangThai === 'da_nop' || e.moiNhat.trangThai === 'khoa').length,
        canhBao: dsEm.filter((e) => e.moiNhat.trangThai === 'khoa' || e.moiNhat.soLanRoiMan > 0).length,
      }
    : null
  const tt = chiTiet && tk ? trangThaiCa({ ...chiTiet.ca, ...tk }, now) : null
  const coGiaoChienDich = !!(hoa2 && chiTiet && tt && chiTiet.ca.loai !== 'baitap' && (chiTiet.ca.trangThai === 'dong' || tt.ten === 'Xong' || tt.ten === 'Hết giờ vào'))

  // ---------------------------------------------------------- KHOÁ / MỞ CA
  // Hai con số này đi thẳng vào hộp xác nhận. Nói "một số em" thì thầy không
  // biết mình đang cắt bài của ai, và bấm nhầm giữa giờ là hỏng cả ca.
  const dangLamNgay = dsEm.filter((e) => e.moiNhat.trangThai === 'dang_lam').length
  // Chỉ ca "chọn từng em" mới biết CHẮC bao nhiêu em chưa vào. Ca theo khối
  // hoặc tự do thì máy không biết sĩ số — nói một con số ở đó là bịa, nên để
  // null và câu xác nhận bỏ hẳn phần số.
  const chuaVao =
    chiTiet && chiTiet.ca.phamVi === 'chon' && Array.isArray(chiTiet.ca.danhSachMoi) ? Math.max(0, chiTiet.ca.danhSachMoi.length - dsEm.length) : null

  // ---------------------------------------------------------- TAB LỌC DANH SÁCH EM (G4)
  // Mọi số ở tab là ĐẾM từ dữ liệu ca đã có (lượt, phòng chờ, danh sách mời) — không gọi thêm lệnh nào.
  const sbdDaCoLuot = new Set(dsEm.map((e) => e.sbd))
  const emChoVao = (chiTiet?.dsCho ?? []).filter((x) => !sbdDaCoLuot.has(x.sbd))
  const emChuaVao =
    chuaVao === null || !chiTiet || !Array.isArray(chiTiet.ca.danhSachMoi)
      ? []
      : (chiTiet.ca.danhSachMoi as unknown[]).map((x) => String(x)).filter((sbd) => !sbdDaCoLuot.has(sbd))
  const mucTab: MucTabCa[] = [
    { ma: 'tat_ca', nhan: 'Tất cả', so: dsEm.length },
    { ma: 'dang_lam', nhan: 'Đang làm', so: dangLamNgay },
    ...(chiTiet?.ca.phongCho || emChoVao.length > 0 ? [{ ma: 'cho', nhan: 'Phòng chờ', so: emChoVao.length }] : []),
    { ma: 'da_nop', nhan: 'Đã nộp', so: tk?.daNop ?? 0 },
    ...(chuaVao !== null ? [{ ma: 'chua_vao', nhan: 'Chưa vào', so: emChuaVao.length }] : []),
  ]
  const tabHieu = mucTab.some((m) => m.ma === tabEm) ? tabEm : 'tat_ca'
  const dsHienThi =
    tabHieu === 'dang_lam'
      ? dsEm.filter((e) => e.moiNhat.trangThai === 'dang_lam')
      : tabHieu === 'da_nop'
        ? dsEm.filter((e) => e.moiNhat.trangThai === 'da_nop' || e.moiNhat.trangThai === 'khoa')
        : dsEm
  const tongCauDe = tongSoCauCa(soCauCa)

  // CỬA VÀO CA — luật nằm trong `cua-vao-ca.ts`, màn này chỉ vẽ.
  const cua = cuaVaoCa(chiTiet?.ca ?? null, now)

  const khoaCaNay = async () => {
    if (!chiTiet) return
    setDangKhoa(true)
    try {
      const kq = await khoaCa(scriptUrl.trim(), secret.trim(), chiTiet.ca.maCa)
      setHoiKhoa(false)
      showToast(kq.soEmBiNop > 0 ? `Đã kết thúc ca — ${kq.soEmBiNop} em bị nộp bài theo phần đã làm` : 'Đã kết thúc ca — không em nào đang làm', 'success')
      await tai(chiTiet.ca.maCa, true)
    } catch (e) {
      showToast(`Chưa kết thúc được ca: ${e instanceof Error ? e.message : 'lỗi không rõ'}`, 'error')
    } finally {
      setDangKhoa(false)
    }
  }

  const dongCuaVaoNay = async () => {
    if (!chiTiet) return
    setDangDongCua(true)
    const loiDc = await dongCuaVaoCa(chiTiet.ca.maCa)
    setDangDongCua(false)
    if (loiDc) return showToast(`Chưa đóng được cửa vào: ${loiDc}`, 'error')
    setHoiDongCua(false)
    showToast('Đã đóng cửa vào — em đang làm vẫn làm tiếp, em chưa vào không vào được nữa', 'success')
    await tai(chiTiet.ca.maCa, true)
  }

  const moLaiCa = async () => {
    if (!chiTiet) return
    setDangKhoa(true)
    try {
      const kq = await moKhoaCa(scriptUrl.trim(), secret.trim(), chiTiet.ca.maCa)
      showToast(kq.goHanVao ? 'Đã mở ca — bỏ hạn giờ vào, em đến muộn vào được ngay' : 'Đã mở ca — em mới vào được, em đã nộp phải duyệt thi lại', 'success')
      await tai(chiTiet.ca.maCa, true)
    } catch (e) {
      showToast(`Không mở lại được: ${e instanceof Error ? e.message : 'lỗi không rõ'}`, 'error')
    } finally {
      setDangKhoa(false)
    }
  }

  // ---------------------------------------------------------- HỒ SƠ MỘT EM (MODAL BÁO CÁO CHUẨN GOOGLE MATERIAL 3)
  // Thay toàn bộ màn chi tiết cũ bằng modal Báo cáo ca thi chuẩn Google Material 3 của học sinh



  // ------------------------------------------------ KHỐI DÙNG HAI CHỖ (thầy 29/09: "bỏ từ phần 12:17 chỉ để lại phần trên")
  // Ca ĐANG MỞ: màn Theo dõi chỉ còn khu trên (TheoDoiCa) — các khối dưới đây cắm vào chỗ trống của nó (dòng phụ, Cần thầy xử lý, Việc nhanh);
  // việc với TỪNG EM (Cho thi lại, Cho vào bằng máy khác, Mở khoá, Báo phụ huynh) nằm trong hồ sơ em (chạm thẻ em). Ca ĐÃ ĐÓNG: giữ bố cục hai cột cũ.
  const vePhongCho = () => {
    if (!chiTiet) return null
    return (
      <>
          {/* PHÒNG CHỜ (thầy chốt 07/09; làm lại 28/09 theo M3 — src/components/ca-thi/PhongChoCa.tsx). Ca bật phòng chờ mà thầy chưa bấm
              bắt đầu thì em đang đứng ở màn chờ — việc gấp nhất trên màn này, nên đứng đầu cột. Hai nút như thầy chốt: Bắt đầu thi và Huỷ ca kiểm tra.
              Danh sách em tự làm mới 5 giây (cùng lệnh chiTietCa của Chiếu mã); màn Chiếu mã đang mở thì nghỉ để không gọi trùng. */}
          {chiTiet.ca.phongCho && !chiTiet.ca.batDauThiLuc && (
            <PhongChoCa
              maCa={chiTiet.ca.maCa}
              em={gopEmDaVao(chiTiet.dsCho, [])}
              siSo={Array.isArray(chiTiet.ca.danhSachMoi) ? chiTiet.ca.danhSachMoi.length : null}
              onCauSai={caCanDeRieng}
              coDongBoGio={chiTiet.ca.loai !== 'baitap'}
              dongBoGio={gioChungTheoCa[chiTiet.ca.maCa] ?? chiTiet.ca.dongBoGio ?? false}
              onDoiDongBoGio={(bat) => setGioChungTheoCa((c) => ({ ...c, [chiTiet.ca.maCa]: bat }))}
              dangBatDau={dangBatDau}
              onBatDau={() => void batDauCaNay()}
              dangHuy={dangXoa}
              onHuy={() => void huyCaCho()}
              noiKhoiPhuc={hoa2 ? 'Ca vào Ca kiểm tra › Ca đã xoá, khôi phục lại được.' : 'Ca vào Lịch sử ca, khôi phục lại được.'}
              onChieuMa={() => setChieuMa(true)}
              tuCapNhat
              matKetNoi={soHut > 0}
            />
          )}
          {caCanDeRieng && chiTiet.ca.phongCho && !chiTiet.ca.batDauThiLuc && laCaDaDungNay && (
            <BangRutThuDaDung
              rt={rutThuDaDung?.maCa === chiTiet.ca.maCa ? rutThuDaDung : null}
              dang={dangRutThu || (canRutThu && daRutThuRef.current !== `${chiTiet.ca.maCa}|da_dung`)}
              loi={canRutThu ? loiRutThu : teacherBank && soCauCa ? loiRutThu : 'máy này chưa có bản đề có đáp án hoặc số câu mỗi phần của ca'}
              tenCua={tenEmLop}
              tienDoThay={tienDoThay}
              onChayLai={() => void chayRutThu()}
            />
          )}
          {caCanDeRieng && chiTiet.ca.phongCho && !chiTiet.ca.batDauThiLuc && pvCa !== 'khong' && !laCaDaDungNay && (
            <BangRutThuV2
              rt={rutThu?.maCa === chiTiet.ca.maCa ? rutThu : null}
              dang={dangRutThu || (canRutThu && daRutThuRef.current !== `${chiTiet.ca.maCa}|${cheDoRutV2}`)}
              loi={canRutThu ? loiRutThu : teacherBank && soCauCa ? loiRutThu : 'máy này chưa có bản đề có đáp án hoặc số câu mỗi phần của ca'}
              tenCua={tenEmLop}
              onChayLai={() => void chayRutThu()}
            />
          )}
      </>
    )
  }
  const veCuaVao = () => {
    if (!chiTiet) return null
    return (
      <>
              <DongMatKetNoiCa soHut={soHut} gioTotMs={gioTot} />
              {/* CỬA VÀO CA: trạng thái nói bằng chữ. KHOÁ CA cũ đã gỡ 28/09 (trùng "Kết thúc ca ngay"); MỞ CA chỉ hiện khi cửa đang đóng — cũng dùng khi
                  QUÁ GIỜ VÀO: nó gỡ hạn vào phòng, em đến muộn vào được ngay. */}
              <p className="ca-gio-dong" data-cua-vao={cua.nhan}>
                Cửa vào ca: <b style={{ color: cua.moCua ? 'var(--xanh)' : 'var(--do)' }}>{cua.nhan}</b>
                {cua.daKhoa && chiTiet.ca.khoaLuc ? (
                  <>
                    {' '}
                    lúc <span style={SO}>{gio(chiTiet.ca.khoaLuc)}</span>
                    {chiTiet.ca.khoaBoi ? ` bởi ${chiTiet.ca.khoaBoi}` : ''}
                  </>
                ) : null}
                {!cua.daKhoa && chiTiet.ca.hetHanVao ? (
                  <>
                    {' '}
                    · {cua.quaGioVao ? 'hạn' : 'đến'} <span style={SO}>{gio(chiTiet.ca.hetHanVao)}</span>
                  </>
                ) : null}
              </p>
              {chiTiet.ca.phongCho && chiTiet.ca.batDauThiLuc && (
                <p className="ca-gio-dong">
                  Phòng chờ đã mở lúc <span style={SO}>{gio(chiTiet.ca.batDauThiLuc)}</span> — {chiTiet.ca.dongBoGio ? `đồng bộ giờ cả phòng, cùng hết giờ lúc ${gio(new Date(Date.parse(chiTiet.ca.batDauThiLuc) + chiTiet.ca.thoiGianPhut * 60000).toISOString())}.` : 'em vào từ giờ nhận đề ngay, tính giờ riêng từng em.'}
                </p>
              )}
              {!cua.moCua && (
                <div className="grid grid-cols-1" style={{ gap: 'var(--k2)' }}>
                  <button
                    type="button"
                    onClick={moLaiCa}
                    disabled={dangKhoa || !cua.moDuoc}
                    aria-label="Mở ca cho em vào"
                    className="tap-target flex items-center"
                    style={{
                      minHeight: 64,
                      gap: 'var(--k2)',
                      padding: '0 var(--k3)',
                      borderRadius: 'var(--bo-3)',
                      border: 'none',
                      textAlign: 'left',
                      background: cua.moDuoc ? 'var(--xanh)' : 'var(--the-2)',
                      color: cua.moDuoc ? 'var(--muc-nguoc)' : 'var(--mo)',
                      boxShadow: cua.moDuoc ? 'var(--bong-2)' : 'none',
                      transition: 'transform 120ms ease, box-shadow 120ms ease',
                    }}
                  >
                    <span
                      className="flex items-center justify-center shrink-0"
                      style={{ width: 36, height: 36, borderRadius: 'var(--bo-tron)', background: cua.moDuoc ? 'var(--xanh-nen)' : 'var(--the)', color: cua.moDuoc ? 'var(--xanh)' : 'var(--mo)' }}
                    >
                      <Unlock size={19} />
                    </span>
                    <span className="flex flex-col" style={{ gap: 1, minWidth: 0 }}>
                      <span className="font-bold" style={{ fontFamily: 'var(--sans)', fontSize: 'var(--cx-2)' }}>
                        {dangKhoa && cua.moDuoc ? 'Đang mở…' : 'Mở ca'}
                      </span>
                      <span style={{ fontFamily: 'var(--sans)', fontSize: 'var(--cx-0)', opacity: 0.85 }}>Em vào được ngay</span>
                    </span>
                  </button>
                </div>
                )}
              {!cua.moCua && (
                <p className="ca-gio-dong">Mở ca: bỏ hạn giờ vào phòng, em đến muộn vào được ngay. Em đã bị nộp do kết thúc ca phải duyệt thi lại từng em.</p>
              )}
      </>
    )
  }
  const veSaiLai = () => {
    if (!chiTiet) return null
    return (
      <>
        {laCaDaDungNay && <KhoiSaiLaiDaDung ds={emSaiLaiDaDung} soEmDaCham={emSaiLaiDaDung.length} />}
        {laCaDeRieng && !laCaDaDungNay && (
              <div>
                <button
                  type="button"
                  onClick={() => setMoSaiLai((v) => !v)}
                  aria-expanded={moSaiLai}
                  className="tap-target font-bold w-full"
                  style={{
                    ...SO,
                    textAlign: 'left',
                    minHeight: 44,
                    padding: 'var(--k2) var(--k3)',
                    borderRadius: 'var(--bo-1)',
                    background: tongKetLap.soEmCoLap === 0 ? 'var(--cam-nen)' : tongKetLap.tongSaiLai > 0 ? 'var(--do-nen)' : 'var(--xanh-nen)',
                    color: tongKetLap.soEmCoLap === 0 ? 'var(--cam)' : tongKetLap.tongSaiLai > 0 ? 'var(--do)' : 'var(--xanh)',
                    border: 'none',
                    fontSize: 'var(--cx-1)',
                  }}
                >
                  {tongKetLap.soEmCoLap === 0
                    ? 'Câu em sai buổi trước · chưa rút được câu nào'
                    : tongKetLap.tongSaiLai > 0
                      ? `${tongKetLap.emSaiLai.length} em còn sai lại câu từng sai · ${tongKetLap.tongSaiLai}/${tongKetLap.tongCauLap} câu`
                      : `Cả ${tongKetLap.soEmCoLap} em đã sửa được hết ${tongKetLap.tongCauLap} câu từng sai`}
                  <span style={{ ...NHAN_NHO, display: 'block', color: 'inherit', opacity: 0.85 }}>
                    {moSaiLai ? 'Bấm để gập lại' : tongKetLap.soEmCoLap === 0 ? 'Bấm để xem vì sao' : 'Bấm để xem chi tiết từng em, từng câu'}
                  </span>
                </button>

                {moSaiLai && (
                  <div className="flex flex-col" style={{ gap: 'var(--k2)', marginTop: 'var(--k2)' }}>
                    {bienBanLap && <BangBienBanLap bb={bienBanLap} tenCua={(sbd) => dsEm.find((e) => e.sbd === sbd)?.hoTen || ''} />}
                    {!bienBanLap && tongKetLap.soEmCoLap === 0 && (
                      <div style={{ ...NHAN_NHO, color: 'var(--cam)', lineHeight: 1.6 }}>
                        Máy này không giữ biên bản lúc rút đề. Bấm Bắt đầu ở máy khác thì biên bản nằm ở máy đó; mở lại ca sau khi máy chủ đã ghi bản đồ thì
                        bảng trên vẫn đếm đúng.
                      </div>
                    )}
                    {tongKetLap.emSaiLai.map((e) => (
                      <div key={`sailai-${e.sbd}`} style={{ background: 'var(--the-2)', borderRadius: 'var(--bo-1)', padding: 'var(--k3)' }}>
                        <div className="font-bold" style={{ fontFamily: 'var(--sans)', fontSize: 'var(--cx-2)', color: 'var(--muc)' }}>
                          {e.hoTen || `SBD ${e.sbd}`} <span style={{ ...NHAN_NHO, ...SO }}>· SBD {e.sbd}</span>
                        </div>
                        {/* GỌI ĐÚNG TÊN CON SỐ. Biên bản ghi "rút được 8" còn
                            chỗ này từng ghi "hỏi lại 9 câu" — thầy đọc ra hai số
                            vênh nhau (08/09). Cả hai đều đúng, chỉ đếm hai tập
                            khác nhau. Xem dem-cau-hoi-lai.ts. */}
                        <div style={{ ...NHAN_NHO, ...SO }}>
                          {dongSoCauHoiLai({
                            tong: e.lap!.tong,
                            daSua: e.lap!.daSua,
                            saiLai: e.lap!.saiLai,
                            rutChuDong: bienBanLap?.soLapCua?.[e.sbd] ?? null,
                          })}
                        </div>
                        <div className="flex flex-col" style={{ gap: 4, marginTop: 'var(--k2)' }}>
                          {e.lap!.saiLaiChiTiet.map((c) => (
                            <div key={`${e.sbd}-${c.qid}`} style={{ ...NHAN_NHO, color: 'var(--muc)' }}>
                              <b style={SO}>
                                Câu {c.soCau} phần {c.phan}
                              </b>
                              {c.chuyenDe ? ` · ${c.chuyenDe}` : ''} · <span style={{ color: 'var(--do)' }}>{c.soLanSai > 0 ? `sai lần thứ ${c.soLanSai}` : 'lại sai'}</span>
                              <span style={{ ...SO, display: 'block', color: 'var(--nhat)' }}>
                                {/* Cùng luật với hai cổng kia: phần EM CHỌN tô đỏ,
                                    phần đáp án đúng giữ màu chữ thường. */}
                                đúng: {c.dapAnDung || '—'} · em chọn:{' '}
                                <b style={{ color: 'var(--do)' }}>{c.dapAnChon || 'bỏ trống'}</b>
                              </span>
                            </div>
                          ))}
                        </div>
                      </div>
                    ))}
                    {tongKetLap.emSachTron.length > 0 && (
                      <div style={{ ...NHAN_NHO, color: 'var(--xanh)' }}>
                        Sửa được hết: {tongKetLap.emSachTron.map((e) => e.hoTen || `SBD ${e.sbd}`).join(' · ')}
                      </div>
                    )}
                  </div>
                )}
              </div>
            )}
      </>
    )
  }
  const veBiChan = () => {
    if (!chiTiet) return null
    return (
      <>
        {chiTiet.biChan && chiTiet.biChan.length > 0 && (
              <div>
                <div style={{ ...NHAN_NHO, marginBottom: 'var(--k2)' }}>
                  Bị chặn ở cổng danh sách (<b style={SO}>{chiTiet.biChan.length}</b> lượt)
                </div>
                <div className="flex flex-col" style={{ gap: 'var(--k2)' }}>
                  {chiTiet.biChan.slice(0, 8).map((b, i) => (
                    <div key={`${b.luc}-${i}`} style={{ background: 'var(--cam-nen)', borderRadius: 'var(--bo-1)', padding: 'var(--k3)' }}>
                      <div className="font-bold" style={{ fontFamily: 'var(--sans)', fontSize: 'var(--cx-2)', color: 'var(--muc)' }}>
                        SBD <span style={SO}>{b.sbd}</span> · {moTaLyDoChan(b.lyDo)}
                      </div>
                      <div style={NHAN_NHO}>
                        Em gõ: <b>{b.hoTenGoi || '(trống)'}</b>
                        {b.namSinhGoi ? <> · sinh <span style={SO}>{b.namSinhGoi}</span></> : null}
                      </div>
                      <div style={NHAN_NHO}>
                        {b.hoTenDs ? (
                          <>
                            Danh sách: <b>{b.hoTenDs}</b>
                            {b.namSinhDs ? <> · sinh <span style={SO}>{b.namSinhDs}</span></> : null}
                          </>
                        ) : (
                          'Danh sách lớp không có số báo danh này'
                        )}
                        {b.luc ? <> · lúc <span style={SO}>{gio(b.luc)}</span></> : null}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
      </>
    )
  }
  const veCanhBao = () => (
    <>
          {loi && <OThongBao tone="do">{loi}</OThongBao>}
          {!teacherBank && dsEm.some((e) => e.moiNhat.dapAn) && (
            <OThongBao tone="cam">
              Máy này chưa lấy được ngân hàng CÓ đáp án của ca. Ca mở khi chưa bật "xem điểm" thì đáp án không nằm trên máy chủ, chỉ máy đã mở ca mới chấm được — điểm hiện ra là điểm đã ghi trên Sheet.
            </OThongBao>
          )}

    </>
  )
  const veThieuTen = () => (
    <>
      {emThieuTen.length > 0 && (
              <div style={{ background: 'var(--cam-nen)', borderRadius: 'var(--bo-1)', padding: 'var(--k3)', marginBottom: 'var(--k3)' }}>
                <div style={{ fontFamily: 'var(--sans)', fontSize: 'var(--cx-1)', color: 'var(--muc)' }}>
                  <b style={SO}>{emThieuTen.length}</b> em trong ca chưa có họ tên, phiếu gửi phụ huynh sẽ in số báo danh thay cho tên con.
                </div>
                <button
                  type="button"
                  onClick={() => void dongBoTenChoCa()}
                  disabled={dangDongBoTen}
                  className="tap-target font-bold"
                  style={{ marginTop: 'var(--k2)', minHeight: 40, padding: '0 var(--k4)', borderRadius: 'var(--bo-tron)', background: 'var(--muc)', color: 'var(--muc-nguoc)', border: 'none', fontFamily: 'var(--sans)', fontSize: 'var(--cx-1)' }}
                >
                  {dangDongBoTen ? 'Đang đồng bộ…' : 'Lấy tên từ danh sách lớp'}
                </button>
              </div>
            )}
    </>
  )

  const veHanhDongEm = (e: (typeof dsEm)[number]) => {
    const l = e.moiNhat
    const daNop = l.trangThai === 'da_nop' || l.trangThai === 'khoa'
    return (
      <>
                          {/* GAME HÓA 2.0: app phụ huynh tắt ⇒ tin báo không tới ai — bỏ nút (RA-SOAT mục 3). */}
                          {!hoa2 && (l.trangThai === 'khoa' || l.soLanRoiMan > 0) && (
                            <button type="button" onClick={() => moBaoPhuHuynh(e.sbd, l.hoTen, l)} className="tap-target font-bold" style={{ ...NHAN_NHO, color: 'var(--cam)', minHeight: 44, padding: '0 10px', borderRadius: 'var(--bo-tron)', border: '1px solid var(--cam)' }}>
                              Báo phụ huynh
                            </button>
                          )}
                          {l.trangThai === 'khoa' &&
                            (xacNhanMoKhoa === e.sbd ? (
                              <span className="inline-flex items-center" style={{ gap: 4 }}>
                                <button type="button" onClick={() => handleMoKhoa(e.sbd)} disabled={dangDuyet === e.sbd} className="tap-target font-bold" style={{ ...NHAN_NHO, minHeight: 44, padding: '0 10px', borderRadius: 'var(--bo-tron)', background: 'var(--muc)', color: 'var(--muc-nguoc)' }}>
                                  {dangDuyet === e.sbd ? '…' : 'Đồng ý mở khoá'}
                                </button>
                                <button type="button" onClick={() => setXacNhanMoKhoa(null)} className="tap-target" style={{ ...NHAN_NHO, minHeight: 44, padding: '0 10px', borderRadius: 'var(--bo-tron)', background: 'var(--the)' }}>
                                  Huỷ
                                </button>
                              </span>
                            ) : (
                              <button type="button" onClick={() => setXacNhanMoKhoa(e.sbd)} className="tap-target font-bold" style={{ ...NHAN_NHO, color: 'var(--do)', minHeight: 44, padding: '0 10px', borderRadius: 'var(--bo-tron)', border: '1px solid var(--do)' }}>
                                Mở khoá
                              </button>
                            ))}
                          {l.trangThai === 'duoc_duyet_lai' &&
                            l.khoaMay !== false &&
                            (xacNhanMayKhac === e.sbd ? (
                              /* Nói rõ việc này làm gì TRƯỚC khi thầy bấm: chỉ gỡ khoá máy, không xoá gì, không đổi đề. */
                              <span className="inline-flex flex-col" style={{ gap: 4 }}>
                                <span style={{ ...NHAN_NHO, lineHeight: 1.5 }}>
                                  Em sẽ vào được bằng MÁY KHÁC (không còn buộc vào máy cũ). Đề mới giữ nguyên; máy cũ cũng vẫn vào được.
                                </span>
                                <span className="inline-flex items-center" style={{ gap: 4 }}>
                                  <button type="button" onClick={() => handleChoVaoMayKhac(e.sbd)} disabled={dangDuyet === e.sbd} className="tap-target font-bold" style={{ ...NHAN_NHO, minHeight: 44, padding: '0 10px', borderRadius: 'var(--bo-tron)', background: 'var(--muc)', color: 'var(--muc-nguoc)' }}>
                                    {dangDuyet === e.sbd ? '…' : 'Đồng ý cho vào bằng máy khác'}
                                  </button>
                                  <button type="button" onClick={() => setXacNhanMayKhac(null)} className="tap-target" style={{ ...NHAN_NHO, minHeight: 44, padding: '0 10px', borderRadius: 'var(--bo-tron)', background: 'var(--the)' }}>
                                    Huỷ
                                  </button>
                                </span>
                              </span>
                            ) : (
                              <button type="button" onClick={() => setXacNhanMayKhac(e.sbd)} className="tap-target font-bold" style={{ ...NHAN_NHO, color: 'var(--muc)', minHeight: 44, padding: '0 10px', borderRadius: 'var(--bo-tron)', border: '1px solid var(--vien-dam)' }}>
                                Cho vào bằng máy khác
                              </button>
                            ))}
                          {daNop &&
                            (xacNhanSbd === e.sbd ? (
                              /* NÓI RÕ NÓ XOÁ GÌ trước khi thầy bấm. Việc này
                                 KHÔNG khôi phục được: điểm, bài làm và chi tiết
                                 từng câu của lượt cũ mất hẳn. */
                              <span className="inline-flex flex-col" style={{ gap: 4 }}>
                                <span style={{ ...NHAN_NHO, color: 'var(--do)', lineHeight: 1.5 }}>
                                  Xoá hẳn điểm và bài làm lượt này của em, rút đề mới, và em chỉ vào lại được ở đúng máy cũ. Không khôi phục được.
                                </span>
                                <span className="inline-flex items-center" style={{ gap: 4 }}>
                                <button type="button" onClick={() => handleChoThiLai(e.sbd)} disabled={dangDuyet === e.sbd} className="tap-target font-bold" style={{ ...NHAN_NHO, minHeight: 44, padding: '0 10px', borderRadius: 'var(--bo-tron)', background: 'var(--do)', color: 'var(--muc-nguoc)' }}>
                                  {dangDuyet === e.sbd ? '…' : 'Xoá lượt cũ và cho thi lại'}
                                </button>
                                <button type="button" onClick={() => setXacNhanSbd(null)} className="tap-target" style={{ ...NHAN_NHO, minHeight: 44, padding: '0 10px', borderRadius: 'var(--bo-tron)', background: 'var(--the)' }}>
                                  Huỷ
                                </button>
                                </span>
                              </span>
                            ) : (
                              <button type="button" onClick={() => setXacNhanSbd(e.sbd)} className="tap-target font-bold" style={{ ...NHAN_NHO, color: 'var(--muc)', minHeight: 44, padding: '0 10px', borderRadius: 'var(--bo-tron)', border: '1px solid var(--vien-dam)' }}>
                                Cho thi lại
                              </button>
                            ))}
      </>
    )
  }

  return (
    <div className="gv-page min-h-screen pb-28 px-3 sm:px-4 pt-4 flex flex-col" style={{ background: 'var(--nen)', color: 'var(--muc)', gap: 'var(--k4)', fontFamily: 'var(--sans)' }}>
      <div className="gv-page-header flex flex-wrap items-center justify-between" style={{ gap: 'var(--k3)' }}>
        {/* TÊN CA SỬA ĐƯỢC TẠI CHỖ (thầy báo 07/09).
            Chạm vào tên là mở ô nhập ngay tại chỗ nó đang đứng, không nhảy sang
            màn khác: thầy sửa tên giữa lúc coi thi, mất bảng lượt thi một nhịp
            là mất luôn cái đang theo dõi. */}
        {chiTiet && tenNhap !== null ? (
          <div className="flex items-center min-w-0 flex-1" style={{ gap: 'var(--k2)' }}>
            <input
              autoFocus
              value={tenNhap}
              onChange={(e) => setTenNhap(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') void luuTenCa()
                if (e.key === 'Escape') setTenNhap(null)
              }}
              maxLength={TEN_CA_TOI_DA}
              placeholder={`Ca ${chiTiet.ca.maCa}`}
              aria-label="Tên ca kiểm tra"
              style={{ ...O_NHAP, fontFamily: 'var(--serif)', fontWeight: 700 }}
            />
            <button
              type="button"
              onClick={() => void luuTenCa()}
              disabled={dangDoiTen}
              className="tap-target shrink-0 font-bold"
              style={{ height: 52, padding: '0 var(--k4)', borderRadius: 'var(--bo-1)', background: 'var(--muc)', color: 'var(--muc-nguoc)', border: 'none', fontFamily: 'var(--sans)', fontSize: 'var(--cx-2)' }}
            >
              {dangDoiTen ? '…' : 'Xong'}
            </button>
            <button
              type="button"
              onClick={() => setTenNhap(null)}
              disabled={dangDoiTen}
              className="tap-target shrink-0"
              style={{ height: 52, padding: '0 var(--k3)', borderRadius: 'var(--bo-1)', background: 'transparent', border: 'none', ...NHAN_NHO }}
            >
              Huỷ
            </button>
          </div>
        ) : (
          <>
            <button
              type="button"
              onClick={() => chiTiet && setTenNhap(chiTiet.ca.tenCa || '')}
              disabled={!chiTiet}
              className="tap-target flex items-center min-w-0"
              style={{ gap: 'var(--k2)', background: 'transparent', border: 'none', padding: 0, textAlign: 'left', color: 'var(--muc)' }}
              aria-label="Sửa tên ca kiểm tra"
            >
              <h1 className="font-bold truncate" style={{ fontSize: 'var(--cx-5)', fontFamily: 'var(--serif)' }}>
                {chiTiet ? tenHienCua(chiTiet.ca.tenCa, chiTiet.ca.maCa) : 'Chi tiết ca kiểm tra'}
              </h1>
              {chiTiet && <Pencil size={16} className="shrink-0" style={{ color: 'var(--nhat)' }} />}
            </button>
            <span className="flex items-center flex-wrap justify-end min-w-0" style={{ gap: 'var(--k2)' }}>
            {coGiaoChienDich && (
              <button type="button" role="switch" aria-checked={moGiao} className="ca-nut-chieu ca-cong-tac" data-bat={moGiao ? 'bat' : 'tat'} onClick={() => setMoGiao((v) => !v)}>
                <span className="ca-cong-tac-ray" aria-hidden="true">
                  <i />
                </span>
                Giao chiến dịch luyện từ ca này
              </button>
            )}
            {chiTiet && (
              <button type="button" className="ca-nut-chieu" onClick={() => setChieuMa(true)}>
                Chiếu mã vào thi
              </button>
            )}
            <button
              type="button"
              onClick={() => setScreen('lichsuca')}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-700/60 text-slate-700 dark:text-slate-200 shadow-2xs font-semibold text-xs transition cursor-pointer active:scale-95 shrink-0"
              aria-label={hoa2 ? 'Quay lại Ca kiểm tra' : 'Quay lại Lịch sử ca'}
            >
              <ArrowLeft size={15} className="text-slate-600 dark:text-slate-300" />
              {/* GAME HÓA 2.0 (RA-SOAT 28/09 mục 3): một khái niệm một từ — "Ca kiểm tra". */}
              <span>{hoa2 ? 'Ca kiểm tra' : 'Lịch sử ca'}</span>
            </button>
            </span>
          </>
        )}
      </div>

      {/* 01/10: bài bổ sung chờ duyệt (máy em gửi phần làm thêm sau khi máy chủ đã chốt bài). Không có thì không hiện gì. */}
      <KhungBaiBoSung maCa={chiTiet?.ca.maCa} secret={secret} />
      {!chiTiet && (
        <TheNoiDung>
          <div style={{ ...TIEU_DE_MUC, marginBottom: 'var(--k3)' }}>Nhập mã ca</div>
          <div className="flex items-center" style={{ gap: 'var(--k3)' }}>
            <input style={{ ...O_NHAP, ...SO }} placeholder="Mã ca (6 số)" value={maCa} onChange={(e) => setMaCa(e.target.value)} inputMode="numeric" onKeyDown={(e) => e.key === 'Enter' && tai(maCa)} />
            <button type="button" onClick={() => tai(maCa)} disabled={dangTai} className="tap-target shrink-0 font-bold active:scale-95 transition cursor-pointer" style={{ height: 52, padding: '0 var(--k5)', borderRadius: 'var(--bo-1)', background: 'var(--muc)', color: 'var(--muc-nguoc)' }}>
              {dangTai ? '…' : 'Tải'}
            </button>
          </div>
          {loi && (
            <div style={{ marginTop: 'var(--k3)' }}>
              <OThongBao tone="do">{loi}</OThongBao>
            </div>
          )}

          {dsCaGoiY.length > 0 && (
            <div className="mt-5 pt-4 border-t border-dashed border-slate-200 dark:border-slate-700">
              <div className="flex items-center justify-between mb-3">
                <span style={NHAN_NHO} className="font-semibold text-slate-700 dark:text-slate-300">
                  Hoặc chọn nhanh ca gần đây:
                </span>
                <button
                  type="button"
                  onClick={() => setScreen('lichsuca')}
                  className="text-xs font-semibold text-blue-600 dark:text-blue-400 hover:underline inline-flex items-center gap-1 cursor-pointer"
                >
                  Xem tất cả ca kiểm tra <ChevronRight size={14} />
                </button>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {dsCaGoiY.map((c) => (
                  <button
                    key={c.maCa}
                    type="button"
                    onClick={() => {
                      setMaCa(c.maCa)
                      tai(c.maCa)
                    }}
                    className="tap-target flex items-center justify-between p-3 rounded-xl bg-slate-50 dark:bg-slate-800/80 hover:bg-slate-100 dark:hover:bg-slate-700/80 border border-slate-200 dark:border-slate-700 text-left transition cursor-pointer active:scale-98"
                  >
                    <div className="min-w-0 flex-1 mr-2">
                      <div className="flex items-center gap-2">
                        <span className="font-mono font-bold text-sm text-blue-600 dark:text-blue-400">
                          #{c.maCa}
                        </span>
                        {c.lop && (
                          <span className="px-1.5 py-0.5 rounded text-[11px] font-semibold bg-slate-200/80 dark:bg-slate-700 text-slate-700 dark:text-slate-300">
                            {c.lop}
                          </span>
                        )}
                      </div>
                      <div className="text-xs font-medium text-slate-700 dark:text-slate-200 truncate mt-1">
                        {c.tenCa || 'Ca kiểm tra'}
                      </div>
                    </div>
                    <Nhan tone={c.trangThai === 'mo' ? 'tim' : 'xam'}>
                      {c.trangThai === 'mo' ? 'Đang mở' : 'Đã đóng'}
                    </Nhan>
                  </button>
                ))}
              </div>
            </div>
          )}
        </TheNoiDung>
      )}

      {chiTiet && tk && tt && (
        <>
          {coGiaoChienDich && (() => {
            const maDeCa = maDeTuBoCau((teacherBank ?? []).flatMap((b) => [...(b.phanI ?? []), ...(b.phanII ?? []), ...(b.phanIII ?? [])].map((q) => q.id)))
            return !moGiao ? null : (
              <GiaoChienDich
                key={`${chiTiet.ca.maCa}|${maDeCa.join(',')}`}
                maCa={chiTiet.ca.maCa}
                lop={chiTiet.ca.lop}
                maDeCa={maDeCa}
                tenGoiY={tenHienCua(chiTiet.ca.tenCa, chiTiet.ca.maCa)}
                onDeSau={() => setMoGiao(false)}
              />
            )
          })()}
          {chiTiet.ca.trangThai === 'mo' ? (
            <>
            {vePhongCho()}
            <TheoDoiCa
              tenCa={tenHienCua(chiTiet.ca.tenCa, chiTiet.ca.maCa)}
              maCa={chiTiet.ca.maCa}
              link={`${location.origin}${import.meta.env.BASE_URL}t/${chiTiet.ca.maCa}`}
              daChepLink={daCopy}
              onChepLink={copyLink}
              daChepLinkDiem={daCopyDiem}
              onChepLinkDiem={copyLinkDiem}
              nhanSong={songOn ? 'Ca đang mở · cập nhật trực tiếp' : undefined}
              hetLucMs={hetLucMuonNhat(
                dsEm.map((e) => ({ dangLam: e.moiNhat.trangThai === 'dang_lam', vaoLuc: e.moiNhat.vaoLuc, hetGioLuc: e.moiNhat.hetGioLuc })),
                chiTiet.ca.thoiGianPhut,
              )}
              moLuc={ngayGio(chiTiet.ca.batDau || chiTiet.ca.moLuc)}
              hetHanVao={chiTiet.ca.hetHanVao ? gio(chiTiet.ca.hetHanVao) : ''}
              thoiGianPhut={chiTiet.ca.thoiGianPhut}
              congBoChu={TEN_CONG_BO[chiTiet.ca.congBo]}
              phamViChu={TEN_PHAM_VI[chiTiet.ca.phamVi]}
              conGiay={(() => {
                const vao = dsEm.filter((e) => e.moiNhat.trangThai === 'dang_lam' && e.moiNhat.vaoLuc).map((e) => Date.parse(String(e.moiNhat.vaoLuc))).filter((x) => Number.isFinite(x))
                return vao.length ? Math.round((Math.max(...vao) + chiTiet.ca.thoiGianPhut * 60_000 - now) / 1000) : null
              })()}
              em={[
                ...dsEm.map((e): EmTheoDoi => {
                  const song = tienDoSong[e.sbd]
                  const tongCau = tongCauDe || song?.tongCau || null
                  const phu = phuTienDoSong(
                    { dangLam: e.moiNhat.trangThai === 'dang_lam', vaoLuc: String(e.moiNhat.vaoLuc || ''), daLam: e.moiNhat.dapAn && tongCau ? demCauDaLam(e.moiNhat.dapAn) : null, soLanRoiMan: e.moiNhat.soLanRoiMan },
                    song,
                  )
                  return {
                    sbd: e.sbd,
                    hoTen: e.hoTen,
                    tt: e.moiNhat.trangThai === 'duoc_duyet_lai' ? 'cho_thi_lai' : (e.moiNhat.trangThai as EmTheoDoi['tt']),
                    daLam: tongCau ? phu.daLam : null,
                    tongCau,
                    soLanRoiMan: phu.soLanRoiMan,
                    tongGiayRoiMan: e.moiNhat.tongGiayRoiMan,
                    diem: e.diem ?? null,
                  }
                }),
                ...emChuaVao.map((sbd): EmTheoDoi => ({ sbd, hoTen: classList.find((c) => c.sbd === sbd)?.hoTen || '', tt: 'chua_vao', daLam: null, tongCau: null, soLanRoiMan: 0, tongGiayRoiMan: 0, diem: null })),
              ]}
              soChuaVao={chuaVao}
              nguongLan={chiTiet.ca.nguongLan ?? 3}
              dangTai={dangTai}
              dangDuyet={dangDuyet}
              onLamMoi={() => tai(chiTiet.ca.maCa)}
              onMoKhoa={(sbd) => {
                // Bảng từng em đã bỏ (29/09): câu hỏi lại "Đồng ý mở khoá" nằm trong hồ sơ em ⇒ mở hồ sơ với câu hỏi sẵn.
                setXacNhanMoKhoa(sbd)
                setSbdHoSo(sbd)
              }}
              onXemEm={(sbd) => setSbdHoSo(sbd)}
              onChieuMa={() => setChieuMa(true)}
              onKetThuc={() => {
                setHoiKhoa(true)
                // Hộp hỏi lại nằm ở cột dưới: kéo tới cho thầy thấy ngay (không khoá khi chưa bấm xác nhận).
                setTimeout(() => document.querySelector('[data-hop="khoa-ca"]')?.scrollIntoView?.({ behavior: 'smooth', block: 'center' }), 60)
              }}
              onDongCuaVao={() => {
                setHoiDongCua(true)
                setTimeout(() => document.querySelector('[data-hop="dong-cua"]')?.scrollIntoView?.({ behavior: 'smooth', block: 'center' }), 60)
              }}
              daDongCua={(() => {
                const t = Date.parse(String(chiTiet.ca.hetHanVao || ''))
                return Number.isFinite(t) && t <= now
              })()}
              dangLamNgay={dangLamNgay}
              dongPhu={veCuaVao()}
              soCanXuLyThem={(laCaDeRieng ? 1 : 0) + (chiTiet.biChan?.length ? 1 : 0) + (emThieuTen.length > 0 ? 1 : 0)}
              canXuLyThem={
                <>
                  {veThieuTen()}
                  {veSaiLai()}
                  {veBiChan()}
                  {/* Hai dòng báo (lỗi tải, thiếu ngân hàng có đáp án) — cùng lời với khối ở ca đã đóng, vẽ theo kiểu thẻ của khu trên. */}
                  {loi && (
                    <div className="ct-cb-tu-do" role="alert">
                      {loi}
                    </div>
                  )}
                  {!teacherBank && dsEm.some((e) => e.moiNhat.dapAn) && (
                    <div className="ct-cb-tu-do">
                      Máy này chưa lấy được ngân hàng CÓ đáp án của ca. Ca mở khi chưa bật "xem điểm" thì đáp án không nằm trên máy chủ, chỉ máy đã mở ca mới chấm được — điểm hiện ra là điểm đã ghi trên Sheet.
                    </div>
                  )}
                </>
              }
              viecNhanhThem={
                <>
                  {chiTiet.ca.loai !== 'baitap' && !(chiTiet.ca.phongCho && !chiTiet.ca.batDauThiLuc) && (
                    <NutThemPhutCa
                      tong={chiTiet.themPhutTong}
                      chay={() => themPhutCa(chiTiet.ca.maCa)}
                      onXong={(k) => {
                        showToast(cauKetQuaThemPhut(k), 'success')
                        void tai(chiTiet.ca.maCa, true) // tải lại: hạn giờ mới hiện ngay ở đồng hồ vòng
                      }}
                    />
                  )}
                  <button type="button" onClick={() => setHoiXoa(true)} className="ct-nut ct-nut-vien ct-nut-nho" style={{ width: '100%', marginTop: 10, color: 'var(--gvm-ho-dam)' }}>
                    <Trash2 size={16} aria-hidden="true" /> Xoá ca này
                  </button>
                </>
              }
            />
            </>
          ) : (
            <KetThucCa
              tenCa={tenHienCua(chiTiet.ca.tenCa, chiTiet.ca.maCa)}
              luc={ngayGio(chiTiet.ca.batDau || chiTiet.ca.moLuc)}
              siSo={Array.isArray(chiTiet.ca.danhSachMoi) ? chiTiet.ca.danhSachMoi.length : dsEm.length}
              phutDe={chiTiet.ca.thoiGianPhut}
              lop={bcMay?.lop ?? null}
              them={bcMay?.them ?? null}
              dangTai={dangTaiBc}
              loi={bcMay?.loi ?? ''}
              canCongBo={chiTiet.ca.congBo === 'khong' && chiTiet.ca.loai !== 'baitap'}
              dangCongBo={dangCongBo}
              onCongBo={congBoNgay}
              onXemBaoCao={() => setMoBaoCao('lop')}
              onMoEm={(sbd) => setSbdHoSo(sbd)}
              emChuaNop={dsEm.filter((e) => e.moiNhat.trangThai === 'dang_lam' || e.moiNhat.trangThai === 'duoc_duyet_lai').map((e) => ({ sbd: e.sbd, hoTen: e.hoTen }))}
            />
          )}
          {/* HỘP XÁC NHẬN KHOÁ — nêu ĐÚNG SỐ ĐẾM THẬT, không nói chung chung.
              Thầy phải biết mình đang cắt bài của mấy em trước khi bấm. */}
          {hoiDongCua && (
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ background: 'var(--phu)' }} role="dialog" aria-modal="true">
              <div className="w-full flex flex-col" style={{ maxWidth: 460, maxHeight: '90vh', overflowY: 'auto', background: 'var(--the)', borderRadius: 'var(--bo-3)', padding: 'var(--k5)', boxShadow: 'var(--bong-2)' }}>
              <div data-hop="dong-cua" style={{ ...TIEU_DE_MUC, marginBottom: 'var(--k3)' }}>Đóng cửa vào ca {chiTiet.ca.maCa}?</div>
              <OThongBao tone="cam">
                {chuaVao === null ? 'Em nào chưa vào sẽ không vào được nữa.' : <><b style={SO}>{chuaVao}</b> em chưa vào sẽ không vào được nữa.</>}{' '}
                <b style={SO}>{dangLamNgay}</b> em đang làm vẫn làm tiếp tới hết giờ.
              </OThongBao>
              <div style={{ ...NHAN_NHO, marginTop: 'var(--k3)' }}>Em được thầy duyệt thi lại vẫn vào được. Ca vẫn mở, chưa nộp bài của ai.</div>
              <div className="flex" style={{ gap: 'var(--k3)', marginTop: 'var(--k4)' }}>
                <button type="button" onClick={() => setHoiDongCua(false)} className="tap-target flex-1 font-bold" style={{ height: 48, borderRadius: 'var(--bo-1)', background: 'var(--the-2)', color: 'var(--muc)' }}>
                  Huỷ
                </button>
                <button type="button" onClick={dongCuaVaoNay} disabled={dangDongCua} className="tap-target flex-1 font-bold" style={{ height: 48, borderRadius: 'var(--bo-1)', background: 'var(--cam)', color: 'var(--giay)' }}>
                  {dangDongCua ? 'Đang đóng…' : 'Đóng cửa vào'}
                </button>
              </div>
              </div>
            </div>
          )}

          {hoiKhoa && (
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ background: 'var(--phu)' }} role="dialog" aria-modal="true">
              <div className="w-full flex flex-col" style={{ maxWidth: 460, maxHeight: '90vh', overflowY: 'auto', background: 'var(--the)', borderRadius: 'var(--bo-3)', padding: 'var(--k5)', boxShadow: 'var(--bong-2)' }}>
              <div data-hop="khoa-ca" style={{ ...TIEU_DE_MUC, marginBottom: 'var(--k3)' }}>Kết thúc ca {chiTiet.ca.maCa}?</div>
              <OThongBao tone="do">
                <b style={SO}>{dangLamNgay}</b> em đang làm bài sẽ bị nộp bài ngay, chấm theo phần đã làm.{' '}
                {chuaVao === null ? 'Em nào chưa vào sẽ không vào được nữa.' : <>
                  <b style={SO}>{chuaVao}</b> em chưa vào sẽ không vào được nữa.
                </>}
              </OThongBao>
              <div style={{ ...NHAN_NHO, marginTop: 'var(--k3)' }}>Mở ca lại được, nhưng em đã bị nộp thì phải duyệt thi lại từng em.</div>
              <div className="flex" style={{ gap: 'var(--k3)', marginTop: 'var(--k4)' }}>
                <button type="button" onClick={() => setHoiKhoa(false)} className="tap-target flex-1 font-bold" style={{ height: 48, borderRadius: 'var(--bo-1)', background: 'var(--the-2)', color: 'var(--muc)' }}>
                  Huỷ
                </button>
                <button type="button" onClick={khoaCaNay} disabled={dangKhoa} className="tap-target flex-1 font-bold" style={{ height: 48, borderRadius: 'var(--bo-1)', background: 'var(--do)', color: 'var(--giay)' }}>
                  {dangKhoa ? 'Đang kết thúc…' : 'Kết thúc ca'}
                </button>
              </div>
              </div>
            </div>
          )}

          {/* CA ĐANG MỞ: KHÔNG còn hai cột dưới (thầy 29/09 "bỏ từ phần 12:17 chỉ để lại phần trên") — mọi thứ đã cắm vào khu trên ở trên. */}
          {chiTiet.ca.trangThai !== 'mo' && (
          <div className="ca-luoi">
          <div className="ca-cot ca-cot-phai">
          {vePhongCho()}
          <KhoiThoiGianCa
            ca={chiTiet.ca}
            themPhut={{
              tong: chiTiet.themPhutTong,
              chay: () => themPhutCa(chiTiet.ca.maCa),
              onXong: (k) => {
                showToast(cauKetQuaThemPhut(k), 'success')
                void tai(chiTiet.ca.maCa, true) // tải lại: giờ hết chung mới (thoiGianPhut đã cộng) hiện ngay ở đồng hồ
              },
            }}
          >
            {/* THẺ THÔNG TIN CA CŨ ĐÃ BỎ (thầy 29/09: "bỏ phần phía dưới này của theo dõi ca thi vì trùng chức năng với phần trên"). Kiểm từng dòng:
                - "● Ca đang mở" + "Kết thúc ca: bấm…" ⇒ BỎ: trùng chấm "Ca đang mở" + nút "Kết thúc ca ngay" (có câu hỏi lại) ở Việc nhanh phía trên.
                - "Link vào thi" ⇒ BỎ ở ca đang mở: trùng nút "Chép link" đầu màn. "Link xem điểm" ⇒ DỜI lên cạnh "Chép link" (TheoDoiCa).
                  Ca đã kết thúc (không có đầu màn Theo dõi) ⇒ hai nút nhỏ ở đây.
                - Cửa vào ca, giờ bắt đầu phòng chờ, nút Mở ca (khi quá giờ vào / đã khoá), câu em sai buổi trước, em bị chặn ở cổng danh sách, Xoá ca này
                  ⇒ không có chỗ nào khác làm được ⇒ DỜI GỌN vào đáy thẻ Thời gian này (một thẻ thay cho hai). */}
            <div className="gv-monitor-overview" style={{ display: 'contents' }}>
              {veCuaVao()}
              {veSaiLai()}
              {veBiChan()}
              <div className="ca-hang-nut">
                {/* Ca đã đóng: không có đầu màn Theo dõi ⇒ hai link nhỏ ở đây. */}
                  <>
                    <button type="button" className="ca-nut-nho" onClick={copyLink}>
                      {daCopy ? <Check size={16} aria-hidden /> : <LogIn size={16} aria-hidden />}
                      {daCopy ? 'Đã copy' : 'Link vào thi'}
                    </button>
                    <button type="button" className="ca-nut-nho" onClick={copyLinkDiem} title="Em nhập số báo danh là mở đúng màn hình lúc vừa nộp. Gửi được sau khi đã dựng phiếu cho ca.">
                      {daCopyDiem ? <Check size={16} aria-hidden /> : <BarChart3 size={16} aria-hidden />}
                      {daCopyDiem ? 'Đã copy' : 'Link xem điểm'}
                    </button>
                  </>
                <button type="button" onClick={() => setHoiXoa(true)} className="ca-nut-nho ca-nut-nho--do">
                  <Trash2 size={14} aria-hidden /> Xoá ca này
                </button>
              </div>
            </div>
          </KhoiThoiGianCa>

          {veCanhBao()}
          {/* GỌI LÊN BẢNG đã GỠ khỏi màn này (thầy chốt 05/09). Nó có màn riêng
              ở thanh điều hướng, chọn được nhiều đề và nhiều lớp. Nhét thêm
              vào đây thì màn coi thi dài gấp đôi, mà lúc đang coi thi thì thầy
              chưa chữa bài — chữa bài là việc sau khi ca xong. */}

          </div>
          <div className="ca-cot ca-cot-trai">
          {/* Báo cáo lớp cũ (khối gập) đã THAY bằng màn Kết thúc ca + Báo cáo chi tiết (ca thi 28/09). */}
          {/* DANH SÁCH EM */}
          <TheNoiDung className="gv-monitor-students">
            <div style={{ ...TIEU_DE_MUC, marginBottom: 'var(--k3)' }}>Học sinh trong ca ({dsEm.length})</div>
            <ThanhTabCa muc={mucTab} dangChon={tabHieu} doi={setTabEm} idBang="ca-bang-em" />
            {/* EM CHƯA CÓ TÊN (thầy báo 07/09). Em vào thi chỉ gõ số báo danh
                nên cột tên của lượt bỏ trống, và phiếu gửi phụ huynh in
                "SBD 10038" thay vì tên con. Danh sách lớp có sẵn tên, chỉ cần
                một nút kéo sang. Nút chỉ hiện khi thật sự có em thiếu tên. */}
            {veThieuTen()}
            <div id="ca-bang-em" className="ca-bang" role="tabpanel" aria-labelledby={`ca-tab-${tabHieu}`}>
            {tabHieu === 'cho' ? (
              emChoVao.length === 0 ? (
                <div className="ca-rong">Chưa em nào đứng ở phòng chờ.</div>
              ) : (
                emChoVao.map((x) => (
                  <div key={`cho-${x.sbd}`} className="ca-hang ca-hang--don" data-trang-thai="Đang chờ">
                    <span className="ca-o ca-o-em">
                      <span className="ca-ten">{x.hoTen || '(chưa có tên)'}</span>
                      <span style={NHAN_NHO}>
                        SBD <span style={SO}>{x.sbd}</span>
                        {x.vaoLuc ? ` · vào chờ ${gio(x.vaoLuc)}` : ''}
                      </span>
                    </span>
                    <span className="ca-o ca-o-tt">
                      <Nhan tone="xam">Đang chờ</Nhan>
                    </span>
                  </div>
                ))
              )
            ) : tabHieu === 'chua_vao' ? (
              emChuaVao.length === 0 ? (
                <div className="ca-rong">Em được mời đã vào hết.</div>
              ) : (
                emChuaVao.map((sbd) => (
                  <div key={`chua-${sbd}`} className="ca-hang ca-hang--don" data-trang-thai="Chưa vào">
                    <span className="ca-o ca-o-em">
                      <span className="ca-ten">{classList.find((c) => c.sbd === sbd)?.hoTen || '(chưa có tên)'}</span>
                      <span style={NHAN_NHO}>
                        SBD <span style={SO}>{sbd}</span>
                      </span>
                    </span>
                    <span className="ca-o ca-o-tt">
                      <Nhan tone="xam">Chưa vào</Nhan>
                    </span>
                  </div>
                ))
              )
            ) : dsEm.length === 0 ? (
              <div style={NHAN_NHO}>Chưa có em nào vào thi.</div>
            ) : dsHienThi.length === 0 ? (
              <div className="ca-rong">Không có em nào ở mục này.</div>
            ) : (
              <>
                <div className="ca-bang-dau" aria-hidden="true">
                  <span>HỌC SINH</span>
                  <span>TRẠNG THÁI</span>
                  <span>TIẾN ĐỘ</span>
                  <span>{hoa2 ? 'RỜI MÀN' : 'CHỐNG GIAN LẬN'}</span>
                  <span>ĐIỂM</span>
                </div>
                {dsHienThi.map((e) => {
                  const l = e.moiNhat
                  const nh = nhanCuaLuot(l)
                  const daNop = l.trangThai === 'da_nop' || l.trangThai === 'khoa'
                  return (
                    <div key={e.sbd} className="ca-hang" data-trang-thai={nh.ten}>
                      <span className="ca-o ca-o-em">
                        <span className="flex items-center flex-wrap" style={{ gap: 6 }}>
                          {/* CHẠM TÊN EM → hồ sơ đầy đủ ngay trong màn này:
                              mạnh–yếu và lịch sử ca. */}
                          <button
                            type="button"
                            onClick={() => setSbdHoSo(e.sbd)}
                            className="tap-target font-bold inline-flex items-center text-left"
                            style={{ fontFamily: 'var(--serif)', fontSize: 'var(--cx-2)', color: 'var(--muc)', gap: 2, background: 'none', border: 'none', padding: 0, minHeight: 44, textDecoration: 'underline', textDecorationColor: 'var(--vien-dam)', textUnderlineOffset: 3 }}
                          >
                            {e.hoTen || '(chưa có tên)'}
                            <ChevronRight size={14} style={{ color: 'var(--mo)' }} />
                          </button>
                          {l.lanThu > 1 && <Nhan tone="tim">lần {l.lanThu}</Nhan>}
                        </span>
                        <span style={NHAN_NHO}>
                          SBD <span style={SO}>{e.sbd}</span>
                          {daNop && l.nopLuc ? ` · nộp ${gio(l.nopLuc)}` : l.trangThai === 'dang_lam' && l.vaoLuc ? ` · vào ${gio(l.vaoLuc)}` : ''}
                          {l.ghiChu ? ` · ${l.ghiChu}` : ''}
                        </span>
                        {e.cacLuotCu.length > 0 && (
                          <span className="block" style={{ ...NHAN_NHO, color: 'var(--mo)' }}>
                            {e.cacLuotCu.map((c) => `lần ${c.lanThu}: ${c.tong !== null && c.tong !== undefined ? c.tong.toFixed(2) : c.trangThai === 'khoa' ? 'khoá' : '—'}${c.nopLuc ? ` · ${gio(c.nopLuc)}` : ''}`).join(' · ')}
                          </span>
                        )}
                      </span>
                      <span className="ca-o ca-o-tt">
                        <Nhan tone={nh.tone}>{nh.ten}</Nhan>
                      </span>
                      <span className="ca-o ca-o-tien">
                        {l.dapAn && tongCauDe ? (
                          <>
                            <span className="ca-tien-thanh" aria-hidden="true">
                              <i style={{ width: `${Math.min(100, Math.round((demCauDaLam(l.dapAn) / tongCauDe) * 100))}%` }} />
                            </span>
                            <span className="ca-tien-so">
                              <span className="ca-vh">Đã làm </span>
                              {demCauDaLam(l.dapAn)}/{tongCauDe}
                              <span className="ca-vh"> câu</span>
                            </span>
                          </>
                        ) : (
                          <span className="ca-khong" aria-label="Chưa có số liệu tiến độ">—</span>
                        )}
                      </span>
                      <span className="ca-o ca-o-gian">
                          {daNop && l.soLanRoiMan > 0 && <Nhan tone="cam">rời màn {l.soLanRoiMan} lần / {l.tongGiayRoiMan}s</Nhan>}
                          {!daNop && l.soLanRoiMan > 0 && <span className="ca-gian-so">{l.tongGiayRoiMan}s ngoài màn</span>}
                          {/* GIỮ ĐỂ ĐỌC (GIUDEDOC mục 4F): hai con số, KHÔNG tô
                              đỏ, KHÔNG gọi là vi phạm. Nhả tay là chuyện bình
                              thường; nhưng đề tắt 20 phút trong ca 50 phút là
                              điều thầy nên nhìn. */}
                          {chuTatDe(l.integrity) && <Nhan tone="xam">{chuTatDe(l.integrity)}</Nhan>}
                          {l.soLanRoiMan === 0 && !chuTatDe(l.integrity) && <span className="ca-khong" aria-label="Không có cảnh báo">—</span>}
                      </span>
                      <span className="ca-hd">
                        {veHanhDongEm(e)}
                      </span>
                      <span className="ca-o ca-o-diem">
                        <span className="block font-bold" style={{ ...SO, fontSize: 'var(--cx-4)', color: e.diem === null ? 'var(--mo)' : 'var(--muc)' }}>
                          {e.diem === null ? '—' : e.diem.toFixed(2)}
                        </span>
                        {e.diem !== null && <span style={NHAN_NHO}>{classify(e.diem)}</span>}
                        {/* CA ĐỀ RIÊNG: câu hỏi lại của riêng em này. Luôn kèm
                            chữ, không dùng riêng màu. */}
                        {e.lap && e.lap.tong > 0 && (
                          <span className="block" style={{ ...NHAN_NHO, ...SO }}>
                            {e.lap.tong} hỏi lại · {e.lap.daSua} đã sửa · {e.lap.saiLai} sai lại
                          </span>
                        )}
                      </span>
                    </div>
                  )
                })}
              </>
            )}
            </div>
          </TheNoiDung>

          {/* HAI THẺ "XUẤT KẾT QUẢ" VÀ "TẢI ĐỀ & LỜI GIẢI" ĐÃ GỠ — thầy chốt
              15/09: "Xóa luôn phần này trên app gv. Chuyển nút xóa lên phần
              còn lại." Nút "Xoá ca này" nay nằm cuối thẻ thông tin ca, cùng
              chỗ với Bắt đầu thi và Khoá ca. */}
          {/* CÂU HỎI CỦA EM (HOIBAITHAY.md mục 4C). Không gọi máy chủ cho tới
              khi thầy bấm — Chi tiết ca đã đủ nặng, thêm một lệnh nữa mỗi lần
              mở màn là đi ngược việc giảm tải vừa làm. */}
          </div>
          </div>
          )}

          {/* BÁO PHỤ HUYNH — thầy đọc lại, sửa, rồi mới gửi */}
          {tinBao && (
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ background: 'var(--phu)' }}>
              <div className="w-full flex flex-col" style={{ maxWidth: 460, background: 'var(--the)', borderRadius: 'var(--bo-3)', padding: 'var(--k5)', gap: 'var(--k3)', boxShadow: 'var(--bong-2)' }}>
                <div className="font-bold" style={{ fontFamily: 'var(--serif)', fontSize: 'var(--cx-4)' }}>
                  Báo phụ huynh · SBD <span style={SO}>{tinBao.sbd}</span>
                </div>
                <OThongBao tone="cam">
                  Máy chỉ đo được em rời khỏi màn làm bài mấy lần, mấy giây. Một cuộc gọi đến cũng cho đúng tín hiệu đó, nên tin này nêu dữ kiện, không kết luận gian lận. Thầy sửa lại trước khi gửi.
                </OThongBao>
                <textarea
                  value={tinBao.noiDung}
                  onChange={(ev) => setTinBao({ ...tinBao, noiDung: ev.target.value })}
                  style={{ width: '100%', minHeight: 140, borderRadius: 'var(--bo-1)', padding: 'var(--k3)', background: 'var(--the-2)', border: '1.5px solid transparent', fontFamily: 'var(--sans)', fontSize: 'var(--cx-2)', color: 'var(--muc)', lineHeight: 1.6 }}
                  aria-label="Nội dung tin báo phụ huynh"
                />
                <div className="flex" style={{ gap: 'var(--k2)' }}>
                  <NutChinh variant="phu" onClick={() => setTinBao(null)}>
                    Huỷ
                  </NutChinh>
                  <NutChinh onClick={guiBaoPhuHuynh} disabled={dangGuiBao || !tinBao.noiDung.trim()}>
                    {dangGuiBao ? 'Đang gửi…' : 'Gửi'}
                  </NutChinh>
                </div>
              </div>
            </div>
          )}

          {hoiXoa && (
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ background: 'var(--phu)' }}>
              <div className="w-full flex flex-col" style={{ maxWidth: 400, background: 'var(--the)', borderRadius: 'var(--bo-3)', padding: 'var(--k5)', gap: 'var(--k3)', boxShadow: 'var(--bong-2)' }}>
                <div className="font-bold" style={{ fontFamily: 'var(--serif)', fontSize: 'var(--cx-4)' }}>
                  Xoá ca {chiTiet.ca.maCa}?
                </div>
                <OThongBao tone="do">
                  Xoá ca này sẽ xoá luôn bài làm của <b style={SO}>{tk.daVao}</b> em, không khôi phục được.
                </OThongBao>
                <div style={NHAN_NHO}>Gõ đúng mã ca để xác nhận:</div>
                <input style={{ ...O_NHAP, ...SO, letterSpacing: '.15em' }} placeholder={chiTiet.ca.maCa} value={maXoa} onChange={(e) => setMaXoa(e.target.value)} inputMode="numeric" autoFocus aria-label="Gõ mã ca để xác nhận xoá" />
                <div className="flex" style={{ gap: 'var(--k2)' }}>
                  <NutChinh
                    variant="phu"
                    onClick={() => {
                      setHoiXoa(false)
                      setMaXoa('')
                    }}
                  >
                    Huỷ
                  </NutChinh>
                  <NutChinh variant="nguyhiem" onClick={handleXoa} disabled={dangXoa || maXoa.trim() !== chiTiet.ca.maCa}>
                    {dangXoa ? 'Đang xoá…' : 'Xoá ca'}
                  </NutChinh>
                </div>
              </div>
            </div>
          )}
        </>
      )}

      {/* MODAL BÁO CÁO CA THI HỌC SINH CHUẨN GOOGLE MATERIAL 3 */}
      {chieuMa && chiTiet && (
        <TamPhuChieuMa
          maCa={chiTiet.ca.maCa}
          tenCa={chiTiet.ca.tenCa || ''}
          diaChi={`${location.host}${import.meta.env.BASE_URL}t/${chiTiet.ca.maCa}`}
          soEmCho={chiTiet.ca.phongCho && !chiTiet.ca.batDauThiLuc ? (chiTiet.dsCho ?? []).length : null}
          onDong={() => setChieuMa(false)}
          lop={chiTiet.ca.lop || ''}
          link={`${location.origin}${import.meta.env.BASE_URL}t/${chiTiet.ca.maCa}`}
          kiemTraGi={moTaCaChieuMa({
            phamViHoiLai: (chiTiet.ca as { phamViHoiLai?: string }).phamViHoiLai,
            deRieng: (chiTiet.ca as { deRieng?: boolean }).deRieng === true || caCanDeRieng,
            lenBang: chiTiet.ca.lenBang === true,
            thoiGianPhut: chiTiet.ca.thoiGianPhut,
            // Số câu mỗi phần của CA (mẫu số); ca không lưu thì đếm câu trong đề đã gộp (ca "lấy trọn kho").
            soCau: soCauCa ?? (teacherBank ? { I: teacherBank.reduce((a, b) => a + b.phanI.length, 0), II: teacherBank.reduce((a, b) => a + b.phanII.length, 0), III: teacherBank.reduce((a, b) => a + b.phanIII.length, 0) } : null),
          })}
          hoiPhongCho={async () => {
            // Tự làm mới 5 giây (thầy 28/09) — cùng lệnh chiTietCa của màn này; chỉ tên em đã vào.
            const ct = await chiTietCa(scriptUrl.trim(), secret.trim(), chiTiet.ca.maCa)
            return { em: gopEmDaVao(ct.dsCho, ct.luot), siSo: Array.isArray(ct.ca.danhSachMoi) ? ct.ca.danhSachMoi.length : null }
          }}
        />
      )}

      {chiTiet && (moBaoCao !== null || !!sbdHoSo) && (
        <BaoCaoChiTiet
          maCa={chiTiet.ca.maCa}
          tenCa={tenHienCua(chiTiet.ca.tenCa, chiTiet.ca.maCa)}
          lopCa={chiTiet.ca.lop || ''}
          ngay={(() => {
            const t = Date.parse(String(chiTiet.ca.batDau || chiTiet.ca.moLuc || ''))
            return Number.isFinite(t) ? new Date(t).toLocaleDateString('vi-VN', { timeZone: 'Asia/Ho_Chi_Minh' }) : ''
          })()}
          thoiGianPhut={chiTiet.ca.thoiGianPhut}
          siSo={Array.isArray(chiTiet.ca.danhSachMoi) ? chiTiet.ca.danhSachMoi.length : dsEm.length}
          lop={bcMay?.lop ?? null}
          them={bcMay?.them ?? null}
          dangTai={dangTaiBc}
          dsEm={dsEm.map((e) => ({ sbd: e.sbd, hoTen: e.hoTen, soLanRoiMan: e.moiNhat.soLanRoiMan, nopLuc: String(e.moiNhat.nopLuc || '') }))}
          tab={sbdHoSo && moBaoCao !== 'lop' ? 'em' : (moBaoCao ?? 'lop')}
          onTab={setMoBaoCao}
          sbdEm={sbdHoSo}
          onChonEm={setSbdHoSo}
          emBc={baoCaoMotEmHienThi}
          onDong={() => {
            setMoBaoCao(null)
            setSbdHoSo('')
          }}
          viecVoiEm={(() => {
            // Ca đang mở: bảng từng em đã bỏ (thầy 29/09) ⇒ việc của em nằm trong hồ sơ em. Chỉ vẽ khi em có việc để làm.
            const e = chiTiet.ca.trangThai === 'mo' ? dsEm.find((x) => x.sbd === sbdHoSo) : undefined
            if (!e) return null
            const t = e.moiNhat.trangThai
            const coViec = t === 'khoa' || t === 'da_nop' || (t === 'duoc_duyet_lai' && e.moiNhat.khoaMay !== false) || (!hoa2 && e.moiNhat.soLanRoiMan > 0)
            return coViec ? veHanhDongEm(e) : null
          })()}
          onToanCanh={(sbd) => moToanCanh(sbd)}
          onGiaoRieng={(sbd) => {
            datSbdGiaoRieng(sbd) // màn Giao bài mở sẵn chế độ chọn từng em, đã tick em này
            setScreen('giaobtvn')
          }}
        />
      )}
    </div>
  )
}
