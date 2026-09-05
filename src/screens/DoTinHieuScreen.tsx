// BÀN CÂN TÍN HIỆU — BAOMATCATHI.md mục 2.1. Trang đo của ĐỢT 0.
//
// Màn này KHÔNG khoá ai. Nó chỉ ghi lại tám kênh nghe thấy gì, để thầy chụp thử
// trên máy thật rồi chấm điểm từng kênh. Chỉ kênh nào đạt chuẩn 2.2 mới được
// bật khoá ở đợt sau — cấm chốt ngưỡng bằng suy đoán.
//
// HAI CON SỐ KHÁC HẲN NHAU, đừng lẫn:
//   · thầy đo ở đây: chụp thử 10 lần để chấm điểm cái máy, không khoá ai;
//   · học sinh trong ca thi: MỘT lần chụp là khoá, không có ngưỡng đếm.
import { useEffect, useMemo, useRef, useState } from 'react'
import { ArrowLeft, Circle, ClipboardCopy, Check, Download, Play, Square, Trash2 } from 'lucide-react'
import { NutChinh, OThongBao, TheNoiDung } from '../components/DesignSystem'
import {
  BAT_DUNG_TOI_THIEU,
  LAN_THU_CHUAN,
  SO_KENH,
  TEN_KENH,
  TEN_XEP_LOAI,
  vanBanNhatKy,
  xepLoaiKenh,
  xetTrungKhop,
  type DiemKenh,
  type DongNhatKy,
  type MaKenh,
  type PhieuKenh,
} from '../lib/do-dau-vet'
import { thuTinHieu, xinQuyenChuyenDong, type QuyenChuyenDong } from '../lib/thu-tin-hieu'
import { useAppStore } from '../store/appStore'

const SO: React.CSSProperties = { fontFamily: 'var(--sans)', fontVariantNumeric: 'tabular-nums' }
const NHAN_NHO: React.CSSProperties = { fontFamily: 'var(--sans)', fontSize: 'var(--cx-1)', color: 'var(--nhat)' }
const TIEU_DE_MUC: React.CSSProperties = { fontFamily: 'var(--serif)', fontSize: 'var(--cx-3)', fontWeight: 700, color: 'var(--muc)' }

const MOI_KENH: MaKenh[] = ['an_trang', 'tieu_diem', 'toan_man', 'kich_thuoc', 'nhip_ve', 'lech_dong_ho', 'phim_chup', 'xung_chuyen_dong']

/** Mười hai việc của kịch bản đo (mục 2.3). Thầy bấm đúng việc đang làm để mọi
 * dòng nhật ký sau đó được gắn nhãn — nhờ vậy bảng tổng kết phân được đâu là
 * bắt đúng, đâu là báo nhầm. */
const VIEC_DO: { id: string; ten: string; lap: string; loai: 'bat_dung' | 'bao_nham' | 'chuan' }[] = [
  { id: 'chup_toan_man', ten: 'Chụp — preview toàn màn', lap: '10', loai: 'bat_dung' },
  { id: 'chup_anh_nho', ten: 'Chụp — ảnh nhỏ ở góc', lap: '10', loai: 'bat_dung' },
  { id: 'ngoi_yen', ten: 'Ngồi yên, máy trong tay', lap: '30 giây', loai: 'bao_nham' },
  { id: 'cuon_nhanh', ten: 'Cuộn nhanh liên tục', lap: '10 giây', loai: 'bao_nham' },
  { id: 'go_dap_an', ten: 'Gõ đáp án vào ô nhập', lap: '10', loai: 'bao_nham' },
  { id: 'xoay_may', ten: 'Xoay ngang rồi dọc', lap: '3', loai: 'bao_nham' },
  { id: 'dat_ban', ten: 'Đặt máy xuống bàn, nhấc lên', lap: '3', loai: 'bao_nham' },
  { id: 'go_man', ten: 'Gõ mạnh ngón tay vào màn hình', lap: '10', loai: 'bao_nham' },
  { id: 'thanh_thong_bao', ten: 'Kéo thanh thông báo xuống rồi lên', lap: '3', loai: 'chuan' },
  { id: 'cua_so_noi', ten: 'Mở cửa sổ nổi đè lên', lap: '3', loai: 'chuan' },
  { id: 'chia_doi', ten: 'Chia đôi màn hình (Android)', lap: '3', loai: 'chuan' },
  { id: 'chuyen_app', ten: 'Chuyển app 5 giây rồi quay lại', lap: '3', loai: 'chuan' },
]

const TEN_QUYEN: Record<QuyenChuyenDong, string> = {
  chua_hoi: 'chưa xin quyền',
  cho: 'đã cấp quyền',
  tu_choi: 'em từ chối quyền',
  khong_ho_tro: 'máy không có cảm biến',
}

interface DongCoViec extends DongNhatKy {
  viec: string
}

export default function DoTinHieuScreen() {
  const setScreen = useAppStore((s) => s.setScreen)
  const showToast = useAppStore((s) => s.showToast)

  const [dangDo, setDangDo] = useState(false)
  const [quyen, setQuyen] = useState<QuyenChuyenDong>('chua_hoi')
  const [viec, setViec] = useState(VIEC_DO[0].id)
  const [nhatKy, setNhatKy] = useState<DongCoViec[]>([])
  const [daCopy, setDaCopy] = useState(false)
  const mocRef = useRef(0)
  const viecRef = useRef(viec)
  viecRef.current = viec

  // Gỡ bộ thu khi rời màn — gia tốc kế chạy mãi là nóng máy.
  const goRef = useRef<null | (() => void)>(null)
  useEffect(() => () => goRef.current?.(), [])

  const batDau = async () => {
    if (dangDo) return
    const q = await xinQuyenChuyenDong()
    setQuyen(q)
    if (q === 'tu_choi') showToast('Máy từ chối quyền chuyển động — kênh 8 sẽ không có số. Bật lại trong Cài đặt > Safari > Chuyển động.', 'warn')
    mocRef.current = performance.now()
    setNhatKy([])
    goRef.current = thuTinHieu({
      onPhieu: (p: PhieuKenh, bc) => {
        setNhatKy((cu) => [
          ...cu,
          {
            luc: p.luc,
            kenh: p.kenh,
            chiTiet: p.chiTiet,
            boiCanh: `${bc.hienTrang ? 'visible' : 'hidden'} · hasFocus=${bc.coTieuDiem} · ${bc.rong}×${bc.cao} · ${bc.dangChamMan ? 'đang chạm' : 'không chạm'}`,
            viec: viecRef.current,
          },
        ])
      },
    })
    setDangDo(true)
  }

  const dung = () => {
    goRef.current?.()
    goRef.current = null
    setDangDo(false)
  }

  /** Nhóm phiếu trùng khớp — dòng kết luận "→ 2 kênh trùng trong 300 ms". */
  const trungKhop = useMemo(() => xetTrungKhop(nhatKy.filter((d) => d.kenh).map((d) => ({ kenh: d.kenh as MaKenh, luc: d.luc, chiTiet: d.chiTiet }))), [nhatKy])

  /** BẢNG TỔNG KẾT: mỗi kênh bắt đúng bao nhiêu, báo nhầm bao nhiêu.
   *
   * Bắt đúng = báo trong lúc thầy đang làm việc "chụp"; báo nhầm = báo trong
   * lúc thầy đang làm việc đo nhiễu. Việc "chuẩn" (cửa sổ nổi, chia đôi màn)
   * không tính vào cột nào — chúng dùng để chỉnh kênh 2 và kênh 4, không phải
   * để chấm điểm dấu vết chụp. */
  const diem: DiemKenh[] = useMemo(() => {
    const loaiViec = new Map(VIEC_DO.map((v) => [v.id, v.loai]))
    return MOI_KENH.map((kenh) => {
      const cua = nhatKy.filter((d) => d.kenh === kenh)
      return {
        kenh,
        batDung: cua.filter((d) => loaiViec.get(d.viec) === 'bat_dung').length,
        soLanThu: LAN_THU_CHUAN,
        baoNham: cua.filter((d) => loaiViec.get(d.viec) === 'bao_nham').length,
      }
    })
  }, [nhatKy])

  const vanBan = useMemo(() => {
    const dong = vanBanNhatKy(nhatKy, mocRef.current)
    const bang = diem.map((d) => `K${SO_KENH[d.kenh]} ${TEN_KENH[d.kenh]}: bắt đúng ${d.batDung} · báo nhầm ${d.baoNham} → ${TEN_XEP_LOAI[xepLoaiKenh(d)]}`).join('\n')
    const nhom = trungKhop.duKhoa.map((n) => `+${Math.round(n[0].luc - mocRef.current)} ms → ${new Set(n.map((p) => p.kenh)).size} kênh trùng trong 300 ms (${n.map((p) => `K${SO_KENH[p.kenh]}`).join(' + ')})`).join('\n')
    return [
      `BÀN CÂN TÍN HIỆU — ${new Date().toLocaleString('vi-VN')}`,
      `Máy: ${navigator.userAgent}`,
      `Quyền chuyển động: ${TEN_QUYEN[quyen]}`,
      '',
      'NHẬT KÝ',
      dong || '(chưa có dòng nào)',
      '',
      'NHÓM TRÙNG KHỚP (≥ 2 kênh trong 300 ms)',
      nhom || '(chưa có nhóm nào)',
      '',
      'BẢNG TỔNG KẾT',
      bang,
    ].join('\n')
  }, [nhatKy, diem, trungKhop, quyen])

  const chep = async () => {
    try {
      await navigator.clipboard.writeText(vanBan)
      setDaCopy(true)
      setTimeout(() => setDaCopy(false), 2500)
      showToast('Đã chép nhật ký', 'success')
    } catch {
      showToast(vanBan, 'success')
    }
  }

  const tai = () => {
    const b = new Blob([vanBan], { type: 'text/plain;charset=utf-8' })
    const u = URL.createObjectURL(b)
    const a = document.createElement('a')
    a.href = u
    a.download = `ban-can-tin-hieu-${new Date().toISOString().slice(0, 16).replace(/[:T]/g, '')}.txt`
    a.click()
    setTimeout(() => URL.revokeObjectURL(u), 6000)
  }

  const vietGon = (d: DongCoViec) => `+${Math.round(d.luc - mocRef.current)} ms · K${SO_KENH[d.kenh as MaKenh]} ${d.chiTiet}`

  return (
    <div className="min-h-screen pb-28 px-3 sm:px-4 pt-4 flex flex-col" style={{ background: 'var(--nen)', color: 'var(--muc)', gap: 'var(--k4)', fontFamily: 'var(--sans)' }}>
      <button onClick={() => setScreen('examhub')} className="tap-target self-start inline-flex items-center" style={{ ...NHAN_NHO, gap: 4 }}>
        <ArrowLeft size={16} /> Kiểm tra
      </button>
      <h1 className="font-bold" style={{ fontSize: 'var(--cx-5)', fontFamily: 'var(--serif)' }}>
        Bàn cân tín hiệu
      </h1>

      <OThongBao tone="xanh">
        Màn này KHÔNG khoá ai. Thầy chụp thử để chấm điểm cái máy: kênh nào bắt đúng ít nhất {BAT_DUNG_TOI_THIEU}/{LAN_THU_CHUAN} lần và không báo nhầm lần nào thì mới được phép khoá bài học sinh. Học sinh
        trong ca thi thì một lần chụp là khoá, không có ngưỡng đếm.
      </OThongBao>

      {/* 1 — CHẠY */}
      <TheNoiDung>
        <div className="flex items-center justify-between" style={{ gap: 'var(--k2)' }}>
          <div style={TIEU_DE_MUC}>1. Bật máy đo</div>
          <span style={{ ...NHAN_NHO, ...SO }}>{nhatKy.length} dòng</span>
        </div>
        <div style={{ ...NHAN_NHO, marginTop: 4 }}>Quyền chuyển động: {TEN_QUYEN[quyen]}. Kênh 8 cần quyền này mới đọc được gia tốc kế.</div>
        <div style={{ marginTop: 'var(--k3)' }}>
          {dangDo ? (
            <NutChinh variant="nguyhiem" onClick={dung}>
              <span className="inline-flex items-center" style={{ gap: 6 }}>
                <Square size={18} /> Dừng đo
              </span>
            </NutChinh>
          ) : (
            <NutChinh onClick={() => void batDau()}>
              <span className="inline-flex items-center" style={{ gap: 6 }}>
                <Play size={18} /> Bắt đầu đo
              </span>
            </NutChinh>
          )}
        </div>
      </TheNoiDung>

      {/* 2 — VIỆC ĐANG LÀM */}
      <TheNoiDung>
        <div style={TIEU_DE_MUC}>2. Việc thầy đang làm</div>
        <div style={{ ...NHAN_NHO, marginTop: 4, marginBottom: 'var(--k3)' }}>
          Bấm đúng việc TRƯỚC khi làm. Mọi dòng ghi sau đó được gắn nhãn việc này — nhờ vậy bảng tổng kết mới tách được bắt đúng với báo nhầm.
        </div>
        <div className="flex flex-col" style={{ gap: 'var(--k1)' }} role="radiogroup" aria-label="Việc đang đo">
          {VIEC_DO.map((v) => {
            const chon = viec === v.id
            return (
              <button
                key={v.id}
                type="button"
                role="radio"
                aria-checked={chon}
                onClick={() => setViec(v.id)}
                className="tap-target text-left flex items-center"
                style={{ gap: 'var(--k3)', minHeight: 48, padding: 'var(--k2) var(--k3)', borderRadius: 'var(--bo-1)', background: chon ? 'var(--xanh-nen)' : 'transparent', border: 'none', color: 'var(--muc)' }}
              >
                <Circle size={16} style={{ color: chon ? 'var(--xanh)' : 'var(--mo)', fill: chon ? 'var(--xanh)' : 'transparent' }} />
                <span className="flex-1 min-w-0">
                  <span className="block" style={{ fontFamily: 'var(--serif)', fontSize: 'var(--cx-2)' }}>
                    {v.ten}
                  </span>
                  <span style={NHAN_NHO}>
                    lặp {v.lap} · {v.loai === 'bat_dung' ? 'đo bắt đúng' : v.loai === 'bao_nham' ? 'đo báo nhầm' : 'chuẩn cho kênh khác'}
                  </span>
                </span>
              </button>
            )
          })}
        </div>
      </TheNoiDung>

      {/* 3 — BẢNG TỔNG KẾT */}
      <TheNoiDung>
        <div style={TIEU_DE_MUC}>3. Bảng tổng kết</div>
        <div className="flex flex-col" style={{ gap: 'var(--k1)', marginTop: 'var(--k3)' }} data-bang-tong-ket>
          {diem.map((d) => {
            const loai = xepLoaiKenh(d)
            return (
              <div key={d.kenh} className="flex items-baseline" style={{ gap: 'var(--k2)', padding: 'var(--k1) 0' }}>
                <span className="font-bold" style={{ ...SO, width: 32, fontSize: 'var(--cx-1)' }}>
                  K{SO_KENH[d.kenh]}
                </span>
                <span className="flex-1 min-w-0" style={{ fontFamily: 'var(--serif)', fontSize: 'var(--cx-2)' }}>
                  {TEN_KENH[d.kenh]}
                </span>
                <span style={{ ...NHAN_NHO, ...SO }}>
                  đúng {d.batDung} · nhầm {d.baoNham}
                </span>
                <span style={{ ...NHAN_NHO, color: loai === 'khoa_mot_minh' ? 'var(--xanh)' : loai === 'gop_phieu' ? 'var(--cam)' : 'var(--mo)', width: 116, textAlign: 'right' }}>{TEN_XEP_LOAI[loai]}</span>
              </div>
            )
          })}
        </div>
        <div style={{ ...NHAN_NHO, marginTop: 'var(--k3)' }}>
          <span style={SO}>{trungKhop.duKhoa.length}</span> nhóm có từ 2 kênh trùng trong 300 ms · <span style={SO}>{trungKhop.donLe.length}</span> phiếu đơn lẻ
        </div>
      </TheNoiDung>

      {/* 4 — NHẬT KÝ */}
      <TheNoiDung>
        <div className="flex items-center justify-between flex-wrap" style={{ gap: 'var(--k2)' }}>
          <div style={TIEU_DE_MUC}>4. Nhật ký</div>
          <div className="flex items-center" style={{ gap: 'var(--k2)' }}>
            {nhatKy.length > 0 && (
              <button
                type="button"
                onClick={() => setNhatKy([])}
                className="tap-target inline-flex items-center font-bold"
                style={{ gap: 6, minHeight: 40, padding: '0 var(--k3)', borderRadius: 'var(--bo-tron)', background: 'var(--do-nen)', color: 'var(--do)', border: 'none', fontSize: 'var(--cx-1)' }}
              >
                <Trash2 size={16} /> Xoá
              </button>
            )}
            <button
              type="button"
              onClick={() => void chep()}
              className="tap-target inline-flex items-center font-bold"
              style={{ gap: 6, minHeight: 40, padding: '0 var(--k3)', borderRadius: 'var(--bo-tron)', background: daCopy ? 'var(--xanh-nen)' : 'var(--the-2)', color: daCopy ? 'var(--xanh)' : 'var(--muc)', border: 'none', fontSize: 'var(--cx-1)' }}
            >
              {daCopy ? <Check size={16} /> : <ClipboardCopy size={16} />} Chép
            </button>
            <button
              type="button"
              onClick={tai}
              className="tap-target inline-flex items-center font-bold"
              style={{ gap: 6, minHeight: 40, padding: '0 var(--k3)', borderRadius: 'var(--bo-tron)', background: 'var(--the-2)', color: 'var(--muc)', border: 'none', fontSize: 'var(--cx-1)' }}
            >
              <Download size={16} /> .txt
            </button>
          </div>
        </div>
        {nhatKy.length === 0 ? (
          <div style={{ ...NHAN_NHO, marginTop: 'var(--k3)' }}>Chưa có dòng nào. Bấm Bắt đầu đo rồi làm việc đã chọn ở mục 2.</div>
        ) : (
          <div className="flex flex-col" style={{ gap: 2, marginTop: 'var(--k3)', maxHeight: 360, overflowY: 'auto' }} data-nhat-ky>
            {[...nhatKy]
              .slice(-200)
              .reverse()
              .map((d, i) => (
                <div key={`${d.luc}-${i}`} style={{ ...NHAN_NHO, ...SO, color: 'var(--muc)', padding: '2px 0' }}>
                  {vietGon(d)}
                  <span style={{ color: 'var(--nhat)' }}> · {d.boiCanh}</span>
                </div>
              ))}
          </div>
        )}
      </TheNoiDung>
    </div>
  )
}
