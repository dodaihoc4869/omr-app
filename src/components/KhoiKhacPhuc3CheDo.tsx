import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import {
  Sparkles,
  Clock3,
  FileText,
  ArrowUpRight,
  AlertCircle,
  RefreshCw,
  CheckSquare,
  Square,
  ChevronLeft,
  Trash2,
  Play,
  Award,
  Layers,
  Info,
  ChevronDown,
} from 'lucide-react'
import TheCau from './TheCau'
import { docSoDem } from './DongDemCau'
import {
  danhMucDangBai,
  deTheoDangBai,
  hsCauSaiApi,
  type LopDangBai,
} from '../lib/exam-api'
import { parseKhoDeJson, buildTeacherSourceFromKhoDe } from '../lib/exam-kho-de-import'
import {
  taoDeLamLaiCauSai,
  rutLuyenThemDangCauSai,
  phanTichTyLeDang,
  rutLuyenDangBai,
  demCauDangBai,
  type CauSaiDauVao,
} from '../lib/thuat-toan-rut-cau-sai'
import { cauLuyenTuNguon, type CauLuyen } from '../lib/bai-tap-pdf'
import { hopSao } from '../lib/loc-sao'
import { hopLeDeRut } from '../lib/loc-cau-rut'
import { normalizeNumericAnswer } from '../engine/score'
import { loadScriptUrlHoacMacDinh, loadExamSources } from '../lib/exam-db'
import { layDiaChiMayChu } from '../lib/dia-chi-may-chu'
import { napKhoChoMayEm } from '../lib/kho-cho-may-em'
import type { TeacherExamSource } from '../data/examContent'
import ModalXacNhanNop from './ModalXacNhanNop'
import './m3'
import './m3/luyen-khac-phuc.css'
import NhomCaThuGon from './NhomCaThuGon'

export interface BaiLuyenKhacPhuc {
  id: string
  tieuDe: string
  cheDo: 1 | 2 | 3 | 4
  createdAt: number
  status: 'active' | 'submitted'
  dsCau: CauLuyen[]
  answers: Record<string, string>
  score: number | null
  soCauDung: number
  tongSoCau: number
  submittedAt: number | null
  durationSeconds: number
}

export interface KhoiKhacPhuc3CheDoProps {
  sbd: string
  token?: string
  hoTen: string
  dsLichSu: any[]
  scriptUrl?: string
  vaiTro?: 'hs' | 'ph'
  dsMomGiao?: any[]
  thongBaoMom?: { loai: 'ok' | 'loi'; chu: string } | null
  onGiaoBaiChoCon?: (dsCau: any[], tieuDe: string) => Promise<void> | void
  onXemKetQuaMom?: (bai: any) => void
  initialCheDo?: 1 | 2 | 3 | 4
}

function chamBai(
  dsCau: CauLuyen[],
  answers: Record<string, string>
): { score: number; soCauDung: number; tongSoCau: number } {
  let tongDiemDat = 0
  let tongDiemToiDa = 0
  let soCauDung = 0

  for (const q of dsCau) {
    if (q.phan === 'I') {
      tongDiemToiDa += 1
      const userAns = (answers[q.id] || '').trim().toUpperCase()
      const daDung = (q.dapAn || '').trim().toUpperCase()
      if (userAns && userAns === daDung) {
        tongDiemDat += 1
        soCauDung += 1
      }
    } else if (q.phan === 'II') {
      tongDiemToiDa += 1
      const cleanKey = (q.dapAn || '').replace(/[^DS]/gi, '').toUpperCase()
      const userAns = (answers[q.id] || '').replace(/[^DS]/gi, '').toUpperCase()
      let yDung = 0
      for (let j = 0; j < 4; j++) {
        if (userAns[j] && cleanKey[j] && userAns[j] === cleanKey[j]) {
          yDung++
        }
      }
      if (yDung === 4) {
        tongDiemDat += 1.0
        soCauDung += 1
      } else if (yDung === 3) {
        tongDiemDat += 0.5
      } else if (yDung === 2) {
        tongDiemDat += 0.25
      } else if (yDung === 1) {
        tongDiemDat += 0.1
      }
    } else {
      // Phần III
      tongDiemToiDa += 1
      const userAns = answers[q.id] || ''
      const daDung = q.dapAn || ''
      if (userAns && normalizeNumericAnswer(userAns) === normalizeNumericAnswer(daDung)) {
        tongDiemDat += 1
        soCauDung += 1
      }
    }
  }

  const score = tongDiemToiDa > 0 ? Math.round((tongDiemDat / tongDiemToiDa) * 10 * 100) / 100 : 0
  return { score, soCauDung, tongSoCau: dsCau.length }
}

export default function KhoiKhacPhuc3CheDo({
  sbd,
  token: _token,
  hoTen,
  dsLichSu,
  scriptUrl: scriptUrlProp,
  vaiTro = 'hs',
  dsMomGiao,
  thongBaoMom,
  onGiaoBaiChoCon,
  onXemKetQuaMom,
  initialCheDo,
}: KhoiKhacPhuc3CheDoProps) {
  const [cheDo, setCheDo] = useState<1 | 2 | 3 | 4>(initialCheDo || 1)
  const [dangXuLy, setDangXuLy] = useState(false)
  const [loi, setLoi] = useState('')

  useEffect(() => {
    if (initialCheDo) {
      setCheDo(initialCheDo)
      setLoi('')
    }
  }, [initialCheDo])

  const layUrl = async () =>
    scriptUrlProp || (await layDiaChiMayChu()) || (await loadScriptUrlHoacMacDinh().catch(() => ''))

  // Chế độ 1: Rút từ ca đã thi
  const [cacCaChon, setCacCaChon] = useState<Set<string>>(() => {
    const s = new Set<string>()
    for (const c of dsLichSu) {
      if ((docSoDem(c)?.soCanKhacPhuc ?? 0) > 0) s.add(c.maCa)
    }
    if (s.size === 0 && dsLichSu.length > 0) s.add(dsLichSu[0].maCa)
    return s
  })

  // Chế độ 2: Dạng câu sai — xin kho máy chủ, phân tích tỷ lệ, thanh kéo
  const [khoDe2, setKhoDe2] = useState<TeacherExamSource[]>([])
  const [dangTaiKho2, setDangTaiKho2] = useState(false)
  const [loiKho2, setLoiKho2] = useState('')
  const [soCauCheDo2, setSoCauCheDo2] = useState<number>(20)

  // Chế độ 3: Dạng bài, Chế độ 4: Tự do
  const [dmDangBai, setDmDangBai] = useState<LopDangBai[]>([])
  const [dangTaiDm, setDangTaiDm] = useState(false)
  const [lopChon, setLopChon] = useState('12')
  const [baiChon, setBaiChon] = useState('')
  const [cacDangChon, setCacDangChon] = useState<Set<string>>(new Set())
  const cacheDeRef = useRef<Map<string, TeacherExamSource>>(new Map())
  // Chế độ 4: Cho phép chọn nhiều lựa chọn mức độ
  const [cacMucDoChon, setCacMucDoChon] = useState<Set<string>>(() => new Set(['ngau_nhien']))
  const toggleMucDo = (id: string) => {
    setCacMucDoChon((prev) => {
      if (id === 'ngau_nhien') {
        return new Set(['ngau_nhien'])
      }
      const s = new Set(prev)
      s.delete('ngau_nhien')
      if (s.has(id)) {
        s.delete(id)
      } else {
        s.add(id)
      }
      if (s.size === 0) {
        s.add('ngau_nhien')
      }
      return s
    })
  }
  const [soCauCheDo3, setSoCauCheDo3] = useState<number>(20)
  const [soCauCheDo4, setSoCauCheDo4] = useState<number>(20)
  const [khoDangBai, setKhoDangBai] = useState<TeacherExamSource[]>([])
  const [dangTaiDang, setDangTaiDang] = useState(false)

  // Lịch sử và bài luyện hiện tại
  const historyKey = `ddh.khacphuc.history.${sbd}`
  const [history, setHistory] = useState<BaiLuyenKhacPhuc[]>(() => {
    try {
      const raw = localStorage.getItem(`ddh.khacphuc.history.${sbd}`)
      return raw ? JSON.parse(raw) : []
    } catch {
      return []
    }
  })
  const [currentTest, setCurrentTest] = useState<BaiLuyenKhacPhuc | null>(null)
  const [seconds, setSeconds] = useState<number>(0)
  const [hienXacNhanNop, setHienXacNhanNop] = useState(false)
  const [moDanhSach, setMoDanhSach] = useState(() => {
    if (vaiTro === 'ph') {
      return Boolean(dsMomGiao && dsMomGiao.some((m) => m.trangThai === 'dang_lam'))
    }
    try {
      const raw = localStorage.getItem(`ddh.khacphuc.history.${sbd}`)
      const items: BaiLuyenKhacPhuc[] = raw ? JSON.parse(raw) : []
      return items.some((h) => h.status !== 'submitted')
    } catch {
      return false
    }
  })
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null)

  // Lưu lịch sử vào localStorage
  const luuHistory = (items: BaiLuyenKhacPhuc[]) => {
    setHistory(items)
    try {
      localStorage.setItem(historyKey, JSON.stringify(items))
    } catch {}
  }

  // Tải kho câu cho Chế độ 2 và Chế độ 4
  const [dsCauSai2, setDsCauSai2] = useState<CauSaiDauVao[]>([])
  useEffect(() => {
    if (cheDo !== 2 && cheDo !== 4) return
    if (khoDe2.length > 0) return
    let alive = true
    setDangTaiKho2(true)
    setLoiKho2('')
    void (async () => {
      try {
        const url = await layUrl()
        // Bước 1: xin danh sách câu sai của em từ server
        const res = await hsCauSaiApi(url, sbd, [])
        if (!alive) return
        if (!res.ok || !res.items || res.items.length === 0) {
          setLoiKho2(res.error || (vaiTro === 'ph' ? 'Con không có câu sai nào trong lịch sử.' : 'Em không có câu sai nào trong lịch sử.'))
          setKhoDe2([])
          setDsCauSai2([])
          return
        }
        const dsCauSai = (res.items as CauSaiDauVao[]).filter((c) =>
          hopLeDeRut({
            phan: c.phan,
            maDe: c.maCa,
            dapAnDung: c.dapAnDung,
            text: c.text,
            choices: c.choices || c.ideas,
          })
        )
        setDsCauSai2(dsCauSai)
        // Bước 2: xin máy chủ gói câu cùng nhãn với các câu sai
        // Thử xin máy chủ trước; nếu không được thì dùng kho local
        const kq = await napKhoChoMayEm(url, sbd, dsCauSai)
        if (!alive) return
        if (kq.nguon.length > 0) {
          setKhoDe2(kq.nguon)
          setLoiKho2('')
        } else {
          // Fallback: thử load kho local (nếu thầy đang ở máy tính có kho)
          const localSources = await loadExamSources().catch(() => [])
          if (!alive) return
          if (localSources.length > 0) {
            setKhoDe2(localSources)
            setLoiKho2('')
          } else {
            setLoiKho2(kq.loi || 'Chưa tìm được câu nào cùng dạng trong kho.')
            setKhoDe2([])
          }
        }
      } catch (e) {
        if (alive) setLoiKho2(e instanceof Error ? e.message : 'Lỗi tải kho câu sai.')
      } finally {
        if (alive) setDangTaiKho2(false)
      }
    })()
    return () => { alive = false }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [cheDo, sbd, scriptUrlProp])

  // Danh sách các ca thi trích xuất từ câu sai
  const dsCaThi2 = useMemo(() => {
    const map = new Map<string, { maCa: string; tenCa: string; soCauSai: number }>()
    for (const c of dsCauSai2) {
      const ma = c.maCa || 'mac_dinh'
      const ten = c.tenCa || (c.maCa ? `Ca kiểm tra mã ${c.maCa}` : 'Bài kiểm tra')
      const hien = map.get(ma)
      if (hien) {
        hien.soCauSai += 1
      } else {
        map.set(ma, { maCa: ma, tenCa: ten, soCauSai: 1 })
      }
    }
    return Array.from(map.values())
  }, [dsCauSai2])

  // Set các ca thi được tick chọn trong Chế độ 2 (mặc định chọn tất cả ca)
  const [caChonCheDo2, setCaChonCheDo2] = useState<Set<string>>(() => new Set(dsCauSai2.map((c) => c.maCa || 'mac_dinh')))

  useEffect(() => {
    setCaChonCheDo2(new Set(dsCauSai2.map((c) => c.maCa || 'mac_dinh')))
  }, [dsCauSai2])

  // Danh sách câu sai được lọc theo các ca thi đã tick ở Chế độ 2
  const dsCauSaiCheDo2 = useMemo(() => {
    return dsCauSai2.filter((c) => caChonCheDo2.has(c.maCa || 'mac_dinh'))
  }, [dsCauSai2, caChonCheDo2])

  const { thongKe: thongKeCheDo2, tongToiDa: tongToiDaCheDo2, tinhSoCauMoiDang: tinhCheDo2 } = useMemo(
    () => phanTichTyLeDang(dsCauSaiCheDo2, khoDe2),
    [dsCauSaiCheDo2, khoDe2]
  )

  useEffect(() => {
    if (tongToiDaCheDo2 > 0) {
      setSoCauCheDo2((prev) => Math.min(tongToiDaCheDo2, Math.max(1, prev > 0 ? prev : Math.min(tongToiDaCheDo2, dsCauSaiCheDo2.length * 2))))
    } else {
      setSoCauCheDo2(0)
    }
  }, [tongToiDaCheDo2, dsCauSaiCheDo2.length])

  const phanBoCheDo2 = useMemo(() => tinhCheDo2(soCauCheDo2), [soCauCheDo2, tinhCheDo2])

  // Tải danh mục dạng bài cho Chế độ 3 & 4
  useEffect(() => {
    let alive = true
    void (async () => {
      setDangTaiDm(true)
      try {
        const url = await layUrl()
        const kq = await danhMucDangBai(url)
        if (!alive) return
        if (kq.lops && kq.lops.length > 0) {
          setDmDangBai(kq.lops)
          const l12 = kq.lops.find((l) => l.lop === '12') || kq.lops[0]
          setLopChon(l12.lop)
          if (l12.bais && l12.bais.length > 0) {
            setBaiChon(l12.bais[0].tenBai)
            if (l12.bais[0].dangs && l12.bais[0].dangs.length > 0) {
              setCacDangChon(new Set([l12.bais[0].dangs[0].ma]))
            }
          }
        }
      } catch {
      } finally {
        if (alive) setDangTaiDm(false)
      }
    })()
    return () => {
      alive = false
    }
  }, [scriptUrlProp])

  // Lọc bài theo lớp
  const lopHienTai = useMemo(() => dmDangBai.find((l) => l.lop === lopChon), [dmDangBai, lopChon])
  const baisCuaLop = useMemo(() => lopHienTai?.bais ?? [], [lopHienTai])
  const baiHienTai = useMemo(() => baisCuaLop.find((b) => b.tenBai === baiChon), [baisCuaLop, baiChon])
  const dangsCuaBai = useMemo(() => baiHienTai?.dangs ?? [], [baiHienTai])

  // Khi đổi lớp
  const handleChonLop = (lop: string) => {
    setLopChon(lop)
    const l = dmDangBai.find((x) => x.lop === lop)
    if (l && l.bais.length > 0) {
      setBaiChon(l.bais[0].tenBai)
      if (l.bais[0].dangs.length > 0) {
        setCacDangChon(new Set([l.bais[0].dangs[0].ma]))
      } else {
        setCacDangChon(new Set())
      }
    } else {
      setBaiChon('')
      setCacDangChon(new Set())
    }
  }

  // Khi đổi bài
  const handleChonBai = (tenBai: string) => {
    setBaiChon(tenBai)
    const b = baisCuaLop.find((x) => x.tenBai === tenBai)
    if (b && b.dangs.length > 0) {
      setCacDangChon(new Set([b.dangs[0].ma]))
    } else {
      setCacDangChon(new Set())
    }
  }

  // Tải đề khi danh sách dạng bài đã chọn thay đổi (tải nhiều dạng song song)
  useEffect(() => {
    const dsMa = Array.from(cacDangChon)
    if (dsMa.length === 0) {
      setKhoDangBai([])
      return
    }
    let alive = true
    void (async () => {
      setDangTaiDang(true)
      try {
        const url = await layUrl()
        const canTai = dsMa.filter((ma) => !cacheDeRef.current.has(ma))
        if (canTai.length > 0) {
          await Promise.all(
            canTai.map(async (ma) => {
              try {
                const kq = await deTheoDangBai(url, ma)
                if (kq.de) {
                  const doc = parseKhoDeJson(kq.de)
                  if (doc.ok && doc.json) {
                    const dung = buildTeacherSourceFromKhoDe(doc.json)
                    if (dung.errors.length === 0) {
                      cacheDeRef.current.set(ma, dung.source)
                    }
                  }
                }
              } catch {}
            })
          )
        }
        if (!alive) return
        const sources: TeacherExamSource[] = []
        for (const ma of dsMa) {
          const s = cacheDeRef.current.get(ma)
          if (s) sources.push(s)
        }
        setKhoDangBai(sources)
      } finally {
        if (alive) setDangTaiDang(false)
      }
    })()
    return () => {
      alive = false
    }
  }, [cacDangChon, scriptUrlProp])

  // Chế độ 4: Lọc theo nhiều mức độ & thể loại tự do
  const isNgauNhien = cacMucDoChon.has('ngau_nhien') || cacMucDoChon.size === 0
  const chonSao2 = cacMucDoChon.has('sao_2')
  const chonSao1 = cacMucDoChon.has('sao_1')
  const chonLyThuyet = cacMucDoChon.has('ly_thuyet')
  const chonBaiTap = cacMucDoChon.has('bai_tap')

  const khopBoLocCheDo4 = useCallback(
    (cand: { sao?: any; dang?: any; kieu?: any }) => {
      if (isNgauNhien) return true

      // 1. Kiểm tra sao nếu có chọn sao
      if (chonSao2 && chonSao1) {
        if (!hopSao(cand.sao, 'sao_2') && !hopSao(cand.sao, 'sao_1')) return false
      } else if (chonSao2) {
        if (!hopSao(cand.sao, 'sao_2')) return false
      } else if (chonSao1) {
        if (!hopSao(cand.sao, 'sao_1')) return false
      }

      // 2. Kiểm tra thể loại nếu có chọn thể loại
      const dangCand = cand.dang || cand.kieu
      if (chonLyThuyet && chonBaiTap) {
        if (dangCand !== 'ly_thuyet' && dangCand !== 'bai_tap') return false
      } else if (chonLyThuyet) {
        if (dangCand !== 'ly_thuyet') return false
      } else if (chonBaiTap) {
        if (dangCand !== 'bai_tap') return false
      }

      return true
    },
    [isNgauNhien, chonSao2, chonSao1, chonLyThuyet, chonBaiTap]
  )

  // Chế độ 3 (Dạng bài): tính toàn bộ số câu của dạng bài (không lọc)
  const tongToiDaCheDo3 = useMemo(() => demCauDangBai(khoDangBai), [khoDangBai])

  // Chế độ 4 (Tự do): rút từ kho câu theo bộ lọc đa mức độ
  const { dsUngVienCheDo4, tongToiDaCheDo4 } = useMemo(() => {
    const tatCa = cauLuyenTuNguon(khoDe2)
    const ds = tatCa.filter(khopBoLocCheDo4)
    return { dsUngVienCheDo4: ds, tongToiDaCheDo4: ds.length }
  }, [khoDe2, khopBoLocCheDo4])

  useEffect(() => {
    if (tongToiDaCheDo3 > 0) {
      setSoCauCheDo3((prev) => Math.min(tongToiDaCheDo3, Math.max(5, Math.min(prev, 50))))
    }
  }, [tongToiDaCheDo3])

  useEffect(() => {
    if (tongToiDaCheDo4 > 0) {
      setSoCauCheDo4((prev) => Math.min(tongToiDaCheDo4, Math.max(1, Math.min(prev > 0 ? prev : 20, 50))))
    } else {
      setSoCauCheDo4(0)
    }
  }, [tongToiDaCheDo4])

  // Đồng hồ đếm thời gian cho bài luyện đang làm
  useEffect(() => {
    if (!currentTest || currentTest.status !== 'active') {
      if (timerRef.current) clearInterval(timerRef.current)
      return
    }
    timerRef.current = setInterval(() => {
      setSeconds((s) => s + 1)
    }, 1000)
    return () => {
      if (timerRef.current) clearInterval(timerRef.current)
    }
  }, [currentTest?.id, currentTest?.status])

  // BẮT ĐẦU LÀM BÀI / GIAO BÀI CHO CON
  const batDauLamBai = async () => {
    setDangXuLy(true)
    setLoi('')
    try {
      const url = await layUrl()

      if (cheDo === 1) {
        // Chế độ 1: Rút từ ca đã chọn
        const dsMa = Array.from(cacCaChon)
        if (dsMa.length === 0) {
          setLoi(vaiTro === 'ph' ? 'Vui lòng chọn ít nhất 1 ca kiểm tra để rút câu sai cho con.' : 'Vui lòng chọn ít nhất 1 ca kiểm tra để rút câu sai.')
          return
        }
        const res = await hsCauSaiApi(url, sbd, dsMa)
        if (!res.ok || !res.items || res.items.length === 0) {
          setLoi(res.error || (vaiTro === 'ph' ? 'Các ca kiểm tra đã chọn không có câu sai nào cần khắc phục!' : 'Các ca kiểm tra đã chọn không có câu sai nào cần khắc phục!'))
          return
        }
        const { dsCau } = taoDeLamLaiCauSai(res.items as CauSaiDauVao[], {
          hoTen,
          sbd,
          tenDe: dsMa.length === 1 ? `Khắc phục Ca #${dsMa[0]}` : `Khắc phục ${dsMa.length} ca đã chọn`,
        })
        if (dsCau.length === 0) {
          setLoi('Không rút được câu hỏi nào từ các ca đã chọn.')
          return
        }
        const tieuDe = `Khắc phục: ${dsMa.length === 1 ? `Ca #${dsMa[0]}` : `${dsMa.length} ca`} (${dsCau.length} câu)`
        if (onGiaoBaiChoCon) {
          await onGiaoBaiChoCon(dsCau, tieuDe)
          return
        }
        const baiMoi: BaiLuyenKhacPhuc = {
          id: `kp_${Date.now()}`,
          tieuDe,
          cheDo: 1,
          createdAt: Date.now(),
          status: 'active',
          dsCau,
          answers: {},
          score: null,
          soCauDung: 0,
          tongSoCau: dsCau.length,
          submittedAt: null,
          durationSeconds: 0,
        }
        luuHistory([baiMoi, ...history])
        setCurrentTest(baiMoi)
        setSeconds(0)
      } else if (cheDo === 2) {
        // Chế độ 2: Dạng câu sai — rút câu cùng nhãn dán theo tỷ lệ từ kho
        if (dsCauSaiCheDo2.length === 0) {
          setLoi(vaiTro === 'ph' ? 'Vui lòng tick chọn ít nhất một ca kiểm tra có câu sai của con.' : 'Vui lòng tick chọn ít nhất một ca kiểm tra có câu sai.')
          return
        }
        if (khoDe2.length === 0) {
          setLoi('Chưa có kho câu cùng dạng. Vui lòng đợi hệ thống tải xong hoặc thử lại.')
          return
        }
        const res2 = rutLuyenThemDangCauSai(dsCauSaiCheDo2, khoDe2, soCauCheDo2, { hoTen, sbd })
        const dsCau = res2.dsCau
        if (dsCau.length === 0) {
          setLoi(vaiTro === 'ph' ? 'Kho đề chưa có câu nào cùng dạng câu sai của con.' : 'Kho đề chưa có câu nào cùng dạng câu sai. Em hãy làm thêm bài để ghi nhận câu sai.')
          return
        }
        const tieuDe = `Dạng câu sai: ${dsCau.length} câu (chia theo tỷ lệ ${dsCauSaiCheDo2.length} câu sai)`
        if (onGiaoBaiChoCon) {
          await onGiaoBaiChoCon(dsCau, tieuDe)
          return
        }
        const baiMoi: BaiLuyenKhacPhuc = {
          id: `kp_${Date.now()}`,
          tieuDe,
          cheDo: 2,
          createdAt: Date.now(),
          status: 'active',
          dsCau,
          answers: {},
          score: null,
          soCauDung: 0,
          tongSoCau: dsCau.length,
          submittedAt: null,
          durationSeconds: 0,
        }
        luuHistory([baiMoi, ...history])
        setCurrentTest(baiMoi)
        setSeconds(0)
      } else if (cheDo === 3) {
        // Chế độ 3: Dạng bài (chọn nhiều dạng)
        if (cacDangChon.size === 0) {
          setLoi('Vui lòng tích chọn ít nhất 1 dạng bài trước khi bắt đầu.')
          return
        }
        if (khoDangBai.length === 0) {
          setLoi('Dạng bài này chưa có đề trong kho hoặc đang tải. Vui lòng thử lại sau giây lát.')
          return
        }
        const tenDangChon =
          cacDangChon.size === 1
            ? dangsCuaBai.find((d) => cacDangChon.has(d.ma))?.ten || 'Dạng bài'
            : `${cacDangChon.size} dạng bài`
        const { dsCau } = rutLuyenDangBai(
          khoDangBai,
          soCauCheDo3,
          {
            hoTen,
            sbd,
            tenDang: tenDangChon,
            tenBai: baiChon,
            lop: lopChon,
          }
        )
        if (dsCau.length === 0) {
          setLoi('Không tìm thấy câu hỏi nào thuộc các dạng bài đã chọn.')
          return
        }
        const tieuDe =
          cacDangChon.size === 1
            ? `Dạng bài: ${tenDangChon} — Lớp ${lopChon} (${dsCau.length} câu)`
            : `Luyện ${cacDangChon.size} dạng bài — Lớp ${lopChon} · ${baiChon} (${dsCau.length} câu)`
        if (onGiaoBaiChoCon) {
          await onGiaoBaiChoCon(dsCau, tieuDe)
          return
        }
        const baiMoi: BaiLuyenKhacPhuc = {
          id: `kp_${Date.now()}`,
          tieuDe,
          cheDo: 3,
          createdAt: Date.now(),
          status: 'active',
          dsCau,
          answers: {},
          score: null,
          soCauDung: 0,
          tongSoCau: dsCau.length,
          submittedAt: null,
          durationSeconds: 0,
        }
        luuHistory([baiMoi, ...history])
        setCurrentTest(baiMoi)
        setSeconds(0)
      } else if (cheDo === 4) {
        // Chế độ 4: Tự do theo nhiều mức độ đã chọn
        if (khoDe2.length === 0) {
          setLoi('Chưa có câu hỏi trong kho hoặc đang tải dữ liệu. Vui lòng thử lại sau giây lát.')
          return
        }
        let dsCau: CauLuyen[] = []
        if (dsUngVienCheDo4.length > 0) {
          const tron = [...dsUngVienCheDo4].sort(() => Math.random() - 0.5)
          dsCau = tron.slice(0, Math.min(soCauCheDo4, dsUngVienCheDo4.length))
        }
        if (dsCau.length === 0) {
          setLoi('Không tìm thấy câu hỏi phù hợp với các mức độ đã chọn.')
          return
        }
        const nhanList: string[] = []
        if (isNgauNhien) {
          nhanList.push('Ngẫu nhiên')
        } else {
          if (chonSao2) nhanList.push('2 sao')
          if (chonSao1) nhanList.push('1 sao')
          if (chonLyThuyet) nhanList.push('Lý thuyết')
          if (chonBaiTap) nhanList.push('Bài tập')
        }
        const nhanMuc = nhanList.join(' + ') || 'Tự do'
        const tieuDe = `Tự do (${nhanMuc}): ${dsCau.length} câu`
        if (onGiaoBaiChoCon) {
          await onGiaoBaiChoCon(dsCau, tieuDe)
          return
        }
        const baiMoi: BaiLuyenKhacPhuc = {
          id: `kp_${Date.now()}`,
          tieuDe,
          cheDo: 4,
          createdAt: Date.now(),
          status: 'active',
          dsCau,
          answers: {},
          score: null,
          soCauDung: 0,
          tongSoCau: dsCau.length,
          submittedAt: null,
          durationSeconds: 0,
        }
        luuHistory([baiMoi, ...history])
        setCurrentTest(baiMoi)
        setSeconds(0)
      }
    } catch (e) {
      setLoi(e instanceof Error ? e.message : 'Có lỗi xảy ra khi tạo đề.')
    } finally {
      setDangXuLy(false)
    }
  }

  // Cập nhật câu trả lời khi làm bài
  const capNhatDapAn = (cauId: string, giaTri: string) => {
    if (!currentTest || currentTest.status !== 'active') return
    const answersMoi = { ...currentTest.answers, [cauId]: giaTri }
    const testMoi: BaiLuyenKhacPhuc = {
      ...currentTest,
      answers: answersMoi,
      durationSeconds: seconds,
    }
    setCurrentTest(testMoi)
    const historyMoi = history.map((h) => (h.id === testMoi.id ? testMoi : h))
    luuHistory(historyMoi)
  }

  // NỘP BÀI
  const nopBai = () => {
    if (!currentTest || currentTest.status !== 'active') return

    const { score, soCauDung, tongSoCau } = chamBai(currentTest.dsCau, currentTest.answers)
    const testHoanThanh: BaiLuyenKhacPhuc = {
      ...currentTest,
      status: 'submitted',
      score,
      soCauDung,
      tongSoCau,
      submittedAt: Date.now(),
      durationSeconds: seconds,
    }
    setCurrentTest(testHoanThanh)
    const historyMoi = history.map((h) => (h.id === testHoanThanh.id ? testHoanThanh : h))
    luuHistory(historyMoi)
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  // Xoá bài luyện trong lịch sử
  const xoaBai = (id: string, e: React.MouseEvent) => {
    e.stopPropagation()
    if (!window.confirm('Xoá bài luyện này khỏi lịch sử?')) return
    const historyMoi = history.filter((h) => h.id !== id)
    luuHistory(historyMoi)
    if (currentTest?.id === id) setCurrentTest(null)
  }

  // Đếm số câu đã trả lời
  const soCauDaLam = useMemo(() => {
    if (!currentTest) return 0
    return Object.values(currentTest.answers).filter((v) => v && v.trim() && v !== '----').length
  }, [currentTest])

  const panel = 'm3 m3-khoi p-4 sm:p-6 space-y-5'

  // NẾU ĐANG LÀM BÀI HOẶC XEM LẠI BÀI LUYỆN — FULL RA TOÀN MÀN HÌNH ĐỂ TẬP TRUNG
  if (currentTest) {
    const daNop = currentTest.status === 'submitted'
    return createPortal(
      <div className="m3 m3-man-lam fixed inset-0 z-50 overflow-y-auto overscroll-contain">
        <div
          className="min-h-full max-w-4xl mx-auto px-3 sm:px-6 py-4 sm:py-6 space-y-6"
          style={{
            paddingTop: 'max(16px, env(safe-area-inset-top))',
            paddingBottom: daNop ? 'max(32px, env(safe-area-inset-bottom))' : '110px',
          }}
        >
          {/* Header bài luyện */}
          <div className="m3-dau-man flex flex-wrap items-center justify-between gap-3">
            <div>
              <button
                onClick={() => setCurrentTest(null)}
                className="m3-nut-chu -ml-3 cursor-pointer"
              >
                <ChevronLeft size={16} />
                Quay lại danh sách luyện tập
              </button>
              <h2 className="text-base sm:text-lg font-bold text-slate-900 dark:text-white">
                {currentTest.tieuDe}
              </h2>
            </div>
            {daNop && (
              <div className="flex items-center gap-2 bg-emerald-50 dark:bg-emerald-950/50 border border-emerald-200 dark:border-emerald-800 px-4 py-2 rounded-xl">
                <Award className="w-6 h-6 text-emerald-600 dark:text-emerald-400" />
                <div>
                  <div className="text-xs font-medium text-emerald-800 dark:text-emerald-200">
                    Kết quả: <strong>{typeof currentTest.score === 'number' ? currentTest.score.toFixed(2) : '--'} / 10 điểm</strong>
                  </div>
                  <div className="text-[11px] text-emerald-600 dark:text-emerald-400">
                    Đúng {currentTest.soCauDung} / {currentTest.tongSoCau} câu
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Danh sách câu hỏi */}
          <div className="space-y-6">
            {currentTest.dsCau.map((q, idx) => {
              const common = {
                key: q.id,
                id: q.id,
                stt: idx + 1,
                cheDo: daNop ? ('xem_lai' as const) : ('thi' as const),
                text: q.text,
                thanCauImg: q.anhThanCau,
                table: q.bang || undefined,
                explanation: q.chot || (q.buoc && q.buoc.length > 0 ? q.buoc.join('\n') : undefined),
              }

              if (q.phan === 'I') {
                return (
                  <TheCau
                    {...common}
                    phan="I"
                    choices={(q.luaChon || ['', '', '', '']) as [string, string, string, string]}
                    choiceImgs={q.anhLuaChon as any}
                    choicePerm={[0, 1, 2, 3]}
                    selected={(currentTest.answers[q.id] || null) as 'A' | 'B' | 'C' | 'D' | null}
                    correct={q.dapAn as 'A' | 'B' | 'C' | 'D' | undefined}
                    onSelect={(orig) => capNhatDapAn(q.id, orig)}
                  />
                )
              }

              if (q.phan === 'II') {
                const ideas = (q.luaChon || ['', '', '', '']) as [string, string, string, string]
                const cleanKey = (q.dapAn || '').replace(/[^DS]/gi, '').toUpperCase().split('')
                return (
                  <TheCau
                    {...common}
                    phan="II"
                    ideas={ideas}
                    ideaImgs={q.anhLuaChon as any}
                    selected={Array.from({ length: 4 }, (_, j) => {
                      const v = (currentTest.answers[q.id] || '')[j]
                      return v === 'D' || v === 'S' ? v : null
                    })}
                    correct={cleanKey as ['D' | 'S', 'D' | 'S', 'D' | 'S', 'D' | 'S']}
                    onSelect={(j, val) => {
                      const arr = (currentTest.answers[q.id] || '----').split('')
                      arr[j] = val
                      capNhatDapAn(q.id, arr.join(''))
                    }}
                  />
                )
              }

              return (
                <TheCau
                  {...common}
                  phan="III"
                  selected={currentTest.answers[q.id] || ''}
                  correct={q.dapAn}
                  onChange={(val) => capNhatDapAn(q.id, val)}
                />
              )
            })}
          </div>
        </div>

        {/* Thanh công cụ nộp bài cố định dưới đáy */}
        {!daNop && (
          <div
            data-practice-toolbar
            className="fixed inset-x-0 bottom-0 z-40 px-3 pt-2"
            style={{
              paddingBottom: 'max(12px, env(safe-area-inset-bottom))',
              pointerEvents: 'none',
            }}
          >
            <div
              className="m3-thanh-duoi mx-auto flex max-w-3xl items-center justify-between gap-3 p-3"
              style={{ pointerEvents: 'auto' }}
            >
              <div className="min-w-0">
                <div className="flex items-center gap-2 font-bold tabular-nums text-slate-900 dark:text-white text-sm">
                  <Clock3 size={18} className="text-blue-500" />
                  <span>
                    {Math.floor(seconds / 60)}:{String(seconds % 60).padStart(2, '0')}
                  </span>
                </div>
                <p className="mt-0.5 text-xs text-slate-500 dark:text-slate-400">
                  Đã làm {soCauDaLam} / {currentTest.dsCau.length} câu
                </p>
              </div>
              <button
                disabled={dangXuLy}
                onClick={() => setHienXacNhanNop(true)}
                className="m3-nut-chinh shrink-0 cursor-pointer"
              >
                Nộp bài
              </button>
            </div>
          </div>
        )}

        {/* Hộp thoại xác nhận nộp bài Google Style ở giữa màn hình */}
        <ModalXacNhanNop
          isOpen={hienXacNhanNop}
          tieuDe="Xác nhận nộp bài"
          moTa={currentTest.tieuDe}
          tongSoCau={currentTest.dsCau.length}
          soCauDaLam={soCauDaLam}
          onClose={() => setHienXacNhanNop(false)}
          onConfirm={() => {
            setHienXacNhanNop(false)
            nopBai()
          }}
          primaryColor="amber"
        />
      </div>,
      document.body
    )
  }

  // MÀN HÌNH CHỌN 4 CHẾ ĐỘ & DANH SÁCH BÀI LUYỆN
  return (
    <section className={panel}>
      <div className="flex items-center justify-between">
        <div>
          <div className="flex items-center gap-2 text-blue-600 dark:text-blue-400 font-bold text-lg">
            <Sparkles size={20} />
            <h2>{vaiTro === 'ph' ? '4 CHẾ ĐỘ GIAO BÀI CHO CON' : '4 CHẾ ĐỘ KHẮC PHỤC CÂU SAI'}</h2>
          </div>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            {vaiTro === 'ph'
              ? 'Hệ thống tự động phân tích và tạo bài luyện khắc phục theo nhu cầu của con'
              : 'Hệ thống tự động phân tích và tạo bài luyện khắc phục theo nhu cầu của em'}
          </p>
        </div>
        {vaiTro === 'ph' && (
          <span className="text-xs font-bold text-rose-600 dark:text-rose-400 bg-rose-50 dark:bg-rose-950/60 px-2.5 py-1 rounded-full border border-rose-200 dark:border-rose-900 shrink-0">
            Hạn 2 tiếng
          </span>
        )}
      </div>

      {/* 4 Nút chọn chế độ */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-1.5 p-1 bg-slate-200 dark:bg-slate-700 rounded-xl">
        <button
          onClick={() => {
            setCheDo(1)
            setLoi('')
          }}
          className={`py-2 px-1 text-center rounded-lg text-xs font-semibold transition cursor-pointer ${
            cheDo === 1
              ? 'bg-white dark:bg-slate-700 text-blue-600 dark:text-blue-400 shadow-sm'
              : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
          }`}
        >
          1. Sửa câu sai
        </button>
        <button
          onClick={() => {
            setCheDo(2)
            setLoi('')
          }}
          className={`py-2 px-1 text-center rounded-lg text-xs font-semibold transition cursor-pointer ${
            cheDo === 2
              ? 'bg-white dark:bg-slate-700 text-blue-600 dark:text-blue-400 shadow-sm'
              : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
          }`}
        >
          2. Dạng câu sai
        </button>
        <button
          onClick={() => {
            setCheDo(3)
            setLoi('')
          }}
          className={`py-2 px-1 text-center rounded-lg text-xs font-semibold transition cursor-pointer ${
            cheDo === 3
              ? 'bg-white dark:bg-slate-700 text-blue-600 dark:text-blue-400 shadow-sm'
              : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
          }`}
        >
          3. Dạng bài
        </button>
        <button
          onClick={() => {
            setCheDo(4)
            setLoi('')
          }}
          className={`py-2 px-1 text-center rounded-lg text-xs font-semibold transition cursor-pointer ${
            cheDo === 4
              ? 'bg-white dark:bg-slate-700 text-blue-600 dark:text-blue-400 shadow-sm'
              : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
          }`}
        >
          4. Tự do
        </button>
      </div>

      {thongBaoMom && (
        <div
          className={`p-3.5 rounded-xl text-xs leading-relaxed border flex items-center gap-2 ${
            thongBaoMom.loai === 'ok'
              ? 'bg-emerald-50 dark:bg-emerald-950/50 text-emerald-800 dark:text-emerald-200 border-emerald-200 dark:border-emerald-800'
              : 'bg-red-50 dark:bg-red-950/50 text-red-800 dark:text-red-200 border-red-200 dark:border-red-800'
          }`}
        >
          <AlertCircle size={16} className="shrink-0" />
          <span>{thongBaoMom.chu}</span>
        </div>
      )}

      {loi && (
        <div className="p-3 bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800 rounded-xl text-rose-700 dark:text-rose-300 text-xs flex items-center gap-2">
          <AlertCircle size={16} className="shrink-0" />
          <span>{loi}</span>
        </div>
      )}

      {/* NỘI DUNG CHẾ ĐỘ 1: SỬA CÂU SAI */}
      {cheDo === 1 && (
        <div className="space-y-3">
          <div className="flex items-center justify-between text-xs text-slate-500 dark:text-slate-400">
            <span>Chọn các ca kiểm tra để rút câu làm sai:</span>
            <button
              onClick={() => {
                if (cacCaChon.size === dsLichSu.length) {
                  setCacCaChon(new Set())
                } else {
                  setCacCaChon(new Set(dsLichSu.map((c) => c.maCa)))
                }
              }}
              className="text-blue-600 dark:text-blue-400 font-semibold hover:underline cursor-pointer"
            >
              {cacCaChon.size === dsLichSu.length ? 'Bỏ chọn tất cả' : 'Chọn tất cả'}
            </button>
          </div>

          {dsLichSu.length === 0 ? (
            <p className="p-4 text-xs text-slate-400 text-center bg-slate-50 dark:bg-slate-800 rounded-xl">
              Chưa có dữ liệu ca kiểm tra nào.
            </p>
          ) : (
            <div
              role="region"
              aria-label="Danh sách ca kiểm tra chọn rút câu sai"
              tabIndex={0}
              className="max-h-56 overflow-y-auto space-y-1.5 pr-1"
            >
              {dsLichSu.map((item) => {
                const isSelected = cacCaChon.has(item.maCa)
                const soSai = docSoDem(item)?.soCanKhacPhuc ?? 0
                return (
                  <div
                    key={item.maCa}
                    onClick={() => {
                      setCacCaChon((prev) => {
                        const s = new Set(prev)
                        if (s.has(item.maCa)) s.delete(item.maCa)
                        else s.add(item.maCa)
                        return s
                      })
                    }}
                    className={`p-2.5 rounded-xl border flex items-center justify-between gap-2 cursor-pointer transition text-xs ${
                      isSelected
                        ? 'border-blue-400 bg-blue-50/50 dark:bg-blue-950/20 text-slate-900 dark:text-white'
                        : 'border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800/50 text-slate-700 dark:text-slate-300'
                    }`}
                  >
                    <div className="flex items-center gap-2.5 min-w-0">
                      <div className="text-blue-500">
                        {isSelected ? <CheckSquare size={16} /> : <Square size={16} />}
                      </div>
                      <div className="min-w-0">
                        <span className="font-semibold truncate block">
                          #{item.maCa} · {item.tenCa || `Ca ${item.maCa}`}
                        </span>
                        <span className="text-[11px] text-slate-400">
                          Điểm: {typeof item.tong === 'number' ? item.tong.toFixed(2) : typeof item.diem === 'number' ? item.diem.toFixed(2) : '--'}
                        </span>
                      </div>
                    </div>
                    <span
                      className={`shrink-0 px-2 py-0.5 rounded-full text-[11px] font-semibold ${
                        soSai > 0
                          ? 'bg-rose-50 text-rose-700 dark:bg-rose-950/60 dark:text-rose-300'
                          : 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300'
                      }`}
                    >
                      {soSai > 0 ? `${soSai} câu sai` : 'Đúng 100%'}
                    </span>
                  </div>
                )
              })}
            </div>
          )}

          <button
            disabled={dangXuLy || cacCaChon.size === 0}
            onClick={batDauLamBai}
            className="m3-nut-chinh w-full flex items-center justify-center gap-2 cursor-pointer"
          >
            {dangXuLy ? (
              <RefreshCw size={16} className="animate-spin" />
            ) : (
              <Play size={16} fill="currentColor" />
            )}
            <span>
              {vaiTro === 'ph'
                ? `Giao bài sửa câu sai cho con (${cacCaChon.size} ca đã chọn)`
                : `Bắt đầu sửa câu sai (${cacCaChon.size} ca đã chọn)`}
            </span>
          </button>
        </div>
      )}

      {/* NỘI DUNG CHẾ ĐỘ 2: DẠNG CÂU SAI */}
      {cheDo === 2 && (
        <div className="space-y-4">
          {/* Mô tả */}
          <div className="p-4 bg-blue-50/50 dark:bg-blue-950/20 border border-blue-200 dark:border-blue-800 rounded-xl space-y-1.5">
            <div className="flex items-center gap-2 font-semibold text-xs text-blue-800 dark:text-blue-200">
              <Layers size={16} />
              Thuật toán mới: Luyện thêm câu cùng dạng câu sai trong toàn kho
            </div>
            <p className="text-xs text-slate-600 dark:text-slate-400">
              Hệ thống tự động phân tích lịch sử câu sai, rút câu cùng dạng bài theo tiến trình sư phạm 3 nấc (Củng cố nền tảng → Rèn luyện → Bứt phá) để lấp dứt điểm lỗ hổng kiến thức.
            </p>
          </div>

          {/* Trạng thái tải kho */}
          {dangTaiKho2 ? (
            <div className="py-4 text-center text-xs text-slate-400 flex items-center justify-center gap-2">
              <RefreshCw size={14} className="animate-spin text-blue-500" />
              Đang phân tích câu sai và tải kho đề cùng dạng…
            </div>
          ) : loiKho2 ? (
            <div className="p-3 bg-blue-50 dark:bg-blue-950/40 border border-blue-200 dark:border-blue-800 rounded-xl text-blue-700 dark:text-blue-300 text-xs flex items-center gap-2">
              <Info size={14} className="shrink-0" />
              <span>{loiKho2}</span>
            </div>
          ) : (
            <div className="space-y-4">
              {/* Hộp chọn ca thi của học sinh trong box có ô tick */}
              {dsCaThi2.length > 0 && (
                <div className="p-4 rounded-xl bg-white dark:bg-slate-800 border border-slate-200/80 dark:border-slate-700 space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 flex items-center gap-1.5">
                      <Layers size={14} className="text-blue-500" />
                      <span>Ca kiểm tra có câu sai ({caChonCheDo2.size}/{dsCaThi2.length} ca · {dsCauSaiCheDo2.length} câu sai)</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <button
                        type="button"
                        onClick={() => setCaChonCheDo2(new Set(dsCaThi2.map((c) => c.maCa)))}
                        className="px-2.5 py-1 rounded-lg text-xs font-semibold text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-950/40 transition cursor-pointer"
                      >
                        Chọn tất cả
                      </button>
                      <span className="text-slate-300 dark:text-slate-600">|</span>
                      <button
                        type="button"
                        onClick={() => setCaChonCheDo2(new Set())}
                        className="px-2.5 py-1 rounded-lg text-xs font-semibold text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-700 transition cursor-pointer"
                      >
                        Bỏ chọn
                      </button>
                    </div>
                  </div>

                  <div className="max-h-40 overflow-y-auto space-y-1.5 pr-1">
                    <NhomCaThuGon ds={dsCaThi2} selected={ca=>caChonCheDo2.has(ca.maCa)} render={(ca) => {
                      const daTick = caChonCheDo2.has(ca.maCa)
                      return (
                        <div
                          key={ca.maCa}
                          onClick={() => {
                            setCaChonCheDo2((prev) => {
                              const moi = new Set(prev)
                              if (moi.has(ca.maCa)) moi.delete(ca.maCa)
                              else moi.add(ca.maCa)
                              return moi
                            })
                          }}
                          className={`flex items-center justify-between p-2.5 rounded-xl border transition cursor-pointer ${
                            daTick
                              ? 'bg-blue-50/40 border-blue-200 text-slate-800 dark:bg-blue-950/30 dark:border-blue-800 dark:text-slate-100'
                              : 'bg-slate-50/50 border-slate-200/60 text-slate-400 dark:bg-slate-800/40 dark:border-slate-700 hover:bg-slate-50'
                          }`}
                        >
                          <div className="flex items-center gap-2.5 min-w-0">
                            <input
                              type="checkbox"
                              checked={daTick}
                              onChange={() => {}}
                              className="w-4 h-4 rounded text-blue-500 accent-blue-500 cursor-pointer pointer-events-none"
                            />
                            <span className="text-xs font-semibold truncate">
                              {ca.tenCa}
                            </span>
                          </div>
                          <span
                            className={`shrink-0 text-xs font-bold px-2 py-0.5 rounded-full border ${
                              daTick
                                ? 'bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-950/60 dark:text-blue-300 dark:border-blue-800'
                                : 'bg-slate-100 text-slate-400 border-slate-200 dark:bg-slate-700 dark:text-slate-400 dark:border-slate-600'
                            }`}
                          >
                            {ca.soCauSai} câu sai
                          </span>
                        </div>
                      )
                    }}/>
                  </div>
                </div>
              )}

              {dsCauSaiCheDo2.length === 0 ? (
                <div className="text-xs text-slate-500 bg-slate-100 dark:bg-slate-800 p-3 rounded-xl border border-slate-200 dark:border-slate-700 flex items-center gap-2">
                  <Info size={14} className="shrink-0" />
                  Vui lòng tick chọn ít nhất một ca kiểm tra ở danh sách trên để tính câu khắc phục.
                </div>
              ) : tongToiDaCheDo2 > 0 ? (
                <>
                  {/* Thanh kéo số câu */}
              <div className="space-y-2">
                <div className="flex items-center justify-between text-xs">
                  <span className="text-slate-600 dark:text-slate-400 font-semibold flex items-center gap-1.5">
                    <Layers size={14} className="text-emerald-600" />
                    Số câu rút luyện tập:
                  </span>
                  <strong className="text-blue-600 dark:text-blue-400 text-sm bg-blue-50 dark:bg-blue-950/40 px-2.5 py-0.5 rounded-lg border border-blue-200 dark:border-blue-700">
                    {soCauCheDo2} / {tongToiDaCheDo2} câu
                  </strong>
                </div>
                <input
                  type="range"
                  min={1}
                  max={tongToiDaCheDo2}
                  value={soCauCheDo2}
                  onChange={(e) => setSoCauCheDo2(Number(e.target.value))}
                  className="w-full h-2 bg-slate-200 dark:bg-slate-700 rounded-lg appearance-none cursor-pointer accent-blue-500"
                />
                <div className="flex justify-between text-[11px] font-semibold text-slate-400">
                  <span>1 câu</span>
                  <span>{Math.round(tongToiDaCheDo2 / 2)} câu</span>
                  <span>Tối đa {tongToiDaCheDo2} câu</span>
                </div>
              </div>

              {/* Bảng phân bổ theo dạng câu sai */}
              {thongKeCheDo2.length > 0 && (
                <div className="pt-2 border-t border-slate-200 dark:border-slate-700">
                  <div className="text-xs font-bold text-slate-500 dark:text-slate-400 mb-2">
                    Phân bổ theo dạng câu sai (tỷ lệ, làm tròn lên):
                  </div>
                  <div className="max-h-40 overflow-y-auto space-y-1.5 pr-1 text-xs">
                    {thongKeCheDo2.map((t, idx) => {
                      const soRut = phanBoCheDo2.get(t.qid) ?? 0
                      return (
                        <div
                          key={t.qid || idx}
                          className="flex items-center justify-between py-1 px-2.5 rounded-lg bg-white dark:bg-slate-800 border border-slate-100 dark:border-slate-700 text-slate-600 dark:text-slate-300"
                        >
                          <span className="truncate max-w-[220px]">
                            <b>Câu {t.soCau} ({t.phan})</b>: {t.tenDang || t.nhanDan}
                          </span>
                          <span className="shrink-0 font-bold text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-950/40 px-2 py-0.5 rounded border border-blue-100 dark:border-blue-800">
                            +{soRut} / {t.soUngVienToiDa}
                          </span>
                        </div>
                      )
                    })}
                  </div>
                </div>
              )}
            </>
          ) : dsCauSai2.length > 0 ? (
            <div className="p-3 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-500 dark:text-slate-400 text-xs flex items-center gap-2">
              <Info size={14} className="shrink-0" />
              {vaiTro === 'ph'
                ? 'Kho chưa có câu nào cùng dạng câu sai của con. Cho con sửa các câu sai trước, thầy sẽ bổ sung câu luyện.'
                : 'Kho chưa có câu nào cùng dạng câu sai. Em làm đúng các câu sai trước, thầy sẽ bổ sung câu luyện.'}
            </div>
          ) : null}
            </div>
          )}

          <button
            disabled={dangXuLy || dangTaiKho2 || dsCauSaiCheDo2.length === 0 || tongToiDaCheDo2 === 0 || soCauCheDo2 === 0}
            onClick={batDauLamBai}
            className="m3-nut-chinh w-full flex items-center justify-center gap-2 cursor-pointer"
          >
            {dangXuLy || dangTaiKho2 ? (
              <RefreshCw size={16} className="animate-spin" />
            ) : (
              <Play size={16} fill="currentColor" />
            )}
            <span>
              {dangTaiKho2
                ? 'Đang tải kho...'
                : tongToiDaCheDo2 > 0
                ? vaiTro === 'ph'
                  ? `Giao bài dạng câu sai cho con (${soCauCheDo2} câu)`
                  : `Bắt đầu luyện dạng câu sai (${soCauCheDo2} câu)`
                : 'Bắt đầu luyện dạng câu sai'}
            </span>
          </button>
        </div>
      )}

      {/* NỘI DUNG CHẾ ĐỘ 3: DẠNG BÀI */}
      {cheDo === 3 && (
        <div className="space-y-3.5">
          {dangTaiDm ? (
            <div className="py-6 text-center text-xs text-slate-400 flex items-center justify-center gap-2">
              <RefreshCw size={16} className="animate-spin text-blue-500" />
              Đang tải danh mục dạng bài...
            </div>
          ) : (
            <>
              {/* Chọn Lớp 10 / 11 / 12 */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  1. Chọn Lớp:
                </label>
                <div className="grid grid-cols-3 gap-2">
                  {['10', '11', '12'].map((lop) => (
                    <button
                      key={lop}
                      type="button"
                      onClick={() => handleChonLop(lop)}
                      className={`py-2 px-3 rounded-xl text-xs font-bold border transition cursor-pointer ${
                        lopChon === lop
                          ? 'border-blue-500 bg-blue-500 text-white'
                          : 'border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:border-blue-300'
                      }`}
                    >
                      Lớp {lop}
                    </button>
                  ))}
                </div>
              </div>

              {/* Chọn Bài SGK */}
              {baisCuaLop.length > 0 && (
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    2. Chọn Bài học SGK:
                  </label>
                  <select
                    value={baiChon}
                    onChange={(e) => handleChonBai(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    {baisCuaLop.map((b) => (
                      <option key={b.tenBai} value={b.tenBai}>
                        {b.tenBai} ({b.dangs.length} dạng)
                      </option>
                    ))}
                  </select>
                </div>
              )}

              {/* Chọn Dạng bài trọng tâm (box có ô tích chọn nhiều dạng) */}
              {dangsCuaBai.length > 0 && (
                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                      3. Chọn Dạng toán trọng tâm:
                    </label>
                    <button
                      type="button"
                      onClick={() => {
                        if (cacDangChon.size === dangsCuaBai.length) {
                          setCacDangChon(new Set())
                        } else {
                          setCacDangChon(new Set(dangsCuaBai.map((d) => d.ma)))
                        }
                      }}
                      className="text-xs font-semibold text-blue-600 dark:text-blue-400 hover:underline cursor-pointer"
                    >
                      {cacDangChon.size === dangsCuaBai.length ? 'Bỏ chọn tất cả' : 'Chọn tất cả'}
                    </button>
                  </div>

                  <div
                    role="region"
                    aria-label="Danh sách dạng bài"
                    tabIndex={0}
                    className="max-h-56 overflow-y-auto space-y-1.5 pr-1"
                  >
                    {dangsCuaBai.map((d) => {
                      const isSelected = cacDangChon.has(d.ma)
                      return (
                        <div
                          key={d.ma}
                          onClick={() => {
                            setCacDangChon((prev) => {
                              const s = new Set(prev)
                              if (s.has(d.ma)) s.delete(d.ma)
                              else s.add(d.ma)
                              return s
                            })
                          }}
                          className={`p-2.5 rounded-xl border flex items-center justify-between gap-2.5 cursor-pointer transition text-xs ${
                            isSelected
                              ? 'border-blue-400 bg-blue-50/60 dark:bg-blue-950/30 text-slate-900 dark:text-white'
                              : 'border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800/50 text-slate-700 dark:text-slate-300'
                          }`}
                        >
                          <div className="flex items-center gap-2.5 min-w-0">
                            <div className="text-blue-500 shrink-0">
                              {isSelected ? <CheckSquare size={16} /> : <Square size={16} />}
                            </div>
                            <span className="font-semibold truncate">{d.ten}</span>
                          </div>
                          <span className="shrink-0 text-[11px] font-bold px-2 py-0.5 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400">
                            {d.soCau} câu
                          </span>
                        </div>
                      )
                    })}
                  </div>
                </div>
              )}

              {/* Chọn số câu muốn luyện (Không lọc mức độ) */}
              {tongToiDaCheDo3 > 0 && (
                <div className="space-y-1.5">
                  <div className="flex items-center justify-between text-xs text-slate-600 dark:text-slate-400">
                    <span>Số câu muốn luyện:</span>
                    <strong className="text-blue-600 dark:text-blue-400 text-sm">
                      {soCauCheDo3} / {tongToiDaCheDo3} câu
                    </strong>
                  </div>
                  <input
                    type="range"
                    min={Math.min(5, tongToiDaCheDo3)}
                    max={tongToiDaCheDo3}
                    value={soCauCheDo3}
                    onChange={(e) => setSoCauCheDo3(Number(e.target.value))}
                    className="w-full accent-blue-500 cursor-pointer"
                  />
                </div>
              )}

              <button
                disabled={dangXuLy || dangTaiDang || cacDangChon.size === 0 || tongToiDaCheDo3 === 0}
                onClick={batDauLamBai}
                className="m3-nut-chinh w-full flex items-center justify-center gap-2 cursor-pointer"
              >
                {dangXuLy || dangTaiDang ? (
                  <RefreshCw size={16} className="animate-spin" />
                ) : (
                  <Play size={16} fill="currentColor" />
                )}
                <span>
                  {vaiTro === 'ph' ? 'Giao bài dạng bài cho con ' : 'Bắt đầu bài luyện dạng bài '}
                  {cacDangChon.size > 0 ? `(${cacDangChon.size} dạng đã chọn)` : ''}
                </span>
              </button>
            </>
          )}
        </div>
      )}

      {/* NỘI DUNG CHẾ ĐỘ 4: TỰ DO */}
      {cheDo === 4 && (
        <div className="space-y-3.5">
          {dangTaiKho2 ? (
            <div className="py-6 text-center text-xs text-slate-400 flex items-center justify-center gap-2">
              <RefreshCw size={16} className="animate-spin text-blue-500" />
              Đang tải dữ liệu kho câu...
            </div>
          ) : loiKho2 && tongToiDaCheDo4 === 0 ? (
            <div className="p-3.5 rounded-xl border border-rose-200 bg-rose-50 text-rose-700 text-xs flex items-center gap-2">
              <AlertCircle size={16} className="shrink-0" />
              <span>{loiKho2}</span>
            </div>
          ) : (
            <>
              {/* Chọn Mức độ luyện tập (Cho phép chọn nhiều lựa chọn) */}
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                    Chọn Mức độ luyện tập (chọn được nhiều):
                  </label>
                  {!isNgauNhien && (
                    <button
                      type="button"
                      onClick={() => setCacMucDoChon(new Set(['ngau_nhien']))}
                      className="text-[11px] font-semibold text-blue-600 dark:text-blue-400 hover:underline cursor-pointer"
                    >
                      Đặt lại ngẫu nhiên
                    </button>
                  )}
                </div>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-1.5 text-xs">
                  {[
                    { id: 'ngau_nhien', label: 'Ngẫu nhiên' },
                    { id: 'sao_2', label: '2 sao (Vận dụng)' },
                    { id: 'sao_1', label: '1 sao (Thông hiểu)' },
                    { id: 'ly_thuyet', label: 'Lý thuyết' },
                    { id: 'bai_tap', label: 'Bài tập' },
                  ].map((m) => {
                    const isSelected = isNgauNhien ? m.id === 'ngau_nhien' : cacMucDoChon.has(m.id)
                    return (
                      <button
                        key={m.id}
                        type="button"
                        onClick={() => toggleMucDo(m.id)}
                        className={`p-2.5 rounded-xl border text-center font-semibold transition cursor-pointer text-xs flex items-center justify-center gap-1.5 ${
                          isSelected
                            ? 'border-blue-500 bg-blue-50 dark:bg-blue-950/40 text-blue-800 dark:text-blue-200 font-bold ring-2 ring-blue-400/40 shadow-xs'
                            : 'border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-400'
                        }`}
                      >
                        {isSelected && m.id !== 'ngau_nhien' && (
                          <span className="w-1.5 h-1.5 rounded-full bg-blue-500 shrink-0" />
                        )}
                        <span>{m.label}</span>
                      </button>
                    )
                  })}
                </div>
              </div>

              {/* Chọn số câu */}
              {tongToiDaCheDo4 > 0 ? (
                <div className="space-y-1.5">
                  <div className="flex items-center justify-between text-xs text-slate-600 dark:text-slate-400">
                    <span>Số câu muốn luyện:</span>
                    <strong className="text-blue-600 dark:text-blue-400 text-sm">
                      {soCauCheDo4} / {tongToiDaCheDo4} câu
                    </strong>
                  </div>
                  <input
                    type="range"
                    min={Math.min(1, tongToiDaCheDo4)}
                    max={tongToiDaCheDo4}
                    value={soCauCheDo4}
                    onChange={(e) => setSoCauCheDo4(Number(e.target.value))}
                    className="w-full accent-blue-500 cursor-pointer"
                  />
                </div>
              ) : (
                <p className="text-xs text-slate-400 italic">Chưa có câu phù hợp với mức độ đã chọn.</p>
              )}

              <button
                disabled={dangXuLy || dangTaiKho2 || tongToiDaCheDo4 === 0}
                onClick={batDauLamBai}
                className="m3-nut-chinh w-full flex items-center justify-center gap-2 cursor-pointer"
              >
                {dangXuLy || dangTaiKho2 ? (
                  <RefreshCw size={16} className="animate-spin" />
                ) : (
                  <Play size={16} fill="currentColor" />
                )}
                <span>
                  {vaiTro === 'ph'
                    ? `Giao bài tự do cho con (${soCauCheDo4} câu)`
                    : `Bắt đầu bài luyện tự do (${soCauCheDo4} câu)`}
                </span>
              </button>
            </>
          )}
        </div>
      )}

      {/* DANH SÁCH BÀI LUYỆN CỦA EM HOẶC BÀI MOM ĐÃ GIAO */}
      <div className="overflow-hidden rounded-2xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 shadow-xs">
        <button
          type="button"
          onClick={() => setMoDanhSach(!moDanhSach)}
          className="w-full flex items-center justify-between gap-3 bg-slate-50 dark:bg-slate-800 px-4 py-3 hover:bg-slate-100/80 dark:hover:bg-slate-750 transition-colors text-left cursor-pointer"
        >
          <div className="flex items-center gap-2">
            <FileText size={16} className="text-blue-500" />
            <h3 className="font-bold text-xs sm:text-sm text-slate-800 dark:text-slate-100">
              {vaiTro === 'ph' ? 'Các bài Mom đã giao' : 'Bài luyện của em'}
            </h3>
            <span className="text-[11px] font-semibold text-blue-700 dark:text-blue-300 bg-blue-50 dark:bg-blue-950/60 border border-blue-200 dark:border-blue-800 px-2 py-0.5 rounded-full">
              {vaiTro === 'ph' ? (dsMomGiao ? dsMomGiao.length : 0) : history.length} bài
            </span>
          </div>
          <div className="flex items-center gap-1.5 text-xs text-slate-500 dark:text-slate-400">
            <span className="text-[11px] hidden sm:inline">{moDanhSach ? 'Thu gọn' : 'Xem danh sách'}</span>
            <ChevronDown size={15} className={`transition-transform duration-200 ${moDanhSach ? 'rotate-180' : ''}`} />
          </div>
        </button>

        {moDanhSach && (
          vaiTro === 'ph' ? (
            !dsMomGiao || dsMomGiao.length === 0 ? (
              <p className="p-4 text-xs text-slate-400 text-center bg-white dark:bg-slate-900 border-t border-slate-100 dark:border-slate-800">
                Chưa có bài tập nào được giao. Phụ huynh hãy chọn một trong 4 chế độ phía trên để giao bài cho con!
              </p>
            ) : (
              <div
                role="region"
                aria-label="Danh sách bài Mom đã giao"
                tabIndex={0}
                className="max-h-48 sm:max-h-52 overflow-y-auto overscroll-contain p-2 space-y-1.5 border-t border-slate-100 dark:border-slate-800"
              >
                {dsMomGiao.map((m) => {
                  const daNop = m.trangThai === 'da_nop'
                  return (
                    <div
                      key={m.id}
                      onClick={() => {
                        if (daNop && onXemKetQuaMom) {
                          onXemKetQuaMom(m)
                        }
                      }}
                      className={`p-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-800/70 transition flex items-center justify-between gap-3 ${
                        daNop ? 'hover:border-blue-300 dark:hover:border-blue-700 cursor-pointer' : ''
                      }`}
                    >
                      <div className="min-w-0 flex-1">
                        <span className="text-xs font-semibold text-slate-800 dark:text-slate-100 truncate block">
                          {m.tieuDe}
                        </span>
                        <span className="text-[11px] text-slate-400 mt-0.5 flex items-center gap-1">
                          <Clock3 size={12} />
                          {new Date(m.taoLuc).toLocaleString('vi-VN', {
                            hour: '2-digit',
                            minute: '2-digit',
                            day: '2-digit',
                            month: '2-digit',
                            year: 'numeric',
                          })}
                        </span>
                      </div>
                      <div className="flex items-center gap-2 shrink-0">
                        <span
                          className={`px-2 py-0.5 rounded-full text-[11px] font-bold ${
                            daNop
                              ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300'
                              : m.trangThai === 'dang_lam'
                              ? 'bg-blue-50 text-blue-700 dark:bg-blue-950/60 dark:text-blue-300'
                              : 'bg-blue-50 text-blue-700 dark:bg-blue-950/60 dark:text-blue-300'
                          }`}
                        >
                          {daNop
                            ? `Đã nộp: ${m.diem?.toFixed(2) ?? '—'} điểm`
                            : m.trangThai === 'dang_lam'
                            ? 'Con đang làm'
                            : 'Đã giao · Con chưa làm'}
                        </span>
                        {daNop && onXemKetQuaMom && (
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation()
                              onXemKetQuaMom(m)
                            }}
                            className="px-2.5 py-1 rounded-lg bg-blue-500 hover:bg-blue-600 text-white font-bold text-[11px] flex items-center gap-1 transition cursor-pointer shadow-xs"
                            title="Xem kết quả bài nộp"
                          >
                            <span>Xem kết quả</span>
                            <ArrowUpRight size={13} />
                          </button>
                        )}
                      </div>
                    </div>
                  )
                })}
              </div>
            )
          ) : (
            history.length === 0 ? (
              <p className="p-4 text-xs text-slate-400 text-center bg-white dark:bg-slate-900 border-t border-slate-100 dark:border-slate-800">
                Chưa có bài luyện nào. Em hãy chọn chế độ phía trên để bắt đầu làm bài!
              </p>
            ) : (
              <div
                role="region"
                aria-label="Danh sách bài luyện của em"
                tabIndex={0}
                className="max-h-48 sm:max-h-52 overflow-y-auto overscroll-contain p-2 space-y-1.5 border-t border-slate-100 dark:border-slate-800"
              >
                {history.map((h) => {
                  const daNop = h.status === 'submitted'
                  return (
                    <div
                      key={h.id}
                      onClick={() => setCurrentTest(h)}
                      className="p-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-800/70 hover:border-blue-300 dark:hover:border-blue-700 transition flex items-center justify-between gap-3 cursor-pointer"
                    >
                      <div className="min-w-0 flex-1">
                        <span className="text-xs font-semibold text-slate-800 dark:text-slate-100 truncate block">
                          {h.tieuDe}
                        </span>
                        <span className="text-[11px] text-slate-400 mt-0.5 block">
                          {new Date(h.createdAt).toLocaleString('vi-VN', {
                            hour: '2-digit',
                            minute: '2-digit',
                            day: '2-digit',
                            month: '2-digit',
                            year: 'numeric',
                          })}
                        </span>
                      </div>
                      <div className="flex items-center gap-2 shrink-0">
                        <span
                          className={`px-2 py-0.5 rounded-full text-[11px] font-bold ${
                            daNop
                              ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300'
                              : 'bg-blue-50 text-blue-700 dark:bg-blue-950/60 dark:text-blue-300'
                          }`}
                        >
                          {daNop ? `${typeof h.score === 'number' ? h.score.toFixed(2) : '--'} điểm` : 'Đang làm'}
                        </span>
                        <button
                          onClick={(e) => xoaBai(h.id, e)}
                          title="Xoá bài luyện này"
                          className="text-slate-300 hover:text-rose-500 p-1 rounded transition cursor-pointer"
                        >
                          <Trash2 size={14} />
                        </button>
                        <ArrowUpRight size={14} className="text-slate-400" />
                      </div>
                    </div>
                  )
                })}
              </div>
            )
          )
        )}
      </div>
    </section>
  )
}
