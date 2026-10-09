// BẢN DUYỆT V2 · MÀN 14 — "HÀNH TRÌNH GIỎI HÓA" của thầy (thầy ra lệnh 09/10/2026). Ba thẻ: Tổng quan (danh sách + giao chiến dịch như cũ) ·
// Nhịp hôm nay (bảng từng em) · Cần chữa (điểm danh + buổi chữa ở mục Chữa trên lớp). Khối 10/11/12 lấy từ ba hành trình đang chạy.
// SỐ THẬT, không số minh hoạ: danh sách hành trình + số em (`/gv/chien-dich danh-sach`), từng em hôm nay (`bang` → `hanhTrinhNgay.em`: tầng,
// tối thiểu, đã làm, đã xếp, còn thiếu), chương/bài/câu của khối từ cây kho DẠY HỌC trên máy thầy (cùng hàm của bước Bài hôm nay).
// Bản duyệt có vài ô máy chủ CHƯA gửi (phút làm bài mỗi em, "sẵn sàng +1 bậc", lý do từng em, "máy đã tự điều chỉnh N kế hoạch") — màn KHÔNG vẽ các ô đó;
// thay bằng chỉ số đếm được từ chính bảng hôm nay (đủ mức tối thiểu, chưa làm câu nào, thiếu câu phù hợp, tầng Vận dụng trở lên).
// "Bổ sung bài" mở đúng luồng Bài hôm nay (tick bài vừa dạy) — máy chủ chưa có lệnh thêm bài thẳng vào hành trình theo khối.
import { useCallback, useEffect, useMemo, useState, type ReactNode } from 'react'
import { AlertTriangle, BookOpen, CalendarCheck, ChevronRight, Clock, GraduationCap, Plus, Search, ShieldCheck, TrendingUp, Users } from 'lucide-react'
import { useAppStore } from '../../store/appStore'
import { KHOA_MO_THE_DAY_HOC, dsBaiCuaKhoi, type BaiCay } from '../../lib/bai-hom-nay'
import { dungCay } from '../../lib/cay-chon-de'
import { khoDayHoc, locDeDayHoc } from '../../lib/day-hoc-len-bang'
import type { TeacherExamSource } from '../../data/examContent'
import { danhSach, docBang, type BangChienDich, type ChienDichTom } from './api'
import './gv-v2.css'

export type EmNhip = NonNullable<BangChienDich['hanhTrinhNgay']>['em'][number]
const TEN_TANG = ['Nền', 'Hiểu', 'Vận dụng', 'Tổng hợp'] as const

/** Khối từ nhãn lớp của hành trình ("Khối 12") — không đọc được ⇒ null. */
export function khoiCuaHanhTrinh(cd: Pick<ChienDichTom, 'lop' | 'ten'>): '10' | '11' | '12' | null {
  const m = /(1[012])/.exec(`${cd.lop ?? ''} ${cd.ten}`)
  return m ? (m[1] as '10' | '11' | '12') : null
}

/** Bốn chỉ số đếm được từ bảng hôm nay (không suy diễn): đủ mức · chưa làm · thiếu câu phù hợp · tầng Vận dụng trở lên. */
export function chiSoNhip(em: readonly EmNhip[]) {
  const coMuc = em.filter((e) => e.toiThieu !== null && e.toiThieu > 0)
  return {
    tong: em.length,
    duMuc: coMuc.filter((e) => e.daLam >= (e.toiThieu ?? 0)).length,
    coMuc: coMuc.length,
    chuaLam: em.filter((e) => e.daLam === 0).length,
    thieuCau: em.filter((e) => e.conThieu > 0).length,
    tangCao: em.filter((e) => (e.tang ?? 0) >= 3).length,
  }
}

/** Chương của khối: số bài + số câu (cộng `soCau` các bài trong cây DẠY HỌC). */
export function chuongCuaKhoi(bai: readonly BaiCay[]): { chuong: string; soBai: number; soCau: number }[] {
  const ra = new Map<string, { chuong: string; soBai: number; soCau: number }>()
  for (const b of bai) {
    const c = ra.get(b.chuong) ?? { chuong: b.chuong, soBai: 0, soCau: 0 }
    c.soBai += 1
    c.soCau += b.soCau
    ra.set(b.chuong, c)
  }
  return [...ra.values()]
}

const chuCai = (ten: string) => {
  const chu = ten.trim().split(/\s+/).filter(Boolean)
  return ((chu.length >= 2 ? chu[chu.length - 2]![0]! : '') + (chu[chu.length - 1]?.[0] ?? '')).toLocaleUpperCase('vi')
}

function useKhoDayHoc(khoi: string | null) {
  const [kho, setKho] = useState<TeacherExamSource[] | null>(null)
  const [loi, setLoi] = useState(false)
  useEffect(() => {
    if (!khoi || kho) return
    let song = true
    void (async () => {
      try {
        const [{ loadExamSources }, { khuTrungNguon }, { tachNhieuTheoPhan }] = await Promise.all([import('../../lib/exam-db'), import('../../lib/khu-trung-cau'), import('../../lib/tach-phan-de')])
        const ds = khoDayHoc(await loadExamSources(), khuTrungNguon, tachNhieuTheoPhan)
        if (song) setKho(ds)
      } catch {
        if (song) setLoi(true)
      }
    })()
    return () => {
      song = false
    }
  }, [khoi, kho])
  const bai = useMemo(() => (kho && khoi ? dsBaiCuaKhoi(dungCay(locDeDayHoc(kho)), khoi) : []), [kho, khoi])
  return { bai, dangTai: !!khoi && !kho && !loi, loi }
}

function TheSo({ mau, bieu, nhan, so, phu, ti }: { mau: 'xl' | 'ho' | 'hp' | 'xd'; bieu: ReactNode; nhan: string; so: ReactNode; phu: string; ti?: number }) {
  return (
    <div className="gvv2-the-so" data-mau={mau}>
      <span className="gvv2-the-so-bieu" aria-hidden="true">
        {bieu}
      </span>
      <div className="gvv2-the-so-chu">
        <span className="gvv2-the-so-nhan">{nhan}</span>
        <span className="gvv2-the-so-so">
          {so}
          {ti !== undefined && (
            <span className="gvv2-thanh" role="progressbar" aria-label={nhan} aria-valuemin={0} aria-valuemax={100} aria-valuenow={ti}>
              <i style={{ width: `${ti}%` }} />
            </span>
          )}
        </span>
        <span className="gvv2-the-so-phu">{phu}</span>
      </div>
    </div>
  )
}

function ChipTang({ tang }: { tang: number | null }) {
  if (!tang) return <span className="gvv2-chip" data-tang="0">Chưa xếp tầng</span>
  return (
    <span className="gvv2-chip" data-tang={tang}>
      <TrendingUp size={14} aria-hidden="true" />
      {TEN_TANG[tang - 1] ?? `Tầng ${tang}`}
    </span>
  )
}

function BangNhip({ em }: { em: readonly EmNhip[] }) {
  const [tim, setTim] = useState('')
  const ds = useMemo(() => {
    const q = tim.trim().toLocaleLowerCase('vi')
    const loc = q ? em.filter((e) => e.ten.toLocaleLowerCase('vi').includes(q) || e.sbd.includes(q)) : [...em]
    // Em chưa đủ mức đứng trước (ít câu nhất trước), rồi tới em đã đủ.
    const du = (e: EmNhip) => e.toiThieu !== null && e.daLam >= e.toiThieu
    return loc.sort((a, b) => Number(du(a)) - Number(du(b)) || a.daLam - b.daLam || a.ten.localeCompare(b.ten, 'vi'))
  }, [em, tim])
  return (
    <section className="gvv2-the gvv2-bang" aria-labelledby="gvv2-nhip-tieu">
      <div className="gvv2-bang-dau">
        <h2 id="gvv2-nhip-tieu" className="gvv2-h2">
          Nhịp học hôm nay
        </h2>
        <label className="gvv2-tim">
          <Search size={16} aria-hidden="true" />
          <input type="search" value={tim} onChange={(e) => setTim(e.target.value)} placeholder="Tìm học sinh, số báo danh…" aria-label="Tìm học sinh theo tên hoặc số báo danh" />
        </label>
      </div>
      {ds.length === 0 ? (
        <p className="gvv2-trong">{em.length === 0 ? 'Hành trình này chưa có em nào được xếp kế hoạch hôm nay.' : 'Không có em nào khớp ô tìm.'}</p>
      ) : (
        <div className="gvv2-bang-cuon">
          <table>
            <thead>
              <tr>
                <th scope="col">Học sinh</th>
                <th scope="col">Hôm nay</th>
                <th scope="col">Tầng hiện tại</th>
                <th scope="col">Đã xếp</th>
                <th scope="col">Ghi chú</th>
              </tr>
            </thead>
            <tbody>
              {ds.map((e) => {
                const ti = e.toiThieu && e.toiThieu > 0 ? Math.round((100 * Math.min(e.daLam, e.toiThieu)) / e.toiThieu) : 0
                const du = e.toiThieu !== null && e.daLam >= e.toiThieu
                return (
                  <tr key={e.sbd}>
                    <td>
                      <span className="gvv2-em">
                        <span className="gvv2-avatar" aria-hidden="true">
                          {chuCai(e.ten || e.sbd)}
                        </span>
                        <span className="gvv2-em-chu">
                          <b>{e.ten || e.sbd}</b>
                          <small>SBD {e.sbd}</small>
                        </span>
                      </span>
                    </td>
                    <td>
                      <span className="gvv2-tien-do">
                        <b className="gvv2-so">
                          {e.daLam}/{e.toiThieu ?? '—'} câu
                        </b>
                        <span className="gvv2-thanh" data-du={du ? 'true' : 'false'} role="progressbar" aria-label={`${e.ten}: câu đã làm hôm nay`} aria-valuemin={0} aria-valuemax={100} aria-valuenow={ti}>
                          <i style={{ width: `${ti}%` }} />
                        </span>
                      </span>
                    </td>
                    <td>
                      <ChipTang tang={e.tang} />
                    </td>
                    <td className="gvv2-so">{e.daXep} câu</td>
                    <td className="gvv2-ghi-chu">{e.conThieu > 0 ? <span data-loai="thieu">Thiếu {e.conThieu} câu phù hợp</span> : du ? <span data-loai="du">Đủ mức hôm nay</span> : e.daLam === 0 ? <span data-loai="chua">Chưa làm câu nào</span> : <span>Còn {Math.max(0, (e.toiThieu ?? 0) - e.daLam)} câu</span>}</td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      )}
    </section>
  )
}

function TheChuong({ khoi }: { khoi: string | null }) {
  const { bai, dangTai, loi } = useKhoDayHoc(khoi)
  const chuong = useMemo(() => chuongCuaKhoi(bai), [bai])
  return (
    <aside className="gvv2-the gvv2-chuong" aria-labelledby="gvv2-chuong-tieu">
      <div className="gvv2-chuong-dau">
        <span className="gvv2-o-bieu" aria-hidden="true">
          <BookOpen size={20} />
        </span>
        <span>
          <h2 id="gvv2-chuong-tieu" className="gvv2-h2">
            Hành trình Khối {khoi ?? '—'}
          </h2>
          <small>Chương và bài trong kho DẠY HỌC trên máy này</small>
        </span>
      </div>
      {dangTai ? (
        <p className="gvv2-trong" role="status">
          Đang đọc kho đề trên máy…
        </p>
      ) : loi ? (
        <p className="gvv2-trong" role="alert">
          Chưa đọc được kho đề trên máy này.
        </p>
      ) : chuong.length === 0 ? (
        <p className="gvv2-trong">Máy này chưa có tờ DẠY HỌC nào của khối {khoi}. Mở Kho đề để tải về.</p>
      ) : (
        <ul className="gvv2-chuong-ds">
          {chuong.map((c) => (
            <li key={c.chuong}>
              <span className="gvv2-chuong-ten">{c.chuong}</span>
              <small className="gvv2-so">
                {c.soBai} bài · {c.soCau} câu
              </small>
            </li>
          ))}
        </ul>
      )}
    </aside>
  )
}

/** `theDau` = thẻ mở đầu: mở từ Tổng quan › "Giao" cho một ca ⇒ thẻ Tổng quan (khung giao mở sẵn). */
export default function HanhTrinhV2({ tongQuan, theDau = 'nhip' }: { tongQuan: ReactNode; theDau?: 'tong-quan' | 'nhip' }) {
  const setScreen = useAppStore((s) => s.setScreen)
  const [ds, setDs] = useState<ChienDichTom[] | null>(null)
  const [loiDs, setLoiDs] = useState('')
  const [chon, setChon] = useState<string | null>(null)
  const [the, setThe] = useState<'tong-quan' | 'nhip' | 'can-chua'>(theDau)
  const [bang, setBang] = useState<{ id: string; em: EmNhip[] } | null>(null)
  const [loiBang, setLoiBang] = useState('')

  const taiDs = useCallback(async () => {
    setLoiDs('')
    const r = await danhSach()
    if (!r.ok) {
      setLoiDs(r.chu)
      setDs([])
      return
    }
    const ht = r.du.chienDich.filter((c) => c.hanhTrinh && c.trangThai === 'dang_chay').sort((a, b) => String(khoiCuaHanhTrinh(a)).localeCompare(String(khoiCuaHanhTrinh(b))))
    setDs(ht)
    setChon((c) => c ?? ht[ht.length - 1]?.id ?? null)
    if (ht.length === 0) setThe('tong-quan')
  }, [])
  useEffect(() => {
    void taiDs()
  }, [taiDs])

  useEffect(() => {
    if (!chon) return
    let song = true
    setLoiBang('')
    void docBang(chon).then((r) => {
      if (!song) return
      if (r.ok) setBang({ id: chon, em: r.du.hanhTrinhNgay?.em ?? [] })
      else setLoiBang(r.chu)
    })
    return () => {
      song = false
    }
  }, [chon])

  const htChon = ds?.find((c) => c.id === chon) ?? null
  const khoi = htChon ? khoiCuaHanhTrinh(htChon) : null
  const em = bang && bang.id === chon ? bang.em : null
  const cs = em ? chiSoNhip(em) : null
  const boSung = () => {
    try {
      sessionStorage.setItem(KHOA_MO_THE_DAY_HOC, '1')
    } catch {
      /* máy chặn bộ nhớ phiên: mục Chữa trên lớp mở thẻ thứ nhất, thầy bấm thẻ Dạy học */
    }
    setScreen('goilenbang')
  }

  return (
    <div className="gvv2">
      <header className="gvv2-dau">
        <div className="gvv2-dau-chu">
          <h1 className="gvv2-h1">Hành trình giỏi Hóa</h1>
          <p className="gvv2-phu">Chọn bài đã dạy — hệ thống tự lập kế hoạch riêng cho từng em mỗi ngày</p>
        </div>
        {ds && ds.length > 0 && (
          <div className="gvv2-khoi" role="radiogroup" aria-label="Chọn khối">
            {ds.map((c) => (
              <button key={c.id} type="button" role="radio" aria-checked={c.id === chon} className="gvv2-khoi-nut" onClick={() => setChon(c.id)}>
                <GraduationCap size={20} aria-hidden="true" />
                <span>
                  <b>Khối {khoiCuaHanhTrinh(c) ?? '—'}</b>
                  <small className="gvv2-so">{c.soEm} học sinh</small>
                </span>
              </button>
            ))}
          </div>
        )}
        <button type="button" className="gvv2-nut-chinh" onClick={boSung} title="Tick bài vừa dạy ở Chữa trên lớp › Dạy học › Bài hôm nay — hành trình tự nhận bài mới">
          <Plus size={18} aria-hidden="true" />
          Bổ sung bài
        </button>
      </header>

      <nav className="gvv2-tab" role="tablist" aria-label="Hành trình">
        {(
          [
            ['tong-quan', 'Tổng quan'],
            ['nhip', 'Nhịp hôm nay'],
            ['can-chua', 'Cần chữa'],
          ] as const
        ).map(([k, nhan]) => (
          <button key={k} type="button" role="tab" aria-selected={the === k} className="gvv2-tab-nut" onClick={() => setThe(k)}>
            {nhan}
          </button>
        ))}
      </nav>

      {the === 'tong-quan' && <div className="gvv2-tong-quan">{tongQuan}</div>}

      {the === 'nhip' &&
        (ds === null ? (
          <p className="gvv2-trong" role="status">
            Đang tải hành trình…
          </p>
        ) : loiDs ? (
          <div className="gvv2-the gvv2-loi" role="alert">
            <p>{loiDs}</p>
            <button type="button" className="gvv2-nut-vien" onClick={() => void taiDs()}>
              Thử lại
            </button>
          </div>
        ) : ds.length === 0 ? (
          <p className="gvv2-the gvv2-trong">Chưa có hành trình khối nào đang chạy. Hành trình tự tạo khi máy chủ gộp chiến dịch theo khối.</p>
        ) : (
          <>
            {cs && (
              <section className="gvv2-kpi" aria-label="Chỉ số hôm nay">
                <TheSo mau="xl" bieu={<ShieldCheck size={22} />} nhan="Đủ mức hôm nay" so={<><b className="gvv2-so">{cs.duMuc}</b><span className="gvv2-so">/{cs.coMuc}</span></>} phu={cs.coMuc ? `${Math.round((100 * cs.duMuc) / cs.coMuc)}% học sinh đã làm đủ câu tối thiểu` : 'Chưa có em nào có mức tối thiểu'} ti={cs.coMuc ? Math.round((100 * cs.duMuc) / cs.coMuc) : 0} />
                <TheSo mau="ho" bieu={<AlertTriangle size={22} />} nhan="Chưa làm câu nào" so={<b className="gvv2-so">{cs.chuaLam}</b>} phu="Học sinh chưa bắt đầu kế hoạch hôm nay" />
                <TheSo mau="hp" bieu={<TrendingUp size={22} />} nhan="Tầng Vận dụng trở lên" so={<b className="gvv2-so">{cs.tangCao}</b>} phu="Học sinh đã mở tầng Vận dụng hoặc Tổng hợp" />
                <TheSo mau="xd" bieu={<Clock size={22} />} nhan="Thiếu câu phù hợp" so={<b className="gvv2-so">{cs.thieuCau}</b>} phu="Kho chưa đủ câu đúng tầng — bổ sung bài để lấp" />
              </section>
            )}
            <div className="gvv2-luoi">
              {loiBang ? (
                <div className="gvv2-the gvv2-loi" role="alert">
                  <p>{loiBang}</p>
                </div>
              ) : em ? (
                <BangNhip em={em} />
              ) : (
                <p className="gvv2-the gvv2-trong" role="status">
                  Đang tải nhịp học hôm nay…
                </p>
              )}
              <TheChuong khoi={khoi} />
            </div>
          </>
        ))}

      {the === 'can-chua' && (
        <section className="gvv2-the gvv2-can-chua" aria-labelledby="gvv2-can-chua-tieu">
          <span className="gvv2-o-bieu" aria-hidden="true">
            <CalendarCheck size={22} />
          </span>
          <div>
            <h2 id="gvv2-can-chua-tieu" className="gvv2-h2">
              Điểm danh và buổi chữa
            </h2>
            <p className="gvv2-phu">Mã điểm danh 6 số, danh sách em có mặt, chiếu mã lên máy chiếu và xếp buổi chữa cho đúng các em có mặt nằm ở mục Chữa trên lớp.</p>
          </div>
          <button type="button" className="gvv2-nut-chinh" onClick={() => setScreen('goilenbang')}>
            <Users size={18} aria-hidden="true" />
            Mở điểm danh
            <ChevronRight size={18} aria-hidden="true" />
          </button>
        </section>
      )}
    </div>
  )
}
