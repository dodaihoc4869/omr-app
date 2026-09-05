// CA CHẨN ĐOÁN — hai khối tích chọn, bật tắt ĐỘC LẬP.
// Đặc tả MOCAVAGOILENBANG.md mục 3.
//
// Có hôm chữa cả bài mới lẫn bài cũ, có hôm chỉ một trong hai. Bỏ tích một
// khối thì TỰ CHUYỂN CHẾ ĐỘ và số câu tự chia lại để vẫn dùng hết 15 phút —
// không để em ngồi không.
//
//   cả hai      ca_hai   8 câu · 660s · 14 tín hiệu
//   chỉ đề mới  chi_moi  8 câu · 660s · 14 tín hiệu   (lõi chung dày hơn)
//   chỉ đề cũ   chi_cu   7 câu · 600s · 13 tín hiệu   (đo sâu HAI chuyên đề)
//
// Khối ĐỀ MỚI chỉ tích được MỘT đề: lõi chung phải nằm trong đúng bài các em
// vừa làm ở nhà. Khối ĐỀ CŨ tích được nhiều chương: càng rộng, thuật toán càng
// dễ tìm câu đúng chuyên đề đến hạn đo.
//
// Mọi luật chọn câu nằm trong `src/lib/ca-chan-doan.ts`, có test. Ở đây chỉ vẽ.
import { useMemo, useState } from 'react'
import { CheckSquare, Square, Circle, CircleDot, Eye } from 'lucide-react'
import { NutChinh, TheNoiDung, OThongBao } from './DesignSystem'
import type { TeacherExamSource } from '../data/examContent'
import { chuongCuaDe } from '../lib/cay-chon-de'
import { dungUngVien, type CauUngVien } from '../lib/rut-de'
import { CHE_DO, cheDoTu, rutCaKiemChung, tomTatCheDo, type CaKiemChung, type CheDo, type HoSoEm } from '../lib/ca-chan-doan'

const NHAN_NHO: React.CSSProperties = { fontFamily: 'var(--sans)', fontSize: 'var(--cx-1)', color: 'var(--nhat)' }
const SO: React.CSSProperties = { fontFamily: 'var(--sans)', fontVariantNumeric: 'tabular-nums' }

export interface EmChanDoan {
  sbd: string
  hoTen: string
}

export interface KhoiCaChanDoanProps {
  /** Toàn bộ kho đề đã lưu trên máy thầy. */
  nguon: TeacherExamSource[]
  /** Em sẽ vào ca — lấy hồ sơ của đúng những em này. */
  dsEm: EmChanDoan[]
  /** Hồ sơ chuyên đề của từng em. Trả về rỗng khi em chưa có dữ liệu — KHÔNG đoán. */
  layHoSo: (dsEm: EmChanDoan[]) => Promise<HoSoEm[]>
  /** Mở ca thật: nhận bộ câu đã rút. */
  moCa: (ket: CaKiemChung, nguonDaChon: TeacherExamSource[]) => Promise<void>
  showToast: (chu: string, kieu?: 'success' | 'error' | 'warn') => void
}

/** Gộp ba phần thành một danh sách phẳng — `rutCaKiemChung` nhận mảng phẳng. */
export function phang(ds: TeacherExamSource[]): CauUngVien[] {
  const uv = dungUngVien(ds)
  return [...uv.I, ...uv.II, ...uv.III]
}

function OTich({ chon, tron = false }: { chon: boolean; tron?: boolean }) {
  const I = tron ? (chon ? CircleDot : Circle) : chon ? CheckSquare : Square
  return <I size={18} style={{ color: chon ? 'var(--xanh)' : 'var(--mo)', flex: '0 0 auto' }} />
}

function soCauCua(s: TeacherExamSource): { tong: number; I: number; II: number; III: number } {
  return { tong: s.phanI.length + s.phanII.length + s.phanIII.length, I: s.phanI.length, II: s.phanII.length, III: s.phanIII.length }
}

export default function KhoiCaChanDoan({ nguon, dsEm, layHoSo, moCa, showToast }: KhoiCaChanDoanProps) {
  const [batMoi, setBatMoi] = useState(true)
  const [maDeMoi, setMaDeMoi] = useState('')
  const [batCu, setBatCu] = useState(true)
  const [chuongCu, setChuongCu] = useState<Set<string>>(new Set())
  const [dangMo, setDangMo] = useState('')
  const [xemTruoc, setXemTruoc] = useState<CaKiemChung | null>(null)

  const chuong = useMemo(() => {
    const m = new Map<string, { ten: string; de: TeacherExamSource[]; soCau: number }>()
    for (const s of nguon) {
      const ten = chuongCuaDe(s) || '(chưa đặt chương)'
      const cu = m.get(ten) ?? { ten, de: [], soCau: 0 }
      cu.de.push(s)
      cu.soCau += soCauCua(s).tong
      m.set(ten, cu)
    }
    return [...m.values()].sort((a, b) => a.ten.localeCompare(b.ten, 'vi'))
  }, [nguon])

  const deMoi = useMemo(() => nguon.find((s) => s.maDe === maDeMoi) ?? null, [nguon, maDeMoi])
  const coMoi = batMoi && !!deMoi
  const deCu = useMemo(() => nguon.filter((s) => chuongCu.has(chuongCuaDe(s) || '(chưa đặt chương)')), [nguon, chuongCu])
  const coCu = batCu && deCu.length > 0

  const cheDo: CheDo | null = cheDoTu(coMoi, coCu)
  const tom = cheDo ? tomTatCheDo(CHE_DO[cheDo]) : null

  const rut = async (): Promise<CaKiemChung | null> => {
    if (!cheDo) return null
    const hoSo = await layHoSo(dsEm)
    return rutCaKiemChung(coMoi && deMoi ? phang([deMoi]) : [], coCu ? phang(deCu) : [], hoSo, CHE_DO[cheDo])
  }

  const bamXemTruoc = async () => {
    setDangMo('Đang rút thử…')
    try {
      const r = await rut()
      if (!r) return
      setXemTruoc(r)
    } catch (e) {
      showToast(e instanceof Error ? e.message : 'Không rút thử được', 'error')
    } finally {
      setDangMo('')
    }
  }

  const bamMoCa = async () => {
    if (!cheDo) return
    setDangMo('Đang lấy hồ sơ từng em…')
    try {
      const r = await rut()
      if (!r) return
      setDangMo('Đang mở ca…')
      await moCa(r, [...(coMoi && deMoi ? [deMoi] : []), ...(coCu ? deCu : [])])
    } catch (e) {
      showToast(e instanceof Error ? e.message : 'Không mở được ca', 'error')
    } finally {
      setDangMo('')
    }
  }

  const emMau = xemTruoc ? Object.keys(xemTruoc.theoEm)[0] : ''

  return (
    <div className="flex flex-col" style={{ gap: 'var(--k4)' }}>
      <OThongBao tone="cam">
        Ca chẩn đoán <b>KHÔNG vào sổ điểm</b>, 15 phút, không chống gian lận, không Phần III. Em biết là không lấy điểm thì không có động cơ chép, và dữ liệu mới thật — đây là điều kiện để phần
        phân công lên bảng đúng.
      </OThongBao>

      {/* KHỐI ĐỀ MỚI — chỉ MỘT đề */}
      <TheNoiDung>
        <button type="button" onClick={() => setBatMoi((v) => !v)} className="tap-target w-full text-left inline-flex items-center" style={{ gap: 'var(--k3)', minHeight: 44, background: 'none', border: 'none', padding: 0 }} aria-pressed={batMoi} aria-label="Bật khối đề mới">
          <OTich chon={batMoi} />
          <span className="font-bold" style={{ fontFamily: 'var(--sans)', fontSize: 'var(--cx-2)' }}>
            ĐỀ MỚI
          </span>
          <span style={NHAN_NHO}>bài vừa giao về nhà · tích 1 đề</span>
        </button>
        {batMoi && (
          <div className="flex flex-col" style={{ gap: 4, marginTop: 'var(--k3)', maxHeight: 220, overflowY: 'auto' }} data-hop-de-moi>
            {nguon.length === 0 && <div style={NHAN_NHO}>Chưa có đề nào trong kho.</div>}
            {nguon.map((s) => {
              const n = soCauCua(s)
              const chon = s.maDe === maDeMoi
              return (
                <button
                  key={s.maDe}
                  type="button"
                  role="radio"
                  aria-checked={chon}
                  // Tích đề thứ hai thì BỎ đề trước — lõi chung phải nằm trong
                  // đúng bài các em vừa làm ở nhà.
                  onClick={() => setMaDeMoi(chon ? '' : s.maDe)}
                  className="tap-target w-full text-left inline-flex items-center"
                  style={{ gap: 'var(--k3)', minHeight: 44, padding: '6px var(--k3)', borderRadius: 'var(--bo-1)', background: chon ? 'var(--xanh-nen)' : 'var(--the-2)', border: `1.5px solid ${chon ? 'var(--xanh)' : 'transparent'}` }}
                >
                  <OTich chon={chon} tron />
                  <span className="flex-1 min-w-0 truncate" style={{ fontFamily: 'var(--sans)', fontSize: 'var(--cx-2)', color: 'var(--muc)' }}>
                    {s.maDe}
                  </span>
                  <span style={{ ...NHAN_NHO, ...SO }}>
                    {n.tong} câu · I:{n.I} II:{n.II} III:{n.III}
                  </span>
                </button>
              )
            })}
          </div>
        )}
      </TheNoiDung>

      {/* KHỐI ĐỀ CŨ — nhiều chương */}
      <TheNoiDung>
        <button type="button" onClick={() => setBatCu((v) => !v)} className="tap-target w-full text-left inline-flex items-center" style={{ gap: 'var(--k3)', minHeight: 44, background: 'none', border: 'none', padding: 0 }} aria-pressed={batCu} aria-label="Bật khối đề cũ">
          <OTich chon={batCu} />
          <span className="font-bold" style={{ fontFamily: 'var(--sans)', fontSize: 'var(--cx-2)' }}>
            ĐỀ CŨ
          </span>
          <span style={NHAN_NHO}>kho ôn lại · tích nhiều chương</span>
        </button>
        {batCu && (
          <div className="flex flex-col" style={{ gap: 4, marginTop: 'var(--k3)', maxHeight: 220, overflowY: 'auto' }} data-hop-de-cu>
            {chuong.map((c) => {
              const chon = chuongCu.has(c.ten)
              return (
                <button
                  key={c.ten}
                  type="button"
                  role="checkbox"
                  aria-checked={chon}
                  onClick={() =>
                    setChuongCu((truoc) => {
                      const s = new Set(truoc)
                      if (s.has(c.ten)) s.delete(c.ten)
                      else s.add(c.ten)
                      return s
                    })
                  }
                  className="tap-target w-full text-left inline-flex items-center"
                  style={{ gap: 'var(--k3)', minHeight: 44, padding: '6px var(--k3)', borderRadius: 'var(--bo-1)', background: chon ? 'var(--xanh-nen)' : 'var(--the-2)', border: `1.5px solid ${chon ? 'var(--xanh)' : 'transparent'}` }}
                >
                  <OTich chon={chon} />
                  <span className="flex-1 min-w-0 truncate" style={{ fontFamily: 'var(--sans)', fontSize: 'var(--cx-2)', color: 'var(--muc)' }}>
                    {c.ten}
                  </span>
                  <span style={{ ...NHAN_NHO, ...SO }}>{c.soCau} câu</span>
                </button>
              )
            })}
          </div>
        )}
      </TheNoiDung>

      {/* DÒNG TỔNG — đọc thẳng từ hằng chế độ, không đếm tay */}
      <TheNoiDung>
        <div className="font-bold" style={{ fontFamily: 'var(--sans)', fontSize: 'var(--cx-3)' }} data-dong-tong>
          {tom ? (
            <>
              <span style={SO}>{tom.soCau}</span> câu · ước <span style={SO}>{Math.round(tom.giay / 60)}</span> phút · <span style={SO}>{tom.tinHieu}</span> tín hiệu chẩn đoán
            </>
          ) : (
            'Chưa tích khối nào'
          )}
        </div>
        <div style={{ ...NHAN_NHO, marginTop: 'var(--k1)' }}>
          {cheDo === 'ca_hai'
            ? 'Chữa bài mới và ôn cũ.'
            : cheDo === 'chi_moi'
              ? 'Chỉ chữa bài mới — lõi chung dày hơn để đo được cả lớp.'
              : cheDo === 'chi_cu'
                ? 'Buổi ôn, không có đề mới — đo sâu hai chuyên đề.'
                : 'Tích ĐỀ MỚI hoặc ĐỀ CŨ (hoặc cả hai) rồi mới mở được ca.'}
        </div>
        <div className="grid grid-cols-2" style={{ gap: 'var(--k3)', marginTop: 'var(--k4)' }}>
          <button type="button" onClick={bamXemTruoc} disabled={!cheDo || !!dangMo} className="tap-target font-bold inline-flex items-center justify-center" style={{ minHeight: 48, gap: 6, borderRadius: 'var(--bo-1)', background: 'var(--the-2)', border: '1.5px solid var(--vien)', color: cheDo ? 'var(--muc)' : 'var(--mo)', fontFamily: 'var(--sans)', fontSize: 'var(--cx-2)' }}>
            <Eye size={16} /> Xem trước một em
          </button>
          <NutChinh onClick={bamMoCa} disabled={!cheDo || !!dangMo}>
            {dangMo || 'Mở ca'}
          </NutChinh>
        </div>
      </TheNoiDung>

      {/* XEM TRƯỚC — bảng câu của một em, kèm LÝ DO chọn từng câu */}
      {xemTruoc && (
        <TheNoiDung>
          <div className="font-bold" style={{ fontFamily: 'var(--serif)', fontSize: 'var(--cx-4)', marginBottom: 'var(--k3)' }}>
            Xem trước · {dsEm.find((e) => e.sbd === emMau)?.hoTen || `SBD ${emMau}`}
          </div>
          {xemTruoc.canhBao.map((c, i) => (
            <OThongBao key={i} tone="cam">
              {c}
            </OThongBao>
          ))}
          <div style={{ ...NHAN_NHO, marginTop: 'var(--k2)' }}>
            Ước <span style={SO}>{xemTruoc.giayUocTinh}</span>s · <span style={SO}>{xemTruoc.soTinHieu}</span> tín hiệu · chuyên đề cũ đo: {(xemTruoc.chuyenDeDo[emMau] || []).join(', ') || '(chưa có hồ sơ)'}
          </div>
          <div className="flex flex-col" style={{ gap: 4, marginTop: 'var(--k3)' }}>
            {[
              ...xemTruoc.loiChung.map((c) => ({ c, vi: 'lõi chung — cả lớp cùng làm, để tính được tỉ lệ đúng và độ chụm' })),
              ...(xemTruoc.theoEm[emMau] || []).map((c) => ({ c, vi: c.sao === 2 ? 'riêng của em — câu 2 sao' : 'riêng của em — theo chuyên đề đến hạn đo' })),
            ].map(({ c, vi }) => (
              <div key={c.id} style={{ background: 'var(--the-2)', borderRadius: 'var(--bo-1)', padding: 'var(--k3)' }}>
                <div style={{ fontFamily: 'var(--sans)', fontSize: 'var(--cx-2)', color: 'var(--muc)' }}>
                  Phần {c.phan} · {c.chuyenDe} {'★'.repeat(c.sao)}
                </div>
                <div style={NHAN_NHO}>{vi}</div>
              </div>
            ))}
          </div>
        </TheNoiDung>
      )}
    </div>
  )
}
