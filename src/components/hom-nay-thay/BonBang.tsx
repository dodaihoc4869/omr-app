// HÔM NAY · 4 BẢNG (thầy chốt bản vẽ 01/11, docs/ban-ve-hom-nay-4-bang-0111 · docs/ban-ve-trong-2610/gv-hom-nay-4-bang.html). Thầy: «Bỏ hết màn hồ sơ cũ của hs,
// ẩn hết tất cả các thông số … Hiện 4 bảng sắp xếp từ cao tới thấp, bấm vào mỗi học sinh phải ra bảng bằng chứng vô cùng sắc bén».
//   · Lưới 2×2 theo HAI TRỤC: hàng trên chất lượng (Học thật | Học đối phó) · hàng dưới chăm chỉ (Chăm | Lười). Màn < 1100 px: một cột. Điện thoại ≤ 600 px:
//     4 ô chọn bảng 2×2 (có số em) + CHỈ thẻ đang chọn.
//   · Mỗi thẻ: biểu tượng · tên · số em · một dòng nói bảng đo gì · 6 em đầu (hạng · chữ đầu tên · tên + lớp · điểm/100 + thanh · MỘT bằng chứng sắc nhất)
//     · «Xem đủ N em» mở rộng tại chỗ. Lọc Khối + ô tìm tên lọc cả 4 bảng ở máy (không gọi lại máy chủ).
//   · Số CHỈ từ `/gv/bon-bang` (src/lib/bon-bang-api.ts). Bản lần trước vẽ NGAY, bản mới thay vào khi về; lỗi ⇒ giữ bản cũ + «cập nhật lúc hh:mm».
//   · Bấm một em ⇒ trang bằng chứng (`BangChungBon`, NẠP KHI BẤM); đóng ⇒ tiêu điểm về đúng dòng.
// Màu: chỉ biến «Trong» --tr-* (bon-bang.css, dưới [data-trong='gv']).
import { lazy, Suspense, useCallback, useEffect, useMemo, useRef, useState, type ReactNode } from 'react'
import { Award, ChevronDown, ChevronRight, Flame, Pause, RefreshCw, Search, TriangleAlert } from 'lucide-react'
import { layBonBang, docDemBonBang } from '../../lib/bon-bang-api'
import { TEN_BANG, THU_TU_BANG, type DongBang, type MaBang, type TraLoiBonBang } from '../../lib/bon-bang-kieu'
import './bon-bang.css'

const BangChungBon = lazy(() => import('./BangChungBon'))

/** Số em mỗi thẻ khi chưa mở rộng (bản vẽ: 6). */
export const SO_EM_THE = 6
const KHOI = ['10', '11', '12'] as const

const MO_TA: Readonly<Record<MaBang, string>> = {
  ht: 'Sửa câu sai đến khi đúng · đọc kỹ đề · kiểm tra khớp luyện tập',
  dp: 'Chọn khi chưa đọc hết đề · bấm lặp một chữ · luyện cao mà kiểm tra thấp',
  ch: 'Làm đủ mức gần như mọi ngày, câu nào cũng làm thật',
  lu: 'Bỏ ngày, thiếu câu được giao, để câu sai không sửa',
}
const ICON: Readonly<Record<MaBang, typeof Award>> = { ht: Award, dp: TriangleAlert, ch: Flame, lu: Pause }
const TEN_NGAN: Readonly<Record<MaBang, string>> = { ht: 'Học thật', dp: 'Đối phó', ch: 'Chăm', lu: 'Lười' }

/** «**x**» ⇒ <b>x</b> (máy chủ bọc phần cần nhấn). Thuần, có test. */
export function chuDam(s: string): ReactNode[] {
  return s.split(/\*\*(.+?)\*\*/g).map((p, i) => (i % 2 ? <b key={i}>{p}</b> : p))
}
/** Hai chữ đầu của hai tiếng cuối («Phan Thảo Vy» ⇒ «TV»). */
export const chuDau = (ten: string): string => {
  const c = ten.trim().split(/\s+/).filter(Boolean)
  return ((c.length >= 2 ? c[c.length - 2]![0]! : '') + (c[c.length - 1]?.[0] ?? '')).toLocaleUpperCase('vi')
}
/** Bỏ dấu + chữ thường — «nguyen» khớp «Nguyễn». */
export const boDau = (s: string): string => s.normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/đ/g, 'd').replace(/Đ/g, 'D').toLocaleLowerCase('vi')
const gioPhut = (ms: number): string => {
  const d = new Date(ms + 7 * 3_600_000)
  return `${String(d.getUTCHours()).padStart(2, '0')}:${String(d.getUTCMinutes()).padStart(2, '0')}`
}

/** Lọc một bảng theo khối + tên (giữ thứ tự máy chủ đã xếp cao → thấp). Thuần, có test. */
export function locBang(ds: readonly DongBang[], khoi: string | null, tim: string): DongBang[] {
  const q = boDau(tim.trim())
  return ds.filter((d) => (!khoi || d.khoi === khoi) && (!q || boDau(d.hoTen).includes(q)))
}

function DongEm({ d, thu, bang, onMo }: { d: DongBang; thu: number; bang: MaBang; onMo: (d: DongBang, bang: MaBang, nut: HTMLButtonElement) => void }) {
  return (
    <li>
      <button type="button" className="bb-dong tt-nhan" onClick={(e) => onMo(d, bang, e.currentTarget)} aria-label={`${d.hoTen}, ${d.lop}, ${TEN_BANG[bang]} ${d.diem} trên 100 — xem bằng chứng`}>
        <span className="bb-hang gvv2-so" aria-hidden="true">{thu}</span>
        <span className="bb-av" data-mau={thu % 4} aria-hidden="true">{chuDau(d.hoTen)}</span>
        <span className="bb-giua">
          <span className="bb-ten">
            {d.hoTen}
            {d.lop && <small>{d.lop}</small>}
          </span>
          {d.bc && <span className="bb-bc">{chuDam(d.bc)}</span>}
        </span>
        <span className="bb-diem" aria-hidden="true">
          <b className="gvv2-so">
            {Math.round(d.diem)}
            <small>/100</small>
          </b>
          <span className="bb-thanh"><i style={{ width: `${Math.max(0, Math.min(100, d.diem))}%` }} /></span>
        </span>
      </button>
    </li>
  )
}

function TheBang({ bang, ds, tong, onMo }: { bang: MaBang; ds: readonly DongBang[]; tong: number; onMo: (d: DongBang, bang: MaBang, nut: HTMLButtonElement) => void }) {
  const [moRong, setMoRong] = useState(false)
  const Icon = ICON[bang]
  const hien = moRong ? ds : ds.slice(0, SO_EM_THE)
  return (
    <section className="bb-the" data-bang={bang} aria-labelledby={`bb-tieu-${bang}`}>
      <div className="bb-dau">
        <span className="bb-o" aria-hidden="true">
          <Icon size={20} />
        </span>
        <div className="bb-dau-chu">
          <h2 id={`bb-tieu-${bang}`}>
            {TEN_BANG[bang]} <span className="bb-chip gvv2-so">{ds.length} em</span>
          </h2>
          <p>{MO_TA[bang]}</p>
        </div>
      </div>
      {ds.length === 0 ? (
        <p className="bb-trong">{tong > 0 ? 'Chưa có em nào ở bảng này.' : 'Chưa có em nào.'}</p>
      ) : (
        <ol className="bb-ds">
          {hien.map((d, i) => (
            <DongEm key={d.sbd} d={d} thu={i + 1} bang={bang} onMo={onMo} />
          ))}
        </ol>
      )}
      {ds.length > SO_EM_THE && (
        <div className="bb-chan">
          <button type="button" className="gvv2-nut-chu tt-nhan bb-xem" aria-expanded={moRong} onClick={() => setMoRong((m) => !m)}>
            {moRong ? 'Thu gọn' : `Xem đủ ${ds.length} em`}
            {moRong ? <ChevronDown size={16} aria-hidden="true" /> : <ChevronRight size={16} aria-hidden="true" />}
          </button>
          <span className="bb-chan-phu">cao → thấp</span>
        </div>
      )}
    </section>
  )
}

function XuongBon() {
  return (
    <div className="bb-bon" role="status" aria-label="Đang tải 4 bảng">
      {THU_TU_BANG.map((k) => (
        <section key={k} className="bb-the bb-xuong" data-bang={k}>
          <span className="gv-xuong-khoi tt-xuong" style={{ width: '40%', height: 18 }} />
          {[0, 1, 2, 3].map((i) => (
            <span key={i} className="gv-xuong-khoi tt-xuong" style={{ width: '100%', height: 44 }} />
          ))}
        </section>
      ))}
    </div>
  )
}

type MoEm = { sbd: string; hoTen: string; lop: string; bang: MaBang }

/** `onTai` (màn Hôm nay): báo tổng số em + lúc cập nhật để đầu màn ghi «262 em · cập nhật 06:00». */
export default function BonBang({ onTai }: { onTai?: (du: TraLoiBonBang, luc: number) => void }) {
  const [dem] = useState(docDemBonBang)
  const [du, setDu] = useState<TraLoiBonBang | null>(dem?.du ?? null)
  const [luc, setLuc] = useState<number | null>(dem?.luc ?? null)
  const [loi, setLoi] = useState('')
  const [dangTai, setDangTai] = useState(false)
  const [khoi, setKhoi] = useState<string | null>(null)
  const [tim, setTim] = useState('')
  const [chon, setChon] = useState<MaBang>('ht')
  const [mo, setMo] = useState<MoEm | null>(null)
  const lan = useRef(0)
  const onTaiRef = useRef(onTai)
  onTaiRef.current = onTai

  const tai = useCallback(async () => {
    const l = ++lan.current
    setDangTai(true)
    const r = await layBonBang()
    if (l !== lan.current) return
    setDangTai(false)
    if (r.ok) {
      const bay = Date.now()
      setDu(r.du)
      setLuc(bay)
      setLoi('')
      onTaiRef.current?.(r.du, bay)
    } else setLoi(r.chu)
  }, [])
  useEffect(() => {
    if (dem) onTaiRef.current?.(dem.du, dem.luc)
    void tai()
    return () => {
      lan.current++
    }
  }, [tai, dem])

  const dsKhoi = useMemo(() => {
    if (!du) return []
    const sbdKhoi = new Map<string, string>()
    for (const k of THU_TU_BANG) for (const d of du.bang[k]) sbdKhoi.set(d.sbd, d.khoi)
    return KHOI.map((k) => ({ khoi: k, soEm: [...sbdKhoi.values()].filter((x) => x === k).length })).filter((k) => k.soEm > 0)
  }, [du])
  const khoiChon = khoi && dsKhoi.some((k) => k.khoi === khoi) ? khoi : null
  const loc = useMemo(
    () => (du ? (Object.fromEntries(THU_TU_BANG.map((k) => [k, locBang(du.bang[k], khoiChon, tim)])) as Record<MaBang, DongBang[]>) : null),
    [du, khoiChon, tim],
  )

  const nutMo = useRef<HTMLButtonElement | null>(null)
  const onMo = useCallback((d: DongBang, bang: MaBang, nut: HTMLButtonElement) => {
    nutMo.current = nut
    setMo({ sbd: d.sbd, hoTen: d.hoTen, lop: d.lop, bang })
  }, [])
  const onDong = useCallback(() => {
    setMo(null)
    if (nutMo.current?.isConnected) nutMo.current.focus()
  }, [])

  if (!du || !loc) {
    if (loi && !dangTai)
      return (
        <section className="bb-the bb-loi" role="alert">
          <p>Chưa tải được 4 bảng. {loi}</p>
          <button type="button" className="gvv2-nut-vien tt-nhan" onClick={() => void tai()}>
            <RefreshCw size={16} aria-hidden="true" />
            Thử lại
          </button>
        </section>
      )
    return <XuongBon />
  }

  return (
    <div className="bb-khung">
      <div className="bb-loc">
        <div className="bb-khoi" role="radiogroup" aria-label="Lọc theo khối">
          <button type="button" role="radio" aria-checked={khoiChon === null} className="bb-khoi-nut tt-nhan" onClick={() => setKhoi(null)}>
            Tất cả <span className="gvv2-so">{du.tong || ''}</span>
          </button>
          {dsKhoi.map((k) => (
            <button key={k.khoi} type="button" role="radio" aria-checked={khoiChon === k.khoi} className="bb-khoi-nut tt-nhan" onClick={() => setKhoi(k.khoi)}>
              K{k.khoi} <span className="gvv2-so">· {k.soEm}</span>
            </button>
          ))}
        </div>
        <label className="bb-tim">
          <Search size={16} aria-hidden="true" />
          <input type="search" value={tim} onChange={(e) => setTim(e.target.value)} placeholder="Tìm tên học sinh" aria-label="Tìm tên học sinh trong 4 bảng" />
        </label>
      </div>
      {(du.daTinh < du.tong || loi) && (
        <p className="bb-ghi gvv2-so" role={loi ? 'status' : undefined}>
          {du.daTinh < du.tong && `Đang tính dần: ${du.daTinh}/${du.tong} em. `}
          {loi && luc !== null && `Chưa cập nhật được — đang hiện số lúc ${gioPhut(luc)}.`}
        </p>
      )}
      <div className="bb-chon" role="radiogroup" aria-label="Chọn bảng">
        {THU_TU_BANG.map((k) => (
          <button key={k} type="button" role="radio" aria-checked={chon === k} data-bang={k} className="bb-chon-nut tt-nhan" onClick={() => setChon(k)}>
            {TEN_NGAN[k]} <b className="gvv2-so">{loc[k].length}</b>
          </button>
        ))}
      </div>
      <div className="bb-bon" data-chon={chon}>
        {THU_TU_BANG.map((k) => (
          <TheBang key={`${k}-${khoiChon}-${tim}`} bang={k} ds={loc[k]} tong={du.tong} onMo={onMo} />
        ))}
      </div>
      {mo && (
        <Suspense fallback={<div className="bbc-che" role="status" aria-label="Đang mở bằng chứng" />}>
          <BangChungBon sbd={mo.sbd} hoTen={mo.hoTen} lop={mo.lop} bang={mo.bang} onDong={onDong} />
        </Suspense>
      )}
    </div>
  )
}
