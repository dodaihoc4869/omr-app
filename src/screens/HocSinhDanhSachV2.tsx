// DANH SÁCH HỌC SINH — chế độ Game Hóa 2.0 (TRUNG TU 09/10, thầy duyệt bản vẽ GV-HocSinh, "build luôn"). Cờ tắt ⇒ HocSinhScreen giữ danh sách cũ.
//
//   · đầu màn: tiêu đề 32 + dòng phụ "n em · m lớp"; "Dán link danh sách" (viền) + "Thêm học sinh" (nút chính) — cùng hai nút sẵn có.
//   · MỘT thanh lọc: ô tìm + ba ô chọn Khối · Lớp · Học phí (thay ba hàng chip; bỏ hàng chip học phí trùng ở bảng tổng Học phí).
//   · bảng: Em (chữ đầu, tên, "SBD 1201") · Lớp · Hôm nay (thanh + a/b câu, từ bảng hôm nay của Hành trình) · Ca gần nhất (a/10 điểm)
//     · Học phí (nhãn trạng thái, bấm mở hộp học phí) · nút ⋯ gom mọi thao tác của một em (Mở hồ sơ · Báo cáo · Lịch sử ca · Học phí · Đặt lại mật khẩu).
//   · chia trang 25 em. Không đổi dữ liệu, không đổi lệnh: mọi thao tác gọi ĐÚNG hàm sẵn có của HocSinhScreen.
// Cột "Hôm nay" đọc lệnh sẵn có `/gv/chien-dich` (danh-sach → bang của các Hành trình đang chạy) — chỉ đọc; đọc hỏng thì cột ghi "—", không số giả.
import { useEffect, useMemo, useRef, useState, type ReactNode } from 'react'
import { MoreHorizontal, RefreshCw, Search } from 'lucide-react'
import type { EmTomTat } from '../lib/exam-api'
import { conThieu, dinhDangTien, hocPhiCuaEm, TEN_TRANG_THAI, trangThaiHocPhi, type HocPhiEm, type TongHocPhi as Tong, type TrangThaiHocPhi } from '../lib/hoc-phi'
import { danhSach, docBang } from '../components/chien-dich/api'
import { taiGioiHan } from '../lib/tai-gioi-han'
import { lyDoDeHieu } from '../lib/loi-de-hieu'
import '../components/chien-dich/gv-v2.css'
import './hoc-sinh-v2.css'

/** Số em mỗi trang (bản vẽ: "Em 1–25 trên 74"). */
export const SO_EM_MOT_TRANG = 25

/** Hai chữ đầu cho ô tròn: hai từ cuối của tên ("Nguyễn Minh Anh" → "MA"); chưa có tên ⇒ hai số cuối SBD. */
export function chuDau(hoTen: string, sbd: string): string {
  const tu = hoTen.trim().split(/\s+/).filter(Boolean)
  if (tu.length === 0) return sbd.slice(-2)
  return tu
    .slice(-2)
    .map((t) => t[0]!.toLocaleUpperCase('vi-VN'))
    .join('')
}

/** Nhịp hôm nay của một em trong Hành trình: đã làm / tối thiểu (null = chưa xếp mức). */
export interface NhipEm {
  daLam: number
  toiThieu: number | null
}

/** Đọc bảng hôm nay của mọi Hành trình đang chạy ⇒ SBD → nhịp. Lỗi ⇒ ném (màn ghi "—"). */
export async function taiNhipHomNay(): Promise<Map<string, NhipEm>> {
  const r = await danhSach()
  if (!r.ok) throw new Error(r.chu)
  const chay = r.du.chienDich.filter((c) => c.hanhTrinh && c.trangThai === 'dang_chay')
  const bang = await taiGioiHan(chay, async (c) => {
    try {
      const b = await docBang(c.id)
      return b.ok ? b.du : null
    } catch {
      return null
    }
  })
  const m = new Map<string, NhipEm>()
  for (const b of bang) for (const e of b?.hanhTrinhNgay?.em ?? []) m.set(String(e.sbd), { daLam: e.daLam, toiThieu: e.toiThieu })
  return m
}

const TT_LOC: TrangThaiHocPhi[] = ['du', 'con_thieu', 'chua_nop', 'khong_thu']
const diem = (x: number) => x.toFixed(1).replace('.', ',')

export interface PropsDanhSachV2 {
  ds: EmTomTat[] | null
  /** Danh sách sau mọi bộ lọc (khối · lớp · ô tìm · học phí) — HocSinhScreen lọc, màn này chỉ vẽ + chia trang. */
  dsLoc: EmTomTat[]
  loi: string
  dangTai: boolean
  onTaiLai: () => void
  timKiem: string
  datTimKiem: (v: string) => void
  khoiLoc: number | null
  datKhoiLoc: (k: number | null) => void
  lopLoc: string
  datLopLoc: (l: string) => void
  dsLop: { tenLop: string; soEm: number | null }[]
  locHocPhi: TrangThaiHocPhi | null
  datLocHocPhi: (t: TrangThaiHocPhi | null) => void
  /** Tổng học phí theo khối/lớp đang chọn (số em mỗi trạng thái cho ô chọn Học phí). */
  tongHp: Tong | null
  hocPhi: Map<string, HocPhiEm> | null
  tenLopEm: (sbd: string, lopCu: string) => string
  khoiCua: (namSinh: string) => number | null
  moHoSo: (sbd: string, muc: 'tong-quan' | 'bao-cao' | 'lich-su') => void
  moHocPhi: (sbd: string, hoTen: string) => void
  datLaiMatKhau: (sbd: string, hoTen: string) => void
  dangResetMk: boolean
  /** Hai nút đầu màn (Dán link danh sách · Thêm học sinh) — HocSinhScreen dựng, giữ nguyên lệnh. */
  nutDau: ReactNode
  /** Bảng tổng học phí (không hàng chip lọc) — đặt dưới bảng em. */
  tongHocPhi: ReactNode
}

/** Nút ⋯ một em: thực đơn thao tác. Esc đóng và trả focus về nút; bấm ra ngoài đóng. */
function ThaoTacEm({ e, so, hocPhiChu, onMo, coHocPhi, dangResetMk }: { e: EmTomTat; so: string; hocPhiChu: string; coHocPhi: boolean; dangResetMk: boolean; onMo: (viec: 'ho-so' | 'bao-cao' | 'lich-su' | 'hoc-phi' | 'mat-khau') => void }) {
  const [mo, setMo] = useState(false)
  const nut = useRef<HTMLButtonElement>(null)
  const thucDon = useRef<HTMLDivElement>(null)
  const ten = e.hoTen || `SBD ${e.sbd}`
  useEffect(() => {
    if (!mo) return
    thucDon.current?.querySelector<HTMLButtonElement>('[role="menuitem"]')?.focus()
    const ngoai = (ev: MouseEvent) => {
      if (!thucDon.current?.contains(ev.target as Node) && !nut.current?.contains(ev.target as Node)) setMo(false)
    }
    document.addEventListener('mousedown', ngoai)
    return () => document.removeEventListener('mousedown', ngoai)
  }, [mo])
  const chon = (viec: Parameters<typeof onMo>[0]) => {
    setMo(false)
    onMo(viec)
  }
  const phim = (ev: React.KeyboardEvent) => {
    if (ev.key === 'Escape') {
      ev.preventDefault()
      setMo(false)
      nut.current?.focus()
      return
    }
    if (ev.key !== 'ArrowDown' && ev.key !== 'ArrowUp') return
    ev.preventDefault()
    const ds = [...(thucDon.current?.querySelectorAll<HTMLButtonElement>('[role="menuitem"]:not(:disabled)') ?? [])]
    const i = ds.indexOf(document.activeElement as HTMLButtonElement)
    ds[(i + (ev.key === 'ArrowDown' ? 1 : ds.length - 1)) % ds.length]?.focus()
  }
  return (
    <span className="gvhs-thao-tac">
      <button ref={nut} type="button" className="gvhs-nut-ba-cham tt-nhan" aria-label={`Thao tác cho em ${ten}`} aria-haspopup="menu" aria-expanded={mo} onClick={() => setMo((v) => !v)}>
        <MoreHorizontal size={20} aria-hidden="true" />
      </button>
      {mo && (
        <div ref={thucDon} className="gvhs-thuc-don tt-mo-lop" role="menu" aria-label={`Thao tác cho em ${ten}`} onKeyDown={phim}>
          <button type="button" role="menuitem" onClick={() => chon('ho-so')}>
            Mở hồ sơ
          </button>
          <button type="button" role="menuitem" onClick={() => chon('bao-cao')}>
            Báo cáo ca gần nhất
          </button>
          <button type="button" role="menuitem" onClick={() => chon('lich-su')}>
            Lịch sử ca ({so})
          </button>
          <button type="button" role="menuitem" disabled={!coHocPhi} onClick={() => chon('hoc-phi')}>
            Học phí · {hocPhiChu}
          </button>
          <button type="button" role="menuitem" disabled={dangResetMk} onClick={() => chon('mat-khau')}>
            {dangResetMk ? 'Đang đặt lại mật khẩu…' : 'Đặt lại mật khẩu'}
          </button>
        </div>
      )}
    </span>
  )
}

export default function HocSinhDanhSachV2(p: PropsDanhSachV2) {
  const [trang, setTrang] = useState(0)
  const [nhip, setNhip] = useState<Map<string, NhipEm> | null>(null)
  const [loiNhip, setLoiNhip] = useState(false)

  useEffect(() => {
    let con = true
    taiNhipHomNay()
      .then((m) => con && setNhip(m))
      .catch(() => con && setLoiNhip(true))
    return () => {
      con = false
    }
  }, [])

  // Đổi bộ lọc ⇒ về trang đầu.
  useEffect(() => setTrang(0), [p.timKiem, p.khoiLoc, p.lopLoc, p.locHocPhi])
  const soTrang = Math.max(1, Math.ceil(p.dsLoc.length / SO_EM_MOT_TRANG))
  const trangHien = Math.min(trang, soTrang - 1)
  const dau = trangHien * SO_EM_MOT_TRANG
  const dsTrang = useMemo(() => p.dsLoc.slice(dau, dau + SO_EM_MOT_TRANG), [p.dsLoc, dau])

  const soLop = p.dsLop.length
  const chuLoi = p.loi ? lyDoDeHieu(p.loi) : ''

  return (
    <div className="gv-page gvhs">
      <header className="gvhs-dau">
        <div className="gvhs-dau-chu">
          <h1 className="gvv2-h1">Học sinh</h1>
          {p.ds && p.ds.length > 0 && (
            <p className="gvv2-phu">
              <span className="gvv2-so">{p.ds.length}</span> em{soLop > 0 && <> · <span className="gvv2-so">{soLop}</span> lớp</>}
            </p>
          )}
        </div>
        <div className="gvhs-dau-nut">{p.nutDau}</div>
      </header>

      <section className="gvv2-the gvhs-the" aria-label="Danh sách học sinh">
        <div className="gvhs-loc" role="search">
          <label className="gvhs-tim">
            <Search size={18} aria-hidden="true" />
            <span className="sr-only">Tìm học sinh</span>
            <input type="search" inputMode="search" placeholder="Tìm tên, số báo danh hoặc lớp" value={p.timKiem} onChange={(ev) => p.datTimKiem(ev.target.value)} />
          </label>
          <label className="gvhs-chon">
            <span>Khối</span>
            <select value={p.khoiLoc ?? ''} onChange={(ev) => p.datKhoiLoc(ev.target.value ? Number(ev.target.value) : null)} aria-label="Lọc theo khối">
              <option value="">Tất cả</option>
              {[10, 11, 12].map((k) => (
                <option key={k} value={k}>
                  Khối {k}
                </option>
              ))}
            </select>
          </label>
          <label className="gvhs-chon">
            <span>Lớp</span>
            <select value={p.lopLoc} onChange={(ev) => p.datLopLoc(ev.target.value)} aria-label="Lọc theo lớp">
              <option value="">Tất cả</option>
              {p.dsLop.map((l) => (
                <option key={l.tenLop} value={l.tenLop}>
                  {l.soEm === null ? l.tenLop : `${l.tenLop} · ${l.soEm} em`}
                </option>
              ))}
            </select>
          </label>
          <label className="gvhs-chon">
            <span>Học phí</span>
            <select value={p.locHocPhi ?? ''} disabled={!p.hocPhi} onChange={(ev) => p.datLocHocPhi((ev.target.value || null) as TrangThaiHocPhi | null)} aria-label="Lọc theo học phí">
              <option value="">Tất cả</option>
              {TT_LOC.filter((t) => t !== 'khong_thu' || (p.tongHp?.dem.khong_thu ?? 0) > 0).map((t) => (
                <option key={t} value={t}>
                  {p.tongHp ? `${TEN_TRANG_THAI[t]} · ${p.tongHp.dem[t]} em` : TEN_TRANG_THAI[t]}
                </option>
              ))}
            </select>
          </label>
          <button type="button" className="gvhs-tai-lai tt-nhan" onClick={p.onTaiLai} disabled={p.dangTai} aria-label="Tải lại danh sách học sinh" title="Tải lại danh sách">
            <RefreshCw size={18} aria-hidden="true" className={p.dangTai ? 'gvhs-quay' : undefined} />
          </button>
        </div>

        {chuLoi && (
          <div className="gvhs-loi" role="alert">
            <p>Chưa tải được danh sách học sinh. {chuLoi}</p>
            <button type="button" className="gvv2-nut-vien tt-nhan" onClick={p.onTaiLai} disabled={p.dangTai}>
              {p.dangTai ? 'Đang tải lại…' : 'Thử lại'}
            </button>
          </div>
        )}

        {p.ds === null ? (
          <div className="gvhs-xuong" role="status" aria-label="Đang tải danh sách học sinh">
            {[0, 1, 2, 3, 4].map((i) => (
              <span key={i} className="gvhs-xuong-dong">
                <span className="gv-xuong-khoi tt-xuong" style={{ width: 36, height: 36, borderRadius: 999 }} />
                <span className="gv-xuong-khoi tt-xuong" style={{ width: '28%', height: 14 }} />
                <span className="gv-xuong-khoi tt-xuong" style={{ width: '12%', height: 14 }} />
                <span className="gv-xuong-khoi tt-xuong" style={{ width: '18%', height: 8 }} />
              </span>
            ))}
          </div>
        ) : p.dsLoc.length === 0 ? (
          !chuLoi && <p className="gvv2-trong gvhs-trong">{p.ds.length === 0 ? 'Chưa em nào có tên trong danh sách. Bấm "Dán link danh sách" hoặc "Thêm học sinh"; em vào thi một ca cũng tự có tên ở đây.' : 'Không có em nào khớp bộ lọc.'}</p>
        ) : (
          <table className="gvhs-bang">
            <thead>
              <tr>
                <th scope="col">Em</th>
                <th scope="col">Lớp</th>
                <th scope="col">Hôm nay</th>
                <th scope="col">Ca gần nhất</th>
                <th scope="col">Học phí</th>
                <th scope="col">
                  <span className="sr-only">Thao tác</span>
                </th>
              </tr>
            </thead>
            <tbody>
              {dsTrang.map((e) => {
                const ten = e.hoTen || `SBD ${e.sbd}`
                const lop = p.tenLopEm(e.sbd, e.lop)
                const khoi = p.khoiCua(e.namSinh)
                const n = nhip?.get(e.sbd)
                const hp = hocPhiCuaEm(e.sbd, p.hocPhi)
                const tt = trangThaiHocPhi(hp.phaiNop, hp.daNop)
                const ti = n && n.toiThieu ? Math.min(100, Math.round((100 * n.daLam) / n.toiThieu)) : 0
                const du = !!n && n.toiThieu !== null && n.daLam >= n.toiThieu
                return (
                  <tr key={e.sbd} data-sbd={e.sbd}>
                    <td className="gvhs-o-em">
                      <span className="gvhs-em">
                        <span className="gvv2-avatar" aria-hidden="true">
                          {chuDau(e.hoTen, e.sbd)}
                        </span>
                        <span className="gvhs-em-chu">
                          <button type="button" className="gvhs-ten" onClick={() => p.moHoSo(e.sbd, 'tong-quan')} aria-label={`Mở hồ sơ ${ten}`}>
                            {ten}
                          </button>
                          <small className="gvv2-so">
                            SBD {e.sbd}
                            {!e.hoTen && ' · chưa có tên'}
                            {e.trangThai === 'ngoai_danh_sach' && ' · ngoài danh sách'}
                          </small>
                        </span>
                      </span>
                    </td>
                    <td data-nhan="Lớp">{lop || (khoi ? `Khối ${khoi}` : '—')}</td>
                    <td data-nhan="Hôm nay">
                      {n ? (
                        <span className="gvhs-hom-nay">
                          <span className="gvv2-thanh" data-du={du ? 'true' : 'false'} role="progressbar" aria-label={`${ten}: câu đã làm hôm nay`} aria-valuemin={0} aria-valuemax={100} aria-valuenow={ti}>
                            <i className="tt-thanh" style={{ width: `${ti}%` }} />
                          </span>
                          <span className={`gvv2-so${n.daLam === 0 && n.toiThieu ? ' gvhs-chua-lam' : ''}`}>{n.toiThieu ? `${n.daLam}/${n.toiThieu} câu` : `${n.daLam} câu`}</span>
                        </span>
                      ) : nhip === null && !loiNhip ? (
                        <span className="gv-xuong-khoi tt-xuong" style={{ width: 120, height: 8 }} aria-label="Đang đọc nhịp hôm nay" role="img" />
                      ) : (
                        <span className="gvhs-mo" title={loiNhip ? 'Chưa đọc được nhịp hôm nay của Hành trình' : 'Em chưa có kế hoạch Hành trình hôm nay'}>
                          {loiNhip ? '—' : 'Chưa xếp'}
                        </span>
                      )}
                    </td>
                    <td data-nhan="Ca gần nhất" className="gvv2-so">
                      {e.diemGanNhat === null ? (
                        <span className="gvhs-mo">Chưa có ca</span>
                      ) : (
                        <span>
                          <b>{diem(e.diemGanNhat)}</b>
                          <span className="gvhs-mo">/10 điểm</span>
                        </span>
                      )}
                    </td>
                    <td data-nhan="Học phí">
                      {p.hocPhi ? (
                        <button
                          type="button"
                          className="gvhs-hp tt-nhan"
                          onClick={() => p.moHocPhi(e.sbd, e.hoTen)}
                          aria-label={`Học phí của ${ten}: ${TEN_TRANG_THAI[tt]}, đã nộp ${dinhDangTien(hp.daNop)}, còn thiếu ${dinhDangTien(conThieu(hp))}`}
                          title={tt === 'con_thieu' ? `Thiếu ${dinhDangTien(conThieu(hp))}` : undefined}
                          data-hoc-phi={tt}
                        >
                          {/* nhãn viên thuốc 32 px nằm trong vùng chạm 44 px */}
                          <span className="gvhs-hp-nhan">{TEN_TRANG_THAI[tt]}</span>
                        </button>
                      ) : (
                        <span className="gvhs-mo">—</span>
                      )}
                    </td>
                    <td className="gvhs-o-nut">
                      <ThaoTacEm
                        e={e}
                        so={String(e.soCa)}
                        coHocPhi={!!p.hocPhi}
                        hocPhiChu={p.hocPhi ? (tt === 'con_thieu' ? `Thiếu ${dinhDangTien(conThieu(hp))}` : TEN_TRANG_THAI[tt]) : 'chưa tải'}
                        dangResetMk={p.dangResetMk}
                        onMo={(viec) => {
                          if (viec === 'ho-so') p.moHoSo(e.sbd, 'tong-quan')
                          else if (viec === 'bao-cao') p.moHoSo(e.sbd, 'bao-cao')
                          else if (viec === 'lich-su') p.moHoSo(e.sbd, 'lich-su')
                          else if (viec === 'hoc-phi') p.moHocPhi(e.sbd, e.hoTen)
                          else p.datLaiMatKhau(e.sbd, e.hoTen)
                        }}
                      />
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        )}

        {p.dsLoc.length > SO_EM_MOT_TRANG && (
          <nav className="gvhs-trang" aria-label="Chia trang danh sách học sinh">
            <span className="gvv2-so">
              Em {dau + 1}–{Math.min(dau + SO_EM_MOT_TRANG, p.dsLoc.length)} trên {p.dsLoc.length}
            </span>
            <span className="gvhs-trang-nut">
              <button type="button" className="gvv2-nut-vien tt-nhan" disabled={trangHien === 0} onClick={() => setTrang(trangHien - 1)}>
                Trang trước
              </button>
              <button type="button" className="gvv2-nut-vien tt-nhan" disabled={trangHien >= soTrang - 1} onClick={() => setTrang(trangHien + 1)}>
                Trang sau
              </button>
            </span>
          </nav>
        )}
      </section>

      {p.tongHocPhi}
    </div>
  )
}
