// TỔNG QUAN — trang đầu app thầy khi Game Hóa 2.0 bật (thầy chốt 28/09 · docs/ban-ve-gv-2809/GV-TongQuan).
// "Hôm nay có gì": thẻ số (nhãn + đơn vị + mẫu số + dòng so sánh), chiến dịch đang chạy, ca đang mở, việc cần làm,
// bài nộp 14 ngày. CHỈ dùng API sẵn có: `danhSachCa` + `/gv/chien-dich` danh-sach + bang. Không đổi máy chủ.
// Phép tính thuần ở `src/lib/tong-quan-gv.ts` (có test). Ghi số đếm cạnh mục thanh bên vào `useSoDemGv`.
import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { AlertTriangle, BookOpen, ChevronRight, Clock, Flag, MonitorCheck, RefreshCw, Star, Users, type LucideIcon } from 'lucide-react'
import { danhSachCa, type CaTomTat } from '../lib/exam-api'
import { loadScriptUrl, loadTeacherSecret } from '../lib/exam-db'
import { gioMayChu } from '../lib/gio-may-chu'
import { gioPhutVN } from '../lib/em-toan-canh'
import { useAppStore } from '../store/appStore'
import { useSoDemGv } from '../lib/so-dem-gv'
import { danhSach, docBang, type BangChienDich, type ChienDichTom } from '../components/chien-dich/api'
import { KHOA_CHON_CHIEN_DICH } from '../components/chien-dich/LenBangChienDich'
import { chuHan } from '../components/chien-dich/DsChienDichDaGiao'
import { hienNgay, ngayVn } from '../components/chien-dich/ngay'
import { caConEmDangLam } from './LichSuCaScreen'
import {
  CHU_NHIP,
  baiNopTheoNgay,
  caChuaCoChienDich,
  chienDichHienTongQuan,
  demEmTheoLop,
  dongChienDich,
  kpiTongQuan,
  phanTramSo,
  soVi,
  type DongChienDich,
} from '../lib/tong-quan-gv'
import { taiGioiHan } from '../lib/tai-gioi-han'
import TheChatLuongLoi from '../components/chat-luong/TheChatLuongLoi'
import KpiChuaCauSai from '../components/chua-cau-sai/KpiChuaCauSai'
import './gv-hoa2.css'


interface DuLieu {
  ca: CaTomTat[]
  cd: ChienDichTom[]
  bang: (BangChienDich | null)[]
  loiCa: string
  loiCd: string
}

/** "28/09" từ mốc ISO (giờ VN). */
const ngayThang = (iso: string): string => {
  const t = new Date(iso).getTime()
  if (!Number.isFinite(t)) return ''
  const n = ngayVn(t)
  return `${n.slice(8, 10)}/${n.slice(5, 7)}`
}

export default function TongQuanScreen() {
  const setScreen = useAppStore((s) => s.setScreen)
  const moChiTietCa = useAppStore((s) => s.moChiTietCa)
  const classList = useAppStore((s) => s.classList) as { lop?: string }[] | undefined
  const datSo = useSoDemGv((s) => s.datSo)
  const datGiaoTuCa = useSoDemGv((s) => s.datGiaoTuCa)
  const [du, setDu] = useState<DuLieu | null>(null)
  const [dangTai, setDangTai] = useState(false)

  const lanTai = useRef(0)
  const tai = useCallback(async () => {
    const lan = ++lanTai.current
    setDangTai(true)
    const taiCa = async () => {
      try {
        const [url, mat] = await Promise.all([loadScriptUrl(), loadTeacherSecret()])
        if (!url.trim() || !mat.trim()) throw new Error('Chưa kết nối máy chủ — vào Cài đặt › Công cụ kỹ thuật › Kết nối máy chủ')
        return { ca: await danhSachCa(url.trim(), mat.trim(), false), loiCa: '' }
      } catch (e) { return { ca: [] as CaTomTat[], loiCa: e instanceof Error ? e.message : 'Không tải được danh sách ca' } }
    }
    const taiCd = async () => {
      try {
        const r = await danhSach()
        return r.ok ? { cd: r.du.chienDich, loiCd: '' } : { cd: [] as ChienDichTom[], loiCd: r.chu }
      } catch (e) { return { cd: [] as ChienDichTom[], loiCd: e instanceof Error ? e.message : 'Không tải được chiến dịch' } }
    }
    const [{ ca, loiCa }, { cd, loiCd }] = await Promise.all([taiCa(), taiCd()])
    if (lan !== lanTai.current) return
    const hien = chienDichHienTongQuan(cd)
    const bang = await taiGioiHan(hien, async (c) => {
      try { const b = await docBang(c.id); return b.ok ? b.du : null } catch { return null }
    })
    if (lan !== lanTai.current) return
    setDu({ ca, cd: hien, bang, loiCa, loiCd })
    setDangTai(false)
  }, [])

  useEffect(() => {
    void tai()
    return () => { lanTai.current++ }
  }, [tai])

  const now = gioMayChu()
  const emTheoLop = useMemo(() => demEmTheoLop(classList), [classList])
  const tongEm = classList?.length ?? 0
  const dong: DongChienDich[] = useMemo(() => (du ? du.cd.map((c, i) => dongChienDich(c, du.bang[i], now)) : []), [du, now])
  const kpi = useMemo(() => kpiTongQuan(dong, du?.bang ?? []), [dong, du])
  const caMo = useMemo(() => (du?.ca ?? []).filter((c) => c.loai !== 'baitap' && caConEmDangLam(c, now)), [du, now])
  const caChuaGiao = useMemo(() => (du ? caChuaCoChienDich(du.ca, du.cd, now) : []), [du, now])
  const bieuDo = useMemo(() => baiNopTheoNgay(du?.ca ?? [], now), [du, now])

  useEffect(() => {
    if (!du) return
    datSo({ caMo: du.loiCa ? null : caMo.length, chienDichChay: du.loiCd ? null : kpi.soChay, canDayLai: du.loiCd ? null : kpi.canDayLaiCau })
  }, [du, caMo.length, kpi.soChay, kpi.canDayLaiCau, datSo])

  const moBang = (id: string) => {
    try {
      sessionStorage.setItem(KHOA_CHON_CHIEN_DICH, id)
    } catch {
      /* không lưu được: Chữa trên lớp mở chiến dịch mới nhất */
    }
    setScreen('goilenbang')
  }

  const viec: { key: string; icon: typeof Flag; tone: 'do' | 'vang' | 'xanh' | 'xam'; chu: string; phu: string; nut: string; lam: () => void }[] = []
  for (const d of dong) {
    if (d.canDayLaiCau > 0) viec.push({ key: `dl-${d.cd.id}`, icon: AlertTriangle, tone: 'do', chu: `${d.canDayLaiCau} câu cần thầy dạy lại`, phu: `${d.cd.ten}${d.cd.lop ? ` · ${d.cd.lop}` : ''}`, nut: 'Chiếu', lam: () => moBang(d.cd.id) })
  }
  for (const d of dong) {
    if (d.nhip === 'cho_chua') viec.push({ key: `bc-${d.cd.id}`, icon: MonitorCheck, tone: 'vang', chu: 'Buổi chữa xếp sẵn', phu: `${d.cd.ten}${d.cd.lop ? ` · ${d.cd.lop}` : ''}`, nut: 'Mở', lam: () => moBang(d.cd.id) })
  }
  for (const d of dong) {
    if (d.treNhip > 0 && d.nhip !== 'cho_chua') viec.push({ key: `tn-${d.cd.id}`, icon: Clock, tone: 'vang', chu: `${d.treNhip} em trễ nhịp từ 2 ngày`, phu: `${d.cd.ten}${d.cd.lop ? ` · ${d.cd.lop}` : ''}`, nut: 'Xem', lam: () => moBang(d.cd.id) })
  }
  for (const c of caChuaGiao.slice(0, 3)) {
    viec.push({
      key: `ca-${c.maCa}`,
      icon: Flag,
      tone: 'xam',
      chu: `Ca ${ngayThang(c.batDau || c.moLuc)} chưa có chiến dịch`,
      phu: `${c.tenCa || `Ca ${c.maCa}`}${c.lop ? ` · ${c.lop}` : ''}`,
      nut: 'Giao',
      lam: () => {
        datGiaoTuCa({ maCa: c.maCa, lop: c.lop, ten: c.tenCa })
        setScreen('chiendich')
      },
    })
  }

  const ca = caMo[0]
  const moiCa = ca ? emTheoLop.get(ca.lop.trim()) ?? 0 : 0

  return (
    <div className="gv2-trang">
      <header className="gv2-dau">
        <div className="gv2-dau-chu">
          <h1 className="gv2-tieu-de">Tổng quan</h1>
          <p className="gv2-phu-de">
            {hienNgay(ngayVn(now))} · {gioPhutVN(now)}
            {tongEm > 0 && (
              <>
                {' · '}
                <span className="gv2-so">{soVi(tongEm)}</span> em trong danh sách lớp
              </>
            )}
          </p>
        </div>
        <div className="gv2-dau-nut">
          <button type="button" className="gv2-nut-vien gv2-nut-icon" onClick={() => void tai()} disabled={dangTai} aria-label="Tải lại số liệu" title="Tải lại số liệu">
            <RefreshCw size={18} aria-hidden="true" className={dangTai ? 'animate-spin' : ''} />
          </button>
          <button type="button" className="gv2-nut-chinh" onClick={() => setScreen('chiendich')}>
            <Flag size={18} aria-hidden="true" />
            Mở hành trình
          </button>
        </div>
      </header>

      {!du ? (
        <p className="gv2-nhat" role="status">
          Đang tải số liệu hôm nay…
        </p>
      ) : (
        <>
          {(du.loiCa || du.loiCd) && (
            <div className="gv2-loi" role="alert">
              <span>{[du.loiCa && `Danh sách ca: ${du.loiCa}`, du.loiCd && `Chiến dịch: ${du.loiCd}`].filter(Boolean).join(' · ')}</span>
              <button type="button" className="gv2-nut-chu" onClick={() => void tai()}>
                Thử lại
              </button>
            </div>
          )}

          <section className="gv2-kpi" aria-label="Số liệu chính">
            <TheSo mau="xd" icon={Users} nhan="Em được giao chiến dịch" so={soVi(kpi.emDuocGiao)} donVi={tongEm > 0 ? `/ ${soVi(tongEm)} em` : 'em'} phu={`trong ${kpi.soChay} chiến dịch đang chạy`} />
            <TheSo
              mau="xl"
              icon={Star}
              nhan="Thành thạo trung bình"
              so={kpi.thanhThaoTb === null ? '—' : String(phanTramSo(kpi.thanhThaoTb))}
              donVi="% câu"
              phu={kpi.mucCanTb === null ? 'chưa có chiến dịch đang chạy' : `mức cần hôm nay ${phanTramSo(kpi.mucCanTb)}%`}
              tone={kpi.thanhThaoTb !== null && kpi.mucCanTb !== null ? (dong.some((d) => d.nhip === 'cham') ? 'do' : 'la') : undefined}
            />
            <TheSo mau="hp" icon={Clock} nhan="Em trễ nhịp từ 2 ngày" so={soVi(kpi.treNhip)} donVi="em" phu={`trên ${soVi(kpi.emDuocGiao)} em được giao`} tone={kpi.treNhip > 0 ? 'do' : undefined} />
            <TheSo mau="ho" icon={BookOpen} nhan="Câu cần thầy dạy lại" so={soVi(kpi.canDayLaiCau)} donVi="câu" phu={`${soVi(kpi.canDayLaiLuot)} lượt em cần chữa`} />
          </section>

          <div className="gv2-luoi">
            <div className="gv2-cot-chinh">
              <section className="gv2-the" aria-labelledby="tq-cd">
                <div className="gv2-the-dau">
                  <h2 id="tq-cd" className="gv2-the-tieu-de">
                    Hành trình đang học
                  </h2>
                  <button type="button" className="gv2-nut-chu" onClick={() => setScreen('chiendich')}>
                    Xem tất cả <ChevronRight size={16} aria-hidden="true" />
                  </button>
                </div>
                {dong.length === 0 ? (
                  <p className="gv2-nhat">{du.loiCd ? 'Chưa tải được hành trình.' : 'Bổ sung bài để bắt đầu hành trình.'}</p>
                ) : (
                  <ul className="gvm-cd-ds" tabIndex={0} aria-label={`Chiến dịch luyện đang chạy · ${dong.length} chiến dịch, kéo để xem thêm`}>
                    {dong.map((d) => (
                      <li key={d.cd.id} className="gvm-cd">
                        <div className="gvm-cd-ten">
                          <button type="button" className="gv2-ten-nut" onClick={() => moBang(d.cd.id)} title="Mở bảng chiến dịch ở Chữa trên lớp">
                            {d.cd.ten}
                          </button>
                          <div className="gv2-phu">
                            {d.cd.lop || 'Nhiều lớp'} · <span className="gv2-so">{d.soEm}</span> em
                          </div>
                          <span className="gv2-chip" data-tone={d.nhip === 'dung' ? 'la' : d.nhip === 'cham' ? 'do' : 'vang'}>
                            {CHU_NHIP[d.nhip]}
                          </span>
                        </div>
                        <div className="gv2-o-thanh">
                          <div className="gvm-nho">Thành thạo · vạch = mức cần hôm nay</div>
                          {d.thanhThao === null ? <span className="gv2-nhat">chưa đọc được bảng</span> : <ThanhTienDo tiLe={d.thanhThao} vach={d.mucCan} />}
                        </div>
                        <div>
                          <div className="gvm-nho">Chậm nhịp</div>
                          <VongNhip tre={d.treNhip} tong={d.soEm} />
                        </div>
                        <div className="gvm-dang">
                          <div className="gvm-nho">Dạng yếu nhất của lớp</div>
                          {d.dangYeu ? (
                            <>
                              <span className="gvm-chip-dang">{d.dangYeu.ten}</span>
                              <span className="gv2-phu">
                                <span className="gv2-so">{phanTramSo(d.dangYeu.tiLe)}%</span> câu thành thạo
                              </span>
                            </>
                          ) : (
                            <span className="gv2-nhat">—</span>
                          )}
                        </div>
                        <div>
                          {d.cd.hanhTrinh || d.cd.id.startsWith('hanh-trinh-gioi-hoa-khoi-') || /^Hành trình giỏi Hóa/i.test(d.cd.ten) ? <>
                            <div className="gvm-nho">Kế hoạch</div>
                            <div className="gv2-dam">Theo ngày</div>
                            <div className="gv2-phu">Không hạn nộp</div>
                          </> : <>
                            <div className="gvm-nho">Hạn nộp</div>
                            <div className="gv2-dam">{chuHan(d.cd.hanNop, ngayVn(now))}</div>
                            <div className="gv2-phu gv2-so">23:59 · {d.cd.hanNop.slice(8, 10)}/{d.cd.hanNop.slice(5, 7)}</div>
                          </>}
                        </div>
                      </li>
                    ))}
                  </ul>
                )}
              </section>

              <section className="gv2-the" aria-labelledby="tq-bd">
                <div className="gv2-the-dau">
                  <h2 id="tq-bd" className="gv2-the-tieu-de">
                    Bài nộp ca kiểm tra mỗi ngày
                  </h2>
                  <span className="gv2-phu">14 ngày qua · đơn vị: bài</span>
                </div>
                <BieuDoNgay du={bieuDo} />
              </section>
            </div>

            <div className="gv2-cot-phu">
              <section className={`gv2-the${ca ? ' gv2-the--mo' : ''}`} aria-labelledby="tq-ca">
                <div className="gv2-the-dau">
                  <h2 id="tq-ca" className="gv2-the-tieu-de">
                    Ca đang mở
                  </h2>
                  {caMo.length > 1 && <span className="gv2-phu">{caMo.length} ca</span>}
                </div>
                {!ca ? (
                  <p className="gv2-nhat">{du.loiCa ? 'Chưa đọc được danh sách ca.' : 'Không có ca nào đang mở.'}</p>
                ) : (
                  <>
                    <div className="gv2-ca-ten">{ca.tenCa || `Ca ${ca.maCa}`}</div>
                    <div className="gv2-phu">
                      {ca.lop && `${ca.lop} · `}
                      <span className="gv2-so">{ca.thoiGianPhut}</span> phút · bắt đầu <span className="gv2-so">{gioPhutVN(ca.batDau || ca.moLuc)}</span> · mã {ca.maCa}
                    </div>
                    <div className="gv2-ba-so">
                      <div>
                        <div className="gv2-nhan">Đã vào</div>
                        <div className="gv2-so gv2-so-lon">
                          {ca.daVao}
                          {moiCa > 0 && <small> / {moiCa} em</small>}
                        </div>
                      </div>
                      <div>
                        <div className="gv2-nhan">Đã nộp</div>
                        <div className="gv2-so gv2-so-lon">
                          {ca.daNop}
                          <small> / {ca.daVao} em</small>
                        </div>
                      </div>
                      <div>
                        <div className="gv2-nhan">Rời màn</div>
                        <div className="gv2-so gv2-so-lon">
                          {ca.canhBao}
                          <small> lần</small>
                        </div>
                      </div>
                    </div>
                    <ThanhCa daNop={ca.daNop} daVao={ca.daVao} moi={moiCa} />
                    <button type="button" className="gv2-nut-chinh gv2-nut-rong" onClick={() => moChiTietCa(ca.maCa)}>
                      Theo dõi ca
                    </button>
                  </>
                )}
              </section>

              <section className="gv2-the" aria-labelledby="tq-viec">
                <div className="gv2-the-dau">
                  <h2 id="tq-viec" className="gv2-the-tieu-de">
                    Việc cần làm
                  </h2>
                </div>
                {viec.length === 0 ? (
                  <p className="gv2-nhat">Không có việc cần làm ngay.</p>
                ) : (
                  // Hộp cuộn (thầy 05/10): danh sách dài không đẩy cả trang xuống.
                  <div className="gv2-viec-cuon" tabIndex={0} role="region" aria-label={`Việc cần làm · ${viec.length} việc`}>
                  <ul className="gv2-viec">
                    {viec.map((v) => {
                      const Icon = v.icon
                      return (
                        <li key={v.key}>
                          <span className="gv2-viec-icon" data-tone={v.tone} aria-hidden="true">
                            <Icon size={18} />
                          </span>
                          <span className="gv2-viec-chu">
                            <span className="gv2-dam">{v.chu}</span>
                            <span className="gv2-phu">{v.phu}</span>
                          </span>
                          <button type="button" className="gv2-nut-chu" onClick={v.lam} aria-label={`${v.nut}: ${v.chu} · ${v.phu}`}>
                            {v.nut} <ChevronRight size={16} aria-hidden="true" />
                          </button>
                        </li>
                      )
                    })}
                  </ul>
                  </div>
                )}
              </section>

              {/* Chất lượng sửa lỗi theo lớp (thầy 05/10): thẻ tự tải, máy chủ lỗi / chưa có lệnh ⇒ ẩn — phần cũ của màn không đổi. */}
              <TheChatLuongLoi />
              {/* KPI vòng chữa câu sai (Phase E, 07/10): tự tải, lỗi ⇒ ẩn. */}
              <KpiChuaCauSai />
            </div>
          </div>
        </>
      )}
    </div>
  )
}

/** Thẻ số "bản màu": tông theo NGHĨA (xd em/số lượng · xl thành thạo · hp trễ · ho cần chữa · tim dạng), biểu tượng trong ô vuông tròn góc. */
function TheSo({ nhan, so, donVi, phu, tone, mau, icon: Icon }: { nhan: string; so: string; donVi: string; phu: string; tone?: 'la' | 'do'; mau: 'xd' | 'xl' | 'hp' | 'ho' | 'tim'; icon: LucideIcon }) {
  return (
    <div className="gv2-the gv2-the-so" data-mau={mau}>
      <div className="gv2-nhan">
        <span className="gv2-the-so-bt" aria-hidden="true">
          <Icon size={20} strokeWidth={2.2} />
        </span>
        {nhan}
      </div>
      <div className="gv2-so-dong">
        <span className="gv2-so gv2-so-kpi">{so}</span> <span className="gv2-don-vi">{donVi}</span>
      </div>
      <div className="gv2-phu" data-tone={tone}>
        {phu}
      </div>
    </div>
  )
}

/** Vòng nhịp: phần tô = em ĐÚNG nhịp (xanh lục; có em trễ thì hổ phách); số in cạnh — không chỉ màu. */
function VongNhip({ tre, tong }: { tre: number; tong: number }) {
  const C = 2 * Math.PI * 14
  const dung = tong > 0 ? Math.max(0, tong - tre) / tong : 0
  return (
    <div className="gvm-nhip">
      <svg viewBox="0 0 36 36" aria-hidden="true">
        <circle cx="18" cy="18" r="14" className="gvm-vong-nen" />
        {dung > 0 && <circle cx="18" cy="18" r="14" className="gvm-vong" data-tre={tre > 0 ? '' : undefined} strokeDasharray={`${(dung * C).toFixed(1)} ${C.toFixed(1)}`} transform="rotate(-90 18 18)" />}
      </svg>
      <span className="gv2-so">
        <b>{tre}</b> / {tong} em
      </span>
    </div>
  )
}

/** Thanh tiến độ dải xanh lục + vạch cam (hổ phách) = mức lớp cần đạt hôm nay; số in cạnh (không chỉ màu). */
export function ThanhTienDo({ tiLe, vach }: { tiLe: number; vach: number }) {
  const pt = phanTramSo(tiLe)
  const can = phanTramSo(vach)
  return (
    <div className="gv2-tien-do">
      <div className="gv2-tien-do-chu">
        <span>
          <b className="gv2-so">{pt}%</b> thành thạo
        </span>
        <span className="gv2-phu">cần {can}%</span>
      </div>
      <div className="gv2-thanh" role="img" aria-label={`${pt}% câu thành thạo, mức cần hôm nay ${can}%`}>
        <span className="gv2-thanh-day" style={{ width: `${Math.min(100, pt)}%` }} />
        <span className="gv2-thanh-vach" style={{ left: `${Math.min(100, can)}%` }} />
      </div>
    </div>
  )
}

function ThanhCa({ daNop, daVao, moi }: { daNop: number; daVao: number; moi: number }) {
  const tong = Math.max(moi, daVao, 1)
  const dangLam = Math.max(0, daVao - daNop)
  const chuaVao = moi > daVao ? moi - daVao : 0
  return (
    <div className="gv2-ca-thanh-khoi">
      <div className="gv2-ca-thanh" role="img" aria-label={`Đã nộp ${daNop}, đang làm ${dangLam}${moi > 0 ? `, chưa vào ${chuaVao}` : ''}`}>
        <span data-tone="nop" style={{ width: `${(daNop / tong) * 100}%` }} />
        <span data-tone="lam" style={{ width: `${(dangLam / tong) * 100}%` }} />
      </div>
      <div className="gv2-chu-thich">
        <span>
          <i data-tone="nop" /> Đã nộp <b className="gv2-so">{daNop}</b>
        </span>
        <span>
          <i data-tone="lam" /> Đang làm <b className="gv2-so">{dangLam}</b>
        </span>
        {moi > 0 && (
          <span>
            <i data-tone="chua" /> Chưa vào <b className="gv2-so">{chuaVao}</b>
          </span>
        )}
      </div>
    </div>
  )
}

function BieuDoNgay({ du }: { du: { ngay: string; so: number }[] }) {
  const max = Math.max(1, ...du.map((d) => d.so))
  const tong = du.reduce((s, d) => s + d.so, 0)
  if (tong === 0) return <p className="gv2-nhat">Chưa có bài nộp nào trong 14 ngày qua.</p>
  const W = 600
  const H = 120
  const x = (i: number) => (du.length > 1 ? (i / (du.length - 1)) * W : W / 2)
  const y = (v: number) => H - (v / max) * (H - 8)
  const duong = du.map((d, i) => `${i === 0 ? 'M' : 'L'}${x(i).toFixed(1)},${y(d.so).toFixed(1)}`).join(' ')
  const vung = `${duong} L${W},${H} L0,${H} Z`
  const cuoi = du[du.length - 1]
  const nhan = (n: string) => `${n.slice(8, 10)}/${n.slice(5, 7)}`
  return (
    <figure className="gv2-bieu-do">
      <div className="gv2-bieu-do-khung">
        <div className="gv2-truc-y gv2-so" aria-hidden="true">
          <span>{soVi(max)}</span>
          <span>{soVi(max / 2)}</span>
          <span>0</span>
        </div>
        <svg viewBox={`0 0 ${W} ${H}`} preserveAspectRatio="none" role="img" aria-label={`Bài nộp mỗi ngày, 14 ngày qua: tổng ${soVi(tong)} bài, hôm nay ${soVi(cuoi.so)} bài`}>
          <path d={vung} className="gv2-bd-vung" />
          <path d={duong} className="gv2-bd-duong" vectorEffect="non-scaling-stroke" />
        </svg>
      </div>
      <figcaption className="gv2-truc-x gv2-so">
        <span>{nhan(du[0].ngay)}</span>
        <span>
          hôm nay <b>{soVi(cuoi.so)}</b> bài · 14 ngày <b>{soVi(tong)}</b> bài
        </span>
        <span>{nhan(cuoi.ngay)}</span>
      </figcaption>
    </figure>
  )
}
