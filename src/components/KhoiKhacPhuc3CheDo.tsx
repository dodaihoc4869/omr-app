import { useEffect, useMemo, useRef, useState } from 'react'
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
} from 'lucide-react'
import TheCau from './TheCau'
import { docSoDem } from './DongDemCau'
import {
  danhMucDangBai,
  deTheoDangBai,
  hsCauSaiApi,
  type LopDangBai,
  type DangBaiMuc,
} from '../lib/exam-api'
import { parseKhoDeJson, buildTeacherSourceFromKhoDe } from '../lib/exam-kho-de-import'
import {
  taoDeLamLaiCauSai,
  rutLuyenDangBai,
  demCauDangBai,
  type BoLocCauLuyen,
  type CauSaiDauVao,
} from '../lib/thuat-toan-rut-cau-sai'
import type { CauLuyen } from '../lib/bai-tap-pdf'
import { normalizeNumericAnswer } from '../engine/score'
import { loadScriptUrlHoacMacDinh } from '../lib/exam-db'
import type { TeacherExamSource } from '../data/examContent'

export interface BaiLuyenKhacPhuc {
  id: string
  tieuDe: string
  cheDo: 1 | 2 | 3
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
  hoTen,
  dsLichSu,
  scriptUrl: scriptUrlProp,
}: KhoiKhacPhuc3CheDoProps) {
  const [cheDo, setCheDo] = useState<1 | 2 | 3>(1)
  const [dangXuLy, setDangXuLy] = useState(false)
  const [loi, setLoi] = useState('')

  // Chế độ 1: Rút từ ca đã thi
  const [cacCaChon, setCacCaChon] = useState<Set<string>>(() => {
    const s = new Set<string>()
    for (const c of dsLichSu) {
      if ((docSoDem(c)?.soCanKhacPhuc ?? 0) > 0) s.add(c.maCa)
    }
    if (s.size === 0 && dsLichSu.length > 0) s.add(dsLichSu[0].maCa)
    return s
  })

  // Chế độ 3: Theo SGK 10, 11, 12
  const [dmDangBai, setDmDangBai] = useState<LopDangBai[]>([])
  const [dangTaiDm, setDangTaiDm] = useState(false)
  const [lopChon, setLopChon] = useState('12')
  const [baiChon, setBaiChon] = useState('')
  const [dangChon, setDangChon] = useState<DangBaiMuc | null>(null)
  const [mucDo, setMucDo] = useState<'ngau_nhien' | 'sao_2' | 'sao_1' | 'ly_thuyet' | 'bai_tap'>('ngau_nhien')
  const [soCauCheDo3, setSoCauCheDo3] = useState<number>(20)
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
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null)

  // Lưu lịch sử vào localStorage
  const luuHistory = (items: BaiLuyenKhacPhuc[]) => {
    setHistory(items)
    try {
      localStorage.setItem(historyKey, JSON.stringify(items))
    } catch {}
  }

  // Tải danh mục dạng bài cho Chế độ 3
  useEffect(() => {
    let alive = true
    void (async () => {
      setDangTaiDm(true)
      try {
        const url = scriptUrlProp || (await loadScriptUrlHoacMacDinh().catch(() => ''))
        const kq = await danhMucDangBai(url)
        if (!alive) return
        if (kq.lops && kq.lops.length > 0) {
          setDmDangBai(kq.lops)
          const l12 = kq.lops.find((l) => l.lop === '12') || kq.lops[0]
          setLopChon(l12.lop)
          if (l12.bais && l12.bais.length > 0) {
            setBaiChon(l12.bais[0].tenBai)
            if (l12.bais[0].dangs && l12.bais[0].dangs.length > 0) {
              setDangChon(l12.bais[0].dangs[0])
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
        setDangChon(l.bais[0].dangs[0])
      } else {
        setDangChon(null)
      }
    } else {
      setBaiChon('')
      setDangChon(null)
    }
  }

  // Khi đổi bài
  const handleChonBai = (tenBai: string) => {
    setBaiChon(tenBai)
    const b = baisCuaLop.find((x) => x.tenBai === tenBai)
    if (b && b.dangs.length > 0) {
      setDangChon(b.dangs[0])
    } else {
      setDangChon(null)
    }
  }

  // Tải đề khi chọn dạng bài
  useEffect(() => {
    if (!dangChon) {
      setKhoDangBai([])
      return
    }
    let alive = true
    void (async () => {
      setDangTaiDang(true)
      try {
        const url = scriptUrlProp || (await loadScriptUrlHoacMacDinh().catch(() => ''))
        const kq = await deTheoDangBai(url, dangChon.ma)
        if (!alive) return
        if (kq.de) {
          const doc = parseKhoDeJson(kq.de)
          if (doc.ok && doc.json) {
            const dung = buildTeacherSourceFromKhoDe(doc.json)
            if (dung.errors.length === 0) {
              setKhoDangBai([dung.source])
            }
          }
        }
      } catch {
      } finally {
        if (alive) setDangTaiDang(false)
      }
    })()
    return () => {
      alive = false
    }
  }, [dangChon, scriptUrlProp])

  // Đếm số câu tối đa của dạng đang chọn
  const boLocCheDo3: BoLocCauLuyen = useMemo(() => {
    if (mucDo === 'sao_2') return { sao: 'sao_2', dang: 'tat_ca' }
    if (mucDo === 'sao_1') return { sao: 'sao_1', dang: 'tat_ca' }
    if (mucDo === 'ly_thuyet') return { sao: 'moi', dang: 'ly_thuyet' }
    if (mucDo === 'bai_tap') return { sao: 'moi', dang: 'bai_tap' }
    return { sao: 'moi', dang: 'tat_ca' }
  }, [mucDo])

  const tongToiDaCheDo3 = useMemo(() => demCauDangBai(khoDangBai, boLocCheDo3), [khoDangBai, boLocCheDo3])

  useEffect(() => {
    if (tongToiDaCheDo3 > 0) {
      setSoCauCheDo3((prev) => Math.min(tongToiDaCheDo3, Math.max(5, Math.min(prev, 50))))
    }
  }, [tongToiDaCheDo3])

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

  // BẮT ĐẦU LÀM BÀI
  const batDauLamBai = async () => {
    setDangXuLy(true)
    setLoi('')
    try {
      const url = scriptUrlProp || (await loadScriptUrlHoacMacDinh().catch(() => ''))

      if (cheDo === 1) {
        // Chế độ 1: Rút từ ca đã chọn
        const dsMa = Array.from(cacCaChon)
        if (dsMa.length === 0) {
          setLoi('Vui lòng chọn ít nhất 1 ca thi để rút câu sai.')
          return
        }
        const res = await hsCauSaiApi(url, sbd, dsMa)
        if (!res.ok || !res.items || res.items.length === 0) {
          setLoi(res.error || 'Các ca thi đã chọn không có câu sai nào cần khắc phục!')
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
        // Chế độ 2: Toàn bộ câu sai
        const res = await hsCauSaiApi(url, sbd, [])
        if (!res.ok || !res.items || res.items.length === 0) {
          setLoi('Tuyệt vời! Em không có câu sai nào trong lịch sử các ca thi.')
          return
        }
        const { dsCau } = taoDeLamLaiCauSai(res.items as CauSaiDauVao[], {
          hoTen,
          sbd,
          tenDe: 'Toàn bộ câu sai trong lịch sử',
        })
        if (dsCau.length === 0) {
          setLoi('Không rút được câu hỏi nào.')
          return
        }
        const tieuDe = `Khắc phục: Toàn bộ câu sai (${dsCau.length} câu)`
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
        // Chế độ 3: Theo SGK 10, 11, 12
        if (!dangChon) {
          setLoi('Vui lòng chọn bài học và dạng bài trước khi bắt đầu.')
          return
        }
        if (khoDangBai.length === 0) {
          setLoi('Dạng bài này chưa có đề trong kho hoặc đang tải. Em thử lại sau giây lát.')
          return
        }
        const { dsCau } = rutLuyenDangBai(
          khoDangBai,
          soCauCheDo3,
          {
            hoTen,
            sbd,
            tenDang: dangChon.ten,
            tenBai: baiChon,
            lop: lopChon,
          },
          boLocCheDo3
        )
        if (dsCau.length === 0) {
          setLoi('Không tìm thấy câu hỏi phù hợp với bộ lọc đã chọn.')
          return
        }
        const tieuDe = `Luyện SGK ${lopChon}: ${baiChon} - ${dangChon.ten} (${dsCau.length} câu)`
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
    if (!window.confirm('Em có chắc chắn muốn nộp bài luyện này không?')) return

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

  const panel = 'p-4 sm:p-6 rounded-2xl border border-amber-200 dark:border-amber-900/50 bg-white dark:bg-slate-900 space-y-5 shadow-sm'

  // NẾU ĐANG LÀM BÀI HOẶC XEM LẠI BÀI LUYỆN
  if (currentTest) {
    const daNop = currentTest.status === 'submitted'
    return (
      <section className={`${panel} ${daNop ? '' : 'pb-28 sm:pb-28'}`}>
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 dark:border-slate-800 pb-4">
          <div>
            <button
              onClick={() => setCurrentTest(null)}
              className="inline-flex items-center gap-1.5 text-xs font-semibold text-amber-600 dark:text-amber-400 hover:underline mb-1 cursor-pointer"
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
                  Kết quả: <strong>{currentTest.score?.toFixed(2)} / 10 điểm</strong>
                </div>
                <div className="text-[11px] text-emerald-600 dark:text-emerald-400">
                  Đúng {currentTest.soCauDung} / {currentTest.tongSoCau} câu
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Thanh công cụ nộp bài cố định dưới đáy */}
        {!daNop &&
          createPortal(
            <div
              data-practice-toolbar
              className="fixed inset-x-0 bottom-0 z-40 px-3 pt-2"
              style={{
                paddingBottom: 'max(12px, env(safe-area-inset-bottom))',
                pointerEvents: 'none',
              }}
            >
              <div
                className="mx-auto flex max-w-3xl items-center justify-between gap-3 rounded-2xl border border-amber-300 dark:border-amber-700 bg-white/95 dark:bg-slate-900/95 backdrop-blur-md p-3 shadow-xl"
                style={{ pointerEvents: 'auto' }}
              >
                <div className="min-w-0">
                  <div className="flex items-center gap-2 font-bold tabular-nums text-slate-900 dark:text-white text-sm">
                    <Clock3 size={18} className="text-amber-500" />
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
                  onClick={nopBai}
                  className="shrink-0 rounded-xl bg-amber-500 hover:bg-amber-600 px-5 py-2.5 text-sm font-bold text-white shadow-sm disabled:opacity-50 transition cursor-pointer"
                >
                  Nộp bài
                </button>
              </div>
            </div>,
            document.body
          )}

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
      </section>
    )
  }

  // MÀN HÌNH CHỌN 3 CHẾ ĐỘ & DANH SÁCH BÀI LUYỆN
  return (
    <section className={panel}>
      <div>
        <div className="flex items-center gap-2 text-amber-600 dark:text-amber-400 font-bold text-lg">
          <Sparkles size={20} />
          <h2>3 CHẾ ĐỘ KHẮC PHỤC CÂU SAI</h2>
        </div>
        <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
          Hệ thống tự động phân tích và tạo bài luyện khắc phục theo nhu cầu của em
        </p>
      </div>

      {/* 3 Nút chọn chế độ */}
      <div className="grid grid-cols-3 gap-1.5 p-1 bg-slate-100 dark:bg-slate-800 rounded-xl">
        <button
          onClick={() => {
            setCheDo(1)
            setLoi('')
          }}
          className={`py-2 px-1 text-center rounded-lg text-xs font-semibold transition cursor-pointer ${
            cheDo === 1
              ? 'bg-white dark:bg-slate-700 text-amber-600 dark:text-amber-400 shadow-sm'
              : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
          }`}
        >
          1. Rút từ ca
        </button>
        <button
          onClick={() => {
            setCheDo(2)
            setLoi('')
          }}
          className={`py-2 px-1 text-center rounded-lg text-xs font-semibold transition cursor-pointer ${
            cheDo === 2
              ? 'bg-white dark:bg-slate-700 text-amber-600 dark:text-amber-400 shadow-sm'
              : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
          }`}
        >
          2. Toàn bộ câu sai
        </button>
        <button
          onClick={() => {
            setCheDo(3)
            setLoi('')
          }}
          className={`py-2 px-1 text-center rounded-lg text-xs font-semibold transition cursor-pointer ${
            cheDo === 3
              ? 'bg-white dark:bg-slate-700 text-amber-600 dark:text-amber-400 shadow-sm'
              : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
          }`}
        >
          3. Theo SGK
        </button>
      </div>

      {loi && (
        <div className="p-3 bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800 rounded-xl text-rose-700 dark:text-rose-300 text-xs flex items-center gap-2">
          <AlertCircle size={16} className="shrink-0" />
          <span>{loi}</span>
        </div>
      )}

      {/* NỘI DUNG CHẾ ĐỘ 1: RÚT TỪ CA */}
      {cheDo === 1 && (
        <div className="space-y-3">
          <div className="flex items-center justify-between text-xs text-slate-500 dark:text-slate-400">
            <span>Chọn các ca thi để rút câu làm sai:</span>
            <button
              onClick={() => {
                if (cacCaChon.size === dsLichSu.length) {
                  setCacCaChon(new Set())
                } else {
                  setCacCaChon(new Set(dsLichSu.map((c) => c.maCa)))
                }
              }}
              className="text-amber-600 dark:text-amber-400 font-semibold hover:underline cursor-pointer"
            >
              {cacCaChon.size === dsLichSu.length ? 'Bỏ chọn tất cả' : 'Chọn tất cả'}
            </button>
          </div>

          {dsLichSu.length === 0 ? (
            <p className="p-4 text-xs text-slate-400 text-center bg-slate-50 dark:bg-slate-800 rounded-xl">
              Chưa có dữ liệu ca thi nào.
            </p>
          ) : (
            <div
              role="region"
              aria-label="Danh sách ca thi chọn rút câu sai"
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
                        ? 'border-amber-400 bg-amber-50/50 dark:bg-amber-950/20 text-slate-900 dark:text-white'
                        : 'border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800/50 text-slate-700 dark:text-slate-300'
                    }`}
                  >
                    <div className="flex items-center gap-2.5 min-w-0">
                      <div className="text-amber-500">
                        {isSelected ? <CheckSquare size={16} /> : <Square size={16} />}
                      </div>
                      <div className="min-w-0">
                        <span className="font-semibold truncate block">
                          #{item.maCa} · {item.tenCa || `Ca ${item.maCa}`}
                        </span>
                        <span className="text-[11px] text-slate-400">
                          Điểm: {item.tong !== null ? item.tong.toFixed(2) : '--'}
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
            className="w-full py-3 px-4 rounded-xl bg-amber-500 hover:bg-amber-600 text-white font-bold text-xs sm:text-sm shadow-sm flex items-center justify-center gap-2 disabled:opacity-50 transition cursor-pointer"
          >
            {dangXuLy ? (
              <RefreshCw size={16} className="animate-spin" />
            ) : (
              <Play size={16} fill="currentColor" />
            )}
            <span>Bắt đầu làm bài ({cacCaChon.size} ca đã chọn)</span>
          </button>
        </div>
      )}

      {/* NỘI DUNG CHẾ ĐỘ 2: TOÀN BỘ CÂU SAI */}
      {cheDo === 2 && (
        <div className="space-y-4">
          <div className="p-4 bg-amber-50/50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-800 rounded-xl space-y-2">
            <div className="flex items-center gap-2 font-semibold text-xs text-amber-800 dark:text-amber-200">
              <Layers size={16} />
              Quét toàn bộ câu sai từ trước đến nay
            </div>
            <p className="text-xs text-slate-600 dark:text-slate-400">
              Hệ thống sẽ tự động quét tất cả ca thi của em để trích xuất các câu làm sai và tạo bài ôn tập tổng hợp.
            </p>
          </div>

          <button
            disabled={dangXuLy}
            onClick={batDauLamBai}
            className="w-full py-3 px-4 rounded-xl bg-amber-500 hover:bg-amber-600 text-white font-bold text-xs sm:text-sm shadow-sm flex items-center justify-center gap-2 disabled:opacity-50 transition cursor-pointer"
          >
            {dangXuLy ? (
              <RefreshCw size={16} className="animate-spin" />
            ) : (
              <Play size={16} fill="currentColor" />
            )}
            <span>Bắt đầu làm lại toàn bộ câu sai</span>
          </button>
        </div>
      )}

      {/* NỘI DUNG CHẾ ĐỘ 3: THEO SGK 10, 11, 12 */}
      {cheDo === 3 && (
        <div className="space-y-3.5">
          {dangTaiDm ? (
            <div className="py-6 text-center text-xs text-slate-400 flex items-center justify-center gap-2">
              <RefreshCw size={16} className="animate-spin text-amber-500" />
              Đang tải danh mục SGK...
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
                          ? 'border-amber-500 bg-amber-500 text-white'
                          : 'border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:border-amber-300'
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
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-amber-500"
                  >
                    {baisCuaLop.map((b) => (
                      <option key={b.tenBai} value={b.tenBai}>
                        {b.tenBai} ({b.dangs.length} dạng)
                      </option>
                    ))}
                  </select>
                </div>
              )}

              {/* Chọn Dạng bài trọng tâm */}
              {dangsCuaBai.length > 0 && (
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    3. Chọn Dạng toán trọng tâm:
                  </label>
                  <select
                    value={dangChon?.ma || ''}
                    onChange={(e) => {
                      const d = dangsCuaBai.find((x) => x.ma === e.target.value) || null
                      setDangChon(d)
                    }}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-amber-500"
                  >
                    {dangsCuaBai.map((d) => (
                      <option key={d.ma} value={d.ma}>
                        {d.ten} ({d.soCau} câu)
                      </option>
                    ))}
                  </select>
                </div>
              )}

              {/* Chọn Mức độ */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  4. Chọn Mức độ:
                </label>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-1.5 text-xs">
                  {[
                    { id: 'ngau_nhien', label: 'Ngẫu nhiên' },
                    { id: 'sao_2', label: '2 sao (Vận dụng)' },
                    { id: 'sao_1', label: '1 sao (Thông hiểu)' },
                    { id: 'ly_thuyet', label: 'Lý thuyết' },
                    { id: 'bai_tap', label: 'Bài tập' },
                  ].map((m) => (
                    <button
                      key={m.id}
                      type="button"
                      onClick={() => setMucDo(m.id as any)}
                      className={`p-2 rounded-xl border text-center font-medium transition cursor-pointer text-[11px] ${
                        mucDo === m.id
                          ? 'border-amber-500 bg-amber-50 dark:bg-amber-950/40 text-amber-700 dark:text-amber-300 font-bold'
                          : 'border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-400'
                      }`}
                    >
                      {m.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Chọn số câu */}
              {tongToiDaCheDo3 > 0 && (
                <div className="space-y-1.5">
                  <div className="flex items-center justify-between text-xs text-slate-600 dark:text-slate-400">
                    <span>Số câu muốn luyện:</span>
                    <strong className="text-amber-600 dark:text-amber-400 text-sm">
                      {soCauCheDo3} / {tongToiDaCheDo3} câu
                    </strong>
                  </div>
                  <input
                    type="range"
                    min={Math.min(5, tongToiDaCheDo3)}
                    max={tongToiDaCheDo3}
                    value={soCauCheDo3}
                    onChange={(e) => setSoCauCheDo3(Number(e.target.value))}
                    className="w-full accent-amber-500 cursor-pointer"
                  />
                </div>
              )}

              <button
                disabled={dangXuLy || dangTaiDang || !dangChon}
                onClick={batDauLamBai}
                className="w-full py-3 px-4 rounded-xl bg-amber-500 hover:bg-amber-600 text-white font-bold text-xs sm:text-sm shadow-sm flex items-center justify-center gap-2 disabled:opacity-50 transition cursor-pointer"
              >
                {dangXuLy || dangTaiDang ? (
                  <RefreshCw size={16} className="animate-spin" />
                ) : (
                  <Play size={16} fill="currentColor" />
                )}
                <span>Bắt đầu bài luyện SGK</span>
              </button>
            </>
          )}
        </div>
      )}

      {/* DANH SÁCH BÀI LUYỆN CỦA EM */}
      <div className="pt-2 border-t border-slate-100 dark:border-slate-800">
        <div className="flex items-center justify-between mb-2.5">
          <h3 className="font-bold text-xs sm:text-sm text-slate-800 dark:text-slate-200 flex items-center gap-1.5">
            <FileText size={16} className="text-amber-500" />
            Bài luyện của em
          </h3>
          <span className="text-[11px] text-slate-400">{history.length} bài</span>
        </div>

        {history.length === 0 ? (
          <p className="p-4 text-xs text-slate-400 text-center bg-slate-50 dark:bg-slate-800/50 rounded-xl">
            Chưa có bài luyện nào. Em hãy chọn chế độ phía trên để bắt đầu làm bài!
          </p>
        ) : (
          <div
            role="region"
            aria-label="Danh sách bài luyện của em"
            tabIndex={0}
            className="max-h-60 overflow-y-auto space-y-2 pr-1"
          >
            {history.map((h) => {
              const daNop = h.status === 'submitted'
              return (
                <div
                  key={h.id}
                  onClick={() => setCurrentTest(h)}
                  className="p-3 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-800/70 hover:border-amber-300 dark:hover:border-amber-700 transition flex items-center justify-between gap-3 cursor-pointer"
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
                      className={`px-2.5 py-1 rounded-full text-[11px] font-bold ${
                        daNop
                          ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300'
                          : 'bg-amber-50 text-amber-700 dark:bg-amber-950/60 dark:text-amber-300'
                      }`}
                    >
                      {daNop ? `${h.score?.toFixed(2)} điểm` : 'Đang làm'}
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
        )}
      </div>
    </section>
  )
}
