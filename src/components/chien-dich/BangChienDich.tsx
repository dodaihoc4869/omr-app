// BẢNG CHIẾN DỊCH khi đang chạy (bản vẽ docs/ban-ve-gv-2809/GV-BangChienDich, thầy chốt 28/09) — dữ liệu từ `bang`.
// 5 thẻ số (Đã làm qua · Thành thạo · Đúng nhịp · Quá tải hôm nay · Cần thầy dạy lại, có mẫu số + so với hôm qua) ·
// heatmap em × dạng (MỘT dải xanh nhạt → đậm theo hạng Yếu/Trung bình/Khá/Giỏi, số % in trong ô, "Chưa làm" gạch chéo) ·
// nhịp của lớp · "Cần thầy dạy lại" (hộp cuộn) + "Chiếu cả N câu lên bảng" · hạng của lớp theo dạng.
// HẠNG dùng ĐÚNG ngưỡng thuật toán (`hangTuTiLe`): Yếu < 40% · Trung bình 40–65% · Khá 65–85% · Giỏi > 85% (bản vẽ ghi 40/60/80 — đã sửa).
// Chữa sớm giữa kỳ: chiếu CẢ danh sách (thầy 05/10), chữa xong thì bấm "Chữa xong cả N câu" (hỏi lại, nói rõ hậu quả) ⇒ `chua-xong` với đủ N câu.
// OMNI 3 (05/10 — hình docs/omni-0510/GV-BangBai.jpg, chỉ lấy NỘI DUNG): khi `/gv/omni bang` có số (prop `omni`, màn cha nạp) — ô em × dạng hiện P kèm
// số câu tự làm (cùng 4 màu thang đang dùng), thêm cột "Sơ ý" và "Khoảng cách tới 8", bấm ô ⇒ "Thầy xác nhận em đã vững" / "Chưa đạt, dạy lại" (`xac-nhan`);
// thẻ "Cần thầy dạy lại" đổi tên "Cần thầy chữa", hiện đủ ba nhóm (`CanThayChuaOmni`); cuối bảng một dòng "Vi kỹ năng: … đã gắn tự động · Xem".
// Không có `omni` (OMNI tắt / máy chủ lỗi / sai dạng) ⇒ bảng cũ y nguyên, không gọi thêm lệnh nào.
import BangGoi7 from './BangGoi7'
import { useMemo, useState } from 'react'
import { useAppStore } from '../../store/appStore'
import HopXacNhan from '../HopXacNhan'
import { chuaXong, qidCuaDong, type BangChienDich as DuBang, type CauCanDayLai, type EmBang, type HangEm, type NhipEm } from './api'
import { coHanNop, congNgay, conLai, hienHanNop, hienNgay, phanTram } from './ngay'
import type { OChieu } from './to-chieu'
import { CHU_GIAI_HANG, CHU_HANG, hangTuTiLe, mucO } from './tinh'
import { THAM_SO_OMNI, type BangOmni } from '../../../server/src/omni-kieu'
import { chuDangHieuChuan, chuKhoangCach8, doTinChu, NUT_DAY_LAI, NUT_XAC_NHAN_VUNG, phanTram as phanTramOmni, soP, TIEU_DE_CAN_THAY_CHUA } from '../../lib/omni-chu'
import { xacNhanDang } from './api-omni'
import { CHU_GIAI_P, ghepCotDang, laSoYCao, mucP, tbPLop, tbSoY, type CotDang } from './omni-bang'
import CanThayChuaOmni from './CanThayChuaOmni'
import ViKyNangBai from './ViKyNangBai'
import './chien-dich.css'

export { CHU_HANG }

/** Số em hiện khi thu gọn bảng. */
export const SO_EM_THU_GON = 12

/** "Cấu tạo: Khá · Lên men: Yếu" — theo đúng thứ tự cột dạng của bảng; vắng ⇒ chuỗi rỗng. */
export function chuHangTheoDang(hang: EmBang['hangTheoDang'], dang: readonly string[]): string {
  if (!hang) return ''
  return dang.filter((d) => hang[d]).map((d) => `${d}: ${CHU_HANG[hang[d]!]}`).join(' · ')
}

/** % thành thạo TRUNG BÌNH LỚP theo dạng: máy chủ gửi (`lop.theoDang`) thì dùng; máy chủ cũ ⇒ trung bình các em có câu ở dạng đó. */
export function tbLopTheoDang(du: Pick<DuBang, 'dang' | 'em' | 'lop'>): Record<string, number | null> {
  if (du.lop.theoDang) return du.lop.theoDang
  return Object.fromEntries(
    du.dang.map((d) => {
      const ds = du.em.map((e) => e.theoDang[d]).filter((x): x is number => typeof x === 'number')
      return [d, ds.length ? ds.reduce((a, b) => a + b, 0) / ds.length : null]
    }),
  )
}

/** Đếm số dạng theo hạng lớp (Giỏi → Yếu). */
export function demHangLop(tb: Record<string, number | null>, hangMayChu?: Record<string, HangEm>): Record<HangEm, number> {
  const dem: Record<HangEm, number> = { L1: 0, L2: 0, L3: 0, L4: 0 }
  for (const [d, p] of Object.entries(tb)) {
    const h = hangMayChu?.[d] ?? (typeof p === 'number' ? hangTuTiLe(p) : null)
    if (h) dem[h]++
  }
  return dem
}

const CHU_NHIP: Record<NhipEm, string> = { vuot: 'Vượt nhịp', dung: 'Đúng nhịp', tre12: 'Trễ 1–2 ngày', tre3: 'Trễ từ 3 ngày' }

/**
 * Quy tắc hiển thị nhịp của học sinh (thầy chốt 03/10):
 * - Học sinh chưa làm câu nào: hiện "Không làm".
 * - Đúng nhịp: làm đủ full câu mỗi ngày (không tồn câu của các ngày trước) ⇒ hiện "Đúng nhịp".
 * - Trễ nhịp: thay bằng tổng số câu tồn của những ngày trước ⇒ hiện "Tồn X câu".
 */
export function thongTinNhip(e: EmBang, soCauCanTruoc: number, soCauMoiNgay: number) {
  if (e.treNhip == null || e.coXat === 0) {
    return {
      chu: 'Không làm',
      kieu: 'khong_lam' as const,
      ton: typeof e.soCauTon === 'number' ? e.soCauTon : soCauCanTruoc,
      laDo: false,
      moTa: 'Chưa làm câu nào từ khi giao chiến dịch',
    }
  }
  const ton = typeof e.soCauTon === 'number' ? e.soCauTon : Math.max(0, soCauCanTruoc - e.coXat)
  if (ton === 0) {
    return {
      chu: 'Đúng nhịp',
      kieu: 'dung' as const,
      ton: 0,
      laDo: false,
      moTa: `Đã làm đủ ${e.coXat}/${soCauCanTruoc} câu của những ngày trước (đúng nhịp)`,
    }
  }
  const laDo = ton >= soCauMoiNgay * 2
  return {
    chu: `Tồn ${ton} câu`,
    kieu: 'tre' as const,
    ton,
    laDo,
    moTa: `Tồn ${ton} câu của những ngày trước (đã làm ${e.coXat}/${soCauCanTruoc} câu)`,
  }
}

/**
 * Thứ tự em trong bảng chiến dịch (thầy 03/10: "Ưu tiên không làm lên đầu xong mới đến số câu tồn cao nhất"):
 * 1. Ưu tiên học sinh "Không làm" lên đầu tiên (chưa làm câu nào từ khi giao chiến dịch).
 * 2. Tiếp theo là các em có tồn câu, xếp theo số câu tồn cao nhất (ton giảm dần).
 * 3. Cuối cùng là các em Đúng nhịp (tồn = 0).
 * 4. Khi cùng số câu tồn: em thành thạo thấp hơn lên trước, hoà thì theo tên tiếng Việt.
 */
export function sapEmYeuTruoc(em: readonly EmBang[], soCauCanTruoc = 0, soCauMoiNgay = 1): EmBang[] {
  return [...em].sort((a, b) => {
    const nhipA = thongTinNhip(a, soCauCanTruoc, soCauMoiNgay)
    const nhipB = thongTinNhip(b, soCauCanTruoc, soCauMoiNgay)
    const khongLamA = nhipA.kieu === 'khong_lam'
    const khongLamB = nhipB.kieu === 'khong_lam'

    // 1. Ưu tiên "Không làm" lên đầu (thầy 03/10)
    if (khongLamA !== khongLamB) return khongLamA ? -1 : 1

    // 2. Xong mới đến số câu tồn cao nhất (tồn nhiều hơn lên trên)
    if (nhipB.ton !== nhipA.ton) return nhipB.ton - nhipA.ton

    // 3. Cùng số câu tồn: thành thạo thấp hơn lên trước, hoà thì theo tên tiếng Việt
    return a.thanhThao - b.thanhThao || a.ten.localeCompare(b.ten, 'vi')
  })
}

/** Người lên bảng cho mỗi câu cần dạy lại: em thành thạo dạng ấy nhiều nhất, không lặp em nếu còn em khác. */
/** Mức độ trong kho (biet · hieu · van_dung) → chữ chuẩn trên màn. */
const TEN_MUC_DO_CAU: Record<string, string> = { biet: 'Nhận biết', hieu: 'Thông hiểu', van_dung: 'Vận dụng' }

export function nguoiGiaiMau(cau: readonly CauCanDayLai[], em: readonly EmBang[]): OChieu[] {
  const daGoi = new Set<string>()
  return cau.map((c) => {
    const xep = [...em].sort((a, b) => (b.theoDang[c.dang] ?? -1) - (a.theoDang[c.dang] ?? -1) || b.thanhThao - a.thanhThao)
    const e = xep.find((x) => !daGoi.has(x.sbd)) ?? xep[0]
    if (e) daGoi.add(e.sbd)
    return {
      qid: c.qid,
      stt: c.stt,
      phan: c.phan ?? 'I',
      mucDo: c.mucDo ?? null,
      sbd: e?.sbd ?? '',
      ten: e?.ten ?? 'Cả lớp',
      viSao: `${c.soEm} em cần thầy dạy lại`,
    }
  })
}

/** Chênh lệch điểm % so với hôm qua: "▲ 8 hôm qua" / "▼ 2 hôm qua" / "bằng hôm qua". */
function chuChenh(nay: number, homQua: number | undefined): { chu: string; huong: 'len' | 'xuong' | 'bang' } | null {
  if (typeof homQua !== 'number' || !Number.isFinite(homQua)) return null
  const d = Math.round(nay * 100) - Math.round(homQua * 100)
  if (d === 0) return { chu: 'bằng hôm qua', huong: 'bang' }
  return { chu: `${d > 0 ? '▲' : '▼'} ${Math.abs(d)} điểm so với hôm qua`, huong: d > 0 ? 'len' : 'xuong' }
}

export default function BangChienDich({
  du,
  nowMs,
  dangChieu,
  onChieu,
  onDaChua,
  omni = null,
  onOmniDoi,
  chiChua = false,
}: {
  du: DuBang
  nowMs: number
  dangChieu: boolean
  onChieu: (ds: OChieu[], tenBuoi: string) => Promise<boolean>
  /** Gọi sau khi "Chữa xong" thành công để nạp lại bảng. */
  onDaChua: () => void
  /** Bảng bài OMNI 3 (`/gv/omni bang`) — vắng ⇒ bảng cũ y nguyên. */
  omni?: BangOmni | null
  /** Gọi sau khi thầy xác nhận một dạng để màn cha nạp lại Bảng bài OMNI. */
  onOmniDoi?: () => void
  /** Hành trình › Cần thầy chữa (09/10 tối): CHỈ khối Cần thầy chữa (danh sách · chiếu · Chữa xong) — cả với Hành trình (bỏ bảng tiến độ). */
  chiChua?: boolean
}) {
  const [goi7Bat,setGoi7Bat]=useState(false)
  const showToast = useAppStore((s) => s.showToast)
  const [caLop, setCaLop] = useState(false)
  const [daChieu3, setDaChieu3] = useState(false)
  const [hoiChua, setHoiChua] = useState(false)
  const [dangChua, setDangChua] = useState(false)

  const cd = du.chienDich
  const soCau = Math.max(1, cd.soCau)
  const tb = useMemo(() => tbLopTheoDang(du), [du])
  // Dạng xếp theo cả lớp yếu nhất bên trái (dạng không có số đứng cuối).
  const dang = useMemo(() => [...du.dang].sort((a, b) => (tb[a] ?? 2) - (tb[b] ?? 2)), [du.dang, tb])
  // OMNI 3: cột dạng = cột cũ (đúng thứ tự) ghép mã dạng OMNI; dạng chỉ OMNI có thêm vào cuối. Vắng OMNI ⇒ đúng cột cũ.
  const om = omni
  const cot = useMemo<CotDang[]>(() => (om ? ghepCotDang(dang, om.dang) : dang.map((ten) => ({ ten, ma: null, moi: false }))), [om, dang])
  const [oChon, setOChon] = useState<{ sbd: string; ten: string; ma: string; tenDang: string; p: number; n: number } | null>(null)
  const [dangXacNhan, setDangXacNhan] = useState(false)
  const soYLop = om ? tbSoY(om) : null
  // Chữa MỘT LẦN cả danh sách (thầy 05/10: "cho chữa tất cả 1 lần") — trước chỉ 3 câu đầu.
  const ba = du.canDayLai
  const luotBa = ba.reduce((s, c) => s + c.soEm, 0)
  const lop = du.lop
  const soEm = du.em.length || cd.soEm
  const tbCoXat = Math.round(lop.coXat * soCau)
  const chenhCoXat = chuChenh(lop.coXat, lop.homQua?.coXat)
  const chenhThanhThao = chuChenh(lop.thanhThao, lop.homQua?.thanhThao)
  const soTre = lop.nhip ? lop.nhip.tre12 + lop.nhip.tre3 : null
  const soDangYeu = dang.filter((d) => typeof tb[d] === 'number' && hangTuTiLe(tb[d]!) === 'L1').length
  const hangLop = demHangLop(tb, lop.hangTheoDang)
  const tongHang = hangLop.L1 + hangLop.L2 + hangLop.L3 + hangLop.L4

  const ngayThu = lop.ngayThu ?? (() => {
    if (!du.homNay || !cd.hanNop) return 1
    const msGiao = Date.parse(cd.taoLuc || '')
    const ngayGiao = Number.isFinite(msGiao) ? new Date(msGiao).toISOString().slice(0, 10) : du.homNay
    const msG = Date.parse(ngayGiao)
    const msH = Date.parse(cd.hanNop)
    const msN = Date.parse(du.homNay)
    if (!Number.isFinite(msG) || !Number.isFinite(msH) || !Number.isFinite(msN)) return 1
    const tong = Math.max(1, Math.round((msH - msG) / 86_400_000) + 1)
    return Math.max(1, Math.min(tong, Math.round((msN - msG) / 86_400_000) + 1))
  })()
  const tongNgay = Math.max(1, lop.tongNgay ?? (() => {
    if (!cd.hanNop) return 1
    const msGiao = Date.parse(cd.taoLuc || '')
    const ngayGiao = Number.isFinite(msGiao) ? new Date(msGiao).toISOString().slice(0, 10) : (du.homNay || cd.hanNop)
    const msG = Date.parse(ngayGiao)
    const msH = Date.parse(cd.hanNop)
    if (!Number.isFinite(msG) || !Number.isFinite(msH)) return 1
    return Math.max(1, Math.round((msH - msG) / 86_400_000) + 1)
  })())

  const laHetHan = du.hetHan || (cd.hanNop && du.homNay ? cd.hanNop < du.homNay : false)
  const soNgayTruoc = laHetHan ? tongNgay : Math.max(0, ngayThu - 1)
  const soCauCanTruoc = Math.round(soCau * (soNgayTruoc / tongNgay))
  const soCauMoiNgay = Math.max(1, Math.round(soCau / tongNgay))

  // Những bạn nào tồn đẩy lên đầu, tồn nhiều lên trên (thầy 03/10)
  const dsEm = useMemo(() => sapEmYeuTruoc(du.em, soCauCanTruoc, soCauMoiNgay), [du.em, soCauCanTruoc, soCauMoiNgay])
  const hien = caLop ? dsEm : dsEm.slice(0, SO_EM_THU_GON)

  const thongKeNhipLop = useMemo(() => {
    let khongLam = 0
    let tre = 0
    let dung = 0
    for (const e of dsEm) {
      const inf = thongTinNhip(e, soCauCanTruoc, soCauMoiNgay)
      if (inf.kieu === 'khong_lam') khongLam++
      else if (inf.kieu === 'tre') tre++
      else dung++
    }
    return { khongLam, tre, dung }
  }, [dsEm, soCauCanTruoc, soCauMoiNgay])
  const coNhipMayChu = typeof lop.dungNhip === 'number' || !!lop.nhip

  const chieuBa = async () => {
    const ok = await onChieu(nguoiGiaiMau(ba, du.em), `Chữa sớm · ${cd.ten}`)
    if (ok) setDaChieu3(true)
  }
  const chuaBa = async () => {
    setDangChua(true)
    const r = await chuaXong(cd.id, ba.flatMap(qidCuaDong))
    setDangChua(false)
    setHoiChua(false)
    if (!r.ok) {
      showToast(r.chu, 'warn')
      return
    }
    showToast(`Đã ghi chữa xong: ${r.du.soLuot} lượt em, ôn lại từ ${hienNgay(r.du.ngayOnLai)}`, 'success')
    setDaChieu3(false)
    onDaChua()
  }

  const xacNhan = async (ket: 'vung' | 'day_lai') => {
    if (!oChon || dangXacNhan) return
    setDangXacNhan(true)
    const r = await xacNhanDang(oChon.sbd, oChon.ma, ket)
    setDangXacNhan(false)
    if (!r.ok) {
      showToast(r.chu, 'warn')
      return
    }
    showToast(ket === 'vung' ? `Đã ghi: ${oChon.ten} vững dạng ${oChon.tenDang}` : `Đã ghi: ${oChon.ten} cần dạy lại dạng ${oChon.tenDang}`, 'success')
    setOChon(null)
    onOmniDoi?.()
  }

  // Khối "Cần thầy chữa / dạy lại" + hộp hỏi lại "Chữa xong" — MỘT bản JSX dùng cho cả bảng đầy đủ lẫn chế độ `chiChua`
  // (Hành trình › Cần thầy chữa, trung tu 09/10 tối: chỉ khối này, không bảng từng em / ô số / nhịp lớp).
  const theCanChua = (
    <section className="cd-the cd-the--nhan" aria-labelledby="cd-can-day-lai">
      <div className="cd-the-dau">
        <h2 id="cd-can-day-lai">{om ? TIEU_DE_CAN_THAY_CHUA : 'Cần thầy dạy lại'}</h2>
        <span className="cd-so cd-phu">
          {lop.canDayLaiCau} câu · {lop.canDayLaiLuot} lượt em
        </span>
      </div>
      {om ? (
        <CanThayChuaOmni ds={om.canThayChua} canDayLai={du.canDayLai} chienDichId={cd.id} homNay={du.homNay} onDaChua={onDaChua} />
      ) : (
        <p className="cd-phu">Câu em sai từ 4 lần, lần cuối vẫn sai — đã tạm rời game, chờ thầy chữa.</p>
      )}
      {om ? null : du.canDayLai.length === 0 ? (
        <p className="cd-phu">Chưa có câu nào cần thầy dạy lại — các em đang tự ôn được.</p>
      ) : (
        // Hộp cuộn (thầy 05/10): danh sách dài không đẩy nút chiếu xuống tận cuối trang.
        <div className="cd-ds-cau-cuon" tabIndex={0} role="region" aria-label={`Danh sách ${du.canDayLai.length} câu cần thầy dạy lại`}>
        <ol className="cd-ds-cau">
          {du.canDayLai.map((c) => (
            <li key={c.qid}>
              <span>
                <b>Câu {c.stt}</b> · {c.dang}
                {c.mucDo && <small className="cd-phu"> · {TEN_MUC_DO_CAU[c.mucDo] ?? c.mucDo}</small>}
              </span>
              <b className="cd-so">{c.soEm} em</b>
            </li>
          ))}
        </ol>
        </div>
      )}
      <button type="button" className="m3-nut-chinh" disabled={ba.length === 0 || dangChieu} onClick={() => void chieuBa()}>
        {dangChieu ? 'Đang mở tờ chiếu…' : ba.length > 1 ? `Chiếu cả ${ba.length} câu lên bảng` : 'Chiếu câu này lên bảng'}
      </button>
      <p className="cd-phu">Chữa sớm giữa kỳ: chữa xong, câu quay lại Đoàn Hộ Tống của các em từ hôm sau.</p>
      {daChieu3 && (
        <button type="button" className="m3-nut-vien cd-nut-nho" onClick={() => setHoiChua(true)}>
          {ba.length > 1 ? `Chữa xong cả ${ba.length} câu` : 'Chữa xong câu này'}
        </button>
      )}
    </section>
  )
  const hopChua = hoiChua && (
    <HopXacNhan
      tieuDe={ba.length > 1 ? `Chữa xong cả ${ba.length} câu?` : 'Chữa xong câu này?'}
      noiDung={
        <p>
          {luotBa} lượt em đang “Cần thầy dạy lại” ở câu {ba.map((c) => c.stt).join(', ')} được mở khoá: các câu này quay lại Đoàn Hộ Tống của các em từ{' '}
          {hienNgay(congNgay(du.homNay, 1))}. Việc này không hoàn tác được.
        </p>
      }
      nhanXacNhan="Chữa xong"
      nhanDangLam="Đang ghi…"
      dangLam={dangChua}
      onXacNhan={() => void chuaBa()}
      onHuy={() => setHoiChua(false)}
    />
  )

  if (chiChua) return (
    <>
      {(cd.hanhTrinh||cd.id.startsWith('hanh-trinh-v3-'))&&<BangGoi7 lop={cd.lop} onBat={setGoi7Bat}/>} {!goi7Bat&&theCanChua}
      {hopChua}
    </>
  )

  if (du.hanhTrinhNgay) return <><BangGoi7 lop={cd.lop} onBat={setGoi7Bat}/>{!goi7Bat&&<section className="cd-the" aria-label="Tiến độ Hành trình hôm nay">
    <h2>{cd.ten}</h2>
    <p>Hôm nay · {hienNgay(du.homNay)} · tối thiểu 24 / 30 / 36 câu theo tầng · mỗi chặng 6 câu.</p>
    <p>Kiến thức mới được tự nhận vào đúng khối sau khi duyệt. Câu thiếu hoặc chưa đủ điều kiện học được báo riêng.</p>
    <div className="cd-cuon-doc" role="region" aria-label="Tiến độ từng học sinh" tabIndex={0}>
      <table className="cd-bang"><thead><tr><th>Học sinh</th><th>Đang học</th><th>Đã làm hôm nay</th><th>Chặng đã xong</th><th>Câu cần bổ sung</th><th>Vận dụng đã đạt</th><th>Độ bao phủ đo</th></tr></thead>
        <tbody>{du.hanhTrinhNgay.em.map(e => <tr key={e.sbd}>
          <td>{e.ten}</td><td>{e.tang ? ['Nền','Hiểu','Vận dụng','Tổng hợp'][e.tang-1] : 'Chưa mở app hôm nay'}</td>
          <td>{e.toiThieu ? `${e.daLam}/${e.toiThieu} câu` : 'Chưa chốt kế hoạch'}</td>
          <td>{e.toiThieu ? `${Math.floor(e.daLam/6)}/${Math.ceil(e.toiThieu/6)} chặng` : '—'}</td>
          <td>{e.conThieu ? `${e.conThieu} câu` : '—'}{e.duPhong != null&&<small> · Dự phòng {e.duPhong} câu</small>}{!!e.canBoSung?.length&&<details><summary>Kiến thức cần bổ sung</summary><ul>{e.canBoSung.map((c,i)=><li key={i}>{c.ten} · {c.lyDo==='can_sua_nen'?'Củng cố nền':'Thêm câu đã duyệt'}</li>)}</ul></details>}</td>
          <td>{e.tienDo?.tong ? `${e.tienDo.dat}/${e.tienDo.tong} kỹ năng` : 'Chưa có phạm vi đo'}</td>
          <td>{e.tienDo?.tong ? `${e.tienDo.daDo}/${e.tienDo.tong} kỹ năng` : '—'}</td>
        </tr>)}</tbody>
      </table>
    </div>
    {du.hanhTrinhNgay.doLuong && <details><summary>Đo hiệu quả học · {du.hanhTrinhNgay.doLuong.soMauHopLe} học sinh có kết quả kiểm hợp lệ</summary>
      <p>So sánh trên đề chưa gặp, cùng phạm vi và ma trận, sau 7–14 ngày. Chưa đủ dữ liệu để kết luận mức tăng điểm.</p>
      <p>Đã phân nhóm: {du.hanhTrinhNgay.doLuong.phanNhom.map(n=>`${n.n} học sinh nhóm ${n.nhom}`).join(' · ') || 'Chưa có học sinh'}. Kết quả dưới đây chỉ gồm bài kiểm đã nộp hợp lệ.</p>
      {du.hanhTrinhNgay.doLuong.thoiGian?.map(n=><p key={n.nhom}>Nhóm {n.nhom}: {n.phutDoDuoc.toFixed(1)} phút làm câu đã đo · {n.coThoiGian}/{n.soLuot} lượt có thời gian hợp lệ ({n.baoPhu}%). Thời gian chưa đo không tính thành 0 phút.</p>)}
      {du.hanhTrinhNgay.doLuong.giuLau?.map(n=><p key={n.nhom}>Nhóm {n.nhom} sau 7–14 ngày: nhớ câu cũ {n.tyLeNho===null?'chưa có mẫu':`${Math.round(n.tyLeNho*100)}% · ${n.soEmDoNho} học sinh`}; tự giải câu mới cùng kỹ năng {n.tyLeChuyen===null?'chưa có mẫu':`${Math.round(n.tyLeChuyen*100)}% · ${n.soEmDoChuyen} học sinh`}. Đây là các lượt đã đo, chưa kết luận hiệu quả nhân quả.</p>)}
      {du.hanhTrinhNgay.doLuong.moHinh && <p>Mô hình: {du.hanhTrinhNgay.doLuong.moHinh.soMau} quan sát · {du.hanhTrinhNgay.doLuong.moHinh.soCauDaKiem} câu có độ khó vượt kiểm · chọn câu {du.hanhTrinhNgay.doLuong.moHinh.hocDaKiem?'đã vượt kiểm dự đoán':'đang tích luỹ dữ liệu'}.</p>}
      {du.hanhTrinhNgay.doLuong.ketQua.map((r,i)=><div key={i}><p>Phạm vi đo {i+1}</p><table className="cd-bang"><thead><tr><th>Nhóm</th><th>Học sinh đã đo</th><th>Điểm trung bình</th><th>Tăng so với đầu vào</th></tr></thead><tbody>{r.nhom.map(n=><tr key={n.nhom}><td>{n.nhom}</td><td>{n.n} học sinh</td><td>{n.diemTb===null?'Chưa có':`${n.diemTb.toFixed(2)}/10`}</td><td>{n.tangDiemTb===null?'Chưa có mốc tương đương':`${n.tangDiemTb.toFixed(2)} điểm`}</td></tr>)}</tbody></table></div>)}
    </details>}
  </section>}</>

  return (
    <>
      {(cd.hanhTrinh||cd.id.startsWith('hanh-trinh-v3-'))&&<BangGoi7 lop={cd.lop}/>}
      <div className="cd-dau">
        <div>
          <p className="cd-duong-dan">Cần thầy chữa › Bảng chiến dịch</p>
          <h1>
            {cd.ten}
            {cd.lop ? ` · ${cd.lop}` : ''}
          </h1>
          <p className="cd-so">
            {cd.soCau} câu · {du.dang.length} dạng · {soEm} em
            {lop.ngayThu && lop.tongNgay ? ` · ngày ${lop.ngayThu} / ${lop.tongNgay}` : ''}
            {/* Hành trình (hạn giả 9999-12-31) không có hạn nộp ⇒ không ghi hạn, không "tự chuyển sang Buổi chữa" (thầy chốt 09/10). */}
            {coHanNop(cd) ? <> · hạn nộp {hienHanNop(cd.hanNop)} ({conLai(cd.hanNop, nowMs)}) · hết hạn nộp, màn này tự chuyển sang Buổi chữa</> : null}
          </p>
        </div>
        <span className="cd-chip-muc cd-chip-muc--xanh">Đang chạy</span>
        {/* Rải đều câu mới (thầy 30/09): chip RIÊNG cạnh trạng thái, đúng chữ chuẩn — không nối vào ô Quá tải (phản biện PR 108). Máy chủ cũ không gửi ⇒ Bật. */}
        {/* Phản biện vòng 2 PR 110: chiến dịch giao trước khi có công tắc (thầy chưa đặt) ⇒ "Bật (mặc định)" để thầy biết máy tự bật. */}
        <span className={`cd-chip-muc cd-chip-muc--${cd.raiDeu === false ? 'xam' : 'xanh'}`} data-khoi="rai-deu"
          title={cd.raiDeu !== false && cd.raiDeuMacDinh ? 'Chiến dịch giao trước khi có công tắc này: app tự bật. Tắt được ở danh sách chiến dịch.' : undefined}>
          Rải đều câu mới: {cd.raiDeu === false ? 'Tắt' : cd.raiDeuMacDinh ? 'Bật (mặc định)' : 'Bật'}
        </span>
      </div>

      <div className="cd-kpi-hang" data-khoi="o-so-chien-dich">
        <div className="cd-kpi" data-mau="xd">
          <span className="cd-kpi-nhan" title="Câu em đã làm ít nhất 1 lần (trung bình lớp)">
            Đã làm qua <span className="cd-chu-thich">(câu em đã làm ít nhất 1 lần)</span>
          </span>
          <strong data-so="da-lam-qua">
            {Math.round(lop.coXat * 100)}
            <small>% câu</small>
          </strong>
          <span className="cd-kpi-phu cd-so">
            TB {tbCoXat} / {cd.soCau} câu
            {chenhCoXat && <span className={`cd-chenh cd-chenh--${chenhCoXat.huong}`}> · {chenhCoXat.chu}</span>}
          </span>
        </div>
        <div className="cd-kpi" data-mau="xl">
          <span className="cd-kpi-nhan" title="Câu đúng đủ lịch ôn, lần cuối đúng">
            Thành thạo <span className="cd-chu-thich">(đúng đủ lịch ôn, lần cuối đúng)</span>
          </span>
          <strong data-so="thanh-thao">
            {Math.round(lop.thanhThao * 100)}
            <small>% câu</small>
          </strong>
          <span className="cd-kpi-phu cd-so">
            {typeof lop.mucCanHomNay === 'number' ? `mức cần làm qua hôm nay ${phanTram(lop.mucCanHomNay)}` : 'trung bình lớp'}
            {chenhThanhThao && <span className={`cd-chenh cd-chenh--${chenhThanhThao.huong}`}> · {chenhThanhThao.chu}</span>}
          </span>
        </div>
        <div className="cd-kpi" data-mau="xd">
          <span className="cd-kpi-nhan">Đúng nhịp</span>
          <strong data-so="dung-nhip">
            {coNhipMayChu ? (dsEm.length > 0 ? thongKeNhipLop.dung : (typeof lop.dungNhip === 'number' ? lop.dungNhip : '—')) : '—'}
            <small>/ {soEm} em</small>
          </strong>
          <span className="cd-kpi-phu cd-so">
            {coNhipMayChu
              ? (dsEm.length > 0
                  ? `${thongKeNhipLop.tre} em tồn câu · ${thongKeNhipLop.khongLam} em không làm`
                  : (lop.nhip ? `${soTre} em trễ nhịp · ${lop.nhip.tre3} em từ 3 ngày` : '—'))
              : 'máy chủ chưa gửi nhịp'}
          </span>
        </div>
        <div className="cd-kpi" data-mau="hp">
          <span className="cd-kpi-nhan" title="Em phải làm vượt số lượt/ngày để kịp hạn">
            Quá tải hôm nay
          </span>
          <strong data-so="qua-tai">
            {lop.huyetChien}
            <small>em</small>
          </strong>
          <span className="cd-kpi-phu cd-so">phải làm quá {cd.theLucNgay} lượt/ngày để kịp hạn</span>
        </div>
        <div className="cd-kpi" data-mau="ho">
          <span className="cd-kpi-nhan">Cần thầy dạy lại</span>
          <strong data-so="can-day-lai">
            {lop.canDayLaiCau}
            <small>câu</small>
          </strong>
          <span className="cd-kpi-phu cd-so">{lop.canDayLaiLuot} lượt em</span>
        </div>
      </div>

      <div className="cd-bo-cuc">
        <section className="cd-the" aria-labelledby="cd-bang-em">
          <div className="cd-the-dau">
            <div>
              <h2 id="cd-bang-em">Từng em × dạng · {om ? 'P nắm dạng kèm số câu tự làm' : '% câu thành thạo'}</h2>
              <span className="cd-so cd-phu">
                Hiện {hien.length}/{dsEm.length} em · {soDangYeu}/{dang.length} dạng Yếu
              </span>
            </div>
          </div>
          {dsEm.length === 0 ? (
            <p className="cd-phu">Chiến dịch chưa có em nào — kiểm tra lại lớp đã giao.</p>
          ) : (
            <div className="cd-cuon-ngang cd-cuon-doc" role="region" aria-label="Tiến độ từng học sinh theo dạng" tabIndex={0}>
              <table className="cd-bang cd-nhiet" data-khoi="bang-tung-em">
                <thead>
                  <tr>
                    <th scope="col" className="cd-nhiet-ten">
                      Học sinh
                    </th>
                    <th scope="col" title="Thành thạo = số câu đúng / tổng số câu">Thành thạo</th>
                    <th scope="col" title="Những bạn tồn đẩy lên đầu, tồn nhiều lên trên · Đúng nhịp = làm đủ full câu mỗi ngày · Chưa làm câu nào = Không làm">Trễ nhịp ▼</th>
                    {cot.map(({ ten: d }) => (
                      <th key={d} scope="col" title={d} className="cd-nhiet-dang">
                        <span className="cd-ten-dang-xoay">{d}</span>
                      </th>
                    ))}
                    {om && (
                      <>
                        <th scope="col" title="Sơ ý = tỉ lệ sai khi mọi kỹ năng cần đã vững" data-cot="so-y" style={{ whiteSpace: 'nowrap' }}>
                          Sơ ý
                        </th>
                        <th scope="col" title="Điểm còn thiếu tới mốc 8 theo dự báo — chỉ thầy thấy" data-cot="khoang-cach-8">
                          Khoảng cách tới 8
                          {!om.hieuChuan.du && <small className="cd-hang-duoi">{chuDangHieuChuan(om.hieuChuan.soCaChot, THAM_SO_OMNI.HIEU_CHUAN.soCaChot)}</small>}
                        </th>
                      </>
                    )}
                  </tr>
                </thead>
                <tbody>
                  <tr className="cd-nhiet-lop" data-khoi="hang-ca-lop">
                    <th scope="row" className="cd-nhiet-ten">
                      Cả lớp ({soEm} em)
                    </th>
                    <td className="cd-so">{phanTram(lop.thanhThao)}</td>
                    <td>—</td>
                    {cot.map(({ ten: d, ma, moi }) => {
                      const pLop = om ? tbPLop(om, ma) : null
                      if (pLop !== null) {
                        const mp = mucP(pLop)
                        return (
                          <td key={d}>
                            <span className={`cd-o cd-o--${mp}`} data-o-p={mp} title={`${d}: P trung bình lớp ${soP(pLop)}`}>
                              {soP(pLop)}
                            </span>
                          </td>
                        )
                      }
                      const t = moi ? undefined : tb[d]
                      const h = moi ? null : (lop.hangTheoDang?.[d] ?? (typeof t === 'number' ? hangTuTiLe(t) : null))
                      const m = mucO(t)
                      return (
                        <td key={d}>
                          <span className={`cd-o cd-o--${m}`} data-o={m} title={`${d}: cả lớp ${phanTram(t)} câu thành thạo`}>
                            {typeof t === 'number' ? Math.round(t * 100) : '—'}
                          </span>
                          {h && <span className="cd-hang-duoi">{CHU_HANG[h]}</span>}
                        </td>
                      )
                    })}
                    {om && (
                      <>
                        <td className="cd-so">{soYLop !== null ? phanTramOmni(soYLop) : '—'}</td>
                        <td>—</td>
                      </>
                    )}
                  </tr>
                  {hien.map((e) => {
                    const hangChu = chuHangTheoDang(e.hangTheoDang, dang)
                    const nhip = thongTinNhip(e, soCauCanTruoc, soCauMoiNgay)
                    return (
                      <tr key={e.sbd}>
                        <th scope="row" className="cd-nhiet-ten" title={hangChu ? `Sức học theo dạng — ${hangChu}` : undefined}>
                          {e.ten}
                          {e.huyetChien && <span className="cd-nhan-hc">Quá tải hôm nay</span>}
                          {hangChu && (
                            <span className="cd-an-chu" data-khoi="hang-theo-dang">
                              {hangChu}
                            </span>
                          )}
                        </th>
                        <td className="cd-so">{phanTram(e.thanhThao / soCau)}</td>
                        <td
                          className={`cd-so${nhip.kieu === 'khong_lam' ? ' cd-phu' : nhip.kieu === 'dung' ? ' cd-chu-xanh' : nhip.laDo ? ' cd-chu-do' : ' cd-chu-vang'}`}
                          title={nhip.moTa}
                        >
                          {nhip.chu}
                        </td>
                        {cot.map(({ ten: d, ma, moi }) => {
                          const op = om && ma ? om.o[e.sbd]?.[ma] : undefined
                          if (op && ma) {
                            const mp = mucP(op.p)
                            const dangChon = oChon?.sbd === e.sbd && oChon.ma === ma
                            return (
                              <td key={d}>
                                <button
                                  type="button"
                                  className={`cd-o cd-o--${mp}`}
                                  data-o-p={mp}
                                  aria-pressed={dangChon}
                                  title={`${e.ten} · ${d}: P ${soP(op.p)} · ${op.n} câu tự làm${op.trangThai === 'vung' ? ' · đã vững' : ''} — bấm để xác nhận dạng`}
                                  onClick={() => setOChon(dangChon ? null : { sbd: e.sbd, ten: e.ten, ma, tenDang: d, p: op.p, n: op.n })}
                                >
                                  {soP(op.p)}
                                </button>
                                <span className="cd-hang-duoi">{op.n} câu</span>
                              </td>
                            )
                          }
                          const t = moi ? undefined : e.theoDang[d]
                          const m = mucO(t, moi ? undefined : e.daLamTheoDang?.[d])
                          const h = moi ? undefined : e.hangTheoDang?.[d]
                          return (
                            <td key={d}>
                              <span
                                className={`cd-o cd-o--${m}`}
                                data-o={m}
                                title={`${d}: ${m === 'chua-lam' ? 'chưa làm câu nào' : `${phanTram(t)} câu thành thạo`}${h ? ` · sức học ${CHU_HANG[h]}` : ''}`}
                              >
                                {m === 'chua-lam' ? <span className="cd-an-chu">Chưa làm</span> : typeof t === 'number' ? Math.round(t * 100) : '—'}
                              </span>
                            </td>
                          )
                        })}
                        {om && (
                          <>
                            <td className={`cd-so${laSoYCao(om.sEm[e.sbd]) ? ' cd-chu-do' : ''}`} data-o-so-y={e.sbd}>
                              {typeof om.sEm[e.sbd] === 'number' ? phanTramOmni(om.sEm[e.sbd]!) : '—'}
                            </td>
                            <td
                              className="cd-so"
                              data-o-kc8={e.sbd}
                              title={typeof om.sanSang[e.sbd] === 'number' ? `Độ tin sẵn sàng 8+: ${doTinChu(om.sanSang[e.sbd]!)}` : undefined}
                            >
                              {chuKhoangCach8(om.khoangCach8[e.sbd] ?? null)}
                            </td>
                          </>
                        )}
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          )}
          <div className="cd-chu-giai" data-khoi="chu-giai-o-mau">
            {CHU_GIAI_HANG.map((g) => (
              <span key={g.hang}>
                <span className={`cd-o cd-o--mau cd-o--${g.hang}`} aria-hidden="true" />
                {g.chu}
              </span>
            ))}
            <span>
              <span className="cd-o cd-o--mau cd-o--chua-lam" aria-hidden="true" />
              Chưa làm
            </span>
            {om &&
              CHU_GIAI_P.map((g) => (
                <span key={`p-${g.hang}`} data-chu-giai-p={g.hang}>
                  <span className={`cd-o cd-o--mau cd-o--${g.hang}`} aria-hidden="true" />
                  {g.chu}
                </span>
              ))}
            {dsEm.length > SO_EM_THU_GON && (
              <button type="button" className="m3-nut-vien cd-nut-nho" aria-expanded={caLop} onClick={() => setCaLop((x) => !x)}>
                {caLop ? 'Thu gọn' : `Xem cả ${dsEm.length} em · ${cot.length} dạng`}
              </button>
            )}
          </div>
          {om ? (
            <p className="cd-phu" data-khoi="giai-thich-omni">
              Ô = P nắm dạng (0–1) kèm số câu em tự làm; bấm một ô để thầy xác nhận dạng (ghi sổ, phát lại được). Sơ ý = tỉ lệ sai khi mọi kỹ năng cần đã vững.
              Khoảng cách tới 8 = điểm còn thiếu tới mốc 8 theo dự báo, chỉ thầy thấy. Đúng nhịp = làm đủ full câu mỗi ngày. Trễ nhịp = tổng số câu tồn của những ngày
              trước. Chưa làm câu nào = Không làm.
            </p>
          ) : (
            <p className="cd-phu">
              Em xếp theo thành thạo thấp trước (▲). Dạng xếp theo cả lớp yếu nhất bên trái. Số trong ô = % câu của dạng em đã thành thạo; hạng theo đúng ngưỡng app
              dùng để bốc câu mới. Đúng nhịp = làm đủ full câu mỗi ngày. Trễ nhịp = tổng số câu tồn của những ngày trước. Chưa làm câu nào = Không làm. Rê chuột lên tên em để xem sức học theo dạng.
            </p>
          )}
          {om && oChon && (
            <div className="cd-thanh-hanh-dong" role="group" aria-label={`Xác nhận dạng ${oChon.tenDang} của ${oChon.ten}`} data-khoi="xac-nhan-dang">
              <p className="cd-phu">
                <b>{oChon.ten}</b> · {oChon.tenDang} · P {soP(oChon.p)} · {oChon.n} câu tự làm. Ghi sổ, phát lại được; bấm nút còn lại để đổi.
              </p>
              <button type="button" className="m3-nut-tonal cd-nut-nho" disabled={dangXacNhan} onClick={() => void xacNhan('vung')}>
                {NUT_XAC_NHAN_VUNG}
              </button>
              <button type="button" className="m3-nut-vien cd-nut-nho" disabled={dangXacNhan} onClick={() => void xacNhan('day_lai')}>
                {NUT_DAY_LAI}
              </button>
              <button type="button" className="m3-nut-chu cd-nut-nho" onClick={() => setOChon(null)}>
                Đóng
              </button>
            </div>
          )}
        </section>

        <div className="cd-cot-phai">
          {lop.nhip && (
            <section className="cd-the" aria-labelledby="cd-nhip-lop" data-khoi="nhip-lop">
              <div className="cd-the-dau">
                <h2 id="cd-nhip-lop">Nhịp của lớp</h2>
                <span className="cd-so cd-phu">{soEm} em · hôm nay</span>
              </div>
              {(['vuot', 'dung', 'tre12', 'tre3'] as const).map((k) => (
                <div key={k} className="cd-nhip-hang" data-nhip={k}>
                  <span>{CHU_NHIP[k]}</span>
                  <div className="cd-thanh" aria-hidden="true">
                    <div className={`cd-thanh--${k}`} style={{ width: `${Math.min(100, Math.max(0, (100 * lop.nhip![k]) / Math.max(1, soEm)))}%` }} />
                  </div>
                  <b className="cd-so">{lop.nhip![k]} em</b>
                </div>
              ))}
              <p className="cd-phu">Trễ = số ngày liền không làm câu nào. Vượt nhịp = đã làm qua cao hơn mức cần hôm nay từ 10 điểm %.</p>
            </section>
          )}

          {(du.noCu?.length ?? 0) > 0 && (
            <section className="cd-the" aria-labelledby="cd-no-cu" data-khoi="no-cu">
              <div className="cd-the-dau">
                <h2 id="cd-no-cu">Nợ cũ nhiều</h2>
                <span className="cd-so cd-phu">{du.noCu!.length} em</span>
              </div>
              <p className="cd-phu">Nợ cũ chiếm tối đa một nửa lượt mỗi ngày. Thầy có thể nâng số lượt/ngày hoặc chữa trên lớp.</p>
              <ul className="cd-ds-cau">
                {du.noCu!.map((x) => (
                  <li key={x.sbd}>{x.cau}.</li>
                ))}
              </ul>
            </section>
          )}

          {theCanChua}

          {tongHang > 0 && (
            <section className="cd-the" aria-labelledby="cd-hang-lop" data-khoi="hang-lop-theo-dang">
              <div className="cd-the-dau">
                <h2 id="cd-hang-lop">Hạng của lớp theo dạng</h2>
                <span className="cd-so cd-phu">{tongHang} dạng</span>
              </div>
              <div className="cd-thanh-chong" aria-hidden="true">
                {(['L4', 'L3', 'L2', 'L1'] as const).map((h) => (
                  <div key={h} className={`cd-o--${h}`} style={{ width: `${(100 * hangLop[h]) / tongHang}%` }} />
                ))}
              </div>
              <ul className="cd-ds-muc cd-ds-muc--ngang">
                {(['L4', 'L3', 'L2', 'L1'] as const).map((h) => (
                  <li key={h} data-hang={h}>
                    <span className={`cd-cham cd-o--${h}`} aria-hidden="true" />
                    <span>{CHU_HANG[h]}</span>
                    <b className="cd-so">{hangLop[h]}</b>
                  </li>
                ))}
              </ul>
            </section>
          )}
        </div>
      </div>

      {om && <ViKyNangBai chienDichId={cd.id} />}

      {hopChua}
    </>
  )
}
