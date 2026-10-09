// BẢN DUYỆT V2 · MÀN 14 — "HÀNH TRÌNH GIỎI HÓA" của thầy (thầy ra lệnh 09/10/2026). Khối 10/11/12 lấy từ ba hành trình đang chạy.
// BẢN VẼ TỐI GIẢN THẦY CHỐT 09/10 (GV-HanhTrinh + BoGop): Hành trình là MỘT mục thay cho Chiến dịch luyện · Chữa trên lớp · Gỡ nút thắt. Bốn thẻ:
//   · Nhịp hôm nay — bảng từng em + bốn chỉ số (như cũ).
//   · Cần thầy chữa — nạp LƯỜI `TheCanThayChua` (ghép thành phần sẵn có: buổi chữa theo chiến dịch gồm điểm danh + xếp buổi chữa, bước cuối trên lớp,
//     gỡ nút thắt). Số cạnh tên thẻ = số "Cần thầy chữa" màn Hôm nay đã đếm (chưa biết ⇒ không ghi số).
//   · Bài đã dạy — nạp LƯỜI `TheBaiDaDay` (thẻ Dạy học sẵn có: điểm danh · chọn câu · bước Bài hôm nay; + Kiểm tra đầu giờ).
//   · Chiến dịch đã giao — thẻ "Tổng quan" cũ (giao + danh sách chiến dịch), đổi tên để không trùng mục Hôm nay.
// SỐ THẬT, không số minh hoạ: danh sách hành trình + số em (`/gv/chien-dich danh-sach`), từng em hôm nay (`bang` → `hanhTrinhNgay.em`: tầng,
// tối thiểu, đã làm, đã xếp, còn thiếu), chương/bài/câu của khối từ cây kho DẠY HỌC trên máy thầy (cùng hàm của bước Bài hôm nay).
// Bản duyệt có vài ô máy chủ CHƯA gửi (phút làm bài mỗi em, "sẵn sàng +1 bậc", lý do từng em, "máy đã tự điều chỉnh N kế hoạch") — màn KHÔNG vẽ các ô đó;
// thay bằng chỉ số đếm được từ chính bảng hôm nay (đủ mức tối thiểu, chưa làm câu nào, thiếu câu phù hợp, tầng Vận dụng trở lên).
// MỘT nút "Bổ sung bài" (đầu màn) ⇒ thẻ Bài đã dạy, cuộn tới bước Bài hôm nay (tick bài vừa dạy) — máy chủ chưa có lệnh thêm bài thẳng vào
// hành trình theo khối. Nút trùng "Giao theo bài" trong thẻ chiến dịch đã bỏ (09/10).
import { lazy, Suspense, useCallback, useEffect, useMemo, useState, type ReactNode } from 'react'
import { AlertTriangle, BookOpen, Clock, GraduationCap, Plus, Search, ShieldCheck, TrendingUp } from 'lucide-react'
import { dsBaiCuaKhoi, type BaiCay } from '../../lib/bai-hom-nay'
import { dungCay } from '../../lib/cay-chon-de'
import { khoDayHoc, locDeDayHoc } from '../../lib/day-hoc-len-bang'
import type { TeacherExamSource } from '../../data/examContent'
import { useSoDemGv, type TheHanhTrinh } from '../../lib/so-dem-gv'
import { danhSach, docBang, type ChienDichTom } from './api'
import { chiSoNhip, khoiCuaHanhTrinh, type EmNhip } from './nhip-hanh-trinh'
import './gv-v2.css'

// Phép tính nhịp (khối, bốn chỉ số) nay ở `nhip-hanh-trinh.ts` (màn Hôm nay dùng chung) — xuất lại ở đây cho mọi lối nhập cũ.
export { chiSoNhip, khoiCuaHanhTrinh, type EmNhip } from './nhip-hanh-trinh'

// Hai thẻ ghép màn sẵn có — mảnh riêng, chỉ tải khi thầy mở thẻ (ngoài precache, vite.config.ts).
const TheCanThayChua = lazy(() => import('./TheCanThayChua'))
const TheBaiDaDay = lazy(() => import('./TheBaiDaDay'))

const TEN_TANG = ['Nền', 'Hiểu', 'Vận dụng', 'Tổng hợp'] as const
/** Bốn thẻ, đúng thứ tự bản vẽ (thẻ thứ tư = "Tổng quan" cũ). */
export const THE_HANH_TRINH: readonly (readonly [TheHanhTrinh, string])[] = [
  ['nhip', 'Nhịp hôm nay'],
  ['can-chua', 'Cần thầy chữa'],
  ['bai-da-day', 'Bài đã dạy'],
  ['chien-dich', 'Chiến dịch đã giao'],
]

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
        <div className="gvv2-bang-cuon" role="region" aria-label="Nhịp học của học sinh" tabIndex={0}>
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
                    <td data-nhan="Hôm nay">
                      <span className="gvv2-tien-do">
                        <b className="gvv2-so">
                          {e.daLam}/{e.toiThieu ?? '—'} câu
                        </b>
                        <span className="gvv2-thanh" data-du={du ? 'true' : 'false'} role="progressbar" aria-label={`${e.ten}: câu đã làm hôm nay`} aria-valuemin={0} aria-valuemax={100} aria-valuenow={ti}>
                          <i style={{ width: `${ti}%` }} />
                        </span>
                      </span>
                    </td>
                    <td data-nhan="Tầng hiện tại">
                      <ChipTang tang={e.tang} />
                    </td>
                    <td className="gvv2-so" data-nhan="Đã xếp"><span className="gvv2-em-chu"><span>{e.daXep} câu</span>{e.duPhong != null && <small>Dự phòng {e.duPhong} câu</small>}</span></td>
                    <td className="gvv2-ghi-chu" data-nhan="Ghi chú"><div className="gvv2-em-chu">{e.conThieu > 0 ? <span data-loai="thieu">Thiếu {e.conThieu} câu phù hợp</span> : du ? <span data-loai="du">Đủ mức hôm nay</span> : e.daLam === 0 ? <span data-loai="chua">Chưa làm câu nào</span> : <span>Còn {Math.max(0, (e.toiThieu ?? 0) - e.daLam)} câu</span>}{!!e.canBoSung?.length&&<details><summary>Kiến thức cần bổ sung</summary><ul>{e.canBoSung.map((c,i)=><li key={i}>{c.ten} · {c.lyDo==='can_sua_nen'?'Cần câu củng cố nền':'Cần thêm câu đã duyệt'}</li>)}</ul></details>}</div></td>
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

/** Màn Hành trình.
 *  `theDau` = thẻ mở đầu (mở từ Hôm nay › một việc, hoặc Tổng quan › "Giao" cho một ca ⇒ thẻ Chiến dịch đã giao, khung giao mở sẵn).
 *  `chonDau` = hành trình (khối) chọn sẵn ở thẻ Nhịp hôm nay. `boSungBai` = vào thẳng thẻ Bài đã dạy và cuộn tới bước Bài hôm nay. */
export default function HanhTrinhV2({
  chienDichDaGiao,
  theDau = 'nhip',
  chonDau = null,
  boSungBai = false,
}: {
  chienDichDaGiao: ReactNode
  theDau?: TheHanhTrinh
  chonDau?: string | null
  boSungBai?: boolean
}) {
  const [ds, setDs] = useState<ChienDichTom[] | null>(null)
  const [loiDs, setLoiDs] = useState('')
  const [chon, setChon] = useState<string | null>(chonDau)
  const [the, setThe] = useState<TheHanhTrinh>(boSungBai ? 'bai-da-day' : theDau)
  // Mỗi lần bấm "Bổ sung bài" tăng một nhịp ⇒ thẻ Bài đã dạy cuộn lại tới bước Bài hôm nay (kể cả khi đang đứng sẵn ở thẻ ấy).
  const [lanBoSung, setLanBoSung] = useState(boSungBai ? 1 : 0)
  const [bang, setBang] = useState<{ id: string; em: EmNhip[] } | null>(null)
  const [loiBang, setLoiBang] = useState('')
  const canThayChua = useSoDemGv((s) => s.canThayChua)

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
    setChon((c) => (c && ht.some((x) => x.id === c) ? c : ht[ht.length - 1]?.id ?? null))
    // Chưa có hành trình nào: thẻ Nhịp hôm nay trống ⇒ mở thẻ Chiến dịch đã giao (thẻ khác thầy đã chọn thì giữ nguyên).
    if (ht.length === 0) setThe((t) => (t === 'nhip' ? 'chien-dich' : t))
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
    setThe('bai-da-day')
    setLanBoSung((n) => n + 1)
  }
  const choTai = (
    <p className="gvv2-trong" role="status">
      Đang mở…
    </p>
  )

  return (
    <div className="gvv2">
      <header className="gvv2-dau">
        <div className="gvv2-dau-chu">
          <h1 className="gvv2-h1">Hành trình giỏi Hóa</h1>
          <p className="gvv2-phu">Thầy tick bài đã dạy — app tự lập kế hoạch riêng cho từng em mỗi ngày</p>
        </div>
        {ds && ds.length > 0 && (
          <div className="gvv2-khoi" role="radiogroup" aria-label="Chọn khối">
            {ds.map((c) => (
              <button key={c.id} type="button" role="radio" aria-checked={c.id === chon} className="gvv2-khoi-nut" onClick={() => { setChon(c.id); setThe('nhip') }}>
                <GraduationCap size={20} aria-hidden="true" />
                <span>
                  <b>Khối {khoiCuaHanhTrinh(c) ?? '—'}</b>
                  <small className="gvv2-so">{c.soEm} học sinh</small>
                </span>
              </button>
            ))}
          </div>
        )}
        <button type="button" className="gvv2-nut-chinh" onClick={boSung} title="Tick bài vừa dạy ở thẻ Bài đã dạy › Bài hôm nay — hành trình tự nhận bài mới">
          <Plus size={18} aria-hidden="true" />
          Bổ sung bài
        </button>
      </header>

      <nav className="gvv2-tab" role="tablist" aria-label="Hành trình">
        {THE_HANH_TRINH.map(([k, nhan]) => (
          <button key={k} type="button" role="tab" id={`gvv2-the-${k}`} aria-controls={`gvv2-o-${k}`} aria-selected={the === k} className="gvv2-tab-nut" onClick={() => setThe(k)}>
            {nhan}
            {k === 'can-chua' && canThayChua ? <span className="gvv2-so"> · {canThayChua}</span> : null}
          </button>
        ))}
      </nav>

      <div role="tabpanel" id={`gvv2-o-${the}`} aria-labelledby={`gvv2-the-${the}`} className="gvv2-o-the">
        {the === 'chien-dich' && <div className="gvv2-chien-dich">{chienDichDaGiao}</div>}

        {the === 'can-chua' && (
          <Suspense fallback={choTai}>
            <TheCanThayChua />
          </Suspense>
        )}

        {the === 'bai-da-day' && (
          <Suspense fallback={choTai}>
            <TheBaiDaDay lanBoSung={lanBoSung} />
          </Suspense>
        )}

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
      </div>
    </div>
  )
}
