// HỒ SƠ MỘT EM — MỘT MÀN DUY NHẤT, ba lối vào.
//
// BA-APP.md mục 9 cấm dựng hai màn hồ sơ khác nhau cho cùng một em. Ba lối vào:
//   · thầy   → HocSinhScreen (chạm một em trong danh sách)
//   · em     → StudentProfileScreen (link riêng /hs/<token>)
//   · phụ huynh → ParentScreen (link riêng /ph/<token>)
// Nội dung y hệt nhau; chỉ khác cách xưng hô và các nút hành động của thầy —
// những nút đó do màn cha vẽ thêm, không nằm ở đây.
import { TrendingDown, TrendingUp, Minus } from 'lucide-react'
import { Hang, Nhan, OThongBao, TheNoiDung } from './DesignSystem'
import type { BaiTapCuaEm, ChuyenDeEm, HoSoEm, TrangThaiBaiTap, XuHuong } from '../lib/exam-api'
import { classify } from '../engine/score'

const SO: React.CSSProperties = { fontFamily: 'var(--sans)', fontVariantNumeric: 'tabular-nums' }
const NHAN_NHO: React.CSSProperties = { fontFamily: 'var(--sans)', fontSize: 'var(--cx-1)', color: 'var(--nhat)' }

/** Xếp loại → màu nhãn. Dùng đúng thang classify() của engine chấm điểm. */
export function toneXepLoai(diem: number | null): 'xanh' | 'tim' | 'cam' | 'do' | 'xam' {
  if (diem === null) return 'xam'
  const x = classify(diem)
  if (x === 'Giỏi') return 'xanh'
  if (x === 'Khá') return 'tim'
  if (x === 'Trung bình') return 'cam'
  return 'do'
}

/** Chuyên đề coi là YẾU khi sai > 30 % VÀ đã làm đủ số câu tối thiểu — dưới
 * ngưỡng đó thì con số chưa nói lên gì, không kết luận. */
export const NGUONG_YEU = 0.3
export const SO_CAU_DU_TIN = 4

export function laYeu(cd: Pick<ChuyenDeEm, 'tiLeSai' | 'soCau'>): boolean {
  return cd.tiLeSai > NGUONG_YEU && cd.soCau >= SO_CAU_DU_TIN
}

export const NHAN_BAI_TAP: Record<TrangThaiBaiTap, { ten: string; tone: 'xam' | 'cam' | 'xanh' | 'do' }> = {
  chua_lam: { ten: 'chưa làm', tone: 'xam' },
  dang_lam: { ten: 'đang làm', tone: 'cam' },
  da_nop: { ten: 'đã nộp', tone: 'xanh' },
  qua_han: { ten: 'quá hạn', tone: 'do' },
}

function phanTram(x: number): string {
  return `${Math.round(x * 100)}%`
}

function ngayGio(iso: string): string {
  const d = new Date(iso)
  if (!Number.isFinite(d.getTime())) return ''
  return d.toLocaleString('vi-VN', { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' })
}

function MuiTen({ xuHuong }: { xuHuong: XuHuong }) {
  if (xuHuong === 'tot') return <TrendingDown size={14} style={{ color: 'var(--xanh)' }} aria-label="đang tiến bộ" />
  if (xuHuong === 'xau') return <TrendingUp size={14} style={{ color: 'var(--do)' }} aria-label="đang sa sút" />
  if (xuHuong === 'deu') return <Minus size={14} style={{ color: 'var(--nhat)' }} aria-label="chưa đổi" />
  return null
}

function ThanhTiLe({ tiLe }: { tiLe: number }) {
  const pct = Math.max(0, Math.min(100, Math.round(tiLe * 100)))
  return (
    <div style={{ height: 6, borderRadius: 999, background: 'var(--the-2)', overflow: 'hidden' }}>
      <div style={{ width: `${pct}%`, height: '100%', background: pct > 30 ? 'var(--do)' : 'var(--xanh)' }} />
    </div>
  )
}

export function KhoiChuyenDe({ chuyenDe }: { chuyenDe: ChuyenDeEm[] }) {
  const yeu = chuyenDe.filter(laYeu)
  return (
    <TheNoiDung>
      <h2 className="font-bold" style={{ fontFamily: 'var(--serif)', fontSize: 'var(--cx-4)', marginBottom: 'var(--k3)' }}>
        Điểm mạnh — yếu
      </h2>
      {chuyenDe.length === 0 ? (
        <div style={NHAN_NHO}>
          Chưa có dữ liệu chuyên đề. Chấm một ca (màn Chi tiết ca) là bảng này tự có.
        </div>
      ) : (
        <>
          {yeu.length > 0 && (
            <OThongBao tone="cam">
              Yếu nhất: <b>{yeu[0].ten}</b> — sai <b style={SO}>{phanTram(yeu[0].tiLeSai)}</b> trên{' '}
              <span style={SO}>{yeu[0].soCau}</span> câu đã làm.
            </OThongBao>
          )}
          <div className="flex flex-col" style={{ gap: 'var(--k3)', marginTop: 'var(--k3)' }}>
            {chuyenDe.map((cd) => (
              <div key={cd.ten} data-chuyen-de={cd.ten}>
                <div className="flex items-baseline justify-between" style={{ gap: 'var(--k2)' }}>
                  <span className="flex items-center min-w-0" style={{ gap: 4 }}>
                    <span className="truncate" style={{ fontSize: 'var(--cx-2)' }}>
                      {cd.ten}
                    </span>
                    <MuiTen xuHuong={cd.xuHuong} />
                  </span>
                  <span className="shrink-0 font-bold" style={{ ...SO, fontSize: 'var(--cx-2)' }}>
                    sai {phanTram(cd.tiLeSai)}
                  </span>
                </div>
                <div style={{ marginTop: 4 }}>
                  <ThanhTiLe tiLe={cd.tiLeSai} />
                </div>
                <div style={{ ...NHAN_NHO, ...SO, marginTop: 2 }}>
                  {cd.soSai}/{cd.soCau} câu sai
                  {cd.soCau < SO_CAU_DU_TIN ? ' · còn ít câu, chưa đủ kết luận' : ''}
                </div>
              </div>
            ))}
          </div>
        </>
      )}
    </TheNoiDung>
  )
}

export function KhoiLichSuCa({ ca }: { ca: HoSoEm['ca'] }) {
  return (
    <TheNoiDung>
      <h2 className="font-bold" style={{ fontFamily: 'var(--serif)', fontSize: 'var(--cx-4)', marginBottom: 'var(--k3)' }}>
        Lịch sử ca thi
      </h2>
      {ca.length === 0 ? (
        <div style={NHAN_NHO}>Em chưa nộp bài ca nào.</div>
      ) : (
        <div className="flex flex-col" style={{ gap: 'var(--k2)' }}>
          {ca.map((c) => (
            <Hang key={`${c.maCa}-${c.lanThu}`} className="flex-col" style={{ alignItems: 'stretch' }} data-ma-ca={c.maCa}>
              <span className="flex items-start justify-between" style={{ gap: 'var(--k3)' }}>
                <span className="flex-1 min-w-0">
                  <div className="font-bold truncate" style={{ fontFamily: 'var(--serif)', fontSize: 'var(--cx-2)' }}>
                    {c.tenCa || `Ca ${c.maCa}`}
                    {c.lanThu > 1 ? ` (lần ${c.lanThu})` : ''}
                  </div>
                  <div style={NHAN_NHO}>
                    <span style={SO}>{ngayGio(c.nopLuc)}</span>
                    {c.hang && c.siSo ? (
                      <>
                        {' · hạng '}
                        <span style={SO}>
                          {c.hang}/{c.siSo}
                        </span>
                      </>
                    ) : (
                      ''
                    )}
                  </div>
                  {c.tong !== null && (c.diemI !== null || c.diemII !== null || c.diemIII !== null) && (
                    <div style={{ ...NHAN_NHO, ...SO, marginTop: 2 }}>
                      Phần I {(c.diemI ?? 0).toFixed(2).replace('.', ',')} · II {(c.diemII ?? 0).toFixed(2).replace('.', ',')} · III{' '}
                      {(c.diemIII ?? 0).toFixed(2).replace('.', ',')}
                    </div>
                  )}
                </span>
                <span className="shrink-0 font-bold" style={{ ...SO, fontSize: 'var(--cx-3)' }}>
                  {c.tong === null ? 'chưa chấm' : c.tong.toFixed(2).replace('.', ',')}
                </span>
              </span>
              <span className="flex items-center flex-wrap" style={{ gap: 4, marginTop: 6 }}>
                {c.tong !== null && <Nhan tone={toneXepLoai(c.tong)}>{classify(c.tong)}</Nhan>}
                {c.trangThai === 'khoa' && <Nhan tone="do">bị khoá</Nhan>}
                {c.trangThai !== 'khoa' && c.soLanRoiMan > 0 && <Nhan tone="cam">rời màn {c.soLanRoiMan} lần</Nhan>}
              </span>
            </Hang>
          ))}
        </div>
      )}
    </TheNoiDung>
  )
}

export function KhoiBaiTap({ baiTap }: { baiTap: BaiTapCuaEm[] | null }) {
  return (
    <TheNoiDung>
      <h2 className="font-bold" style={{ fontFamily: 'var(--serif)', fontSize: 'var(--cx-4)', marginBottom: 'var(--k3)' }}>
        Bài tập về nhà
      </h2>
      {baiTap === null ? (
        <div style={NHAN_NHO}>Đang tải…</div>
      ) : baiTap.length === 0 ? (
        <div style={NHAN_NHO}>Chưa giao bài tập nào.</div>
      ) : (
        <div className="flex flex-col" style={{ gap: 'var(--k2)' }}>
          {baiTap.map((b) => (
            <Hang
              key={b.maCa}
              className="flex-col"
              style={{ alignItems: 'stretch' }}
              data-bai-tap={b.maCa}
            >
              <span className="flex items-start justify-between" style={{ gap: 'var(--k3)' }}>
                <span className="flex-1 min-w-0">
                  <div className="font-bold truncate" style={{ fontFamily: 'var(--serif)', fontSize: 'var(--cx-2)' }}>
                    {b.tenCa || `Bài ${b.maCa}`}
                  </div>
                  <div style={NHAN_NHO}>
                    giao <span style={SO}>{ngayGio(b.giaoLuc)}</span>
                    {b.hanNop ? (
                      <>
                        {' · hạn '}
                        <span style={SO}>{ngayGio(b.hanNop)}</span>
                      </>
                    ) : (
                      ''
                    )}
                  </div>
                </span>
                <span className="shrink-0 font-bold" style={{ ...SO, fontSize: 'var(--cx-3)' }}>
                  {b.tong === null ? '' : b.tong.toFixed(2).replace('.', ',')}
                </span>
              </span>
              <span className="flex items-center flex-wrap" style={{ gap: 4, marginTop: 6 }}>
                <Nhan tone={NHAN_BAI_TAP[b.trangThai].tone}>{NHAN_BAI_TAP[b.trangThai].ten}</Nhan>
              </span>
            </Hang>
          ))}
        </div>
      )}
    </TheNoiDung>
  )
}
