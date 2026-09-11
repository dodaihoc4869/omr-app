// ĐỒNG BỘ DANH SÁCH HỌC SINH — dán link MỘT LẦN, sau đó chỉ bấm một nút.
//
// Bản cũ mở hộp chọn file: mỗi lần thầy thêm hay bớt một em trong sổ là phải
// xuất file, tìm file, chọn file. Sổ thật của thầy nằm trên Google Sheet và sửa
// hằng tuần, nên bản sao trên máy chủ luôn chạy sau — đúng chỗ hỏng: em mới ghi
// vào sổ thì bị cổng vào thi chặn, em đã nghỉ thì vẫn vào được.
//
// Nay: thầy dán link mỗi khối một dòng, bấm Lưu link. Từ đó về sau sửa sổ xong
// chỉ bấm Đồng bộ. Link nằm trên máy chủ nên đổi máy, đổi điện thoại vẫn còn.
//
// MÁY THẦY TẢI SHEET, MÁY CHỦ CHỈ GIỮ LINK. Bản đầu để Apps Script tải cho
// gọn; đo trên máy chủ thật thì hỏng vì `UrlFetchApp` đòi thêm quyền
// `script.external_request`, mà thêm quyền là phải xin lại uỷ quyền cho cả ứng
// dụng web — làm giữa buổi dạy thì chặn hết em đang thi. Tệp "Xuất bản lên web"
// của Google CÓ gắn nhãn CORS nên trình duyệt đọc thẳng được; đẩy lên bằng
// `napDanhSachLop` vốn đã có quyền từ trước.
//
// Nút giữ nguyên hình dáng và ba trạng thái của nút Đồng bộ kho đề — thầy không
// phải học hai kiểu thao tác.
import { useEffect, useRef, useState } from 'react'
import { RefreshCw, Check, AlertCircle, Link2 } from 'lucide-react'
import { linkDanhSachLop, luuLinkDanhSachLop, napDanhSachLop, type KetQuaNapDanhSach } from '../lib/exam-api'
import { gomDanhSachTuLink } from '../lib/danh-sach-tu-link'
import { loadScriptUrl, loadTeacherSecret } from '../lib/exam-db'

type TrangThai = { kieu: 'nghi' } | { kieu: 'chay' } | { kieu: 'xong'; chu: string } | { kieu: 'loi'; chu: string }

/** Một link mỗi dòng; bỏ dòng trống và dòng trùng. */
export function tachLink(van: string): string[] {
  const ra: string[] = []
  const daCo = new Set<string>()
  for (const dong of String(van || '').split(/[\n,\s]+/)) {
    const s = dong.trim()
    if (!s || daCo.has(s)) continue
    daCo.add(s)
    ra.push(s)
  }
  return ra
}

/** Một dòng tóm tắt CÓ SỐ cho thầy đối chiếu với sổ. Không nói "đã đồng bộ" suông:
 * em thêm và em bị bỏ là hai con số thầy phải nhìn thấy. */
export function tomTatDongBo(kq: KetQuaNapDanhSach, soTrung = 0): string {
  const phan = [`${kq.soDong} em`]
  if (kq.them.length) phan.push(`+${kq.them.length} mới`)
  if (kq.bo.length) phan.push(`−${kq.bo.length} bỏ`)
  if (kq.doiTen.length) phan.push(`${kq.doiTen.length} đổi tên`)
  if (soTrung) phan.push(`${soTrung} SBD trùng`)
  // MÁY CHỦ MỚI — phải hiện ra, kể cả khi mọi thứ khác xanh. Bảng `danh_sach`
  // bên đó là CỔNG VÀO THI; nó rỗng mà thầy tưởng đã đồng bộ thì ai có mã ca
  // cũng gõ một số báo danh bất kỳ rồi vào thi.
  if (kq.mayChuMoi === 'hong') phan.push('MÁY CHỦ MỚI CHƯA NHẬN')
  else if (kq.mayChuMoi === 'ok') phan.push('máy chủ mới đã nhận')
  return phan.join(' · ')
}

export default function NutDongBoDanhSach({
  onXong,
  className = '',
}: {
  /** Gọi sau khi đồng bộ xong: số em và dòng tóm tắt để màn ngoài hiện ra. */
  onXong?: (soEm: number, tomTat: string) => void
  className?: string
}) {
  const [tt, setTt] = useState<TrangThai>({ kieu: 'nghi' })
  const [links, setLinks] = useState<string[] | null>(null)
  const [moBang, setMoBang] = useState(false)
  const [nhap, setNhap] = useState('')
  const [dangLuu, setDangLuu] = useState(false)
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null)

  useEffect(() => () => {
    if (timer.current) clearTimeout(timer.current)
  }, [])

  // Đọc link đã lưu ngay khi mở màn: nút phải biết mình sẽ đồng bộ hay sẽ hỏi
  // link, chứ không để thầy bấm rồi mới báo "chưa có link".
  useEffect(() => {
    let bo = false
    ;(async () => {
      try {
        const [url, secret] = await Promise.all([loadScriptUrl(), loadTeacherSecret()])
        if (!url.trim() || !secret.trim()) return
        const ds = await linkDanhSachLop(url.trim(), secret.trim())
        if (!bo) {
          setLinks(ds)
          setNhap(ds.join('\n'))
        }
      } catch {
        // máy chủ cũ chưa có lệnh này — coi như chưa lưu link nào
        if (!bo) setLinks([])
      }
    })()
    return () => {
      bo = true
    }
  }, [])

  const bao = (next: TrangThai) => {
    setTt(next)
    if (timer.current) clearTimeout(timer.current)
    timer.current = setTimeout(() => setTt({ kieu: 'nghi' }), next.kieu === 'loi' ? 6000 : 3500)
  }

  const chay = async (linkMoi?: string[]) => {
    setTt({ kieu: 'chay' })
    try {
      const [url, secret] = await Promise.all([loadScriptUrl(), loadTeacherSecret()])
      if (!url.trim() || !secret.trim()) return bao({ kieu: 'loi', chu: 'Chưa cấu hình máy chủ' })

      const ds = linkMoi ?? links ?? (await linkDanhSachLop(url.trim(), secret.trim()))
      if (!ds.length) {
        setMoBang(true)
        return bao({ kieu: 'loi', chu: 'Chưa lưu link nào' })
      }

      // TẢI TRƯỚC, GHI SAU. Một link hỏng là dừng hẳn: ghi đè bằng danh sách
      // thiếu một khối thì cả khối đó bị cổng vào thi chặn sạch buổi sau.
      const gom = await gomDanhSachTuLink(ds)
      if (gom.hong.length) {
        return bao({ kieu: 'loi', chu: `Hỏng ${gom.hong.length}/${ds.length} link: ${gom.hong[0].loi}`.slice(0, 90) })
      }
      if (!gom.items.length) return bao({ kieu: 'loi', chu: 'Không dòng nào có số báo danh' })

      if (linkMoi) await luuLinkDanhSachLop(url.trim(), secret.trim(), linkMoi)
      const kq = await napDanhSachLop(url.trim(), secret.trim(), gom.items)
      setLinks(ds)
      setNhap(ds.join('\n'))
      setMoBang(false)
      const tom = tomTatDongBo(kq, gom.trung.length)
      onXong?.(kq.soDong, tom)
      // Em bị BỎ khỏi danh sách là em đó đứng ngoài phòng thi từ giờ. Không
      // trộn vào lời báo "xong" màu xanh — thầy phải nhìn thấy.
      bao(kq.bo.length || gom.trung.length || kq.mayChuMoi === 'hong' ? { kieu: 'loi', chu: tom } : { kieu: 'xong', chu: tom })
    } catch (e) {
      bao({
        kieu: 'loi',
        chu: e instanceof Error ? (/fetch|mạng/i.test(e.message) ? 'Mất mạng' : e.message.slice(0, 60)) : 'Lỗi đồng bộ',
      })
    }
  }

  const luuVaChay = async () => {
    const ds = tachLink(nhap)
    if (!ds.length) return bao({ kieu: 'loi', chu: 'Chưa dán link nào' })
    setDangLuu(true)
    try {
      await chay(ds)
    } finally {
      setDangLuu(false)
    }
  }

  const chuaCoLink = links !== null && links.length === 0
  const mau =
    tt.kieu === 'xong'
      ? { nen: 'var(--xanh-nen)', chu: 'var(--xanh)' }
      : tt.kieu === 'loi'
        ? { nen: 'var(--do-nen)', chu: 'var(--do)' }
        : { nen: 'var(--the-2)', chu: 'var(--muc)' }
  const nhanNut = tt.kieu === 'chay' ? 'Đang đồng bộ…' : tt.kieu === 'nghi' ? (chuaCoLink ? 'Dán link danh sách' : 'Đồng bộ danh sách') : tt.chu

  return (
    <div className="flex flex-col items-end" style={{ gap: 'var(--k2)' }}>
      <div className="flex items-center" style={{ gap: 'var(--k2)' }}>
        <button
          type="button"
          onClick={() => (chuaCoLink ? setMoBang(true) : void chay())}
          disabled={tt.kieu === 'chay' || links === null}
          aria-live="polite"
          aria-label={chuaCoLink ? 'Dán link danh sách học sinh' : 'Đồng bộ danh sách học sinh từ Google Sheet'}
          className={`tap-target inline-flex items-center justify-center font-bold whitespace-nowrap ${className}`}
          style={{
            gap: 'var(--k2)',
            height: 40,
            minHeight: 40,
            padding: '0 var(--k4) 0 var(--k3)',
            borderRadius: 'var(--bo-tron)',
            background: mau.nen,
            color: mau.chu,
            fontFamily: 'var(--sans)',
            fontSize: 'var(--cx-1)',
            border: '1.5px solid transparent',
            transitionProperty: 'background-color, color, transform',
            transitionDuration: 'var(--nhanh)',
            transform: tt.kieu === 'chay' ? 'scale(.98)' : 'scale(1)',
          }}
        >
          {tt.kieu === 'xong' ? <Check size={16} /> : tt.kieu === 'loi' ? <AlertCircle size={16} /> : <RefreshCw size={16} className={tt.kieu === 'chay' ? 'animate-spin' : ''} />}
          <span>{nhanNut}</span>
        </button>
        {!chuaCoLink && links !== null && (
          <button
            type="button"
            onClick={() => setMoBang((v) => !v)}
            className="tap-target inline-flex items-center justify-center"
            aria-label="Sửa link danh sách"
            title="Sửa link danh sách"
            style={{ width: 40, height: 40, borderRadius: 'var(--bo-tron)', background: 'var(--the-2)', color: 'var(--nhat)', border: 'none' }}
          >
            <Link2 size={16} />
          </button>
        )}
      </div>

      {moBang && (
        <div style={{ background: 'var(--the-2)', borderRadius: 'var(--bo-2)', padding: 'var(--k3)', width: '100%', maxWidth: 520 }}>
          <div style={{ fontFamily: 'var(--sans)', fontSize: 'var(--cx-1)', color: 'var(--nhat)', marginBottom: 'var(--k2)' }}>
            Link Google Sheet danh sách, mỗi khối một dòng. Sheet phải bật Tệp → Chia sẻ → Xuất bản lên web.
          </div>
          <textarea
            value={nhap}
            onChange={(e) => setNhap(e.target.value)}
            rows={4}
            spellCheck={false}
            aria-label="Link danh sách lớp"
            placeholder={'https://docs.google.com/spreadsheets/d/e/.../pubhtml\nhttps://docs.google.com/spreadsheets/d/e/.../pubhtml'}
            style={{
              width: '100%',
              borderRadius: 'var(--bo-1)',
              padding: 'var(--k3)',
              background: 'var(--the)',
              border: '1.5px solid transparent',
              fontFamily: 'var(--sans)',
              fontSize: 'var(--cx-1)',
              color: 'var(--muc)',
              outline: 'none',
              resize: 'vertical',
            }}
          />
          <div className="flex items-center justify-end" style={{ gap: 'var(--k2)', marginTop: 'var(--k2)' }}>
            <button
              type="button"
              onClick={() => setMoBang(false)}
              className="tap-target"
              style={{ height: 40, padding: '0 var(--k3)', borderRadius: 'var(--bo-1)', background: 'transparent', border: 'none', fontFamily: 'var(--sans)', fontSize: 'var(--cx-1)', color: 'var(--nhat)' }}
            >
              Đóng
            </button>
            <button
              type="button"
              onClick={() => void luuVaChay()}
              disabled={dangLuu || tt.kieu === 'chay'}
              className="tap-target font-bold"
              style={{ height: 40, padding: '0 var(--k4)', borderRadius: 'var(--bo-1)', background: 'var(--muc)', color: 'var(--muc-nguoc)', border: 'none', fontFamily: 'var(--sans)', fontSize: 'var(--cx-1)' }}
            >
              {dangLuu ? 'Đang lưu…' : 'Lưu link và đồng bộ'}
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
