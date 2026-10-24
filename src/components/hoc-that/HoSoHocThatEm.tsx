// HỒ SƠ «HỌC THẬT» CỦA MỘT EM (app thầy, trong hồ sơ học sinh — thầy 24/10). Tải lười khi thầy mở.
// Tuần này (tính trực tiếp) · lý do bằng số · số liệu cách làm · tiến bộ thật · các tuần đã lưu · nhật ký can thiệp + nút · hồ sơ bằng chứng (bậc 4–5).
// (24/10 thầy bỏ mục chép tin gửi Zalo — phụ huynh xem báo cáo tuần ngay trong app phụ huynh.)
import { useEffect, useState } from 'react'
import { hoiXacNhan } from '../hop-thoai'
import {
  ghiCanThiep, layEmHocThat, ngayNgan, ptChu, TEN_CAN_THIEP,
  type HoSoHocThat, type LoaiCanThiepThay, type TuanGv,
} from '../../lib/hoc-that-api'
import { ChipBac } from './BangHocThat'
import './hoc-that.css'

const TEN_TIEN_BO = { dang_tien: 'Đang tiến', dung_yen: 'Đứng yên', di_lui: 'Đi lùi', chua_ro: 'Chưa rõ' } as const
const TEN_VIEC: Record<string, string> = {
  nhac_em: 'Máy đề nghị nhắc em (tuần Đối phó đầu tiên).',
  bao_ph: 'Máy đề nghị báo phụ huynh (Đối phó tuần thứ hai liền).',
  goi_ph_mo_cam_ket: 'Đề nghị: thầy gọi phụ huynh và mở cam kết 14 ngày.',
  xac_nhan_nghi: 'Máy kết luận ĐUỔI. Phụ huynh chỉ nhận thông báo khi thầy bấm «Xác nhận cho nghỉ».',
}
/** ISO ⇒ "19/10 08:05" theo giờ Việt Nam (UTC+7, không đổi giờ mùa). */
const gio = (iso: string) => { const t = Date.parse(iso); if (!Number.isFinite(t)) return iso; const v = new Date(t + 7 * 3600_000).toISOString(); return `${v.slice(8, 10)}/${v.slice(5, 7)} ${v.slice(11, 16)}` }

export default function HoSoHocThatEm({ sbd }: { sbd: string }) {
  const [hs, setHs] = useState<HoSoHocThat | null>(null)
  const [loi, setLoi] = useState('')
  const [dang, setDang] = useState(false)
  const tai = async () => {
    const r = await layEmHocThat(sbd)
    if (r.ok) { setHs(r.du); setLoi('') } else setLoi(r.chu)
  }
  useEffect(() => { void tai() }, [sbd])
  const bam = async (loai: LoaiCanThiepThay) => {
    if (loai === 'xac_nhan_nghi' && !(await hoiXacNhan({ tieuDe: 'Xác nhận cho em nghỉ?', noiDung: 'Phụ huynh sẽ thấy thông báo cho nghỉ trong app. Việc này ghi vào nhật ký, không xoá được.', nhanDongY: 'Xác nhận cho nghỉ', nguyHiem: true }))) return
    if (loai === 'gian_lan_xac_nhan' && !(await hoiXacNhan({ tieuDe: 'Xác nhận em gian lận?', noiDung: 'Hai lần gian lận đã xác nhận trong 4 tuần ⇒ máy xếp ĐUỔI.', nhanDongY: 'Xác nhận gian lận', nguyHiem: true }))) return
    setDang(true)
    const r = await ghiCanThiep(sbd, loai)
    setDang(false)
    if (!r.ok) setLoi(r.chu)
    await tai()
  }

  if (!hs) return <p className="ht-giai" role="status">{loi || 'Đang tính tuần này…'}</p>
  const h = hs.hienTai
  return (
    <div className="ht-khung">
      {loi && <p className="ht-giai" role="alert" style={{ color: 'var(--do)' }}>{loi}</p>}
      {h ? <TuanNay h={h} /> : <p className="ht-giai">Chưa tính được tuần này.</p>}

      {h && h.bac >= 4 && h.bangChung && (
        <div className="ht-canh">
          <p className="ht-tieu">Hồ sơ bằng chứng · {h.bac === 5 ? 'ĐUỔI' : 'Không dạy nổi'}</p>
          <table className="ht-bang"><thead><tr><th>Tuần</th><th>Điểm Thật</th><th>Bậc</th></tr></thead>
            <tbody>{h.bangChung.map((b) => <tr key={b.tuan}><td>{ngayNgan(b.tuan)}</td><td>{Math.round(b.diem)}</td><td><ChipBac bac={b.bac} /></td></tr>)}</tbody></table>
          {hs.canThiep.length > 0 && <p className="ht-giai" style={{ marginTop: 'var(--k2)' }}>Đã can thiệp {hs.canThiep.length} lần · em đã xem {hs.canThiep.filter((c) => c.emXem).length} · phụ huynh đã xem {hs.canThiep.filter((c) => c.phXem).length}.</p>}
        </div>
      )}

      <div className="ht-the">
        <p className="ht-tieu">Can thiệp</p>
        {h?.viec && <p className="ht-giai" style={{ marginBottom: 'var(--k2)' }}>{TEN_VIEC[h.viec] ?? ''}</p>}
        <div className="ht-hang">
          {(['nhac_em', 'thay_goi_ph', 'cam_ket', 'cho_them'] as const).map((l) => <button key={l} type="button" className="ht-nut" disabled={dang} onClick={() => void bam(l)}>{TEN_CAN_THIEP[l]}</button>)}
          <button type="button" className="ht-nut ht-nut--nguy" disabled={dang} onClick={() => void bam('gian_lan_xac_nhan')}>{TEN_CAN_THIEP.gian_lan_xac_nhan}</button>
          {h && h.bac === 5 && <button type="button" className="ht-nut ht-nut--nguy" disabled={dang} onClick={() => void bam('xac_nhan_nghi')}>{TEN_CAN_THIEP.xac_nhan_nghi}</button>}
        </div>
        {hs.canThiep.length > 0 && (
          <table className="ht-bang" style={{ marginTop: 'var(--k2)' }}><thead><tr><th>Lúc</th><th>Việc</th><th>Ai</th><th>Đã xem</th></tr></thead>
            <tbody>{hs.canThiep.map((c) => <tr key={c.id}><td>{gio(c.guiLuc)}</td><td>{TEN_CAN_THIEP[c.loai] ?? c.loai}</td><td>{c.taoBoi === 'thay' ? 'Thầy' : 'Máy'}</td><td>{[c.emXem && 'em', c.phXem && 'phụ huynh'].filter(Boolean).join(', ') || 'chưa'}</td></tr>)}</tbody></table>
        )}
      </div>

      {hs.lichSu.length > 0 && (
        <div className="ht-the">
          <p className="ht-tieu">Các tuần đã lưu</p>
          <table className="ht-bang"><thead><tr><th>Tuần</th><th>Điểm Thật</th><th>Bậc</th></tr></thead>
            <tbody>{hs.lichSu.map((t) => <tr key={t.tuan}><td>{ngayNgan(t.tuan)}</td><td>{Math.round(t.diem)}</td><td><ChipBac bac={t.bac} /></td></tr>)}</tbody></table>
        </div>
      )}
    </div>
  )
}

function TuanNay({ h }: { h: TuanGv }) {
  const s = h.soLieu, t = h.tienBo
  return (
    <>
      <div className="ht-the">
        <div className="ht-hang" style={{ justifyContent: 'space-between' }}>
          <p className="ht-tieu" style={{ margin: 0 }}>Tuần này · 14 ngày gần nhất</p>
          <span className="ht-hang"><b className="ht-diem" title="Điểm Thật">{Math.round(h.diem)}/100</b><ChipBac bac={h.bac} /></span>
        </div>
        {!h.duDuLieu && <p className="ht-giai">Chưa đủ dữ liệu: máy chưa xếp Đối phó vì vài lượt.</p>}
        {h.lyDo.length > 0 && <ul className="ht-phat" style={{ marginTop: 'var(--k2)' }}>{h.lyDo.map((x) => <li key={x}>{x}</li>)}</ul>}
      </div>
      {h.phat.length > 0 && (
        <div className="ht-the">
          <p className="ht-tieu">Lý do trừ điểm</p>
          <ul className="ht-phat">{h.phat.map((p) => <li key={p.ma + p.chu}><span>{p.chu}{p.coDo ? ' · cờ đỏ' : ''}</span><span className="ht-tru">−{p.diem}</span></li>)}</ul>
        </div>
      )}
      {s && (
        <div className="ht-the">
          <p className="ht-tieu">Cách làm bài</p>
          <div className="ht-luoi">
            <div className="ht-o"><span>Lượt làm</span><b>{s.soLuot}</b></div>
            <div className="ht-o"><span>Đo được giờ làm</span><b>{s.soDo}</b></div>
            <div className="ht-o"><span>Thuộc (nhanh mà đúng)</span><b>{s.soThuoc}</b></div>
            <div className="ht-o"><span>Bấm vội (nhanh mà sai)</span><b>{s.soBamVoi}</b></div>
            <div className="ht-o"><span>Treo máy / cố tình treo</span><b>{s.soTreo} / {s.soCoTinh}</b></div>
            <div className="ht-o"><span>Đúng khi nhanh / khi chậm</span><b>{ptChu(s.nhanDung)} / {ptChu(s.chamDung)}</b></div>
            <div className="ht-o"><span>Đúng câu gốc / bản song sinh</span><b>{ptChu(s.dungGoc)} / {ptChu(s.dungSongSinh)}</b></div>
            <div className="ht-o"><span>Bỏ kiểm tra cá nhân</span><b>{ptChu(s.boKtcn)}</b></div>
          </div>
        </div>
      )}
      {t && (
        <div className="ht-the">
          <p className="ht-tieu">Tiến bộ thật · {TEN_TIEN_BO[t.nhan]}</p>
          <div className="ht-luoi">
            <div className="ht-o"><span>Đúng bản khác của câu từng sai</span><b>{ptChu(t.dungBanKhac)}</b></div>
            <div className="ht-o"><span>Kiểm tra cá nhân, xu hướng điểm</span><b>{t.ktcnXuHuong === null ? '—' : `${t.ktcnXuHuong > 0 ? '+' : ''}${t.ktcnXuHuong.toFixed(1).replace('.', ',')}`}</b></div>
          </div>
        </div>
      )}
    </>
  )
}
