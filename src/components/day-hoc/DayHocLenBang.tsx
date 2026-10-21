// BẢNG DẠY HỌC — mục Lên bảng của app thầy (thầy lệnh 28/09: "thêm cho tôi một bảng thủ công DẠY HỌC"). BA BƯỚC:
//  1 · ĐIỂM DANH — nút "Điểm danh" mở buổi học trên máy chủ + chiếu mã 6 số & QR (tấm phủ `TamPhuChieuMa`, cùng kiểu Chiếu mã vào thi);
//      em trên app học sinh nhập/quét mã ⇒ vào danh sách CÓ MẶT (tự làm mới 5 giây qua nhịp chung `useNhipThay` như phòng chờ ca thi);
//      thầy thêm/bớt tay được (chọn từ lớp). Bước này nay là thành phần CHUNG `DiemDanhBuoi.tsx` (thẻ Kiểm tra đầu giờ dùng lại, 29/09).
//  2 · CHỌN CÂU — hộp tích chọn RIÊNG cây thư mục DẠY HỌC của kho (`locDeDayHoc`), tích tờ/bài rồi bỏ từng câu; KHÔNG lọc tự luận.
//  3 · CHIẾU — màn chiếu MỚI (`dungToChieuDayHoc` → `taoHtmlMayChieu`, lớp bản vẽ 28/09): đủ từng câu thầy chọn. "Chiếu lên bảng" ⇒ app chọn em
//      CÓ MẶT có khả năng làm đúng cao nhất cho từng câu (`chon-em-day-hoc.ts`); "Đổi em khác"; "Đúng" / "Sai" ghi bằng `ghiLenBang` (đường ghi sẵn có).
//  4 · BÀI HÔM NAY (OMNI 3, 05/10 — `BaiHomNay.tsx`): CHỈ khi công tắc OMNI bật — tick bài vừa dạy ⇒ tự giao luyện theo bài; OMNI tắt ⇒ bảng y như cũ.
// 12/10 — thầy: Hành trình còn 2 mục; mục "Dạy học & đầu giờ" là MỘT buổi dạy 4 bước (Điểm danh · Gọi lên bảng đầu giờ · Dạy và chiếu câu · Tick
// bài vừa dạy). Mục ấy truyền `dd` (điểm danh dùng chung, tạo MỘT lần ở cha) ⇒ bảng này KHÔNG tự tìm/mở buổi, KHÔNG vẽ bước Điểm danh; "Chọn câu" +
// "Chiếu" gộp thành bước "Dạy và chiếu câu", bước "Bài hôm nay" nằm trong bước "Tick bài vừa dạy" (gập sẵn, nút chính "Tick bài hôm nay" /
// "Bổ sung bài" mở và cuộn tới) kèm `sauBaiHomNay` (bảng Bài đang giao của cha). Mọi chức năng giữ nguyên; vắng `dd` ⇒ y như cũ (màn Lên bảng).
// ĐỢT 16 (12/10, thầy: "chọn xong bấm lại nút chọn thì sẽ trở lại ban đầu, tick chọn bài cũng vậy"): (1) hộp chọn giữ chữ tìm / chip khối và tự mở
// tới bài đang chọn (`nho` của HopChonDe); (2) phần nhớ theo buổi KHÔNG đè lựa chọn thầy vừa làm khi buổi mới có (bấm Điểm danh / buổi về muộn) —
// lựa chọn theo sang buổi ấy; đổi sang buổi KHÁC thật thì nạp phần nhớ của buổi đó và BÁO; (3) "Dùng" lại đúng bộ cũ không xoá câu đã bỏ / em đã gọi;
// (4) lớp + bài đang chọn của bước Bài hôm nay nhớ cùng buổi (mở lại màn vẫn còn). Khoá nhớ `ddh.dayHoc.<buổi>` GIỮ NGUYÊN, chỉ thêm hai trường.
// 21/10 — thầy: "bỏ cái phần tick bài vừa dạy khỏi hành trình đi" (bản vẽ docs/ban-ve-hanh-trinh-2110): khi NHÚNG (bước 3 "Dạy học" của Hành trình)
// không còn khối Tick bài, không đọc cờ OMNI; `sauBaiHomNay` (Bài đang giao) nằm cuối bước 3. Hai trường nhớ lớp + bài của khoá `ddh.dayHoc.<buổi>`
// nay do hộp "Bổ sung bài hôm nay" (`HopBoSungBai.tsx`) và màn Lên bảng ghi ⇒ khi nhúng, ghi phần nhớ GIỮ NGUYÊN hai trường ấy (không ghi đè null).
import { useCallback, useEffect, useMemo, useRef, useState, type ReactNode } from 'react'
import { Check, Eye, EyeOff, Lightbulb, MonitorPlay, RefreshCw, Shuffle, UserCheck, X } from 'lucide-react'
import { useAppStore } from '../../store/appStore'
import type { TeacherExamSource } from '../../data/examContent'
import KhungXemPhieu from '../KhungXemPhieu'
import HopChonDe, { type NhoHopChonDe } from '../HopChonDe'
import { thayChuaQuaMayChu, useGhiToChieu } from '../chien-dich/ghi-to-chieu'
import { ngayVn } from '../chien-dich/ngay'
import { laySucHoc } from '../../lib/buoi-hoc-api'
import { cauTuDeChon, demCau, dungToChieuDayHoc, khoDayHoc, tomTatDe, type CauDayHoc, type EmLenCau } from '../../lib/day-hoc-len-bang'
import { chonEmChoCau, mucCauSo, TEN_MUC_CAU, xepEmChoDanhSach, type KetQuaChon, type SucHocEm } from '../../lib/chon-em-day-hoc'
import { khoaToChieu } from '../../lib/to-chieu-cau-noi'
import { ChemText } from '../../lib/chem-format'
import TheCauHienThi from './TheCauHienThi'
import { BuocDiemDanh, useDiemDanhBuoi, type DiemDanhBuoi } from './DiemDanhBuoi'
import { BuocBaiHomNay, DongChoBaiMoi, useBaiHomNay, type BaiChonNho, type BaiHomNay } from './BaiHomNay'
import './day-hoc.css'

/** Chữ tấm chiếu mã điểm danh — nay nằm ở `DiemDanhBuoi.tsx` (dùng chung với Kiểm tra đầu giờ); giữ lối xuất cũ. */
export { CHU_DIEM_DANH } from './DiemDanhBuoi'
/** Bước Bài hôm nay — hộp "Bổ sung bài hôm nay" nhập qua đây để cùng mảnh với bảng (không tách mảnh riêng, 21/10). */
export { BuocBaiHomNay, useBaiHomNay, type BaiChonNho } from './BaiHomNay'

/** Nhớ trên máy theo buổi: đề đã tích, câu đã bỏ, em đã giao + (đợt 16) lớp thầy tự chọn và bài đang chọn ở bước Bài hôm nay. Hỏng/không có ⇒ bắt đầu trống. */
interface NhoBuoi {
  maChon: string[]
  boCau: string[]
  giao: Record<string, { sbd: string; hoTen: string; xacSuat: number; uocLuong: boolean; lyDo: string; boQua: string[]; daDung?:boolean }>
  lopNhan: string[] | null
  baiChon: BaiChonNho | null
}
const NHO_TRONG: NhoBuoi = { maChon: [], boCau: [], giao: {}, lopNhan: null, baiChon: null }
const khoaNho = (id: string) => `ddh.dayHoc.${id}`
const dsChuoi = (x: unknown): string[] => (Array.isArray(x) ? [...new Set(x.filter((v): v is string => typeof v === 'string'))] : [])
function docNhoBuoi(id: string): NhoBuoi {
  try {
    const j = JSON.parse(localStorage.getItem(khoaNho(id)) || 'null') as Partial<NhoBuoi> | null
    const b = j?.baiChon
    return {
      maChon: dsChuoi(j?.maChon),
      boCau: dsChuoi(j?.boCau),
      giao: j?.giao && typeof j.giao === 'object' ? j.giao : {},
      lopNhan: Array.isArray(j?.lopNhan) ? dsChuoi(j!.lopNhan) : null,
      baiChon: b && typeof b.khoaBai === 'string' && typeof b.khoi === 'string' ? { khoaBai: b.khoaBai, khoi: b.khoi, tenBai: typeof b.tenBai === 'string' ? b.tenBai : '' } : null,
    }
  } catch {
    return NHO_TRONG
  }
}
/** Phần nhớ có lựa chọn nào của thầy không (để biết đổi buổi có làm đổi điều thầy đang thấy). */
const coLuaChon = (n: NhoBuoi) => n.maChon.length > 0 || !!n.baiChon || !!n.lopNhan?.length
function ghiNhoBuoi(id: string, n: NhoBuoi) {
  try {
    localStorage.setItem(khoaNho(id), JSON.stringify(n))
  } catch {
    /* máy chặn bộ nhớ: chỉ mất phần nhớ khi tải lại */
  }
}

const TEN_PHAN: Record<CauDayHoc['phan'], string> = { I: 'Trắc nghiệm', II: 'Đúng–sai', III: 'Trả lời ngắn' }
const pt = (x: number) => `${Math.round(x * 100)}%`

/** Lớp đang chọn ở bước Bài hôm nay đã có bài tick HÔM NAY (giờ Việt Nam) ⇒ nút chính đổi thành "Bổ sung bài"; bước Tick bài tính là xong. */
export function daTickHomNay(bhn: Pick<BaiHomNay, 'lopChon' | 'dsTheoLop' | 'homNay'>): boolean {
  return bhn.lopChon.some((l) => (bhn.dsTheoLop[l]?.bai ?? []).some((b) => Number.isFinite(Date.parse(b.tickLuc)) && ngayVn(Date.parse(b.tickLuc)) === bhn.homNay))
}

export interface TuyChonDayHoc {
  /** Điểm danh dùng chung do cha tạo (mục Hành trình "Dạy học & đầu giờ"): có ⇒ KHÔNG tạo buổi riêng, KHÔNG vẽ bước Điểm danh. */
  dd?: DiemDanhBuoi
  /** Số của bước "Dạy học" trong Hành trình. Chỉ khi có `dd`; mặc định 3. */
  soBuocDau?: number
  /** Khối thêm ở cuối bước "Dạy học" (bảng Bài đang giao). Chỉ khi có `dd`. */
  sauBaiHomNay?: ReactNode
  /** Báo cha hai bước đã xong chưa (thanh bước): `day` = đã mở tờ chiếu / đã ghi kết quả em lên bảng; `tick` = lớp đã có bài tick hôm nay. */
  onTrangThai?: (t: { day: boolean; tick: boolean }) => void
}

/** Vắng `dd` ⇒ tự tạo điểm danh như cũ (màn Lên bảng); có `dd` ⇒ hai bước gọn của buổi dạy. */
export default function DayHocLenBang({ dd, ...p }: TuyChonDayHoc = {}) {
  return dd ? <DayHocThan dd={dd} nhung {...p} /> : <DayHocTuTao />
}
function DayHocTuTao() {
  const dd = useDiemDanhBuoi()
  return <DayHocThan dd={dd} nhung={false} />
}

function DayHocThan({ dd, nhung, soBuocDau = 3, sauBaiHomNay, onTrangThai }: Omit<TuyChonDayHoc, 'dd'> & { dd: DiemDanhBuoi; nhung: boolean }) {
  const showToast = useAppStore((s) => s.showToast)

  // ───── 1 · ĐIỂM DANH (dùng chung với Kiểm tra đầu giờ — `DiemDanhBuoi.tsx`) ─────
  const { tt, idBuoi, coMat, lopCuaEm } = dd

  // ───── 2 · CHỌN CÂU ─────
  const [kho, setKho] = useState<TeacherExamSource[] | null>(null)
  const [hopMo, setHopMo] = useState(false)
  const [maTam, setMaTam] = useState<Set<string>>(new Set())
  const [maChon, setMaChon] = useState<Set<string>>(new Set())
  const [boCau, setBoCau] = useState<Set<string>>(new Set())
  const [giao, setGiao] = useState<NhoBuoi['giao']>({})
  // Hộp chọn bài dựng lại mỗi lần mở ⇒ giữ chữ tìm + chip khối ở đây (đợt 16).
  const nhoHop = useRef<NhoHopChonDe | null>(null)

  const [loiKho, setLoiKho] = useState('')
  const dangNapKho = useRef<Promise<TeacherExamSource[]> | null>(null)
  const napKho = useCallback((): Promise<TeacherExamSource[]> => {
    if (kho) return Promise.resolve(kho)
    if (dangNapKho.current) return dangNapKho.current
    setLoiKho('')
    const doc = async () => {
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
        // Lỗi kho khác kho rỗng: giữ null để lần Thử lại còn thực sự đọc kho.
        setLoiKho('Chưa đọc được kho đề trên máy này. Thầy thử tải lại.')
        return []
      } finally {
        dangNapKho.current = null
      }
    }
    const cho = doc()
    dangNapKho.current = cho
    return cho
  }, [kho])
  useEffect(() => {
    if (maChon.size && !kho) void napKho()
  }, [maChon, kho, napKho])
  // ───── 4 · BÀI HÔM NAY (OMNI 3) — dùng chung kho Dạy học đã nạp; ẩn hẳn khi OMNI tắt. Nhúng ở Hành trình ⇒ không có bước này, không đọc cờ. ─────
  const bhn = useBaiHomNay(dd, kho, napKho, { docCo: !nhung })

  // ───── NHỚ THEO BUỔI: nạp một lần mỗi buổi, ghi lại mỗi lần đổi ─────
  const daNap = useRef('')
  /** Bản nhớ (chuỗi) vừa nạp / vừa ghi theo buổi mới — khác bản đang thấy ⇒ thầy đã chọn tay từ lúc ấy. */
  const banDaNap = useRef('')
  const lopNhan = bhn.lopTay
  const baiChon = bhn.chonNho
  /** Nhúng ⇒ hai trường lớp + bài là của hộp Bổ sung bài: giữ bản đang lưu, không ghi đè. */
  const ghiNho = (k: string, n: NhoBuoi) => {
    if (!nhung) return ghiNhoBuoi(k, n)
    const cu = docNhoBuoi(k)
    ghiNhoBuoi(k, { ...n, lopNhan: cu.lopNhan, baiChon: cu.baiChon })
  }
  useEffect(() => {
    const k = idBuoi || '_'
    const cu = daNap.current
    if (cu === k) return
    daNap.current = k
    const hien: NhoBuoi = { maChon: [...maChon], boCau: [...boCau], giao, lopNhan, baiChon }
    const chuHien = JSON.stringify(hien)
    // Buổi vừa có (bấm Điểm danh / buổi đang mở về muộn) sau khi thầy đã chọn ⇒ lựa chọn vừa làm THEO SANG buổi này, không bị phần nhớ đè.
    if (cu && (cu === '_' || k === '_') && chuHien !== banDaNap.current) {
      ghiNho(k, hien)
      banDaNap.current = chuHien
      return
    }
    const n = docNhoBuoi(k)
    // Đổi sang buổi KHÁC thật (ô "Buổi dạy" / mở buổi mới) ⇒ hiện phần nhớ của buổi ấy và nói rõ (phần của buổi trước vẫn lưu theo buổi trước).
    if (cu && cu !== '_' && k !== '_' && JSON.stringify(n) !== chuHien && (coLuaChon(hien) || coLuaChon(n)))
      showToast(`Đã đổi buổi dạy — ${coLuaChon(n) ? 'đang hiện bài đã chọn của buổi này' : 'buổi này chưa chọn bài'}; bài của buổi trước vẫn được giữ.`, 'warn')
    setMaChon(new Set(n.maChon))
    setBoCau(new Set(n.boCau))
    setGiao(n.giao)
    bhn.datNho(n.lopNhan, n.baiChon)
    banDaNap.current = JSON.stringify(n)
    // Chỉ chạy khi đổi buổi; đọc lựa chọn đang thấy ở đúng lượt vẽ ấy.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [idBuoi])
  useEffect(() => {
    if (daNap.current) ghiNho(daNap.current, { maChon: [...maChon], boCau: [...boCau], giao, lopNhan, baiChon })
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [maChon, boCau, giao, lopNhan, baiChon])

  const tatCaCau = useMemo(() => (kho ? cauTuDeChon(kho, maChon) : []), [kho, maChon])
  const cauChieu = useMemo(() => tatCaCau.filter((c) => !boCau.has(c.khoa)), [tatCaCau, boCau])
  const demTam = useMemo(() => demCau(kho ? cauTuDeChon(kho, maTam) : []), [kho, maTam])
  const dem = demCau(cauChieu)

  // ───── 3 · CHIẾU ─────
  const [html, setHtml] = useState('')
  const [dangChieu, setDangChieu] = useState(false)
  // Đã mở tờ chiếu ít nhất một lần trong lần vào màn này (thanh bước: bước "Dạy và chiếu câu" xong).
  const [daChieu, setDaChieu] = useState(false)
  const [sucHoc, setSucHoc] = useState<Record<string, SucHocEm>>({})
  // Nút "Thầy chữa" trên tờ (thầy 05/10): nhãn "Thầy đã chữa" + mốc dạy lại, nguồn day_hoc theo buổi.
  const thayChuaO = useCallback((o: { sbd: string; qid: string }) => thayChuaQuaMayChu(o, 'day_hoc', idBuoi || 'day-hoc'), [idBuoi])
  // Nút X, hai thẻ (thầy 21/10): em của lớp buổi này + em đã điểm danh (chưa tải danh sách lớp ⇒ một thẻ cả lớp như cũ).
  const lopAiSai = useCallback(() => (tt?.lopEm?.length ? { sbdLop: tt.lopEm.map((e) => e.sbd), coMat: coMat.length ? new Set(coMat.map((e) => e.sbd)) : null } : null), [tt?.lopEm, coMat])
  const { ketQua, moPhien, ganO, dongPhien, ghi } = useGhiToChieu(idBuoi ? `day-hoc|${idBuoi}` : '', undefined, thayChuaO, undefined, lopAiSai)

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
      const boQua=new Map(cauChieu.map(c=>[c.qid,new Set(giaoMoi[c.khoa]?.boQua??[])]))
      const { html: h, o, emGoi } = await dungToChieuDayHoc(cauChieu, m, `Dạy học · ${tt?.buoi.ten || 'Buổi học'}`, coEm ? ma : undefined, false,coMat.map(e=>e.sbd),boQua)
      if(coEm){const moi:NhoBuoi['giao']={};for(const [k,e] of emGoi)moi[k]={sbd:e.sbd,hoTen:e.ten,xacSuat:e.p??0.3,uocLuong:e.loai==='du_bao',daDung:e.loai==='da_dung',lyDo:e.loai==='da_dung'?'Đã tự làm đúng câu này':'Dự kiến làm được câu này',boQua:giaoMoi[k]?.boQua??[]};setGiao(moi)}
      ganO(ma, o)
      setHtml(h)
      setDaChieu(true)
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

  // ───── THANH BƯỚC của buổi dạy (chỉ khi nhúng): báo cha hai bước đã xong chưa ─────
  const tickHomNay = daTickHomNay(bhn)
  const dayXong = daChieu || Object.keys(ketQua).length > 0
  useEffect(() => {
    if (nhung) onTrangThai?.({ day: dayXong, tick: tickHomNay })
  }, [nhung, dayXong, tickHomNay, onTrangThai])
  const moHopChon = () => {
    setMaTam(new Set(maChon))
    setHopMo(true)
    void napKho()
  }

  // ───── các khối dùng chung cho hai cách vẽ (bảng đầy đủ · bước gọn trong buổi dạy) ─────
  const danhSachCau =
    maChon.size === 0 ? (
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
            <button type="button" className="m3-nut-tonal dh-nut-nho" onClick={() => setXemLoiGiai(new Set(cauChieu.map((c) => c.khoa)))}>
              <Eye size={15} /> Hiện lời giải tất cả
            </button>
            {xemLoiGiai.size > 0 && (
              <button type="button" className="m3-nut-chu dh-nut-nho" onClick={() => setXemLoiGiai(new Set())}>
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
                  {c.tuLuan &&
                    (() => {
                      const h = (c.q as any).imageDataUrl || (c.q as any).hinhAnh?.[0]?.src || (c.q as any).hinh?.[0]?.du_lieu || (c.q as any).hinh?.[0]?.src
                      return h ? (
                        <div style={{ marginTop: 6 }}>
                          <img src={h} alt="Hình câu hỏi" width={640} height={360} loading="lazy" decoding="async" style={{ maxWidth: '100%', height: 'auto', maxHeight: 240, objectFit: 'contain', borderRadius: 8, border: '1px solid var(--vien)' }} />
                        </div>
                      ) : null
                    })()}
                  {xemLoiGiai.has(c.khoa) && <TheCauHienThi c={c} stt={stt ?? undefined} />}
                  {g && !bo && (
                    <div className="dh-giao">
                      <span className="dh-giao-em">
                        <UserCheck size={16} aria-hidden="true" /> <b>{g.hoTen || g.sbd}</b>
                        <span className="dh-giao-p" title={g.lyDo}>
                          {g.daDung?'Đã tự làm đúng câu này':`khả năng đúng ≈ ${pt(g.xacSuat)}`}
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
    )

  const moTaChieu = !cauChieu.length
    ? 'Chọn câu ở bước 2 trước.'
    : !coMat.length
      ? `${cauChieu.length} câu sẵn sàng — cần danh sách có mặt (bước 1) để app gọi em.`
      : `${cauChieu.length} câu · ${coMat.length} em có mặt. App chọn em có mức ≥ mức độ câu, khả năng đúng cao nhất; mỗi em tối đa 2 lần.`

  const hangChieu = (
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
  )

  const hopChon = hopMo && (
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
            nho={nhoHop}
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
              // "Dùng" lại đúng bộ cũ ⇒ giữ nguyên câu đã bỏ và em đã gọi. Đổi bộ ⇒ câu đã bỏ mà vẫn còn trong bộ mới thì vẫn bỏ; phân công em xếp lại.
              const giong = maTam.size === maChon.size && [...maTam].every((ma) => maChon.has(ma))
              if (!giong) {
                const con = new Set(kho ? cauTuDeChon(kho, maTam).map((c) => c.khoa) : [])
                setMaChon(new Set(maTam))
                setBoCau((cu) => new Set([...cu].filter((k) => con.has(k))))
                setGiao({})
              }
              setHopMo(false)
            }}
          >
            Dùng {demTam.tong} câu
          </button>
        </div>
      </div>
    </div>
  )

  const khungChieu = html && (
    <KhungXemPhieu
      html={html}
      ten="Tờ máy chiếu — Dạy học"
      dong={() => {
        dongPhien()
        setHtml('')
      }}
    />
  )

  if (nhung) {
    const so3 = soBuocDau
    return (
      <>
        {/* ───── BƯỚC 3 · DẠY HỌC (Chọn câu + Chiếu của bảng đầy đủ) + Bài đang giao ───── */}
        <section className="dh-buoc gvv2-bd-buoc" data-buoc={so3} data-khoi="buoc-day-chieu" aria-labelledby={`bd-b${so3}`}>
          <div className="dh-buoc-dau">
            <span className="dh-so" aria-hidden="true">
              {so3}
            </span>
            <div className="dh-buoc-ten">
              <h2 id={`bd-b${so3}`}>Dạy học</h2>
              <p>
                {maChon.size && kho && cauChieu.length
                  ? moTaChieu
                  :'Chọn câu trong kho Dạy học của bài, chiếu cả lớp làm, app gọi em có mặt lên bảng. Câu tự luận cũng chiếu đủ.'}
              </p>
            </div>
            <div className="gvv2-bd-nut">
              <button type="button" className="m3-nut-vien dh-nut" onClick={moHopChon}>
                {maChon.size ? 'Đổi bài' : 'Chọn câu để chiếu'}
              </button>
            </div>
          </div>
          {maChon.size > 0 && danhSachCau}
          {maChon.size > 0 && kho && cauChieu.length > 0 && hangChieu}
          {sauBaiHomNay}
        </section>
        {hopChon}
        {khungChieu}
      </>
    )
  }

  return (
    <div className="dh-trang" data-khoi="day-hoc-len-bang">
      <header className="dh-dau">
        <h1>Dạy học</h1>
        <p>Điểm danh lấy danh sách em học hôm nay → chọn câu trong kho Dạy học → chiếu lên máy chiếu. App gọi em có mặt có khả năng làm đúng câu cao nhất.</p>
        <DongChoBaiMoi bhn={bhn} />
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
          <button type="button" className="m3-nut-vien dh-nut" onClick={moHopChon}>
            {maChon.size ? 'Đổi bài' : 'Chọn bài trong kho Dạy học'}
          </button>
        </div>
        {danhSachCau}
      </section>

      {/* ───── BƯỚC 3 ───── */}
      <section className="dh-buoc dh-buoc--chieu" aria-labelledby="dh-b3">
        <div className="dh-buoc-dau">
          <span className="dh-so" aria-hidden="true">
            3
          </span>
          <div className="dh-buoc-ten">
            <h2 id="dh-b3">Chiếu lên bảng</h2>
            <p>{moTaChieu}</p>
          </div>
        </div>
        {hangChieu}
      </section>

      {/* ───── BƯỚC 4 (OMNI 3) ───── */}
      <BuocBaiHomNay bhn={bhn} kho={kho} loiKho={loiKho} thuKho={() => void napKho()} />

      {hopChon}

      {khungChieu}
    </div>
  )
}
