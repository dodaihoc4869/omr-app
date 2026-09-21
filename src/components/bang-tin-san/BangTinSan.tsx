// BẢNG TIN CỦA THẦY — bản "sàn giao dịch" (thầy chốt mẫu 21/09/2026). Thầy chỉ ĐỌC. Bản này CHỈ NHẬN dữ liệu (`du`); việc hỏi `/gv/bang-tin-song` 10 giây/lần nằm ở HomNayScreen.
// MỘT nguồn trạng thái (`du` → `chotSo`): các khối đọc chung ⇒ số khớp nhau. Khối thiếu ⇒ ẩn (không bịa). Lớp CSS tiền tố `bts-`; màu ở `--bts-*` (tokens.css), sáng + tối đều là bản chính thức.
import { useMemo, useRef } from 'react'
import type { DuLieuSan } from '../../lib/bang-tin-san/kieu'
import { chenhLech, chotSo } from '../../lib/bang-tin-san/trang-thai'
import { BanDo3D } from './BanDo3D'
import { BanDoNhiet } from './BanDoNhiet'
import { CotAI } from './CotAI'
import { DanDau } from './DanDau'
import { SoLenhBai } from './SoLenhBai'
import { BangChay } from './BangChay'
import { NenHoc } from './NenHoc'
import { OSo } from './OSo'
import { ThanhTren } from './ThanhTren'
import { useGioMayChu, useItDong, useKichThuoc, useMauSan, useMotMan } from './hooks'
import './bang-tin-san.css'

const nghin = (n: number): string => Math.round(n).toLocaleString('vi-VN')

export interface BangTinSanProps {
  du: DuLieuSan
  /** Chạm tên em ⇒ Toàn cảnh một em. */
  onMoEm?: (sbd: string) => void
  /** Giờ cố định (ms) cho bản vẽ / kiểm thử; không truyền ⇒ chạy theo giờ máy chủ. */
  nayMs?: number
  /** Hỏi máy chủ hụt ≥ 3 nhịp liền: chip "TRỰC TIẾP" đổi thành "Mất kết nối · số lúc HH:MM" (giờ máy chủ của số đang hiện); hỏi được lại ⇒ tự mất. */
  matKetNoi?: boolean
}

export default function BangTinSan({ du, nayMs, onMoEm = () => {}, matKetNoi = false }: BangTinSanProps) {
  const goc = useRef<HTMLElement>(null)
  const { mau, phienBan } = useMauSan(goc)
  const itDong = useItDong()
  const now = useGioMayChu(du.serverNow, du.nhanLucMs, nayMs)
  const so = useMemo(() => chotSo(du), [du])
  const ktGoc = useKichThuoc(goc)
  const motMan = useMotMan() && ktGoc.w >= 980 // MỘT MÀN không cuộn: cửa sổ đủ cao và khung đủ rộng (khớp `data-mot-man` ở CSS)
  const tia = du.tia

  const tiLe = so.tiLeDung
  const tiaTile = tia && tia.tile.length >= 2 ? tia.tile.map((v, i, a) => (i === a.length - 1 && tiLe !== null ? tiLe : v)) : null
  const nhip = du.dungNhip
  return (
    <main className="bts-san" ref={goc} data-khoi="bang-tin-san" data-it-dong={itDong ? '1' : '0'} data-mot-man={motMan ? '1' : '0'}>
      <ThanhTren mocMs={du.mocMs} nowMs={now} moPhong={du.moPhong} matKetNoiLuc={matKetNoi ? du.serverNow : null} />
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
      {((du.nen?.length ?? 0) > 0 || (du.theoLop?.length ?? 0) > 0) && (
        <section className="bts-hang-chinh" data-khoi="hang-chinh">
          {(du.nen?.length ?? 0) > 0 && <NenHoc nen={du.nen!} nowMs={now} mau={mau} phienBanMau={phienBan} itDong={itDong} />}
          {(du.theoLop?.length ?? 0) > 0 && <BanDo3D lop={du.theoLop!} mau={mau} phienBanMau={phienBan} itDong={itDong} />}
        </section>
      )}
      {(du.bt?.baiTap.length ?? 0) > 0 || (du.nhiet?.length ?? 0) > 0 || (du.danDau?.length ?? 0) > 0 || du.bt ? (
        <section className="bts-hang-duoi" data-khoi="hang-duoi">
          {du.bt && du.bt.baiTap.length > 0 && <SoLenhBai baiTap={du.bt.baiTap} nowMs={now} />}
          {du.nhiet && du.nhiet.length > 0 && (
            <BanDoNhiet nhiet={du.nhiet} theoLop={du.theoLop} soLieu={so} mau={mau} phienBanMau={phienBan} itDong={itDong} nowMs={now} motMan={motMan} onMoEm={onMoEm} />
          )}
          {((du.danDau?.length ?? 0) > 0 || (du.bt && (du.bt.canDeY.ds.length > 0 || du.bt.tienBo.length > 0))) && <DanDau danDau={du.danDau} bt={du.bt} onMoEm={onMoEm} />}
          {du.bt && <CotAI bt={du.bt} />}
        </section>
      ) : null}
    </main>
  )
}
