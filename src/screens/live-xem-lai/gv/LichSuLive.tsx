// LỊCH SỬ LIVE CỦA THẦY (thầy chốt build 11/11; đặc tả docs/dac-ta-live-xem-lai-1011.md mục 2.2, 3; bản vẽ docs/ban-ve-live-xem-lai-1011 ảnh 31–42).
// Mảnh nạp lười: mở từ nút «Live» ở đầu màn Hôm nay (src/components/hom-nay-thay/NutLive.tsx), vẽ ĐÈ lên vùng nội dung Hôm nay (thanh bên giữ nguyên,
// không thêm mục thanh bên — luật C6). Dòng tổng, lọc lớp, tìm, chọn nhiều, «Chọn buổi cũ hơn 120 ngày», xoá hàng loạt có hộp xác nhận nói rõ hậu quả +
// thứ KHÔNG mất, đổi tên có xem trước, buổi đang xử lý có thanh tiến độ tự cập nhật, rỗng, lỗi + «Dựng lại». Chữ theo docs/CHUAN-TU-NGU-VA-GIAO-DIEN.md.
import { useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState, type ComponentType } from 'react'
import { ChevronLeft, Pencil, RefreshCw, Search, Trash2 } from 'lucide-react'
import HopXacNhan from '../../../components/HopXacNhan'
import { layDiaChiMayChu } from '../../../lib/dia-chi-may-chu'
import { chuDungLuong, phanTenBuoi, soPhut, tenBuoiDayDu, thuNgay, TEN_THAY_TOI_DA } from '../../../lib/live/xem-lai-ten'
import { useAppStore } from '../../../store/appStore'
import { doiTenLive, dungLaiLive, taiDsLive, xoaLive, type BuoiGv } from './lich-su-live-api'
import { coManXemLai, napManXemLai, type PropsMoTuThay } from './diem-noi-hs'
import './lich-su-live.css'

const NGAY_CU = 120
const gioVn = (iso: string): string => { const t = Date.parse(iso); return Number.isFinite(t) ? new Date(t + 7 * 3_600_000).toISOString().slice(11, 16) : '' }
const ngayDayDu = (ngay: string): string => { const t = thuNgay(ngay); return t ? `${t}/${ngay.slice(0, 4)}` : ngay }
const ngayCach = (soNgay: number): string => new Date(Date.now() + 7 * 3_600_000 - soNgay * 86_400_000).toISOString().slice(0, 10)
const dangChay = (b: BuoiGv): boolean => b.trangThai === 'dang_xu_ly' || b.trangThai === 'dang_ghi'
/** Buổi thầy thao tác được (chọn, đổi tên, xoá): đã xong hoặc dựng lỗi. */
const chonDuoc = (b: BuoiGv): boolean => b.trangThai === 'xong' || b.trangThai === 'loi'
const tenDong = (b: BuoiGv): string => (b.trangThai === 'dang_xu_ly' ? [thuNgay(b.ngay), b.lop, 'buổi vừa kết thúc'] : b.trangThai === 'dang_ghi' ? [thuNgay(b.ngay), b.lop, 'đang live'] : [phanTenBuoi(b)]).filter(Boolean).join(' · ')

export default function LichSuLive({ onDong }: { onDong: () => void }) {
  const showToast = useAppStore((s) => s.showToast)
  const goc = useRef<HTMLDivElement>(null)
  const [ds, setDs] = useState<BuoiGv[] | null>(null)
  const [tongByte, setTongByte] = useState(0)
  const [loi, setLoi] = useState('')
  const [dangTai, setDangTai] = useState(true)
  const [lop, setLop] = useState<string | null>(null)
  const [tim, setTim] = useState('')
  const [chon, setChon] = useState<ReadonlySet<string>>(new Set())
  const [hopXoa, setHopXoa] = useState<BuoiGv[] | null>(null)
  const [dangXoa, setDangXoa] = useState(false)
  const [hopTen, setHopTen] = useState<{ b: BuoiGv; macDinh: string; khoa: number } | null>(null)
  const [tenGo, setTenGo] = useState('')
  const [dangLuu, setDangLuu] = useState(false)
  const [loiTen, setLoiTen] = useState('')
  const [dangDung, setDangDung] = useState('')
  const [mo, setMo] = useState<{ Man: ComponentType<PropsMoTuThay>; p: Omit<PropsMoTuThay, 'onDong'> } | null>(null)

  // Vẽ đè lên vùng nội dung Hôm nay: đánh dấu khung cha để phần Hôm nay ẩn đi (tờ kiểu của mảnh này), gỡ dấu khi đóng.
  useLayoutEffect(() => {
    const cha = goc.current?.parentElement
    if (!cha) return
    cha.setAttribute('data-live-mo', '')
    try { cha.scrollIntoView?.({ block: 'start' }) } catch { /* trình duyệt cũ */ }
    return () => { cha.removeAttribute('data-live-mo') }
  }, [])

  /** Nhận kết quả một lượt tải. `im` = cập nhật ngầm (không đổi chữ nút, không hiện lỗi). Lượt tải đầu: `dangTai` đã bật sẵn từ lúc dựng màn. */
  const nhan = useCallback((r: Awaited<ReturnType<typeof taiDsLive>>, im: boolean) => {
    if (!im) setDangTai(false)
    if (!r.ok) { if (!im) setLoi(r.chu); return }
    setLoi(''); setDs(r.du.buoi); setTongByte(r.du.tongByte)
    setChon((cu) => { const con = new Set(r.du.buoi.filter(chonDuoc).map((b) => b.id)); const moi = new Set([...cu].filter((id) => con.has(id))); return moi.size === cu.size ? cu : moi })
  }, [])
  const tai = useCallback(async (im = false) => { nhan(await taiDsLive(), im) }, [nhan])
  useEffect(() => { let song = true; void taiDsLive().then((r) => { if (song) nhan(r, false) }); return () => { song = false } }, [nhan])
  // Buổi đang xử lý ⇒ tự cập nhật mỗi 4 giây tới khi xong (không cần tải lại trang); chỉ có buổi đang live ⇒ 30 giây một lần. Tab ẩn thì bỏ qua.
  const nhipMs = ds?.some((b) => b.trangThai === 'dang_xu_ly') ? 4000 : ds?.some(dangChay) ? 30_000 : 0
  useEffect(() => {
    if (!nhipMs) return
    const h = setInterval(() => { if (!document.hidden) void tai(true) }, nhipMs)
    return () => clearInterval(h)
  }, [nhipMs, tai])
  // Khúc tiếng còn kẹt trên máy này từ lần live trước ⇒ tải bù (chỉ nạp mảnh máy ghi khi có cờ).
  useEffect(() => { try { if (localStorage.getItem('ddh.live.ghi-ket') === '1') void import('../../../lib/live/may-ghi').then((m) => m.taiBuKhucKet()).catch(() => {}) } catch { /* không có kho */ } }, [])

  const dsLop = useMemo(() => { const m = new Map<string, number>(); for (const b of ds ?? []) if (b.lop) m.set(b.lop, (m.get(b.lop) ?? 0) + 1); return [...m.entries()].sort((a, b) => (a[0] < b[0] ? 1 : -1)) }, [ds])
  const hien = useMemo(() => {
    const k = tim.trim().toLowerCase()
    return (ds ?? []).filter((b) => (lop == null || b.lop === lop) && (!k || tenBuoiDayDu(b).toLowerCase().includes(k)))
  }, [ds, lop, tim])
  const hienChonDuoc = hien.filter(chonDuoc)
  const dsChon = (ds ?? []).filter((b) => chon.has(b.id))
  const byteChon = dsChon.reduce((s, b) => s + b.byte, 0)
  const tatCa = hienChonDuoc.length > 0 && hienChonDuoc.every((b) => chon.has(b.id))
  const motPhan = !tatCa && hienChonDuoc.some((b) => chon.has(b.id))
  const oTatCa = useRef<HTMLInputElement>(null)
  useEffect(() => { if (oTatCa.current) oTatCa.current.indeterminate = motPhan }, [motPhan])

  const doiChon = (id: string) => setChon((cu) => { const m = new Set(cu); if (m.has(id)) m.delete(id); else m.add(id); return m })
  const chonTatCa = () => setChon((cu) => { const m = new Set(cu); for (const b of hienChonDuoc) { if (tatCa) m.delete(b.id); else m.add(b.id) } return m })
  const chonCu = () => {
    const moc = ngayCach(NGAY_CU), cu = (ds ?? []).filter((b) => chonDuoc(b) && b.ngay < moc)
    if (!cu.length) { showToast(`Chưa có buổi nào cũ hơn ${NGAY_CU} ngày.`, 'warn'); return }
    setLop(null); setTim(''); setChon(new Set(cu.map((b) => b.id)))
  }
  const xoa = async () => {
    if (!hopXoa || dangXoa) return
    const can = hopXoa
    setDangXoa(true)
    const r = await xoaLive(can.map((b) => b.id))
    setDangXoa(false); setHopXoa(null)
    if (!r.ok) { showToast(r.chu, 'error'); void tai(true); return }
    setChon(new Set())
    if (r.du.conDo.length) showToast(`Đã xoá ${r.du.xoa.length}/${can.length} buổi. Buổi còn lại sẽ tự xoá tiếp.`, 'warn')
    else showToast(`Đã xoá ${r.du.xoa.length} buổi · ${chuDungLuong(r.du.byte)}`)
    void tai(true)
  }
  const moDoiTen = (b: BuoiGv) => { const macDinh = phanTenBuoi(b); setTenGo(macDinh); setLoiTen(''); setHopTen({ b, macDinh, khoa: Date.now() }) }
  const luuTen = async (giaTri: string) => {
    if (!hopTen || dangLuu) return
    setDangLuu(true)
    // Gõ lại đúng tên tự động / xoá trắng ⇒ về tên tự động.
    const gui = giaTri.trim() === hopTen.b.tenTuDong.trim() ? '' : giaTri
    const r = await doiTenLive(hopTen.b.id, gui)
    setDangLuu(false)
    if (!r.ok) { setLoiTen(r.chu); return }
    setDs((cu) => cu?.map((x) => (x.id === hopTen.b.id ? { ...x, tenThay: r.du.tenThay } : x)) ?? cu)
    setHopTen(null)
    showToast(r.du.tenThay ? 'Đã đổi tên buổi live.' : 'Đã dùng lại tên tự động.')
  }
  const dungLai = async (b: BuoiGv) => {
    if (dangDung) return
    setDangDung(b.id)
    const r = await dungLaiLive(b.id)
    setDangDung('')
    if (!r.ok) showToast(r.chu, 'error')
    void tai(true)
  }
  const moBuoi = async (b: BuoiGv) => {
    if (!b.ve) return
    try { const [m, gocMay] = await Promise.all([napManXemLai(), layDiaChiMayChu()]); setMo({ Man: m.default, p: { buoi: b, ve: b.ve, goc: gocMay } }) } catch { showToast('Chưa mở được buổi này. Thầy thử lại.', 'warn') }
  }

  if (mo) return <div ref={goc} className="lsl" data-mo-buoi=""><mo.Man {...mo.p} onDong={() => setMo(null)} /></div>

  const soBuoi = ds?.length ?? 0
  return (
    <div ref={goc} className="lsl">
      <button type="button" className="lsl-lui" onClick={onDong}><ChevronLeft size={18} aria-hidden="true" />Hôm nay</button>
      <header className="lsl-dau">
        <h1 className="gvv2-h1">Lịch sử Live</h1>
        {soBuoi > 0 && <p className="lsl-tong gvv2-so">{soBuoi} buổi · {chuDungLuong(tongByte)} đã lưu</p>}
      </header>

      {ds === null ? (
        loi ? (
          <div className="gvv2-the lsl-rong" role="alert">
            <h2>Chưa tải được</h2><p>{loi}</p>
            <button type="button" className="gvv2-nut-vien" disabled={dangTai} onClick={() => { setDangTai(true); void tai() }}><RefreshCw size={18} aria-hidden="true" />{dangTai ? 'Đang tải…' : 'Thử lại'}</button>
          </div>
        ) : <div className="gvv2-the lsl-cho" role="status" aria-label="Đang tải Lịch sử Live"><i /><i /><i /></div>
      ) : soBuoi === 0 ? (
        <div className="gvv2-the lsl-rong">
          <span className="lsl-rong-bieu" aria-hidden="true"><svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10" /><path d="m10 8 6 4-6 4z" /></svg></span>
          <h2>Chưa có buổi live nào</h2>
          <p>Thầy bấm «Live» trên màn chiếu khi đang dạy. Tắt live hoặc kết thúc buổi là app tự dựng trang xem lại và đặt tên, rồi buổi hiện ở đây.</p>
        </div>
      ) : (
        <>
          <div className="lsl-loc">
            <div className="lsl-lop" role="radiogroup" aria-label="Lọc theo lớp">
              <button type="button" role="radio" aria-checked={lop == null} onClick={() => setLop(null)}>Tất cả <span className="gvv2-so">{soBuoi}</span></button>
              {dsLop.map(([ten, n]) => <button key={ten} type="button" role="radio" aria-checked={lop === ten} onClick={() => setLop(ten)}>{ten} <span className="gvv2-so">{n}</span></button>)}
            </div>
            <label className="gvv2-tim lsl-tim"><Search size={18} aria-hidden="true" /><input type="search" value={tim} onChange={(e) => setTim(e.target.value)} placeholder="Tìm tên buổi" aria-label="Tìm tên buổi" /></label>
          </div>

          <section className="gvv2-the lsl-bang" aria-label="Các buổi live">
            <div className="lsl-hang lsl-hang-dau">
              <span className="lsl-o"><input ref={oTatCa} type="checkbox" checked={tatCa} disabled={!hienChonDuoc.length} onChange={chonTatCa} aria-label="Chọn mọi buổi đang hiện" /></span>
              <span>Buổi live</span><span className="lsl-c">Lớp</span><span className="lsl-s">Thời lượng live</span><span className="lsl-s">Số câu</span><span className="lsl-s">Số đoạn</span><span className="lsl-s">Dung lượng</span><span className="lsl-nut" />
            </div>
            {hien.length === 0 && <p className="gvv2-trong">Không có buổi nào khớp. Thầy thử từ khác hoặc chọn «Tất cả».</p>}
            {hien.map((b) => {
              const duoc = chonDuoc(b), ten = tenDong(b), daChon = chon.has(b.id)
              return (
                <div key={b.id} className="lsl-hang" data-chon={daChon ? '' : undefined} data-tt={b.trangThai}>
                  <span className="lsl-o"><input type="checkbox" checked={daChon} disabled={!duoc} onChange={() => doiChon(b.id)} aria-label={`Chọn buổi ${ten}`} /></span>
                  <span className="lsl-ten">
                    <b>{ten}</b>
                    {b.trangThai === 'dang_xu_ly' ? (
                      <span className="lsl-tien" role="status">
                        <span className="gvv2-thanh" role="progressbar" aria-valuemin={0} aria-valuemax={100} aria-valuenow={b.tienDo} aria-label="Tiến độ xử lý"><i style={{ width: `${Math.max(4, Math.min(100, b.tienDo))}%` }} /></span>
                        Đang xử lý buổi vừa xong · <span className="gvv2-so">{b.tienDo} %</span> · thường xong dưới 1 phút
                      </span>
                    ) : b.trangThai === 'dang_ghi' ? <small className="lsl-ghi">Đang ghi để xem lại · xong buổi là tự dựng</small>
                      : b.trangThai === 'loi' ? <small className="lsl-loi">Chưa dựng xong buổi này</small>
                        : <small><span className="lsl-chi-rong">{ngayDayDu(b.ngay)} · live từ <span className="gvv2-so">{gioVn(b.batLuc)}</span></span><span className="lsl-chi-hep gvv2-so">{[thuNgay(b.ngay), b.lop, `${b.soCau}\u00a0câu`, `${soPhut(b.giayLive)}\u00a0phút`, chuDungLuong(b.byte).replace(' ', '\u00a0')].filter(Boolean).join(' · ')}</span></small>}
                  </span>
                  <span className="lsl-c">{b.lop || 'Mọi lớp'}</span>
                  <span className="lsl-s gvv2-so">{duoc && b.trangThai === 'xong' ? `${soPhut(b.giayLive)} phút` : '–'}</span>
                  <span className="lsl-s gvv2-so">{b.trangThai === 'xong' ? b.soCau : '–'}</span>
                  <span className="lsl-s gvv2-so">{b.trangThai === 'xong' ? b.soDoan : '–'}</span>
                  <span className="lsl-s gvv2-so">{duoc && b.byte ? chuDungLuong(b.byte) : '–'}</span>
                  <span className="lsl-nut">
                    {b.trangThai === 'loi' && <button type="button" className="lsl-mo" disabled={dangDung === b.id} onClick={() => void dungLai(b)}>{dangDung === b.id ? 'Đang dựng…' : 'Dựng lại'}</button>}
                    {b.trangThai === 'xong' && coManXemLai && b.ve && <button type="button" className="lsl-mo" onClick={() => void moBuoi(b)} aria-label={`Mở buổi ${ten}`}>Mở</button>}
                    {b.trangThai === 'xong' && <button type="button" className="lsl-bt" onClick={() => moDoiTen(b)} aria-label={`Đổi tên buổi ${ten}`}><Pencil size={18} aria-hidden="true" /></button>}
                    {duoc && <button type="button" className="lsl-bt lsl-chi-rong" onClick={() => setHopXoa([b])} aria-label={`Xoá buổi ${ten}`}><Trash2 size={18} aria-hidden="true" /></button>}
                  </span>
                </div>
              )
            })}
            <footer className="lsl-chan">
              <span>Tích ô đầu dòng để xoá nhiều buổi một lần.</span>
              <button type="button" className="lsl-lien" onClick={chonCu}>Chọn buổi cũ hơn {NGAY_CU} ngày</button>
            </footer>
          </section>
        </>
      )}

      {dsChon.length > 0 && !hopXoa && (
        <div className="lsl-noi" role="region" aria-label="Các buổi đã chọn">
          <span className="gvv2-so">Đã chọn {dsChon.length} buổi · {chuDungLuong(byteChon)}</span>
          <button type="button" className="lsl-noi-bo" onClick={() => setChon(new Set())}>Bỏ chọn</button>
          <button type="button" className="lsl-noi-xoa" onClick={() => setHopXoa(dsChon)}><Trash2 size={18} aria-hidden="true" />Xoá {dsChon.length} buổi</button>
        </div>
      )}

      {hopXoa && (
        <div className="lsl-hop">
          <HopXacNhan
            tieuDe={`Xoá ${hopXoa.length} buổi live?`}
            noiDung={(() => {
              const n = hopXoa.length, byte = chuDungLuong(hopXoa.reduce((s, b) => s + b.byte, 0))
              return (
                <>
                  <p>Thầy sắp xoá {n === 1 ? 'buổi' : 'các buổi'} sau:</p>
                  <ul className="lsl-hop-ds">{hopXoa.map((b) => <li key={b.id}><span>{[thuNgay(b.ngay), b.lop, phanTenBuoi(b)].filter(Boolean).join(' · ')}</span><span className="gvv2-so">{chuDungLuong(b.byte)}</span></li>)}</ul>
                  <p className="lsl-hop-mat">Xoá hẳn {byte}: tiếng ghi lại, nét bảng và trang xem lại của {n} buổi. Học sinh không xem lại được {n} buổi này nữa. Không khôi phục được.</p>
                  <p className="lsl-hop-giu">Điểm, kJ và điểm danh của {n === 1 ? 'buổi này' : 'các buổi này'} vẫn giữ nguyên.</p>
                </>
              )
            })()}
            nhanXacNhan={`Xoá ${hopXoa.length} buổi`} nhanHuy="Giữ lại" nguyHiem dangLam={dangXoa} nhanDangLam={`Đang xoá ${hopXoa.length} buổi…`}
            onXacNhan={() => void xoa()} onHuy={() => setHopXoa(null)}
          />
        </div>
      )}

      {hopTen && (
        <div className="lsl-hop">
          <HopXacNhan
            key={hopTen.khoa}
            tieuDe="Đổi tên buổi live"
            noiDung={(
              <>
                <p>Ngày, lớp, số câu và thời lượng app tự ghi. Thầy chỉ đổi phần tên.</p>
                <div className="lsl-hop-xem"><span>Học sinh sẽ thấy</span><b>{tenBuoiDayDu({ ...hopTen.b, tenThay: tenGo })}</b></div>
                {tenGo.trim() !== hopTen.b.tenTuDong.trim() && (
                  <button type="button" className="lsl-lien" disabled={dangLuu} onClick={() => { setTenGo(hopTen.b.tenTuDong); setHopTen({ ...hopTen, macDinh: hopTen.b.tenTuDong, khoa: Date.now() }) }}>Dùng lại tên tự động «{hopTen.b.tenTuDong}»</button>
                )}
              </>
            )}
            nhap={{ nhan: 'Tên buổi', macDinh: hopTen.macDinh, toiDa: TEN_THAY_TOI_DA, onDoi: setTenGo }}
            loi={loiTen || undefined}
            nhanXacNhan="Lưu tên" dangLam={dangLuu} nhanDangLam="Đang lưu…"
            onXacNhan={(g) => void luuTen(g ?? '')} onHuy={() => setHopTen(null)}
          />
        </div>
      )}
    </div>
  )
}
