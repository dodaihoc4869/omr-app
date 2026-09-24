// THẺ "ĐƯỜNG VỀ ĐÍCH" ở đầu Bảng nhiệm vụ học sinh (Dồn về đích; thầy chốt mẫu 21/09: docs/ban-ve-don-ve-dich-2109/, 4 trạng thái + nộp trễ). CHỈ HIỂN THỊ số máy chủ trả (`veDich`, `no`): máy em không tính lại luật.
//  • có nợ: đường chặng (xong · nợ có nhãn thứ · hôm nay · sắp tới · cờ hạn) + ĐỒNG HỒ ĐẾM NGƯỢC theo giờ LUÔN hiện (chạy ở máy từ `hanNop`) + "Tối nay: N chặng · M câu · khoảng P phút · bắt đầu muộn nhất HH:MM" + MỘT nút + cú hích;
//  • đúng nhịp: MỘT dòng xanh "Em đang đúng nhịp · hạn nộp …" (chạm mở cả đường); • qua hạn: "Bài đã qua Hạn nộp · em vẫn cần làm nốt N chặng · sẽ ghi nộp trễ" (giọng nâng đỡ);
//  • khối "Còn lại từ các ngày trước" theo ngày (chạm là vào làm); • vừa trả xong một ngày: gạch tên ngày (tắt hoạt ảnh khi giảm chuyển động).
// Màu cảnh báo mạnh CHỈ trong 6 giờ cuối; không chữ "lười". Thiếu `veDich` ⇒ không dựng gì (Pages đi trước Worker được). Không game.
import { useState } from 'react'
import { Check, ChevronDown, ChevronRight, Clock, Flag, Moon, Sparkles } from 'lucide-react'
import './m3-theme.css'
import './ve-dich.css'
import { chuHanNop, conLaiToiHan, laSauGioCuoi, nhanCoHan, nhomNoTheoNgay, tenMonNo, thuCuaNgay, thuNgayNgan, type BaiVeDich, type VeDichView } from '../../lib/ve-dich-hien-thi'
import { gioVn } from '../../lib/ph-moi/dinh-dang'

export interface TheVeDichProps {
  v: VeDichView
  now: number
  /** Chạm nút / một món nợ ⇒ vào làm việc CHƯA XONG đầu tiên của Bảng nhiệm vụ. */
  onLam: () => void
  /** Số việc bắt buộc còn lại của hôm nay (từ Bảng nhiệm vụ) — cho cú hích "Còn N việc nữa là hôm nay ĐẠT". 0/vắng ⇒ không cú hích. */
  soViecConLai?: number
  /** Ngày nợ vừa được trả xong (so hai lần nạp) ⇒ dòng mừng + gạch tên ngày. */
  ngayVuaTra?: string | null
}

const tenCang = (b: BaiVeDich) => b.chang.length

function DuongChang({ b, now, vua }: { b: BaiVeDich; now: number; vua: boolean }) {
  const qua = b.quaHan
  const n = b.chang.length
  if (n === 0) return null
  const soXong = b.chang.filter((c) => c.trangThai === 'xong').length
  const soNo = b.chang.filter((c) => c.trangThai === 'no').length
  const xongPct = (Math.max(soXong - 1, 0) / n) * 100
  const noPct = soNo > 0 ? ((soNo + 1) / n) * 100 : 0
  return (
    <ol className="vd-duong" aria-label={`Đường ${n} chặng tới Hạn nộp`}>
      <li className="vd-duong__day" aria-hidden="true">
        <i className="vd-day--xong" style={{ left: 0, width: `${xongPct.toFixed(1)}%` }} />
        {soNo > 0 && <i className="vd-day--no" style={{ left: `${xongPct.toFixed(1)}%`, width: `${(noPct - (soXong > 1 ? 0 : 0)).toFixed(1)}%` }} />}
      </li>
      {b.chang.map((c, i) => {
        // QUÁ HẠN: hạn đã qua thì không còn lịch theo thứ — mọi chặng chưa xong đều là "còn nợ".
        const cls = c.trangThai === 'xong' ? 'xong' : qua || c.trangThai === 'no' ? 'no' : c.trangThai === 'hom_nay' ? 'nay' : 'toi'
        const tt = c.trangThai === 'xong' ? (vua && i === soXong - 1 ? 'Vừa xong' : 'Đã xong') : qua ? 'Còn nợ' : c.trangThai === 'hom_nay' ? 'Hôm nay' : thuCuaNgay(c.ngay)
        const ten = c.trangThai === 'xong' ? 'đã xong' : qua ? 'còn nợ' : c.trangThai === 'no' ? `còn lại từ ${thuCuaNgay(c.ngay)}` : c.trangThai === 'hom_nay' ? 'của hôm nay' : `sắp tới, ${thuCuaNgay(c.ngay)}`
        return (
          <li key={c.chiSo} className={`vd-moc vd-moc--${cls}${vua && c.trangThai === 'xong' && i === soXong - 1 ? ' vd-moc--vua' : ''}`} aria-label={`Chặng ${c.chiSo + 1}: ${ten}`}>
            <span className="vd-moc__o" aria-hidden="true">
              <span className="vd-moc__tron">{c.trangThai === 'xong' ? <Check className="vd-i" aria-hidden="true" /> : c.trangThai === 'no' ? <Clock className="vd-i" aria-hidden="true" /> : c.chiSo + 1}</span>
            </span>
            <span className="vd-moc__ten vd-so" aria-hidden="true">
              Chặng {c.chiSo + 1}
            </span>
            <span className="vd-moc__tt" aria-hidden="true">
              {tt}
            </span>
          </li>
        )
      })}
      <li className={`vd-moc vd-moc--dich${qua ? ' vd-moc--het' : ''}`} aria-label={qua ? 'Đích: đã qua hạn nộp' : `Đích: Hạn nộp ${chuHanNop(b.hanNop).split(' · ')[0]} ${nhanCoHan(b.hanNop, now)}`}>
        <span className="vd-moc__o" aria-hidden="true">
          <span className="vd-moc__tron">
            <Flag className="vd-i" aria-hidden="true" />
          </span>
        </span>
        <span className="vd-moc__ten" aria-hidden="true">
          {qua ? 'Đã qua hạn' : 'Hạn nộp'}
        </span>
        <span className="vd-moc__tt vd-so" aria-hidden="true">
          {qua ? '' : nhanCoHan(b.hanNop, now)}
        </span>
      </li>
    </ol>
  )
}

function DongHo({ b, now, gap }: { b: BaiVeDich; now: number; gap: boolean }) {
  const cl = conLaiToiHan(b.hanNop, now)
  if (!cl) return null
  const han = chuHanNop(b.hanNop)
  return (
    <div className={`vd-dh${gap ? ' vd-dh--gap' : ''}`} role="timer" aria-label={`Còn ${cl.gio} giờ ${cl.phut} phút tới Hạn nộp ${han}`} data-vung="dong-ho">
      <div aria-hidden="true">
        <span className="vd-dh__con">Còn</span>
        <p className="vd-dh__so">
          <b>{cl.gio}</b>giờ <b>{cl.phut}</b>phút
        </p>
      </div>
      <p className="vd-dh__han vd-so" aria-hidden="true">
        <span>
          <Flag className="vd-i" aria-hidden="true" />
          Hạn nộp
        </span>
        {han.split(' · ')[0]} · {han.split(' · ')[1]?.split(' ')[0]}
        <br />
        {han.split(' · ')[1]?.split(' ').slice(1).join(' ')}
      </p>
    </div>
  )
}

/** Đồng hồ NHẸ (không còn nợ): một dòng — "Hạn nộp 12:00 · Thứ Sáu 25/09/2026 · còn 64 giờ 31 phút". */
function DongHoNhe({ b, now }: { b: BaiVeDich; now: number }) {
  const cl = conLaiToiHan(b.hanNop, now)
  if (!cl) return null
  return (
    <p className="vd-dh vd-dh--nhe vd-so" role="timer" data-vung="dong-ho-nhe">
      <Flag className="vd-i" aria-hidden="true" />
      <span>
        Hạn nộp <b>{chuHanNop(b.hanNop)}</b> · còn{' '}
        <b>
          {cl.gio} giờ {cl.phut} phút
        </b>
      </span>
    </p>
  )
}

function TheMotBai({ b, now, onLam, soViecConLai, ngayVuaTra }: { b: BaiVeDich; now: number; onLam: () => void; soViecConLai: number; ngayVuaTra: string | null }) {
  const soNo = b.chang.filter((c) => c.trangThai === 'no').length
  const soChuaXong = b.chang.filter((c) => c.trangThai !== 'xong').length
  const coNo = soNo > 0
  const [mo, setMo] = useState(false)
  const gap = laSauGioCuoi(b.hanNop, now)
  const changKe = b.chang.find((c) => c.trangThai === 'no') ?? b.chang.find((c) => c.trangThai === 'hom_nay')
  // "Xong N chặng tối nay là em về đúng nhịp" CHỈ khi còn chặng NỢ (nợ ôn/gói không nói "chặng").
  const hichVeNhip = !!b.toiNay && soNo > 0

  // ── QUA HẠN (Điều 4 B): vẫn làm nốt, ghi nộp trễ ─────────────────────────────────────────
  if (b.quaHan) {
    return (
      <section className="vd-the" aria-labelledby={`vd-t-${b.maBtvn}`} data-vung="duong-ve-dich" data-trang-thai="qua-han">
        <div className="vd-dau">
          <p className="vd-dau__nhan">Đường về đích · Bài tập về nhà</p>
          <h2 id={`vd-t-${b.maBtvn}`}>{b.ten}</h2>
        </div>
        <div className="vd-mung vd-mung--luu-y" role="status" data-vung="nop-tre">
          <i aria-hidden="true">
            <Clock className="vd-i" />
          </i>
          <div>
            <h3>Bài đã qua Hạn nộp</h3>
            <p className="vd-so">Em vẫn cần làm nốt {soChuaXong} chặng · sẽ ghi nộp trễ.</p>
          </div>
        </div>
        <DuongChang b={b} now={now} vua={false} />
        {changKe && (
          <button type="button" className="vd-nut" onClick={onLam} data-vung="nut-lam">
            Làm chặng {changKe.chiSo + 1} ngay
            <ChevronRight className="vd-i" aria-hidden="true" />
          </button>
        )}
      </section>
    )
  }

  // ── ĐÚNG NHỊP: một dòng xanh, chạm mở cả đường (vừa trả xong nợ thì hiện thẻ đầy đủ với lời mừng) ──
  if (!coNo && !ngayVuaTra) {
    const cl = conLaiToiHan(b.hanNop, now)
    const con = cl ? (cl.gio >= 48 ? `còn ${Math.floor(cl.gio / 24)} ngày` : `còn ${cl.gio} giờ ${cl.phut} phút`) : ''
    const han = chuHanNop(b.hanNop)
    return (
      <section className="vd-nhom" data-vung="duong-ve-dich" data-trang-thai="dung-nhip">
        <button type="button" className="vd-nhip" aria-expanded={mo} onClick={() => setMo((x) => !x)}>
          <i aria-hidden="true">
            <Check className="vd-i" />
          </i>
          <span className="vd-nhip__chu">
            <b>Em đang đúng nhịp</b>
            <small className="vd-so">
              {b.ten} · hạn nộp {han.split(' · ')[0]} {han.split(' · ')[1]?.split(' ').slice(0, 2).join(' ')}
              {con ? ` · ${con}` : ''}
            </small>
          </span>
          {mo ? <ChevronDown className="vd-i" aria-hidden="true" /> : <ChevronRight className="vd-i" aria-hidden="true" />}
          {b.chang.length > 0 && (
            <span className="vd-nho" aria-hidden="true">
              {b.chang.map((c) => (
                <i key={c.chiSo} className={c.trangThai === 'xong' ? 'vd-nho--xong' : c.trangThai === 'hom_nay' ? 'vd-nho--nay' : ''} />
              ))}
              <Flag className="vd-i" />
            </span>
          )}
        </button>
        {mo && (
          <div className="vd-the" data-vung="duong-mo">
            <DuongChang b={b} now={now} vua={false} />
          </div>
        )}
      </section>
    )
  }

  // ── CÓ NỢ (hoặc vừa trả xong) ────────────────────────────────────────────────────────────
  return (
    <section className={`vd-the${gap ? ' vd-the--gap' : ''}`} aria-labelledby={`vd-t-${b.maBtvn}`} data-vung="duong-ve-dich" data-trang-thai={ngayVuaTra ? 'vua-tra' : gap ? 'no-gap' : 'no'}>
      <div className="vd-dau">
        <p className="vd-dau__nhan">Đường về đích · Bài tập về nhà</p>
        <h2 id={`vd-t-${b.maBtvn}`}>{b.ten}</h2>
      </div>
      {ngayVuaTra && (
        <div className="vd-mung" role="status" aria-live="polite" data-vung="vua-tra">
          <i aria-hidden="true">
            <Sparkles className="vd-i" />
          </i>
          <div>
            <h3>Em vừa trả xong phần của {thuCuaNgay(ngayVuaTra)}.</h3>
          </div>
        </div>
      )}
      {coNo ? <DongHo b={b} now={now} gap={gap} /> : <DongHoNhe b={b} now={now} />}
      <DuongChang b={b} now={now} vua={!!ngayVuaTra} />
      {b.toiNay && (
        <div className="vd-kh" data-vung="ke-hoach">
          <p className="vd-kh__dong vd-so">
            <Moon className="vd-i" aria-hidden="true" />
            <b>
              Tối nay: {b.toiNay.soChang} chặng · {b.toiNay.soCau} câu
            </b>
            <small>
              Khoảng {b.toiNay.phut} phút · bắt đầu muộn nhất <b>{gioVn(b.toiNay.batDauMuonNhat)}</b>
            </small>
          </p>
        </div>
      )}
      {changKe && (
        <button type="button" className="vd-nut" onClick={onLam} data-vung="nut-lam">
          Làm chặng {changKe.chiSo + 1} ngay
          <ChevronRight className="vd-i" aria-hidden="true" />
        </button>
      )}
      {(hichVeNhip || soViecConLai > 0) && (
        <ul className="vd-hich" aria-label="Em sắp đạt">
          {hichVeNhip && b.toiNay && (
            <li className="vd-so">
              <Sparkles className="vd-i" aria-hidden="true" />
              <span>
                Xong {b.toiNay.soChang} chặng tối nay là em về <b>đúng nhịp</b>
              </span>
            </li>
          )}
          {soViecConLai > 0 && (
            <li className="vd-so">
              <Sparkles className="vd-i" aria-hidden="true" />
              <span>
                Còn {soViecConLai} việc nữa là hôm nay <b>ĐẠT</b>
              </span>
            </li>
          )}
        </ul>
      )}
    </section>
  )
}

function KhoiNgayTruoc({ no, onLam, ngayVuaTra }: { no: VeDichView['no']; onLam: () => void; ngayVuaTra: string | null }) {
  const nhom = nhomNoTheoNgay(no.theoNgay)
  if (nhom.length === 0 && !ngayVuaTra) return null
  return (
    <section className="vd-khoi" aria-labelledby="vd-truoc-t" data-vung="ngay-truoc" style={{ display: 'none' }}>
      <div className="vd-muc" style={{ ['--vd-cham' as string]: 'var(--cam)' }}>
        <h2 id="vd-truoc-t">
          <i aria-hidden="true" />
          Còn lại từ các ngày trước
        </h2>
        <span className="vd-so">{nhom.length > 0 ? `${no.theoNgay.length} việc` : 'Đã trả xong'}</span>
      </div>
      {ngayVuaTra && (
        <div className="vd-ngay vd-ngay--xong" role="group" aria-label={`${thuNgayNgan(ngayVuaTra)} — đã trả xong`} data-vung="ngay-da-tra">
          <h3 className="vd-ngay__ten vd-so">
            <Check className="vd-i" aria-hidden="true" />
            <span>{thuNgayNgan(ngayVuaTra)}</span>
            <small>· đã trả xong</small>
          </h3>
        </div>
      )}
      {nhom.map((n) => (
        <div className="vd-ngay" role="group" aria-label={thuNgayNgan(n.ngay)} key={n.ngay} data-vung="ngay-no">
          <h3 className="vd-ngay__ten vd-so">
            <Clock className="vd-i" aria-hidden="true" />
            <span>{thuNgayNgan(n.ngay)}</span>
            <small>· khoảng {n.phut} phút</small>
          </h3>
          <ul style={{ display: 'grid', gap: 6 }}>
            {n.mon.map((m, i) => {
              const t = tenMonNo(m)
              return (
                <li key={i}>
                  <button type="button" className="vd-dong" onClick={onLam} aria-label={`${thuNgayNgan(n.ngay)} · ${t.tren} · ${t.duoi} — chạm để làm`}>
                    <i aria-hidden="true">
                      <Clock className="vd-i" />
                    </i>
                    <span className="vd-dong__chu vd-so">
                      <b>{t.tren}</b>
                      <small>{t.duoi}</small>
                    </span>
                    <ChevronRight className="vd-i" aria-hidden="true" />
                  </button>
                </li>
              )
            })}
          </ul>
        </div>
      ))}
    </section>
  )
}

export default function TheVeDich({ v, now, onLam, soViecConLai = 0, ngayVuaTra = null }: TheVeDichProps) {
  // Bài KHẨN NHẤT (hạn sớm nhất) là thẻ đầy đủ; các bài khác một dòng.
  const bai = [...v.bai].sort((a, b) => Date.parse(a.hanNop) - Date.parse(b.hanNop))
  const chinh = bai[0]
  const khac = bai.slice(1, 4)
  if (!chinh && v.no.theoNgay.length === 0 && !ngayVuaTra) return null
  return (
    <div className="vd" data-vung="ve-dich">
      {chinh && <TheMotBai b={chinh} now={now} onLam={onLam} soViecConLai={soViecConLai} ngayVuaTra={ngayVuaTra} />}
      {khac.length > 0 && (
        <ul className="vd-khac" aria-label="Các bài khác đang chạy" data-vung="bai-khac">
          {khac.map((b) => {
            const cl = conLaiToiHan(b.hanNop, now)
            const soNo = b.chang.filter((c) => c.trangThai === 'no').length
            return (
              <li key={b.maBtvn} className="vd-so">
                <b>{b.ten}</b>
                <small>{b.quaHan ? 'đã qua hạn nộp · sẽ ghi nộp trễ' : cl ? `còn ${cl.gio} giờ ${cl.phut} phút${soNo > 0 ? ` · còn lại ${soNo} chặng của ngày trước` : ''}` : ''}</small>
              </li>
            )
          })}
        </ul>
      )}
      <KhoiNgayTruoc no={v.no} onLam={onLam} ngayVuaTra={ngayVuaTra} />
    </div>
  )
}
export { tenCang }
