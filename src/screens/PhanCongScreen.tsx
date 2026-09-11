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
import { CheckSquare, ClipboardList, Presentation, RefreshCw, Square } from 'lucide-react'
import { Nhan, NutChinh, OThongBao, TheNoiDung } from '../components/DesignSystem'
import GoiLenBangScreen from './GoiLenBangScreen'
import { danhSachCa, type CaTomTat } from '../lib/exam-api'
import { loadScriptUrl, loadTeacherSecret } from '../lib/exam-db'
import { layCauHinhMayChu } from '../lib/may-chu-moi'
import { giaoBtvn, theoDoiBtvn, type DongTheoDoiBtvn } from '../lib/btvn-may-chu-moi'
import HopChonDe from '../components/HopChonDe'
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
  const [dsCa, setDsCa] = useState<CaTomTat[]>([])
  const [dsDe, setDsDe] = useState<DeKho[]>([])
  // TICK NHIỀU CA (thầy chốt 12/09). Một lượt giao ra nhiều lớp, cùng tờ đề,
  // cùng một mốc hạn nộp.
  const [caChon, setCaChon] = useState<Set<string>>(new Set())
  // TICK NHIỀU TỜ (thầy chốt 12/09). Giữ theo thứ tự thầy tick: bài em nhận
  // được ghép theo đúng thứ tự ấy, không xáo.
  const [daChon, setDaChon] = useState<Set<string>>(new Set())
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
      const kq = await giaoBtvn(ch, mat, [...caChon], [...daChon])
      const boQua = kq.caRong && kq.caRong.length > 0 ? ` Bỏ qua ${kq.caRong.length} ca chưa em nào vào thi: ${kq.caRong.join(', ')}.` : ''
      setBao({
        ok: true,
        chu: `Đã giao ${kq.soCau} câu (${daChon.size} tờ đề) cho ${kq.soEm} em ở ${kq.soCa ?? caChon.size} ca. Hạn nộp ${gioVN(kq.hanNop)}.${boQua}`,
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
          <div>
            <div className="flex items-center" style={{ justifyContent: 'space-between', gap: 'var(--k2)', marginBottom: 'var(--k2)' }}>
              <span style={NHAN_NHO}>Ca đã thi — tick nhiều ca, bài giao cho đúng những em có lượt trong các ca ấy</span>
              {dsCa.length > 1 && (
                <button
                  type="button"
                  className="tap-target"
                  onClick={() => setCaChon(caChon.size === dsCa.length ? new Set() : new Set(dsCa.map((c) => c.maCa)))}
                  style={{ ...NHAN_NHO, textDecoration: 'underline', whiteSpace: 'nowrap' }}
                >
                  {caChon.size === dsCa.length ? 'Bỏ hết' : 'Chọn hết'}
                </button>
              )}
            </div>

            {dsCa.length === 0 ? (
              <div style={NHAN_NHO}>{dangNap ? 'Đang lấy danh sách ca…' : 'Chưa có ca nào đã thi.'}</div>
            ) : (
              <div style={{ display: 'grid', gap: 'var(--k2)', maxHeight: 280, overflowY: 'auto' }}>
                {dsCa.map((c) => {
                  const chon = caChon.has(c.maCa)
                  return (
                    <button
                      key={c.maCa}
                      type="button"
                      onClick={() => {
                        const m = new Set(caChon)
                        if (m.has(c.maCa)) m.delete(c.maCa)
                        else m.add(c.maCa)
                        setCaChon(m)
                      }}
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
              <div style={{ ...NHAN_NHO, marginTop: 'var(--k2)' }}>
                Đã tick <b>{caChon.size}</b> ca · <b>{dsCa.filter((c) => caChon.has(c.maCa)).reduce((t, c) => t + c.daVao, 0)}</b> lượt vào thi
                {' '}(em thi hai ca chỉ nhận một bài).
              </div>
            )}
          </div>

          <div>
            <div style={{ ...NHAN_NHO, marginBottom: 'var(--k2)' }}>
              Tờ đề — tick được nhiều tờ, tới từng phần. Em nhận TẤT CẢ câu của những phần
              {' '}đã tick, đúng thứ tự kho.
            </div>

            {/* CHIP NHÓM ĐỀ — y như màn Mở ca. */}
            {dsNhom.length > 0 && (
              <div className="flex flex-wrap" style={{ gap: 'var(--k2)', marginBottom: 'var(--k2)' }} role="group" aria-label="Lọc theo nhóm đề">
                {['', ...dsNhom].map((n) => {
                  const chon = nhomLoc === n
                  return (
                    <button
                      key={n || '__tat_ca'}
                      type="button"
                      onClick={() => setNhomLoc(n)}
                      className="tap-target font-bold"
                      style={{
                        fontFamily: 'var(--sans)',
                        fontSize: 'var(--cx-1)',
                        minHeight: 36,
                        padding: '0 var(--k3)',
                        borderRadius: 'var(--bo-tron)',
                        background: chon ? 'var(--tim-nen)' : 'var(--the-2)',
                        color: chon ? 'var(--tim)' : 'var(--nhat)',
                        border: `1.5px solid ${chon ? 'var(--tim)' : 'transparent'}`,
                      }}
                    >
                      {n || 'Tất cả'}
                    </button>
                  )
                })}
              </div>
            )}

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

          <div className="flex items-center" style={{ gap: 'var(--k2)' }}>
            <NutChinh onClick={giao} disabled={dangGiao || caChon.size === 0 || daChon.size === 0}>
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
