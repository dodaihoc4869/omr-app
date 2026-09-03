// GIAO BÀI TẬP VỀ NHÀ (BA-APP.md đợt 3) — mở từ hồ sơ một em.
// Chuyên đề em SAI TRÊN NGƯỠNG được tick sẵn kèm tỉ lệ; thầy bỏ chọn được.
// Câu rút NGẪU NHIÊN trong nhóm khớp, ưu tiên câu em CHƯA từng làm; kho không
// đủ thì báo rõ số câu có được, không âm thầm giao ít hơn.
import { useEffect, useMemo, useState } from 'react'
import { CheckSquare, Square, X } from 'lucide-react'
import { Hang, Nhan, OThongBao, NutChinh } from './DesignSystem'
import { demCauTheoChuyenDe, rutBaiTap, SO_CAU_BAI_TAP_MAC_DINH, SO_CAU_BAI_TAP_TOI_DA, SO_CAU_BAI_TAP_TOI_THIEU, type MucDoLoc } from '../lib/bai-tap'
import { publishSession, qidDaLam, danhSachYeuCau, danhDauYeuCau, type ChuyenDeEm } from '../lib/exam-api'
import { loadExamSources, loadScriptUrl, loadTeacherSecret, saveSessionTeacherBank } from '../lib/exam-db'
import { randomSessionCode } from '../lib/ca-link'
import type { TeacherExamSource } from '../data/examContent'
import { useAppStore } from '../store/appStore'

const SO: React.CSSProperties = { fontFamily: 'var(--sans)', fontVariantNumeric: 'tabular-nums' }
const NHAN_NHO: React.CSSProperties = { fontFamily: 'var(--sans)', fontSize: 'var(--cx-1)', color: 'var(--nhat)' }

/** Số ngày mặc định cho hạn nộp (BA-APP mục 3). */
export const HAN_NOP_NGAY_MAC_DINH = 7

export function ngayISO(themNgay: number, now = new Date()): string {
  const d = new Date(now.getTime() + themNgay * 86400000)
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
}

/** Hạn nộp = 23:59 ngày thầy chọn (giờ máy thầy) — em nộp cả ngày hôm đó vẫn đúng hạn. */
export function hanNopISO(ngay: string): string {
  const [y, m, d] = ngay.split('-').map(Number)
  if (!y || !m || !d) return ''
  return new Date(y, m - 1, d, 23, 59, 0, 0).toISOString()
}

const MUC_DO_CHON: { id: MucDoLoc; ten: string }[] = [
  { id: 'biet', ten: 'Nhận biết' },
  { id: 'hieu', ten: 'Thông hiểu' },
  { id: 'van_dung', ten: 'Vận dụng' },
  { id: 'tron', ten: 'Trộn' },
]

export default function GiaoBaiTap({
  sbd,
  hoTen,
  chuyenDeEm,
  nguongYeu,
  onXong,
}: {
  sbd: string
  hoTen: string
  /** Bảng chuyên đề của em (từ hồ sơ) — dùng để tick sẵn chuyên đề yếu. */
  chuyenDeEm: ChuyenDeEm[]
  /** Tỉ lệ sai coi là yếu (0.3 = 30%). */
  nguongYeu: number
  onXong: () => void
}) {
  const showToast = useAppStore((s) => s.showToast)

  const [nguon, setNguon] = useState<TeacherExamSource[] | null>(null)
  const [mucDo, setMucDo] = useState<MucDoLoc>('tron')
  const [soCau, setSoCau] = useState(SO_CAU_BAI_TAP_MAC_DINH)
  const [hanNgay, setHanNgay] = useState(() => ngayISO(HAN_NOP_NGAY_MAC_DINH))
  const [chon, setChon] = useState<string[]>(() => chuyenDeEm.filter((c) => c.tiLeSai > nguongYeu).map((c) => c.ten))
  const [dangGiao, setDangGiao] = useState(false)
  const [loi, setLoi] = useState('')

  useEffect(() => {
    loadExamSources().then(setNguon)
  }, [])

  const demTheoCd = useMemo(() => (nguon ? demCauTheoChuyenDe(nguon, mucDo) : {}), [nguon, mucDo])

  // Danh sách chuyên đề để tick: chuyên đề em đã làm (có số liệu) + chuyên đề
  // kho có câu. Sắp theo tỉ lệ sai giảm dần, chuyên đề chưa có số liệu xuống cuối.
  const dsChuyenDe = useMemo(() => {
    const tiLe = new Map(chuyenDeEm.map((c) => [c.ten, c]))
    const ten = new Set<string>([...chuyenDeEm.map((c) => c.ten), ...Object.keys(demTheoCd)])
    return Array.from(ten)
      .map((t) => ({ ten: t, em: tiLe.get(t) ?? null, soCauKho: demTheoCd[t] ?? 0 }))
      .sort((a, b) => (b.em?.tiLeSai ?? -1) - (a.em?.tiLeSai ?? -1))
  }, [chuyenDeEm, demTheoCd])

  const soCauKhop = useMemo(() => {
    if (!nguon) return 0
    if (chon.length === 0) return Object.values(demTheoCd).reduce((s, n) => s + n, 0)
    return chon.reduce((s, t) => s + (demTheoCd[t] ?? 0), 0)
  }, [nguon, chon, demTheoCd])

  const bat = (ten: string) => setChon((cu) => (cu.includes(ten) ? cu.filter((x) => x !== ten) : [...cu, ten]))

  const handleGiao = async () => {
    if (!nguon || nguon.length === 0) return setLoi('Máy chưa có ngân hàng câu hỏi — vào Ngân hàng câu hỏi bấm Đồng bộ trước.')
    const hanNop = hanNopISO(hanNgay)
    if (!hanNop) return setLoi('Chọn hạn nộp trước đã.')
    setDangGiao(true)
    setLoi('')
    try {
      const [url, mat] = await Promise.all([loadScriptUrl(), loadTeacherSecret()])
      if (!url.trim() || !mat.trim()) throw new Error('Chưa cấu hình link Apps Script hoặc mã bí mật')
      // Câu em đã làm — lỗi mạng ở bước này không chặn việc giao bài, chỉ mất
      // ưu tiên tránh câu cũ (báo rõ cho thầy biết).
      let daLam: string[] = []
      let canhBaoQid = ''
      try {
        daLam = await qidDaLam(url.trim(), mat.trim(), sbd)
      } catch {
        canhBaoQid = ' (không đọc được danh sách câu em đã làm nên chưa lọc trùng)'
      }
      const kq = rutBaiTap(nguon, { chuyenDe: chon, mucDo, soCau, qidTranh: daLam })
      if (kq.soCau === 0) throw new Error('Kho không có câu nào khớp bộ lọc này')
      const maCa = randomSessionCode()
      const tenBai = `Bài tập ${chon.length === 1 ? chon[0] : `${kq.soCau} câu`} — ${hoTen || sbd}`
      await publishSession(url.trim(), maCa, '', 0, kq.bank, 'ngay', kq.keyBank, {
        tenCa: tenBai,
        phamVi: 'chon',
        danhSachMoi: [sbd],
        loai: 'baitap',
        hanNop,
      })
      await saveSessionTeacherBank(maCa, nguon)
      // Phụ huynh em này có yêu cầu đang chờ → đóng lại, khỏi giao hai lần.
      try {
        const ds = await danhSachYeuCau(url.trim(), mat.trim())
        for (const y of ds.filter((x) => x.sbd === sbd)) {
          await danhDauYeuCau(url.trim(), mat.trim(), y.id, 'xong', maCa)
        }
      } catch {
        // không đóng được yêu cầu thì bài vẫn đã giao — thầy đóng tay sau
      }
      const thieu = kq.soCau < soCau ? ` — kho chỉ có ${kq.soCau} câu khớp` : ''
      const lap = kq.soCauLapLai > 0 ? `, ${kq.soCauLapLai} câu em đã từng làm` : ''
      showToast(`Đã giao ${kq.soCau} câu cho ${hoTen || sbd}${thieu}${lap}${canhBaoQid}`, kq.soCau < soCau ? 'warn' : 'success')
      onXong()
    } catch (e) {
      setLoi(e instanceof Error ? e.message : 'Không giao được bài')
    } finally {
      setDangGiao(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center" style={{ background: 'var(--phu)' }}>
      <div
        className="w-full overflow-auto flex flex-col"
        style={{ maxWidth: 480, maxHeight: '92vh', background: 'var(--the)', borderRadius: 'var(--bo-3)', padding: 'var(--k5)', gap: 'var(--k4)', boxShadow: 'var(--bong-2)' }}
      >
        <div className="flex items-start justify-between" style={{ gap: 'var(--k3)' }}>
          <div>
            <div className="font-bold" style={{ fontFamily: 'var(--serif)', fontSize: 'var(--cx-4)' }}>
              Giao bài tập
            </div>
            <div style={NHAN_NHO}>
              {hoTen || 'Học sinh'} · SBD <span style={SO}>{sbd}</span>
            </div>
          </div>
          <button onClick={onXong} className="tap-target shrink-0" style={{ color: 'var(--nhat)' }} aria-label="Đóng">
            <X size={20} />
          </button>
        </div>

        {loi && <OThongBao tone="do">{loi}</OThongBao>}
        {nguon === null && <div style={NHAN_NHO}>Đang đọc ngân hàng câu hỏi trên máy…</div>}

        <div>
          <div className="font-bold" style={{ fontSize: 'var(--cx-2)', marginBottom: 'var(--k2)' }}>
            Chuyên đề
          </div>
          <div className="flex flex-col" style={{ gap: 'var(--k2)', maxHeight: 220, overflow: 'auto' }}>
            {dsChuyenDe.length === 0 && <div style={NHAN_NHO}>Kho chưa có câu nào gắn chuyên đề.</div>}
            {dsChuyenDe.map((c) => {
              const tich = chon.includes(c.ten)
              const yeu = c.em ? c.em.tiLeSai > nguongYeu : false
              return (
                <Hang key={c.ten} onClick={() => bat(c.ten)} selected={tich} className="items-start" data-chuyen-de={c.ten}>
                  <span className="shrink-0" style={{ color: tich ? 'var(--xanh)' : 'var(--mo)', marginTop: 2 }} aria-hidden="true">
                    {tich ? <CheckSquare size={20} /> : <Square size={20} />}
                  </span>
                  <span className="flex-1 min-w-0">
                    <div className="truncate" style={{ fontSize: 'var(--cx-2)' }}>
                      {c.ten}
                    </div>
                    <div style={NHAN_NHO}>
                      {c.em ? (
                        <>
                          em sai <span style={SO}>{Math.round(c.em.tiLeSai * 100)}%</span> · {c.em.soCau} câu đã làm
                        </>
                      ) : (
                        'em chưa làm câu nào'
                      )}{' '}
                      · kho có <span style={SO}>{c.soCauKho}</span> câu
                    </div>
                  </span>
                  {yeu && <Nhan tone="cam">gợi ý</Nhan>}
                </Hang>
              )
            })}
          </div>
          <div style={{ ...NHAN_NHO, marginTop: 'var(--k2)' }}>Không tick chuyên đề nào = lấy mọi chuyên đề.</div>
        </div>

        <div>
          <div className="font-bold" style={{ fontSize: 'var(--cx-2)', marginBottom: 'var(--k2)' }}>
            Mức độ
          </div>
          <div className="flex flex-wrap" style={{ gap: 'var(--k2)' }}>
            {MUC_DO_CHON.map((m) => {
              const c = mucDo === m.id
              return (
                <button
                  key={m.id}
                  type="button"
                  onClick={() => setMucDo(m.id)}
                  className="tap-target font-bold"
                  style={{
                    fontFamily: 'var(--sans)',
                    fontSize: 'var(--cx-1)',
                    minHeight: 36,
                    padding: '0 var(--k3)',
                    borderRadius: 'var(--bo-tron)',
                    background: c ? 'var(--muc)' : 'var(--the-2)',
                    color: c ? 'var(--muc-nguoc)' : 'var(--nhat)',
                  }}
                >
                  {m.ten}
                </button>
              )
            })}
          </div>
        </div>

        <div>
          <div className="flex items-baseline justify-between">
            <span className="font-bold" style={{ fontSize: 'var(--cx-2)' }}>
              Số câu
            </span>
            <span className="font-bold" style={{ ...SO, fontSize: 'var(--cx-4)' }}>
              {soCau}
            </span>
          </div>
          <input
            type="range"
            min={SO_CAU_BAI_TAP_TOI_THIEU}
            max={SO_CAU_BAI_TAP_TOI_DA}
            value={soCau}
            onChange={(e) => setSoCau(Number(e.target.value))}
            className="w-full"
            style={{ accentColor: 'var(--tim)' }}
            aria-label="Số câu bài tập"
          />
          <div style={NHAN_NHO}>
            Kho có <span style={SO}>{soCauKhop}</span> câu khớp bộ lọc
            {soCauKhop < soCau ? ` — sẽ chỉ giao được ${soCauKhop} câu` : ''}. Tối đa {SO_CAU_BAI_TAP_TOI_DA} câu (đúng ma trận một đề).
          </div>
        </div>

        <div>
          <div className="font-bold" style={{ fontSize: 'var(--cx-2)', marginBottom: 'var(--k2)' }}>
            Hạn nộp
          </div>
          <input
            type="date"
            value={hanNgay}
            onChange={(e) => setHanNgay(e.target.value)}
            style={{
              height: 48,
              borderRadius: 'var(--bo-1)',
              padding: '0 var(--k4)',
              background: 'var(--the-2)',
              border: '1.5px solid transparent',
              fontFamily: 'var(--sans)',
              fontSize: 'var(--cx-2)',
              color: 'var(--muc)',
              outline: 'none',
              width: '100%',
            }}
            aria-label="Hạn nộp bài tập"
          />
          <div style={{ ...NHAN_NHO, marginTop: 4 }}>Hết ngày này. Nộp muộn vẫn nhận, chỉ đánh dấu quá hạn.</div>
        </div>

        <div className="flex" style={{ gap: 'var(--k2)' }}>
          <NutChinh variant="phu" onClick={onXong}>
            Huỷ
          </NutChinh>
          <NutChinh onClick={handleGiao} disabled={dangGiao || nguon === null}>
            {dangGiao ? 'Đang giao…' : 'Giao bài'}
          </NutChinh>
        </div>
      </div>
    </div>
  )
}
