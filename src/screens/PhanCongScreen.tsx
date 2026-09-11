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
import { useCallback, useEffect, useState } from 'react'
import { ClipboardList, Presentation, RefreshCw } from 'lucide-react'
import { Nhan, NutChinh, OThongBao, TheNoiDung } from '../components/DesignSystem'
import GoiLenBangScreen from './GoiLenBangScreen'
import { danhSachCa, type CaTomTat } from '../lib/exam-api'
import { loadScriptUrl, loadTeacherSecret } from '../lib/exam-db'
import { layCauHinhMayChu } from '../lib/may-chu-moi'
import { giaoBtvn, theoDoiBtvn, type DongTheoDoiBtvn } from '../lib/btvn-may-chu-moi'

const NHAN_NHO: React.CSSProperties = { fontFamily: 'var(--sans)', fontSize: 'var(--cx-1)', color: 'var(--nhat)', lineHeight: 1.6 }
const O_CHON: React.CSSProperties = {
  height: 46,
  width: '100%',
  borderRadius: 'var(--bo-1)',
  padding: '0 var(--k3)',
  background: 'var(--the-2)',
  border: '1.5px solid transparent',
  fontFamily: 'var(--sans)',
  fontSize: 'var(--cx-1)',
  color: 'var(--muc)',
}

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
  const [dsCa, setDsCa] = useState<CaTomTat[]>([])
  const [dsDe, setDsDe] = useState<DeKho[]>([])
  const [maCa, setMaCa] = useState('')
  const [maDe, setMaDe] = useState('')
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

      const ca = url && mat ? await danhSachCa(url, mat) : []
      setDsCa(ca)

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

  async function giao() {
    setDangGiao(true)
    setBao(null)
    try {
      const mat = (await loadTeacherSecret()) ?? ''
      const ch = await layCauHinhMayChu()
      const kq = await giaoBtvn(ch, mat, maCa, maDe)
      setBao({
        ok: true,
        chu: `Đã giao ${kq.soCau} câu cho ${kq.soEm} em. Hạn nộp ${gioVN(kq.hanNop)}.`,
      })
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
          <div>
            <div style={{ ...NHAN_NHO, marginBottom: 'var(--k1)' }}>Ca đã thi — bài giao cho đúng những em có lượt trong ca này</div>
            <select style={O_CHON} value={maCa} onChange={(e) => setMaCa(e.target.value)}>
              <option value="">— chọn ca —</option>
              {dsCa.map((c) => (
                <option key={c.maCa} value={c.maCa}>
                  {c.maCa} · {c.tenCa || 'không tên'} · {c.daNop}/{c.daVao} nộp
                </option>
              ))}
            </select>
          </div>

          <div>
            <div style={{ ...NHAN_NHO, marginBottom: 'var(--k1)' }}>Tờ đề trong kho — em nhận TẤT CẢ câu, đúng thứ tự kho</div>
            <select style={O_CHON} value={maDe} onChange={(e) => setMaDe(e.target.value)}>
              <option value="">— chọn đề —</option>
              {dsDe.map((d) => (
                <option key={d.maDe} value={d.maDe}>
                  {d.maDe} · {d.soCau} câu{d.tenDe ? ` · ${d.tenDe}` : ''}
                </option>
              ))}
            </select>
          </div>

          {!dangNap && dsDe.length === 0 && (
            <OThongBao tone="cam">
              Kho đề trên máy chủ mới đang rỗng. Vào Cài đặt → Máy chủ mới, bấm “Chuyển KHO ĐỀ sang máy chủ mới” trước.
            </OThongBao>
          )}

          <div className="flex items-center" style={{ gap: 'var(--k2)' }}>
            <NutChinh onClick={giao} disabled={dangGiao || !maCa || !maDe}>
              {dangGiao ? 'Đang giao…' : 'Giao bài tập về nhà'}
            </NutChinh>
            <NutChinh variant="phu" onClick={() => void nap()} disabled={dangNap}>
              <span className="inline-flex items-center gap-2">
                <RefreshCw size={16} /> Làm mới
              </span>
            </NutChinh>
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
