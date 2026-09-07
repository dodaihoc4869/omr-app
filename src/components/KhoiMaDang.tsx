// KHỐI MÃ DẠNG ở màn Ngân hàng câu hỏi — đặc tả v3 mục 4.3.
//
// Ba việc, đúng thứ tự thầy cần:
//   1. Kho đang đứng ở đâu: gán được bao nhiêu, còn bao nhiêu câu CẦN THẦY CHỐT,
//      và quan trọng nhất — bao nhiêu câu THẬT SỰ dùng được làm câu chữa.
//   2. Chốt tay những câu máy không dám gán.
//   3. Lọc theo mã để soi câu máy gán SAI rồi sửa.
//
// App không tự nghĩ mã: mọi ô chọn đều lấy từ từ vựng đóng `tu-vung-dang.ts`,
// không có ô gõ tay mã.
import { useMemo, useState } from 'react'
import { Tags, Filter, Download, RotateCcw } from 'lucide-react'
import type { TeacherExamSource } from '../data/examContent'
import { Nhan, OThongBao, TheNoiDung } from './DesignSystem'
import { dsCauCoMa, thongKeDang, type CauCoMa, type CauChuaGan } from '../lib/thong-ke-dang'
import { boSua, ghiSua, xuatSo, type SoSuaDang } from '../lib/sua-dang'
import { CO_CHE, DS_CHUONG, TEN_CHUONG, VIEC, chuongCua, tenCua } from '../lib/tu-vung-dang'
import { nhanhCoChe } from '../lib/cau-hinh-chua'

const NHAN_NHO = { fontSize: 'var(--cx-1)', color: 'var(--nhat)', fontFamily: 'var(--sans)' } as const
const TRAN_HIEN = 40

function O({ so, ten, tone }: { so: number | string; ten: string; tone?: 'do' | 'cam' | 'xanh' }) {
  const mau = tone === 'do' ? 'var(--do)' : tone === 'cam' ? 'var(--cam)' : tone === 'xanh' ? 'var(--xanh)' : 'var(--muc)'
  return (
    <div style={{ background: 'var(--the-2)', borderRadius: 'var(--bo-2)', padding: 'var(--k3) var(--k4)' }}>
      <div className="font-bold" style={{ fontSize: 'var(--cx-4)', fontFamily: 'var(--serif)', fontVariantNumeric: 'tabular-nums', color: mau }}>
        {so}
      </div>
      <div style={NHAN_NHO}>{ten}</div>
    </div>
  )
}

const O_CHON: React.CSSProperties = {
  background: 'var(--the-2)',
  color: 'var(--muc)',
  border: '1.5px solid transparent',
  borderRadius: 'var(--bo-1)',
  padding: '6px 8px',
  fontSize: 'var(--cx-2)',
  fontFamily: 'var(--sans)',
  maxWidth: '100%',
}

/** Ô chọn mã ba tầng. Chỉ chọn trong từ vựng đóng — không cho gõ tay. */
function ChonMa({ maHienTai, onChon, onBo }: { maHienTai: string; onChon: (ma: string) => void; onBo?: () => void }) {
  const t = maHienTai.split('.')
  const [chuong, setChuong] = useState(t.length === 3 && t[0] in CO_CHE ? t[0] : '')
  const [coChe, setCoChe] = useState(t.length === 3 && t[0] in CO_CHE && t[1] in CO_CHE[t[0]] ? t[1] : '')
  const [viec, setViec] = useState(t.length === 3 && t[2] in VIEC ? t[2] : '')
  const dayDu = chuong && coChe && viec
  return (
    <div className="flex flex-wrap items-center" style={{ gap: 'var(--k2)' }}>
      <select
        style={O_CHON}
        value={chuong}
        onChange={(e) => {
          setChuong(e.target.value)
          setCoChe('')
        }}
        aria-label="Chuyên đề"
      >
        <option value="">— chuyên đề —</option>
        {DS_CHUONG.map((c) => (
          <option key={c} value={c}>
            {TEN_CHUONG[c]}
          </option>
        ))}
      </select>
      <select style={O_CHON} value={coChe} onChange={(e) => setCoChe(e.target.value)} disabled={!chuong} aria-label="Cơ chế">
        <option value="">— cơ chế —</option>
        {chuong &&
          Object.entries(CO_CHE[chuong]).map(([k, v]) => (
            <option key={k} value={k}>
              {v}
            </option>
          ))}
      </select>
      <select style={O_CHON} value={viec} onChange={(e) => setViec(e.target.value)} aria-label="Việc phải làm">
        <option value="">— việc phải làm —</option>
        {Object.entries(VIEC).map(([k, v]) => (
          <option key={k} value={k}>
            {v}
          </option>
        ))}
      </select>
      <button
        className="tap-target font-bold"
        disabled={!dayDu}
        onClick={() => dayDu && onChon(`${chuong}.${coChe}.${viec}`)}
        style={{ padding: '6px 14px', borderRadius: 'var(--bo-1)', background: dayDu ? 'var(--xanh)' : 'var(--the-2)', color: dayDu ? 'var(--nen)' : 'var(--nhat)', fontSize: 'var(--cx-1)', fontFamily: 'var(--sans)' }}
      >
        Gán mã này
      </button>
      {onBo && (
        <button className="tap-target" onClick={onBo} style={{ ...NHAN_NHO, padding: '6px 10px' }}>
          Bỏ mã
        </button>
      )}
    </div>
  )
}

function DongCau({ nhan, de, con, mo, onMo }: { nhan: React.ReactNode; de: string; con: React.ReactNode; mo: boolean; onMo: () => void }) {
  return (
    <div style={{ borderTop: '1px solid var(--vien)', padding: 'var(--k3) 0' }}>
      <button className="w-full text-left tap-target" onClick={onMo} style={{ background: 'transparent' }}>
        <div className="flex items-center flex-wrap" style={{ gap: 'var(--k2)' }}>{nhan}</div>
        <div style={{ ...NHAN_NHO, marginTop: 4, display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>{de}</div>
      </button>
      {mo && <div style={{ marginTop: 'var(--k2)' }}>{con}</div>}
    </div>
  )
}

export default function KhoiMaDang({
  sources,
  soSua,
  onSua,
  onTaiLaiHet,
  dangDongBo,
}: {
  sources: TeacherExamSource[]
  soSua: SoSuaDang
  onSua: (so: SoSuaDang) => void
  /** Ép tải lại TOÀN BỘ đề, bỏ qua phép so ngày. */
  onTaiLaiHet?: () => void
  dangDongBo?: boolean
}) {
  const [moChot, setMoChot] = useState(false)
  const [moLoc, setMoLoc] = useState(false)
  const [locChuong, setLocChuong] = useState('')
  const [locCoChe, setLocCoChe] = useState('')
  const [dangMo, setDangMo] = useState('')

  const tk = useMemo(() => thongKeDang(sources), [sources])
  const coMa = useMemo(() => (moLoc ? dsCauCoMa(sources) : []), [sources, moLoc])
  const locRa = useMemo(() => {
    if (!moLoc) return [] as CauCoMa[]
    return coMa.filter((c) => (!locChuong || chuongCua(c.ma) === locChuong) && (!locCoChe || nhanhCoChe(c.ma) === `${locChuong}.${locCoChe}`))
  }, [coMa, locChuong, locCoChe, moLoc])

  const soCauDaSua = Object.keys(soSua).length

  function ganCho(qid: string, ma: string | null) {
    onSua(ma === null ? ghiSua(soSua, qid, null) : ghiSua(soSua, qid, ma))
    setDangMo('')
  }

  function taiSoVe() {
    const blob = new Blob([xuatSo(soSua, sources)], { type: 'application/json' })
    const a = document.createElement('a')
    a.href = URL.createObjectURL(blob)
    a.download = `so-sua-dang-${new Date().toISOString().slice(0, 10)}.json`
    a.click()
    URL.revokeObjectURL(a.href)
  }

  return (
    <TheNoiDung>
      <div className="flex items-center justify-between flex-wrap" style={{ gap: 'var(--k3)' }}>
        <div className="flex items-center" style={{ gap: 'var(--k3)' }}>
          <Tags size={20} style={{ color: 'var(--nhat)' }} />
          <div>
            <div className="font-bold" style={{ fontSize: 'var(--cx-4)', fontFamily: 'var(--serif)' }}>
              Mã dạng
            </div>
            <div style={NHAN_NHO}>Cổng rút câu chữa so mã này. Sai mã là phát nhầm phiếu.</div>
          </div>
        </div>
        <div className="flex items-center flex-wrap" style={{ gap: 'var(--k2)' }}>
          <Nhan tone="xam">{tk.soMa} mã</Nhan>
          <Nhan tone="xam">{tk.soNhanh} nhánh cơ chế</Nhan>
          {soCauDaSua > 0 && <Nhan tone="tim">{soCauDaSua} câu thầy đã sửa</Nhan>}
        </div>
      </div>

      <div className="grid" style={{ marginTop: 'var(--k4)', gap: 'var(--k2)', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))' }}>
        <O so={tk.daGan} ten={`đã gán / ${tk.tongCau} câu`} tone="xanh" />
        <O so={tk.dungLamCauChua} ten="dùng được làm câu chữa" tone="xanh" />
        <O so={tk.canThayChot.length} ten="cần thầy chốt" tone={tk.canThayChot.length ? 'cam' : undefined} />
        <O so={`${tk.phuBac1}%`} ten="có câu chữa đúng mã" />
      </div>

      <div style={{ ...NHAN_NHO, marginTop: 'var(--k3)' }}>
        {tk.loaiViCoHinh} câu có mã nhưng có hình nên không vào phiếu in được · {tk.chuaGanDoChuongPhu} câu để trống vì chương chưa có bảng cơ chế ·{' '}
        {tk.phuBac2}% có câu chữa cùng nhánh cơ chế
        {tk.chuaTaiLai > 0 && ` · ${tk.chuaTaiLai} câu chưa tải bản mới`}
      </div>

      {tk.maLa.length > 0 && (
        <div style={{ marginTop: 'var(--k3)' }}>
          <OThongBao tone="do">
            {tk.maLa.length} câu mang mã NGOÀI bảng đóng — pipeline đã tự nghĩ mã. Sửa bảng `kho-de/DANG-BAI.md` hoặc gán lại:{' '}
            {tk.maLa.slice(0, 6).map((c) => `${c.maDe} ${c.phan}${c.so} (${c.ma})`).join(' · ')}
          </OThongBao>
        </div>
      )}

      {tk.nhanhMong.length > 0 && (
        <div style={{ marginTop: 'var(--k3)' }}>
          <OThongBao tone="cam">
            Nhánh mỏng, em nào sai đúng dạng này sẽ phải lấy câu bậc 2:{' '}
            {tk.nhanhMong.slice(0, 6).map((n) => `${tenCua(`${n.nhanh}.NHAN_DANG`).split(' — ')[0]} (${n.soCau} câu)`).join(' · ')}
          </OThongBao>
        </div>
      )}

      {/* MÁY NÀY CÒN GIỮ ĐỀ CŨ. Phải nói trước mọi thứ khác: nếu không, màn này
          đếm ra hàng nghìn "câu cần thầy chốt" và thầy sẽ ngồi gán tay những
          câu mà kho đã gán xong từ lâu. */}
      {tk.chuaTaiLai > 0 && (
        <div style={{ marginTop: 'var(--k3)' }}>
          <OThongBao tone="do">
            <div className="font-bold">Máy này còn giữ bản đề cũ — chưa có mã dạng.</div>
            <div style={{ marginTop: 4 }}>
              {tk.chuaTaiLai} câu chưa có trường mã dạng, nằm ở: {tk.deChuaTaiLai.slice(0, 8).join(' · ')}
              {tk.deChuaTaiLai.length > 8 ? ` … và ${tk.deChuaTaiLai.length - 8} mã đề nữa` : ''}. Kho đã gán rồi —{' '}
              <b>đừng gán tay</b>, bấm nút dưới để tải lại.
            </div>
            {onTaiLaiHet && (
              <button
                className="tap-target font-bold"
                onClick={onTaiLaiHet}
                disabled={dangDongBo}
                style={{ marginTop: 'var(--k3)', padding: '8px 14px', borderRadius: 'var(--bo-1)', background: 'var(--do)', color: 'var(--nen)', fontSize: 'var(--cx-1)', fontFamily: 'var(--sans)' }}
              >
                {dangDongBo ? 'Đang tải…' : `Tải lại toàn bộ ${sources.length} mã đề`}
              </button>
            )}
          </OThongBao>
        </div>
      )}

      {tk.canThayChot.length > 0 && (
        <div style={{ marginTop: 'var(--k4)' }}>
          <button className="tap-target font-bold w-full text-left" onClick={() => setMoChot((v) => !v)} style={{ background: 'var(--cam-nen)', color: 'var(--cam)', borderRadius: 'var(--bo-2)', padding: 'var(--k3) var(--k4)', fontSize: 'var(--cx-2)', fontFamily: 'var(--sans)' }}>
            {moChot ? '▾' : '▸'} {tk.canThayChot.length} câu máy không dám gán — thầy chốt tay
          </button>
          {moChot && (
            <div style={{ marginTop: 'var(--k2)' }}>
              {tk.canThayChot.slice(0, TRAN_HIEN).map((c: CauChuaGan) => (
                <DongCau
                  key={c.qid}
                  mo={dangMo === c.qid}
                  onMo={() => setDangMo(dangMo === c.qid ? '' : c.qid)}
                  nhan={
                    <>
                      <Nhan tone="xam">{c.maDe}</Nhan>
                      <Nhan tone="xam">{`Phần ${c.phan} câu ${c.so}`}</Nhan>
                      <Nhan tone="cam">{c.viSaoNull}</Nhan>
                    </>
                  }
                  de={c.de}
                  con={<ChonMa maHienTai="" onChon={(ma) => ganCho(c.qid, ma)} />}
                />
              ))}
              {tk.canThayChot.length > TRAN_HIEN && <div style={{ ...NHAN_NHO, paddingTop: 'var(--k3)' }}>… còn {tk.canThayChot.length - TRAN_HIEN} câu nữa.</div>}
            </div>
          )}
        </div>
      )}

      <div style={{ marginTop: 'var(--k4)' }}>
        <button className="tap-target font-bold w-full text-left flex items-center" onClick={() => setMoLoc((v) => !v)} style={{ gap: 'var(--k2)', background: 'var(--the-2)', color: 'var(--muc)', borderRadius: 'var(--bo-2)', padding: 'var(--k3) var(--k4)', fontSize: 'var(--cx-2)', fontFamily: 'var(--sans)' }}>
          <Filter size={16} /> {moLoc ? 'Đóng' : 'Lọc theo mã để soi câu gán sai'}
        </button>
        {moLoc && (
          <div style={{ marginTop: 'var(--k3)' }}>
            <div className="flex flex-wrap items-center" style={{ gap: 'var(--k2)' }}>
              <select
                style={O_CHON}
                value={locChuong}
                onChange={(e) => {
                  setLocChuong(e.target.value)
                  setLocCoChe('')
                }}
                aria-label="Lọc chuyên đề"
              >
                <option value="">Mọi chuyên đề</option>
                {DS_CHUONG.map((c) => (
                  <option key={c} value={c}>
                    {TEN_CHUONG[c]}
                  </option>
                ))}
              </select>
              <select style={O_CHON} value={locCoChe} onChange={(e) => setLocCoChe(e.target.value)} disabled={!locChuong} aria-label="Lọc cơ chế">
                <option value="">Mọi cơ chế</option>
                {locChuong &&
                  Object.entries(CO_CHE[locChuong]).map(([k, v]) => (
                    <option key={k} value={k}>
                      {v}
                    </option>
                  ))}
              </select>
              <span style={NHAN_NHO}>{locRa.length} câu</span>
            </div>
            <div style={{ marginTop: 'var(--k2)' }}>
              {locRa.slice(0, TRAN_HIEN).map((c) => (
                <DongCau
                  key={c.qid}
                  mo={dangMo === c.qid}
                  onMo={() => setDangMo(dangMo === c.qid ? '' : c.qid)}
                  nhan={
                    <>
                      <Nhan tone="xam">{c.maDe}</Nhan>
                      <Nhan tone="xam">{`Phần ${c.phan} câu ${c.so}`}</Nhan>
                      <Nhan tone={c.dungDuoc ? 'xanh' : 'xam'}>{tenCua(c.ma)}</Nhan>
                      {!c.dungDuoc && <Nhan tone="xam">có hình, không vào phiếu in</Nhan>}
                      {soSua[c.qid] && <Nhan tone="tim">thầy đã sửa</Nhan>}
                    </>
                  }
                  de={c.de}
                  con={<ChonMa maHienTai={c.ma} onChon={(ma) => ganCho(c.qid, ma)} onBo={() => ganCho(c.qid, null)} />}
                />
              ))}
              {locRa.length > TRAN_HIEN && <div style={{ ...NHAN_NHO, paddingTop: 'var(--k3)' }}>… còn {locRa.length - TRAN_HIEN} câu nữa. Lọc hẹp lại để thấy hết.</div>}
            </div>
          </div>
        )}
      </div>

      {soCauDaSua > 0 && (
        <div className="flex flex-wrap items-center" style={{ marginTop: 'var(--k4)', gap: 'var(--k2)' }}>
          <button className="tap-target font-bold flex items-center" onClick={taiSoVe} style={{ gap: 'var(--k2)', padding: '8px 14px', borderRadius: 'var(--bo-1)', background: 'var(--the-2)', color: 'var(--muc)', fontSize: 'var(--cx-1)', fontFamily: 'var(--sans)' }}>
            <Download size={16} /> Tải sổ sửa mã ({soCauDaSua} câu)
          </button>
          <button
            className="tap-target flex items-center"
            onClick={() => {
              let s = soSua
              for (const qid of Object.keys(soSua)) s = boSua(s, qid)
              onSua(s)
            }}
            style={{ ...NHAN_NHO, gap: 'var(--k2)', padding: '8px 12px' }}
          >
            <RotateCcw size={14} /> Bỏ hết sửa tay
          </button>
          <span style={NHAN_NHO}>Sửa tay chỉ sống trên máy này. Đưa file sổ về kho-de/ để vào kho vĩnh viễn.</span>
        </div>
      )}
    </TheNoiDung>
  )
}
