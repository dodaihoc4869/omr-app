// PHÂN CÔNG — hai việc sau một ca thi, chung một chỗ.
//
// Thầy chốt 11/09: đổi mục "Phân công lên bảng" thành **Phân công**, trong đó
// có hai phần: **Giao bài tập về nhà** (mới) và **Gọi lên bảng** (giữ nguyên).
//
// MÀN GỌI LÊN BẢNG KHÔNG BỊ ĐỤNG MỘT DÒNG NÀO. Nó được lồng nguyên vào thẻ thứ
// hai — đúng điều cấm trong đặc tả `claude/PHAN-CONG-GIAO-BTVN.md`.
//
// Phần giao bài tập chạy 0% Apps Script: ca và đề đọc từ máy chủ mới, bài giao
// và bài nộp cũng ở đó.
import { useCallback, useEffect, useMemo, useState } from 'react'
import { CheckSquare, ClipboardList, Presentation, RefreshCw, Search, Square, UserCheck, Users } from 'lucide-react'
import { Nhan, NutChinh, OThongBao, TheNoiDung } from '../components/DesignSystem'
import GoiLenBangScreen from './GoiLenBangScreen'
import { danhSachCa, danhSachEm, type CaTomTat, type EmTomTat } from '../lib/exam-api'
import { loadScriptUrl, loadTeacherSecret } from '../lib/exam-db'
import { layCauHinhMayChu } from '../lib/may-chu-moi'
import { luotCuaCaMoi } from '../lib/day-ca-may-chu-moi'
import { giaoBtvn, theoDoiBtvn, type DongTheoDoiBtvn } from '../lib/btvn-may-chu-moi'
import HopChonDe from '../components/HopChonDe'
import HangNhomDe from '../components/HangNhomDe'
import { tachNhieuTheoPhan } from '../lib/tach-phan-de'
import { loadExamSources } from '../lib/exam-db'
import type { TeacherExamSource } from '../data/examContent'

const NHAN_NHO: React.CSSProperties = { fontFamily: 'var(--sans)', fontSize: 'var(--cx-1)', color: 'var(--nhat)', lineHeight: 1.6 }

interface DeKho {
  maDe: string
  tenDe: string
  soCau: number
}

function gioVN(iso: string): string {
  const d = new Date(iso)
  if (!Number.isFinite(d.getTime())) return ''
  return `${String(d.getDate()).padStart(2, '0')}/${String(d.getMonth() + 1).padStart(2, '0')} ${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`
}

export default function PhanCongScreen() {
  const [the, setThe] = useState<'btvn' | 'lenbang'>('btvn')
  return (
    <div style={{ display: 'grid', gap: 'var(--k3)' }}>
      <div className="flex items-center" style={{ gap: 'var(--k2)' }}>
        <NutChinh variant={the === 'btvn' ? undefined : 'phu'} onClick={() => setThe('btvn')}>
          <span className="inline-flex items-center gap-2">
            <ClipboardList size={18} /> Giao bài tập về nhà
          </span>
        </NutChinh>
        <NutChinh variant={the === 'lenbang' ? undefined : 'phu'} onClick={() => setThe('lenbang')}>
          <span className="inline-flex items-center gap-2">
            <Presentation size={18} /> Gọi lên bảng
          </span>
        </NutChinh>
      </div>
      {the === 'btvn' ? <TheGiaoBtvn /> : <GoiLenBangScreen />}
    </div>
  )
}

function TheGiaoBtvn() {
  const [cheDo, setCheDo] = useState<'ca' | 'hoc_sinh'>('ca')
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
  const [dsEm, setDsEm] = useState<EmTomTat[]>([])
  const [luotCacCa, setLuotCacCa] = useState<Record<string, { sbd: string; hoTen: string; diem?: number | null; nopLuc?: string }[]>>({})
  const [dangTaiLuot, setDangTaiLuot] = useState(false)
  const [timKiemHs, setTimKiemHs] = useState('')
  const [nguonHsLoc, setNguonHsLoc] = useState<'ca_da_chon' | 'tat_ca'>('ca_da_chon')
  const [lopHsLoc, setLopHsLoc] = useState('')

  // NGUỒN ĐỀ LẤY Y NHƯ MÀN MỞ CA: kho trên máy thầy, tách theo phần, rồi đưa
  // vào ĐÚNG hộp chọn đề đang chạy ở đó (`HopChonDe`). Thầy chốt 12/09: "phần
  // giao btvn tôi muốn hiển thị đúng như trong mở ca".
  const [nguonKho, setNguonKho] = useState<TeacherExamSource[]>([])
  const [nhomLoc, setNhomLoc] = useState('')
  const [dangNap, setDangNap] = useState(true)
  const [dangGiao, setDangGiao] = useState(false)
  const [bao, setBao] = useState<{ ok: boolean; chu: string } | null>(null)
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
      setSbdChon((prev) => {
        const tiep = new Set(prev)
        for (const m of canTai) {
          for (const e of kq[m] ?? []) {
            if (e.sbd) tiep.add(e.sbd)
          }
        }
        return tiep
      })
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

  const dsLopHs = useMemo(() => {
    const set = new Set<string>()
    for (const e of dsEm) {
      if (e.lop?.trim()) set.add(e.lop.trim())
    }
    for (const c of dsCa) {
      if (c.lop?.trim()) set.add(c.lop.trim())
    }
    return Array.from(set).sort()
  }, [dsEm, dsCa])

  const dsHsHienThi = useMemo(() => {
    let goc: { sbd: string; hoTen: string; lop?: string; diem?: number | null; maCa?: string }[] = []
    if (nguonHsLoc === 'ca_da_chon' && caChon.size > 0) {
      goc = dsHsTrongCa
    } else {
      goc = dsEm.map((e) => ({
        sbd: e.sbd,
        hoTen: e.hoTen,
        lop: e.lop,
        diem: e.diemGanNhat,
        maCa: e.caGanNhat,
      }))
    }

    if (lopHsLoc) {
      goc = goc.filter((e) => (e.lop || '').trim() === lopHsLoc)
    }

    const q = timKiemHs.trim().toLowerCase()
    if (q) {
      goc = goc.filter(
        (e) =>
          e.sbd.toLowerCase().includes(q) ||
          e.hoTen.toLowerCase().includes(q) ||
          (e.lop || '').toLowerCase().includes(q),
      )
    }

    return goc
  }, [nguonHsLoc, caChon.size, dsHsTrongCa, dsEm, lopHsLoc, timKiemHs])

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

  // CHỈ HIỆN NHỮNG TỜ MÁY CHỦ ĐÃ CÓ. Kho trên máy thầy nhiều hơn kho đã chuyển
  // sang máy chủ; cho tick một tờ máy chủ chưa có thì bấm Giao mới báo lỗi —
  // muộn, và thầy không biết vì sao.
  const maTrenMayChu = useMemo(() => new Set(dsDe.map((d) => d.maDe)), [dsDe])
  const nguonGiaoDuoc = useMemo(() => nguonKho.filter((s) => maTrenMayChu.has(s.maDe)), [nguonKho, maTrenMayChu])
  const soChuaChuyen = nguonKho.length - nguonGiaoDuoc.length
  const dsDeTach = useMemo(() => tachNhieuTheoPhan(nguonGiaoDuoc), [nguonGiaoDuoc])
  const dsNhom = useMemo(
    () => Array.from(new Set(nguonGiaoDuoc.map((c) => (c.nhom || '').trim()).filter(Boolean))).sort(),
    [nguonGiaoDuoc],
  )
  // Số câu của đúng những mã đã tick — mã đã tách thì chỉ đếm phần của nó.
  const tongCauDaChon = useMemo(
    () => dsDeTach.filter((d) => daChon.has(d.maDe)).reduce((t, d) => t + d.phanI.length + d.phanII.length + d.phanIII.length, 0),
    [dsDeTach, daChon],
  )

  async function giao() {
    setDangGiao(true)
    setBao(null)
    try {
      const mat = (await loadTeacherSecret()) ?? ''
      const ch = await layCauHinhMayChu()
      const dsSbdGui = cheDo === 'hoc_sinh' ? Array.from(sbdChon) : undefined
      const dsCaGui = cheDo === 'hoc_sinh' ? [] : [...caChon]
      const kq = await giaoBtvn(ch, mat, dsCaGui, [...daChon], dsSbdGui)
      const boQua = kq.caRong && kq.caRong.length > 0 ? ` Bỏ qua ${kq.caRong.length} ca chưa em nào vào thi: ${kq.caRong.join(', ')}.` : ''
      const noiDungCa = kq.soCa ? ` ở ${kq.soCa} ca` : ''
      setBao({
        ok: true,
        chu: `Đã giao ${kq.soCau} câu (${daChon.size} tờ đề) cho ${kq.soEm} em${noiDungCa}. Hạn nộp ${gioVN(kq.hanNop)}.${boQua}`,
      })
      // Kho trên MÁY THẦY — cùng nguồn màn Mở ca đọc.
      setNguonKho(await loadExamSources())

      setTheoDoi(await theoDoiBtvn(ch, mat))
    } catch (e) {
      setBao({ ok: false, chu: e instanceof Error ? e.message : 'Không giao được' })
    } finally {
      setDangGiao(false)
    }
  }

  return (
    <div style={{ display: 'grid', gap: 'var(--k3)' }}>
      <TheNoiDung>
        <div style={{ display: 'grid', gap: 'var(--k3)' }}>
          {/* LỰA CHỌN HÌNH THỨC GIAO BÀI */}
          <div className="flex items-center flex-wrap" style={{ gap: 'var(--k2)', marginBottom: 'var(--k1)' }}>
            <span style={{ ...NHAN_NHO, fontWeight: 600, color: 'var(--muc)' }}>Hình thức giao:</span>
            <button
              type="button"
              onClick={() => setCheDo('ca')}
              className="tap-target font-semibold inline-flex items-center gap-1.5"
              style={{
                padding: '6px 14px',
                borderRadius: 'var(--bo-tron)',
                fontSize: 'var(--cx-1)',
                background: cheDo === 'ca' ? 'var(--xanh)' : 'var(--the-2)',
                color: cheDo === 'ca' ? '#fff' : 'var(--muc)',
                border: '1px solid ' + (cheDo === 'ca' ? 'var(--xanh)' : 'var(--vien)'),
                cursor: 'pointer',
              }}
            >
              <Users size={16} /> Theo ca thi (cả lớp)
            </button>
            <button
              type="button"
              onClick={chuyenSangHocSinh}
              className="tap-target font-semibold inline-flex items-center gap-1.5"
              style={{
                padding: '6px 14px',
                borderRadius: 'var(--bo-tron)',
                fontSize: 'var(--cx-1)',
                background: cheDo === 'hoc_sinh' ? 'var(--xanh)' : 'var(--the-2)',
                color: cheDo === 'hoc_sinh' ? '#fff' : 'var(--muc)',
                border: '1px solid ' + (cheDo === 'hoc_sinh' ? 'var(--xanh)' : 'var(--vien)'),
                cursor: 'pointer',
              }}
            >
              <UserCheck size={16} /> Cho từng học sinh ({sbdChon.size} em)
            </button>
          </div>

          {cheDo === 'ca' && (
            <div>
              <div className="flex items-center" style={{ justifyContent: 'space-between', gap: 'var(--k2)', marginBottom: 'var(--k2)' }}>
                <span style={NHAN_NHO}>
                  Ca đã thi — tick nhiều ca, bài giao cho đúng những em có lượt trong các ca ấy
                </span>
                {dsCa.length > 1 && (
                  <button
                    type="button"
                    className="tap-target"
                    onClick={chonTatCaCa}
                    style={{ ...NHAN_NHO, textDecoration: 'underline', whiteSpace: 'nowrap' }}
                  >
                    {caChon.size === dsCa.length ? 'Bỏ hết' : 'Chọn hết'}
                  </button>
                )}
              </div>

              {dsCa.length === 0 ? (
                <div style={NHAN_NHO}>{dangNap ? 'Đang lấy danh sách ca…' : 'Chưa có ca nào đã thi.'}</div>
              ) : (
                <div style={{ display: 'grid', gap: 'var(--k2)', maxHeight: 240, overflowY: 'auto' }}>
                  {dsCa.map((c) => {
                    const chon = caChon.has(c.maCa)
                    return (
                      <button
                        key={c.maCa}
                        type="button"
                        onClick={() => batCa(c.maCa)}
                        className="tap-target"
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: 'var(--k3)',
                          textAlign: 'left',
                          minHeight: 56,
                          padding: 'var(--k2) var(--k3)',
                          borderRadius: 'var(--bo-1)',
                          background: chon ? 'var(--xanh-nen)' : 'var(--the-2)',
                          border: `1.5px solid ${chon ? 'var(--xanh)' : 'transparent'}`,
                          transitionProperty: 'background-color, border-color',
                          transitionDuration: 'var(--nhanh)',
                        }}
                        aria-pressed={chon}
                      >
                        <span style={{ color: chon ? 'var(--xanh)' : 'var(--mo)', display: 'flex', flex: '0 0 auto' }}>
                          {chon ? <CheckSquare size={20} /> : <Square size={20} />}
                        </span>
                        <span style={{ display: 'grid', gap: 2, minWidth: 0, flex: 1 }}>
                          <span style={{ fontFamily: 'var(--sans)', fontSize: 'var(--cx-1)', color: 'var(--muc)', fontWeight: 600, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                            {c.tenCa || `Ca ${c.maCa}`}
                          </span>
                          <span style={NHAN_NHO}>
                            {c.maCa}
                            {c.lop ? ` · lớp ${c.lop}` : ''} · <b style={{ fontVariantNumeric: 'tabular-nums' }}>{c.daNop}/{c.daVao}</b> nộp
                            {c.moLuc ? ` · ${gioVN(c.moLuc)}` : ''}
                          </span>
                        </span>
                      </button>
                    )
                  })}
                </div>
              )}

              {caChon.size > 0 && (
                <div className="flex items-center justify-between flex-wrap" style={{ ...NHAN_NHO, marginTop: 'var(--k2)' }}>
                  <span>
                    Đã tick <b>{caChon.size}</b> ca · <b>{dsCa.filter((c) => caChon.has(c.maCa)).reduce((t, c) => t + c.daVao, 0)}</b> lượt vào thi
                    {' '}(em thi hai ca chỉ nhận một bài).
                  </span>
                  <button
                    type="button"
                    onClick={chuyenSangHocSinh}
                    style={{ color: 'var(--xanh)', textDecoration: 'underline', cursor: 'pointer', background: 'none', border: 'none', padding: 0, font: 'inherit', fontWeight: 600 }}
                  >
                    Bấm đây để chọn lọc từng học sinh →
                  </button>
                </div>
              )}
            </div>
          )}

          {/* Ô DANH SÁCH HỌC SINH CÓ Ô TICK (KHI CHỌN GIAO CHO TỪNG HỌC SINH) */}
          {cheDo === 'hoc_sinh' && (
            <div
              style={{
                background: 'var(--the-2)',
                borderRadius: 'var(--bo-2)',
                padding: 'var(--k3)',
                border: '1px solid var(--vien)',
                display: 'grid',
                gap: 'var(--k2)',
              }}
            >
              <div className="flex items-center justify-between flex-wrap" style={{ gap: 'var(--k2)' }}>
                <div>
                  <div style={{ fontFamily: 'var(--sans)', fontSize: 'var(--cx-1)', fontWeight: 700, color: 'var(--muc)' }}>
                    Danh sách học sinh — tick ô vuông để giao bài tập
                  </div>
                  <div style={NHAN_NHO}>
                    Đã tick chọn: <b style={{ color: 'var(--xanh)', fontVariantNumeric: 'tabular-nums' }}>{sbdChon.size}</b> học sinh nhận bài
                  </div>
                </div>
                <div className="flex items-center" style={{ gap: 'var(--k2)' }}>
                  <button
                    type="button"
                    onClick={chonTatCaHsHienThi}
                    className="tap-target font-semibold"
                    style={{ ...NHAN_NHO, textDecoration: 'underline', cursor: 'pointer', background: 'none', border: 'none', padding: '2px 6px' }}
                  >
                    Chọn tất cả ({dsHsHienThi.length})
                  </button>
                  <button
                    type="button"
                    onClick={boChonHsHienThi}
                    className="tap-target"
                    style={{ ...NHAN_NHO, textDecoration: 'underline', cursor: 'pointer', background: 'none', border: 'none', padding: '2px 6px' }}
                  >
                    Bỏ chọn
                  </button>
                </div>
              </div>

              {/* THANH TÌM KIẾM & BỘ LỌC */}
              <div className="flex items-center flex-wrap" style={{ gap: 'var(--k2)' }}>
                <div className="relative flex-1" style={{ minWidth: 200 }}>
                  <input
                    type="text"
                    value={timKiemHs}
                    onChange={(e) => setTimKiemHs(e.target.value)}
                    placeholder="Tìm theo số báo danh, họ tên, lớp..."
                    style={{
                      width: '100%',
                      height: 36,
                      padding: '0 12px 0 32px',
                      borderRadius: 'var(--bo-tron)',
                      border: '1px solid var(--vien-dam)',
                      background: 'var(--the)',
                      fontSize: 'var(--cx-1)',
                      color: 'var(--muc)',
                    }}
                  />
                  <Search size={16} style={{ position: 'absolute', left: 10, top: 10, color: 'var(--mo)', pointerEvents: 'none' }} />
                </div>

                {caChon.size > 0 && (
                  <div className="flex items-center" style={{ gap: 4 }}>
                    <button
                      type="button"
                      onClick={() => setNguonHsLoc('ca_da_chon')}
                      style={{
                        padding: '4px 10px',
                        borderRadius: 'var(--bo-tron)',
                        fontSize: 'var(--cx-1)',
                        background: nguonHsLoc === 'ca_da_chon' ? 'var(--xanh)' : 'var(--the)',
                        color: nguonHsLoc === 'ca_da_chon' ? '#fff' : 'var(--muc)',
                        border: '1px solid ' + (nguonHsLoc === 'ca_da_chon' ? 'var(--xanh)' : 'var(--vien)'),
                        cursor: 'pointer',
                        fontWeight: 600,
                      }}
                    >
                      Trong ca ({dsHsTrongCa.length})
                    </button>
                    <button
                      type="button"
                      onClick={() => setNguonHsLoc('tat_ca')}
                      style={{
                        padding: '4px 10px',
                        borderRadius: 'var(--bo-tron)',
                        fontSize: 'var(--cx-1)',
                        background: nguonHsLoc === 'tat_ca' ? 'var(--xanh)' : 'var(--the)',
                        color: nguonHsLoc === 'tat_ca' ? '#fff' : 'var(--muc)',
                        border: '1px solid ' + (nguonHsLoc === 'tat_ca' ? 'var(--xanh)' : 'var(--vien)'),
                        cursor: 'pointer',
                        fontWeight: 600,
                      }}
                    >
                      Tất cả ({dsEm.length})
                    </button>
                  </div>
                )}

                {dsLopHs.length > 1 && (
                  <select
                    value={lopHsLoc}
                    onChange={(e) => setLopHsLoc(e.target.value)}
                    style={{
                      height: 36,
                      padding: '0 10px',
                      borderRadius: 'var(--bo-tron)',
                      border: '1px solid var(--vien-dam)',
                      background: 'var(--the)',
                      fontSize: 'var(--cx-1)',
                      color: 'var(--muc)',
                    }}
                  >
                    <option value="">Tất cả các lớp</option>
                    {dsLopHs.map((l) => (
                      <option key={l} value={l}>
                        Lớp {l}
                      </option>
                    ))}
                  </select>
                )}
              </div>

              {/* KHUNG CUỘN DANH SÁCH HỌC SINH */}
              {dangTaiLuot ? (
                <div style={{ ...NHAN_NHO, padding: 'var(--k3) 0', textAlign: 'center' }}>
                  Đang tải danh sách học sinh…
                </div>
              ) : dsHsHienThi.length === 0 ? (
                <div style={{ ...NHAN_NHO, padding: 'var(--k3) 0', textAlign: 'center' }}>
                  {caChon.size === 0
                    ? 'Hãy tick chọn ít nhất một ca ở Bước 1 bên trên để hiện học sinh.'
                    : 'Không có học sinh nào phù hợp bộ lọc tìm kiếm.'}
                </div>
              ) : (
                <div style={{ display: 'grid', gap: 6, maxHeight: 280, overflowY: 'auto', paddingRight: 4 }}>
                  {dsHsHienThi.map((e) => {
                    const tich = sbdChon.has(e.sbd)
                    return (
                      <button
                        key={e.sbd}
                        type="button"
                        onClick={() => toggleSbd(e.sbd)}
                        className="tap-target"
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: 'var(--k3)',
                          textAlign: 'left',
                          minHeight: 44,
                          padding: '6px 12px',
                          borderRadius: 'var(--bo-1)',
                          background: tich ? 'var(--xanh-nen)' : 'var(--the)',
                          border: `1.5px solid ${tich ? 'var(--xanh)' : 'transparent'}`,
                          transition: 'all 0.15s ease',
                          cursor: 'pointer',
                        }}
                      >
                        <span style={{ color: tich ? 'var(--xanh)' : 'var(--mo)', flex: '0 0 auto' }}>
                          {tich ? <CheckSquare size={18} /> : <Square size={18} />}
                        </span>
                        <div className="flex-1 flex items-center justify-between flex-wrap gap-1 min-w-0">
                          <span className="flex items-center gap-2 truncate">
                            <span style={{ fontWeight: 600, fontSize: 'var(--cx-1)', color: 'var(--muc)' }}>
                              {e.hoTen || `Học sinh ${e.sbd}`}
                            </span>
                            <span style={{ fontFamily: 'var(--mono)', fontSize: 'var(--cx-1)', color: 'var(--nhat)' }}>
                              SBD: <b>{e.sbd}</b>
                            </span>
                          </span>
                          <span className="flex items-center gap-2 flex-shrink-0">
                            {e.lop && <Nhan tone="xam">{e.lop}</Nhan>}
                            {e.diem !== null && e.diem !== undefined && (
                              <Nhan tone="xanh">{e.diem.toFixed(2)}đ</Nhan>
                            )}
                          </span>
                        </div>
                      </button>
                    )
                  })}
                </div>
              )}
            </div>
          )}

          <div>
            <div style={{ ...NHAN_NHO, marginBottom: 'var(--k2)' }}>
              Tờ đề — tick được nhiều tờ, tới từng phần. Em nhận TẤT CẢ câu của những phần
              {' '}đã tick, đúng thứ tự kho.
            </div>

            {/* HÀNG LỌC NHÓM — dùng chung với màn Mở ca, một dòng vuốt ngang. */}
            <div style={{ marginBottom: 'var(--k2)' }}>
              <HangNhomDe ds={dsNhom} chon={nhomLoc} onChon={setNhomLoc} />
            </div>

            {/* ĐÚNG HỘP CHỌN ĐỀ CỦA MÀN MỞ CA — lồng nguyên, không chép lại. Sửa
                một chỗ thì ba màn (Mở ca · Gọi lên bảng · Giao bài tập) đổi theo. */}
            <HopChonDe
              ds={dsDeTach}
              daChon={daChon}
              onChon={(ma) => {
                const m = new Set(daChon)
                if (m.has(ma)) m.delete(ma)
                else m.add(ma)
                setDaChon(m)
              }}
              nhomLoc={nhomLoc}
              chonNhieu
              onChonTatCa={(ma) => setDaChon(new Set(ma))}
            />

            {soChuaChuyen > 0 && (
              <div style={{ ...NHAN_NHO, marginTop: 'var(--k2)' }}>
                Ẩn <b>{soChuaChuyen}</b> tờ máy chủ chưa có — vào Cài đặt → Máy chủ mới bấm
                {' '}“Chuyển KHO ĐỀ sang máy chủ mới” thì chúng hiện ra đây.
              </div>
            )}
            {daChon.size > 0 && (
              <div className="flex items-center" style={{ gap: 'var(--k2)', marginTop: 'var(--k2)' }}>
                <span style={NHAN_NHO}>
                  Đã tick <b>{daChon.size}</b> mục · <b>{tongCauDaChon}</b> câu
                </span>
                <button type="button" className="tap-target" onClick={() => setDaChon(new Set())} style={{ ...NHAN_NHO, textDecoration: 'underline' }}>
                  Bỏ hết
                </button>
              </div>
            )}
          </div>

          {!dangNap && dsDe.length === 0 && (
            <OThongBao tone="cam">
              Kho đề trên máy chủ mới đang rỗng. Vào Cài đặt → Máy chủ mới, bấm “Chuyển KHO ĐỀ sang máy chủ mới” trước.
            </OThongBao>
          )}

          {/* TÓM TẮT CHỌN GIAO */}
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              flexWrap: 'wrap',
              gap: 'var(--k2)',
              padding: '10px 14px',
              borderRadius: 'var(--bo-1)',
              background: 'var(--the-2)',
              border: '1px solid var(--vien)',
            }}
          >
            <span style={{ fontSize: 'var(--cx-1)', fontWeight: 600, color: 'var(--muc)' }}>
              {cheDo === 'ca' ? `Đã chọn: ${caChon.size} ca` : `Đã chọn: ${sbdChon.size} học sinh`}
            </span>
            <span style={{ fontSize: 'var(--cx-1)', color: 'var(--nhat)' }}>
              {daChon.size > 0 ? `${daChon.size} tờ đề (${tongCauDaChon} câu)` : 'Chưa tick tờ đề nào'}
            </span>
          </div>

          {/* HÀNG NÚT BẤM GIAO BÀI TẬP VỀ NHÀ — TO RÕ, NỔI BẬT & TRỰC QUAN */}
          <div className="flex items-center gap-3 flex-wrap" style={{ marginTop: 'var(--k1)' }}>
            {cheDo === 'ca' ? (
              <button
                type="button"
                onClick={giao}
                disabled={dangGiao || caChon.size === 0 || daChon.size === 0}
                className="tap-target font-bold inline-flex items-center justify-center gap-2 flex-1 sm:flex-initial"
                style={{
                  minHeight: 48,
                  padding: '0 24px',
                  borderRadius: 'var(--bo-1)',
                  fontFamily: 'var(--sans)',
                  fontSize: 'var(--cx-2)',
                  cursor: dangGiao || caChon.size === 0 || daChon.size === 0 ? 'not-allowed' : 'pointer',
                  background: dangGiao || caChon.size === 0 || daChon.size === 0 ? 'var(--the-2)' : 'var(--muc)',
                  color: dangGiao || caChon.size === 0 || daChon.size === 0 ? 'var(--mo)' : 'var(--muc-nguoc)',
                  border: '1.5px solid ' + (dangGiao || caChon.size === 0 || daChon.size === 0 ? 'var(--vien)' : 'var(--muc)'),
                  opacity: dangGiao || caChon.size === 0 || daChon.size === 0 ? 0.65 : 1,
                  transition: 'all 0.15s ease',
                }}
              >
                <ClipboardList size={20} />
                {dangGiao
                  ? 'Đang giao…'
                  : caChon.size === 0
                  ? 'Tick chọn ít nhất 1 ca thi'
                  : daChon.size === 0
                  ? 'Tick chọn ít nhất 1 tờ đề'
                  : `Giao bài tập về nhà (${caChon.size} ca · ${tongCauDaChon} câu)`}
              </button>
            ) : (
              <button
                type="button"
                onClick={giao}
                disabled={dangGiao || sbdChon.size === 0 || daChon.size === 0}
                className="tap-target font-bold inline-flex items-center justify-center gap-2 flex-1 sm:flex-initial"
                style={{
                  minHeight: 48,
                  padding: '0 24px',
                  borderRadius: 'var(--bo-1)',
                  fontFamily: 'var(--sans)',
                  fontSize: 'var(--cx-2)',
                  cursor: dangGiao || sbdChon.size === 0 || daChon.size === 0 ? 'not-allowed' : 'pointer',
                  background: dangGiao || sbdChon.size === 0 || daChon.size === 0 ? 'var(--the-2)' : 'var(--xanh)',
                  color: dangGiao || sbdChon.size === 0 || daChon.size === 0 ? 'var(--mo)' : '#ffffff',
                  border: '1.5px solid ' + (dangGiao || sbdChon.size === 0 || daChon.size === 0 ? 'var(--vien)' : 'var(--xanh)'),
                  opacity: dangGiao || sbdChon.size === 0 || daChon.size === 0 ? 0.65 : 1,
                  transition: 'all 0.15s ease',
                }}
              >
                <ClipboardList size={20} />
                {dangGiao
                  ? 'Đang giao…'
                  : sbdChon.size === 0
                  ? 'Tick chọn ít nhất 1 học sinh'
                  : daChon.size === 0
                  ? 'Tick chọn ít nhất 1 tờ đề'
                  : `Giao bài tập về nhà cho ${sbdChon.size} học sinh (${tongCauDaChon} câu)`}
              </button>
            )}

            <button
              type="button"
              onClick={() => void nap()}
              disabled={dangNap}
              className="tap-target font-semibold inline-flex items-center gap-2"
              style={{
                minHeight: 48,
                padding: '0 18px',
                borderRadius: 'var(--bo-1)',
                fontFamily: 'var(--sans)',
                fontSize: 'var(--cx-1)',
                background: 'transparent',
                color: 'var(--muc)',
                border: '1.5px solid var(--vien-dam)',
                cursor: dangNap ? 'not-allowed' : 'pointer',
              }}
            >
              <RefreshCw size={16} className={dangNap ? 'animate-spin' : ''} /> Làm mới
            </button>
          </div>

          {bao && <OThongBao tone={bao.ok ? 'xanh' : 'do'}>{bao.chu}</OThongBao>}

          <div style={NHAN_NHO}>
            Hạn nộp 48 giờ, tính từ lúc bấm Giao, chung cho cả lớp. Quá hạn thì máy chủ
            {' '}từ chối — không phải chỉ ẩn nút ở máy em.
          </div>
        </div>
      </TheNoiDung>

      {theoDoi.length > 0 && (
        <TheNoiDung>
          <div style={{ display: 'grid', gap: 'var(--k3)' }}>
            <div style={{ fontFamily: 'var(--serif)', fontSize: 'var(--cx-3)' }}>Bài đã giao</div>
            {theoDoi.map((t) => (
              <div key={t.maBtvn} style={{ background: 'var(--the-2)', borderRadius: 'var(--bo-1)', padding: 'var(--k3)' }}>
                <div className="flex items-center" style={{ justifyContent: 'space-between', gap: 'var(--k2)' }}>
                  <span style={{ fontFamily: 'var(--sans)', fontSize: 'var(--cx-1)' }}>
                    Ca {t.maCa} · đề {t.maDe} · {t.soCau} câu
                  </span>
                  <Nhan tone={t.daNop === t.tong ? 'xanh' : t.quaHan ? 'do' : 'cam'}>
                    {t.daNop}/{t.tong} nộp
                  </Nhan>
                </div>
                <div style={{ ...NHAN_NHO, marginTop: 4 }}>
                  Giao {gioVN(t.giaoLuc)} · hạn {gioVN(t.hanNop)}
                  {t.quaHan ? ' · đã quá hạn' : ''}
                </div>
                {t.chuaNop.length > 0 && (
                  <div style={{ ...NHAN_NHO, marginTop: 4 }}>
                    Chưa nộp: {t.chuaNop.map((e) => `${e.hoTen || e.sbd}`).join(', ')}
                  </div>
                )}
              </div>
            ))}
          </div>
        </TheNoiDung>
      )}
    </div>
  )
}
