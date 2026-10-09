// BUỔI CHỮA khi chiến dịch hết hạn nộp (bản vẽ docs/ban-ve-gv-2809/GV-BuoiChua, thầy chốt 28/09) — dữ liệu từ `buoi-chua`.
// Đầu màn: 3 nút (Mở ca chốt · Chữa xong · Mở tờ máy chiếu = nút chính); 5 thẻ số (đã làm qua / thành thạo cuối kỳ, câu xếp sẵn, thời gian, tiến độ Đạt/Chưa đạt).
// Bảng câu xếp sẵn (điểm chữa = chưa thành thạo + 2 × cần dạy lại, mỗi dạng một câu), người lên bảng (giải mẫu + sửa),
// thời gian ước lượng bằng CÙNG công thức của Gọi lên bảng (`thoiGianCau`), tổng ≤ 90 phút, mỗi em có mặt ≥ 1 lượt (`xepBuoiChua`).
// Nút chính "Mở tờ máy chiếu" (luồng tờ chiếu có sẵn), "Chữa xong" (hỏi lại, nói rõ hậu quả) ⇒ `chua-xong`, "Mở ca chốt".
// Kết quả Đạt / Chưa đạt thầy bấm trên tờ chiếu (`ghi-to-chieu.ts`) hiện lại ở cột "Người lên bảng" của đúng câu.
// OMNI 3 (05/10): OMNI bật cho lớp của chiến dịch ⇒ "Mở ca chốt" lấy câu từ `/gv/omni ca-chot` (ca chốt 50/50) thay danh sách cũ, gói ghi `omni: true`
// để màn Mở ca mở xong gọi `gan-ca-chot`. Màn cha (`LenBangChienDich`) đọc sẵn và truyền `caChotOmni` (nút vẫn bấm một chạm như cũ; màn này không tự gọi
// lệnh nào khi mở); vắng ⇒ đúng danh sách cũ.
import { useMemo, useState } from 'react'
import { useAppStore } from '../../store/appStore'
import { thoiGianCau } from '../../lib/thoi-gian-len-bang'
import { KHOA_CA_CHOT, type GoiCaChot } from '../../lib/ca-chot-chien-dich'
import HopXacNhan from '../HopXacNhan'
import { chuaXong, qidCuaDong, type BuoiChuaMayChu, type CauCanDayLai, type EmTen } from './api'
import type { GoiCaChotOmni } from './api-omni'
import type { BangKetQua } from './ghi-to-chieu'
import { congNgay, hienHanNop, hienNgay } from './ngay'
import { noiDungCua, type CauGoc, type OChieu } from './to-chieu'
import { cauCaChot, CHU_HANG, chuNguoiSua, saoTuMucDo, xepBuoiChua, type DongBuoiChua } from './tinh'
import './chien-dich.css'

/** Khoá phiên màn Mở ca kiểm tra đọc để chọn sẵn câu của ca chốt (nguồn: `lib/ca-chot-chien-dich.ts`). */
export { KHOA_CA_CHOT }

export function oChieuTuDong(dong: readonly DongBuoiChua[]): OChieu[] {
  return dong.map((d) => {
    const nguoi = d.giaiMau
    return {
      qid: d.cau.qid,
      stt: d.cau.stt,
      phan: d.cau.phan,
      mucDo: d.cau.mucDo,
      sbd: nguoi?.sbd ?? '',
      ten: nguoi?.ten ?? 'Thầy chữa',
      viSao: nguoi
        ? `Đã tự làm đúng ${nguoi.soLanDung ?? 1} lần${nguoi.vuotMuc ? ' · năng lực vượt mức câu' : ''}`
        : 'Không có học sinh có mặt đã tự làm đúng câu này — thầy chữa',
    }
  })
}

export default function BuoiChua({
  du,
  dsEm,
  coMat,
  canDayLai,
  homNay,
  tra,
  ketQua = {},
  dangChieu,
  onChieu,
  onMoDiemDanh,
  onDaChua,
  caChotOmni = null,
}: {
  du: BuoiChuaMayChu
  /** Mọi em của chiến dịch (để chọn em có mặt). */
  dsEm: EmTen[]
  /** SBD em đã được thầy điểm danh có mặt. */
  coMat: string[]
  canDayLai: CauCanDayLai[]
  homNay: string
  tra: ReadonlyMap<string, CauGoc>
  /** Kết quả lên bảng đã ghi (khoá `sbd|qid`), từ tờ máy chiếu. */
  ketQua?: BangKetQua
  dangChieu: boolean
  onChieu: (ds: OChieu[], tenBuoi: string) => Promise<boolean>
  /** Quay lại bước mã điểm danh để lấy lại danh sách có mặt từ máy chủ. */
  onMoDiemDanh: () => void
  onDaChua: () => void
  /** OMNI 3: câu ca chốt 50/50 từ `/gv/omni ca-chot` (màn cha đọc sẵn). Vắng ⇒ "Mở ca chốt" dùng danh sách cũ. */
  caChotOmni?: GoiCaChotOmni | null
}) {
  const showToast = useAppStore((s) => s.showToast)
  const setScreen = useAppStore((s) => s.setScreen)
  const [hoiChua, setHoiChua] = useState(false)
  const [dangChua, setDangChua] = useState(false)
  const [daChua, setDaChua] = useState<{ soLuot: number; ngayOnLai: string } | null>(null)
  // OMNI 3: gói ca chốt 50/50 (màn cha đọc sẵn khi OMNI áp cho lớp của chiến dịch). null ⇒ danh sách cũ.
  const goiOmni = caChotOmni

  const emCoMat = useMemo(() => dsEm.filter((e) => coMat.includes(e.sbd)), [dsEm, coMat])
  const kq = useMemo(
    () =>
      xepBuoiChua(du.cau, emCoMat, (c) =>
        thoiGianCau({ phan: c.phan, sao: saoTuMucDo(c.mucDo), noiDung: noiDungCua(tra, c.qid), tiLeLopSai: du.soEm ? c.soChuaThanhThao / du.soEm : 0 }).tong,
      ),
    [du, emCoMat, tra],
  )
  const phut = (giay: number) => Math.ceil(giay / 60)
  /** Em (của câu này) đã có kết quả lên bảng — người giải mẫu trước, rồi người sửa, rồi em khác có mặt. */
  const ketQuaCua = (d: DongBuoiChua) => {
    const ds = [d.giaiMau, ...d.sua, ...emCoMat].filter((e): e is EmTen => !!e)
    const daXet = new Set<string>()
    const ra: { em: EmTen; kq: 'dat' | 'khong_dat' }[] = []
    for (const em of ds) {
      if (daXet.has(em.sbd)) continue
      daXet.add(em.sbd)
      const kq = ketQua[`${em.sbd}|${d.cau.qid}`]
      if (kq) ra.push({ em, kq })
    }
    return ra
  }
  const luotDayLai = kq.dong.reduce((s, d) => s + d.cau.soCanDayLai, 0)
  // Tiến độ buổi chữa: câu đã có kết quả trên tờ chiếu; câu có em Chưa đạt ⇒ Chưa đạt, còn lại Đạt.
  const ketQuaDong = kq.dong.map((d) => {
    const r = ketQuaCua(d)
    return r.length === 0 ? null : r.some((x) => x.kq === 'khong_dat') ? 'khong_dat' : 'dat'
  })
  const soDat = ketQuaDong.filter((x) => x === 'dat').length
  const soChuaDat = ketQuaDong.filter((x) => x === 'khong_dat').length
  const soDaChua = soDat + soChuaDat
  const giayDaDung = kq.dong.reduce((s, d, i) => s + (ketQuaDong[i] ? d.giay : 0), 0)
  const maxDiem = Math.max(1, ...kq.dong.map((d) => d.cau.soChuaThanhThao + 2 * d.cau.soCanDayLai))
  const ngayMai = congNgay(homNay, 1)
  const caChot = cauCaChot(
    kq.dong.map((d) => d.cau),
    canDayLai,
  )

  const chua = async () => {
    setDangChua(true)
    const r = await chuaXong(du.chienDich.id, kq.dong.flatMap((d) => qidCuaDong(d.cau)), coMat)
    setDangChua(false)
    setHoiChua(false)
    if (!r.ok) {
      showToast(r.chu, 'warn')
      return
    }
    setDaChua(r.du)
    showToast(`Đã ghi chữa xong: ${r.du.soLuot} lượt em, ôn lại từ ${hienNgay(r.du.ngayOnLai)}`, 'success')
    onDaChua()
  }

  const qidsCaChot = goiOmni?.qids ?? caChot
  const moCaChot = () => {
    // Màn Mở ca kiểm tra đọc gói này MỘT LẦN khi mở (tích sẵn tờ + câu, hiện dòng "Đang mở ca chốt…") rồi xoá.
    const goi: GoiCaChot = { chienDichId: du.chienDich.id, ten: du.chienDich.ten, lop: du.chienDich.lop, qids: qidsCaChot, ...(goiOmni ? { omni: true } : {}) }
    try {
      sessionStorage.setItem(KHOA_CA_CHOT, JSON.stringify(goi))
    } catch {
      showToast(`Máy chặn bộ nhớ phiên: thầy tự chọn ${qidsCaChot.length} câu của chiến dịch ${du.chienDich.ten} ở màn Mở ca`, 'warn')
    }
    setScreen('examsetup')
  }

  return (
    <>
      <div className="cd-dau">
        <div>
          <p className="cd-duong-dan">Chữa trên lớp › Buổi chữa</p>
          <h1>
            Buổi chữa · {du.chienDich.ten}
            {du.chienDich.lop ? ` · ${du.chienDich.lop}` : ''}
          </h1>
          <p className="cd-so">
            Chiến dịch đã hết hạn nộp lúc {hienHanNop(du.chienDich.hanNop, false).replace(' · ', ' ')} · đã điểm danh {emCoMat.length}/{dsEm.length || emCoMat.length} em ·{' '}
            <button
              type="button"
              className="m3-nut-chu cd-nut-nho"
              style={{ padding: '0 8px', display: 'inline-flex', verticalAlign: 'baseline' }}
              onClick={onMoDiemDanh}
            >
              Cập nhật điểm danh bằng mã
            </button>
          </p>
        </div>
        <div className="cd-hang-nut">
          <button
            type="button"
            className="m3-nut-vien cd-nut-nho"
            disabled={qidsCaChot.length === 0}
            onClick={moCaChot}
            title={goiOmni ? `Ca chốt 50/50: ${goiOmni.soCu} câu của bài + ${goiOmni.soLa} câu chưa gặp cùng dạng (thư mục TU LUYỆN)` : undefined}
          >
            Mở ca chốt · {qidsCaChot.length} câu
          </button>
          <button type="button" className="m3-nut-vien cd-nut-nho" disabled={!!daChua || kq.dong.length === 0} onClick={() => setHoiChua(true)}>
            {daChua ? 'Đã chữa xong' : 'Chữa xong'}
          </button>
          <button type="button" className="m3-nut-chinh" disabled={kq.dong.length === 0 || dangChieu} onClick={() => void onChieu(oChieuTuDong(kq.dong), `Buổi chữa · ${du.chienDich.ten}`)}>
            {dangChieu ? 'Đang mở tờ chiếu…' : 'Mở tờ máy chiếu'}
          </button>
        </div>
      </div>

      <div className="cd-kpi-hang" data-khoi="o-so-buoi-chua">
        <div className="cd-kpi" data-mau="xd">
          <span className="cd-kpi-nhan" title="Câu em đã làm ít nhất 1 lần">
            Đã làm qua cuối kỳ
          </span>
          <strong data-so="da-lam-qua">
            {Math.round(du.lop.coXat * 100)}
            <small>% câu</small>
          </strong>
          <span className="cd-kpi-phu cd-so">{du.soEm} em có mặt · trung bình lớp</span>
        </div>
        <div className="cd-kpi" data-mau="xl">
          <span className="cd-kpi-nhan" title="Câu đúng đủ lịch ôn, lần cuối đúng">
            Thành thạo cuối kỳ
          </span>
          <strong data-so="thanh-thao">
            {Math.round(du.lop.thanhThao * 100)}
            <small>% câu</small>
          </strong>
          <span className="cd-kpi-phu">trung bình lớp</span>
        </div>
        <div className="cd-kpi" data-mau="ho">
          <span className="cd-kpi-nhan">Câu chữa xếp sẵn</span>
          <strong data-so="buoi-chua">
            {kq.dong.length}
            <small>câu</small>
          </strong>
          <span className="cd-kpi-phu">mỗi dạng yếu một câu</span>
        </div>
        <div className="cd-kpi" data-mau="tim">
          <span className="cd-kpi-nhan">Thời gian dự kiến</span>
          <strong data-so="thoi-gian">
            {phut(kq.tongGiay)}
            <small>/ {phut(kq.nganSachGiay)} phút</small>
          </strong>
          <span className="cd-kpi-phu cd-so" data-so="co-luot">
            {kq.soEmCoLuot}/{kq.soEmCoMat} em có lượt lên bảng
          </span>
        </div>
        <div className="cd-kpi" data-mau="xd">
          <span className="cd-kpi-nhan">Tiến độ buổi chữa</span>
          <strong data-so="tien-do">
            {soDaChua}
            <small>/ {kq.dong.length} câu</small>
          </strong>
          <span className="cd-kpi-phu cd-so">
            <span className="cd-chu-xanh">Đạt {soDat}</span> · <span className="cd-chu-do">Chưa đạt {soChuaDat}</span> · đã dùng {phut(giayDaDung)} / {phut(kq.tongGiay)} phút
          </span>
        </div>
      </div>

      <section className="cd-the" aria-label="Bảng câu buổi chữa">
        {kq.dong.length === 0 ? (
          <p className="cd-phu">
            {(du.daChuaTruoc ?? 0) > 0
              ? `Đã chữa hết các dạng của chiến dịch này (${du.daChuaTruoc} dạng). Không còn câu nào cần chữa thêm.`
              : 'Không còn câu nào cần chữa: mọi em có mặt đã thành thạo các câu của chiến dịch.'}
          </p>
        ) : (
          <div role="table" aria-label="Câu chữa xếp sẵn" className="cd-bang-chua cd-cuon-doc" tabIndex={0}>
            <div className="cd-the-dau">
              <h2>Câu chữa xếp sẵn · điểm chữa cao trước</h2>
              {(du.daChuaTruoc ?? 0) > 0 && <span className="cd-phu" data-khoi="da-chua-truoc">Đã chữa {du.daChuaTruoc} dạng ở buổi trước; buổi này xếp tiếp các dạng còn lại.</span>}
            </div>
            <div className="cd-hang-chua cd-hang-chua--dau" role="row">
              <span role="columnheader">#</span>
              <span role="columnheader">Câu · dạng · mức độ</span>
              <span role="columnheader">Vì sao chữa</span>
              <span role="columnheader">Điểm chữa</span>
              <span role="columnheader">Người lên bảng</span>
              <span role="columnheader">Thời gian</span>
              <span role="columnheader">Kết quả</span>
            </div>
            {kq.dong.map((d, i) => (
              <div key={d.cau.qid} className="cd-hang-chua" role="row" data-hang-chua={d.cau.qid}>
                <span className="cd-hang-so" role="cell">
                  {i + 1}
                </span>
                <span role="cell">
                  <b>Câu {d.cau.stt}</b> · {d.cau.dang}
                  {d.cau.mucDo && <small className="cd-phu cd-dong-phu">{d.cau.mucDo}</small>}
                </span>
                <span role="cell">
                  <span className="cd-thanh-vi-sao" aria-hidden="true">
                    <span className="cd-vs-chua" style={{ width: `${(100 * Math.max(0, d.cau.soChuaThanhThao - d.cau.soCanDayLai)) / maxDiem}%` }} />
                    <span className="cd-vs-day" style={{ width: `${(100 * 2 * d.cau.soCanDayLai) / maxDiem}%` }} />
                  </span>
                  {d.cau.soChuaThanhThao} em chưa thành thạo
                  {(d.cau.soEmDaChua ?? 0) > 0 && ` · ${d.cau.soEmDaChua} em đã chữa dạng này`}
                  {d.cau.soCanDayLai > 0 && (
                    <>
                      {' · '}
                      <b>{d.cau.soCanDayLai} cần dạy lại</b>
                    </>
                  )}
                </span>
                <span className="cd-so" role="cell">
                  <span className="cd-nhan-hep">Điểm chữa: </span>
                  {d.cau.diemChua}
                </span>
                <span role="cell">
                  {d.giaiMau ? (
                    <>
                      Giải mẫu: {d.giaiMau.ten}
                      {typeof d.giaiMau.soLanDung === 'number' && ` · đúng ${d.giaiMau.soLanDung} lần`}
                      {d.giaiMau.vuotMuc && ` · ${d.giaiMau.hang ? CHU_HANG[d.giaiMau.hang] : 'năng lực'} vượt mức câu`}
                    </>
                  ) : 'Thầy chữa'}
                  {d.sua.length > 0 ? ` · ${chuNguoiSua(d.sua)}` : ''}
                  {ketQuaCua(d).map(({ em, kq }) => (
                    <span key={em.sbd} className={`cd-ket-qua cd-ket-qua--${kq === 'dat' ? 'dat' : 'khong'}`} data-ket-qua={`${em.sbd}|${d.cau.qid}`}>
                      {em.ten}: {kq === 'dat' ? 'Đạt' : 'Chưa đạt'}
                    </span>
                  ))}
                </span>
                <span className="cd-so" role="cell">
                  {phut(d.giay)} phút
                </span>
                <span role="cell">
                  <span className={`cd-chip-muc cd-chip-muc--${ketQuaDong[i] === 'dat' ? 'xanh' : ketQuaDong[i] === 'khong_dat' ? 'do' : 'xam'}`} data-ket-qua-cau={ketQuaDong[i] ?? 'chua'}>
                    {ketQuaDong[i] === 'dat' ? 'Đạt' : ketQuaDong[i] === 'khong_dat' ? 'Chưa đạt' : 'Chưa chữa'}
                  </span>
                </span>
              </div>
            ))}
          </div>
        )}
        <p className="cd-phu">
          <span className="cd-cham cd-vs-chua" aria-hidden="true" /> Em chưa thành thạo (1 điểm/em) · <span className="cd-cham cd-vs-day" aria-hidden="true" /> Em cần dạy lại (2 điểm/em).
          Cách xếp: điểm chữa = số em chưa thành thạo + 2 × số em cần thầy dạy lại · mỗi dạng 1 câu đại diện · tổng ≤ {phut(kq.nganSachGiay)} phút · mỗi em có mặt ≥ 1 lượt.
          {kq.boCau.length > 0 && ` Còn ${kq.boCau.length} câu điểm chữa thấp chưa vừa giờ buổi này (Câu ${kq.boCau.map((c) => c.stt).join(', ')}): bấm “Chữa xong” khi chữa hết, các câu ấy tự xếp thành buổi chữa tiếp theo.`}
        </p>
        {kq.vuotNganSach && (
          <p className="cd-loi">
            Lớp đông: cho mỗi em một lượt thì buổi chữa cần {phut(kq.tongGiayDayDu)} phút, vượt {phut(kq.nganSachGiay)} phút. Đã giữ {kq.dong.length} câu; {kq.soEmCoLuot}/{kq.soEmCoMat} em có lượt lên bảng, các em còn lại theo dõi và chữa chung cả lớp.
          </p>
        )}
      </section>

      <p className="cd-phu" aria-live="polite">
        {daChua
          ? `Đã chữa xong: ${daChua.soLuot} lượt em được mở khoá, vào Đoàn Hộ Tống từ ${hienNgay(daChua.ngayOnLai)}.`
          : `Bấm “Chữa xong” khi chữa hết: ${luotDayLai} lượt em cần dạy lại được mở khoá, vào Đoàn Hộ Tống từ ${hienNgay(ngayMai, false)}. Kết quả Đạt / Chưa đạt thầy bấm trên tờ máy chiếu, hiện lại ở cột Kết quả.`}
      </p>

      {hoiChua && (
        <HopXacNhan
          tieuDe="Chữa xong buổi này?"
          noiDung={
            <p>
              Ghi {kq.dong.length} câu vừa chữa (Câu {kq.dong.map((d) => d.cau.stt).join(', ')}) là đã chữa trên lớp: khoảng {luotDayLai} lượt em đang “Cần thầy dạy lại” được mở khoá và các câu này quay lại Đoàn Hộ Tống của các em từ {hienNgay(ngayMai)}. Việc này không hoàn tác được.
            </p>
          }
          nhanXacNhan="Chữa xong"
          nhanDangLam="Đang ghi…"
          dangLam={dangChua}
          onXacNhan={() => void chua()}
          onHuy={() => setHoiChua(false)}
        />
      )}

    </>
  )
}
