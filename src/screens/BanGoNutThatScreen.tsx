// BÀN GỠ NÚT THẮT (Vòng học khép kín v2, 02/10 — thầy: "tôi chỉ phải chữa bước cuối cùng gỡ nút thắt những câu học sinh đã nỗ lực thật
// sự nhưng không thể làm được khi đã đọc kĩ lời giải"). Thay vai trò màn "Học sinh hỏi" cho câu đã nỗ lực: em đi hết thang tự gỡ mà vẫn
// vướng ⇒ một thẻ; màn này GOM thẻ theo (câu, bước vướng), xếp ưu tiên (máy chủ tính), thầy gỡ MỘT lần cho cả nhóm.
// Ba cách gỡ: Gỡ ngắn (gõ ~1 phút; ghi âm/ảnh để sau) · Dạy trên lớp (chọn buổi học) · Sửa lời giải/đề (ghi chỗ cần sửa — app không tự
// sửa kho). Bước trong dữ liệu đánh số TỪ 0 — màn hiện "Bước buoc+1". Khối "Kèm riêng" ở đầu: em vẫn tự làm sai ≥ 2 lần sau lời gỡ. Máy chủ: server/src/ban-go-nut-that.ts.
import { useCallback, useEffect, useRef, useState } from 'react'
import { gvDsNutThat, gvGoNutThat, type KetQuaDsNut, type KieuGo, type NhomNut } from '../lib/nut-that-api'
import { buoiDangMo } from '../lib/buoi-hoc-api'
import type { BuoiHoc } from '../lib/buoi-hoc-api'
import '../components/loi-giai/loi-giai.css'
import './gv-hoa2.css'

const THU = ['Chủ Nhật', 'Thứ Hai', 'Thứ Ba', 'Thứ Tư', 'Thứ Năm', 'Thứ Sáu', 'Thứ Bảy']
/** "2026-10-05" ⇒ "Thứ Hai 05/10/2026" (chuẩn ngày giờ — luật A1.6). */
function ngayChu(ngay: string): string {
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(ngay)
  if (!m) return ngay
  const thu = THU[new Date(`${ngay}T00:00:00Z`).getUTCDay()]
  return `${thu} ${m[3]}/${m[2]}/${m[1]}`
}

const NHAN_GO: Record<KieuGo, string> = { ngan: 'Gỡ ngắn', lop: 'Dạy trên lớp', sua: 'Sửa lời giải/đề' }

interface DangGo { khoa: string; kieu: KieuGo; noiDung: string; buoiHoc: string }

export default function BanGoNutThatScreen() {
  const [kq, setKq] = useState<KetQuaDsNut | null>(null)
  const [dangTai, setDangTai] = useState(false)
  const [bao, setBao] = useState('')
  const [chon, setChon] = useState<string | null>(null)
  const [moDe, setMoDe] = useState<Set<string>>(new Set())
  const [go, setGo] = useState<DangGo | null>(null)
  const banNhap = useRef<Record<string, DangGo>>({})
  useEffect(() => { if (go) banNhap.current[`${go.khoa}:${go.kieu}`] = go }, [go])
  const [dangGhi, setDangGhi] = useState(false)
  const [buoi, setBuoi] = useState<BuoiHoc[] | null>(null)

  const tai = useCallback(async () => {
    setDangTai(true)
    const r = await gvDsNutThat()
    setDangTai(false)
    setKq(r)
  }, [])
  useEffect(() => { void tai() }, [tai])

  const moGo = (n: NhomNut, kieu: KieuGo) => {
    setBao('')
    setGo(banNhap.current[`${n.khoa}:${kieu}`] ?? { khoa: n.khoa, kieu, noiDung: '', buoiHoc: '' })
    if (kieu === 'lop' && buoi === null) {
      void buoiDangMo().then((r) => setBuoi(r.ok ? r.du : []))
    }
  }

  const gui = async (n: NhomNut) => {
    if (!go) return
    setDangGhi(true)
    const r = await gvGoNutThat({ bam: n.bam, buoc: n.buoc, kieu: go.kieu, noiDung: go.noiDung.trim(), ...(go.kieu === 'lop' && go.buoiHoc ? { buoiHoc: go.buoiHoc } : {}) })
    setDangGhi(false)
    if (!r.ok) { setBao(r.error ?? 'Máy chủ chưa nhận lời gỡ.'); return }
    delete banNhap.current[`${go.khoa}:${go.kieu}`]
    setGo(null)
    const ten = `${n.so || 'câu này'}, bước ${n.buoc + 1}`
    if (go.kieu === 'ngan') setBao(`Đã gửi lời gỡ ${ten} cho ${r.soThe ?? 0} em.`)
    else if (go.kieu === 'sua') setBao(`Đã lưu ghi chú sửa ${ten} (${r.soThe ?? 0} thẻ đã chuyển sang “đã gỡ”). App chưa tự sửa kho — thầy sửa kho theo ghi chú này.`)
    else {
      const ds = (r.emCanGoi ?? []).map((e) => e.hoTen).join(', ')
      setBao(`Đã ghi dạy trên lớp ${ten}${r.tenBuoi ? ` ở ${r.tenBuoi}` : ''} cho ${r.soThe ?? 0} em.${ds ? ` Em cần gọi lên bảng: ${ds}.` : ''}`)
    }
    await tai()
  }

  const nhom = kq?.nhom ?? []
  const t = kq?.tong

  return (
    <div className="gv2-trang gv-go-day-du">
      <header className="gv2-dau">
        <div className="gv2-dau-chu">
          <h1 className="gv2-tieu-de">Bàn gỡ nút thắt</h1>
          <p className="gv2-phu-de">Các em vướng cùng một bước được gom thành một thẻ.</p>
        </div>
        <button type="button" className="gv2-nut-vien" onClick={() => void tai()} disabled={dangTai}>{dangTai ? 'Đang tải…' : 'Tải lại'}</button>
      </header>

      {bao && <p className="gv2-nhat" role="status">{bao}</p>}
      {dangTai && !kq && <p className="gv2-nhat" role="status">Đang tải thẻ nút thắt…</p>}
      {kq && !kq.ok && (
        <div className="gv2-loi" role="alert">
          {kq.error ?? 'Chưa tải được thẻ nút thắt.'}
          <button type="button" className="gv2-nut-chu" onClick={() => void tai()}>Thử lại</button>
        </div>
      )}

      {kq?.ok && (kq.kemRieng?.length ?? 0) > 0 && (
        <section className="gv2-the" aria-labelledby="gnt-kem-rieng">
          <h2 id="gnt-kem-rieng" className="gv2-the-tieu-de">Kèm riêng trên lớp · {kq.kemRieng!.length} em</h2>
          <p className="gv2-phu">Em vẫn tự làm sai từ 2 lần trở lên sau lời thầy gỡ.</p>
          <ul className="lg-co">
            {kq.kemRieng!.map((e, i) => (
              <li key={`${e.sbd}-${e.qid}-${e.buoc}-${i}`}>
                <b>{e.hoTen}</b> — {e.so || 'Câu đã gỡ'}, bước {e.buoc + 1}{e.chuBuoc ? `: ${e.chuBuoc}` : ''}
              </li>
            ))}
          </ul>
        </section>
      )}

      {kq?.ok && t && (
        <div className="gv2-kpi">
          <div className="gv2-the gv2-the-so"><span className="gv2-nhan">Thẻ đang chờ</span><span className="gv2-so-dong"><span className="gv2-so-kpi gv2-so">{t.soThe}</span><span className="gv2-don-vi">thẻ</span></span></div>
          <div className="gv2-the gv2-the-so"><span className="gv2-nhan">Cần gỡ</span><span className="gv2-so-dong"><span className="gv2-so-kpi gv2-so">{t.soNhom}</span><span className="gv2-don-vi">bước vướng (câu × bước)</span></span></div>
        </div>
      )}

      {kq?.ok && t?.quaTai && (
        <p className="gv2-phu" data-tone="do">Ngày đông nhất có {t.theNgayDongNhat} thẻ (quá 15 thẻ/ngày). Bước nào từ 4 em trở lên cùng vướng được gắn nhãn “Nhiều em vướng” — thầy nên sửa lời giải bước đó một lần.</p>
      )}

      {kq?.ok && (kq.cungNen?.length ?? 0) > 0 && (
        <section className="gv2-the" aria-labelledby="gnt-cung-nen">
          <h2 id="gnt-cung-nen" className="gv2-the-tieu-de">Cùng kiến thức nền</h2>
          <ul className="lg-co">
            {kq.cungNen!.map((x) => <li key={x.nen}>{x.soEm} em vướng <b>{x.nen}</b> ở {x.soCau} câu</li>)}
          </ul>
        </section>
      )}

      {kq?.ok && nhom.length === 0 && (
        <p className="gv2-nhat">Chưa có thẻ nào đang chờ. Em chỉ gửi thẻ khi đã đọc kĩ lời giải và làm lại kín mà vẫn vướng — câu khác các em tự gỡ được.</p>
      )}

      {nhom.length > 0 && (
        <div className="gv-go-workspace"><nav className="gv-go-nhom" aria-label="Chọn nhóm cần gỡ">{nhom.map(n => <button type="button" key={n.khoa} aria-pressed={(chon ?? nhom[0]?.khoa) === n.khoa} onClick={() => setChon(n.khoa)}><b>{n.so || 'Câu trong kho'}</b><span>Bước {n.buoc + 1} · {n.soEm} em</span></button>)}</nav><ul className="lg-ds gv-scroll-box" aria-label="Thẻ nút thắt theo thứ tự ưu tiên" tabIndex={0}>
          {nhom.map((n) => {
            const deMo = moDe.has(n.khoa)
            const dangGo = go?.khoa === n.khoa ? go : null
            return (
              <li key={n.khoa} className="gv2-the lg-dong" data-testid="the-nut-that" hidden={n.khoa !== (chon ?? nhom[0]?.khoa)}>
                <div className="lg-dong-dau">
                  <span className="gv2-the-tieu-de">{n.so || 'Câu trong kho'}</span>
                  <span className="gv2-chip" data-tone="vang">Vướng bước {n.buoc + 1}</span>
                  <span className="gv2-chip" data-tone="xam">{n.soEm} em</span>
                  {n.nhanNen && <span className="gv2-chip" data-tone="la">Kiến thức nền: {n.nhanNen}</span>}
                  {n.nhieuEmVuong && <span className="gv2-chip" data-tone="do">Nhiều em vướng — nên sửa lời giải</span>}
                  {n.hanGanNhat && <span className="gv2-phu">Hạn nộp chiến dịch: {ngayChu(n.hanGanNhat)}</span>}
                </div>

                {n.de && (
                  <div>
                    <div
                      className="lg-chu-de"
                      style={deMo ? undefined : { display: '-webkit-box', WebkitLineClamp: 3, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}
                      dangerouslySetInnerHTML={{ __html: n.de }}
                    />
                    <button type="button" className="gv2-nut-chu" aria-expanded={deMo} onClick={() => setMoDe((s) => { const m = new Set(s); if (m.has(n.khoa)) m.delete(n.khoa); else m.add(n.khoa); return m })}>
                      {deMo ? 'Thu gọn đề' : 'Xem đủ đề'}
                    </button>
                  </div>
                )}

                <div style={{ padding: '8px 12px', borderRadius: 12, background: 'var(--m3-tertiary-container)', color: 'var(--m3-on-tertiary-container)' }}>
                  <strong>Bước {n.buoc + 1} các em vướng:</strong>{' '}
                  {n.chuBuoc ? <span dangerouslySetInnerHTML={{ __html: n.chuBuoc }} /> : <span>chưa có chữ bước này trong lời giải.</span>}
                </div>
                {n.cauKiemHoi && <p className="gv2-phu">Câu kiểm của bước: {n.cauKiemHoi}</p>}

                <ul className="lg-co" aria-label="Các em vướng bước này">
                  {n.em.map((e) => (
                    <li key={e.sbd}>
                      <b>{e.hoTen}</b>
                      {' · '}Đáp án đã chọn: {e.dapAnChon || 'chưa ghi'}
                      {' · '}Số lần làm sai: <span className="gv2-so">{e.soLanThu}</span>
                      {e.kiem.length > 0 && (
                        <>
                          {' · '}Trả lời câu kiểm: {e.kiem.map((k) => `${k.traLoi || '(trống)'} (${k.dung ? 'đúng' : 'sai'})`).join(', ')}
                        </>
                      )}
                      {e.viet && <div className="gv2-phu">Em viết: “{e.viet}”</div>}
                    </li>
                  ))}
                </ul>

                {!dangGo && (
                  <div className="lg-hang-nut">
                    {(['ngan', 'lop', 'sua'] as KieuGo[]).map((k) => (
                      <button key={k} type="button" className="gv2-nut-vien" onClick={() => moGo(n, k)}>{NHAN_GO[k]}</button>
                    ))}
                  </div>
                )}

                {dangGo && (
                  <form className="lg-tra-lai" onSubmit={(e) => { e.preventDefault(); void gui(n) }} onKeyDown={(e) => { if (e.key === 'Escape') setGo(null) }}>
                    {dangGo.kieu === 'lop' && (
                      <>
                        <label className="gv2-nhan" htmlFor={`gnt-buoi-${n.khoa}`}>Buổi học sẽ dạy</label>
                        {buoi === null ? (
                          <p className="gv2-phu">Đang tải buổi học đang mở…</p>
                        ) : buoi.length === 0 ? (
                          <p className="gv2-phu">Chưa có buổi học đang mở (mở ở Chữa trên lớp › Điểm danh). Thầy ghi buổi sẽ dạy vào ô dưới.</p>
                        ) : (
                          <select id={`gnt-buoi-${n.khoa}`} aria-label="Buổi học sẽ dạy" className="lg-o" value={dangGo.buoiHoc} onChange={(e) => setGo({ ...dangGo, buoiHoc: e.target.value })}>
                            <option value="">Chọn buổi học</option>
                            {buoi.map((b) => <option key={b.id} value={b.id}>{b.ten}</option>)}
                          </select>
                        )}
                      </>
                    )}
                    <label className="gv2-nhan" htmlFor={`gnt-nd-${n.khoa}`}>
                      {dangGo.kieu === 'ngan' ? `Lời gỡ ngắn gửi ${n.soEm} em (đọc khoảng 1 phút)` : dangGo.kieu === 'sua' ? 'Chỗ cần sửa ở lời giải hoặc đề' : 'Ghi chú (tuỳ chọn)'}
                    </label>
                    <textarea id={`gnt-nd-${n.khoa}`} aria-label="Nội dung gỡ nút thắt" className="lg-o" rows={dangGo.kieu === 'lop' ? 2 : 4} maxLength={4000} value={dangGo.noiDung} onChange={(e) => setGo({ ...dangGo, noiDung: e.target.value })} autoFocus />
                    <div className="lg-hang-nut">
                      <button type="submit" className="gv2-nut-chinh" disabled={dangGhi || (dangGo.kieu === 'lop' ? !dangGo.buoiHoc && !dangGo.noiDung.trim() : !dangGo.noiDung.trim())}>
                        {dangGhi ? 'Đang gửi…' : dangGo.kieu === 'ngan' ? `Gửi lời gỡ cho ${n.soEm} em` : dangGo.kieu === 'lop' ? 'Ghi dạy trên lớp' : 'Lưu ghi chú sửa'}
                      </button>
                      <button type="button" className="gv2-nut-chu" onClick={() => setGo(null)}>Thôi</button>
                    </div>
                  </form>
                )}
              </li>
            )
          })}
        </ul></div>
      )}
    </div>
  )
}
