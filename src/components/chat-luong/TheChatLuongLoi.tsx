// THẺ "CHẤT LƯỢNG SỬA LỖI · 14 NGÀY" — Tổng quan app thầy (thầy 05/10: chỉnh thuật toán làm lại câu sai theo SỐ THẬT, không cảm tính).
// 5 thước đo theo LỚP từ `/gv/chat-luong-loi` (định nghĩa chính xác: server/src/chat-luong-loi.ts). Mỗi số có nhãn đời thường + số mẫu;
// dưới `nToiThieu` (10) mẫu ⇒ "Chưa đủ dữ liệu". Lượt tải ĐẦU lỗi / máy chủ chưa có lệnh / trả lời lạ ⇒ thẻ ẨN (màn Tổng quan y nguyên).
// Đổi lớp mà lỗi ⇒ báo ngay trong thẻ + Thử lại. Chỉ dùng lớp CSS + biến màu sẵn có của app thầy (gv2-*, --m3-*); tệp CSS riêng chỉ bố cục.
import { useCallback, useEffect, useRef, useState } from 'react'
import { phanTramSo, soVi, thapPhanVi } from '../../lib/tong-quan-gv'
import { taiChatLuong, type ChatLuongLop, type DuChatLuong, type TiLeCl } from './api'
import '../../screens/gv-hoa2.css'
import './the-chat-luong-loi.css'

/** Lớp thầy xem lần trước (tiện riêng máy thầy; đọc lỗi ⇒ lớp đầu danh sách). */
const KHOA_LOP = 'omr_gv_chat_luong_lop'
const docLopNho = (): string | null => {
  try {
    return localStorage.getItem(KHOA_LOP) || null
  } catch {
    return null
  }
}
const ghiLopNho = (lop: string): void => {
  try {
    localStorage.setItem(KHOA_LOP, lop)
  } catch {
    /* không lưu được: lần sau mở lớp đầu danh sách */
  }
}
const ngayNgan = (n: string): string => `${n.slice(8, 10)}/${n.slice(5, 7)}`
const tenLopHien = (t: string): string => (/^chưa xếp lớp$/i.test(t) ? t : `Lớp ${t}`)
/** Tên lớp đặt giữa câu ("Đang tính số liệu lớp 11B…"). */
const tenLopTrongCau = (t: string): string => (/^chưa xếp lớp$/i.test(t) ? 'nhóm chưa xếp lớp' : `lớp ${t}`)

export interface DongDo {
  khoa: string
  nhan: string
  /** null ⇒ "Chưa đủ dữ liệu". */
  giaTri: string | null
  phu: string
}

/** 6 dòng của thẻ (thước đo 2 có một dòng cho mỗi mốc kiểm). Thuần — test được. */
export function dongCuaLop(k: ChatLuongLop, nToiThieu: number): DongDo[] {
  const thieu = (n: number, don: string): string => `mới ${soVi(n)} ${don}, cần từ ${soVi(nToiThieu)}`
  const tl = (t: TiLeCl): string | null => (t.du && t.tiLe !== null ? `${phanTramSo(t.tiLe)}%` : null)
  const ds: DongDo[] = [
    { khoa: 'lam-lai', nhan: 'Làm lại câu đã sai: đúng ngay lần đầu', giaTri: tl(k.lamLaiDau), phu: k.lamLaiDau.du ? `trên ${soVi(k.lamLaiDau.n)} lượt làm lại` : thieu(k.lamLaiDau.n, 'lượt làm lại') },
  ]
  for (const m of k.saiLaiDuyTri) {
    ds.push({ khoa: `moc-${m.moc}`, nhan: `Đã khắc phục, kiểm lại sau ${m.moc} ngày: sai lại`, giaTri: tl(m), phu: m.du ? `trên ${soVi(m.n)} lượt kiểm` : thieu(m.n, 'lượt kiểm') })
  }
  const nd = k.ngayToiDong
  ds.push({
    khoa: 'ngay-dong',
    nhan: 'Từ lần sai cuối tới khi khắc phục (trung vị)',
    giaTri: nd.du && nd.trungVi !== null ? `${Number.isInteger(nd.trungVi) ? soVi(nd.trungVi) : thapPhanVi(nd.trungVi)} ngày` : null,
    phu: nd.du ? `${soVi(nd.n)} lỗi đã khắc phục` : thieu(nd.n, 'lỗi đã khắc phục'),
  })
  const la = k.cauLaCungDang
  ds.push({ khoa: 'cau-la', nhan: 'Câu chưa gặp, cùng dạng với câu đã sai: làm đúng', giaTri: tl(la), phu: la.du ? `trên ${soVi(la.n)} lượt` : thieu(la.n, 'lượt') })
  const nv = k.lapNguyenVan
  ds.push({
    khoa: 'nguyen-van',
    nhan: 'Lượt làm lại phải lặp nguyên văn câu đã sai',
    giaTri: nv.du ? `${soVi(nv.dat)} lượt` : null,
    phu: nv.du ? `trên ${soVi(nv.n)} lượt làm lại · ${phanTramSo(nv.tiLe ?? 0)}%` : thieu(nv.n, 'lượt làm lại'),
  })
  return ds
}

/** Lớp chưa có mẫu nào ở cả 5 thước đo. */
const rongHet = (k: ChatLuongLop): boolean =>
  k.lamLaiDau.n === 0 && k.saiLaiDuyTri.every((m) => m.n === 0) && k.ngayToiDong.n === 0 && k.cauLaCungDang.n === 0 && k.lapNguyenVan.n === 0

export default function TheChatLuongLoi({ soNgay = 14 }: { soNgay?: number }) {
  const [du, setDu] = useState<DuChatLuong | null>(null)
  /** Lớp đang tải (đổi lớp); null = không tải. */
  const [dangTai, setDangTai] = useState<string | null>(null)
  const [loi, setLoi] = useState<{ lop: string; chu: string } | null>(null)
  const lan = useRef(0)
  const daCoThe = useRef(false)

  const tai = useCallback(
    async (lop: string | null) => {
      const l = ++lan.current
      setDangTai(lop ?? '')
      setLoi(null)
      const r = await taiChatLuong(lop, soNgay)
      if (l !== lan.current) return
      setDangTai(null)
      if (r.ok) {
        daCoThe.current = true
        setDu(r.du)
        if (r.du.chon) ghiLopNho(r.du.chon)
        return
      }
      // Lượt đầu lỗi ⇒ thẻ ẩn (không làm vỡ Tổng quan). Thẻ đã hiện ⇒ báo lỗi đổi lớp ngay trong thẻ.
      if (daCoThe.current && lop) setLoi({ lop, chu: r.chu })
    },
    [soNgay],
  )

  useEffect(() => {
    void tai(docLopNho())
    return () => {
      lan.current++
    }
  }, [tai])

  const k = du?.ketQua
  if (!du || !k) return null
  const dangDoi = dangTai !== null
  return (
    <section className="gv2-the clg-the" aria-labelledby="clg-tieu-de" aria-busy={dangDoi || undefined}>
      <div className="gv2-the-dau">
        <h2 id="clg-tieu-de" className="gv2-the-tieu-de">
          Chất lượng sửa lỗi · {du.soNgay} ngày
        </h2>
      </div>
      <p className="gv2-phu clg-phu-de">
        {tenLopHien(k.tenLop)} · <span className="gv2-so">{soVi(k.soEm)}</span> em ·{' '}
        <span className="gv2-so">
          {ngayNgan(k.tuNgay)}–{ngayNgan(k.denNgay)}
        </span>
      </p>
      {du.lop.length > 1 && (
        <div className="clg-lop" role="group" aria-label="Chọn lớp">
          {du.lop.map((l) => {
            const dang = l.tenLop === k.tenLop
            return (
              <button
                key={l.tenLop}
                type="button"
                className={`gv2-nut-vien${dang ? ' gv2-nut-bat' : ''}`}
                aria-pressed={dang}
                disabled={dangDoi}
                title={tenLopHien(l.tenLop)}
                onClick={() => {
                  if (!dang) void tai(l.tenLop)
                }}
              >
                {l.tenLop}
              </button>
            )
          })}
        </div>
      )}
      {loi ? (
        <div className="gv2-loi clg-loi" role="alert">
          <span>
            Chưa tính được số liệu {tenLopTrongCau(loi.lop)}: {loi.chu}
          </span>
          <button type="button" className="gv2-nut-chu" onClick={() => void tai(loi.lop)}>
            Thử lại
          </button>
        </div>
      ) : dangDoi ? (
        <p className="gv2-nhat clg-trang-thai" role="status">
          Đang tính số liệu {dangTai ? tenLopTrongCau(dangTai) : 'của lớp'}…
        </p>
      ) : rongHet(k) ? (
        <p className="gv2-nhat clg-trang-thai">
          Chưa có lượt làm lại câu sai nào trong {du.soNgay} ngày qua — số liệu hiện khi các em làm lại câu đã sai.
        </p>
      ) : (
        <dl className="clg-ds">
          {dongCuaLop(k, du.nToiThieu).map((d) => (
            <div key={d.khoa} className="clg-dong" data-do={d.khoa}>
              <dt className="gv2-nhan">{d.nhan}</dt>
              <dd className="clg-gia-tri">
                {d.giaTri !== null ? <span className="gv2-so gv2-so-lon">{d.giaTri}</span> : <span className="gv2-dam">Chưa đủ dữ liệu</span>}
                <span className="gv2-phu">{d.phu}</span>
              </dd>
            </div>
          ))}
        </dl>
      )}
      <p className="gv2-phu clg-chu-thich">
        Chỉ tính lượt tự làm (không trợ giúp, không xem lời giải 12 giờ trước) và câu đúng khối của lớp
        {k.boKhacKhoi > 0 ? ` — đã bỏ ${soVi(k.boKhacKhoi)} câu khác khối` : ''}. Câu song sinh và câu thay thế tính là làm lại câu gốc.
      </p>
    </section>
  )
}
