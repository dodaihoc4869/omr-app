// HÀNH TRÌNH › CẦN THẦY CHỮA › "THẦY TỰ CHỮA" (thầy 12/10, nguyên văn: "mục cần chữa cho tôi một phần tự chữa, phần này cho tôi chọn đề trong Mục dạy
// học (trắc nghiệm khách quan trả lời ngắn) khi chọn đề nào thì đề đó hiển thị tất cả các câu chiếu lên máy chiếu, ưu tiên đẩy câu đúng sai và tính toán
// lên đầu tiên hiển thị, bảng hiển thị đầy đủ mọi thứ như mục chiếu lên bảng (đúng chuẩn)").
//
// MỘT THẺ GẬP ở đầu thẻ Cần thầy chữa (mặc định gập — danh sách cần chữa vẫn là thứ thầy thấy trước; bấm "Chọn đề" mới đọc kho):
//   1. Lớp (ô chọn theo khối, `/gv/lop` — lệnh chỉ đọc sẵn có; lỗi ⇒ chọn theo khối, không có tỉ lệ sai lớp)
//   2. Bài trong Dạy học (đúng cây DẠY HỌC của Hành trình › Dạy học › Bài hôm nay: `khoDayHoc` → `dsBaiCuaKhoi`, chương theo số chương, bài theo số bài)
//   3. Đề: ba nút bật/tắt Trắc nghiệm · Đúng–sai · Trả lời ngắn (kèm số câu) — chọn bài thì bật đủ cả ba (cả đề của bài); bấm để giữ một tờ.
//   4. Xem trước: mọi câu ĐÃ XẾP (Đúng–sai có tính toán → Đúng–sai → có tính toán → còn lại, cùng hạng theo thứ tự đề — `xepThuTuChua`), mỗi dòng
//      số thứ tự chiếu · Câu N · loại · "Có tính toán" / "Tự luận" · tóm tắt đề · tỉ lệ sai của lớp (sổ học, `/gv/thong-ke-lop-cau`) khi có.
//   5. Nút chính "Chiếu lên máy chiếu" ⇒ tờ của Chiếu lên bảng (`thay-tu-chua-to.ts` → `dungToChieu` → `KhungXemPhieu`): đề + phương án + hình,
//      lời giải hiện dần, phím T thống kê lớp, phím X ai làm sai (kèm số giây), lật trang, chữ không thu nhỏ.
// Năm trạng thái: chờ = khung xương · trống (kho / khối chưa có bài) = câu nói vì sao + việc làm tiếp · có dữ liệu · lỗi = lý do + Thử lại · mất mạng
// (danh sách lớp / số liệu lớp lỗi ⇒ dòng nói thật, phần còn lại vẫn dùng được). Không ghi gì lên máy chủ: chỉ đọc kho trên máy + hai lệnh chỉ đọc.
// Màu: chỉ biến --gvm-* của app thầy (thay-tu-chua.css).
import { lazy, Suspense, useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { ChevronDown, ChevronUp, MonitorPlay, Presentation, RefreshCw } from 'lucide-react'
import type { TeacherExamSource } from '../../data/examContent'
import type { BaiCay, ToBai } from '../../lib/bai-hom-nay'
import type { LopThay } from '../../lib/ten-lop-thay'
import type { SoGopCauLop } from '../../lib/thong-ke-lop-cau'
import { layThongKeLopCau } from '../../lib/ho-so-em-thay'
import { lyDoDeHieu } from '../../lib/loi-de-hieu'
import { TEN_LOAI_CAU, cauCuaDe, demTuChua, laCauKhacKhoi, tenBuoiTuChua, tiLeSaiLop, tomTatCau, xepThuTuChua, type CauTuChua, type PhanCau } from '../../lib/thay-tu-chua'
import { useAppStore } from '../../store/appStore'
import { useGhiToChieu } from './ghi-to-chieu'
import './thay-tu-chua.css'

const KhungXemPhieu = lazy(() => import('../KhungXemPhieu'))

type KhoiSo = 10 | 11 | 12
const KHOI: readonly KhoiSo[] = [10, 11, 12]
/** Xem trước hiện chừng này câu đầu; còn lại sau nút "Xem đủ N câu". */
export const SO_CAU_XEM_TRUOC = 8
/** Trần lệnh `/gv/thong-ke-lop-cau` (máy chủ: 200 em · 120 câu). */
const TRAN_EM_TK = 200
const TRAN_CAU_TK = 120
const KHOA_NHO = 'ddh.thayTuChua'

/** Đối tượng chữa: một lớp (có danh sách SBD ⇒ có tỉ lệ sai) hoặc cả khối (khi chưa đọc được danh sách lớp). */
export type DoiTuong = { kieu: 'lop'; tenLop: string; khoi: KhoiSo; sbd: readonly string[]; soEm: number } | { kieu: 'khoi'; khoi: KhoiSo }
const khoaDoiTuong = (d: DoiTuong) => (d.kieu === 'lop' ? `lop:${d.tenLop}` : `khoi:${d.khoi}`)
const tenDoiTuong = (d: DoiTuong) => (d.kieu === 'lop' ? `lớp ${d.tenLop}` : `Khối ${d.khoi}`)

const laKhoiSo = (k: number): k is KhoiSo => k === 10 || k === 11 || k === 12
function khoiCuaLopThay(l: Pick<LopThay, 'khoi' | 'tenLop'>): KhoiSo | null {
  const k = Number(l.khoi) || Number(/^(10|11|12)(?!\d)/.exec(l.tenLop.trim())?.[1])
  return laKhoiSo(k) ? k : null
}

/** Danh sách đối tượng cho ô chọn: lớp có khối rõ, xếp theo khối rồi tên; khối không có bài Dạy học nào bị bỏ. Không có lớp ⇒ các khối có bài. */
export function dsDoiTuong(lop: readonly LopThay[] | null, khoiCoBai: ReadonlySet<number>): DoiTuong[] {
  const ra: DoiTuong[] = []
  for (const l of lop ?? []) {
    const k = khoiCuaLopThay(l)
    if (k && khoiCoBai.has(k)) ra.push({ kieu: 'lop', tenLop: l.tenLop, khoi: k, sbd: l.sbd, soEm: l.soEm })
  }
  if (ra.length) return ra.sort((a, b) => a.khoi - b.khoi || (a as { tenLop: string }).tenLop.localeCompare((b as { tenLop: string }).tenLop, 'vi', { numeric: true }))
  return KHOI.filter((k) => khoiCoBai.has(k)).map((khoi) => ({ kieu: 'khoi' as const, khoi }))
}

/** Tờ chọn được của bài: CHỈ tờ Trắc nghiệm · Đúng–sai · Trả lời ngắn (`tuDong` — không Ví dụ minh hoạ, không Các dạng toán trọng tâm), thứ tự phần I → II → III. */
export function toChonDuoc(bai: Pick<BaiCay, 'to'>): ToBai[] {
  const thu = { I: 0, II: 1, III: 2 } as const
  return bai.to.filter((t) => t.tuDong && t.phan && t.soCau > 0).sort((a, b) => thu[a.phan!] - thu[b.phan!])
}

interface KhoTuChua {
  kho: TeacherExamSource[]
  bai: Record<KhoiSo, BaiCay[]>
}

/** Kho DẠY HỌC trên máy (đúng nguồn của Hành trình › Dạy học) + danh sách bài từng khối. */
async function napKhoTuChua(): Promise<KhoTuChua> {
  const [{ loadExamSources }, { khuTrungNguon }, { tachNhieuTheoPhan }, { khoDayHoc, locDeDayHoc }, { dungCay }, { dsBaiCuaKhoi }] = await Promise.all([
    import('../../lib/exam-db'),
    import('../../lib/khu-trung-cau'),
    import('../../lib/tach-phan-de'),
    import('../../lib/day-hoc-len-bang'),
    import('../../lib/cay-chon-de'),
    import('../../lib/bai-hom-nay'),
  ])
  const kho = khoDayHoc(await loadExamSources(), khuTrungNguon, tachNhieuTheoPhan)
  const cay = dungCay(locDeDayHoc(kho))
  const bai = { 10: [], 11: [], 12: [] } as Record<KhoiSo, BaiCay[]>
  for (const k of KHOI) bai[k] = dsBaiCuaKhoi(cay, String(k)).filter((b) => toChonDuoc(b).length > 0)
  return { kho, bai }
}

interface NhoChon {
  doiTuong?: string
  khoaBai?: string
  maDe?: string[]
}
function docNho(): NhoChon {
  try {
    const j = JSON.parse(localStorage.getItem(KHOA_NHO) || 'null') as NhoChon | null
    return j && typeof j === 'object' ? j : {}
  } catch {
    return {}
  }
}
function ghiNho(n: NhoChon) {
  try {
    localStorage.setItem(KHOA_NHO, JSON.stringify(n))
  } catch {
    /* máy chặn bộ nhớ: chỉ mất phần nhớ lựa chọn */
  }
}

type TrangThaiTk = { trang: 'khong-ap' | 'cho' | 'trong' | 'loi' } | { trang: 'co'; soGop: Record<string, SoGopCauLop> }

function Xuong() {
  return (
    <div className="gvv2-ttc-xuong" role="status" aria-label="Đang đọc kho Dạy học trên máy">
      <span className="gvv2-cc-xuong-khoi tt-xuong" style={{ height: 48, borderRadius: 12 }} />
      <span className="gvv2-cc-xuong-khoi tt-xuong" style={{ height: 48, borderRadius: 12 }} />
      <span className="gvv2-cc-xuong-khoi tt-xuong gvv2-ttc-xuong-rong" style={{ height: 96, borderRadius: 16 }} />
    </div>
  )
}

function DongCau({ c, stt, tk }: { c: CauTuChua; stt: number; tk: TrangThaiTk }) {
  const sai = tk.trang === 'co' ? tiLeSaiLop(tk.soGop[c.qid]) : null
  const loai = c.tuLuan ? 'Tự luận' : TEN_LOAI_CAU[c.phan]
  const tom = c.thieuNoiDung ? '' : tomTatCau(c.q)
  return (
    <li className="gvv2-ttc-dong" data-phan={c.phan} data-qid={c.qid}>
      <span className="gvv2-ttc-stt gvv2-so">{stt}</span>
      <div className="gvv2-ttc-cau">
        <span className="gvv2-ttc-meta">
          <b>
            Câu {c.so} · {loai}
          </b>
          {c.tinhToan && (
            <span className="gvv2-ttc-the" data-loai="tinh">
              Có tính toán
            </span>
          )}
          {c.thieuNoiDung && (
            <span className="gvv2-ttc-the" data-loai="thieu">
              Chưa có nội dung trên máy
            </span>
          )}
        </span>
        {tom ? <span className="gvv2-ttc-de">{tom}</span> : !c.thieuNoiDung && <span className="gvv2-ttc-de">(câu chỉ có hình)</span>}
      </div>
      <span className="gvv2-ttc-sai" data-cao={sai && sai.phanTram >= 50 ? 'true' : 'false'}>
        {sai ? (
          <>
            <b className="gvv2-so">{sai.phanTram}%</b> <small className="gvv2-so">lớp sai · {sai.bai} em làm</small>
          </>
        ) : tk.trang === 'co' ? (
          <small>chưa em nào làm</small>
        ) : null}
      </span>
    </li>
  )
}

/** Thẻ "Thầy tự chữa" (gập sẵn). */
export default function ThayTuChua() {
  const showToast = useAppStore((s) => s.showToast)
  const setScreen = useAppStore((s) => s.setScreen)
  const [mo, setMo] = useState(false)

  // ── kho + lớp (chỉ đọc khi mở) ──
  const [kho, setKho] = useState<KhoTuChua | null>(null)
  const [loiKho, setLoiKho] = useState('')
  const [dangTaiKho, setDangTaiKho] = useState(false)
  const [lop, setLop] = useState<LopThay[] | null>(null)
  const [loiLop, setLoiLop] = useState('')
  const lanTai = useRef(0)
  const tai = useCallback(async () => {
    const l = ++lanTai.current
    setDangTaiKho(true)
    setLoiKho('')
    setLoiLop('')
    const [k, dsLop] = await Promise.all([
      napKhoTuChua().then(
        (x) => ({ ok: true as const, x }),
        (e: unknown) => ({ ok: false as const, chu: lyDoDeHieu(e) }),
      ),
      import('../../lib/ten-lop-thay')
        .then(({ layLopThay }) => layLopThay())
        .catch((e: unknown) => ({ ok: false as const, chu: lyDoDeHieu(e) })),
    ])
    if (l !== lanTai.current) return
    if (k.ok) setKho(k.x)
    else setLoiKho(k.chu)
    if (dsLop.ok) setLop(dsLop.du.lop)
    else {
      setLop(null)
      setLoiLop(dsLop.chu)
    }
    setDangTaiKho(false)
  }, [])
  useEffect(
    () => () => {
      lanTai.current++
    },
    [],
  )
  /** Mở thẻ lần đầu ⇒ đọc kho + lớp (gập lại / mở lại không đọc lại; "Thử lại" đọc lại khi lỗi). */
  const batTat = () => {
    if (!mo && !kho && !dangTaiKho && !loiKho) void tai()
    setMo((x) => !x)
  }

  // ── lựa chọn (nhớ trên máy: lớp, bài, tờ của bài) ──
  const [nho] = useState(docNho)
  const khoiCoBai = useMemo(() => new Set(kho ? KHOI.filter((k) => kho.bai[k].length > 0) : []), [kho])
  const doiTuong = useMemo(() => dsDoiTuong(lop, khoiCoBai), [lop, khoiCoBai])
  const [chonDt, setChonDt] = useState<string>(nho.doiTuong ?? '')
  const dt = doiTuong.find((d) => khoaDoiTuong(d) === chonDt) ?? doiTuong[0] ?? null
  const dsBai = useMemo(() => (kho && dt ? kho.bai[dt.khoi] : []), [kho, dt])
  const [khoaBai, setKhoaBai] = useState<string>(nho.khoaBai ?? '')
  const bai = dsBai.find((b) => b.khoaBai === khoaBai) ?? null
  const dsTo = useMemo(() => (bai ? toChonDuoc(bai) : []), [bai])
  // Tờ đang bật của TỪNG bài; bài chưa bấm tờ nào ⇒ bật đủ các tờ (cả đề của bài).
  const [toTheoBai, setToTheoBai] = useState<Record<string, readonly string[]>>(() => (nho.khoaBai && nho.maDe ? { [nho.khoaBai]: nho.maDe } : {}))
  const maChon = useMemo<ReadonlySet<string>>(() => {
    const da = bai ? toTheoBai[bai.khoaBai] : undefined
    return new Set(da && dsTo.some((t) => da.includes(t.maDe)) ? da : dsTo.map((t) => t.maDe))
  }, [bai, toTheoBai, dsTo])
  const batTo = (maDe: string) => {
    if (!bai) return
    const m = new Set(maChon)
    if (m.has(maDe)) m.delete(maDe)
    else m.add(maDe)
    setToTheoBai((cu) => ({ ...cu, [bai.khoaBai]: [...m] }))
  }
  useEffect(() => {
    if (!dt) return
    ghiNho({ doiTuong: khoaDoiTuong(dt), khoaBai: bai?.khoaBai, maDe: [...maChon] })
  }, [dt, bai, maChon])

  const toDangChon = useMemo(() => dsTo.filter((t) => maChon.has(t.maDe)), [dsTo, maChon])
  const nguonChon = useMemo(() => {
    if (!kho) return []
    const theoMa = new Map(kho.kho.map((s) => [s.maDe, s]))
    return toDangChon.map((t) => theoMa.get(t.maDe)).filter((s): s is TeacherExamSource => !!s)
  }, [kho, toDangChon])
  const tatCa = useMemo(() => cauCuaDe(nguonChon), [nguonChon])
  // Câu mang mã khối khác lớp đang chọn: bỏ ngay ở xem trước (cùng luật tờ chiếu chặn thêm một lần) và nói số câu.
  const khoiDt = dt?.khoi ?? null
  const soKhacKhoi = useMemo(() => tatCa.filter((c) => laCauKhacKhoi(c.qid, khoiDt)).length, [tatCa, khoiDt])
  const xep = useMemo(() => xepThuTuChua(tatCa.filter((c) => !laCauKhacKhoi(c.qid, khoiDt))), [tatCa, khoiDt])
  const dem = demTuChua(xep)
  // "Xem đủ N câu" theo bài: đổi bài ⇒ tự về xem 8 câu đầu.
  const [xemDuBai, setXemDuBai] = useState<string | null>(null)
  const xemDu = !!bai && xemDuBai === bai.khoaBai

  // ── số liệu lớp (tỉ lệ sai + dải T trên tờ): CHỈ ĐỌC `/gv/thong-ke-lop-cau`; kết quả gắn khoá (lớp · câu) — đổi lựa chọn ⇒ "đang đọc" ngay ──
  const qidKey = xep.map((c) => c.qid).join('|')
  const sbdLop = dt?.kieu === 'lop' ? dt.sbd : null
  const khoaTk = sbdLop?.length && qidKey && dt ? `${khoaDoiTuong(dt)}#${qidKey}` : ''
  const [tkKq, setTkKq] = useState<{ khoa: string; tk: TrangThaiTk } | null>(null)
  const tk: TrangThaiTk = !khoaTk ? { trang: 'khong-ap' } : tkKq?.khoa === khoaTk ? tkKq.tk : { trang: 'cho' }
  useEffect(() => {
    if (!khoaTk || !sbdLop) return
    let huy = false
    void layThongKeLopCau(sbdLop.slice(0, TRAN_EM_TK), [...new Set(qidKey.split('|'))].slice(0, TRAN_CAU_TK))
      .catch(() => null)
      .then((r) => {
        if (huy) return
        setTkKq({ khoa: khoaTk, tk: r === null ? { trang: 'loi' } : Object.keys(r).length ? { trang: 'co', soGop: r } : { trang: 'trong' } })
      })
    return () => {
      huy = true
    }
  }, [khoaTk, sbdLop, qidKey])

  // ── chiếu ──
  const [html, setHtml] = useState('')
  const [dangChieu, setDangChieu] = useState(false)
  const khongGhi = useCallback(async () => ({ ok: false as const, chu: 'Thầy tự chữa không gọi em lên bảng — không có kết quả để ghi.' }), [])
  const { moPhien, ganO, dongPhien } = useGhiToChieu('thay-tu-chua', khongGhi, khongGhi)
  const chieu = async () => {
    if (!xep.length || !bai) return
    setDangChieu(true)
    try {
      const ma = moPhien()
      const [{ dungToThayTuChua }, { chuBoCauKhacKhoi, chuThieuNoiDung }] = await Promise.all([import('./thay-tu-chua-to'), import('../../lib/tra-cau-chieu')])
      const kq = await dungToThayTuChua(xep, nguonChon, {
        tenBuoi: tenBuoiTuChua(bai.tenBai, toDangChon.map((t) => t.phan as PhanCau)),
        khoi: dt?.khoi ?? null,
        maPhien: ma,
        soGop: tk.trang === 'co' ? tk.soGop : null,
      })
      const bo = chuBoCauKhacKhoi(kq.soBoKhoi)
      if (kq.soBoKhoi >= xep.length) {
        showToast(bo ? `${bo} — không còn câu nào để chiếu` : 'Chưa có câu nào để chiếu lên bảng', 'warn')
        return
      }
      if (bo) showToast(bo, 'warn')
      const thieu = chuThieuNoiDung(kq.soThieu)
      if (thieu) showToast(thieu, 'warn')
      ganO(ma, kq.o)
      setHtml(kq.html)
    } catch (e) {
      showToast(e instanceof Error && e.message ? e.message : 'Không mở được tờ máy chiếu', 'warn')
    } finally {
      setDangChieu(false)
    }
  }

  const hien = xemDu ? xep : xep.slice(0, SO_CAU_XEM_TRUOC)
  const nutMo = (
    <button type="button" className="gvv2-nut-vien tt-nhan" aria-expanded={mo} aria-controls="gvv2-ttc-than" onClick={batTat}>
      {mo ? 'Thu gọn' : 'Chọn đề'}
      {mo ? <ChevronUp size={18} aria-hidden="true" /> : <ChevronDown size={18} aria-hidden="true" />}
    </button>
  )

  return (
    <section className="gvv2-the gvv2-ttc" aria-labelledby="gvv2-ttc-tieu" data-mo={mo ? 'true' : 'false'}>
      <div className="gvv2-ttc-dau">
        <span className="gvv2-cc-bieu" data-mau="xd" aria-hidden="true">
          <Presentation size={20} />
        </span>
        <div className="gvv2-ttc-chu">
          <h2 id="gvv2-ttc-tieu" className="gvv2-ttc-tieu">
            Thầy tự chữa
          </h2>
          <p className="gvv2-ttc-phu">Chọn một đề trong Dạy học — chiếu đủ mọi câu cho cả lớp, câu Đúng–sai và câu có tính toán lên trước.</p>
        </div>
        {nutMo}
      </div>

      {mo && (
        <div id="gvv2-ttc-than" className="gvv2-ttc-than">
          {loiKho ? (
            <div className="gvv2-loi gvv2-ttc-loi" role="alert">
              <p>Chưa đọc được kho đề trên máy này. {loiKho}</p>
              <button type="button" className="gvv2-nut-vien tt-nhan" onClick={() => void tai()} disabled={dangTaiKho}>
                Thử lại
              </button>
            </div>
          ) : !kho ? (
            <Xuong />
          ) : !doiTuong.length ? (
            <div className="gvv2-ttc-trong">
              <p>Kho Dạy học trên máy này chưa có bài nào có tờ Trắc nghiệm, Đúng–sai hay Trả lời ngắn. Nhập đề vào thư mục DẠY HỌC ở Kho đề rồi mở lại.</p>
              <button type="button" className="gvv2-nut-vien tt-nhan" onClick={() => setScreen('nganhangde')}>
                Mở Kho đề
              </button>
            </div>
          ) : (
            <>
              <div className="gvv2-ttc-chon">
                <label className="gvv2-ttc-o">
                  <span>Lớp</span>
                  <select
                    value={dt ? khoaDoiTuong(dt) : ''}
                    onChange={(e) => setChonDt(e.target.value)}
                  >
                    {KHOI.map((k) => {
                      const ds = doiTuong.filter((d) => d.khoi === k)
                      if (!ds.length) return null
                      return (
                        <optgroup key={k} label={`Khối ${k}`}>
                          {ds.map((d) => (
                            <option key={khoaDoiTuong(d)} value={khoaDoiTuong(d)}>
                              {d.kieu === 'lop' ? `${d.tenLop} · ${d.soEm} em` : `Khối ${d.khoi}`}
                            </option>
                          ))}
                        </optgroup>
                      )
                    })}
                  </select>
                </label>
                <label className="gvv2-ttc-o">
                  <span>Bài trong Dạy học{dt ? ` · Khối ${dt.khoi}` : ''}</span>
                  <select value={bai?.khoaBai ?? ''} onChange={(e) => setKhoaBai(e.target.value)}>
                    {!bai && (
                      <option value="" disabled>
                        Chọn bài cần chữa
                      </option>
                    )}
                    {[...new Set(dsBai.map((b) => b.chuong))].map((ch) => (
                      <optgroup key={ch || '_'} label={ch || 'Chưa xếp chương'}>
                        {dsBai
                          .filter((b) => b.chuong === ch)
                          .map((b) => (
                            <option key={b.khoaBai} value={b.khoaBai}>
                              {b.tenBai}
                            </option>
                          ))}
                      </optgroup>
                    ))}
                  </select>
                </label>
              </div>
              {loiLop && (
                <p className="gvv2-ttc-ghi" role="status">
                  Chưa tải được danh sách lớp ({loiLop}) — đang chọn theo khối; tỉ lệ sai của lớp sẽ không có.
                </p>
              )}

              {!bai ? (
                <p className="gvv2-ttc-trong-chu">Chọn một bài để xem các câu sẽ chiếu.</p>
              ) : (
                <>
                  <div className="gvv2-ttc-to" role="group" aria-label={`Tờ đề của ${bai.tenBai}`}>
                    <span className="gvv2-ttc-nhan">Đề</span>
                    {dsTo.map((t) => (
                      <button
                        key={t.maDe}
                        type="button"
                        className="gvv2-ttc-chip tt-nhan"
                        aria-pressed={maChon.has(t.maDe)}
                        onClick={() => batTo(t.maDe)}
                      >
                        <b>{TEN_LOAI_CAU[t.phan as PhanCau]}</b> <small className="gvv2-so">{t.soCau} câu</small>
                      </button>
                    ))}
                  </div>

                  {xep.length === 0 ? (
                    <p className="gvv2-ttc-trong-chu">Bật ít nhất một tờ đề ở trên để chiếu.</p>
                  ) : (
                    <>
                      <p className="gvv2-ttc-tom" aria-live="polite">
                        <b className="gvv2-so">{dem.tong}</b> câu sẽ chiếu · <b className="gvv2-so">{dem.dungSai}</b> câu Đúng–sai ·{' '}
                        <b className="gvv2-so">{dem.tinhToan}</b> câu có tính toán — Đúng–sai và câu có tính toán chiếu trước
                      </p>
                      {soKhacKhoi > 0 && (
                        <p className="gvv2-ttc-bao" role="status">
                          {soKhacKhoi} câu mang mã khối khác Khối {khoiDt} — không chiếu.
                        </p>
                      )}
                      {dem.thieu > 0 && (
                        <p className="gvv2-ttc-bao" role="status">
                          {dem.thieu} câu chưa có nội dung trên máy này — tờ chiếu sẽ hiện dòng thay thế ở chỗ ấy.
                        </p>
                      )}
                      <p className="gvv2-ttc-ghi">
                        {tk.trang === 'co' || tk.trang === 'trong'
                          ? `Tỉ lệ sai: lần làm mới nhất của mỗi em ${tenDoiTuong(dt!)} (sổ học)${tk.trang === 'trong' ? ' — chưa em nào làm các câu này, tờ không có dải thống kê.' : '.'}`
                          : tk.trang === 'cho'
                            ? `Đang đọc số liệu của ${tenDoiTuong(dt!)}…`
                            : tk.trang === 'loi'
                              ? 'Chưa tải được số liệu lớp — tờ vẫn chiếu, chỉ không có dải thống kê.'
                              : dt?.kieu === 'lop'
                                ? 'Lớp này chưa có danh sách số báo danh — tờ vẫn chiếu, không có tỉ lệ sai.'
                                : 'Chọn một lớp để thấy tỉ lệ sai của lớp.'}
                      </p>
                      <ol className="gvv2-ttc-ds" aria-label="Thứ tự câu sẽ chiếu">
                        {hien.map((c, i) => (
                          <DongCau key={c.khoa} c={c} stt={i + 1} tk={tk} />
                        ))}
                      </ol>
                      {xep.length > SO_CAU_XEM_TRUOC && (
                        <button type="button" className="gvv2-nut-chu gvv2-ttc-xem-du" aria-expanded={xemDu} onClick={() => setXemDuBai(xemDu ? null : (bai?.khoaBai ?? null))}>
                          {xemDu ? `Chỉ xem ${SO_CAU_XEM_TRUOC} câu đầu` : `Xem đủ ${xep.length} câu`}
                        </button>
                      )}
                    </>
                  )}

                  <div className="gvv2-ttc-cuoi">
                    <button type="button" className="gvv2-nut-chinh tt-nhan" disabled={!xep.length || dangChieu} aria-busy={dangChieu} onClick={() => void chieu()}>
                      {dangChieu ? <RefreshCw size={18} aria-hidden="true" className="gvv2-quay" /> : <MonitorPlay size={18} aria-hidden="true" />}
                      {dangChieu ? 'Đang dựng tờ chiếu…' : 'Chiếu lên máy chiếu'}
                    </button>
                    <span className="gvv2-ttc-goi-y">Trên tờ chiếu: G hiện lời giải · T thống kê lớp · X ai làm sai · Space lật trang · ? mọi phím</span>
                  </div>
                </>
              )}
            </>
          )}
        </div>
      )}

      {html && (
        <Suspense fallback={null}>
          <KhungXemPhieu
            html={html}
            ten="Tờ máy chiếu — Thầy tự chữa"
            dong={() => {
              dongPhien()
              setHtml('')
            }}
          />
        </Suspense>
      )}
    </section>
  )
}
