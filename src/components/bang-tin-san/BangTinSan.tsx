// BẢNG TIN CỦA THẦY — bản "sàn giao dịch" (thầy chốt mẫu 21/09/2026). Thầy chỉ ĐỌC. Bản này CHỈ NHẬN dữ liệu (`du`); việc hỏi `/gv/bang-tin-song` 10 giây/lần nằm ở HomNayScreen.
// MỘT nguồn trạng thái (`du` → `chotSo`): các khối đọc chung ⇒ số khớp nhau. Khối thiếu ⇒ ẩn (không bịa). Lớp CSS tiền tố `bts-`; màu ở `--bts-*` (tokens.css), sáng + tối đều là bản chính thức.
import { useMemo, useRef } from 'react'
import type { DuLieuSan } from '../../lib/bang-tin-san/kieu'
import { chenhLech, chotSo } from '../../lib/bang-tin-san/trang-thai'
import { BangChay } from './BangChay'
import { OSo } from './OSo'
import { ThanhTren } from './ThanhTren'
import { useGioMayChu, useItDong, useMauSan } from './hooks'
import './bang-tin-san.css'

const nghin = (n: number): string => Math.round(n).toLocaleString('vi-VN')

export interface BangTinSanProps {
  du: DuLieuSan
  /** Giờ cố định (ms) cho bản vẽ / kiểm thử; không truyền ⇒ chạy theo giờ máy chủ. */
  nayMs?: number
}

export default function BangTinSan({ du, nayMs }: BangTinSanProps) {
  const goc = useRef<HTMLElement>(null)
  const { mau, phienBan } = useMauSan(goc)
  const itDong = useItDong()
  const now = useGioMayChu(du.serverNow, du.nhanLucMs, nayMs)
  const so = useMemo(() => chotSo(du), [du])
  const tia = du.tia

  const tiLe = so.tiLeDung
  const tiaTile = tia && tia.tile.length >= 2 ? tia.tile.map((v, i, a) => (i === a.length - 1 && tiLe !== null ? tiLe : v)) : null
  const nhip = du.dungNhip
  return (
    <main className="bts-san" ref={goc} data-khoi="bang-tin-san" data-it-dong={itDong ? '1' : '0'}>
      <ThanhTren mocMs={du.mocMs} nowMs={now} moPhong={du.moPhong} />
      {du.tin.length > 0 && <BangChay tin={du.tin} itDong={itDong} />}
      <section className="bts-hang-so" aria-label="Bốn con số hôm nay" data-so-o={nhip ? '4' : '3'}>
        <OSo
          khoi="em-hoc"
          nhan="Em đã học hôm nay"
          chu={nghin(so.soEmHoc)}
          donVi={`/ ${nghin(so.tongEm)} em`}
          lech={chenhLech(tia?.hs) !== null ? { d: chenhLech(tia?.hs)!, don: 'em' } : null}
          tia={tia?.hs ?? null}
          tenMauTia="duong"
          nhanTia="Số em đã học trong 60 phút gần nhất"
          mau={mau}
          phienBanMau={phienBan}
        />
        <OSo
          khoi="cau-lam"
          nhan="Câu đã làm"
          chu={nghin(so.soCau)}
          donVi="câu"
          lech={chenhLech(tia?.cau) !== null ? { d: chenhLech(tia?.cau)!, don: 'câu' } : null}
          tia={tia?.cau ?? null}
          tenMauTia="duong"
          nhanTia="Số câu đã làm trong 60 phút gần nhất"
          mau={mau}
          phienBanMau={phienBan}
        />
        <OSo
          khoi="ti-le-dung"
          nhan="Tỉ lệ đúng"
          chu={tiLe === null ? '—' : String(Math.round(tiLe))}
          donVi={tiLe === null ? undefined : '% cả ngày'}
          lech={chenhLech(tiaTile) !== null ? { d: chenhLech(tiaTile)!, don: 'điểm %', thapPhan: true } : null}
          tia={tiaTile}
          tenMauTia="tuDong"
          nhanTia="Tỉ lệ đúng trong 60 phút gần nhất"
          mau={mau}
          phienBanMau={phienBan}
        />
        {nhip && (
          <OSo
            khoi="dung-nhip"
            nhan="Bài tập về nhà đúng nhịp"
            chu={nghin(nhip.soEm)}
            donVi={`/ ${nghin(nhip.soCoLo)} em`}
            lech={chenhLech(tia?.nhip) !== null ? { d: chenhLech(tia?.nhip)!, don: 'em' } : null}
            tia={tia?.nhip ?? null}
            tenMauTia="la"
            nhanTia="Số em nộp chặng đúng nhịp trong 60 phút gần nhất"
            mau={mau}
            phienBanMau={phienBan}
          />
        )}
      </section>
    </main>
  )
}
