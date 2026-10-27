// CỬA VÀO CÁC MÀN THƯỞNG PHẠT của app học sinh «Trong» (thầy chốt 26/10, bản vẽ tp-4…tp-18) — MỘT mảnh NẠP LƯỜI:
//   const ManThuong = lazy(() => import('./components/thuong/ManThuong'))  ⇒  <ManThuong man="chuoi" token={…} onVe={…} onHoc={…} />
// Không vào nhóm mở app (thanh trên ThanhThuong + TamThuong mới là phần hiện ngay). Xem CAM-VAO.md (chỗ cắm từng màn).
//  - ThongBaoThuong: thông báo thưởng phạt chưa xem (/hs/thuong `thongBao`, hiện MỘT lần, rồi POST /hs/thuong/da-xem {ma}) ⇒ màn phủ tương ứng;
//    + «Cứu chuỗi» khi chuỗi vừa tắt và còn hạn cứu (nhớ ở máy: hiện một lần mỗi lượt tắt).
//  - TheBenThuong: thẻ bên Lộ trình (tp-4): Giải tuần + Nhiệm vụ ngày, bấm mở màn.
import { useState, type CSSProperties, type ReactNode } from 'react'
import { chuConLai, daXemThongBao, hangSau, type ThongBao, type TongQuanThuong } from '../../lib/thuong-api'
import { HuyHieuKimLoai, TEN_HANG } from './hinh'
import { useTongQuan } from './dung-thuong'
import { ghiDaXem, locThongBao } from './loc-thong-bao'
import { ManBinhDaDo, ManChuoiNgay, ManCuuChuoi, ManMocChuoi } from './ManChuoi'
import { ManCuoiTuan, ManGiaiTuan, docCuoiTuan } from './ManGiai'
import { ManCuaHang, ManCuocKetQua, ManDatLaiTinhThe, ManNhiemVu, ManThangHoa } from './ManTinhThe'
import { ManHuyHieu, ManHuyHieuMoi } from './ManHuyHieu'
import { BaoGoCua, ManHocCungBan, ManLoiMoi, ManMocDoi, ManMoiBan } from './ManBan'
import { ManKimCuong, ManKimCuongDs } from './ManKimCuong'

export { ManBinhDaDo, ManChuoiNgay, ManCuuChuoi, ManMocChuoi, ManCuoiTuan, ManGiaiTuan, ManCuaHang, ManCuocKetQua, ManNhiemVu, ManThangHoa, ManHuyHieu, ManHuyHieuMoi,
  BaoGoCua, ManHocCungBan, ManLoiMoi, ManMocDoi, ManMoiBan, ManKimCuong, ManKimCuongDs }

export type TenManThuong = 'chuoi' | 'giai' | 'nhiem-vu' | 'cua-hang' | 'huy-hieu' | 'ban' | 'moi-ban' | 'kim-cuong'
export interface PropsManThuong {
  man: TenManThuong
  token?: string
  /** Về màn trước (nút «Quay lại» đầu màn; màn phủ: nút Đóng). Không truyền ⇒ không vẽ nút về (màn nằm trong menu). */
  onVe?: () => void
  /** «Học ngay» / «Học bù ngay» ⇒ mở chặng học của hôm nay. */
  onHoc?: () => void
  /** Mở màn thưởng khác từ màn này (vd. Học cùng bạn ⇒ Mời bạn; Cửa hàng ⇒ phụ kiện). */
  onMo?: (man: TenManThuong | 'phu-kien' | 'cuu') => void
  /** Kim cương: chuyên đề đã thành thạo (mã + tên). */
  chuyenDe?: { ma: string; ten: string }
  /** Hiệu ứng mở màn (host bật đúng lúc, vd. Chuỗi ngày sau bài đầu tiên trong ngày). */
  hieuUng?: 'chuoi' | 'binh' | 'moc' | 'ruong'
  /** Nơi cắm chưa có cửa hàng phụ kiện thú ⇒ ẩn thẻ «Phụ kiện cho thú» ở Cửa hàng (không vẽ nút bấm không đi đâu). */
  anPhuKien?: boolean
}

export default function ManThuong({ man, token, onVe, onHoc, onMo, chuyenDe, hieuUng, anPhuKien }: PropsManThuong) {
  const tq = useTongQuan(token).du
  const [cuu, setCuu] = useState(false)
  if (man === 'chuoi') return <>
    <ManChuoiNgay token={token} onVe={onVe} onHoc={onHoc} onCuu={() => setCuu(true)} onBan={onMo ? () => onMo('ban') : undefined} hieuUng={hieuUng === 'ruong' ? undefined : hieuUng} />
    {cuu && tq?.chuoiNgay?.cuu && <ManCuuChuoi chuoi={tq.chuoiNgay} onHoc={onHoc} onDong={() => setCuu(false)} />}
  </>
  if (man === 'giai') return <ManGiaiTuan token={token} onVe={onVe} />
  if (man === 'nhiem-vu') return <ManNhiemVu token={token} onVe={onVe} hieuUng={hieuUng === 'ruong' ? 'ruong' : undefined} />
  if (man === 'cua-hang') return <ManCuaHang token={token} onVe={onVe} onPhuKien={onMo && !anPhuKien ? () => onMo('phu-kien') : undefined} />
  if (man === 'huy-hieu') return <ManHuyHieu token={token} onVe={onVe} />
  if (man === 'ban') return <ManHocCungBan token={token} onVe={onVe} onHoc={onHoc} onMoi={onMo ? () => onMo('moi-ban') : undefined} />
  if (man === 'moi-ban') return <ManMoiBan token={token} onDong={onVe ?? (() => {})} />
  if (man === 'kim-cuong' && chuyenDe) return <ManKimCuong token={token} chuyenDe={chuyenDe.ma} tenChuyenDe={chuyenDe.ten} onDong={onVe ?? (() => {})} />
  // Không kèm chuyên đề (ô «Thử thách Kim cương» ở Thành tích, 27/10) ⇒ danh sách chuyên đề em đã vững.
  if (man === 'kim-cuong') return <ManKimCuongDs token={token} onVe={onVe} />
  return null
}

// ───────────────────────────── THÔNG BÁO (hiện một lần)
/** Thông báo đủ dữ liệu để vẽ (thiếu ⇒ bỏ qua, không vẽ màn rỗng). */
export function veDuoc(tb: ThongBao, tq: TongQuanThuong): boolean {
  const d = tb.duLieu
  const so = (x: unknown) => typeof x === 'number' && Number.isFinite(x)
  const chu = (x: unknown) => typeof x === 'string' && !!x.trim()
  switch (tb.loai) {
    case 'thang_hoa': return so(d.mat)
    case 'binh_do': return !!tq.chuoiNgay || so(d.so)
    case 'cuoi_tuan': return !!docCuoiTuan(tb)
    case 'moc_chuoi': return so(d.moc) || !!tq.chuoiNgay
    case 'cuoc': return d.ketQua === 'thang' || d.ketQua === 'thua'
    case 'huy_hieu': return chu(d.ma) && chu(d.ten)
    case 'moc_doi': return so(d.moc)
    case 'go_cua': return chu(d.ten)
    case 'moi_ban': return chu(d.ma) && chu(d.ten)
    case 'dat_lai_tt': return so(d.conLai)
  }
}
const KHO_CUU = 'ddh.thuong.cuu-da-xem'
const daXemCuu = (k: string) => { try { return localStorage.getItem(KHO_CUU) === k } catch { return false } }
const ghiCuu = (k: string) => { try { localStorage.setItem(KHO_CUU, k) } catch { /* bỏ qua */ } }

export function ThongBaoThuong({ token, tongQuan: tq, onHoc, onMo }: { token: string; tongQuan: TongQuanThuong; onHoc?: () => void; onMo?: (man: TenManThuong) => void }) {
  const [, setLan] = useState(0)
  const ds = locThongBao(tq).filter((t) => veDuoc(t, tq))
  const tb = ds[0]
  const cu = tq.chuoiNgay?.cuu
  const khoaCuu = cu ? `cuu|${cu.hetHan}` : ''
  if (!tb) {
    if (cu && cu.daLam < cu.can && cu.hetHan > Date.now() && !daXemCuu(khoaCuu))
      return <ManCuuChuoi chuoi={tq.chuoiNgay!} onHoc={() => { ghiCuu(khoaCuu); setLan((n) => n + 1); onHoc?.() }} onDong={() => { ghiCuu(khoaCuu); setLan((n) => n + 1) }} />
    return null
  }
  const xong = () => { ghiDaXem(tb.ma); void daXemThongBao(token, tb.ma); setLan((n) => n + 1) }
  const hoc = onHoc ? () => { xong(); onHoc() } : undefined
  switch (tb.loai) {
    case 'thang_hoa': return <ManThangHoa key={tb.ma} tb={tb} onHoc={hoc} onDong={xong} />
    case 'binh_do': return <ManBinhDaDo key={tb.ma} tb={tb} tq={tq} token={token} onHoc={hoc} onDong={xong} />
    case 'cuoi_tuan': return <ManCuoiTuan key={tb.ma} tb={tb} tq={tq} onDong={xong} />
    case 'moc_chuoi': return <ManMocChuoi key={tb.ma} tb={tb} tq={tq} onDong={xong} />
    case 'cuoc': return <ManCuocKetQua key={tb.ma} tb={tb} tq={tq} onDong={xong} />
    case 'huy_hieu': return <ManHuyHieuMoi key={tb.ma} tb={tb} onXem={onMo ? () => { xong(); onMo('huy-hieu') } : undefined} onDong={xong} />
    case 'moc_doi': return <ManMocDoi key={tb.ma} tb={tb} tq={tq} onDong={xong} />
    case 'go_cua': return <BaoGoCua key={tb.ma} tb={tb} onHoc={onHoc} onDong={xong} />
    case 'moi_ban': return <ManLoiMoi key={tb.ma} tb={tb} token={token} onDong={xong} />
    case 'dat_lai_tt': return <ManDatLaiTinhThe key={tb.ma} tb={tb} onHoc={hoc} onDong={xong} />
  }
}

// ───────────────────────────── THẺ BÊN LỘ TRÌNH (tp-4)
/** Thẻ «Giải tuần» + «Nhiệm vụ ngày» cạnh Lộ trình (thay thẻ «Bậc» cũ — học sinh không thấy nhãn nhịp học). Mỗi thẻ là một nút mở màn. */
export function TheBenThuong({ token, onMo }: { token?: string; onMo?: (man: TenManThuong) => void }) {
  const tq = useTongQuan(token).du
  if (!tq) return null
  const g = tq.bat.giai ? tq.giai : undefined
  const nv = tq.nhiemVu
  const the = (man: TenManThuong, dau: string, nhan: string, children: ReactNode) => <section key={man} className="dm-the tp-goc" aria-label={dau}><h3>{dau}</h3>
    {onMo ? <button type="button" className="tp-the-nut" aria-label={nhan} onClick={() => onMo(man)}>{children}</button> : children}</section>
  const sau = g ? hangSau(g.hang) : null
  return <div className="tp-ben">
    {g && the('giai', 'Giải tuần', `Giải ${TEN_HANG[g.hang]}, hạng ${g.thuHang}/${g.soNguoi} — mở Giải tuần`, <>
      <div className="tp-mini-giai"><HuyHieuKimLoai hang={g.hang} an /><div className="giua"><b>Giải {TEN_HANG[g.hang]} · hạng {g.thuHang}/{g.soNguoi}</b><br />
        <span className="tp-mo">{chuConLai(g.hetHanGiay)}{sau ? ` · top 5 lên ${TEN_HANG[sau]}` : ''}</span></div></div></>)}
    {nv && nv.length > 0 && the('nhiem-vu', 'Nhiệm vụ ngày', 'Nhiệm vụ ngày — mở Nhiệm vụ', <>
      {nv.map((x) => <div key={x.ma} className="tp-nv-mini"><span>{x.ten}</span>
        <div className="tp-thanh" data-sac={x.xong ? undefined : 'sao'} style={{ '--p': `${Math.round((100 * x.tien) / x.can)}%` } as CSSProperties}><i /></div><b>{x.tien}/{x.can}</b></div>)}</>)}
  </div>
}
