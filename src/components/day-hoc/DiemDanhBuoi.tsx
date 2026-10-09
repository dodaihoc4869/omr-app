// BƯỚC ĐIỂM DANH DÙNG CHUNG của mục Lên bảng — thẻ DẠY HỌC và thẻ KIỂM TRA ĐẦU GIỜ (29/09: "bước Điểm danh BÊ NGUYÊN").
// Tách nguyên văn từ `DayHocLenBang.tsx` (28/09): mở buổi học trên máy chủ + chiếu mã 6 số & QR (`TamPhuChieuMa`), danh sách CÓ MẶT tự làm mới 5 giây
// (`useNhipThay`), thầy thêm em bằng tay (tìm SBD / tên không dấu, lọc lớp) và bớt em. Hai thẻ dùng CHUNG buổi đang mở (máy chủ `dang-mo` trả buổi mới nhất).
import { useCallback, useEffect, useMemo, useState } from 'react'
import { MonitorPlay, Plus, UserCheck, X } from 'lucide-react'
import { useAppStore } from '../../store/appStore'
import TamPhuChieuMa, { type ChuTamPhu, type PhongChoChieu } from '../TamPhuChieuMa'
import { hoiXacNhan } from '../hop-thoai'
import { NHIP_PHONG_CHO_THAY, TUY_CHON_NHIP_THAY, useNhipThay } from '../../lib/nhip-may-thay'
import { layLopThay, type LopThay } from '../../lib/ten-lop-thay'
import { botEmBuoi, buoiDangMo, dongBuoiHoc, linkDiemDanh, moBuoiHoc, themEmBuoi, xemBuoiHoc, locEmThem, type TrangThaiBuoi } from '../../lib/buoi-hoc-api'
import './day-hoc.css'

export const CHU_DIEM_DANH: ChuTamPhu = {
  tenMa: 'Mã điểm danh',
  vungMa: 'Mã điểm danh',
  nhanMa: 'ĐIỂM DANH BUỔI HỌC',
  tenHop: 'Chiếu mã điểm danh',
  danhSach: 'Đã điểm danh',
  chuRong: 'Chưa em nào điểm danh. Màn tự cập nhật mỗi 5 giây.',
  aria: 'Mã QR điểm danh',
}

export const gio = (iso: string) => {
  const d = new Date(iso)
  return Number.isFinite(d.getTime()) ? `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}` : ''
}
export const tenNgan = (hoTen: string, sbd: string) => {
  const t = hoTen.split(/\s+/).filter(Boolean)
  return t.length ? (t.length >= 3 ? t.slice(-2).join(' ') : t.join(' ')) : `SBD ${sbd}`
}
const TOI_DA_HIEN = 150

export interface TuyChonDiemDanhBuoi {
  /** Chọn sẵn lớp khi màn này phục vụ một luồng đã biết lớp (vd buổi chữa chiến dịch). */
  lopMacDinh?: string
  /** Tên buổi ghi vào sổ điểm danh khi mở mới. */
  tenMacDinh?: string
  /** Chỉ nối lại buổi đang mở của đúng lớp, không lấy nhầm buổi lớp khác. */
  chiNoiBuoiCungLop?: boolean
}

/** Trạng thái + lệnh của bước Điểm danh (một buổi học đang mở). */
export function useDiemDanhBuoi(tuyChon: TuyChonDiemDanhBuoi = {}) {
  const lopMacDinh = (tuyChon.lopMacDinh ?? '').trim()
  const tenMacDinh = (tuyChon.tenMacDinh ?? '').trim()
  const chiNoiBuoiCungLop = tuyChon.chiNoiBuoiCungLop === true
  const showToast = useAppStore((s) => s.showToast)
  const [dsLop, setDsLop] = useState<LopThay[]>([])
  const [lopChon, setLopChon] = useState(lopMacDinh)
  const [tt, setTt] = useState<TrangThaiBuoi | null>(null)
  const [dangTaiBuoi, setDangTaiBuoi] = useState(true)
  const [loiBuoi, setLoiBuoi] = useState('')
  const [dangMo, setDangMo] = useState(false)
  const [chieuMa, setChieuMa] = useState(false)
  const [themMo, setThemMo] = useState(false)
  const [timEm, setTimEm] = useState('')
  const [emThem, setEmThem] = useState<Set<string>>(new Set())
  const [lopThem, setLopThem] = useState<string | null>(null)
  const [dangThem, setDangThem] = useState(false)
  // QR mở APP HỌC SINH trên cùng gốc Pages với app thầy (`<gốc>/hs?diem-danh=<mã>`).
  const goc = typeof window !== 'undefined' ? window.location.origin : ''
  const idBuoi = tt?.buoi.id ?? ''

  useEffect(() => {
    let con = true
    setLopChon(lopMacDinh)
    void layLopThay().then((r) => con && r.ok && setDsLop(r.du.lop))
    void (async () => {
      const r = await buoiDangMo()
      if (!con) return
      if (!r.ok) {
        setLoiBuoi(r.loai === 'chua_co_lenh' ? r.chu : '')
        setDangTaiBuoi(false)
        return
      }
      const b = chiNoiBuoiCungLop ? r.du.find((x) => x.lop === lopMacDinh) : r.du[0]
      if (b) {
        const x = await xemBuoiHoc(b.id, true)
        if (con && x.ok) setTt(x.du)
      }
      if (con) setDangTaiBuoi(false)
    })()
    return () => {
      con = false
    }
  }, [chiNoiBuoiCungLop, lopMacDinh])

  const capNhat = useCallback(
    (x: TrangThaiBuoi) =>
      setTt((cu) => ({ ...x, lopEm: x.lopEm ?? cu?.lopEm ?? null })),
    [],
  )
  const lamMoi = useCallback(async () => {
    if (!idBuoi) return true
    const r = await xemBuoiHoc(idBuoi)
    if (!r.ok) return false
    capNhat(r.du)
    return true
  }, [idBuoi, capNhat])
  // TỰ LÀM MỚI 5 GIÂY qua nhịp chung của app thầy (không gọi chồng, tab ẩn không gọi, lỗi lùi dần) — chỉ khi buổi đang mở và KHÔNG đang chiếu mã
  // (tấm chiếu mã tự hỏi 5 giây của riêng nó).
  useNhipThay(lamMoi, NHIP_PHONG_CHO_THAY, !!tt?.buoi.dangMo && !chieuMa, TUY_CHON_NHIP_THAY.phongCho)

  const batDauDiemDanh = async () => {
    setDangMo(true)
    const r = await moBuoiHoc(lopChon || lopMacDinh, tenMacDinh)
    setDangMo(false)
    if (!r.ok) {
      showToast(r.chu, 'error')
      return
    }
    setTt(r.du)
    setChieuMa(true)
  }
  const hoiPhongCho = useCallback(async (): Promise<PhongChoChieu> => {
    if (!idBuoi) throw new Error('chưa có buổi')
    const r = await xemBuoiHoc(idBuoi)
    if (!r.ok) throw new Error(r.chu)
    capNhat(r.du)
    return {
      em: r.du.coMat.map((e) => ({ sbd: e.sbd, hoTen: e.hoTen })),
      siSo: r.du.siSo,
      ...(r.du.ma ? { ma: r.du.ma, link: linkDiemDanh(goc, r.du.ma) } : {}),
    }
  }, [idBuoi, goc, capNhat])

  const ketThuc = async () => {
    if (!idBuoi) return
    const ok = await hoiXacNhan({
      tieuDe: 'Kết thúc buổi học?',
      noiDung: 'Mã điểm danh hết hiệu lực ngay; em chưa điểm danh sẽ không vào được nữa. Danh sách có mặt và kết quả lên bảng vẫn giữ.',
      nhanDongY: 'Kết thúc buổi',
      nhanKhong: 'Chưa',
    })
    if (!ok) return
    const r = await dongBuoiHoc(idBuoi)
    if (!r.ok) showToast(r.chu, 'error')
    else {
      capNhat(r.du)
      showToast('Đã kết thúc buổi học', 'success')
    }
  }
  const botEm = async (sbd: string) => {
    if (!idBuoi) return
    const r = await botEmBuoi(idBuoi, sbd)
    if (!r.ok) showToast(r.chu, 'error')
    else capNhat(r.du)
  }
  const themEm = async () => {
    if (!idBuoi || !emThem.size || dangThem) return
    setDangThem(true)
    const r = await themEmBuoi(idBuoi, [...emThem])
    setDangThem(false)
    if (!r.ok) showToast(r.chu, 'error')
    else {
      capNhat(r.du)
      showToast(`Đã thêm ${emThem.size} em vào danh sách có mặt`, 'success')
      setEmThem(new Set())
    }
  }
  const moThem = async () => {
    setThemMo(true)
    if (idBuoi && !tt?.lopEm) {
      const r = await xemBuoiHoc(idBuoi, true)
      if (r.ok) setTt(r.du)
    }
  }
  const coMat = useMemo(() => tt?.coMat ?? [], [tt])
  const lopCuaEm = useMemo(() => new Map((tt?.lopEm ?? []).map((e) => [e.sbd, e.tenLop])), [tt])
  const coMatMap = useMemo(() => new Map(coMat.map((e) => [e.sbd, e])), [coMat])
  const dsLopThem = useMemo(() => [...new Set((tt?.lopEm ?? []).map((e) => e.tenLop).filter(Boolean))].sort((a, b) => a.localeCompare(b, 'vi')), [tt])
  // Mặc định lọc theo lớp của buổi; thầy đổi sang "Mọi lớp" khi em học ghép.
  const lopLoc = lopThem ?? tt?.buoi.lop ?? ''
  const emLoc = useMemo(() => locEmThem(tt?.lopEm ?? [], lopLoc, timEm), [tt, lopLoc, timEm])
  const buoiXong = !!tt && !tt.buoi.dangMo
  return { dsLop, lopChon, setLopChon, tt, dangTaiBuoi, loiBuoi, dangMo, chieuMa, setChieuMa, themMo, setThemMo, timEm, setTimEm, emThem, setEmThem, lopThem, setLopThem, dangThem, goc, idBuoi, capNhat, lamMoi, batDauDiemDanh, hoiPhongCho, ketThuc, botEm, themEm, moThem, coMat, lopCuaEm, coMatMap, dsLopThem, lopLoc, emLoc, buoiXong }
}
export type DiemDanhBuoi = ReturnType<typeof useDiemDanhBuoi>

/** Khung bước "Điểm danh" (số bước + tiêu đề) và tấm chiếu mã — y hệt thẻ Dạy học. */
export function BuocDiemDanh({ dd, soBuoc = 1, idTieuDe = 'dh-b1', khoaLop = false }: { dd: DiemDanhBuoi; soBuoc?: number; idTieuDe?: string; khoaLop?: boolean }) {
  const { dsLop, lopChon, setLopChon, tt, dangTaiBuoi, loiBuoi, dangMo, chieuMa, setChieuMa, themMo, setThemMo, timEm, setTimEm, emThem, setEmThem, setLopThem, dangThem, goc, batDauDiemDanh, hoiPhongCho, ketThuc, botEm, themEm, moThem, coMat, coMatMap, dsLopThem, lopLoc, emLoc, buoiXong } = dd
  return (
    <>
      <section className="dh-buoc" aria-labelledby={idTieuDe}>
        <div className="dh-buoc-dau">
          <span className="dh-so" aria-hidden="true">
            {soBuoc}
          </span>
          <div className="dh-buoc-ten">
            <h2 id={idTieuDe}>Điểm danh</h2>
            <p>{tt ? tt.buoi.ten : 'Mở buổi học, chiếu mã lên máy chiếu cho em điểm danh.'}</p>
          </div>
          {tt && <span className={`dh-chip${buoiXong ? ' dh-chip--xam' : ' dh-chip--xanh'}`}>{buoiXong ? 'Đã kết thúc' : 'Đang điểm danh'}</span>}
        </div>

        {dangTaiBuoi ? (
          <p className="dh-phu" aria-busy="true">
            Đang tìm buổi học đang mở…
          </p>
        ) : !tt || buoiXong ? (
          <div className="dh-hang">
            {loiBuoi && (
              <p className="dh-loi" role="alert">
                {loiBuoi}
              </p>
            )}
            <label className="dh-chon-lop">
              <span>Lớp học hôm nay</span>
              <select value={lopChon} onChange={(e) => setLopChon(e.target.value)} disabled={khoaLop}>
                <option value="">Mọi lớp (em lớp nào cũng điểm danh được)</option>
                {lopChon && !dsLop.some((l) => l.tenLop === lopChon) && <option value={lopChon}>{lopChon}</option>}
                {dsLop.map((l) => (
                  <option key={l.tenLop} value={l.tenLop}>
                    {l.tenLop} · {l.soEm} em
                  </option>
                ))}
              </select>
            </label>
            <button type="button" className="m3-nut-chinh dh-nut" onClick={() => void batDauDiemDanh()} disabled={dangMo}>
              <UserCheck size={18} aria-hidden="true" /> {dangMo ? 'Đang mở buổi…' : 'Điểm danh'}
            </button>
          </div>
        ) : null}

        {tt && (
          <>
            <div className="dh-dem">
              <b className="dh-so-lon">{coMat.length}</b>
              <span>
                {tt.siSo ? `/ ${tt.siSo} em` : 'em'} có mặt
                {tt.buoi.lop ? ` · ${tt.buoi.lop}` : ''}
              </span>
              {!buoiXong && (
                <span className="dh-dem-nut">
                  <button type="button" className="m3-nut-tonal dh-nut" onClick={() => setChieuMa(true)}>
                    <MonitorPlay size={18} aria-hidden="true" /> Chiếu mã điểm danh
                  </button>
                  <button type="button" className="m3-nut-vien dh-nut" onClick={() => (themMo ? setThemMo(false) : void moThem())} aria-expanded={themMo}>
                    <Plus size={18} aria-hidden="true" /> Thêm em chưa điểm danh được
                  </button>
                  <button type="button" className="m3-nut-chu dh-nut" onClick={() => void ketThuc()}>
                    Kết thúc buổi
                  </button>
                </span>
              )}
            </div>
            {coMat.length === 0 ? (
              <p className="dh-phu">Chưa em nào điểm danh. Bấm “Chiếu mã điểm danh” để em quét QR hoặc nhập mã; danh sách tự cập nhật mỗi 5 giây.</p>
            ) : (
              <ul className="dh-chip-ds" aria-label="Học sinh có mặt">
                {coMat.map((e) => (
                  <li key={e.sbd} className="dh-em">
                    <span className="dh-em-ten" title={`${e.hoTen || e.sbd} · điểm danh ${gio(e.luc)}${e.cach === 'thay' ? ' (thầy thêm)' : ''}`}>
                      {tenNgan(e.hoTen, e.sbd)}
                    </span>
                    {!buoiXong && (
                      <button type="button" className="dh-em-bo" onClick={() => void botEm(e.sbd)} aria-label={`Bớt ${e.hoTen || e.sbd} khỏi danh sách có mặt`}>
                        <X size={14} aria-hidden="true" />
                      </button>
                    )}
                  </li>
                ))}
              </ul>
            )}
            {themMo && !buoiXong && (
              <div className="dh-them" role="group" aria-labelledby="dh-them-ten">
                <div className="dh-them-dau">
                  <h3 id="dh-them-ten">Thêm em chưa điểm danh được</h3>
                  <button type="button" className="m3-nut-chu dh-nut" onClick={() => setThemMo(false)}>
                    Đóng
                  </button>
                </div>
                <p className="dh-phu">Em quên điện thoại hoặc không quét được mã: tích tên em rồi thêm vào danh sách có mặt (ghi là “thầy thêm”).</p>
                <div className="dh-hang">
                  <label className="dh-chon-lop dh-chon-lop--hep">
                    <span>Lớp</span>
                    <select value={lopLoc} onChange={(e) => setLopThem(e.target.value)}>
                      <option value="">Mọi lớp</option>
                      {dsLopThem.map((l) => (
                        <option key={l} value={l}>
                          {l}
                        </option>
                      ))}
                    </select>
                  </label>
                  <label className="dh-chon-lop">
                    <span>Tìm theo SBD hoặc tên</span>
                    <input className="dh-tim" type="search" value={timEm} onChange={(e) => setTimEm(e.target.value)} placeholder="vd: 1203 hoặc minh anh" autoComplete="off" />
                  </label>
                </div>
                {!tt.lopEm ? (
                  <p className="dh-phu" aria-busy="true">
                    Đang tải danh sách lớp…
                  </p>
                ) : emLoc.length === 0 ? (
                  <p className="dh-phu">{timEm.trim() ? `Không có em nào khớp “${timEm.trim()}”${lopLoc ? ` trong lớp ${lopLoc} — thử chọn “Mọi lớp”` : ''}.` : 'Lớp này chưa có học sinh.'}</p>
                ) : (
                  <>
                    <ul className="dh-them-ds" aria-label="Danh sách học sinh để thêm">
                      {emLoc.slice(0, TOI_DA_HIEN).map((e) => {
                        const co = coMatMap.get(e.sbd)
                        return (
                          <li key={e.sbd} className="dh-them-dong">
                            <label className={`dh-them-o${co ? ' dh-them-o--co' : ''}`}>
                              <input
                                type="checkbox"
                                checked={!!co || emThem.has(e.sbd)}
                                disabled={!!co}
                                onChange={() =>
                                  setEmThem((cu) => {
                                    const m = new Set(cu)
                                    if (m.has(e.sbd)) m.delete(e.sbd)
                                    else m.add(e.sbd)
                                    return m
                                  })
                                }
                              />
                              <span className="dh-them-chu">
                                <span className="dh-them-ten">{e.hoTen || e.sbd}</span>
                                <small>
                                  SBD {e.sbd}
                                  {e.tenLop ? ` · ${e.tenLop}` : ''}
                                </small>
                              </span>
                            </label>
                            {co && <span className={`dh-chip ${co.cach === 'thay' ? 'dh-chip--vang' : 'dh-chip--xanh'}`}>{co.cach === 'thay' ? 'thầy thêm' : 'đã điểm danh'}</span>}
                            {co?.cach === 'thay' && (
                              <button type="button" className="m3-nut-chu dh-nut-nho" onClick={() => void botEm(e.sbd)} aria-label={`Bỏ ${e.hoTen || e.sbd} khỏi danh sách có mặt`}>
                                Bỏ
                              </button>
                            )}
                          </li>
                        )
                      })}
                    </ul>
                    {emLoc.length > TOI_DA_HIEN && <p className="dh-phu">Đang hiện {TOI_DA_HIEN} trong {emLoc.length} em — gõ tên hoặc SBD để lọc.</p>}
                  </>
                )}
                <div className="dh-hang">
                  <button type="button" className="m3-nut-chinh dh-nut" disabled={!emThem.size || dangThem} aria-busy={dangThem} onClick={() => void themEm()}>
                    Thêm {emThem.size} em vào danh sách có mặt
                  </button>
                  {emThem.size > 0 && (
                    <button type="button" className="m3-nut-chu dh-nut" onClick={() => setEmThem(new Set())}>
                      Bỏ chọn
                    </button>
                  )}
                </div>
              </div>
            )}
          </>
        )}
      </section>

      {chieuMa && tt && (
        <TamPhuChieuMa
          maCa={tt.ma ?? '------'}
          tenCa={tt.buoi.ten}
          lop={tt.buoi.lop}
          link={tt.ma ? linkDiemDanh(goc, tt.ma) : undefined}
          diaChi={`${(goc || '').replace(/^https?:\/\//, '')}/hs`}
          soEmCho={coMat.length}
          onDong={() => setChieuMa(false)}
          hoiPhongCho={hoiPhongCho}
          chu={CHU_DIEM_DANH}
          chuPhuMa="Mã đổi mỗi phút · em chỉ điểm danh được cho chính mình"
        />
      )}
    </>
  )
}
