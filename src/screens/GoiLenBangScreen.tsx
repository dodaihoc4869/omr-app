// GỌI HỌC SINH LÊN BẢNG — MỘT MÀN, MỘT LUỒNG (thầy chốt 05/09 chiều).
//
// Nguồn duy nhất là CA thầy vừa cho lớp làm. Từ một ca ấy ra cả hai việc:
// phiếu gửi phụ huynh (màn Theo dõi lo) và bảng phân công lên bảng (màn này).
// Không có ca thứ hai, không có luồng thứ hai.
//
// Khác bản cũ ở chỗ quan trọng nhất: bản cũ chỉ biết "em này yếu chuyên đề gì",
// nên hai em cùng yếu Ester nhận hai câu Ester bất kỳ. Bản này biết EM NÀO SAI
// CÂU NÀO và CẢ LỚP CÓ SAI GIỐNG NHAU KHÔNG, nên:
//   · câu quá nửa lớp cùng chọn một phương án sai → GIẢNG CẢ LỚP, không gọi ai;
//   · câu gần cả lớp làm đúng → chỉ đọc đáp án;
//   · phần còn lại mới chia cho em, ưu tiên em SAI CHÍNH CÂU ĐÓ.
// Thuật toán ở lib/phan-cong.ts, phần đọc dữ liệu ca ở lib/du-lieu-len-bang.ts.
import { useEffect, useMemo, useState } from 'react'
import { ArrowLeft, ClipboardCopy, Check, RefreshCw, Search, Wand2, Megaphone, BookOpenCheck, ThumbsUp, ThumbsDown, X, Printer, Shuffle } from 'lucide-react'
import { Hang, Nhan, OThongBao, NutChinh, TheNoiDung } from '../components/DesignSystem'
import { chiTietCa, chuoi, danhSachCa, ghiLenBang, hoSoEm, type CaTomTat } from '../lib/exam-api'
import { docKhoChuaCa, loadExamSources, loadScriptUrl, loadSessionTeacherBank, loadTeacherSecret } from '../lib/exam-db'
import { mergeKeepAnswers } from '../data/examContent'
import { khuTrungNguon } from '../lib/khu-trung-cau'
import type { TeacherExamSource, TeacherMcqQuestion, TeacherShortAnswerQuestion, TeacherTrueFalseQuestion } from '../data/examContent'
import { tachNhieuTheoPhan } from '../lib/tach-phan-de'
import HopChonDe from '../components/HopChonDe'
import { baiLamTuCa, cauTuBanDe, daCoBaiLam, emTuCa, luotMoiNhat, rowsLopSai, type BanDeCa, type HoSoRutGon, type LuotCa } from '../lib/du-lieu-len-bang'
import { rutDeChua } from '../lib/rut-de-chua'
import { LOC_SAO_MAC_DINH, MOI_LOC_SAO, TEN_LOC_SAO, type LocSao } from '../lib/loc-sao'
import { LOC_DANG_MAC_DINH, MOI_LOC_DANG, TEN_LOC_DANG, type LocDang } from '../lib/dang-cau'
import { SO_CAU_MAC_DINH } from '../lib/cau-hinh-chua'
import ThanhSoCauChua from '../components/ThanhSoCauChua'
import { bangChu, chuCau, chuChum, MAC_DINH, phanCong, TEN_MUC_NHAM, type CauChua, type DongPhanCong, type KetQuaPhanCong } from '../lib/phan-cong'
import { baiLamCoGiayTuCa } from '../lib/du-lieu-len-bang'
import { CAU_HINH_LEN_BANG_MAC_DINH, TEN_LANE, dongHo, nganSachGiay } from '../lib/len-bang-cau-hinh'
import { dungDoKho, vapCuaLop } from '../lib/do-kho-cau'
import { doiEmChoDong, xepGioLenBang, type KetQuaXep } from '../lib/xep-gio-len-bang'
import { dungGiaoAn } from '../lib/giao-an-len-bang'
import { KHO_DO_KHO_RONG, gopCaVaoKho, thongKeKho, type KhoDoKhoLuu } from '../lib/kho-do-kho'
import { docKhoDoKho, luuKhoDoKho } from '../lib/exam-db'
import TheCau from '../components/TheCau'
import { useAppStore } from '../store/appStore'

const SO: React.CSSProperties = { fontFamily: 'var(--sans)', fontVariantNumeric: 'tabular-nums' }
const NHAN_NHO: React.CSSProperties = { fontFamily: 'var(--sans)', fontSize: 'var(--cx-1)', color: 'var(--nhat)' }
const TIEU_DE_MUC: React.CSSProperties = { fontFamily: 'var(--serif)', fontSize: 'var(--cx-3)', fontWeight: 700, color: 'var(--muc)' }
const O_NHAP: React.CSSProperties = {
  height: 48,
  borderRadius: 'var(--bo-1)',
  padding: '0 var(--k4) 0 44px',
  background: 'var(--the-2)',
  border: '1.5px solid transparent',
  fontFamily: 'var(--sans)',
  fontSize: 'var(--cx-2)',
  color: 'var(--muc)',
  outline: 'none',
  width: '100%',
}

/** Câu ĐẦY ĐỦ tra ra từ bản đề của ca. Kiểu hợp phân biệt theo `phan` để chỗ vẽ
 * thẻ câu biết chắc `q` là loại nào, không phải ép kiểu khắp nơi. */
type CauDayDu =
  | { phan: 'I'; q: TeacherMcqQuestion }
  | { phan: 'II'; q: TeacherTrueFalseQuestion }
  | { phan: 'III'; q: TeacherShortAnswerQuestion }

interface DuLieuCa {
  maCa: string
  ten: string
  bank: BanDeCa
  /** KHO CHỮA của ca — bộ câu rộng hơn đề em làm, do màn Mở ca lưu lại khi thầy
   * chọn "Phân công lên bảng". Không có thì rỗng, màn vẫn chạy trên bộ em làm. */
  khoChua: BanDeCa | null
  luot: LuotCa[]
  hoSo: Record<string, HoSoRutGon>
}

/** Chạy song song có giới hạn — 251 em mà gọi hết một lúc là máy chủ nghẹn. */
async function songSong<T, R>(ds: T[], soLuong: number, viec: (x: T) => Promise<R>, xong?: (da: number) => void): Promise<R[]> {
  const ra: R[] = new Array(ds.length)
  let i = 0
  let da = 0
  const chay = async () => {
    while (i < ds.length) {
      const k = i++
      ra[k] = await viec(ds[k])
      xong?.(++da)
    }
  }
  await Promise.all(Array.from({ length: Math.min(soLuong, ds.length) }, chay))
  return ra
}

export default function GoiLenBangScreen() {
  const setScreen = useAppStore((s) => s.setScreen)
  const showToast = useAppStore((s) => s.showToast)

  const [cauHinh, setCauHinh] = useState<{ url: string; mat: string } | null>(null)
  const [loi, setLoi] = useState('')

  const [dsCa, setDsCa] = useState<CaTomTat[] | null>(null)
  const [timCa, setTimCa] = useState('')
  const [hienCaTat, setHienCaTat] = useState(false)
  const [dangTaiCa, setDangTaiCa] = useState('')
  const [tienDo, setTienDo] = useState('')
  const [du, setDu] = useState<DuLieuCa | null>(null)

  // Em vắng hôm nay: có bài trong ca nhưng không đứng lớp được. Bỏ tích ở đây
  // là em không nhận câu nào, chứ dữ liệu bài làm của em vẫn tính vào tỉ lệ
  // đúng/sai của câu — cả lớp sai giống nhau hay không là chuyện của cả lớp.
  const [vang, setVang] = useState<Set<string>>(new Set())

  // THÊM CÂU NGOÀI CA (thầy chốt 05/09): buổi chữa hiếm khi bó trong đúng bộ
  // câu vừa thi — thầy tích thêm bài nào cũng được, tích tới từng dạng. Câu
  // thêm KHÔNG có bài làm nên không bao giờ bị xếp "giảng cả lớp"/"đọc đáp án";
  // nó vào thẳng danh sách chữa và xếp theo sao.
  const [deDaLuu, setDeDaLuu] = useState<TeacherExamSource[]>([])
  const [maDeChon, setMaDeChon] = useState<Set<string>>(new Set())
  // HAI CÁCH LẤY CÂU ĐỂ CHỮA (thầy chốt 05/09 tối):
  //   'san'   — dùng bộ câu máy đã rút sẵn khi mở ca ở chế độ Kiểm tra điểm yếu;
  //   'tu_chon' — thầy tự tích bài muốn chữa, máy dựa vào điểm yếu cộng dồn ở
  //               ĐÚNG chuyên đề của câu đó để chọn em nào lên bảng.
  // Mặc định TỰ CHỌN: chưa mở ca thì chưa biết ca có bộ rút sẵn hay không, mà
  // hộp tích đề phải hiện sẵn để thầy làm việc được ngay.
  const [cachLayCau, setCachLayCau] = useState<'san' | 'tu_chon' | 'theo_dang'>('tu_chon')
  /** RÚT THEO MÃ DẠNG (v4 mục 2). Nguồn là CẢ KHO, không phải đề thầy tích. */
  const [khoDe, setKhoDe] = useState<TeacherExamSource[]>([])
  const [soCauChua, setSoCauChua] = useState(SO_CAU_MAC_DINH)
  // MỨC SAO — thầy chốt 07/09. Áp cho cả phần đếm lẫn phần rút, nếu không thì
  // thanh kéo hiện một trần còn bảng rút ra một bộ khác.
  const [locSao, setLocSao] = useState<LocSao>(LOC_SAO_MAC_DINH)
  const [locDang, setLocDang] = useState<LocDang>(LOC_DANG_MAC_DINH)
  useEffect(() => {
    void loadExamSources().then((ds) => setKhoDe(khuTrungNguon(ds).nguon))
  }, [])
  const [timEm, setTimEm] = useState('')

  const [soLuot, setSoLuot] = useState(1)
  const [daGoiCau, setDaGoiCau] = useState<Record<string, string[]>>({})
  const [kq, setKq] = useState<KetQuaPhanCong | null>(null)

  // ---- GIÁO ÁN 80 PHÚT (GOI-LEN-BANG-80-PHUT.md) --------------------------
  const [kho, setKho] = useState<KhoDoKhoLuu>(KHO_DO_KHO_RONG)
  const [dangDungKho, setDangDungKho] = useState('')
  const [kqXep, setKqXep] = useState<KetQuaXep | null>(null)
  const [boBatBuoc, setBoBatBuoc] = useState<string[]>([])
  const [tranEm, setTranEm] = useState(CAU_HINH_LEN_BANG_MAC_DINH.SO_EM_LEN_BANG_TOI_DA)
  const [giayMoiEm, setGiayMoiEm] = useState(CAU_HINH_LEN_BANG_MAC_DINH.GIAY_LANE.L3)
  const [daCopyGiaoAn, setDaCopyGiaoAn] = useState(false)
  const [daCopy, setDaCopy] = useState(false)
  const [xemCau, setXemCau] = useState('')
  const [dangCham, setDangCham] = useState('')

  useEffect(() => {
    void (async () => {
      const [url, mat, kho] = await Promise.all([loadScriptUrl(), loadTeacherSecret(), loadExamSources()])
      // Mỗi mã đề tách làm ba dạng (trắc nghiệm · đúng sai · trả lời ngắn), y
      // hệt màn Mở ca — tích một dòng là lấy đúng dạng đó.
      setDeDaLuu(khuTrungNguon(tachNhieuTheoPhan(kho)).nguon)
      if (!url.trim() || !mat.trim()) {
        setLoi('Chưa cấu hình link Apps Script hoặc mã bí mật — vào Ngân hàng câu hỏi → Cấu hình')
        setDsCa([])
        return
      }
      setCauHinh({ url: url.trim(), mat: mat.trim() })
      try {
        const ds = await danhSachCa(url.trim(), mat.trim())
        setDsCa(ds.filter((c) => c.loai !== 'baitap'))
      } catch (e) {
        setLoi(e instanceof Error ? e.message : 'Không lấy được danh sách ca')
        setDsCa([])
      }
    })()
  }, [])

  /** Ca thầy TẮT nút gạt lúc mở: chỉ gửi phiếu phụ huynh, không ra màn này.
   * Vẫn với tới được bằng chip "Hiện cả ca đã tắt" — thầy đổi ý sau buổi thi
   * thì không phải mở lại ca. */
  const soCaTat = useMemo(() => (dsCa ?? []).filter((c) => !c.lenBang).length, [dsCa])
  const dsCaLoc = useMemo(() => {
    const q = timCa.trim().toLowerCase()
    return (dsCa ?? [])
      .filter((c) => hienCaTat || c.lenBang)
      .filter((c) => !q || c.maCa.includes(q) || (c.tenCa || '').toLowerCase().includes(q) || (c.lop || '').toLowerCase().includes(q))
  }, [dsCa, timCa, hienCaTat])

  /** MỞ MỘT CA: kéo về bản đề CÓ đáp án + đáp án từng em + hồ sơ tích luỹ.
   *
   * Bản đề lấy từ máy chủ khi ca có công bố điểm; ca "không công bố" thì máy chủ
   * không giữ đáp án, rơi về bản đã lưu trên máy thầy lúc mở ca. Không có cả hai
   * thì NÓI THẲNG chứ không phân công mò. */
  const moCa = async (ca: CaTomTat) => {
    if (!cauHinh) return showToast('Chưa cấu hình máy chủ', 'error')
    setDangTaiCa(ca.maCa)
    setLoi('')
    setKq(null)
    setSoLuot(1)
    setDaGoiCau({})
    setVang(new Set())
    try {
      const ct = await chiTietCa(cauHinh.url, cauHinh.mat, ca.maCa, true)
      let bank: BanDeCa | null = ct.keyBank ? { phanI: ct.keyBank.phanI, phanII: ct.keyBank.phanII, phanIII: ct.keyBank.phanIII } : null
      if (!bank) {
        const cuc: TeacherExamSource[] | undefined = await loadSessionTeacherBank(ca.maCa)
        if (cuc && cuc.length) bank = mergeKeepAnswers(cuc)
      }
      if (!bank) throw new Error(`Ca ${ca.tenCa || ca.maCa} không có bản đề kèm đáp án trên máy chủ lẫn trên máy này — mở ca ở máy khác thì đồng bộ đề trước`)

      const luot: LuotCa[] = ct.luot.map((l) => ({ sbd: chuoi(l.sbd), hoTen: chuoi(l.hoTen), lanThu: l.lanThu, trangThai: l.trangThai, dapAn: l.dapAn, giayCau: l.giayCau }))
      const coBai = luotMoiNhat(luot).filter(daCoBaiLam)
      if (coBai.length === 0) throw new Error(`Ca ${ca.tenCa || ca.maCa} chưa em nào nộp bài`)

      setTienDo(`0/${coBai.length}`)
      const hs = await songSong(
        coBai.map((l) => l.sbd),
        4,
        async (sbd) => {
          try {
            const h = await hoSoEm(cauHinh.url, { secret: cauHinh.mat, sbd })
            return { sbd, hoTen: h.em.hoTen, chuyenDe: h.chuyenDe.map((c) => ({ ten: c.ten, soCau: c.soCau, soSai: c.soSai })) } as HoSoRutGon
          } catch {
            // Hồ sơ hỏng thì để RỖNG: em vẫn được gọi, chỉ là máy không biết em
            // yếu chuyên đề nào. Bịa hồ sơ là gọi sai chỗ.
            return null
          }
        },
        (n) => setTienDo(`${n}/${coBai.length}`),
      )
      const hoSo: Record<string, HoSoRutGon> = {}
      for (const h of hs) if (h) hoSo[h.sbd] = h

      // Kho chữa lưu sẵn lúc mở ca (chế độ "Phân công lên bảng") — tự nạp, thầy
      // không phải tick lại đề ở khối bên dưới.
      const kc = await docKhoChuaCa(ca.maCa).catch(() => undefined)
      const khoChua = kc && kc.length ? mergeKeepAnswers(kc) : null
      setDu({ maCa: ca.maCa, ten: ca.tenCa || `mã ${ca.maCa}`, bank, khoChua, luot, hoSo })
      // Ca thường (mở bằng Rút bộ câu / Lấy trọn kho) không có bộ rút sẵn — đưa
      // thẳng thầy sang nhánh tự chọn, khỏi phải bấm thêm một chạm.
      setCachLayCau(khoChua ? 'san' : 'tu_chon')
      showToast(`Ca ${ca.tenCa || ca.maCa}: ${coBai.length} em có bài`, 'success')
    } catch (e) {
      setDu(null)
      setLoi(e instanceof Error ? e.message : 'Không mở được ca')
    } finally {
      setDangTaiCa('')
      setTienDo('')
    }
  }

  /** Bảng chấm gộp cả lớp: mỗi câu một dòng, câu nhiều em sai xếp trước. */
  const rowsLop = useMemo(() => (du ? rowsLopSai(du.bank, du.maCa, du.luot) : []), [du])

  /** Cổng chạy hai lần: một lần đếm (soCau 0) để biết max cho thanh kéo, một lần
   * rút thật theo số thầy kéo. Đếm rẻ và thuần máy nên không tiếc. */
  const demChua = useMemo(
    () => (khoDe.length > 0 && rowsLop.length > 0 ? rutDeChua({ khoDe, rows: rowsLop, soCau: 0, locSao, locDang }) : null),
    [khoDe, rowsLop, locSao, locDang],
  )
  const kqChua = useMemo(
    () => (cachLayCau === 'theo_dang' && demChua ? rutDeChua({ khoDe, rows: rowsLop, soCau: soCauChua, locSao, locDang }) : null),
    [cachLayCau, demChua, khoDe, rowsLop, soCauChua, locSao, locDang],
  )
  /** Câu cổng chọn, dựng lại thành BanDeCa để phần dưới của màn chạy nguyên. */
  const bankTheoDang: BanDeCa = useMemo((): BanDeCa => {
    if (!kqChua || kqChua.cau.length === 0) return { phanI: [], phanII: [], phanIII: [] }
    const id = new Set(kqChua.cau.map((c) => c.id))
    return mergeKeepAnswers(
      khoDe.map((s) => ({
        ...s,
        phanI: s.phanI.filter((q) => id.has(q.id)),
        phanII: s.phanII.filter((q) => id.has(q.id)),
        phanIII: s.phanIII.filter((q) => id.has(q.id)),
      })),
    )
  }, [kqChua, khoDe])

  /** Bản đề của các mã thầy tích thêm, gộp lại thành một kho. */
  const bankTichTay: BanDeCa = useMemo(() => mergeKeepAnswers(deDaLuu.filter((d) => maDeChon.has(d.maDe))), [deDaLuu, maDeChon])

  /** Câu chữa THÊM = kho chữa tự nạp của ca + đề thầy tích tay. Cả hai đều là
   * câu không em nào làm, nên không bao giờ bị xếp "giảng cả lớp". */
  const bankThem: BanDeCa = useMemo(() => {
    // Thầy tự chọn thì BỎ HẲN kho tự nạp: gộp cả hai là bảng chữa lại đầy câu
    // máy chọn, đúng chỗ thầy vừa kêu.
    if (cachLayCau === 'theo_dang') return bankTheoDang
    const san = cachLayCau === 'san' ? du?.khoChua : null
    return {
      phanI: [...(san?.phanI ?? []), ...bankTichTay.phanI],
      phanII: [...(san?.phanII ?? []), ...bankTichTay.phanII],
      phanIII: [...(san?.phanIII ?? []), ...bankTichTay.phanIII],
    }
  }, [du, bankTichTay, cachLayCau, bankTheoDang])

  /** DANH SÁCH CÂU ĐÁNG CHỮA = câu của ca + câu thầy tích thêm.
   *
   * Số câu của phần thêm đánh tiếp sau câu của ca, không đánh lại từ 1: hai
   * dòng cùng ghi "Phần I câu 3" là thầy đọc nhầm câu ngay trên lớp. */
  const dsCau: CauChua[] = useMemo(() => {
    // THẦY TỰ CHỌN BÀI ⇒ CHỈ chữa đúng những câu đó.
    //
    // Thầy báo 05/09 tối: tích đề chương 2 mà máy vẫn phân câu chương 1. Đúng
    // vậy — câu của ca đã thi có bài làm nên điểm cao hơn, chen hết chỗ. Thầy
    // chọn bài nào thì bảng chữa chỉ được có bài đó, không câu nào chuyên đề
    // khác. Bài làm của ca vẫn dùng, nhưng chỉ để biết em nào yếu chỗ nào.
    if (cachLayCau === 'tu_chon' || cachLayCau === 'theo_dang') return cauTuBanDe(bankThem)

    const cuaCa = du ? cauTuBanDe(du.bank) : []
    const dich = { I: du?.bank.phanI.length ?? 0, II: du?.bank.phanII.length ?? 0, III: du?.bank.phanIII.length ?? 0 }
    const daCo = new Set(cuaCa.map((c) => c.id))
    return [...cuaCa, ...cauTuBanDe(bankThem, dich).filter((c) => !daCo.has(c.id))]
  }, [du, bankThem, cachLayCau])
  const baiLam = useMemo(() => (du ? baiLamTuCa(du.bank, du.maCa, du.luot) : []), [du])
  const dsEmCa = useMemo(() => (du ? emTuCa(du.luot, du.hoSo, dsCau, daGoiCau, vang) : []), [du, dsCau, daGoiCau, vang])
  const dsEm = useMemo(() => {
    const q = timEm.trim().toLowerCase()
    return q ? dsEmCa.filter((e) => e.sbd.includes(q) || e.hoTen.toLowerCase().includes(q)) : dsEmCa
  }, [dsEmCa, timEm])
  const soCoMat = dsEmCa.filter((e) => e.coMat).length

  /** Tra câu ĐẦY ĐỦ theo id — gộp nhiều đề thì `viTri` của hai đề trùng nhau,
   * phải tra theo id. */
  const traCau = useMemo(() => {
    const m = new Map<string, CauDayDu>()
    for (const b of [du?.bank, bankThem]) {
      if (!b) continue
      for (const q of b.phanI) m.set(q.id, { phan: 'I', q })
      for (const q of b.phanII) m.set(q.id, { phan: 'II', q })
      for (const q of b.phanIII) m.set(q.id, { phan: 'III', q })
    }
    return m
  }, [du, bankThem])

  // ------------------------------------------------ GIÁO ÁN 80 PHÚT: dữ liệu
  //
  // Dùng CHUNG `dsCau` / `dsEmCa` với đường phân công cũ — một nguồn sự thật về
  // "chữa câu nào, có mặt em nào". Chỉ thêm hai thứ đường cũ không cần: giây
  // làm từng câu (để đọc nguyên nhân sai) và kho lịch sử (nguồn N2).
  const baiLamGiay = useMemo(() => (du ? baiLamCoGiayTuCa(du.bank, du.maCa, du.luot) : []), [du])
  const vapCa = useMemo(() => vapCuaLop(dsCau, baiLamGiay), [dsCau, baiLamGiay])
  const doKhoCau = useMemo(() => dungDoKho(dsCau, baiLamGiay, kho.muc), [dsCau, baiLamGiay, kho])
  const soBatBuoc = useMemo(() => doKhoCau.filter((d) => d.batBuoc && !boBatBuoc.includes(d.cau.id)).length, [doKhoCau, boBatBuoc])
  // `soLanLenBang` ĐẾM TRONG BUỔI, không phải lịch sử 30 ngày.
  //
  // Máy chủ chưa giữ được lịch sử lên bảng: `ghiTienDo_` ghi vào `TienDoCa` theo
  // header [SBD, MaCa, ChuyenDe, SoCau, SoSai, NopLuc, CapNhatLuc] — không có
  // cột nào cho qid, và hôm nay bảng ấy có 0 dòng `LENBANG-`. Thêm cột là ĐỔI
  // CẤU TRÚC DỮ LIỆU ĐANG CÓ, nằm trong danh sách đỏ, nên tôi không tự làm.
  //
  // Nhưng thứ đếm được thì phải đếm: thầy bấm xếp giờ lần hai trong cùng buổi
  // thì em vừa lên bảng phải tụt hạng, không thì gọi lại đúng em ấy.
  const emLenBang = useMemo(
    () => dsEmCa.map((e) => ({ sbd: e.sbd, hoTen: e.hoTen, coMat: e.coMat, soLanLenBang: (daGoiCau[e.sbd] ?? []).length })),
    [dsEmCa, daGoiCau],
  )
  const chuGiaoAn = useMemo(() => {
    if (!kqXep || !du) return ''
    return dungGiaoAn(kqXep, {
      ngay: new Date().toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit' }),
      maCa: du.maCa,
      soEmNop: du.luot.filter((l) => daCoBaiLam(l)).length,
      tenDe: du.ten,
      // Bộ câu lấy thẳng từ ca đang mở ⇒ đường A, khớp tuyệt đối, không suy đoán.
      duong: 'A',
      soCauKhop: kqXep.dong.length,
      soCauTong: dsCau.length,
    })
  }, [kqXep, du, dsCau])

  useEffect(() => {
    void (async () => {
      // Đọc hỏng thì chạy tiếp với kho rỗng: mất N2 chỉ làm độ khó rơi về N1/N3
      // kèm dòng chữ nói rõ, còn ném lỗi ở đây là gãy cả màn.
      try {
        const c = await docKhoDoKho<KhoDoKhoLuu>()
        if (c && c.muc) setKho(c)
      } catch {
        /* kho độ khó là phần thêm, không có vẫn xếp được giờ */
      }
    })()
  }, [])

  /** Dựng nền kho độ khó: duyệt ca cũ trên máy chủ, cộng dồn theo qid. Chỉ nạp
   * ca CHƯA duyệt nên bấm lại lần hai gần như tức thì. */
  const dungKho = async () => {
    if (!cauHinh) return showToast('Chưa cấu hình máy chủ', 'error')
    setDangDungKho('Đang lấy danh sách ca…')
    try {
      const ds = await danhSachCa(cauHinh.url, cauHinh.mat)
      let hienTai = kho
      const canNap = ds.filter((c) => !hienTai.daDuyet.includes(c.maCa))
      let i = 0
      for (const c of canNap) {
        i++
        setDangDungKho(`Đang nạp ca ${i}/${canNap.length} — ${c.maCa}`)
        try {
          const ct = await chiTietCa(cauHinh.url, cauHinh.mat, c.maCa, true)
          const bank: BanDeCa | null = ct.keyBank ? { phanI: ct.keyBank.phanI, phanII: ct.keyBank.phanII, phanIII: ct.keyBank.phanIII } : null
          if (!bank) continue
          hienTai = gopCaVaoKho(hienTai, c.maCa, bank, ct.luot as unknown as LuotCa[], new Date().toISOString())
        } catch {
          // Một ca hỏng KHÔNG chặn các ca còn lại; ca ấy đơn giản là chưa vào kho.
        }
      }
      await luuKhoDoKho(hienTai)
      setKho(hienTai)
      const tk = thongKeKho(hienTai)
      showToast(`Kho độ khó: ${tk.soQid} câu qua ${tk.soCa} ca · ${tk.ge8} câu đạt 8 lượt trở lên`, 'success')
    } catch (e) {
      showToast(e instanceof Error ? e.message : 'Không dựng được kho độ khó', 'error')
    } finally {
      setDangDungKho('')
    }
  }

  const chayGiaoAn = () => {
    if (!du) return showToast('Chưa mở ca nào', 'warn')
    if (!dsCau.length) return showToast('Chưa có câu nào để chữa', 'warn')
    const r = xepGioLenBang(doKhoCau, emLenBang, baiLamGiay, vapCa.theoEm, {
      boBatBuoc,
      tranEm,
      giayMoiEm,
      thieuGiay: !vapCa.coGiay,
      // Máy chủ chưa giữ được lịch sử lên bảng (`ghiTienDo_` không có cột nào
      // cho việc ấy), nên luôn khai thật thay vì in một ngày giả.
      chuaCoLichSuLenBang: true,
    })
    setKqXep(r)
  }

  /** Thầy chạm MỘT lựa chọn thừa giờ là áp ngay và xếp lại — không bắt tự dò ô số.
   * Đặc tả mục 4.3 viết "chờ thầy chạm", nên nó phải chạm được. */
  const chamLuaChon = (ma: 1 | 2 | 3) => {
    const t = kqXep?.thuaGio
    if (!t) return
    let bo = boBatBuoc
    let tran = tranEm
    let giay = giayMoiEm
    if (ma === 1) {
      const canBo = Math.ceil(Math.max(0, t.giayCan - t.giayCo) / CAU_HINH_LEN_BANG_MAC_DINH.GIAY_LANE.L2)
      bo = [
        ...boBatBuoc,
        ...doKhoCau
          .filter((d) => d.batBuoc && !boBatBuoc.includes(d.cau.id))
          .sort((a, b) => a.giaTri - b.giaTri)
          .slice(0, canBo)
          .map((d) => d.cau.id),
      ]
      setBoBatBuoc(bo)
    } else if (ma === 2) {
      const nen = t.giayCan - Math.min(tranEm, soCoMat) * (giayMoiEm - CAU_HINH_LEN_BANG_MAC_DINH.GIAY_LANE.L2)
      tran = Math.max(0, Math.floor((t.giayCo - nen) / Math.max(1, giayMoiEm - CAU_HINH_LEN_BANG_MAC_DINH.GIAY_LANE.L2)))
      setTranEm(tran)
    } else {
      const soL3 = Math.min(tranEm, soCoMat)
      const nen = t.giayCan - soL3 * (giayMoiEm - CAU_HINH_LEN_BANG_MAC_DINH.GIAY_LANE.L2)
      giay = soL3 > 0 ? Math.max(CAU_HINH_LEN_BANG_MAC_DINH.GIAY_LANE.L2, Math.floor((t.giayCo - nen) / soL3) + CAU_HINH_LEN_BANG_MAC_DINH.GIAY_LANE.L2) : giayMoiEm
      setGiayMoiEm(giay)
    }
    setKqXep(
      xepGioLenBang(doKhoCau, emLenBang, baiLamGiay, vapCa.theoEm, {
        boBatBuoc: bo,
        tranEm: tran,
        giayMoiEm: giay,
        thieuGiay: !vapCa.coGiay,
        chuaCoLichSuLenBang: true,
      }),
    )
  }

  /** Đổi em cho ĐÚNG một dòng, giữ nguyên phần còn lại. */
  const doiEm = (cauId: string) =>
    setKqXep((cu) => (cu ? doiEmChoDong(cu, cauId, doKhoCau, emLenBang, vapCa.theoEm) : cu))

  /** In giáo án: mở cửa sổ chỉ có chữ giáo án, khổ A4 dọc. Trình duyệt tự lo
   * phần "lưu thành PDF" — không nhét thư viện PDF vào bundle cho một nút in. */
  const inGiaoAn = () => {
    if (!chuGiaoAn) return
    const w = window.open('', '_blank')
    if (!w) return showToast('Trình duyệt chặn cửa sổ in — cho phép rồi bấm lại', 'warn')
    const thoat = (t: string) => t.replace(/[&<>]/g, (c) => (c === '&' ? '&amp;' : c === '<' ? '&lt;' : '&gt;'))
    w.document.write(
      `<!doctype html><meta charset="utf-8"><title>Giáo án chữa</title>` +
        `<style>@page{size:A4 portrait;margin:14mm}body{font:12px/1.5 ui-monospace,Menlo,Consolas,monospace;white-space:pre-wrap}</style>` +
        `<body>${thoat(chuGiaoAn)}</body>`,
    )
    w.document.close()
    w.focus()
    w.print()
  }

  const copyGiaoAn = async () => {
    if (!chuGiaoAn) return
    try {
      await navigator.clipboard.writeText(chuGiaoAn)
      setDaCopyGiaoAn(true)
      setTimeout(() => setDaCopyGiaoAn(false), 2500)
      showToast('Đã copy giáo án', 'success')
    } catch {
      showToast(chuGiaoAn, 'success')
    }
  }

  const chay = (luot: number) => {
    if (!du) return showToast('Chưa mở ca nào', 'warn')
    if (soCoMat === 0) return showToast('Không em nào có mặt — bỏ tích lại vài em', 'warn')
    const r = phanCong(dsCau, baiLam, dsEmCa, { ...MAC_DINH, soLuot: luot })
    setSoLuot(luot)
    setKq(r)
    setXemCau('')
  }

  const doiVang = (sbd: string) =>
    setVang((cu) => {
      const m = new Set(cu)
      if (m.has(sbd)) m.delete(sbd)
      else m.add(sbd)
      return m
    })

  const copyBang = async () => {
    if (!kq || !du) return
    const t = bangChu(kq, du.ten)
    try {
      await navigator.clipboard.writeText(t)
      setDaCopy(true)
      setTimeout(() => setDaCopy(false), 2500)
      showToast('Đã copy bảng phân công', 'success')
    } catch {
      showToast(t, 'success')
    }
  }

  /** CHẤM CÂU TRÊN BẢNG: ghi đạt/không đạt vào log mạnh–yếu của em rồi bỏ dòng
   * khỏi bảng. Ghi hỏng thì GIỮ dòng lại — mất dòng mà máy chủ chưa có gì là
   * thầy tưởng đã ghi rồi. */
  const cham = async (p: DongPhanCong, dat: boolean) => {
    if (!cauHinh) return showToast('Chưa cấu hình máy chủ', 'error')
    const cd = p.cau.chuyenDe
    if (!cd) return showToast('Câu này không có chuyên đề — chưa ghi được vào log mạnh–yếu', 'warn')
    setDangCham(p.sbd + p.cau.id)
    try {
      await ghiLenBang(cauHinh.url, cauHinh.mat, { sbd: p.sbd, chuyenDe: cd, dat, qid: p.cau.id })
      showToast(`${p.hoTen || p.sbd}: ${dat ? 'đạt' : 'không đạt'} — đã ghi vào ${cd}`, dat ? 'success' : 'warn')
      setDaGoiCau((cu) => ({ ...cu, [p.sbd]: [...new Set([...(cu[p.sbd] ?? []), p.cau.id])] }))
      setKq((cu) => (cu ? { ...cu, phanCong: cu.phanCong.filter((x) => !(x.sbd === p.sbd && x.cau.id === p.cau.id)) } : cu))
      if (xemCau === p.sbd + p.cau.id) setXemCau('')
    } catch (e) {
      showToast(e instanceof Error ? e.message : 'Không ghi được kết quả', 'error')
    } finally {
      setDangCham('')
    }
  }

  const boDong = (p: DongPhanCong) => {
    setKq((cu) => (cu ? { ...cu, phanCong: cu.phanCong.filter((x) => !(x.sbd === p.sbd && x.cau.id === p.cau.id)) } : cu))
    if (xemCau === p.sbd + p.cau.id) setXemCau('')
  }

  const theoLuot = useMemo(() => {
    const m = new Map<number, DongPhanCong[]>()
    for (const p of kq?.phanCong ?? []) {
      const a = m.get(p.luot)
      if (a) a.push(p)
      else m.set(p.luot, [p])
    }
    return [...m.entries()].sort((a, b) => a[0] - b[0])
  }, [kq])

  /** Thẻ câu đầy đủ (phương án, hình, lời giải) — dựng bằng đúng thẻ của màn
   * xem lại, không vẽ một kiểu hiển thị thứ hai. */
  const veCau = (id: string, so: number) => {
    const day = traCau.get(id)
    if (!day) return <OThongBao tone="cam">Không tìm thấy câu này trong bản đề của ca.</OThongBao>
    if (day.phan === 'I')
      return (
        <TheCau
          cheDo="xem_lai"
          phan="I"
          stt={so}
          tieuDe={day.q.tieuDe}
          text={day.q.text}
          thanCauImg={day.q.thanCauImg}
          table={day.q.table}
          imageDataUrl={day.q.imageDataUrl}
          hinhAnh={day.q.hinhAnh}
          choices={day.q.choices}
          choiceImgs={day.q.choiceImgs}
          choicePerm={[0, 1, 2, 3]}
          selected={null}
          correct={day.q.correct}
          explanation={day.q.explanation}
          loiGiai={day.q.loiGiai}
          nhanLoiGiai={day.q.loiGiaiTrangThai}
        />
      )
    if (day.phan === 'II')
      return (
        <TheCau
          cheDo="xem_lai"
          phan="II"
          stt={so}
          tieuDe={day.q.tieuDe}
          text={day.q.text}
          thanCauImg={day.q.thanCauImg}
          table={day.q.table}
          imageDataUrl={day.q.imageDataUrl}
          hinhAnh={day.q.hinhAnh}
          ideas={day.q.ideas}
          ideaImgs={day.q.ideaImgs}
          selected={[null, null, null, null]}
          correct={day.q.correct}
          explanation={day.q.explanation}
          loiGiai={day.q.loiGiai}
          nhanLoiGiai={day.q.loiGiaiTrangThai}
        />
      )
    return (
      <TheCau
        cheDo="xem_lai"
        phan="III"
        stt={so}
        tieuDe={day.q.tieuDe}
        text={day.q.text}
        thanCauImg={day.q.thanCauImg}
        table={day.q.table}
        imageDataUrl={day.q.imageDataUrl}
        hinhAnh={day.q.hinhAnh}
        selected={null}
        correct={day.q.correct}
        explanation={day.q.explanation}
        loiGiai={day.q.loiGiai}
        nhanLoiGiai={day.q.loiGiaiTrangThai}
      />
    )
  }

  return (
    <div className="min-h-screen pb-28 px-3 sm:px-4 pt-4 flex flex-col" style={{ background: 'var(--nen)', color: 'var(--muc)', gap: 'var(--k4)', fontFamily: 'var(--sans)' }}>
      <button onClick={() => setScreen('examhub')} className="tap-target self-start inline-flex items-center" style={{ ...NHAN_NHO, gap: 4 }}>
        <ArrowLeft size={16} /> Kiểm tra
      </button>
      <h1 className="font-bold" style={{ fontSize: 'var(--cx-5)', fontFamily: 'var(--serif)' }}>
        Gọi học sinh lên bảng
      </h1>

      {loi && <OThongBao tone="do">{loi}</OThongBao>}

      {/* 1 — CA LẤY BÀI LÀM */}
      <TheNoiDung>
        <div className="flex items-center justify-between" style={{ gap: 'var(--k2)' }}>
          <div style={TIEU_DE_MUC}>1. Ca lớp vừa làm</div>
          {du && (
            <span style={{ ...NHAN_NHO, ...SO }}>
              {dsCau.length} câu · {dsEm.length} em có bài
            </span>
          )}
        </div>
        <div style={{ ...NHAN_NHO, marginTop: 4 }}>Câu để chữa và bài làm của em đều lấy từ ca này — cùng dữ liệu với phiếu gửi phụ huynh.</div>

        {soCaTat > 0 && (
          <button
            type="button"
            onClick={() => setHienCaTat((v) => !v)}
            aria-pressed={hienCaTat}
            className="tap-target self-start font-bold"
            style={{ marginTop: 'var(--k2)', minHeight: 36, padding: '0 var(--k3)', borderRadius: 'var(--bo-tron)', background: hienCaTat ? 'var(--muc)' : 'var(--the-2)', color: hienCaTat ? 'var(--muc-nguoc)' : 'var(--nhat)', border: 'none', fontFamily: 'var(--sans)', fontSize: 'var(--cx-1)' }}
          >
            {hienCaTat ? 'Ẩn lại' : `Hiện cả ${soCaTat} ca đã tắt nút gạt`}
          </button>
        )}

        <div className="relative" style={{ marginTop: 'var(--k3)' }}>
          <Search size={18} style={{ position: 'absolute', left: 14, top: 15, color: 'var(--nhat)' }} />
          <input value={timCa} onChange={(e) => setTimCa(e.target.value)} placeholder="Tìm ca theo tên, mã hoặc lớp…" style={O_NHAP} aria-label="Tìm ca" />
        </div>

        {dsCa === null ? (
          <div style={{ ...NHAN_NHO, marginTop: 'var(--k3)' }}>Đang tải danh sách ca…</div>
        ) : dsCaLoc.length === 0 ? (
          <div style={{ ...NHAN_NHO, marginTop: 'var(--k3)' }}>Chưa có ca nào khớp.</div>
        ) : (
          <div className="flex flex-col" style={{ gap: 'var(--k1)', marginTop: 'var(--k3)', maxHeight: 300, overflowY: 'auto' }} data-hop-ca>
            {dsCaLoc.map((c) => {
              const chon = du?.maCa === c.maCa
              return (
                <button
                  key={c.maCa}
                  type="button"
                  onClick={() => void moCa(c)}
                  disabled={!!dangTaiCa}
                  aria-pressed={chon}
                  className="tap-target text-left flex items-center"
                  style={{ gap: 'var(--k3)', padding: 'var(--k2) var(--k3)', borderRadius: 'var(--bo-1)', background: chon ? 'var(--xanh-nen)' : 'var(--the-2)', border: 'none', color: 'var(--muc)' }}
                >
                  <span className="flex-1 min-w-0">
                    <span className="block truncate font-bold" style={{ fontFamily: 'var(--serif)', fontSize: 'var(--cx-2)' }}>
                      {c.tenCa || `Ca ${c.maCa}`}
                    </span>
                    <span style={NHAN_NHO}>
                      mã <span style={SO}>{c.maCa}</span>
                      {c.lop ? ` · lớp ${c.lop}` : ''} · <span style={SO}>{c.daNop}</span>/<span style={SO}>{c.daVao}</span> đã nộp
                      {!c.lenBang ? ' · đã tắt nút gạt' : ''}
                    </span>
                  </span>
                  {dangTaiCa === c.maCa ? <RefreshCw size={16} className="animate-spin shrink-0" /> : chon ? <Check size={16} className="shrink-0" style={{ color: 'var(--xanh)' }} /> : null}
                </button>
              )
            })}
          </div>
        )}
        {dangTaiCa && tienDo && <div style={{ ...NHAN_NHO, ...SO, marginTop: 'var(--k2)' }}>Đang lấy hồ sơ chuyên đề từng em… {tienDo}</div>}
      </TheNoiDung>

      {/* 2 — THÊM CÂU NGOÀI CA */}
      <TheNoiDung>
        <div style={TIEU_DE_MUC}>2. Câu để chữa lấy ở đâu</div>
        <div style={{ ...NHAN_NHO, marginTop: 4, marginBottom: 'var(--k3)' }}>
          Bài làm của em ở mục 1 luôn được dùng để tính câu nào cả lớp cùng sai. Mục này chỉ quyết định LẤY CÂU NÀO RA CHỮA.
        </div>

        <div className="flex flex-wrap" style={{ gap: 'var(--k2)', marginBottom: 'var(--k3)' }} role="radiogroup" aria-label="Cách lấy câu để chữa">
          {(['theo_dang', 'san', 'tu_chon'] as const).map((c) => {
            const chon = cachLayCau === c
            const tat = (c === 'san' && !du?.khoChua) || (c === 'theo_dang' && (demChua?.tongUngVien ?? 0) === 0)
            return (
              <button
                key={c}
                type="button"
                role="radio"
                aria-checked={chon}
                disabled={tat}
                onClick={() => setCachLayCau(c)}
                className="tap-target font-bold"
                style={{
                  minHeight: 44,
                  padding: '0 var(--k4)',
                  borderRadius: 'var(--bo-tron)',
                  background: chon ? 'var(--muc)' : 'var(--the-2)',
                  color: tat ? 'var(--mo)' : chon ? 'var(--muc-nguoc)' : 'var(--muc)',
                  border: 'none',
                  fontFamily: 'var(--sans)',
                  fontSize: 'var(--cx-1)',
                  opacity: tat ? 0.6 : 1,
                }}
              >
                {c === 'theo_dang' ? 'Theo dạng câu cả lớp sai' : c === 'san' ? 'Kiểm tra điểm yếu cộng dồn' : 'Tôi tự chọn bài để chữa'}
              </button>
            )
          })}
        </div>

        {cachLayCau === 'theo_dang' ? (
          <div data-theo-dang>
            <div style={{ ...NHAN_NHO, marginBottom: 'var(--k3)' }}>
              Rút từ <b>cả kho</b>, chỉ lấy câu cùng mã dạng với những câu cả lớp làm sai. Không lấy câu chuyên đề khác, không bó trong đề của ca.
            </div>
            {/* DẠNG CÂU — bấm là trần ở thanh dưới đổi theo, thầy chốt 07/09. */}
            <div className="flex flex-wrap" style={{ gap: 'var(--k2)', marginBottom: 'var(--k2)' }} role="radiogroup" aria-label="Dạng câu">
              {MOI_LOC_DANG.map((v) => (
                <button
                  key={v}
                  type="button"
                  role="radio"
                  aria-checked={locDang === v}
                  onClick={() => setLocDang(v)}
                  className="tap-target font-bold"
                  style={{
                    minHeight: 36,
                    padding: '0 var(--k3)',
                    borderRadius: 'var(--bo-tron)',
                    border: 'none',
                    background: locDang === v ? 'var(--phu-dam)' : 'var(--the-2)',
                    color: locDang === v ? 'var(--muc-nguoc)' : 'var(--muc)',
                    fontFamily: 'var(--sans)',
                    fontSize: 'var(--cx-1)',
                  }}
                >
                  {TEN_LOC_DANG[v]}
                </button>
              ))}
            </div>
            {/* MỨC SAO — thầy chốt 07/09. */}
            <div className="flex flex-wrap" style={{ gap: 'var(--k2)', marginBottom: 'var(--k3)' }} role="radiogroup" aria-label="Mức sao">
              {MOI_LOC_SAO.map((v) => (
                <button
                  key={v}
                  type="button"
                  role="radio"
                  aria-checked={locSao === v}
                  onClick={() => setLocSao(v)}
                  className="tap-target font-bold"
                  style={{
                    minHeight: 36,
                    padding: '0 var(--k3)',
                    borderRadius: 'var(--bo-tron)',
                    border: 'none',
                    background: locSao === v ? 'var(--phu-dam)' : 'var(--the-2)',
                    color: locSao === v ? 'var(--muc-nguoc)' : 'var(--muc)',
                    fontFamily: 'var(--sans)',
                    fontSize: 'var(--cx-1)',
                  }}
                >
                  {TEN_LOC_SAO[v]}
                </button>
              ))}
            </div>
            <ThanhSoCauChua
              soCau={soCauChua}
              onDoi={setSoCauChua}
              tongUngVien={demChua?.tongUngVien ?? 0}
              poolTheoCauSai={demChua?.poolTheoCauSai}
              thieu={demChua?.thieu}
              soCauSai={demChua?.poolTheoCauSai.length}
            />
          </div>
        ) : cachLayCau === 'san' ? (
          du?.khoChua ? (
            <div style={{ ...NHAN_NHO, color: 'var(--xanh)' }} data-kho-chua>
              Ca này mở bằng chế độ Kiểm tra điểm yếu nên đã tự nạp sẵn <b style={SO}>{du.khoChua.phanI.length + du.khoChua.phanII.length + du.khoChua.phanIII.length}</b> câu cùng chuyên đề để chia đủ bốn lượt. Không cần
              tích gì thêm.
            </div>
          ) : (
            <OThongBao tone="cam">Ca này không mở bằng chế độ Kiểm tra điểm yếu nên không có bộ câu rút sẵn. Chuyển sang "Tôi tự chọn bài để chữa".</OThongBao>
          )
        ) : (
          <div style={{ ...NHAN_NHO, marginBottom: 'var(--k3)' }} data-tu-chon>
            Tích bài muốn chữa. Bảng chữa CHỈ lấy câu trong bài thầy tích, không chen câu chuyên đề khác. Trong đó máy lấy <b>câu 2 sao trước, rồi 1 sao, rồi 0 sao</b>, và chọn em lên bảng bằng{' '}
            <b>điểm yếu cộng dồn ở đúng chuyên đề của câu đó</b> — em sai nhiều chuyên đề ấy nhất được gọi trước.
          </div>
        )}

        {cachLayCau === 'tu_chon' &&
          (deDaLuu.length === 0 ? (
          <OThongBao tone="cam">Chưa có đề nào trong máy — vào Ngân hàng câu hỏi bấm Đồng bộ trước.</OThongBao>
        ) : (
          <HopChonDe
            ds={deDaLuu}
            daChon={maDeChon}
            chonNhieu
            onChon={(ma) =>
              setMaDeChon((cu) => {
                const m = new Set(cu)
                if (m.has(ma)) m.delete(ma)
                else m.add(ma)
                return m
              })
            }
            onChonTatCa={(ma) => setMaDeChon(new Set(ma))}
            cao={264}
          />
          ))}
      </TheNoiDung>

      {/* 3 — EM CÓ MẶT */}
      {du && (
        <TheNoiDung>
          <div className="flex items-center justify-between" style={{ gap: 'var(--k2)' }}>
            <div style={TIEU_DE_MUC}>3. Em có mặt hôm nay</div>
            <span style={{ ...NHAN_NHO, ...SO }}>
              {soCoMat}/{dsEmCa.length}
            </span>
          </div>
          <div style={{ ...NHAN_NHO, marginTop: 4 }}>Bỏ tích em vắng. Bài của em vắng vẫn tính vào tỉ lệ đúng/sai của câu, chỉ là em không nhận câu nào.</div>
          <div className="relative" style={{ marginTop: 'var(--k3)' }}>
            <Search size={18} style={{ position: 'absolute', left: 14, top: 15, color: 'var(--nhat)' }} />
            <input value={timEm} onChange={(e) => setTimEm(e.target.value)} placeholder="Tìm theo tên hoặc số báo danh…" style={O_NHAP} aria-label="Tìm học sinh" />
          </div>
          <div className="flex flex-col" style={{ gap: 'var(--k1)', marginTop: 'var(--k3)', maxHeight: 320, overflowY: 'auto' }}>
            {dsEm.map((e) => (
              <label key={e.sbd} className="tap-target flex items-center" style={{ gap: 'var(--k3)', padding: 'var(--k2) var(--k3)', borderRadius: 'var(--bo-1)', background: e.coMat ? 'var(--xanh-nen)' : 'transparent', cursor: 'pointer' }}>
                <input type="checkbox" checked={e.coMat} onChange={() => doiVang(e.sbd)} aria-label={`${e.hoTen || e.sbd} có mặt`} style={{ width: 20, height: 20, accentColor: 'var(--xanh)' }} />
                <span className="flex-1 min-w-0">
                  <span className="block truncate" style={{ fontFamily: 'var(--serif)', fontSize: 'var(--cx-2)' }}>
                    {e.hoTen || '(chưa có tên)'}
                  </span>
                  <span style={NHAN_NHO}>
                    SBD <span style={SO}>{e.sbd}</span>
                  </span>
                </span>
              </label>
            ))}
          </div>
        </TheNoiDung>
      )}

      {/* 4A — GIÁO ÁN 80 PHÚT (GOI-LEN-BANG-80-PHUT.md mục 6) */}
      {du && (
        <TheNoiDung>
          <div className="flex items-center justify-between flex-wrap" style={{ gap: 'var(--k2)' }}>
            <div style={TIEU_DE_MUC}>Giáo án {CAU_HINH_LEN_BANG_MAC_DINH.NGAN_SACH_PHUT} phút</div>
            <button
              type="button"
              onClick={() => void dungKho()}
              disabled={!!dangDungKho}
              className="tap-target inline-flex items-center font-bold"
              style={{ gap: 6, minHeight: 40, padding: '0 var(--k4)', borderRadius: 'var(--bo-tron)', background: 'var(--the-2)', color: 'var(--muc)', border: 'none', fontSize: 'var(--cx-1)' }}
            >
              <RefreshCw size={16} /> {dangDungKho || 'Dựng kho độ khó'}
            </button>
          </div>

          {/* Kho lịch sử là nguồn N2. Nói thẳng nó đang có gì, đừng để thầy đoán. */}
          <div style={{ ...NHAN_NHO, marginTop: 4 }}>
            Kho độ khó: <span style={SO}>{Object.keys(kho.muc).length}</span> câu qua <span style={SO}>{kho.daDuyet.length}</span> ca đã duyệt
            {Object.keys(kho.muc).length === 0 && ' — chưa dựng, độ khó đang chỉ đọc từ ca này và nhãn sao trong kho'}
          </div>

          {/* 4 — DANH SÁCH BẮT BUỘC CHỮA, hiện TRƯỚC khi xếp giờ */}
          {doKhoCau.length > 0 && (
            <div style={{ marginTop: 'var(--k4)', padding: 'var(--k3)', borderRadius: 'var(--bo-2)', background: 'var(--cam-nen)' }} data-khoi="bat-buoc-chua">
              <div className="flex items-center font-bold" style={{ gap: 6, color: 'var(--cam)', fontFamily: 'var(--sans)', fontSize: 'var(--cx-2)' }}>
                <BookOpenCheck size={16} /> BẮT BUỘC CHỮA — <span style={SO}>{soBatBuoc}</span>/<span style={SO}>{doKhoCau.length}</span> câu
              </div>
              <div className="flex flex-col" style={{ gap: 4, marginTop: 'var(--k2)' }}>
                {doKhoCau
                  .filter((d) => d.batBuoc)
                  .map((d) => (
                    <label key={d.cau.id} className="flex items-start" style={{ gap: 8, fontFamily: 'var(--sans)', fontSize: 'var(--cx-1)', color: 'var(--muc)' }}>
                      <input
                        type="checkbox"
                        checked={!boBatBuoc.includes(d.cau.id)}
                        onChange={() =>
                          setBoBatBuoc((cu) => (cu.includes(d.cau.id) ? cu.filter((x) => x !== d.cau.id) : [...cu, d.cau.id]))
                        }
                        style={{ marginTop: 3 }}
                      />
                      <span>
                        <b>{chuCau(d.cau)}</b> · {d.viSaoBatBuoc}
                      </span>
                    </label>
                  ))}
              </div>
            </div>
          )}

          {/* 6 — CÀI ĐẶT: một nguồn sự thật, thầy chỉnh được đúng hai thứ mà ba
              lựa chọn thừa giờ nhắc tới. */}
          <div className="flex items-center flex-wrap" style={{ gap: 'var(--k3)', marginTop: 'var(--k4)', fontFamily: 'var(--sans)', fontSize: 'var(--cx-1)', color: 'var(--nhat)' }}>
            <label className="flex items-center" style={{ gap: 6 }}>
              Trần em lên bảng
              <input
                type="number"
                min={0}
                max={30}
                value={tranEm}
                onChange={(e) => setTranEm(Math.max(0, Math.min(30, Number(e.target.value) || 0)))}
                style={{ ...SO, width: 64, height: 36, borderRadius: 'var(--bo-1)', background: 'var(--the-2)', border: 'none', color: 'var(--muc)', textAlign: 'center' }}
              />
            </label>
            <label className="flex items-center" style={{ gap: 6 }}>
              Phút mỗi em
              <input
                type="number"
                min={1}
                max={20}
                value={Math.round(giayMoiEm / 60)}
                onChange={(e) => setGiayMoiEm(Math.max(60, Math.min(1200, (Number(e.target.value) || 1) * 60)))}
                style={{ ...SO, width: 64, height: 36, borderRadius: 'var(--bo-1)', background: 'var(--the-2)', border: 'none', color: 'var(--muc)', textAlign: 'center' }}
              />
            </label>
            <span>
              ngân sách chữa <span style={SO}>{Math.round(nganSachGiay(CAU_HINH_LEN_BANG_MAC_DINH) / 60)}</span> phút
            </span>
          </div>

          <div style={{ marginTop: 'var(--k4)' }}>
            <NutChinh onClick={chayGiaoAn} disabled={!dsCau.length}>
              <span className="inline-flex items-center" style={{ gap: 6 }}>
                <Wand2 size={18} /> Xếp giờ ({dsCau.length} câu · {soCoMat} em)
              </span>
            </NutChinh>
          </div>

          {/* 5 — CẢNH BÁO THỪA GIỜ: hiện đúng con số và ba lựa chọn, CHỜ THẦY CHẠM */}
          {kqXep?.thuaGio && (
            <OThongBao tone="do">
              <b style={SO}>{kqXep.thuaGio.soCauBatBuoc}</b> câu bắt buộc · cần{' '}
              <b style={SO}>{Math.round(kqXep.thuaGio.giayCan / 60)}</b> phút, có{' '}
              <b style={SO}>{Math.round(kqXep.thuaGio.giayCo / 60)}</b> phút.
              <div className="flex flex-col" style={{ gap: 6, marginTop: 8 }}>
                {kqXep.thuaGio.luaChon.map((l) => (
                  <button
                    key={l.ma}
                    type="button"
                    onClick={() => chamLuaChon(l.ma)}
                    className="tap-target text-left w-full"
                    style={{ minHeight: 44, padding: '8px var(--k3)', borderRadius: 'var(--bo-1)', background: 'var(--the-2)', color: 'var(--muc)', border: 'none', fontFamily: 'var(--sans)', fontSize: 'var(--cx-1)' }}
                  >
                    {l.ma === 1 ? '①' : l.ma === 2 ? '②' : '③'} {l.chu} → <span style={SO}>{l.phutSau}</span> phút
                  </button>
                ))}
              </div>
              <div style={{ ...NHAN_NHO, marginTop: 6 }}>Chạm một dòng là áp ngay và xếp lại. Không chạm thì không đổi gì.</div>
            </OThongBao>
          )}

          {kqXep?.canhBao.map((c) => (
            <OThongBao key={c} tone="cam">
              {c}
            </OThongBao>
          ))}

          {/* 7 — GIÁO ÁN CÓ ĐỒNG HỒ */}
          {kqXep && kqXep.dong.length > 0 && (
            <div style={{ marginTop: 'var(--k4)' }} data-khoi="giao-an">
              <div className="flex items-center justify-between flex-wrap" style={{ gap: 'var(--k2)' }}>
                <div style={{ ...NHAN_NHO }}>
                  <span style={SO}>{Math.round(kqXep.tongGiay / 60)}</span>/
                  <span style={SO}>{CAU_HINH_LEN_BANG_MAC_DINH.NGAN_SACH_PHUT}</span> phút ·{' '}
                  <span style={SO}>{kqXep.soEmLenBang}</span> em lên bảng ·{' '}
                  {(['L0', 'L1', 'L2', 'L3'] as const).map((l) => `${kqXep.dong.filter((d) => d.lane === l).length} ${TEN_LANE[l].toLowerCase()}`).join(' · ')}
                </div>
                <button
                  type="button"
                  onClick={() => void copyGiaoAn()}
                  className="tap-target inline-flex items-center font-bold"
                  style={{ gap: 6, minHeight: 40, padding: '0 var(--k4)', borderRadius: 'var(--bo-tron)', background: daCopyGiaoAn ? 'var(--xanh-nen)' : 'var(--the-2)', color: daCopyGiaoAn ? 'var(--xanh)' : 'var(--muc)', border: 'none', fontSize: 'var(--cx-1)' }}
                >
                  {daCopyGiaoAn ? <Check size={16} /> : <ClipboardCopy size={16} />} {daCopyGiaoAn ? 'Đã copy' : 'Copy giáo án'}
                </button>
                <button
                  type="button"
                  onClick={inGiaoAn}
                  className="tap-target inline-flex items-center font-bold"
                  style={{ gap: 6, minHeight: 40, padding: '0 var(--k4)', borderRadius: 'var(--bo-tron)', background: 'var(--the-2)', color: 'var(--muc)', border: 'none', fontSize: 'var(--cx-1)' }}
                >
                  <Printer size={16} /> In / lưu PDF
                </button>
              </div>
              {/* ĐỔI EM CHO MỘT DÒNG — đặc tả mục 6.7. Đứng trên bản in để thầy
                  chốt người trước, rồi mới in ra giấy. */}
              {kqXep.dong.some((d) => d.lane === 'L3') && (
                <div className="flex flex-col" style={{ gap: 4, marginTop: 'var(--k3)' }} data-khoi="em-len-bang">
                  {kqXep.dong
                    .filter((d) => d.lane === 'L3')
                    .map((d) => (
                      <div key={d.cau.id} className="flex items-center justify-between flex-wrap" style={{ gap: 8, padding: '6px var(--k3)', borderRadius: 'var(--bo-1)', background: 'var(--the-2)' }}>
                        <span style={{ fontFamily: 'var(--sans)', fontSize: 'var(--cx-1)', color: 'var(--muc)' }}>
                          <b>{chuCau(d.cau)}</b> → {d.em?.hoTen || `SBD ${d.em?.sbd ?? ''}`}
                          {d.vap ? <span style={NHAN_NHO}> · vấp {d.vap.idCau}</span> : <span style={NHAN_NHO}> · chưa vấp câu nào cùng chuyên đề</span>}
                        </span>
                        <button
                          type="button"
                          onClick={() => doiEm(d.cau.id)}
                          className="tap-target inline-flex items-center font-bold"
                          style={{ gap: 6, minHeight: 36, padding: '0 var(--k3)', borderRadius: 'var(--bo-tron)', background: 'var(--the-1)', color: 'var(--muc)', border: 'none', fontSize: 'var(--cx-1)' }}
                        >
                          <Shuffle size={14} /> Đổi em này
                        </button>
                      </div>
                    ))}
                </div>
              )}
              <pre
                style={{
                  marginTop: 'var(--k3)',
                  padding: 'var(--k3)',
                  borderRadius: 'var(--bo-2)',
                  background: 'var(--the-2)',
                  color: 'var(--muc)',
                  fontFamily: 'var(--sans)',
                  fontSize: 'var(--cx-1)',
                  whiteSpace: 'pre-wrap',
                  overflowX: 'auto',
                }}
              >
                {chuGiaoAn}
              </pre>
              <div style={{ ...NHAN_NHO, marginTop: 4 }}>
                Đồng hồ bắt đầu từ {dongHo(0)}. Mỗi con số trong giáo án đều kèm cỡ mẫu và tên nguồn.
              </div>
            </div>
          )}
        </TheNoiDung>
      )}

      {/* 4 — PHÂN CÔNG */}
      <NutChinh onClick={() => chay(1)} disabled={!du || soCoMat === 0}>
        <span className="inline-flex items-center" style={{ gap: 6 }}>
          <Wand2 size={18} /> Phân công lên bảng ({soCoMat} em)
        </span>
      </NutChinh>

      {kq && (
        <TheNoiDung>
          <div className="flex items-center justify-between flex-wrap" style={{ gap: 'var(--k2)' }}>
            <div style={TIEU_DE_MUC}>Phân công</div>
            <button
              type="button"
              onClick={() => void copyBang()}
              className="tap-target inline-flex items-center font-bold"
              style={{ gap: 6, minHeight: 40, padding: '0 var(--k4)', borderRadius: 'var(--bo-tron)', background: daCopy ? 'var(--xanh-nen)' : 'var(--the-2)', color: daCopy ? 'var(--xanh)' : 'var(--muc)', border: 'none', fontSize: 'var(--cx-1)' }}
            >
              {daCopy ? <Check size={16} /> : <ClipboardCopy size={16} />} {daCopy ? 'Đã copy' : 'Copy bảng'}
            </button>
          </div>
          <div style={{ ...NHAN_NHO, marginTop: 4 }} data-dong-tong>
            <span style={SO}>{kq.thongKe.length - kq.giangCaLop.length - kq.chiDocDapAn.length}</span> câu đáng chữa · <span style={SO}>{kq.giangCaLop.length}</span> giảng cả lớp ·{' '}
            <span style={SO}>{kq.chiDocDapAn.length}</span> đọc đáp án
          </div>

          {/* GIẢNG CẢ LỚP LÊN ĐẦU — chỗ đắt nhất của buổi: một lần giảng sửa cho
              nhiều em, còn gọi một em lên chữa thì cả lớp ngồi xem. */}
          {kq.giangCaLop.length > 0 && (
            <div style={{ marginTop: 'var(--k4)', padding: 'var(--k3)', borderRadius: 'var(--bo-2)', background: 'var(--cam-nen)' }} data-khoi="giang-ca-lop">
              <div className="flex items-center font-bold" style={{ gap: 6, color: 'var(--cam)', fontFamily: 'var(--sans)', fontSize: 'var(--cx-2)' }}>
                <Megaphone size={16} /> GIẢNG CẢ LỚP — không gọi ai lên bảng
              </div>
              <div className="flex flex-col" style={{ gap: 'var(--k2)', marginTop: 'var(--k2)' }}>
                {kq.giangCaLop.map((t) => (
                  <div key={t.cau.id}>
                    <button
                      type="button"
                      onClick={() => setXemCau(xemCau === t.cau.id ? '' : t.cau.id)}
                      className="tap-target text-left w-full"
                      style={{ background: 'none', border: 'none', padding: 0, minHeight: 0, color: 'var(--muc)' }}
                    >
                      <span className="block font-bold" style={{ fontFamily: 'var(--serif)', fontSize: 'var(--cx-2)' }}>
                        {chuCau(t.cau)}
                      </span>
                      <span className="block" style={{ ...NHAN_NHO, ...SO }}>
                        {chuChum(t)}
                      </span>
                      {t.cau.tomTat && (
                        <span className="block" style={{ ...NHAN_NHO, color: 'var(--muc)' }}>
                          {t.cau.tomTat}
                        </span>
                      )}
                    </button>
                    {xemCau === t.cau.id && <div style={{ marginTop: 'var(--k2)' }}>{veCau(t.cau.id, t.cau.so)}</div>}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* CÁC LƯỢT */}
          {theoLuot.map(([luot, ds]) => (
            <div key={luot} style={{ marginTop: 'var(--k4)' }} data-luot={luot}>
              <div className="font-bold" style={{ fontFamily: 'var(--sans)', fontSize: 'var(--cx-2)', letterSpacing: '.04em' }}>
                LƯỢT {luot}
              </div>
              <div className="flex flex-col" style={{ gap: 'var(--k3)', marginTop: 'var(--k2)' }}>
                {ds.map((p) => {
                  const ma = p.sbd + p.cau.id
                  return (
                    <div key={ma} className="flex flex-col" style={{ gap: 'var(--k2)' }}>
                      <Hang style={{ alignItems: 'flex-start' }}>
                        <button
                          type="button"
                          onClick={() => setXemCau(xemCau === ma ? '' : ma)}
                          className="flex-1 min-w-0 text-left tap-target"
                          style={{ background: 'none', border: 'none', padding: 0, minHeight: 0, color: 'var(--muc)' }}
                        >
                          <span className="block font-bold" style={{ fontFamily: 'var(--serif)', fontSize: 'var(--cx-2)' }}>
                            {chuCau(p.cau)} <span style={{ color: 'var(--nhat)' }}>→</span> {p.hoTen || `SBD ${p.sbd}`}
                          </span>
                          {/* VÌ SAO CHỌN EM NÀY + NHẮM MỨC NÀO — thầy đọc là biết
                              lý do, không phải tin một con số. */}
                          <span className="block" style={NHAN_NHO} data-vi-sao>
                            {p.viSao} · nhắm {TEN_MUC_NHAM[p.mucDoNham]}
                          </span>
                          {p.cau.tomTat && (
                            <span className="block" style={{ ...NHAN_NHO, color: 'var(--muc)' }}>
                              {p.cau.tomTat}
                            </span>
                          )}
                          {p.cau.lyDoSao && !!p.cau.sao && (
                            <span className="block" style={{ ...NHAN_NHO, color: 'var(--cam)' }}>
                              {p.cau.lyDoSao}
                            </span>
                          )}
                          <span className="flex items-center flex-wrap" style={{ gap: 4, marginTop: 4 }}>
                            {p.muc <= 2 && <Nhan tone="do">sai chính câu này</Nhan>}
                            {p.muc === 3 && <Nhan tone="cam">chưa làm câu này</Nhan>}
                            {p.cau.mucDo && <Nhan tone="xam">{TEN_MUC_NHAM[p.cau.mucDo]}</Nhan>}
                          </span>
                        </button>
                        <button
                          type="button"
                          onClick={() => boDong(p)}
                          aria-label={`Bỏ ${p.hoTen || p.sbd} khỏi bảng`}
                          className="tap-target flex items-center justify-center shrink-0"
                          style={{ width: 32, height: 32, borderRadius: 'var(--bo-tron)', background: 'transparent', border: 'none', color: 'var(--mo)' }}
                        >
                          <X size={16} />
                        </button>
                      </Hang>

                      <div className="flex items-center flex-wrap" style={{ gap: 'var(--k2)' }}>
                        <button
                          type="button"
                          onClick={() => void cham(p, true)}
                          disabled={dangCham === ma}
                          className="tap-target inline-flex items-center font-bold"
                          style={{ gap: 6, minHeight: 36, padding: '0 var(--k4)', borderRadius: 'var(--bo-tron)', background: 'var(--xanh-nen)', color: 'var(--xanh)', border: 'none', fontFamily: 'var(--sans)', fontSize: 'var(--cx-1)' }}
                        >
                          <ThumbsUp size={15} /> Đạt
                        </button>
                        <button
                          type="button"
                          onClick={() => void cham(p, false)}
                          disabled={dangCham === ma}
                          className="tap-target inline-flex items-center font-bold"
                          style={{ gap: 6, minHeight: 36, padding: '0 var(--k4)', borderRadius: 'var(--bo-tron)', background: 'var(--do-nen)', color: 'var(--do)', border: 'none', fontFamily: 'var(--sans)', fontSize: 'var(--cx-1)' }}
                        >
                          <ThumbsDown size={15} /> Không đạt
                        </button>
                        {dangCham === ma && <span style={NHAN_NHO}>Đang ghi…</span>}
                      </div>

                      {xemCau === ma && <div>{veCau(p.cau.id, p.cau.so)}</div>}
                    </div>
                  )
                })}
              </div>
            </div>
          ))}

          {/* CHỈ ĐỌC ĐÁP ÁN — cắt đầu tiên khi thiếu giờ, nên để cuối. */}
          {kq.chiDocDapAn.length > 0 && (
            <div style={{ marginTop: 'var(--k4)', padding: 'var(--k3)', borderRadius: 'var(--bo-2)', background: 'var(--the-2)' }} data-khoi="chi-doc-dap-an">
              <div className="flex items-center font-bold" style={{ gap: 6, fontFamily: 'var(--sans)', fontSize: 'var(--cx-2)' }}>
                <BookOpenCheck size={16} /> CHỈ ĐỌC ĐÁP ÁN
              </div>
              <div className="flex flex-col" style={{ gap: 4, marginTop: 'var(--k2)' }}>
                {kq.chiDocDapAn.map((t) => (
                  <div key={t.cau.id} style={{ ...NHAN_NHO, color: 'var(--muc)' }}>
                    {chuCau(t.cau)} — <span style={SO}>{Math.round(t.tiLeDung * 100)}%</span> em làm đúng
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* CHÂN BẢNG: ai chưa được gọi, con số nào chỉ tham khảo, còn câu thì
              gọi tiếp lượt sau. */}
          <div className="flex flex-col" style={{ gap: 'var(--k2)', marginTop: 'var(--k4)' }}>
            {kq.emChuaGoi.length > 0 && (
              <div style={NHAN_NHO} data-chua-goi>
                <span style={SO}>{kq.emChuaGoi.length}</span> em chưa được gọi lượt nào: {kq.emChuaGoi.join(', ')}
              </div>
            )}
            {kq.canhBao.map((c) => (
              <div key={c} style={{ ...NHAN_NHO, color: 'var(--cam)' }} data-canh-bao>
                ⚠ {c}
              </div>
            ))}
            {kq.chuaPhan.length > 0 && (
              <button
                type="button"
                onClick={() => chay(soLuot + 1)}
                className="tap-target self-start inline-flex items-center font-bold"
                style={{ gap: 6, minHeight: 44, padding: '0 var(--k5)', borderRadius: 'var(--bo-tron)', background: 'var(--muc)', color: 'var(--muc-nguoc)', border: 'none', fontFamily: 'var(--sans)', fontSize: 'var(--cx-2)' }}
              >
                GỌI LƯỢT {soLuot + 1}
              </button>
            )}
          </div>
        </TheNoiDung>
      )}
    </div>
  )
}
