// CA "KIỂM CHỨNG CÂU ĐÃ ĐÚNG" (02/10) — hai khối màn Theo dõi ca của THẦY:
//   · BangRutThuDaDung   — Xem trước phân bổ (chạy thử lúc ca còn ở phòng chờ): ma trận 2026 theo tỷ lệ, em nào thiếu câu ở phần nào, và (thầy 06/10) bao nhiêu câu
//                          đã THAY SỐ / thay bằng câu cùng dạng / giữ nguyên văn.
//   · KhoiSaiLaiDaDung   — "Sai lại câu đã làm đúng": em SAI NHIỀU câu đã làm đúng NHẤT lên đầu, mỗi câu kèm nhãn đã đúng ở đâu, mức độ gì.
import { useState } from 'react'
import { chuNhanBaoCao, chuPhanBo, chuThieuDaDung, thongKeThay, type EmSaiLaiDaDung } from '../../lib/rut-de-da-dung'
import type { RutThuDaDung } from '../../lib/de-rieng-da-dung'

const NHAN_NHO: React.CSSProperties = { fontFamily: 'var(--sans)', fontSize: 'var(--cx-1)', color: 'var(--nhat)' }
const SO: React.CSSProperties = { fontFamily: 'var(--sans)', fontVariantNumeric: 'tabular-nums' }
const TIEU_DE: React.CSSProperties = { fontFamily: 'var(--serif)', fontSize: 'var(--cx-3)', fontWeight: 700, color: 'var(--muc)' }

export function BangRutThuDaDung({ rt, dang, loi, tenCua, tienDoThay, onChayLai }: { rt: RutThuDaDung | null; dang: boolean; loi: string; tenCua: Record<string, string>; tienDoThay?: { xong: number; tong: number } | null; onChayLai: () => void }) {
  const [moHet, setMoHet] = useState(false)
  const ten = (sbd: string) => tenCua[sbd] || `Số báo danh ${sbd}`
  const emThieu = rt ? Object.entries(rt.kq.thieu).sort((a, b) => b[1].reduce((n, t) => n + t.so, 0) - a[1].reduce((n, t) => n + t.so, 0) || a[0].localeCompare(b[0])) : []
  const dong = emThieu.flatMap(([sbd, ds]) => chuThieuDaDung(ten(sbd), ds))
  const hien = moHet ? dong : dong.slice(0, 12)
  const tong = rt ? Object.keys(rt.kq.theoEm).length : 0
  const khongCau = rt ? Object.entries(rt.kq.theoEm).filter(([, ds]) => ds.length === 0).map(([s]) => s) : []
  // Em được BÙ câu từ kho (thầy 05/10): chưa làm đúng đủ câu ⇒ câu khác trong kho ca cùng mức độ; bù nhiều trước.
  const emBu = rt ? Object.entries(rt.kq.bu ?? {}).sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0])) : []
  const [moBu, setMoBu] = useState(false)
  const hienBu = moBu ? emBu : emBu.slice(0, 12)
  return (
    <section data-khoi="rut-thu-da-dung" aria-label="Xem trước phân bổ" style={{ display: 'flex', flexDirection: 'column', gap: 'var(--k2)', padding: 'var(--k4)', borderRadius: 'var(--bo-2)', background: 'var(--the)' }}>
      <div className="flex items-center justify-between" style={{ gap: 'var(--k3)' }}>
        <div style={TIEU_DE}>Xem trước phân bổ</div>
        <button type="button" className="tap-target" onClick={onChayLai} disabled={dang} style={{ ...NHAN_NHO, textDecoration: 'underline', color: dang ? 'var(--mo)' : 'var(--nhat)' }}>
          Chạy thử lại
        </button>
      </div>
      <div style={NHAN_NHO}>Kiểm chứng câu đã đúng · Chạy thử — chưa phát cho em. Mỗi em nhận câu THAY SỐ của câu em đã tự làm đúng trong các chiến dịch (câu lý thuyết thay bằng câu cùng dạng), ghi rõ trên từng câu; thiếu thì bù câu khác trong kho ca cùng mức độ.</div>
      {dang && !rt ? (
        <div style={NHAN_NHO} role="status">
          {tienDoThay && tienDoThay.tong > 0 ? `Đang tìm câu thay số cho từng em: ${tienDoThay.xong}/${tienDoThay.tong} em…` : 'Đang chạy thử bộ câu cho từng em…'}
        </div>
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
              <b style={SO}>{khongCau.length}</b> em chưa có bộ câu vì kho ca trống — máy em sẽ nhận đề chung của ca: {khongCau.map(ten).join(' · ')}
            </div>
          )}
          {emBu.length > 0 && (
            <div data-khoi="em-bu-da-dung" style={NHAN_NHO}>
              <b style={SO}>{emBu.length}</b> em chưa làm đúng đủ câu — đã bù câu khác trong kho cùng mức độ (câu bù không có nhãn “đã làm đúng”):{' '}
              <span style={{ color: 'var(--muc)' }}>{hienBu.map(([s, n]) => `${ten(s)} (${n} câu bù)`).join(' · ')}</span>
              {emBu.length > hienBu.length && (
                <button type="button" className="tap-target" onClick={() => setMoBu(true)} style={{ ...NHAN_NHO, textDecoration: 'underline', marginLeft: 'var(--k2)' }}>
                  Xem thêm {emBu.length - hienBu.length} em
                </button>
              )}
            </div>
          )}
          {rt.thay && <KhoiThayCau rt={rt} ten={ten} />}
          {dong.length === 0 ? (
            emBu.length === 0 && <div style={NHAN_NHO}>Mọi em đủ câu đã làm đúng cho từng ô của ma trận.</div>
          ) : (
            <>
              <div style={NHAN_NHO}>
                <b style={SO}>{emThieu.length}</b> em vẫn thiếu câu sau khi bù vì kho ca không đủ câu cùng phần:
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

/**
 * Dòng THAY CÂU của bảng Xem trước phân bổ (thầy 06/10): nói thật bao nhiêu câu em đã làm đúng được thay số, thay bằng câu cùng dạng (trong đó câu lý thuyết), giữ nguyên văn —
 * và vì sao (máy chủ tắt / không hỏi được / em lỗi đọc). Không thay được câu nào KHÔNG làm hỏng ca: em nhận nguyên văn câu đã đúng, có nhãn "Em đã làm đúng".
 */
function KhoiThayCau({ rt, ten }: { rt: RutThuDaDung; ten: (sbd: string) => string }) {
  const [mo, setMo] = useState(false)
  const tk = thongKeThay(rt.kq)
  const emGiu = Object.entries(tk.theoEm).filter(([, e]) => e.giuNguyen > 0).sort((a, b) => b[1].giuNguyen - a[1].giuNguyen || a[0].localeCompare(b[0]))
  const hien = mo ? emGiu : emGiu.slice(0, 12)
  const t = rt.thay
  if (t.trangThai === 'tat') {
    return (
      <div data-khoi="thay-cau-da-dung" style={{ ...NHAN_NHO, color: 'var(--do)' }} role="status">
        Thay câu đã làm đúng đang TẮT ở máy chủ — em nhận nguyên văn câu đã làm đúng.
      </div>
    )
  }
  if (t.trangThai === 'loi') {
    return (
      <div data-khoi="thay-cau-da-dung" style={{ ...NHAN_NHO, color: 'var(--do)' }} role="alert">
        Chưa thay được câu đã làm đúng{t.loi ? ` (${t.loi})` : ''} — em sẽ nhận NGUYÊN VĂN câu đã làm đúng. Bấm Chạy thử lại.
      </div>
    )
  }
  return (
    <div data-khoi="thay-cau-da-dung" style={NHAN_NHO}>
      <div style={{ color: 'var(--muc)' }}>
        Thay câu đã làm đúng: <b style={SO}>{tk.thaySo}</b> câu thay số · <b style={SO}>{tk.cungDang}</b> câu thay bằng câu cùng dạng (trong đó <b style={SO}>{tk.lyThuyet}</b> câu lý thuyết) ·{' '}
        <b style={SO}>{tk.giuNguyen}</b> câu giữ nguyên văn vì chưa có câu thay phù hợp
        {tk.emGiuNguyen > 0 ? ` (${tk.emGiuNguyen} em)` : ''}.
      </div>
      {t.emLoi.length > 0 && (
        <div style={{ color: 'var(--do)' }}>
          <b style={SO}>{t.emLoi.length}</b> em máy chủ không tìm được câu thay (lỗi đọc) — nhận nguyên văn: {t.emLoi.map(ten).join(' · ')}
        </div>
      )}
      {t.khongDung > 0 && (
        <div>
          <b style={SO}>{t.khongDung}</b> câu thay máy chủ đưa mà máy này không có nội dung dùng được — những câu ấy giữ nguyên văn.
        </div>
      )}
      {emGiu.length > 0 && (
        <>
          <ul data-khoi="em-giu-nguyen-da-dung" style={{ margin: 0, paddingLeft: 'var(--k4)', color: 'var(--muc)' }}>
            {hien.map(([sbd, e]) => (
              <li key={sbd}>{ten(sbd)}: {e.giuNguyen} câu giữ nguyên văn</li>
            ))}
          </ul>
          {emGiu.length > hien.length && (
            <button type="button" className="tap-target" onClick={() => setMo(true)} style={{ ...NHAN_NHO, textDecoration: 'underline', alignSelf: 'flex-start' }}>
              Xem thêm {emGiu.length - hien.length} em
            </button>
          )}
        </>
      )}
    </div>
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
                Sai <b style={{ color: 'var(--do)' }}>{e.sai.length}</b>/{e.tong} câu em đã làm đúng trước đây (kể cả câu thay số / câu cùng dạng của câu đó)
              </div>
              <div className="flex flex-col" style={{ gap: 4, marginTop: 'var(--k2)' }}>
                {e.sai.map((c) => (
                  <div key={c.qid} style={{ ...NHAN_NHO, color: 'var(--muc)' }}>
                    <b style={SO}>
                      Câu {c.soCau} Phần {c.phan}
                    </b>{' '}
                    · {chuNhanBaoCao(c.nhan)}
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
