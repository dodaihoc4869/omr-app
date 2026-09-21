import { hanNhapVietNam, hanChoOChon, mocThoiGian, gioHanVietNam } from '../lib/han-bai-tap'
import KhoiBtvnLo from '../components/KhoiBtvnLo'
import KhoiCaNhanHoa from '../components/KhoiCaNhanHoa'
import XemTruocPhanBo from '../components/XemTruocPhanBo'
import { LOI_XAC_NHAN_LAM_LAI, canhBaoTuMayChu, choLamLaiBtvn, hanMacDinhVN, taoCauGiao, taoHatGiong } from '../lib/btvn-nang-do-thay'
import { useAppStore } from '../store/appStore'
import { layHomNay, type HomNay } from '../lib/hom-nay-api'
import { useGioHocTap } from '../hooks/useGioHocTap'
import NhanHanBaiTap from '../components/NhanHanBaiTap'
import {nhomBtvn, type NhomBtvn} from '../lib/nhom-btvn'
import NhomCaThuGon from '../components/NhomCaThuGon'
import HocSinhNhanBai from '../components/HocSinhNhanBai'
// Giao và theo dõi BTVN. Gọi lên bảng là màn riêng; không thay đổi bộ rút câu.
import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { CheckSquare, ClipboardList, RefreshCw, Search, Square, UserCheck, Users, Send, ClipboardCheck, Clock, GraduationCap } from 'lucide-react'
import { OThongBao } from '../components/DesignSystem'
import { danhSachCa, danhSachEm, khoiTuNamSinh, type CaTomTat, type EmTomTat } from '../lib/exam-api'
import { loadScriptUrl, loadTeacherSecret, loadExamSources } from '../lib/exam-db'
import { layCauHinhMayChu } from '../lib/may-chu-moi'
import { luotCuaCaMoi } from '../lib/day-ca-may-chu-moi'
import { giaoBtvn, theoDoiBtvn, suaGiaoBtvn, type DongTheoDoiBtvn } from '../lib/btvn-may-chu-moi'
import HopChonDe from '../components/HopChonDe'
import { tachNhieuTheoPhan } from '../lib/tach-phan-de'
import type { TeacherExamSource } from '../data/examContent'

interface DeKho {
  maDe: string
  tenDe: string
  soCau: number
}

const gioVN = gioHanVietNam

/** Đổi mã đề dạng DH-12-C2-B6-DS,DH-12-C2-B6-TLN thành cây thư mục Dạy học / Lớp 12 / Ch.2 / Bài 6 / Đúng sai · Trả lời ngắn */
export function dinhDangDeCayThuMuc(maDeStr: string): string {
  if (!maDeStr) return ''
  const codes = maDeStr.split(',').map((s) => s.trim()).filter(Boolean)
  if (codes.length === 0) return maDeStr

  const MAP_TIEN_TO: Record<string, string> = {
    DH: 'Dạy học',
    DB: 'Dạng bài',
    GK: 'Giữa kì',
    CK: 'Cuối kì',
  }

  const MAP_DUOI: Record<string, string> = {
    DS: 'Đúng sai',
    TLN: 'Trả lời ngắn',
    TN: 'Trắc nghiệm',
    VD: 'Ví dụ',
    DT: 'Dạng toán',
  }

  const parsed = codes.map((code) => {
    const m = /^(?:([A-Za-z0-9]+)-)?(10|11|12)-C(\d+)-B(\d+)(?:-([A-Za-z0-9_-]+))?$/i.exec(code)
    if (!m) {
      const m2 = /^(?:([A-Za-z0-9]+)-)?(10|11|12)(?:-C(\d+))?(?:-B(\d+))?(?:-([A-Za-z0-9_-]+))?$/i.exec(code)
      if (m2 && (m2[3] || m2[4])) {
        return {
          goc: code,
          tienTo: m2[1] ? (MAP_TIEN_TO[m2[1].toUpperCase()] || m2[1]) : '',
          lop: m2[2] ? `Lớp ${m2[2]}` : '',
          chuong: m2[3] ? `Ch.${m2[3]}` : '',
          bai: m2[4] ? `Bài ${m2[4]}` : '',
          duoi: m2[5] ? (MAP_DUOI[m2[5].toUpperCase()] || m2[5]) : '',
        }
      }
      return null
    }
    return {
      goc: code,
      tienTo: m[1] ? (MAP_TIEN_TO[m[1].toUpperCase()] || m[1]) : '',
      lop: `Lớp ${m[2]}`,
      chuong: `Ch.${m[3]}`,
      bai: `Bài ${m[4]}`,
      duoi: m[5] ? (MAP_DUOI[m[5].toUpperCase()] || m[5]) : '',
    }
  })

  if (parsed.some((p) => p === null)) return maDeStr

  const valid = parsed as NonNullable<(typeof parsed)[0]>[]
  const first = valid[0]
  const cungTienTo = valid.every((v) => v.tienTo === first.tienTo)
  const cungLop = valid.every((v) => v.lop === first.lop)
  const cungChuong = valid.every((v) => v.chuong === first.chuong)
  const cungBai = valid.every((v) => v.bai === first.bai)

  if (cungTienTo && cungLop && cungChuong && cungBai) {
    const duongDan = [first.tienTo, first.lop, first.chuong, first.bai].filter(Boolean).join(' / ')
    const dsDuoi = valid.map((v) => v.duoi).filter(Boolean)
    if (dsDuoi.length > 0) {
      return `${duongDan} / ${dsDuoi.join(' · ')}`
    }
    return duongDan || maDeStr
  }

  return valid
    .map((v) => [v.tienTo, v.lop, v.chuong, v.bai, v.duoi].filter(Boolean).join(' / ') || v.goc)
    .join(', ')
}

export default function PhanCongScreen() {
  return (
    <div className="gv-page min-h-screen pb-28 px-3 sm:px-4 pt-4 flex flex-col w-full max-w-full min-w-0" style={{ gap: 'var(--k3)' }}>
      <header className="gv-page-header flex items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl flex items-center justify-center bg-emerald-50 dark:bg-emerald-950/70 text-[color:var(--m3-on-tertiary-container)] border border-emerald-200 dark:border-emerald-800 shadow-2xs shrink-0">
            <ClipboardList size={22} />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-lg sm:text-xl font-bold text-slate-900 dark:text-white leading-tight">
                Giao bài tập về nhà
              </h1>
              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 dark:bg-emerald-950/70 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-800">
                Chia lô theo hạn nộp
              </span>
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              Chọn học sinh, chọn đề và đặt hạn nộp. Theo dõi bài chưa nộp ở mục Đã giao.
            </p>
          </div>
        </div>
      </header>
      <TheGiaoBtvn />
    </div>
  )
}

function TheGiaoBtvn() {
  const [tabBtvn, setTabBtvn] = useState<'giao' | 'theodoi'>('theodoi')
  // LÔ BTVN (G5): các bài đang chạy + lô hiện tại, đọc từ lệnh Hôm nay của thầy (`/ke-hoach/hom-nay-thay`, chỉ đọc). undefined = đang tải.
  const [homNay, setHomNay] = useState<HomNay | null | undefined>(undefined)
  // "Giao bài riêng" từ hồ sơ một em (G3→G5): mở sẵn tab Giao bài mới, chế độ chọn từng em, đã tick em ấy. Đọc MỘT lần rồi xoá.
  const sbdGiaoRieng = useAppStore((st) => st.sbdGiaoRieng)
  useEffect(() => {
    let huy = false
    void layHomNay().then((r) => !huy && setHomNay(r))
    return () => {
      huy = true
    }
  }, [])
  const [cheDo, setCheDo] = useState<'ca' | 'hoc_sinh' | 'theo_em'>('ca')
  const [dsCa, setDsCa] = useState<CaTomTat[]>([])
  const [dsDe, setDsDe] = useState<DeKho[]>([])
  // TICK NHIỀU CA (thầy chốt 12/09). Một lượt giao ra nhiều lớp, cùng tờ đề,
  // cùng một mốc hạn nộp.
  const [caChon, setCaChon] = useState<Set<string>>(new Set())
  // TICK NHIỀU TỜ (thầy chốt 12/09). Giữ theo thứ tự thầy tick: bài em nhận
  // được ghép theo đúng thứ tự ấy, không xáo.
  const [daChon, setDaChon] = useState<Set<string>>(new Set())
  // TICK TỪNG HỌC SINH (thầy yêu cầu: thêm lựa chọn giao bài tập về nhà cho từng học sinh,
  // hiển thị ô danh sách học sinh và có ô tick để giao bài tập).
  const [sbdChon, setSbdChon] = useState<Set<string>>(new Set())
  const [sbdChonTheoEm, setSbdChonTheoEm] = useState<Set<string>>(new Set())
  useEffect(() => {
    if (!sbdGiaoRieng) return
    setTabBtvn('giao')
    setCheDo('theo_em')
    setSbdChonTheoEm(new Set([sbdGiaoRieng]))
    useAppStore.getState().datSbdGiaoRieng('')
  }, [sbdGiaoRieng])
  const [khoiTheoEm, setKhoiTheoEm] = useState('')
  const [timKiemTheoEm, setTimKiemTheoEm] = useState('')
  const [dsEm, setDsEm] = useState<EmTomTat[]>([])
  const [luotCacCa, setLuotCacCa] = useState<Record<string, { sbd: string; hoTen: string; diem?: number | null; nopLuc?: string }[]>>({})
  const [dangTaiLuot, setDangTaiLuot] = useState(false)
  const [timKiemHs, setTimKiemHs] = useState('')
  const [chonRieng,setChonRieng]=useState(false)
  const [khoiThem,setKhoiThem]=useState('')
  const [khoiGui,setKhoiGui]=useState('10')


  // NGUỒN ĐỀ LẤY Y NHƯ MÀN MỞ CA: kho trên máy thầy, tách theo phần, rồi đưa
  // vào ĐÚNG hộp chọn đề đang chạy ở đó (`HopChonDe`). Thầy chốt 12/09: "phần
  // giao btvn tôi muốn hiển thị đúng như trong mở ca".
  const [nguonKho, setNguonKho] = useState<TeacherExamSource[]>([])
  const [dangNap, setDangNap] = useState(true)
  const [dangGiao, setDangGiao] = useState(false)
  // BTVN NÂNG ĐỠ (thầy duyệt 21/09): công tắc mặc định BẬT (khuyên dùng); tắt = như cũ, cả lớp đủ câu. Ghim câu là TUỲ CHỌN (rỗng vẫn giao được).
  const [caNhan, setCaNhan] = useState(true)
  const [ghim, setGhim] = useState<string[]>([])
  const [xemTruoc, setXemTruoc] = useState(false)
  const [canhBaoNangDo, setCanhBaoNangDo] = useState('')
  // Hạt giống MỘT lần cho mỗi hộp thoại giao: dùng chung cho Xem trước và Giao để bộ xem trước = bộ thật (hợp đồng docs/hop-dong-btvn-nang-do-2109.md mục 2/5).
  const hatGiongRef = useRef(taoHatGiong())
  const [bao, setBao] = useState<{ ok: boolean; chu: string } | null>(null)
  // Hạn nộp mặc định 23:59 (giờ chốt mỗi ngày của học sinh — thầy chốt 21/09); thầy vẫn đổi được, và xoá trắng thì máy chủ tự đặt như cũ.
  const [hanMoi, setHanMoi] = useState(() => hanMacDinhVN(Date.now()))
  const [suaHan, setSuaHan] = useState<Record<string,string>>({})
  const [dangSua, setDangSua] = useState('')
  const [xacNhan,setXacNhan]=useState<{text:string;run:()=>Promise<void>}|null>(null)
  const nowHocTap = useGioHocTap()
  const [theoDoi, setTheoDoi] = useState<DongTheoDoiBtvn[]>([])

  const nap = useCallback(async () => {
    setDangNap(true)
    setBao(null)
    try {
      const url = (await loadScriptUrl()) ?? ''
      const mat = (await loadTeacherSecret()) ?? ''
      const ch = await layCauHinhMayChu()
      if (!ch.URL) throw new Error('Chưa có địa chỉ máy chủ mới')

      const [ca, em] = await Promise.all([
        url && mat ? danhSachCa(url, mat) : Promise.resolve([]),
        url && mat ? danhSachEm(url, mat).catch(() => []) : Promise.resolve([]),
      ])
      setDsCa(ca)
      setDsEm(em)

      // KHO ĐỀ đọc từ máy chủ mới. Kho rỗng nghĩa là thầy chưa bấm "Chuyển KHO
      // ĐỀ" trong Cài đặt — nói thẳng câu ấy, đừng để thầy nhìn ô chọn trống mà
      // đoán.
      const res = await fetch(`${ch.URL}/kho/danh-sach`, {
        method: 'POST',
        headers: { 'content-type': 'application/json', 'x-ma-bi-mat': mat },
        body: JSON.stringify({}),
      })
      const j = res.ok ? ((await res.json()) as { ok?: boolean; items?: DeKho[] }) : null
      setDsDe(j?.ok && Array.isArray(j.items) ? j.items : [])

      // Kho trên MÁY THẦY — cùng nguồn màn Mở ca đọc.
      setNguonKho(await loadExamSources())

      setTheoDoi(await theoDoiBtvn(ch, mat))
    } catch (e) {
      setBao({ ok: false, chu: e instanceof Error ? e.message : 'Không nạp được' })
    } finally {
      setDangNap(false)
    }
  }, [])

  useEffect(() => {
    void nap()
  }, [nap])

  const taiLuotCa = useCallback(async (cacMaCa: string[]) => {
    try {
      const mat = (await loadTeacherSecret()) ?? ''
      const ch = await layCauHinhMayChu()
      if (!ch.URL || !mat) return
      const canTai = cacMaCa.filter((m) => !luotCacCa[m])
      if (canTai.length === 0) return
      setDangTaiLuot(true)
      const kq: Record<string, { sbd: string; hoTen: string; diem?: number | null; nopLuc?: string }[]> = {}
      for (const m of canTai) {
        const ds = await luotCuaCaMoi(ch, mat, m)
        if (ds) {
          kq[m] = ds.map((x) => ({
            sbd: String(x.sbd ?? ''),
            hoTen: String(x.ho_ten ?? x.hoTen ?? ''),
            diem: x.diem !== undefined && x.diem !== null ? Number(x.diem) : null,
            nopLuc: x.nop_luc ? String(x.nop_luc) : undefined,
          }))
        }
      }
      setLuotCacCa((prev) => ({ ...prev, ...kq }))

    } catch {
      // bỏ qua lỗi đọc lượt
    } finally {
      setDangTaiLuot(false)
    }
  }, [luotCacCa])

  const batCa = (maCa: string) => {
    const m = new Set(caChon)
    if (m.has(maCa)) {
      m.delete(maCa)
    } else {
      m.add(maCa)
      void taiLuotCa([maCa])
    }
    setCaChon(m)
  }

  const chonTatCaCa = () => {
    if (caChon.size === dsCa.length) {
      setCaChon(new Set())
    } else {
      const tatCa = new Set(dsCa.map((c) => c.maCa))
      setCaChon(tatCa)
      void taiLuotCa(dsCa.map((c) => c.maCa))
    }
  }

  const chuyenSangHocSinh = () => {
    setCheDo('hoc_sinh')
    if (caChon.size > 0) {
      void taiLuotCa(Array.from(caChon))
    }
  }

  // Danh sách học sinh của các ca đã tick:
  const dsHsTrongCa = useMemo(() => {
    const map = new Map<string, { sbd: string; hoTen: string; lop?: string; diem?: number | null; maCa?: string }>()
    for (const ma of caChon) {
      const ca = dsCa.find((c) => c.maCa === ma)
      const luot = luotCacCa[ma] ?? []
      for (const l of luot) {
        if (!map.has(l.sbd)) {
          map.set(l.sbd, { sbd: l.sbd, hoTen: l.hoTen, lop: ca?.lop || '', diem: l.diem, maCa: ma })
        }
      }
      if (luot.length === 0) {
        for (const e of dsEm) {
          if (e.caGanNhat === ma && !map.has(e.sbd)) {
            map.set(e.sbd, { sbd: e.sbd, hoTen: e.hoTen, lop: e.lop || ca?.lop || '', diem: e.diemGanNhat, maCa: ma })
          }
        }
      }
    }
    return Array.from(map.values())
  }, [caChon, luotCacCa, dsCa, dsEm])

  const dsTheoLop=useMemo(()=>dsEm.filter(e=>khoiTuNamSinh(e.namSinh)===Number(khoiGui)),[dsEm,khoiGui])
  const dsHsHienThi=useMemo(()=>{
    const norm=(v:string)=>v.normalize('NFD').replace(/[\u0300-\u036f]/g,'').replace(/đ/g,'d').toLowerCase()
    const q=norm(timKiemHs.trim())
    return dsEm.filter(e=>(!khoiThem || khoiTuNamSinh(e.namSinh)===Number(khoiThem)) && norm(`${e.hoTen} ${e.sbd}`).includes(q))
  },[dsEm,khoiThem,timKiemHs])
  const sbdThem=Array.from(sbdChon).filter(sbd=>!dsHsTrongCa.some(e=>e.sbd===sbd))
  // Người nhận bài (cho Xem trước phân bổ): đúng những em `giao()` sẽ gửi — em có lượt trong các ca đã tick (+ em chọn thêm), cả lớp theo khối, hoặc từng em đã chọn.
  const dsSbdNhan = useMemo(
    () => (cheDo === 'hoc_sinh' ? dsTheoLop.map((e) => e.sbd) : cheDo === 'theo_em' ? Array.from(sbdChonTheoEm) : Array.from(new Set([...dsHsTrongCa.map((e) => e.sbd), ...(chonRieng ? Array.from(sbdChon) : [])]))),
    [cheDo, dsTheoLop, sbdChonTheoEm, dsHsTrongCa, chonRieng, sbdChon],
  )

  const toggleSbd = (sbd: string) => {
    setSbdChon((prev) => {
      const m = new Set(prev)
      if (m.has(sbd)) m.delete(sbd)
      else m.add(sbd)
      return m
    })
  }

  const chonTatCaHsHienThi = () => {
    setSbdChon((prev) => {
      const m = new Set(prev)
      for (const e of dsHsHienThi) m.add(e.sbd)
      return m
    })
  }

  const boChonHsHienThi = () => {
    setSbdChon((prev) => {
      const m = new Set(prev)
      for (const e of dsHsHienThi) m.delete(e.sbd)
      return m
    })
  }

  const dsHsTheoEmHienThi = useMemo(() => {
    const norm = (v: string) => v.normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/đ/g, 'd').toLowerCase()
    const q = norm(timKiemTheoEm.trim())
    return dsEm.filter((e) => {
      const khoi = khoiTuNamSinh(e.namSinh)
      const khopKhoi = !khoiTheoEm || khoi === Number(khoiTheoEm) || (e.lop && e.lop.startsWith(khoiTheoEm))
      const khopTim = !q || norm(`${e.hoTen} ${e.sbd} ${e.lop || ''}`).includes(q)
      return khopKhoi && khopTim
    })
  }, [dsEm, khoiTheoEm, timKiemTheoEm])

  const toggleSbdTheoEm = (sbd: string) => {
    setSbdChonTheoEm((prev) => {
      const m = new Set(prev)
      if (m.has(sbd)) m.delete(sbd)
      else m.add(sbd)
      return m
    })
  }

  const chonTatCaTheoEm = () => {
    setSbdChonTheoEm((prev) => {
      const m = new Set(prev)
      for (const e of dsHsTheoEmHienThi) m.add(e.sbd)
      return m
    })
  }

  const boChonTheoEm = () => {
    setSbdChonTheoEm((prev) => {
      const m = new Set(prev)
      for (const e of dsHsTheoEmHienThi) m.delete(e.sbd)
      return m
    })
  }

  // CHỈ HIỆN NHỮNG TỜ MÁY CHỦ ĐÃ CÓ. Kho trên máy thầy nhiều hơn kho đã chuyển
  // sang máy chủ; cho tick một tờ máy chủ chưa có thì bấm Giao mới báo lỗi —
  // muộn, và thầy không biết vì sao.
  const maTrenMayChu = useMemo(() => new Set(dsDe.map((d) => d.maDe)), [dsDe])
  const nguonGiaoDuoc = useMemo(() => nguonKho.filter((s) => maTrenMayChu.has(s.maDe)), [nguonKho, maTrenMayChu])
  const soChuaChuyen = nguonKho.length - nguonGiaoDuoc.length
  const dsDeTach = useMemo(() => tachNhieuTheoPhan(nguonGiaoDuoc), [nguonGiaoDuoc])
  // Số câu của đúng những mã đã tick — mã đã tách thì chỉ đếm phần của nó.
  const tongCauDaChon = useMemo(
    () => dsDeTach.filter((d) => daChon.has(d.maDe)).reduce((t, d) => t + d.phanI.length + d.phanII.length + d.phanIII.length, 0),
    [dsDeTach, daChon],
  )

  // Các câu của những tờ đề đã tick (thứ tự thầy tick → thứ tự kho), kèm dạng/mức/sao đọc trên MÁY THẦY.
  const cauDaChon = useMemo(() => {
    const theoMa = new Map(dsDeTach.map((d) => [d.maDe, d]))
    return taoCauGiao([...daChon].map((m) => theoMa.get(m)).filter((d): d is TeacherExamSource => Boolean(d)))
  }, [dsDeTach, daChon])
  // Ghim chỉ giữ câu còn thuộc các tờ đề đang tick (đổi đề thì câu ghim không còn trong bài tự rơi ra).
  const ghimHopLe = useMemo(() => ghim.filter((q) => cauDaChon.some((c) => c.qid === q)).slice(0, 10), [ghim, cauDaChon])

  async function capNhatHocSinh(t:DongTheoDoiBtvn,sbd:string,hanhDong:'reset'|'thu-hoi') {
    setDangSua(t.maBtvn)
    try{const ch=await layCauHinhMayChu(),mat=(await loadTeacherSecret())||'';await suaGiaoBtvn(ch,mat,(t as NhomBtvn).maTheoSbd?.[sbd]||t.maBtvn,{sbd,hanhDong});setTheoDoi(await theoDoiBtvn(ch,mat));setBao({ok:true,chu:hanhDong==='reset'?'Đã mở lại bài cho học sinh.':'Đã thu hồi bài của học sinh.'})}
    catch(e){setBao({ok:false,chu:e instanceof Error?e.message:'Chưa cập nhật được.'})}finally{setDangSua('')}
  }

  /** CHO LÀM LẠI một em của bài CÁ NHÂN HOÁ (thầy chốt 21/09): lệnh riêng /btvn/cho-lam-lai, báo ĐÚNG kết quả máy chủ (chưa có lệnh / quá hạn / chưa chắc ⇒ lời thật). */
  async function choLamLai(t:DongTheoDoiBtvn,sbd:string) {
    setDangSua(t.maBtvn)
    const ten=t.hocSinh?.find((e)=>e.sbd===sbd)?.hoTen||`SBD ${sbd}`
    try{
      const kq=await choLamLaiBtvn((t as NhomBtvn).maTheoSbd?.[sbd]||t.maBtvn,sbd)
      setBao({ok:true,chu:`Đã cho ${ten} làm lại${kq.soLanLam?` (lượt làm thứ ${kq.soLanLam})`:''}: em làm lại từ chặng 1, cùng bộ câu, hạn nộp không đổi.`})
    }catch(e){setBao({ok:false,chu:e instanceof Error?e.message:'Chưa cho em làm lại được.'})}
    try{const ch=await layCauHinhMayChu(),mat=(await loadTeacherSecret())||'';setTheoDoi(await theoDoiBtvn(ch,mat))}catch{/* danh sách giữ nguyên; thông báo trên đã nói kết quả */}
    setDangSua('')
  }

  async function capNhatBai(t:DongTheoDoiBtvn,thuHoi=false) {
    setDangSua(t.maBtvn)
    try {
      const ch=await layCauHinhMayChu(), mat=(await loadTeacherSecret())||''
      if(!thuHoi && !suaHan[t.maBtvn])throw new Error('Thầy chọn ngày giờ hạn nộp trước.')
      for (const original of (t as NhomBtvn).baiGoc||[t]) await suaGiaoBtvn(ch,mat,original.maBtvn,thuHoi?{thuHoi:true}:{hanNop:hanNhapVietNam(suaHan[t.maBtvn], nowHocTap)})
      setTheoDoi(await theoDoiBtvn(ch,mat))
      setBao({ok:true,chu:thuHoi?'Đã thu hồi bài. Kết quả đã nộp được giữ nguyên.':'Đã cập nhật hạn nộp cho học sinh.'})
    } catch(e){setBao({ok:false,chu:e instanceof Error?e.message:'Chưa cập nhật được.'})}
    finally{setDangSua('')}
  }

  async function giao() {
    setDangGiao(true)
    setBao(null)
    try {
      const mat = (await loadTeacherSecret()) ?? ''
      const ch = await layCauHinhMayChu()
      const dsSbdGui = cheDo === 'hoc_sinh'
        ? dsTheoLop.map(e => e.sbd)
        : cheDo === 'theo_em'
        ? Array.from(sbdChonTheoEm)
        : undefined
      if (dsSbdGui && dsSbdGui.length === 0) throw new Error('Chưa có học sinh được chọn.')
      const dsCaGui = cheDo === 'hoc_sinh' || cheDo === 'theo_em' ? [] : [...caChon]
      setCanhBaoNangDo('')
      const nangDo = caNhan && cauDaChon.length > 0 ? { cau: cauDaChon, ghim: ghimHopLe, hatGiong: hatGiongRef.current } : undefined
      const kq = await giaoBtvn(ch, mat, dsCaGui, [...daChon], dsSbdGui, hanMoi ? hanNhapVietNam(hanMoi, nowHocTap) : undefined, cheDo === 'ca' && chonRieng ? [...sbdChon] : undefined, nangDo)
      // Máy chủ chưa hỗ trợ nâng đỡ thì bỏ qua các trường lạ và giao NHƯ CŨ — nói thật, không để thầy tưởng mỗi em một bộ.
      const canh: string[] = []
      if (nangDo && kq.caNhan !== true) canh.push(`Máy chủ chưa hỗ trợ cá nhân hoá — bài này đã giao NHƯ CŨ: cả lớp nhận đủ ${kq.soCau} câu, không phân bổ riêng từng em.`)
      else if (nangDo) canh.push(...canhBaoTuMayChu(kq))
      setCanhBaoNangDo(canh.join(' '))
      const noiDungNangDo = nangDo && kq.caNhan === true ? ` Mỗi em một bộ riêng, lõi chung ${kq.soLoi ?? 0} câu.` : ''
      if (nangDo) hatGiongRef.current = taoHatGiong() // hộp thoại giao kế tiếp có hạt giống mới
      const boQua = kq.caRong && kq.caRong.length > 0 ? ` Bỏ qua ${kq.caRong.length} ca chưa em nào vào thi: ${kq.caRong.join(', ')}.` : ''
      const noiDungCa = kq.soCa ? ` ở ${kq.soCa} ca` : ''
      setBao({
        ok: true,
        chu: `Đã giao ${kq.soCau} câu (${daChon.size} tờ đề) cho ${kq.soEm} em${noiDungCa}.${noiDungNangDo} Hạn nộp ${gioVN(kq.hanNop)}.${boQua}`,
      })
      // Kho trên MÁY THẦY — cùng nguồn màn Mở ca đọc.
      setNguonKho(await loadExamSources())

      setTheoDoi(await theoDoiBtvn(ch, mat))
      setXemTruoc(false)
      setTabBtvn('theodoi')
    } catch (e) {
      setBao({ ok: false, chu: e instanceof Error ? e.message : 'Không giao được' })
    } finally {
      setDangGiao(false)
    }
  }

  return (
    <div className="w-full max-w-full min-w-0 flex flex-col" style={{ gap: 'var(--k3)' }}>
      {xacNhan&&<div style={{position:'fixed',inset:0,zIndex:10000,background:'var(--phu)',display:'grid',placeItems:'center',padding:20}}>
        <div role="dialog" aria-modal="true" aria-labelledby="confirm-homework" style={{width:'100%',maxWidth:440,padding:24,borderRadius:22,background:'var(--the)',color:'var(--muc)',boxShadow:'var(--bong-2)'}}>
          <h2 id="confirm-homework" style={{fontSize:20,fontWeight:700}}>Xác nhận thay đổi bài tập</h2>
          <p style={{margin:'16px 0',lineHeight:1.7}}>{xacNhan.text}</p>
          <div style={{display:'flex',gap:12,justifyContent:'flex-end'}}>
            <button autoFocus className="btn-google-outlined" onClick={()=>setXacNhan(null)}>Hủy</button>
            <button style={{padding:'10px 18px',borderRadius:12,background:'var(--gg-xanh)',color:'var(--muc-nguoc)',fontWeight:700}} onClick={()=>{const action=xacNhan.run;setXacNhan(null);void action()}}>Xác nhận</button>
          </div>
        </div>
      </div>}
      {/* THANH TAB CHUYỂN ĐỔI CHUẨN GOOGLE MATERIAL 3 */}
      <div className="flex items-center gap-2 p-1.5 bg-slate-100 dark:bg-slate-800/80 rounded-2xl w-full max-w-md border border-slate-200/80 dark:border-slate-700/80 shadow-2xs">
        <button
          type="button"
          onClick={() => setTabBtvn('giao')}
          className={`flex-1 py-2 px-3.5 rounded-xl text-xs sm:text-sm font-bold flex items-center justify-center gap-2 transition-all cursor-pointer ${
            tabBtvn === 'giao'
              ? 'bg-white dark:bg-slate-700 text-[color:var(--m3-primary)] dark:text-blue-400 shadow-xs ring-1 ring-black/5 dark:ring-white/10'
              : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
          }`}
        >
          <Send size={16} /> Giao bài mới
        </button>
        <button
          type="button"
          onClick={() => setTabBtvn('theodoi')}
          className={`flex-1 py-2 px-3.5 rounded-xl text-xs sm:text-sm font-bold flex items-center justify-center gap-2 transition-all cursor-pointer ${
            tabBtvn === 'theodoi'
              ? 'bg-white dark:bg-slate-700 text-[color:var(--m3-primary)] dark:text-blue-400 shadow-xs ring-1 ring-black/5 dark:ring-white/10'
              : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
          }`}
        >
          <ClipboardCheck size={16} /> Đợt bài đã giao
          {nhomBtvn(theoDoi).length > 0 && (
            <span className="px-2 py-0.5 text-[11px] rounded-full bg-blue-100 dark:bg-blue-950 text-[color:var(--m3-primary)] dark:text-blue-300 font-bold ml-0.5">
              {nhomBtvn(theoDoi).length}
            </span>
          )}
        </button>
      </div>

      {/* TAB 1: GIAO BÀI MỚI */}
      {tabBtvn === 'giao' && (
        <div className="w-full max-w-full min-w-0 flex flex-col gap-4">
          {/* BƯỚC 1: NGƯỜI NHẬN */}
          <div className="p-4 sm:p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/90 dark:border-slate-800 shadow-2xs space-y-3.5">
            <div className="flex items-center justify-between gap-2 flex-wrap">
              <h2 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <span className="w-6 h-6 rounded-full bg-blue-100 dark:bg-blue-950 text-[color:var(--m3-primary)] dark:text-blue-300 text-xs flex items-center justify-center font-bold">
                  1
                </span>
                Người nhận bài tập
              </h2>
              {/* LỰA CHỌN HÌNH THỨC GIAO BÀI */}
              <div className="flex items-center gap-1.5 p-1 bg-slate-100 dark:bg-slate-800 rounded-xl border border-slate-200/80 dark:border-slate-700/80">
                <button
                  type="button"
                  onClick={() => setCheDo('ca')}
                  className={`text-xs font-bold inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg transition-all cursor-pointer ${
                    cheDo === 'ca'
                      ? 'bg-white dark:bg-slate-700 text-[color:var(--m3-primary)] dark:text-blue-400 shadow-xs ring-1 ring-black/5'
                      : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
                  }`}
                >
                  <Users size={15} /> Theo ca thi
                </button>
                <button
                  type="button"
                  onClick={chuyenSangHocSinh}
                  className={`text-xs font-bold inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg transition-all cursor-pointer ${
                    cheDo === 'hoc_sinh'
                      ? 'bg-white dark:bg-slate-700 text-[color:var(--m3-primary)] dark:text-blue-400 shadow-xs ring-1 ring-black/5'
                      : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
                  }`}
                >
                  <UserCheck size={15} /> Gửi theo khối lớp
                </button>
                <button
                  type="button"
                  onClick={() => setCheDo('theo_em')}
                  className={`text-xs font-bold inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg transition-all cursor-pointer ${
                    cheDo === 'theo_em'
                      ? 'bg-white dark:bg-slate-700 text-[color:var(--m3-primary)] dark:text-blue-400 shadow-xs ring-1 ring-black/5'
                      : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
                  }`}
                >
                  <GraduationCap size={15} /> Theo em
                </button>
              </div>
            </div>

            {cheDo === 'ca' && (
              <div className="space-y-2.5">
                <div className="flex items-center justify-between gap-2">
                  <span className="text-xs text-slate-500 dark:text-slate-400">
                    Tick chọn một hoặc nhiều ca đã thi để giao bài:
                  </span>
                  {dsCa.length > 1 && (
                    <button
                      type="button"
                      onClick={chonTatCaCa}
                      className="text-xs font-bold text-[color:var(--m3-primary)] dark:text-blue-400 hover:underline cursor-pointer"
                    >
                      {caChon.size === dsCa.length ? 'Bỏ chọn tất cả' : 'Chọn tất cả ca'}
                    </button>
                  )}
                </div>

                {dsCa.length === 0 ? (
                  <div className="text-xs text-slate-400 py-3 text-center">
                    {dangNap ? 'Đang lấy danh sách ca…' : 'Chưa có ca nào đã thi.'}
                  </div>
                ) : (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 max-h-60 overflow-y-auto pr-1">
                    <NhomCaThuGon ds={dsCa} selected={c=>caChon.has(c.maCa)} render={(c) => {
                      const chon = caChon.has(c.maCa)
                      return (
                        <button
                          key={c.maCa}
                          type="button"
                          onClick={() => batCa(c.maCa)}
                          className={`p-3 rounded-xl border text-left flex items-center gap-3 transition-all cursor-pointer ${
                            chon
                              ? 'bg-blue-50/70 dark:bg-blue-950/40 border-blue-300 dark:border-blue-700 text-blue-900 dark:text-blue-100 shadow-2xs'
                              : 'bg-slate-50/60 dark:bg-slate-800/40 border-slate-200/80 dark:border-slate-700/80 hover:bg-slate-100/80 dark:hover:bg-slate-800'
                          }`}
                          aria-pressed={chon}
                        >
                          <span className={chon ? 'text-[color:var(--m3-primary)] dark:text-blue-400' : 'text-slate-400'}>
                            {chon ? <CheckSquare size={18} /> : <Square size={18} />}
                          </span>
                          <span className="min-w-0 flex-1">
                            <span className="block text-xs sm:text-sm font-bold truncate text-slate-800 dark:text-slate-100">
                              {c.tenCa || `Ca ${c.maCa}`}
                            </span>
                            <span className="block text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
                              {c.maCa}{c.lop ? ` · Lớp ${c.lop}` : ''} · <b className="font-semibold text-slate-700 dark:text-slate-300">{c.daNop}/{c.daVao}</b> nộp
                              {c.moLuc ? ` · ${gioVN(c.moLuc)}` : ''}
                            </span>
                          </span>
                        </button>
                      )
                    }}/>
                  </div>
                )}

                {/* THÔNG TIN CA ĐÃ CHỌN & NÚT CHỌN THÊM */}
                <div className="flex items-center justify-between flex-wrap gap-2 pt-1 border-t border-slate-100 dark:border-slate-800 text-xs">
                  <span className="text-slate-600 dark:text-slate-400">
                    Đã chọn <b className="text-slate-800 dark:text-slate-200">{caChon.size}</b> ca ·{' '}
                    <b className="text-slate-800 dark:text-slate-200">
                      {dsCa.filter((c) => caChon.has(c.maCa)).reduce((t, c) => t + c.daVao, 0)}
                    </b> lượt vào thi
                  </span>
                  <label className="inline-flex items-center gap-2 cursor-pointer font-bold text-[color:var(--m3-primary)] dark:text-blue-400 select-none">
                    <input
                      type="checkbox"
                      checked={chonRieng}
                      onChange={(e) => setChonRieng(e.target.checked)}
                      className="w-4 h-4 rounded text-blue-600 focus:ring-blue-500 cursor-pointer"
                    />
                    Chọn thêm học sinh ngoài ca
                  </label>
                </div>

                {/* KHUNG CHỌN THÊM HỌC SINH */}
                {chonRieng && (
                  <div className="p-3 sm:p-4 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50/70 dark:bg-slate-800/50 space-y-3 mt-2">
                    <div className="flex items-center justify-between flex-wrap gap-2">
                      <div>
                        <div className="text-xs font-bold text-slate-800 dark:text-slate-200">
                          Chọn thêm học sinh ngoài các ca đã chọn
                        </div>
                        <div className="text-[11px] text-slate-500">
                          Đã chọn thêm: <b className="text-[color:var(--m3-primary)]">{sbdThem.length}</b> em
                        </div>
                      </div>
                      <div className="flex items-center gap-2 text-xs">
                        <button
                          type="button"
                          onClick={chonTatCaHsHienThi}
                          className="font-bold text-[color:var(--m3-primary)] hover:underline cursor-pointer"
                        >
                          Chọn tất cả ({dsHsHienThi.length})
                        </button>
                        <span className="text-slate-300 dark:text-slate-600">|</span>
                        <button
                          type="button"
                          onClick={boChonHsHienThi}
                          className="font-bold text-slate-500 hover:underline cursor-pointer"
                        >
                          Bỏ chọn
                        </button>
                      </div>
                    </div>

                    {/* BỘ LỌC KHỐI VÀ TÌM KIẾM */}
                    <div className="flex items-center gap-2 flex-wrap">
                      <div className="flex items-center gap-1" aria-label="Lọc khối">
                        {['', '10', '11', '12'].map((k) => {
                          const chon = khoiThem === k
                          return (
                            <button
                              key={k}
                              type="button"
                              onClick={() => setKhoiThem(k)}
                              className={`text-xs font-bold px-3 py-1 rounded-full transition-all cursor-pointer ${
                                chon
                                  ? 'bg-[color:var(--m3-primary)] text-[color:var(--m3-on-primary)] shadow-2xs'
                                  : 'bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700 hover:bg-slate-100'
                              }`}
                            >
                              {k ? `Khối ${k}` : 'Tất cả'}
                            </button>
                          )
                        })}
                      </div>
                      <div className="relative flex-1 min-w-[180px]">
                        <input
                          type="text"
                          value={timKiemHs}
                          onChange={(e) => setTimKiemHs(e.target.value)}
                          placeholder="Tìm tên hoặc số báo danh…"
                          className="w-full h-8 pl-8 pr-3 text-xs rounded-full border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-100 focus:ring-2 focus:ring-blue-500 focus:outline-none"
                        />
                        <Search size={14} className="absolute left-2.5 top-2 text-slate-400 pointer-events-none" />
                      </div>
                    </div>

                    {/* DANH SÁCH CUỘN HỌC SINH */}
                    {dangTaiLuot && <div className="text-xs text-slate-400 py-1 text-center">Đang tải danh sách lượt...</div>}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5 max-h-48 overflow-y-auto pr-1">
                      {dsHsHienThi.map((e) => {
                        const trongCa = dsHsTrongCa.some((h) => h.sbd === e.sbd)
                        const tich = trongCa || sbdChon.has(e.sbd)
                        return (
                          <button
                            key={e.sbd}
                            type="button"
                            role="checkbox"
                            aria-checked={tich}
                            disabled={trongCa}
                            onClick={() => toggleSbd(e.sbd)}
                            className={`p-2 rounded-lg border text-left flex items-center gap-2.5 transition-all text-xs cursor-pointer ${
                              tich
                                ? 'bg-blue-50 dark:bg-blue-950/40 border-blue-300 dark:border-blue-700 text-blue-900 dark:text-blue-100'
                                : 'bg-white dark:bg-slate-800 border-slate-200/80 dark:border-slate-700 hover:bg-slate-50'
                            }`}
                          >
                            <span className={tich ? 'text-[color:var(--m3-primary)]' : 'text-slate-400'}>
                              {tich ? <CheckSquare size={16} /> : <Square size={16} />}
                            </span>
                            <span className="flex-1 truncate font-medium text-slate-800 dark:text-slate-200">
                              {e.hoTen || `Học sinh ${e.sbd}`}
                              <span className="text-[11px] text-slate-400 ml-1.5 font-mono">({e.sbd})</span>
                            </span>
                            {trongCa && (
                              <span className="text-[10px] px-1.5 py-0.5 rounded bg-blue-100 dark:bg-blue-900 text-blue-700 dark:text-blue-300 font-bold shrink-0">
                                Trong ca
                              </span>
                            )}
                          </button>
                        )
                      })}
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* KHI CHỌN GỬI THEO KHỐI LỚP */}
            {cheDo === 'hoc_sinh' && (
              <div className="p-4 rounded-xl border border-blue-200 dark:border-blue-800/80 bg-blue-50/40 dark:bg-blue-950/20 space-y-3">
                <div className="flex items-center gap-3 flex-wrap">
                  <span className="text-xs font-bold text-slate-800 dark:text-slate-200">Chọn khối lớp nhận bài:</span>
                  <div className="flex items-center gap-1.5">
                    {['10', '11', '12'].map((k) => {
                      const chon = khoiGui === k
                      return (
                        <button
                          key={k}
                          type="button"
                          onClick={() => setKhoiGui(k)}
                          className={`text-xs font-bold px-4 py-1.5 rounded-full transition-all cursor-pointer ${
                            chon
                              ? 'bg-[color:var(--m3-primary)] text-[color:var(--m3-on-primary)] shadow-2xs ring-2 ring-blue-400/30'
                              : 'bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700 hover:bg-slate-100'
                          }`}
                        >
                          Lớp {k}
                        </button>
                      )
                    })}
                  </div>
                </div>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  Sẽ giao cho <b className="text-[color:var(--m3-primary)] font-bold">{dsTheoLop.length}</b> học sinh thuộc Khối {khoiGui}.
                </p>
              </div>
            )}

            {/* KHI CHỌN GIAO THEO EM */}
            {cheDo === 'theo_em' && (
              <div className="p-3 sm:p-4 rounded-xl border border-blue-200/80 dark:border-blue-800/80 bg-blue-50/30 dark:bg-blue-950/20 space-y-3">
                <div className="flex items-center justify-between flex-wrap gap-2">
                  <div>
                    <div className="text-xs font-bold text-slate-800 dark:text-slate-200">
                      Chọn học sinh nhận bài tập
                    </div>
                    <div className="text-[11px] text-slate-500">
                      Đã chọn: <b className="text-[color:var(--m3-primary)] dark:text-blue-400 font-bold">{sbdChonTheoEm.size}</b> / {dsEm.length} em
                    </div>
                  </div>
                  <div className="flex items-center gap-2 text-xs">
                    <button
                      type="button"
                      onClick={chonTatCaTheoEm}
                      className="font-bold text-[color:var(--m3-primary)] hover:underline cursor-pointer"
                    >
                      Chọn tất cả ({dsHsTheoEmHienThi.length})
                    </button>
                    <span className="text-slate-300 dark:text-slate-600">|</span>
                    <button
                      type="button"
                      onClick={boChonTheoEm}
                      className="font-bold text-slate-500 hover:underline cursor-pointer"
                    >
                      Bỏ chọn
                    </button>
                  </div>
                </div>

                {/* BỘ LỌC KHỐI LỚP VÀ Ô TÌM KIẾM */}
                <div className="flex items-center gap-2 flex-wrap">
                  <div className="flex items-center gap-1" aria-label="Lọc khối lớp">
                    {['', '10', '11', '12'].map((k) => {
                      const chon = khoiTheoEm === k
                      return (
                        <button
                          key={k}
                          type="button"
                          onClick={() => setKhoiTheoEm(k)}
                          className={`text-xs font-bold px-3 py-1 rounded-full transition-all cursor-pointer ${
                            chon
                              ? 'bg-[color:var(--m3-primary)] text-[color:var(--m3-on-primary)] shadow-2xs'
                              : 'bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700 hover:bg-slate-100'
                          }`}
                        >
                          {k ? `Lớp ${k}` : 'Tất cả'}
                        </button>
                      )
                    })}
                  </div>
                  <div className="relative flex-1 min-w-[180px]">
                    <input
                      type="text"
                      value={timKiemTheoEm}
                      onChange={(e) => setTimKiemTheoEm(e.target.value)}
                      placeholder="Tìm tên hoặc số báo danh…"
                      className="w-full h-8 pl-8 pr-3 text-xs rounded-full border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-100 focus:ring-2 focus:ring-blue-500 focus:outline-none"
                    />
                    <Search size={14} className="absolute left-2.5 top-2 text-slate-400 pointer-events-none" />
                  </div>
                </div>

                {/* DANH SÁCH CUỘN HỌC SINH */}
                {dsHsTheoEmHienThi.length === 0 ? (
                  <div className="text-xs text-slate-400 py-3 text-center">
                    {dsEm.length === 0 ? 'Chưa có dữ liệu học sinh.' : 'Không tìm thấy học sinh phù hợp.'}
                  </div>
                ) : (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5 max-h-56 overflow-y-auto pr-1">
                    {dsHsTheoEmHienThi.map((e) => {
                      const tich = sbdChonTheoEm.has(e.sbd)
                      const khoi = khoiTuNamSinh(e.namSinh)
                      return (
                        <button
                          key={e.sbd}
                          type="button"
                          role="checkbox"
                          aria-checked={tich}
                          onClick={() => toggleSbdTheoEm(e.sbd)}
                          className={`p-2 rounded-lg border text-left flex items-center gap-2.5 transition-all text-xs cursor-pointer ${
                            tich
                              ? 'bg-blue-50/80 dark:bg-blue-950/40 border-blue-300 dark:border-blue-700 text-blue-900 dark:text-blue-100 font-medium shadow-2xs'
                              : 'bg-white dark:bg-slate-800/80 border-slate-200/80 dark:border-slate-700/80 hover:bg-slate-50 dark:hover:bg-slate-800'
                          }`}
                        >
                          <span className={tich ? 'text-[color:var(--m3-primary)] dark:text-blue-400' : 'text-slate-400'}>
                            {tich ? <CheckSquare size={16} /> : <Square size={16} />}
                          </span>
                          <span className="min-w-0 flex-1">
                            <span className="font-bold text-slate-800 dark:text-slate-200 truncate block">
                              {e.hoTen || `SBD ${e.sbd}`}
                            </span>
                            <span className="text-[11px] text-slate-500 dark:text-slate-400 block">
                              #{e.sbd}
                              {e.lop ? ` · Lớp ${e.lop}` : khoi ? ` · Khối ${khoi}` : ''}
                            </span>
                          </span>
                        </button>
                      )
                    })}
                  </div>
                )}
              </div>
            )}
          </div>

          {/* BƯỚC 2: NỘI DUNG BÀI TẬP */}
          <div className="p-4 sm:p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/90 dark:border-slate-800 shadow-2xs space-y-3.5">
            <div className="flex items-center justify-between gap-2 flex-wrap">
              <h2 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <span className="w-6 h-6 rounded-full bg-blue-100 dark:bg-blue-950 text-[color:var(--m3-primary)] dark:text-blue-300 text-xs flex items-center justify-center font-bold">
                  2
                </span>
                Nội dung bài tập về nhà
              </h2>
              {daChon.size > 0 && (
                <button
                  type="button"
                  onClick={() => setDaChon(new Set())}
                  className="text-xs font-bold text-[color:var(--m3-primary)] dark:text-blue-400 hover:underline cursor-pointer"
                >
                  Bỏ chọn tất cả ({daChon.size})
                </button>
              )}
            </div>

            {!dangNap && dsDeTach.length === 0 && <OThongBao tone="cam">Chưa có đề sẵn sàng để giao. Thầy kiểm tra kho trên máy và mục Chuyển KHO ĐỀ sang máy chủ mới.</OThongBao>}
            {/* HỘP CHỌN ĐỀ */}
            <div className="w-full overflow-hidden">
              <HopChonDe
                ds={dsDeTach}
                daChon={daChon}
                onChon={(ma) => {
                  const m = new Set(daChon)
                  if (m.has(ma)) m.delete(ma)
                  else m.add(ma)
                  setDaChon(m)
                }}
                chonNhieu
                onChonTatCa={(ma) => setDaChon(new Set(ma))}
              />
            </div>

            {soChuaChuyen > 0 && (
              <p className="text-xs text-amber-600 dark:text-amber-400">
                Ẩn <b>{soChuaChuyen}</b> tờ máy chủ chưa có — vào Cài đặt → Máy chủ mới bấm “Chuyển KHO ĐỀ sang máy chủ mới”.
              </p>
            )}
          </div>

          {/* BƯỚC 3: THỜI HẠN & HOÀN TẤT GIAO */}
          <div className="p-4 sm:p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/90 dark:border-slate-800 shadow-2xs space-y-4">
            <h2 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <span className="w-6 h-6 rounded-full bg-blue-100 dark:bg-blue-950 text-[color:var(--m3-primary)] dark:text-blue-300 text-xs flex items-center justify-center font-bold">
                3
              </span>
              Thời hạn nộp & Hoàn tất
            </h2>

            <div className="flex flex-wrap items-center gap-4 text-xs">
              <label className="flex items-center gap-2 font-bold text-slate-700 dark:text-slate-300">
                <Clock size={16} className="text-slate-400" /> Hạn nộp (giờ Việt Nam):
                <input
                  aria-label="Hạn nộp bài mới"
                  type="datetime-local"
                  value={hanMoi}
                  onChange={(e) => setHanMoi(e.target.value)}
                  style={{ colorScheme: 'light dark' }}
                  className="rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 p-2 text-xs font-semibold text-slate-900 dark:text-white focus:ring-2 focus:ring-blue-500"
                />
              </label>
              <span className="text-slate-500 dark:text-slate-400">
                {hanMoi ? (hanMoi.endsWith('T23:59') ? 'Mặc định 23:59 — giờ chốt mỗi ngày của học sinh (giờ Việt Nam). Học sinh cần nộp trước mốc này.' : 'Áp dụng giờ Việt Nam đã chọn. Học sinh cần nộp trước mốc này.') : '(Để trống: mặc định hạn nộp sau 48 giờ)'}
              </span>
            </div>

            {/* BTVN NÂNG ĐỠ — công tắc Cá nhân hoá + ghim câu + Xem trước phân bổ (bản vẽ docs/ban-ve-btvn-nang-do-2109/) */}
            <KhoiCaNhanHoa bat={caNhan} doi={setCaNhan} cau={cauDaChon} ghim={ghimHopLe} doiGhim={setGhim} onXemTruoc={() => setXemTruoc(true)} />

            {/* TÓM TẮT ĐÃ CHỌN */}
            <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/80 dark:border-slate-700/80 flex items-center justify-between flex-wrap gap-2 text-xs">
              <span className="font-bold text-slate-800 dark:text-slate-200">
                {cheDo === 'ca'
                  ? `Người nhận: ${caChon.size} ca thi ${chonRieng && sbdThem.length > 0 ? `+ ${sbdThem.length} em chọn thêm` : ''}`
                  : cheDo === 'theo_em'
                  ? `Người nhận: ${sbdChonTheoEm.size} học sinh đã chọn`
                  : `Người nhận: Lớp ${khoiGui} (${dsTheoLop.length} học sinh)`}
              </span>
              <span className="font-bold text-[color:var(--m3-primary)] dark:text-blue-400">
                {daChon.size > 0 ? `${daChon.size} tờ đề (${tongCauDaChon} câu)` : 'Chưa chọn tờ đề nào'}
              </span>
            </div>

            {/* THÔNG BÁO LỖI/KẾT QUẢ */}
            {bao && <OThongBao tone={bao.ok ? 'xanh' : 'do'}>{bao.chu}</OThongBao>}
            {canhBaoNangDo && <OThongBao tone="cam">{canhBaoNangDo}</OThongBao>}

            {/* HÀNG NÚT BẤM GIAO BÀI & LÀM MỚI */}
            <div className="flex items-center gap-3 pt-1">
              <button
                type="button"
                onClick={() => void giao()}
                disabled={
                  dangGiao ||
                  (cheDo === 'ca' && caChon.size === 0 && !(chonRieng && sbdChon.size > 0)) ||
                  (cheDo === 'hoc_sinh' && dsTheoLop.length === 0) ||
                  (cheDo === 'theo_em' && sbdChonTheoEm.size === 0) ||
                  daChon.size === 0
                }
                className="flex-1 sm:flex-initial min-h-[46px] px-6 rounded-xl bg-[color:var(--m3-primary)] hover:opacity-90 text-[color:var(--m3-on-primary)] font-bold text-sm inline-flex items-center justify-center gap-2 transition-all shadow-xs active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
              >
                <Send size={18} />
                {dangGiao
                  ? 'Đang giao bài…'
                  : cheDo === 'ca' && caChon.size === 0
                  ? 'Tick chọn ít nhất 1 ca'
                  : cheDo === 'hoc_sinh' && dsTheoLop.length === 0
                  ? 'Không có học sinh trong lớp'
                  : cheDo === 'theo_em' && sbdChonTheoEm.size === 0
                  ? 'Chọn ít nhất 1 học sinh'
                  : daChon.size === 0
                  ? 'Tick chọn ít nhất 1 tờ đề'
                  : `Giao bài tập về nhà (${tongCauDaChon} câu)`}
              </button>

              <button
                type="button"
                onClick={() => void nap()}
                disabled={dangNap}
                className="min-h-[46px] px-4 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 hover:bg-slate-50 text-slate-700 dark:text-slate-200 font-semibold text-xs inline-flex items-center gap-2 transition-all cursor-pointer disabled:opacity-50"
              >
                <RefreshCw size={15} className={dangNap ? 'animate-spin' : ''} />
                Làm mới
              </button>
            </div>
          </div>
        </div>
      )}

      {xemTruoc && (
        <XemTruocPhanBo
          dau={{
            dsMaDe: [...daChon],
            cau: cauDaChon,
            ghim: ghimHopLe,
            hanNop: hanMoi ? hanNhapVietNam(hanMoi, nowHocTap) : new Date(nowHocTap + 48 * 3600_000).toISOString(),
            hatGiong: hatGiongRef.current,
          }}
          dsSbd={dsSbdNhan}
          cau={cauDaChon}
          dangGiao={dangGiao}
          loiGiao={bao && !bao.ok ? bao.chu : ''}
          onDong={() => setXemTruoc(false)}
          onGiao={() => void giao()}
        />
      )}
      {tabBtvn === 'theodoi' && !dangNap && <section aria-label="Bài tập cần theo dõi" className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        {[['Bài chưa nộp đã quá hạn', theoDoi.filter(b => (mocThoiGian(b.hanNop) ?? Infinity) <= nowHocTap).reduce((n,b) => n + b.chuaNop.length, 0)],
          ['Bài chưa nộp đến hạn trong 24 giờ', theoDoi.filter(b => (mocThoiGian(b.hanNop) ?? Infinity) > nowHocTap && (mocThoiGian(b.hanNop) ?? Infinity) <= nowHocTap + 86400_000).reduce((n,b) => n + b.chuaNop.length, 0)],
          ['Lượt bài đã nộp', theoDoi.reduce((n,b) => n + b.daNop, 0)]].map(([label, count]) => <div key={label} className="rounded-2xl border border-slate-200 dark:border-slate-700 p-4 bg-white dark:bg-slate-900"><p className="text-2xl font-bold">{count}</p><p className="text-xs mt-1">{label}</p></div>)}
      </section>}
      {/* TAB 2: ĐỢT BÀI ĐÃ GIAO & THEO DÕI NỘP BÀI */}
      {tabBtvn === 'theodoi' && <KhoiBtvnLo bt={homNay === undefined ? undefined : (homNay?.btvn ?? null)} tai={homNay === undefined} lyDo={homNay?.lyDoThieu?.btvn || 'đang chờ máy chủ'} />}
      {tabBtvn === 'theodoi' && (
        <div className="w-full max-w-full min-w-0 flex flex-col gap-4">
          <div className="flex items-center justify-between gap-3 flex-wrap">
            <div>
              <h2 className="text-base sm:text-lg font-bold text-slate-900 dark:text-white">
                Danh sách bài tập về nhà đã giao
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                Ưu tiên hỗ trợ học sinh chưa nộp bài gần hạn. Gia hạn trước khi mở lại bài đã hết hạn.
              </p>
            </div>
            <button
              type="button"
              onClick={() => void nap()}
              disabled={dangNap}
              className="text-xs font-bold text-[color:var(--m3-primary)] dark:text-blue-400 inline-flex items-center gap-1.5 p-2 rounded-xl bg-blue-50 dark:bg-blue-950/60 border border-blue-200 dark:border-blue-800 hover:bg-blue-100 transition-all cursor-pointer"
            >
              <RefreshCw size={14} className={dangNap ? 'animate-spin' : ''} /> Cập nhật dữ liệu
            </button>
          </div>

          {bao && <OThongBao tone={bao.ok ? 'xanh' : 'do'}>{bao.chu}</OThongBao>}
          {canhBaoNangDo && <OThongBao tone="cam">{canhBaoNangDo}</OThongBao>}
          {dangSua && <p className="text-xs text-blue-600 font-semibold">Đang cập nhật bài tập…</p>}

          {nhomBtvn(theoDoi).length === 0 ? (
            <div className="p-8 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-center space-y-3">
              <div className="w-12 h-12 rounded-full bg-blue-50 dark:bg-blue-950 text-[color:var(--m3-primary)] flex items-center justify-center mx-auto">
                <ClipboardCheck size={24} />
              </div>
              <h3 className="text-sm font-bold text-slate-800 dark:text-slate-200">Chưa có bài tập về nhà nào</h3>
              <p className="text-xs text-slate-500 max-w-sm mx-auto">
                Hãy chuyển sang tab &ldquo;Giao bài mới&rdquo; để bắt đầu giao bài tập cho học sinh.
              </p>
              <button
                type="button"
                onClick={() => setTabBtvn('giao')}
                className="mt-2 px-4 py-2 rounded-xl bg-[color:var(--m3-primary)] text-[color:var(--m3-on-primary)] text-xs font-bold inline-flex items-center gap-1.5 shadow-2xs hover:bg-blue-700 cursor-pointer"
              >
                <Send size={14} /> Giao bài mới ngay
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 items-start">
              {nhomBtvn(theoDoi).sort((a,b) => Number(b.chuaNop.length > 0) - Number(a.chuaNop.length > 0) || (mocThoiGian(a.hanNop) ?? Infinity) - (mocThoiGian(b.hanNop) ?? Infinity)).map((t) => {
                const daDu = t.daNop === t.tong
                const quaHan = t.quaHan
                return (
                  <div
                    key={t.maBtvn}
                    className="p-4 sm:p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/90 dark:border-slate-800 shadow-2xs hover:border-blue-300 dark:hover:border-blue-700 transition-all space-y-3.5"
                  >
                    {/* TIÊU ĐỀ & TRẠNG THÁI */}
                    <div className="flex items-start justify-between gap-2">
                      <div className="min-w-0 flex-1">
                        <span className="text-[11px] font-bold text-blue-600 dark:text-blue-400 block mb-0.5">
                          Ca {t.maCa} · {t.soCau} câu{t.caNhan ? ' trong bài' : ''}
                        </span>
                        {t.caNhan && (
                          <p className="bn-theo-doi-nang-do">
                            <span className="bn-chip bn-chip--tot bn-chip--nho">Cá nhân hoá · lõi {t.soLoi ?? 0} câu</span>
                            <span>Điểm mỗi em tính trên số câu của em; so cả lớp CHỈ trên phần lõi.</span>
                          </p>
                        )}
                        <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100 leading-snug">
                          {dinhDangDeCayThuMuc(t.maDe)}
                        </h3>
                        <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-1">
                          Giao lúc {gioVN(t.giaoLuc)}
                          <NhanHanBaiTap han={t.hanNop} now={nowHocTap} daNop={t.chuaNop.length === 0} />
                        </p>
                      </div>
                      <span
                        className={`text-xs font-bold px-2.5 py-1 rounded-full shrink-0 ${
                          daDu
                            ? 'bg-emerald-50 dark:bg-emerald-950/60 text-[color:var(--m3-on-tertiary-container)] border border-emerald-200 dark:border-emerald-800'
                            : quaHan
                            ? 'bg-rose-50 dark:bg-rose-950/60 text-[color:var(--m3-on-error-container)] border border-rose-200 dark:border-rose-800'
                            : 'bg-amber-50 dark:bg-amber-950/60 text-[color:var(--m3-tren-canh-bao)] border border-amber-200 dark:border-amber-800'
                        }`}
                      >
                        {t.daNop}/{t.tong} nộp
                      </span>
                    </div>

                    {/* HÀNG THAO TÁC HẠN NỘP & THU HỒI */}
                    <div className="p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/80 dark:border-slate-700/80 flex flex-wrap items-center gap-2">
                      <input
                        aria-label={`Hạn nộp ${t.maBtvn}`}
                        type="datetime-local"
                        value={
                          suaHan[t.maBtvn] ??
                          hanChoOChon(t.hanNop)
                        }
                        onChange={(e) => setSuaHan((v) => ({ ...v, [t.maBtvn]: e.target.value }))}
                        style={{ colorScheme: 'light dark' }}
                        className="rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 p-1.5 text-xs text-slate-900 dark:text-white font-medium flex-1 min-w-[150px]"
                      />
                      <button
                        disabled={dangSua === t.maBtvn}
                        onClick={() => capNhatBai(t)}
                        className="rounded-lg bg-[color:var(--m3-primary)] hover:bg-blue-700 px-3 py-1.5 text-xs font-bold text-[color:var(--m3-on-primary)] disabled:opacity-50 transition-all cursor-pointer"
                      >
                        Lưu hạn
                      </button>
                      <button
                        disabled={dangSua === t.maBtvn}
                        onClick={() =>
                          setXacNhan({
                            text: `Thu hồi bài này của ${t.tong} học sinh? Kết quả đã nộp vẫn được giữ lại.`,
                            run: () => capNhatBai(t, true),
                          })
                        }
                        className="rounded-lg border border-rose-200 dark:border-rose-800 bg-rose-50 dark:bg-rose-950/50 px-3 py-1.5 text-xs font-bold text-rose-700 dark:text-rose-300 hover:bg-rose-100 disabled:opacity-50 transition-all cursor-pointer"
                      >
                        Thu hồi
                      </button>
                    </div>

                    {/* KHỐI DANH SÁCH HỌC SINH (KÈM DẤU SAO ĐỎ ⭐ PHÁT HIỆN GIAN LẬN ĐẨY LÊN ĐẦU) */}
                    <div className="pt-1">
                      <HocSinhNhanBai
                        maTheoSbd={t.maTheoSbd}
                        bai={t}
                        busy={dangSua === t.maBtvn}
                        onAction={(sbd, action) =>
                          action === 'cho-lam-lai'
                            ? setXacNhan({
                                text: `Cho ${t.hocSinh?.find((e) => e.sbd === sbd)?.hoTen || `học sinh ${sbd}`} làm lại? ${LOI_XAC_NHAN_LAM_LAI}`,
                                run: () => choLamLai(t, sbd),
                              })
                            : setXacNhan({
                                text: `${action === 'reset' ? 'Cho làm lại' : 'Thu hồi bài của'} học sinh ${sbd}? Kết quả cũ được lưu lại.`,
                                run: () => capNhatHocSinh(t, sbd, action),
                              })
                        }
                      />
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </div>
      )}
    </div>
  )
}
