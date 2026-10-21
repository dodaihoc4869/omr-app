// HÀNH TRÌNH › CHỮA BÀI › KHỐI (B) "CHỮA CÂU KHÓ & TÍNH TOÁN" (thầy 12/10, nguyên văn: "mục cần chữa cho tôi một phần tự chữa, phần này cho tôi chọn đề
// trong Mục dạy học (trắc nghiệm khách quan trả lời ngắn) … ưu tiên đẩy câu đúng sai và tính toán lên đầu tiên hiển thị, bảng hiển thị đầy đủ mọi thứ như mục
// chiếu lên bảng (đúng chuẩn)"; 12/10B: "thu gọn tối giản hết lại thành 2 mục …" · "chữa câu khó và tính toán cũng phải chiếu lên bảng theo chuẩn nhé" —
// bản vẽ HanhTrinh-ChuaBai + ToChieu-ChuaCauKho thầy duyệt).
//
// MỞ SẴN (không gập): đọc kho Dạy học trên máy + danh sách lớp ngay khi thẻ hiện.
//   1. Lớp (ô chọn theo khối, `/gv/lop` — lệnh chỉ đọc sẵn có; lỗi ⇒ chọn theo khối, không có số liệu lớp, không gọi em)
//   2. Bài trong Dạy học (đúng cây DẠY HỌC của Hành trình › Dạy học: `khoDayHoc` → `dsBaiCuaKhoi`)
//   3. Đề: chip Trắc nghiệm · Đúng–sai · Trả lời ngắn (kèm số câu) — chọn bài thì bật đủ (cả đề của bài); bấm để giữ một tờ.
//   4. BỐN Ô SỐ: câu sẽ chiếu · câu Đúng–sai · câu có tính toán · câu lớp sai từ 30%.
//   5. Danh sách câu ĐÃ XẾP (Đúng–sai có tính toán → Đúng–sai → có tính toán → còn lại — `xepThuTuChua`): số thứ tự chiếu · Câu N · loại · "Có tính toán"
//      · tóm tắt đề · "Gọi lên bảng: <em> (có mặt, làm sai câu này) · còn N em sai khác" · % lớp sai + "x/y em sai" + thanh.
//   6. Nút chính "Chiếu lên bảng" ⇒ tờ CHUẨN Chiếu lên bảng (`thay-tu-chua-to.ts` → `dungToChieu` → `KhungXemPhieu`): mỗi câu một đợt, phím L / nút "Lên bảng"
//      gọi em đầu danh sách, "Gọi em khác" gọi em kế, cột 1/3 đen + thẻ tên "Tên · Sai câu này N lần · gần nhất dd/mm · số giây", Đạt / Chưa đạt ghi sổ
//      qua cầu nối (`useGhiToChieu`, lệnh `ghiLenBang` như Lên bảng chiến dịch; "Thầy chữa" ⇒ `/gv/thay-chua-cau`), G lời giải hiện dần, T thống kê lớp,
//      X ai sai + số giây, Space lật trang.
// ỨNG VIÊN (ung-vien-chua-cau.ts): em của lớp làm SAI câu (lần mới nhất) — `/gv/ai-sai-nhieu-cau` MỘT lệnh cho cả đề (máy chủ cũ ⇒ `/gv/ai-sai-cau` từng câu);
// ưu tiên em CÓ MẶT ở buổi điểm danh đang mở hôm nay (`/gv/buoi-hoc` gan-day); không có buổi ⇒ vẫn liệt kê, nói rõ chưa biết ai có mặt.
// Năm trạng thái: chờ = khung xương · trống (kho / khối chưa có bài) = câu nói vì sao + việc làm tiếp · có dữ liệu · lỗi = lý do + Thử lại · mất mạng
// (danh sách lớp / số liệu lớp / em làm sai lỗi ⇒ dòng nói thật, phần còn lại vẫn dùng được). Chỉ GHI khi thầy bấm Đạt / Chưa đạt / Thầy chữa trên tờ.
// Màu: chỉ biến --gvm-* của app thầy (thay-tu-chua.css). Đáp án / lời giải chỉ nằm trên tờ chiếu của máy thầy.
import { lazy, Suspense, useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { MonitorPlay, RefreshCw } from 'lucide-react'
import type { TeacherExamSource } from '../../data/examContent'
import type { BaiCay, ToBai } from '../../lib/bai-hom-nay'
import type { LopThay } from '../../lib/ten-lop-thay'
import type { SoGopCauLop } from '../../lib/thong-ke-lop-cau'
import { layThongKeLopCau } from '../../lib/ho-so-em-thay'
import { lyDoDeHieu } from '../../lib/loi-de-hieu'
import {
  NGUONG_LOP_SAI,
  TEN_LOAI_CAU,
  cauCuaDe,
  demTuChua,
  laCauKhacKhoi,
  soLieuLopCau,
  tenBuoiTuChua,
  tomTatCau,
  xepThuTuChua,
  type CauTuChua,
  type PhanCau,
} from '../../lib/thay-tu-chua'
import { docCoMatHomNay, laySaiNhieuCau, ngayVnCua, xepUngVien, type KetQuaSai } from '../../lib/ung-vien-chua-cau'
import { layEmChieu,nhanEmChieu,type EmChieu } from '../../lib/ung-vien-chieu'
import { sinhMaNgauNhien } from '../../lib/thiet-bi'
import { useAppStore } from '../../store/appStore'
import { ghiMotO, thayChuaQuaMayChu, useGhiToChieu } from './ghi-to-chieu'
import type { OGhiToChieu } from './to-chieu'
import type { SoLopCau } from './thay-tu-chua-to'
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

/** Đối tượng chữa: một lớp (có danh sách SBD ⇒ có số liệu lớp + gọi em) hoặc cả khối (khi chưa đọc được danh sách lớp). */
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
type TrangThaiUv = { trang: 'khong-ap' | 'cho' } | { trang: 'loi'; chu: string } | { trang: 'co'; kq: Extract<KetQuaSai, { ok: true }> }

function Xuong() {
  return (
    <div className="gvv2-ttc-xuong" role="status" aria-label="Đang đọc kho Dạy học trên máy">
      <span className="gvv2-cc-xuong-khoi tt-xuong" style={{ height: 48, borderRadius: 12 }} />
      <span className="gvv2-cc-xuong-khoi tt-xuong" style={{ height: 48, borderRadius: 12 }} />
      <span className="gvv2-cc-xuong-khoi tt-xuong gvv2-ttc-xuong-rong" style={{ height: 96, borderRadius: 16 }} />
    </div>
  )
}

interface DongXem {
  c: CauTuChua
  so: { sai: number; lam: number; phanTram: number } | null
  /** Có số liệu lớp (đã đọc xong) mà câu chưa em nào làm. */
  chuaAiLam: boolean
  uv: readonly EmChieu[] | null
}

function DongCau({ d, stt }: { d: DongXem; stt: number }) {
  const { c, so, uv } = d
  const loai = c.tuLuan ? 'Tự luận' : TEN_LOAI_CAU[c.phan]
  const tom = c.thieuNoiDung ? '' : tomTatCau(c.q)
  const cao = !!so && so.phanTram >= NGUONG_LOP_SAI
  const goi = uv && uv.length ? `Gọi lên bảng: ${uv[0]!.ten} · ${nhanEmChieu(uv[0]!).chu}${uv.length>1?` · còn ${uv.length-1} em phù hợp`:''}` : ''
  return (
    <li className="gvv2-ttc-dong" data-phan={c.phan} data-qid={c.qid}>
      <span className="gvv2-ttc-stt gvv2-so">{stt}</span>
      <div className="gvv2-ttc-cau">
        <span className="gvv2-ttc-meta">
          <b>Câu {c.so}</b>
          <span className="gvv2-ttc-loai" data-phan={c.tuLuan ? 'tu-luan' : c.phan}>
            {loai}
          </span>
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
        {goi ? (
          <span className="gvv2-ttc-goi">
            {goi}
          </span>
        ) : uv && d.chuaAiLam === false && so && so.sai === 0 ? (
          <span className="gvv2-ttc-goi" data-trong="true">
            Chưa đủ dữ liệu chọn em — thầy chữa cho cả lớp
          </span>
        ) : null}
      </div>
      <span className="gvv2-ttc-sai" data-cao={cao ? 'true' : 'false'}>
        {so ? (
          <>
            <span className="gvv2-ttc-sai-so">
              <b className="gvv2-so">{so.phanTram}% lớp sai</b>
              <small className="gvv2-so">
                {so.sai}/{so.lam} em sai
              </small>
            </span>
            <span className="gvv2-ttc-thanh" aria-hidden="true">
              <i style={{ width: `${Math.max(0, Math.min(100, so.phanTram))}%` }} />
            </span>
          </>
        ) : d.chuaAiLam ? (
          <small>chưa em nào làm</small>
        ) : null}
      </span>
    </li>
  )
}

/** Khối (B) "Chữa câu khó & tính toán" — mở sẵn. */
export default function ThayTuChua() {
  const showToast = useAppStore((s) => s.showToast)
  const setScreen = useAppStore((s) => s.setScreen)

  // ── kho + lớp (đọc ngay khi thẻ hiện) ──
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
  useEffect(() => {
    void tai()
    return () => {
      lanTai.current++
    }
  }, [tai])

  // ── em có mặt hôm nay (buổi điểm danh đang mở) — đọc một lần; undefined = đang đọc ──
  const [coMat, setCoMat] = useState<ReadonlySet<string> | null | undefined>(undefined)
  useEffect(() => {
    let huy = false
    void docCoMatHomNay().then((s) => {
      if (!huy) setCoMat(s)
    })
    return () => {
      huy = true
    }
  }, [])

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
  const [seedChieu]=useState(sinhMaNgauNhien)
  // Câu mang mã khối khác lớp đang chọn: bỏ ngay ở xem trước (cùng luật tờ chiếu chặn thêm một lần) và nói số câu.
  const khoiDt = dt?.khoi ?? null
  const soKhacKhoi = useMemo(() => tatCa.filter((c) => laCauKhacKhoi(c.qid, khoiDt)).length, [tatCa, khoiDt])
  // "Xem đủ N câu" theo bài: đổi bài ⇒ tự về xem 8 câu đầu.
  const [xemDuBai, setXemDuBai] = useState<string | null>(null)
  const xemDu = !!bai && xemDuBai === bai.khoaBai

  // ── số liệu lớp (tỉ lệ sai + dải T) và EM LÀM SAI từng câu: CHỈ ĐỌC; kết quả gắn khoá (lớp · câu) — đổi lựa chọn ⇒ "đang đọc" ngay ──
  const qidKey = tatCa.filter(c=>!laCauKhacKhoi(c.qid,khoiDt)).map(c=>c.qid).sort().join('|')
  const sbdLop = dt?.kieu === 'lop' ? dt.sbd : null
  const khoaTk = sbdLop?.length && qidKey && dt ? `${khoaDoiTuong(dt)}#${qidKey}` : ''
  const [tkKq, setTkKq] = useState<{ khoa: string; tk: TrangThaiTk } | null>(null)
  const tk: TrangThaiTk = !khoaTk ? { trang: 'khong-ap' } : tkKq?.khoa === khoaTk ? tkKq.tk : { trang: 'cho' }
  const [uvKq, setUvKq] = useState<{ khoa: string; uv: TrangThaiUv } | null>(null)
  const uvTrang: TrangThaiUv = !khoaTk ? { trang: 'khong-ap' } : uvKq?.khoa === khoaTk ? uvKq.uv : { trang: 'cho' }
  const xep=useMemo(()=>{const so=new Map<string,{sai:number;lam:number}>();for(const c of tatCa){const v=soLieuLopCau(uvTrang.trang==='co'?uvTrang.kq.cau[c.qid]:undefined,tk.trang==='co'?tk.soGop[c.qid]:undefined);if(v)so.set(c.qid,v)}return xepThuTuChua(tatCa.filter(c=>!laCauKhacKhoi(c.qid,khoiDt)),so,seedChieu)},[tatCa,khoiDt,uvTrang,tk,seedChieu])
  const dem=demTuChua(xep)
  /** Lượt đọc em làm sai đang chạy (nút Chiếu bấm sớm thì chờ đúng lượt này, không chiếu "cả lớp" nhầm). */
  const uvHua = useRef<{ khoa: string; hua: Promise<TrangThaiUv> } | null>(null)
  const tkHua=useRef<{khoa:string;hua:Promise<TrangThaiTk>}|null>(null)
  useEffect(() => {
    if (!khoaTk || !sbdLop) return
    let huy = false
    const qids = [...new Set(qidKey.split('|'))]
    const lo:string[][]=[];for(let i=0;i<qids.length;i+=TRAN_CAU_TK)lo.push(qids.slice(i,i+TRAN_CAU_TK))
    const tkh=Promise.all(lo.map(q=>layThongKeLopCau(sbdLop.slice(0,TRAN_EM_TK),q))).then(rows=>{if(rows.some(r=>r===null))return {trang:'loi'} as TrangThaiTk;const soGop=Object.assign({},...rows);return Object.keys(soGop).length?{trang:'co',soGop} as TrangThaiTk:{trang:'trong'} as TrangThaiTk}).catch(()=>({trang:'loi'} as TrangThaiTk))
    tkHua.current={khoa:khoaTk,hua:tkh}
    void tkh.then((r) => {
        if (huy) return
        setTkKq({ khoa: khoaTk, tk:r })
      })
    const hua = Promise.all(lo.map(q=>laySaiNhieuCau(sbdLop.slice(0,TRAN_EM_TK),q))).then(rows=>{const loi=rows.find(r=>!r.ok);if(loi&&!loi.ok)return loi;const ok=rows.filter((r):r is Extract<KetQuaSai,{ok:true}>=>r.ok);return {ok:true as const,cau:Object.assign({},...ok.map(r=>r.cau)),tungCau:ok.some(r=>r.tungCau)}}).then(
      (r): TrangThaiUv => (r.ok ? { trang: 'co', kq: r } : { trang: 'loi', chu: r.chu }),
      (e: unknown): TrangThaiUv => ({ trang: 'loi', chu: lyDoDeHieu(e) }),
    )
    uvHua.current = { khoa: khoaTk, hua }
    void hua.then((uv) => {
      if (!huy) setUvKq({ khoa: khoaTk, uv })
    })
    return () => {
      huy = true
    }
  }, [khoaTk, sbdLop, qidKey])

  /** Ứng viên đã xếp từng câu (có mặt trước, rải người đầu) — null khi chưa có danh sách em sai. */
  const xepUv = useCallback(
    (u: TrangThaiUv) => (u.trang === 'co' ? xepUngVien(xep.map((c) => c.qid), u.kq.cau, coMat ?? null) : null),
    [xep, coMat],
  )
  const [duGoi,setDuGoi]=useState<{khoa:string;map:Map<string,EmChieu[]>}|null>(null)
  useEffect(()=>{let huy=false;if(khoaTk&&sbdLop)void layEmChieu(qidKey.split('|'),sbdLop,coMat,undefined,undefined,{kenh:'tu-chua'}).then(map=>{if(!huy)setDuGoi({khoa:khoaTk,map})}).catch(()=>{if(!huy)setDuGoi({khoa:khoaTk,map:new Map()})});return()=>{huy=true}},[khoaTk,sbdLop,qidKey,coMat])
  const dongXem: DongXem[] = useMemo(
    () =>
      xep.map((c) => {
        const lo = uvTrang.trang === 'co' ? uvTrang.kq.cau[c.qid] : undefined
        const gop = tk.trang === 'co' ? tk.soGop[c.qid] : undefined
        const so = soLieuLopCau(lo, gop)
        const coSoLieu = tk.trang === 'co' || tk.trang === 'trong' || (uvTrang.trang === 'co' && !uvTrang.kq.tungCau)
        return { c, so, chuaAiLam: !so && coSoLieu, uv: duGoi?.khoa===khoaTk?(duGoi.map.get(c.qid)??[]):null }
      }),
    [xep, uvTrang, tk, duGoi,khoaTk],
  )
  const coSoLop = dongXem.some((d) => d.so)
  const soSaiCao = dongXem.filter((d) => d.so && d.so.phanTram >= NGUONG_LOP_SAI).length
  const soCoMatLop = coMat && sbdLop ? sbdLop.filter((s) => coMat.has(s)).length : 0

  // ── chiếu (tờ chuẩn Chiếu lên bảng: gọi em, Đạt / Chưa đạt ghi sổ) ──
  const [html, setHtml] = useState('')
  const [dangChieu, setDangChieu] = useState(false)
  // Khoá ghi theo NGÀY: chống ghi đôi cùng em × câu trong ngày (mở lại tờ ⇒ ô đã ghi khoá ngay); hôm sau chữa lại được.
  const [maNguon] = useState(() => `chua-cau-kho-${ngayVnCua(Date.now())}`)
  const ghiO = useCallback(
    async (o: OGhiToChieu, dat: boolean, giay?: number) =>
      !o.sbd
        ? { ok: false as const, chu: 'Câu chữa cho cả lớp — không có em để ghi.' }
        : !o.chuyenDe
          ? { ok: false as const, chu: 'Câu này chưa có chuyên đề — chưa ghi Đạt / Chưa đạt vào sổ được.' }
          : ghiMotO(o, dat, giay),
    [],
  )
  const thayChuaO = useCallback(
    async (o: OGhiToChieu) => (o.sbd ? thayChuaQuaMayChu(o, 'len_bang', maNguon) : { ok: false as const, chu: 'Câu chữa cho cả lớp — không có em để ghi.' }),
    [maNguon],
  )
  // Nút X, hai thẻ (thầy 21/10): lớp đang chọn + em đã điểm danh (chưa điểm danh ⇒ thẻ báo rõ).
  const lopAiSai = useCallback(() => (sbdLop?.length ? { sbdLop, coMat: coMat && coMat.size > 0 ? coMat : null } : null), [sbdLop, coMat])
  const { moPhien, ganO, dongPhien } = useGhiToChieu(maNguon, ghiO, thayChuaO, undefined, lopAiSai)
  const chieu = async () => {
    if (!xep.length || !bai) return
    setDangChieu(true)
    try {
      // Danh sách em làm sai còn đang đọc ⇒ chờ đúng lượt ấy (không chiếu "cả lớp" nhầm khi lớp có em sai).
      let uv = uvTrang
      if (uv.trang === 'cho' && uvHua.current?.khoa === khoaTk) uv = await uvHua.current.hua
      const thongKe=tkHua.current?.khoa===khoaTk?await tkHua.current.hua:tk
      const theoCau = xepUv(uv)
      const soLop = new Map<string, SoLopCau>()
      for(const c of xep){const v=soLieuLopCau(uv.trang==='co'?uv.kq.cau[c.qid]:undefined,thongKe.trang==='co'?thongKe.soGop[c.qid]:undefined);if(v)soLop.set(c.qid,{sai:v.sai,lam:v.lam})}
      const thuTuChieu=xepThuTuChua(xep,soLop,seedChieu)
      const ma = moPhien()
      const [{ dungToThayTuChua }, { chuBoCauKhacKhoi, chuThieuNoiDung }] = await Promise.all([import('./thay-tu-chua-to'), import('../../lib/tra-cau-chieu')])
      const kq = await dungToThayTuChua(thuTuChieu, nguonChon, {
        tenBuoi: tenBuoiTuChua(bai.tenBai, toDangChon.map((t) => t.phan as PhanCau)),
        khoi: dt?.khoi ?? null,
        maPhien: ma,
        soGop: thongKe.trang === 'co' ? thongKe.soGop : null,
        ungVien: theoCau,
        soLop,
        sbdLop:sbdLop??[],coMat,
      })
      const bo = chuBoCauKhacKhoi(kq.soBoKhoi)
      if (kq.soBoKhoi >= xep.length) {
        showToast(bo ? `${bo} — không còn câu nào để chiếu` : 'Chưa có câu nào để chiếu lên bảng', 'warn')
        return
      }
      if (bo) showToast(bo, 'warn')
      const thieu = chuThieuNoiDung(kq.soThieu)
      if (thieu) showToast(thieu, 'warn')
      if (kq.soKhongGhi > 0) showToast(`${kq.soKhongGhi} câu chưa có chuyên đề — trên tờ các câu ấy không có nút Đạt / Chưa đạt (chưa ghi sổ được)`, 'warn')
      ganO(ma, kq.o)
      setHtml(kq.html)
    } catch (e) {
      showToast(e instanceof Error && e.message ? e.message : 'Không mở được tờ máy chiếu', 'warn')
    } finally {
      setDangChieu(false)
    }
  }

  const hien = xemDu ? dongXem : dongXem.slice(0, SO_CAU_XEM_TRUOC)

  return (
    <section className="gvv2-the gvv2-ttc" aria-labelledby="gvv2-ttc-tieu">
      <div className="gvv2-ttc-dau">
        <h2 id="gvv2-ttc-tieu" className="gvv2-ttc-tieu">
          Chữa câu khó &amp; tính toán
        </h2>
        <p className="gvv2-ttc-phu">
          Câu tính toán, câu khó và câu nhiều em sai được trộn trong nhóm ưu tiên. Gọi em đã tự làm đúng; nếu chưa có, chọn em dự kiến làm được.
        </p>
      </div>

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
              <label className="gvv2-ttc-o gvv2-ttc-o--lop">
                <span>Lớp</span>
                <select value={dt ? khoaDoiTuong(dt) : ''} onChange={(e) => setChonDt(e.target.value)}>
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
              <label className="gvv2-ttc-o gvv2-ttc-o--bai">
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
              {bai && (
                <div className="gvv2-ttc-to" role="group" aria-label={`Tờ đề của ${bai.tenBai}`}>
                  <span className="gvv2-ttc-nhan">Đề</span>
                  <span className="gvv2-ttc-chip-hang">
                    {dsTo.map((t) => (
                      <button key={t.maDe} type="button" className="gvv2-ttc-chip tt-nhan" aria-pressed={maChon.has(t.maDe)} onClick={() => batTo(t.maDe)}>
                        <b>{TEN_LOAI_CAU[t.phan as PhanCau]}</b> <small className="gvv2-so">· {t.soCau} câu</small>
                      </button>
                    ))}
                  </span>
                </div>
              )}
            </div>
            {loiLop && (
              <p className="gvv2-ttc-ghi" role="status">
                Chưa tải được danh sách lớp ({loiLop}) — đang chọn theo khối; tỉ lệ sai của lớp và em gọi lên bảng sẽ không có.
              </p>
            )}

            {!bai ? (
              <p className="gvv2-ttc-trong-chu">Chọn một bài để xem các câu sẽ chiếu.</p>
            ) : xep.length === 0 ? (
              <p className="gvv2-ttc-trong-chu">Bật ít nhất một tờ đề ở trên để chiếu.</p>
            ) : (
              <>
                <div className="gvv2-ttc-so4" aria-live="polite">
                  <span className="gvv2-ttc-o-so" data-mau="xam">
                    <b className="gvv2-so">{dem.tong}</b> câu sẽ chiếu
                  </span>
                  <span className="gvv2-ttc-o-so" data-mau="tim">
                    <b className="gvv2-so">{dem.dungSai}</b> câu Đúng–sai
                  </span>
                  <span className="gvv2-ttc-o-so" data-mau="xd">
                    <b className="gvv2-so">{dem.tinhToan}</b> câu có tính toán
                  </span>
                  {coSoLop && (
                    <span className="gvv2-ttc-o-so" data-mau="ho">
                      <b className="gvv2-so">{soSaiCao}</b> câu lớp sai từ {NGUONG_LOP_SAI}%
                    </span>
                  )}
                </div>
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
                  {tk.trang === 'cho' || uvTrang.trang === 'cho'
                    ? `Đang đọc số liệu và em làm sai của ${tenDoiTuong(dt!)}…`
                    : !khoaTk
                      ? dt?.kieu === 'lop'
                        ? 'Lớp này chưa có danh sách số báo danh — tờ vẫn chiếu, không có tỉ lệ sai và chưa gọi được em.'
                        : 'Chọn một lớp để thấy tỉ lệ sai và em được gọi lên bảng.'
                      : uvTrang.trang === 'loi'
                        ? `Chưa tải được danh sách em làm sai (${uvTrang.chu}) — tờ vẫn chiếu, các câu chữa cho cả lớp.`
                        : tk.trang === 'loi' && !coSoLop
                          ? 'Chưa tải được số liệu lớp — tờ vẫn chiếu, chỉ không có dải thống kê.'
                          : `Tỉ lệ sai: lần làm mới nhất của mỗi em ${tenDoiTuong(dt!)} (sổ học).${
                              coMat === undefined
                                ? ''
                                : coMat
                                  ? ` Gọi em có mặt trước — buổi điểm danh đang mở hôm nay có ${soCoMatLop} em của lớp.`
                                  : ' Hôm nay chưa có buổi điểm danh đang mở — gọi theo số lần sai, chưa biết em nào có mặt.'
                            }${uvTrang.trang === 'co' && uvTrang.kq.tungCau ? ' Máy chủ chưa có lệnh tra theo lô — em làm sai chỉ tra cho 30 câu đầu.' : ''}`}
                </p>
                <ol className="gvv2-ttc-ds" aria-label="Thứ tự câu sẽ chiếu">
                  {hien.map((d, i) => (
                    <DongCau key={d.c.khoa} d={d} stt={i + 1} />
                  ))}
                </ol>
                {xep.length > SO_CAU_XEM_TRUOC && (
                  <button type="button" className="gvv2-nut-chu gvv2-ttc-xem-du" aria-expanded={xemDu} onClick={() => setXemDuBai(xemDu ? null : (bai?.khoaBai ?? null))}>
                    {xemDu ? `Chỉ xem ${SO_CAU_XEM_TRUOC} câu đầu` : `Xem đủ ${xep.length} câu ›`}
                  </button>
                )}
              </>
            )}

            {bai && (
              <div className="gvv2-ttc-cuoi">
                <button type="button" className="gvv2-nut-chinh tt-nhan" disabled={!xep.length || dangChieu} aria-busy={dangChieu} onClick={() => void chieu()}>
                  {dangChieu ? <RefreshCw size={20} aria-hidden="true" className="gvv2-quay" /> : <MonitorPlay size={20} aria-hidden="true" />}
                  {dangChieu ? 'Đang dựng tờ chiếu…' : 'Chiếu lên bảng'}
                </button>
                <span className="gvv2-ttc-goi-y">
                  Tờ chiếu chuẩn như Chiếu lên bảng: <b>L</b> gọi em lên bảng · <b>Đạt / Chưa đạt</b> ghi sổ · <b>G</b> lời giải hiện dần · <b>T</b> thống kê lớp ·{' '}
                  <b>X</b> ai sai, mấy giây · <b>Space</b> lật trang
                </span>
              </div>
            )}
          </>
        )}
      </div>

      {html && (
        <Suspense fallback={null}>
          <KhungXemPhieu
            html={html}
            ten="Tờ máy chiếu — Chữa câu khó & tính toán"
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
