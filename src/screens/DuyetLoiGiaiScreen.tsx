// DUYỆT LỜI GIẢI THEO ĐỀ (phương án A, thầy chốt 29/09: "cách 2" — duyệt theo đề lúc giao). Từ 29/09 máy tự duyệt câu SẠCH lúc nộp
// ("máy duyệt luôn") ⇒ màn này để xem câu có cờ đáp án, xem lại / trả lại câu chưa ổn kèm ghi chú cho máy soạn làm lại.
// Chỉ câu trắc nghiệm, Đúng/Sai, trả lời ngắn (tự luận không soạn). Máy chủ: server/src/loi-giai.ts.
import { useCallback, useEffect, useMemo, useState } from 'react'
import { gvChoDuyet, gvDuyetLoiGiai, gvSoanGap, gvXemLoiGiai, type CauChoDuyet, type CauChoKhung, type HoSoLoiGiai, type KetQuaChoDuyet, type TrangThaiLoiGiai } from '../lib/loi-giai-api'
import KhungLoiGiai from '../components/loi-giai/KhungLoiGiai'
import '../components/loi-giai/loi-giai.css'
import './gv-hoa2.css'

const TEN_DANG: Record<string, string> = { tn: 'Trắc nghiệm', ds: 'Đúng/Sai', tln: 'Trả lời ngắn' }
const TRANG_THAI: Record<TrangThaiLoiGiai, { chu: string; tone: 'la' | 'do' | 'vang' | 'xam' }> = {
  da_duyet: { chu: 'Đã duyệt', tone: 'la' },
  cho_duyet: { chu: 'Chờ duyệt', tone: 'vang' },
  tra_lai: { chu: 'Đã trả lại · đang soạn lại', tone: 'xam' },
  dang_soan: { chu: 'Máy đang soạn', tone: 'xam' },
  truot: { chu: 'Máy soạn chưa qua bộ kiểm', tone: 'do' },
  chua_co_bo: { chu: 'Chương chưa có bộ chìa khoá', tone: 'xam' },
}
const TEN_CO: Record<string, string> = { dapAn: 'Đáp án kho cần sửa', hienThi: 'Lỗi hiển thị trong kho', loiDe: 'Đề in sai' }
type Loc = 'tat_ca' | 'co_co' | 'cho_duyet' | 'chua_xong'
const LOC: { id: Loc; chu: string }[] = [
  { id: 'tat_ca', chu: 'Tất cả' },
  { id: 'co_co', chu: 'Có cờ đáp án' },
  { id: 'cho_duyet', chu: 'Chờ duyệt' },
  { id: 'chua_xong', chu: 'Chưa có hồ sơ' },
]

/** "12-KT-C1-D4-II-4" ⇒ "Câu 4 · Phần II". */
function tenCau(qid: string): string {
  const m = /-(III|II|I)-(\d+)$/.exec(qid)
  return m ? `Câu ${m[2]} · Phần ${m[1]}` : qid
}

export default function DuyetLoiGiaiScreen() {
  const [maDe, setMaDe] = useState('')
  const [dangMo, setDangMo] = useState('')
  const [kq, setKq] = useState<KetQuaChoDuyet | null>(null)
  const [dangTai, setDangTai] = useState(false)
  const [bao, setBao] = useState('')
  const [loc, setLoc] = useState<Loc>('tat_ca')
  const [xem, setXem] = useState<{ hoSo: HoSoLoiGiai; cau: CauChoKhung } | null>(null)
  const [traLai, setTraLai] = useState<{ bam: string; qid: string; ghiChu: string } | null>(null)
  const [dangGhi, setDangGhi] = useState(false)

  const tai = useCallback(async (ma: string) => {
    if (!ma) return
    setDangTai(true)
    setBao('')
    const r = await gvChoDuyet(ma)
    setDangTai(false)
    setKq(r)
    setDangMo(ma)
  }, [])

  useEffect(() => {
    // Mở từ nơi khác với đề sẵn (…/#duyet-loi-giai=<mã đề>) — đọc một lần.
    const m = /duyet-loi-giai=([^&]+)/.exec(location.hash)
    if (m) { const ma = decodeURIComponent(m[1]); setMaDe(ma); void tai(ma) }
  }, [tai])

  const cau = useMemo(() => kq?.cau ?? [], [kq])
  const hien = useMemo(() => cau.filter((c) =>
    loc === 'tat_ca' ? true : loc === 'co_co' ? c.co.some((x) => x.loai === 'dapAn') : loc === 'cho_duyet' ? c.trangThai === 'cho_duyet' : !['da_duyet', 'cho_duyet'].includes(c.trangThai)), [cau, loc])
  const t = kq?.tong

  const moXem = async (c: CauChoDuyet) => {
    setBao('')
    const r = await gvXemLoiGiai(c.qid)
    if (r.ok && r.hoSo && r.cau) setXem({ hoSo: r.hoSo, cau: r.cau })
    else setBao(r.error ?? 'Chưa mở được hồ sơ.')
  }
  const lam = async (viec: () => Promise<{ ok: boolean; error?: string; soCau?: number }>, xong: (n: number) => string) => {
    setDangGhi(true)
    const r = await viec()
    setDangGhi(false)
    setBao(r.ok ? xong(r.soCau ?? 0) : r.error ?? 'Máy chủ chưa nhận lệnh.')
    await tai(dangMo)
  }

  return (
    <div className="gv2-trang">
      <header className="gv2-dau">
        <div className="gv2-dau-chu">
          <h1 className="gv2-tieu-de">Duyệt lời giải</h1>
          <p className="gv2-phu-de">Duyệt theo đề trước khi giao. Chỗ tranh luận về đáp án đã được máy tự chốt; câu sạch duyệt một lần cả lô. Học sinh chỉ thấy lời giải của câu đã duyệt, sau khi ca công bố kết quả.</p>
        </div>
      </header>

      <form className="gv2-the lg-tim" onSubmit={(e) => { e.preventDefault(); void tai(maDe.trim()) }}>
        <label className="gv2-nhan" htmlFor="lg-ma-de">Mã đề trong kho</label>
        <div className="lg-tim-hang">
          <input id="lg-ma-de" className="lg-o" value={maDe} onChange={(e) => setMaDe(e.target.value)} placeholder="Ví dụ 12-KT-C1-D4" autoComplete="off" spellCheck={false} />
          <button type="submit" className="gv2-nut-vien" disabled={!maDe.trim() || dangTai}>{dangTai ? 'Đang mở…' : 'Mở đề'}</button>
        </div>
      </form>

      {bao && <p className="gv2-nhat" role="status">{bao}</p>}
      {kq && !kq.ok && <div className="gv2-loi" role="alert">{kq.error ?? 'Chưa mở được đề.'}<button type="button" className="gv2-nut-chu" onClick={() => void tai(maDe.trim())}>Thử lại</button></div>}

      {kq?.ok && t && (
        <>
          <div className="gv2-kpi">
            <div className="gv2-the gv2-the-so"><span className="gv2-nhan">Đã duyệt</span><span className="gv2-so-dong"><span className="gv2-so-kpi gv2-so">{t.daDuyet}</span><span className="gv2-don-vi">/ {t.cau} câu</span></span></div>
            <div className="gv2-the gv2-the-so"><span className="gv2-nhan">Chờ duyệt</span><span className="gv2-so-dong"><span className="gv2-so-kpi gv2-so">{t.choDuyet}</span><span className="gv2-don-vi">câu · {t.sach} câu sạch</span></span></div>
            <div className="gv2-the gv2-the-so"><span className="gv2-nhan">Máy đang soạn</span><span className="gv2-so-dong"><span className="gv2-so-kpi gv2-so">{t.dangSoan + t.traLai}</span><span className="gv2-don-vi">câu</span></span></div>
            <div className="gv2-the gv2-the-so"><span className="gv2-nhan">Chờ sửa kho</span><span className="gv2-so-dong"><span className="gv2-so-kpi gv2-so">{t.choDuyet - t.sach + t.truot}</span><span className="gv2-don-vi">câu đáp án kho cần sửa hoặc máy soạn trượt</span></span></div>
          </div>

          <div className="lg-hang-nut">
            <button type="button" className="gv2-nut-chinh" disabled={dangGhi || t.sach === 0}
              onClick={() => void lam(() => gvDuyetLoiGiai({ quyet: 'duyet', maDe: dangMo, caLoSach: true }), (n) => `Đã duyệt ${n} câu sạch của đề ${dangMo}.`)}>
              Duyệt {t.sach} câu sạch
            </button>
            {t.dangSoan + t.traLai > 0 && (
              <button type="button" className="gv2-nut-vien" disabled={dangGhi}
                onClick={() => void lam(() => gvSoanGap(dangMo), (n) => `Đã đưa ${n} câu của đề lên đầu hàng soạn.`)}>
                Soạn gấp đề này
              </button>
            )}
            {t.chuaCoBo > 0 && <span className="gv2-phu">{t.chuaCoBo} câu thuộc chương chưa có bộ chìa khoá — máy chưa soạn.</span>}
          </div>

          <div className="lg-loc" role="group" aria-label="Lọc câu">
            {LOC.map((l) => (
              <button key={l.id} type="button" className="lg-loc-nut" aria-pressed={loc === l.id} onClick={() => setLoc(l.id)}>{l.chu}</button>
            ))}
          </div>

          {hien.length === 0 ? (
            <p className="gv2-nhat">Không có câu nào ở mục lọc này.</p>
          ) : (
            <ul className="lg-ds">
              {hien.map((c) => {
                const tt = TRANG_THAI[c.trangThai]
                const coHoSo = ['cho_duyet', 'da_duyet', 'tra_lai'].includes(c.trangThai)
                return (
                  <li key={c.qid} className="gv2-the lg-dong">
                    <div className="lg-dong-dau">
                      <span className="gv2-the-tieu-de">{tenCau(c.qid)}</span>
                      <span className="gv2-phu">{TEN_DANG[c.dang] ?? c.dang}</span>
                      <span className="gv2-chip" data-tone={tt.tone}>{c.mayDuyet ? 'Máy đã duyệt' : tt.chu}</span>
                    </div>
                    {c.co.length > 0 && (
                      <ul className="lg-co">
                        {c.co.map((x, i) => (
                          <li key={i}>
                            <b>{x.loai === 'dapAn' && !x.chot ? 'Chờ máy chốt' : TEN_CO[x.loai] ?? x.loai}:</b> {x.ghi}
                            {x.chot && <> <b>Máy đã chốt:</b> {x.chot}</>}
                            {x.sua && <> <b>Sửa kho:</b> “{x.sua.truoc}” → “{x.sua.sau}”</>}
                          </li>
                        ))}
                      </ul>
                    )}
                    {c.trangThai === 'truot' && c.loiMay && <p className="gv2-phu" data-tone="do">Bộ kiểm báo: {c.loiMay}</p>}
                    {c.ghiChu && <p className="gv2-phu">Ghi chú lần trả lại: {c.ghiChu}</p>}
                    {coHoSo && (
                      <div className="lg-hang-nut">
                        <button type="button" className="gv2-nut-vien" onClick={() => void moXem(c)}>Xem lời giải</button>
                        {c.trangThai === 'cho_duyet' && (
                          <button type="button" className="gv2-nut-vien" disabled={dangGhi}
                            onClick={() => void lam(() => gvDuyetLoiGiai({ quyet: 'duyet', bam: [c.bam] }), () => `Đã duyệt ${tenCau(c.qid)}.`)}>
                            Duyệt câu này
                          </button>
                        )}
                        {c.trangThai !== 'tra_lai' && (
                          <button type="button" className="gv2-nut-chu" onClick={() => setTraLai({ bam: c.bam, qid: c.qid, ghiChu: '' })}>Trả lại cho máy soạn</button>
                        )}
                      </div>
                    )}
                    {traLai?.bam === c.bam && (
                      <form className="lg-tra-lai" onSubmit={(e) => {
                        e.preventDefault()
                        const g = traLai.ghiChu.trim()
                        setTraLai(null)
                        void lam(() => gvDuyetLoiGiai({ quyet: 'tra_lai', bam: [c.bam], ghiChu: g }), () => `Đã trả lại ${tenCau(c.qid)} — học sinh không thấy hồ sơ này; máy soạn làm lại theo ghi chú.`)
                      }}>
                        <label className="gv2-nhan" htmlFor={`lg-gc-${c.bam}`}>Chỗ cần sửa (máy soạn đọc ghi chú này)</label>
                        <textarea id={`lg-gc-${c.bam}`} className="lg-o" rows={3} value={traLai.ghiChu} onChange={(e) => setTraLai({ ...traLai, ghiChu: e.target.value })} />
                        <div className="lg-hang-nut">
                          <button type="submit" className="gv2-nut-vien" disabled={!traLai.ghiChu.trim()}>Trả lại câu này</button>
                          <button type="button" className="gv2-nut-chu" onClick={() => setTraLai(null)}>Thôi</button>
                        </div>
                      </form>
                    )}
                  </li>
                )
              })}
            </ul>
          )}
        </>
      )}

      {!kq && !dangTai && <p className="gv2-nhat">Nhập mã đề sắp giao rồi bấm “Mở đề”. Đề mới nạp tự vào hàng soạn; máy soạn trên máy thầy làm khối 12 trước.</p>}
      {xem && <KhungLoiGiai hoSo={xem.hoSo} cau={xem.cau} thay onDong={() => setXem(null)} />}
    </div>
  )
}
