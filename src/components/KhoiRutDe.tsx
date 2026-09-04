// KHỐI RÚT ĐỀ trong màn Mở ca — thầy chốt đúng bộ câu sẽ ra.
//
// Vì sao khối này tồn tại: xem đầu file `src/lib/rut-de.ts`. Ở đây chỉ là giao
// diện; mọi luật chọn câu nằm trong lib và có test.
//
// BA VIỆC KHỐI NÀY LÀM RÕ, KHÔNG ĐỂ THẦY ĐOÁN:
//   · Thiếu câu thì hiện ô cam ghi rõ thiếu mấy câu ở phần nào.
//   · Câu đã ra ở ca trước thì gắn nhãn "đã ra", không lặng lẽ phát lại.
//   · Cỡ gói đề gửi lên hiện thành số KB, vì đó chính là thứ mỗi em phải tải.
import { useEffect, useMemo, useState } from 'react'
import { Dices, RefreshCw, X, ImageIcon, ChevronDown } from 'lucide-react'
import type { TeacherExamSource } from '../data/examContent'
import { Nhan, OThongBao } from './DesignSystem'
import { boMotCau, demMucDo, doiMotCau, dsChuyenDe, dungUngVien, moiIdDaRut, MOI_MUC, PHAN_DE, rutDe, soCauCua, TEN_MUC, tongCau, type CauUngVien, type KetQuaRut, type MucDoRut, type PhanDe, type SoCauPhan, type YeuCauRut } from '../lib/rut-de'

const NHAN_NHO: React.CSSProperties = { fontFamily: 'var(--sans)', fontSize: 'var(--cx-1)', color: 'var(--nhat)' }
const SO: React.CSSProperties = { fontFamily: 'var(--sans)', fontVariantNumeric: 'tabular-nums' }

/** Cấu trúc đề tốt nghiệp THPT hiện hành — mặc định khi thầy không đổi gì. */
export const SO_CAU_CHUAN: SoCauPhan = { I: 18, II: 4, III: 6 }

function Chip({ chon, onClick, children, mau = 'muc' }: { chon: boolean; onClick: () => void; children: React.ReactNode; mau?: 'muc' | 'tim' }) {
  const nenChon = mau === 'tim' ? 'var(--tim-nen)' : 'var(--muc)'
  const chuChon = mau === 'tim' ? 'var(--tim)' : 'var(--muc-nguoc)'
  return (
    <button
      type="button"
      role="checkbox"
      aria-checked={chon}
      onClick={onClick}
      className="tap-target font-bold"
      style={{
        ...SO,
        fontSize: 'var(--cx-1)',
        minHeight: 36,
        padding: '0 var(--k3)',
        borderRadius: 'var(--bo-tron)',
        background: chon ? nenChon : 'var(--the-2)',
        color: chon ? chuChon : 'var(--nhat)',
        border: `1.5px solid ${chon && mau === 'tim' ? 'var(--tim)' : 'transparent'}`,
        transitionProperty: 'background-color, color, border-color',
        transitionDuration: 'var(--nhanh)',
      }}
    >
      {children}
    </button>
  )
}

function OSo({ nhan, tri, doi, tran }: { nhan: string; tri: number; doi: (n: number) => void; tran: number }) {
  return (
    <label className="flex flex-col" style={{ gap: 4 }}>
      <span style={NHAN_NHO}>
        {nhan} <span style={{ ...SO, color: tran === 0 ? 'var(--cam)' : 'var(--mo)' }}>/ {tran}</span>
      </span>
      <input
        type="number"
        inputMode="numeric"
        min={0}
        max={tran}
        value={tri}
        onChange={(e) => doi(Math.max(0, Math.min(tran, Math.floor(Number(e.target.value) || 0))))}
        aria-label={`Số câu ${nhan}`}
        style={{
          ...SO,
          height: 48,
          width: 84,
          textAlign: 'center',
          borderRadius: 'var(--bo-1)',
          background: 'var(--the-2)',
          border: '1.5px solid transparent',
          fontSize: 'var(--cx-3)',
          fontWeight: 700,
          color: 'var(--muc)',
          outline: 'none',
        }}
      />
    </label>
  )
}

function HangCau({ c, stt, doi, bo, conDoi }: { c: CauUngVien; stt: number; doi: () => void; bo: () => void; conDoi: boolean }) {
  const [mo, setMo] = useState(false)
  return (
    <div style={{ background: 'var(--the-2)', borderRadius: 'var(--bo-1)', padding: 'var(--k3)' }}>
      <div className="flex items-start" style={{ gap: 'var(--k3)' }}>
        <span className="shrink-0 font-bold flex items-center justify-center" style={{ ...SO, width: 26, height: 26, borderRadius: 'var(--bo-tron)', background: 'var(--nen)', fontSize: 'var(--cx-1)' }}>
          {stt}
        </span>
        <button type="button" onClick={() => setMo((v) => !v)} className="flex-1 min-w-0 text-left" aria-expanded={mo}>
          <div
            style={{
              fontFamily: 'var(--sans)',
              fontSize: 'var(--cx-1)',
              color: 'var(--muc)',
              lineHeight: 1.45,
              display: '-webkit-box',
              WebkitLineClamp: mo ? 99 : 2,
              WebkitBoxOrient: 'vertical',
              overflow: 'hidden',
            }}
          >
            {c.text || '(câu chỉ có ảnh)'}
          </div>
          <div className="flex flex-wrap items-center" style={{ gap: 6, marginTop: 6 }}>
            <span style={{ ...NHAN_NHO, ...SO }}>
              {c.maDe} · câu {c.soGoc}
            </span>
            {c.mucDo && <Nhan tone={c.mucDo === 'biet' ? 'xam' : c.mucDo === 'hieu' ? 'tim' : 'cam'}>{TEN_MUC[c.mucDo]}</Nhan>}
            {c.coHinh && (
              <span title="Câu có hình" style={{ color: 'var(--mo)' }}>
                <ImageIcon size={14} />
              </span>
            )}
            {c.canXem && <Nhan tone="do">cần xem lại</Nhan>}
          </div>
        </button>
        <span className="shrink-0 flex items-center" style={{ gap: 2 }}>
          <button type="button" onClick={doi} disabled={!conDoi} className="tap-target" aria-label="Đổi câu khác" title={conDoi ? 'Đổi câu khác' : 'Hết câu hợp bộ lọc để đổi'} style={{ color: conDoi ? 'var(--nhat)' : 'var(--mo)', padding: 6 }}>
            <RefreshCw size={16} />
          </button>
          <button type="button" onClick={bo} className="tap-target" aria-label="Bỏ câu này" title="Bỏ câu này" style={{ color: 'var(--nhat)', padding: 6 }}>
            <X size={16} />
          </button>
        </span>
      </div>
    </div>
  )
}

export interface KhoiRutDeProps {
  nguon: TeacherExamSource[]
  /** Câu đã ra ở các ca trước — đẩy xuống cuối khi rút. */
  qidCaTruoc: string[]
  /** Gọi mỗi khi bộ câu đổi. `null` = thầy chọn lấy trọn kho, không rút. */
  onDoi: (kq: { ids: Set<string>; soCau: SoCauPhan } | null) => void
}

export default function KhoiRutDe({ nguon, qidCaTruoc, onDoi }: KhoiRutDeProps) {
  const uv = useMemo(() => dungUngVien(nguon), [nguon])
  const co: SoCauPhan = useMemo(() => ({ I: uv.I.length, II: uv.II.length, III: uv.III.length }), [uv])
  const tongKho = tongCau(co)
  const dsCd = useMemo(() => dsChuyenDe(uv), [uv])
  const demMuc = useMemo(() => demMucDo(uv), [uv])

  // Kho vừa đúng cỡ một đề (≤ 28 câu, cấu trúc THPT) thì mặc định lấy trọn —
  // rút đề ở đó chỉ tổ làm thầy thêm một bước. Kho lớn hơn thì mặc định RÚT,
  // vì đẩy cả kho lên là bắt mỗi em tải vài megabyte.
  const [rut, setRut] = useState(() => tongKho > tongCau(SO_CAU_CHUAN))
  const [soCau, setSoCau] = useState<SoCauPhan>(() => ({ I: Math.min(SO_CAU_CHUAN.I, co.I), II: Math.min(SO_CAU_CHUAN.II, co.II), III: Math.min(SO_CAU_CHUAN.III, co.III) }))
  const [chonCd, setChonCd] = useState<string[]>([])
  const [chonMuc, setChonMuc] = useState<MucDoRut[]>([])
  const [seed, setSeed] = useState(() => Math.floor(Math.random() * 1e9))
  const [moChiTiet, setMoChiTiet] = useState(false)
  const [kq, setKq] = useState<KetQuaRut | null>(null)
  // Câu thầy đã bấm đổi/bỏ trong lượt này — không cho quay lại ngay.
  const [daBo, setDaBo] = useState<string[]>([])

  // Đổi đề đã chọn thì mọi thứ phải tính lại từ đầu.
  useEffect(() => {
    setSoCau({ I: Math.min(SO_CAU_CHUAN.I, co.I), II: Math.min(SO_CAU_CHUAN.II, co.II), III: Math.min(SO_CAU_CHUAN.III, co.III) })
    setChonCd([])
    setChonMuc([])
    setDaBo([])
    setRut(tongKho > tongCau(SO_CAU_CHUAN))
  }, [co.I, co.II, co.III, tongKho])

  const yc: YeuCauRut = useMemo(() => ({ soCau, chuyenDe: chonCd, mucDo: chonMuc, tranhQid: qidCaTruoc, seed }), [soCau, chonCd, chonMuc, qidCaTruoc, seed])

  useEffect(() => {
    setKq(rutDe(uv, yc))
    setDaBo([])
  }, [uv, yc])

  // Báo bộ câu lên màn Mở ca. Không rút thì báo null = giữ nguyên đường cũ.
  useEffect(() => {
    if (!rut || !kq) {
      onDoi(null)
      return
    }
    onDoi({ ids: moiIdDaRut(kq), soCau: soCauCua(kq) })
  }, [rut, kq, onDoi])

  const daRut = kq ? soCauCua(kq) : { I: 0, II: 0, III: 0 }
  const thieu = kq ? PHAN_DE.filter((p) => kq.thieu[p] > 0) : []
  const capNhat = (p: PhanDe, n: number) => setSoCau((cu) => ({ ...cu, [p]: n }))

  const doiCau = (p: PhanDe, id: string) => {
    if (!kq) return
    setKq(doiMotCau(uv, yc, kq, p, id, daBo))
    setDaBo((cu) => [...cu, id])
  }
  const boCau = (p: PhanDe, id: string) => {
    if (!kq) return
    setKq(boMotCau(kq, p, id))
    setDaBo((cu) => [...cu, id])
  }

  if (tongKho === 0) return null

  return (
    <div className="flex flex-col" style={{ gap: 'var(--k3)', marginTop: 'var(--k3)', paddingTop: 'var(--k3)', borderTop: '1px solid var(--vien)' }}>
      <div className="flex items-center justify-between" style={{ gap: 'var(--k3)' }}>
        <div className="min-w-0">
          <div className="font-bold" style={{ fontFamily: 'var(--serif)', fontSize: 'var(--cx-3)', color: 'var(--muc)' }}>
            Bộ câu ra đề
          </div>
          <div style={NHAN_NHO}>
            Kho đã chọn có <b style={{ ...SO, color: 'var(--muc)' }}>{tongKho}</b> câu (I {co.I} · II {co.II} · III {co.III})
          </div>
        </div>
      </div>

      <div className="flex flex-wrap" style={{ gap: 'var(--k2)' }} role="radiogroup" aria-label="Cách lấy câu">
        <Chip chon={rut} onClick={() => setRut(true)}>
          Rút bộ câu
        </Chip>
        <Chip chon={!rut} onClick={() => setRut(false)}>
          Lấy trọn kho ({tongKho} câu)
        </Chip>
      </div>

      {!rut ? (
        <OThongBao tone="cam">
          Cả {tongKho} câu được đẩy lên máy chủ, và mỗi em vẫn chỉ được máy cắt ngẫu nhiên {SO_CAU_CHUAN.I}/{SO_CAU_CHUAN.II}/{SO_CAU_CHUAN.III} câu — mỗi em một bộ khác nhau nên
          <b> điểm hai em không so được với nhau</b>, hạng lớp trong báo cáo gửi phụ huynh cũng không còn đúng. Chỉ nên dùng khi kho vừa đúng một đề.
        </OThongBao>
      ) : (
        <>
          <div className="flex flex-wrap items-end" style={{ gap: 'var(--k4)' }}>
            <OSo nhan="Phần I" tri={soCau.I} doi={(n) => capNhat('I', n)} tran={co.I} />
            <OSo nhan="Phần II" tri={soCau.II} doi={(n) => capNhat('II', n)} tran={co.II} />
            <OSo nhan="Phần III" tri={soCau.III} doi={(n) => capNhat('III', n)} tran={co.III} />
            <button
              type="button"
              onClick={() => setSeed(Math.floor(Math.random() * 1e9))}
              className="tap-target font-bold inline-flex items-center"
              style={{ ...SO, gap: 6, height: 48, padding: '0 var(--k4)', borderRadius: 'var(--bo-1)', background: 'var(--the-2)', color: 'var(--muc)', fontSize: 'var(--cx-1)' }}
            >
              <Dices size={16} /> Trộn lại
            </button>
          </div>

          <div className="flex flex-wrap" style={{ gap: 'var(--k2)' }}>
            {(['I', 'II', 'III'] as const).map((p) => (
              <button key={p} type="button" onClick={() => capNhat(p, Math.min(SO_CAU_CHUAN[p], co[p]))} className="tap-target" style={{ ...NHAN_NHO, textDecoration: 'underline' }}>
                Phần {p} về {Math.min(SO_CAU_CHUAN[p], co[p])}
              </button>
            ))}
          </div>

          {dsCd.length > 1 && (
            <div>
              <div style={{ ...NHAN_NHO, marginBottom: 'var(--k2)' }}>Chuyên đề được lấy {chonCd.length === 0 ? '(tất cả)' : `(${chonCd.length} chuyên đề)`}</div>
              <div className="flex flex-wrap" style={{ gap: 'var(--k2)' }}>
                {dsCd.map((c) => (
                  <Chip key={c.ten} mau="tim" chon={chonCd.includes(c.ten)} onClick={() => setChonCd((cu) => (cu.includes(c.ten) ? cu.filter((x) => x !== c.ten) : [...cu, c.ten]))}>
                    {c.ten} <span style={{ opacity: 0.7 }}>{c.soCau}</span>
                  </Chip>
                ))}
              </div>
            </div>
          )}

          <div>
            <div style={{ ...NHAN_NHO, marginBottom: 'var(--k2)' }}>Mức độ được lấy {chonMuc.length === 0 ? '(tất cả)' : ''}</div>
            <div className="flex flex-wrap" style={{ gap: 'var(--k2)' }}>
              {MOI_MUC.map((m) => (
                <Chip key={m} chon={chonMuc.includes(m)} onClick={() => setChonMuc((cu) => (cu.includes(m) ? cu.filter((x) => x !== m) : [...cu, m]))}>
                  {TEN_MUC[m]} <span style={{ opacity: 0.7 }}>{demMuc[m]}</span>
                </Chip>
              ))}
              {demMuc[''] > 0 && <span style={NHAN_NHO}>· {demMuc['']} câu chưa gắn mức, chỉ vào đề khi để trống bộ lọc mức độ</span>}
            </div>
          </div>

          {thieu.length > 0 && kq && (
            <OThongBao tone="cam">
              Kho không đủ câu hợp bộ lọc: {thieu.map((p) => `phần ${p} thiếu ${kq.thieu[p]} câu`).join(', ')}. Bỏ bớt bộ lọc chuyên đề hoặc mức độ, hoặc hạ số câu xuống.
            </OThongBao>
          )}
          {kq && kq.lapLai > 0 && <OThongBao tone="cam">{kq.lapLai} câu trong bộ này đã ra ở ca trước — kho hết câu mới hợp bộ lọc.</OThongBao>}

          <div className="flex items-center justify-between" style={{ gap: 'var(--k3)' }}>
            <div style={{ fontFamily: 'var(--sans)', fontSize: 'var(--cx-2)', color: 'var(--muc)' }}>
              Đề ra: <b style={SO}>{tongCau(daRut)}</b> câu (I {daRut.I} · II {daRut.II} · III {daRut.III})
            </div>
            <button type="button" onClick={() => setMoChiTiet((v) => !v)} className="tap-target font-bold inline-flex items-center" style={{ ...NHAN_NHO, gap: 4, color: 'var(--muc)' }} aria-expanded={moChiTiet}>
              {moChiTiet ? 'Thu lại' : 'Xem từng câu'}
              <ChevronDown size={16} style={{ transform: moChiTiet ? 'rotate(180deg)' : 'none', transitionProperty: 'transform', transitionDuration: 'var(--nhanh)' }} />
            </button>
          </div>

          {moChiTiet && kq && (
            <div className="flex flex-col" style={{ gap: 'var(--k3)' }}>
              {PHAN_DE.filter((p) => kq.chon[p].length > 0).map((p) => (
                <div key={p} className="flex flex-col" style={{ gap: 'var(--k2)' }}>
                  <div className="font-bold" style={{ ...NHAN_NHO, color: 'var(--muc)' }}>
                    Phần {p} — {kq.chon[p].length} câu
                  </div>
                  {kq.chon[p].map((c, i) => (
                    <HangCau key={c.id} c={c} stt={i + 1} conDoi={kq.conLai[p] > 0} doi={() => doiCau(p, c.id)} bo={() => boCau(p, c.id)} />
                  ))}
                </div>
              ))}
            </div>
          )}

          <div style={NHAN_NHO}>Cả lớp làm cùng bộ câu này. Thứ tự câu và thứ tự A–D vẫn đảo riêng từng em nên hai em ngồi cạnh nhau không nhìn được bài của nhau.</div>
        </>
      )}
    </div>
  )
}
