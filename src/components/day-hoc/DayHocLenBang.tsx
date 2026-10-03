// BẢNG DẠY HỌC — mục Lên bảng của app thầy (thầy lệnh 28/09: "thêm cho tôi một bảng thủ công DẠY HỌC"). BA BƯỚC:
//  1 · ĐIỂM DANH — nút "Điểm danh" mở buổi học trên máy chủ + chiếu mã 6 số & QR (tấm phủ `TamPhuChieuMa`, cùng kiểu Chiếu mã vào thi);
//      em trên app học sinh nhập/quét mã ⇒ vào danh sách CÓ MẶT (tự làm mới 5 giây qua nhịp chung `useNhipThay` như phòng chờ ca thi);
//      thầy thêm/bớt tay được (chọn từ lớp). Bước này nay là thành phần CHUNG `DiemDanhBuoi.tsx` (thẻ Kiểm tra đầu giờ dùng lại, 29/09).
//  2 · CHỌN CÂU — hộp tích chọn RIÊNG cây thư mục DẠY HỌC của kho (`locDeDayHoc`), tích tờ/bài rồi bỏ từng câu; KHÔNG lọc tự luận.
//  3 · CHIẾU — màn chiếu MỚI (`dungToChieuDayHoc` → `taoHtmlMayChieu`, lớp bản vẽ 28/09): đủ từng câu thầy chọn. "Chiếu lên bảng" ⇒ app chọn em
//      CÓ MẶT có khả năng làm đúng cao nhất cho từng câu (`chon-em-day-hoc.ts`); "Đổi em khác"; "Đúng" / "Sai" ghi bằng `ghiLenBang` (đường ghi sẵn có).
import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { Check, Eye, EyeOff, Lightbulb, MonitorPlay, RefreshCw, Shuffle, UserCheck, X } from 'lucide-react'
import { useAppStore } from '../../store/appStore'
import type { TeacherExamSource } from '../../data/examContent'
import KhungXemPhieu from '../KhungXemPhieu'
import HopChonDe from '../HopChonDe'
import { useGhiToChieu } from '../chien-dich/ghi-to-chieu'
import { laySucHoc } from '../../lib/buoi-hoc-api'
import { cauTuDeChon, demCau, dungToChieuDayHoc, khoDayHoc, tomTatDe, type CauDayHoc, type EmLenCau } from '../../lib/day-hoc-len-bang'
import { chonEmChoCau, mucCauSo, TEN_MUC_CAU, xepEmChoDanhSach, type KetQuaChon, type SucHocEm } from '../../lib/chon-em-day-hoc'
import { khoaToChieu } from '../../lib/to-chieu-cau-noi'
import { ChemText } from '../../lib/chem-format'
import TheCauHienThi from './TheCauHienThi'
import { BuocDiemDanh, useDiemDanhBuoi } from './DiemDanhBuoi'
import './day-hoc.css'

/** Chữ tấm chiếu mã điểm danh — nay nằm ở `DiemDanhBuoi.tsx` (dùng chung với Kiểm tra đầu giờ); giữ lối xuất cũ. */
export { CHU_DIEM_DANH } from './DiemDanhBuoi'

/** Nhớ trên máy theo buổi: đề đã tích, câu đã bỏ, em đã giao. Hỏng/không có ⇒ bắt đầu trống. */
interface NhoBuoi {
  maChon: string[]
  boCau: string[]
  giao: Record<string, { sbd: string; hoTen: string; xacSuat: number; uocLuong: boolean; lyDo: string; boQua: string[] }>
}
const khoaNho = (id: string) => `ddh.dayHoc.${id}`
function docNhoBuoi(id: string): NhoBuoi {
  try {
    const j = JSON.parse(localStorage.getItem(khoaNho(id)) || 'null') as Partial<NhoBuoi> | null
    return { maChon: Array.isArray(j?.maChon) ? j!.maChon : [], boCau: Array.isArray(j?.boCau) ? j!.boCau : [], giao: j?.giao && typeof j.giao === 'object' ? j.giao : {} }
  } catch {
    return { maChon: [], boCau: [], giao: {} }
  }
}
function ghiNhoBuoi(id: string, n: NhoBuoi) {
  try {
    localStorage.setItem(khoaNho(id), JSON.stringify(n))
  } catch {
    /* máy chặn bộ nhớ: chỉ mất phần nhớ khi tải lại */
  }
}

const TEN_PHAN: Record<CauDayHoc['phan'], string> = { I: 'Trắc nghiệm', II: 'Đúng–sai', III: 'Trả lời ngắn' }
const pt = (x: number) => `${Math.round(x * 100)}%`

export default function DayHocLenBang() {
  const showToast = useAppStore((s) => s.showToast)

  // ───── 1 · ĐIỂM DANH (dùng chung với Kiểm tra đầu giờ — `DiemDanhBuoi.tsx`) ─────
  const dd = useDiemDanhBuoi()
  const { tt, idBuoi, coMat, lopCuaEm } = dd

  // ───── 2 · CHỌN CÂU ─────
  const [kho, setKho] = useState<TeacherExamSource[] | null>(null)
  const [hopMo, setHopMo] = useState(false)
  const [maTam, setMaTam] = useState<Set<string>>(new Set())
  const [maChon, setMaChon] = useState<Set<string>>(new Set())
  const [boCau, setBoCau] = useState<Set<string>>(new Set())
  const [giao, setGiao] = useState<NhoBuoi['giao']>({})
  const daNap = useRef('')
  useEffect(() => {
    // Nạp phần nhớ của buổi (đề đã tích, câu bỏ, em đã giao) một lần mỗi buổi.
    const k = idBuoi || '_'
    if (daNap.current === k) return
    daNap.current = k
    const n = docNhoBuoi(k)
    setMaChon(new Set(n.maChon))
    setBoCau(new Set(n.boCau))
    setGiao(n.giao)
  }, [idBuoi])
  useEffect(() => {
    if (daNap.current) ghiNhoBuoi(daNap.current, { maChon: [...maChon], boCau: [...boCau], giao })
  }, [maChon, boCau, giao])

  const napKho = useCallback(async () => {
    if (kho) return kho
    try {
      const [{ loadExamSources }, { khuTrungNguon }, { tachNhieuTheoPhan }] = await Promise.all([
        import('../../lib/exam-db'),
        import('../../lib/khu-trung-cau'),
        import('../../lib/tach-phan-de'),
      ])
      const ds = khoDayHoc(await loadExamSources(), khuTrungNguon, tachNhieuTheoPhan)
      setKho(ds)
      return ds
    } catch {
      setKho([])
      return []
    }
  }, [kho])
  useEffect(() => {
    if (maChon.size && !kho) void napKho()
  }, [maChon, kho, napKho])

  const tatCaCau = useMemo(() => (kho ? cauTuDeChon(kho, maChon) : []), [kho, maChon])
  const cauChieu = useMemo(() => tatCaCau.filter((c) => !boCau.has(c.khoa)), [tatCaCau, boCau])
  const demTam = useMemo(() => demCau(kho ? cauTuDeChon(kho, maTam) : []), [kho, maTam])
  const dem = demCau(cauChieu)

  // ───── 3 · CHIẾU ─────
  const [html, setHtml] = useState('')
  const [dangChieu, setDangChieu] = useState(false)
  const [sucHoc, setSucHoc] = useState<Record<string, SucHocEm>>({})
  const { ketQua, moPhien, ganO, dongPhien, ghi } = useGhiToChieu(idBuoi ? `day-hoc|${idBuoi}` : '')

  const [xemLoiGiai, setXemLoiGiai] = useState<Set<string>>(new Set())

  const moTo = async (coEm: boolean, giaoMoi = giao) => {
    if (!cauChieu.length) {
      showToast('Chưa chọn câu nào để chiếu', 'warn')
      return
    }
    setDangChieu(true)
    try {
      const ma = moPhien()
      const m = new Map<string, EmLenCau>()
      if (coEm)
        for (const c of cauChieu) {
          const g = giaoMoi[c.khoa]
          if (!g) continue
          const lan = cauChieu.slice(0, cauChieu.indexOf(c) + 1).filter((x) => giaoMoi[x.khoa]?.sbd === g.sbd).length
          m.set(c.khoa, { sbd: g.sbd, hoTen: g.hoTen, lop: lopCuaEm.get(g.sbd) || tt?.buoi.lop || undefined, lanLenBang: lan })
        }
      const { html: h, o } = await dungToChieuDayHoc(cauChieu, m, `Dạy học · ${tt?.buoi.ten || 'Buổi học'}`, coEm ? ma : undefined)
      ganO(ma, o)
      setHtml(h)

    } catch (e) {
      showToast(e instanceof Error ? e.message : 'Không mở được tờ máy chiếu', 'warn')
    } finally {
      setDangChieu(false)
    }
  }

  const cauChon = (c: CauDayHoc) => ({ qid: c.qid, maDang: c.maDang, chuyenDe: c.chuyenDe, mucDo: c.mucDo })
  const napSucHoc = async (): Promise<Record<string, SucHocEm>> => {
    const r = await laySucHoc(
      coMat.map((e) => e.sbd),
      cauChieu.map((c) => ({ qid: c.qid, maDang: c.maDang, chuyenDe: c.chuyenDe })),
    )
    if (!r.ok) {
      showToast(`${r.chu} — app chọn em theo ước lượng.`, 'warn')
      return {}
    }
    setSucHoc(r.du)
    return r.du
  }

  const chieuLenBang = async () => {
    if (!coMat.length || !cauChieu.length) return
    setDangChieu(true)
    const sh = await napSucHoc()
    const kq = xepEmChoDanhSach(cauChieu.map(cauChon), coMat, sh)
    const moi: NhoBuoi['giao'] = {}
    cauChieu.forEach((c, i) => {
      const k = kq[i]
      if (k) moi[c.khoa] = { sbd: k.sbd, hoTen: k.hoTen, xacSuat: k.xacSuat, uocLuong: k.uocLuong, lyDo: k.lyDo, boQua: [] }
    })
    setGiao(moi)
    await moTo(true, moi)
  }

  const doiEm = async (c: CauDayHoc) => {
    const cu = giao[c.khoa]
    const sh = Object.keys(sucHoc).length ? sucHoc : await napSucHoc()
    const daGoi: Record<string, number> = {}
    for (const x of cauChieu) if (x.khoa !== c.khoa && giao[x.khoa]) daGoi[giao[x.khoa]!.sbd] = (daGoi[giao[x.khoa]!.sbd] ?? 0) + 1
    const boQua = new Set([...(cu?.boQua ?? []), ...(cu ? [cu.sbd] : [])])
    let k: KetQuaChon | null = chonEmChoCau(cauChon(c), coMat, sh, daGoi, boQua)
    if (!k) {
      // Đã đổi qua hết lớp ⇒ quay vòng lại từ đầu (chỉ trừ em đang đứng).
      boQua.clear()
      if (cu) boQua.add(cu.sbd)
      k = chonEmChoCau(cauChon(c), coMat, sh, daGoi, boQua)
    }
    if (!k) {
      showToast('Không còn em nào khác có mặt', 'warn')
      return
    }
    const moi = { ...giao, [c.khoa]: { sbd: k.sbd, hoTen: k.hoTen, xacSuat: k.xacSuat, uocLuong: k.uocLuong, lyDo: k.lyDo, boQua: [...boQua] } }
    setGiao(moi)
    if (html) await moTo(true, moi)
  }

  const ghiKq = async (c: CauDayHoc, dat: boolean) => {
    const g = giao[c.khoa]
    if (!g) return
    await ghi(khoaToChieu(g.sbd, c.qid), { sbd: g.sbd, hoTen: g.hoTen, qid: c.qid, chuyenDe: c.chuyenDe || 'Dạy học' }, dat)
  }

  const coGiao = cauChieu.some((c) => giao[c.khoa])

  return (
    <div className="dh-trang" data-khoi="day-hoc-len-bang">
      <header className="dh-dau">
        <h1>Dạy học</h1>
        <p>Điểm danh lấy danh sách em học hôm nay → chọn câu trong kho Dạy học → chiếu lên máy chiếu. App gọi em có mặt có khả năng làm đúng câu cao nhất.</p>
      </header>

      <BuocDiemDanh dd={dd} />

      {/* ───── BƯỚC 2 ───── */}
      <section className="dh-buoc" aria-labelledby="dh-b2">
        <div className="dh-buoc-dau">
          <span className="dh-so" aria-hidden="true">
            2
          </span>
          <div className="dh-buoc-ten">
            <h2 id="dh-b2">Chọn câu</h2>
            <p>Chỉ cây thư mục Dạy học của Ngân hàng câu hỏi. Câu tự luận cũng chiếu đủ.</p>
          </div>
          <button
            type="button"
            className="m3-nut-vien dh-nut"
            onClick={() => {
              setMaTam(new Set(maChon))
              setHopMo(true)
              void napKho()
            }}
          >
            {maChon.size ? 'Đổi bài' : 'Chọn bài trong kho Dạy học'}
          </button>
        </div>
        {maChon.size === 0 ? (
          <p className="dh-phu">Chưa chọn bài nào. Tích tờ / bài trong cây Dạy học, rồi bỏ bớt từng câu ở danh sách hiện ra.</p>
        ) : !kho ? (
          <p className="dh-phu" aria-busy="true">
            Đang đọc kho đề…
          </p>
        ) : (
          <>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 8, margin: '8px 0' }}>
              <p className="dh-tong" style={{ margin: 0 }}>
                <b>{dem.tong}</b> câu sẽ chiếu · Trắc nghiệm {dem.I} · Đúng–sai {dem.II} · Trả lời ngắn {dem.III}
                {dem.tuLuan ? ` · trong đó ${dem.tuLuan} câu tự luận` : ''}
                {boCau.size ? ` · đã bỏ ${tatCaCau.length - cauChieu.length} câu` : ''}
              </p>
              <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                <button
                  type="button"
                  className="m3-nut-tonal dh-nut-nho"
                  onClick={() => setXemLoiGiai(new Set(cauChieu.map((c) => c.khoa)))}
                >
                  <Eye size={15} /> Hiện lời giải tất cả
                </button>
                {xemLoiGiai.size > 0 && (
                  <button
                    type="button"
                    className="m3-nut-chu dh-nut-nho"
                    onClick={() => setXemLoiGiai(new Set())}
                  >
                    <EyeOff size={15} /> Ẩn tất cả
                  </button>
                )}
              </div>
            </div>
            <ol className="dh-cau-ds">
              {tatCaCau.map((c) => {
                const bo = boCau.has(c.khoa)
                const stt = bo ? null : cauChieu.indexOf(c) + 1
                const g = giao[c.khoa]
                const kq = g ? ketQua[khoaToChieu(g.sbd, c.qid)] : undefined
                return (
                  <li key={c.khoa} className={`dh-cau${bo ? ' dh-cau--bo' : ''}`}>
                    <label className="dh-cau-tich">
                      <input
                        type="checkbox"
                        checked={!bo}
                        onChange={() =>
                          setBoCau((cu) => {
                            const m = new Set(cu)
                            if (m.has(c.khoa)) m.delete(c.khoa)
                            else m.add(c.khoa)
                            return m
                          })
                        }
                        aria-label={`Chiếu câu ${stt ?? ''} ${tomTatDe(c, 40)}`}
                      />
                      <span className="dh-cau-so">{stt ? `Câu ${stt}` : 'Bỏ'}</span>
                    </label>
                    <div className="dh-cau-than">
                      <p className="dh-cau-nhan">
                        <span>{TEN_PHAN[c.phan]}</span>
                        {c.mucDo && <span>{TEN_MUC_CAU[mucCauSo(c.mucDo)]}</span>}
                        {c.tuLuan && <span className="dh-chip dh-chip--vang">Tự luận</span>}
                        <span className="dh-cau-dang">{c.tenDang || c.chuyenDe}</span>
                        <button
                          type="button"
                          className={`dh-nut-giai ${xemLoiGiai.has(c.khoa) ? 'dh-nut-giai--mo' : ''}`}
                          onClick={() =>
                            setXemLoiGiai((cu) => {
                              const m = new Set(cu)
                              if (m.has(c.khoa)) m.delete(c.khoa)
                              else m.add(c.khoa)
                              return m
                            })
                          }
                          style={{ marginLeft: 'auto' }}
                        >
                          <Lightbulb size={14} /> {xemLoiGiai.has(c.khoa) ? 'Ẩn lời giải' : 'Hiện lời giải'}
                        </button>
                      </p>
                      <div className="dh-cau-de" style={c.tuLuan ? { whiteSpace: 'pre-wrap' } : undefined}>
                        {c.tuLuan ? <ChemText text={c.q.text || tomTatDe(c)} /> : tomTatDe(c)}
                      </div>
                      {c.tuLuan && (() => {
                        const h = (c.q as any).imageDataUrl || (c.q as any).hinhAnh?.[0]?.src || (c.q as any).hinh?.[0]?.du_lieu || (c.q as any).hinh?.[0]?.src
                        return h ? (
                          <div style={{ marginTop: 6 }}>
                            <img src={h} alt="Hình câu hỏi" style={{ maxWidth: '100%', maxHeight: 240, objectFit: 'contain', borderRadius: 8, border: '1px solid var(--vien)' }} />
                          </div>
                        ) : null
                      })()}
                      {xemLoiGiai.has(c.khoa) && <TheCauHienThi c={c} stt={stt ?? undefined} />}
                      {g && !bo && (
                        <div className="dh-giao">
                          <span className="dh-giao-em">
                            <UserCheck size={16} aria-hidden="true" /> <b>{g.hoTen || g.sbd}</b>
                            <span className="dh-giao-p" title={g.lyDo}>
                              khả năng đúng ≈ {pt(g.xacSuat)}
                            </span>
                            {g.uocLuong && <span className="dh-chip dh-chip--vang">Ước lượng</span>}
                          </span>
                          <span className="dh-giao-ly">{g.lyDo}</span>
                          <span className="dh-giao-nut">
                            <button type="button" className="m3-nut-chu dh-nut-nho" onClick={() => void doiEm(c)} disabled={!coMat.length}>
                              <Shuffle size={16} aria-hidden="true" /> Đổi em khác
                            </button>
                            {kq ? (
                              <span className={`dh-chip ${kq === 'dat' ? 'dh-chip--xanh' : 'dh-chip--do'}`}>{kq === 'dat' ? 'Đã ghi: làm đúng' : 'Đã ghi: làm sai'}</span>
                            ) : (
                              <>
                                <button type="button" className="m3-nut-tonal dh-nut-nho" onClick={() => void ghiKq(c, true)}>
                                  <Check size={16} aria-hidden="true" /> Em làm đúng
                                </button>
                                <button type="button" className="m3-nut-vien dh-nut-nho" onClick={() => void ghiKq(c, false)}>
                                  <X size={16} aria-hidden="true" /> Em làm sai
                                </button>
                              </>
                            )}
                          </span>
                        </div>
                      )}
                    </div>
                  </li>
                )
              })}
            </ol>
          </>
        )}
      </section>

      {/* ───── BƯỚC 3 ───── */}
      <section className="dh-buoc dh-buoc--chieu" aria-labelledby="dh-b3">
        <div className="dh-buoc-dau">
          <span className="dh-so" aria-hidden="true">
            3
          </span>
          <div className="dh-buoc-ten">
            <h2 id="dh-b3">Chiếu lên bảng</h2>
            <p>
              {!cauChieu.length
                ? 'Chọn câu ở bước 2 trước.'
                : !coMat.length
                  ? `${cauChieu.length} câu sẵn sàng — cần danh sách có mặt (bước 1) để app gọi em.`
                  : `${cauChieu.length} câu · ${coMat.length} em có mặt. App chọn em có mức ≥ mức độ câu, khả năng đúng cao nhất; mỗi em tối đa 2 lần.`}
            </p>
          </div>
        </div>
        <div className="dh-hang">
          <button type="button" className="m3-nut-chinh dh-nut" disabled={dangChieu || !cauChieu.length || !coMat.length} onClick={() => void chieuLenBang()}>
            <MonitorPlay size={18} aria-hidden="true" /> {dangChieu ? 'Đang dựng tờ chiếu…' : coGiao ? 'Chọn lại em và chiếu' : 'Chiếu lên bảng'}
          </button>
          <button type="button" className="m3-nut-vien dh-nut" disabled={dangChieu || !cauChieu.length} onClick={() => void moTo(coGiao)}>
            {coGiao ? 'Mở lại tờ chiếu' : 'Chiếu đề (chưa gọi em)'}
          </button>
          {coGiao && (
            <button type="button" className="m3-nut-chu dh-nut" onClick={() => setGiao({})}>
              <RefreshCw size={16} aria-hidden="true" /> Bỏ phân công
            </button>
          )}
        </div>

        {cauChieu.length > 0 && (
          <div style={{ marginTop: 'var(--k3)' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 8, margin: '12px 0 8px' }}>
              <p className="dh-tong" style={{ margin: 0, fontWeight: 700 }}>
                {cauChieu.length} câu trong buổi dạy ({cauChieu.filter((c) => xemLoiGiai.has(c.khoa)).length}/{cauChieu.length} đang mở lời giải)
              </p>
              <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                <button
                  type="button"
                  className="m3-nut-tonal dh-nut-nho"
                  onClick={() => setXemLoiGiai(new Set(cauChieu.map((c) => c.khoa)))}
                >
                  <Eye size={15} /> Hiện lời giải tất cả
                </button>
                {xemLoiGiai.size > 0 && (
                  <button
                    type="button"
                    className="m3-nut-chu dh-nut-nho"
                    onClick={() => setXemLoiGiai(new Set())}
                  >
                    <EyeOff size={15} /> Ẩn tất cả
                  </button>
                )}
              </div>
            </div>
            <ol className="dh-cau-ds">
              {cauChieu.map((c, i) => {
                const g = giao[c.khoa]
                const mo = xemLoiGiai.has(c.khoa)
                return (
                  <li key={`b3-${c.khoa}`} className="dh-cau">
                    <div className="dh-cau-than" style={{ width: '100%' }}>
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 8, flexWrap: 'wrap' }}>
                        <span className="font-bold" style={{ fontSize: 'var(--cx-1)' }}>
                          Câu {i + 1} {g ? `· Em ${g.hoTen || g.sbd}` : '· Cả lớp'} · {c.tenDang || c.chuyenDe}
                        </span>
                        <button
                          type="button"
                          className={`dh-nut-giai ${mo ? 'dh-nut-giai--mo' : ''}`}
                          onClick={() =>
                            setXemLoiGiai((cu) => {
                              const m = new Set(cu)
                              if (m.has(c.khoa)) m.delete(c.khoa)
                              else m.add(c.khoa)
                              return m
                            })
                          }
                        >
                          <Lightbulb size={14} /> {mo ? 'Ẩn lời giải' : 'Hiện lời giải'}
                        </button>
                      </div>
                      {mo ? (
                        <TheCauHienThi c={c} stt={i + 1} />
                      ) : (
                        <div className="dh-cau-de" style={{ marginTop: 4 }}>{tomTatDe(c)}</div>
                      )}
                    </div>
                  </li>
                )
              })}
            </ol>
          </div>
        )}
      </section>

      {hopMo && (
        <div className="dh-phu-lop" role="dialog" aria-modal="true" aria-labelledby="dh-hop-ten" onKeyDown={(e) => e.key === 'Escape' && setHopMo(false)}>
          <div className="dh-hop">
            <div className="dh-hop-dau">
              <h2 id="dh-hop-ten">Chọn bài · kho Dạy học</h2>
              <button type="button" className="m3-nut-chu dh-nut" onClick={() => setHopMo(false)} aria-label="Đóng hộp chọn bài">
                <X size={18} aria-hidden="true" /> Đóng
              </button>
            </div>
            {!kho ? (
              <p className="dh-phu" aria-busy="true">
                Đang đọc kho đề…
              </p>
            ) : kho.length === 0 ? (
              <p className="dh-phu">Kho chưa có thư mục Dạy học. Vào Ngân hàng câu hỏi → Đồng bộ ngay để nạp đề.</p>
            ) : (
              <HopChonDe
                ds={kho}
                daChon={maTam}
                chonNhieu
                cao={420}
                onChon={(ma) =>
                  setMaTam((cu) => {
                    const m = new Set(cu)
                    if (m.has(ma)) m.delete(ma)
                    else m.add(ma)
                    return m
                  })
                }
                onChonTatCa={(ma) => setMaTam(new Set(ma))}
              />
            )}
            <div className="dh-hop-chan">
              <span className="dh-phu">
                Xem trước: <b>{demTam.tong}</b> câu{demTam.tuLuan ? ` (có ${demTam.tuLuan} câu tự luận — chiếu đủ)` : ''}
              </span>
              <button
                type="button"
                className="m3-nut-chinh dh-nut"
                disabled={!maTam.size}
                onClick={() => {
                  setMaChon(new Set(maTam))
                  setBoCau(new Set())
                  setGiao({})
                  setHopMo(false)
                }}
              >
                Dùng {demTam.tong} câu
              </button>
            </div>
          </div>
        </div>
      )}


      {html && (
        <KhungXemPhieu
          html={html}
          ten="Tờ máy chiếu — Dạy học"
          dong={() => {
            dongPhien()
            setHtml('')
          }}
        />
      )}
    </div>
  )
}
