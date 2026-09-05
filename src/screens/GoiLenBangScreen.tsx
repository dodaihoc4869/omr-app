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
import { ArrowLeft, ClipboardCopy, Check, RefreshCw, Search, Wand2, Megaphone, BookOpenCheck, ThumbsUp, ThumbsDown, X } from 'lucide-react'
import { Hang, Nhan, OThongBao, NutChinh, TheNoiDung } from '../components/DesignSystem'
import { chiTietCa, chuoi, danhSachCa, ghiLenBang, hoSoEm, type CaTomTat } from '../lib/exam-api'
import { docKhoChuaCa, loadExamSources, loadScriptUrl, loadSessionTeacherBank, loadTeacherSecret } from '../lib/exam-db'
import { mergeKeepAnswers } from '../data/examContent'
import type { TeacherExamSource, TeacherMcqQuestion, TeacherShortAnswerQuestion, TeacherTrueFalseQuestion } from '../data/examContent'
import { tachNhieuTheoPhan } from '../lib/tach-phan-de'
import HopChonDe from '../components/HopChonDe'
import { baiLamTuCa, cauTuBanDe, daCoBaiLam, emTuCa, luotMoiNhat, type BanDeCa, type HoSoRutGon, type LuotCa } from '../lib/du-lieu-len-bang'
import { bangChu, chuCau, chuChum, MAC_DINH, phanCong, TEN_MUC_NHAM, type CauChua, type DongPhanCong, type KetQuaPhanCong } from '../lib/phan-cong'
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
  const [cachLayCau, setCachLayCau] = useState<'san' | 'tu_chon'>('tu_chon')
  const [timEm, setTimEm] = useState('')

  const [soLuot, setSoLuot] = useState(1)
  const [daGoiCau, setDaGoiCau] = useState<Record<string, string[]>>({})
  const [kq, setKq] = useState<KetQuaPhanCong | null>(null)
  const [daCopy, setDaCopy] = useState(false)
  const [xemCau, setXemCau] = useState('')
  const [dangCham, setDangCham] = useState('')

  useEffect(() => {
    void (async () => {
      const [url, mat, kho] = await Promise.all([loadScriptUrl(), loadTeacherSecret(), loadExamSources()])
      // Mỗi mã đề tách làm ba dạng (trắc nghiệm · đúng sai · trả lời ngắn), y
      // hệt màn Mở ca — tích một dòng là lấy đúng dạng đó.
      setDeDaLuu(tachNhieuTheoPhan(kho))
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

  /** Bản đề của các mã thầy tích thêm, gộp lại thành một kho. */
  const bankTichTay: BanDeCa = useMemo(() => mergeKeepAnswers(deDaLuu.filter((d) => maDeChon.has(d.maDe))), [deDaLuu, maDeChon])

  /** Câu chữa THÊM = kho chữa tự nạp của ca + đề thầy tích tay. Cả hai đều là
   * câu không em nào làm, nên không bao giờ bị xếp "giảng cả lớp". */
  const bankThem: BanDeCa = useMemo(() => {
    // Thầy tự chọn thì BỎ HẲN kho tự nạp: gộp cả hai là bảng chữa lại đầy câu
    // máy chọn, đúng chỗ thầy vừa kêu.
    const san = cachLayCau === 'san' ? du?.khoChua : null
    return {
      phanI: [...(san?.phanI ?? []), ...bankTichTay.phanI],
      phanII: [...(san?.phanII ?? []), ...bankTichTay.phanII],
      phanIII: [...(san?.phanIII ?? []), ...bankTichTay.phanIII],
    }
  }, [du, bankTichTay, cachLayCau])

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
    if (cachLayCau === 'tu_chon') return cauTuBanDe(bankThem)

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
          {(['san', 'tu_chon'] as const).map((c) => {
            const chon = cachLayCau === c
            const tat = c === 'san' && !du?.khoChua
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
                {c === 'san' ? 'Kiểm tra điểm yếu cộng dồn' : 'Tôi tự chọn bài để chữa'}
              </button>
            )
          })}
        </div>

        {cachLayCau === 'san' ? (
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
