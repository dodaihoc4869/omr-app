// CA "KIỂM CHỨNG CÂU ĐÃ ĐÚNG" (02/10) — hai khối màn Theo dõi ca của THẦY:
//   · BangRutThuDaDung   — Xem trước phân bổ (chạy thử lúc ca còn ở phòng chờ): ma trận 2026 theo tỷ lệ, em nào thiếu câu ở phần nào.
//   · KhoiSaiLaiDaDung   — "Sai lại câu đã làm đúng": em SAI NHIỀU câu đã làm đúng NHẤT lên đầu, mỗi câu kèm nhãn đã đúng ở đâu, mức độ gì.
import { useState } from 'react'
import { chuPhanBo, chuThieuDaDung, type EmSaiLaiDaDung } from '../../lib/rut-de-da-dung'
import type { RutThuDaDung } from '../../lib/de-rieng-da-dung'

const NHAN_NHO: React.CSSProperties = { fontFamily: 'var(--sans)', fontSize: 'var(--cx-1)', color: 'var(--nhat)' }
const SO: React.CSSProperties = { fontFamily: 'var(--sans)', fontVariantNumeric: 'tabular-nums' }
const TIEU_DE: React.CSSProperties = { fontFamily: 'var(--serif)', fontSize: 'var(--cx-3)', fontWeight: 700, color: 'var(--muc)' }

export function BangRutThuDaDung({ rt, dang, loi, tenCua, onChayLai }: { rt: RutThuDaDung | null; dang: boolean; loi: string; tenCua: Record<string, string>; onChayLai: () => void }) {
  const [moHet, setMoHet] = useState(false)
  const ten = (sbd: string) => tenCua[sbd] || `Số báo danh ${sbd}`
  const emThieu = rt ? Object.entries(rt.kq.thieu).sort((a, b) => b[1].reduce((n, t) => n + t.so, 0) - a[1].reduce((n, t) => n + t.so, 0) || a[0].localeCompare(b[0])) : []
  const dong = emThieu.flatMap(([sbd, ds]) => chuThieuDaDung(ten(sbd), ds))
  const hien = moHet ? dong : dong.slice(0, 12)
  const tong = rt ? Object.keys(rt.kq.theoEm).length : 0
  const khongCau = rt ? Object.entries(rt.kq.theoEm).filter(([, ds]) => ds.length === 0).map(([s]) => s) : []
  return (
    <section data-khoi="rut-thu-da-dung" aria-label="Xem trước phân bổ" style={{ display: 'flex', flexDirection: 'column', gap: 'var(--k2)', padding: 'var(--k4)', borderRadius: 'var(--bo-2)', background: 'var(--the)' }}>
      <div className="flex items-center justify-between" style={{ gap: 'var(--k3)' }}>
        <div style={TIEU_DE}>Xem trước phân bổ</div>
        <button type="button" className="tap-target" onClick={onChayLai} disabled={dang} style={{ ...NHAN_NHO, textDecoration: 'underline', color: dang ? 'var(--mo)' : 'var(--nhat)' }}>
          Chạy thử lại
        </button>
      </div>
      <div style={NHAN_NHO}>Kiểm chứng câu đã đúng · Chạy thử — chưa phát cho em. Mỗi em chỉ nhận câu chính em đã tự làm đúng trong các chiến dịch.</div>
      {dang && !rt ? (
        <div style={NHAN_NHO} role="status">Đang chạy thử bộ câu cho từng em…</div>
      ) : loi && !rt ? (
        <div style={{ ...NHAN_NHO, color: 'var(--cam)' }} role="alert">Chưa chạy thử được: {loi}. Bấm Chạy thử lại.</div>
      ) : !rt ? (
        <div style={NHAN_NHO}>Chưa có em nào trong lớp hay phòng chờ để chạy thử.</div>
      ) : (
        <>
          <div style={{ ...NHAN_NHO, color: 'var(--muc)' }}>
            <b style={SO}>{tong}</b> em · <b style={SO}>{rt.tongCau}</b> câu theo tỷ lệ ma trận 2026 · {chuPhanBo(rt.kq.phanBo)}
          </div>
          {khongCau.length > 0 && (
            <div style={{ ...NHAN_NHO, color: 'var(--do)' }}>
              <b style={SO}>{khongCau.length}</b> em chưa có câu nào đã làm đúng — không vào được ca này: {khongCau.map(ten).join(' · ')}
            </div>
          )}
          {dong.length === 0 ? (
            <div style={NHAN_NHO}>Mọi em đủ câu đã làm đúng cho từng ô của ma trận.</div>
          ) : (
            <>
              <div style={NHAN_NHO}>
                <b style={SO}>{emThieu.length}</b> em thiếu câu — ô thiếu để trống, không lấp câu em chưa làm đúng:
              </div>
              <ul data-khoi="em-thieu-da-dung" style={{ ...NHAN_NHO, color: 'var(--muc)', margin: 0, paddingLeft: 'var(--k4)' }}>
                {hien.map((d) => (
                  <li key={d}>{d}</li>
                ))}
              </ul>
              {dong.length > hien.length && (
                <button type="button" className="tap-target" onClick={() => setMoHet(true)} style={{ ...NHAN_NHO, textDecoration: 'underline', alignSelf: 'flex-start' }}>
                  Xem thêm {dong.length - hien.length} dòng
                </button>
              )}
            </>
          )}
        </>
      )}
    </section>
  )
}

/** Khối kết thúc bài (cập nhật mỗi lần màn làm mới — em nộp là hiện). `ds` đã xếp bằng `xepSaiLaiDaDung`. */
export function KhoiSaiLaiDaDung({ ds, soEmDaCham }: { ds: readonly EmSaiLaiDaDung[]; soEmDaCham: number }) {
  const [mo, setMo] = useState(true)
  const coSai = ds.filter((e) => e.sai.length > 0)
  const tongSai = coSai.reduce((n, e) => n + e.sai.length, 0)
  return (
    <div data-khoi="sai-lai-da-dung">
      <button
        type="button"
        onClick={() => setMo((v) => !v)}
        aria-expanded={mo}
        className="tap-target font-bold w-full"
        style={{
          ...SO,
          textAlign: 'left',
          minHeight: 44,
          padding: 'var(--k2) var(--k3)',
          borderRadius: 'var(--bo-1)',
          background: tongSai > 0 ? 'var(--do-nen)' : 'var(--xanh-nen)',
          color: tongSai > 0 ? 'var(--do)' : 'var(--xanh)',
          border: 'none',
          fontSize: 'var(--cx-1)',
        }}
      >
        Sai lại câu đã làm đúng ·{' '}
        {soEmDaCham === 0
          ? 'chưa em nào nộp bài'
          : tongSai > 0
            ? `${coSai.length} em sai lại · ${tongSai} câu`
            : `cả ${soEmDaCham} em đã nộp làm đúng lại hết`}
        <span style={{ ...NHAN_NHO, display: 'block', color: 'inherit', opacity: 0.85 }}>{mo ? 'Bấm để gập lại' : 'Bấm để xem từng em, từng câu'}</span>
      </button>
      {mo && coSai.length > 0 && (
        <ol style={{ listStyle: 'none', margin: 'var(--k2) 0 0', padding: 0, display: 'flex', flexDirection: 'column', gap: 'var(--k2)' }}>
          {coSai.map((e) => (
            <li key={e.sbd} data-sbd={e.sbd} style={{ background: 'var(--the-2)', borderRadius: 'var(--bo-1)', padding: 'var(--k3)' }}>
              <div className="font-bold" style={{ fontFamily: 'var(--sans)', fontSize: 'var(--cx-2)', color: 'var(--muc)' }}>
                {e.hoTen || `Số báo danh ${e.sbd}`} <span style={{ ...NHAN_NHO, ...SO }}>· Số báo danh {e.sbd}</span>
              </div>
              <div style={{ ...NHAN_NHO, ...SO }}>
                Sai <b style={{ color: 'var(--do)' }}>{e.sai.length}</b>/{e.tong} câu em đã làm đúng trước đây
              </div>
              <div className="flex flex-col" style={{ gap: 4, marginTop: 'var(--k2)' }}>
                {e.sai.map((c) => (
                  <div key={c.qid} style={{ ...NHAN_NHO, color: 'var(--muc)' }}>
                    <b style={SO}>
                      Câu {c.soCau} Phần {c.phan}
                    </b>{' '}
                    · đã làm đúng: {c.nhan || 'không rõ nơi'}
                    {typeof c.soLanDung === 'number' && c.soLanDung > 0 && (
                      <span style={{ ...SO, color: 'var(--nhat)' }}>
                        {' '}
                        (trước ca: đúng {c.soLanDung} lần · sai {c.soLanSai ?? 0} lần)
                      </span>
                    )}
                  </div>
                ))}
              </div>
            </li>
          ))}
        </ol>
      )}
    </div>
  )
}
