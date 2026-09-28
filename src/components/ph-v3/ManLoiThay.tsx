// Mục "Lời thầy" (bản vẽ khổ 4): khối anh hùng = thư tuần của Bộ não A.I (khi có) hoặc nhận xét mới nhất của thầy; cảnh báo của thầy (đã xem / chưa xem);
// nhận xét sau từng ca kiểm tra đã công bố (bấm mở màn chi tiết ca). Không có lời nào ⇒ một thẻ trống nói rõ.
import type { ViewPhMoi } from '../../lib/ph-moi/use-tat-ca-ve-con'
import type { NhanXetCa } from '../../lib/ph-v3/du-lieu'
import type { CanhBaoThay } from '../../lib/canh-bao-thay-hien-thi'
import { chuGuiLuc, chuHanNop, tieuDeCanhBao } from '../../lib/canh-bao-thay-hien-thi'
import { ngayDayDuVn, soVn } from '../../lib/ph-moi/dinh-dang'
import { BtAi, BtChuong, BtPhai, BtTich } from './BieuTuong'
import { Chip, DangTai, The, TheLoi, TheTrong } from './dung-chung'
import { lienKetCa } from './tien-ich'

export default function ManLoiThay({ v, loiThay, thuLaiLoiThay, canhBao, onDaXem }: {
  v: ViewPhMoi
  loiThay: { ds: NhanXetCa[] | null; chuLoi: string }
  thuLaiLoiThay: () => void
  canhBao: CanhBaoThay[]
  onDaXem: (id: string) => void
}) {
  const pm = v.pm
  const thu = pm?.loiBoNao ?? null
  const ds = loiThay.ds
  const moiNhat = ds?.[0] ?? null
  const coLoi = !!(thu && (thu.thuTuan || thu.loi)) || canhBao.length > 0 || (ds?.length ?? 0) > 0
  const nay = pm?.serverNow ?? Date.now()
  return (
    <div data-vung="man-loi-thay">
      <div className="ph3-tieu-de"><h1>Lời thầy</h1></div>
      {!pm && v.trangThai !== 'loi' && ds === null ? (
        <DangTai />
      ) : (
        <div className="ph3-luoi">
          {thu && (thu.thuTuan || thu.loi) ? (
            <section className="ph3-ah ph3-o-rong" aria-labelledby="ph3-thu" data-vung="thu-tuan">
              <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                <span className="ph3-o-bt" style={{ background: 'var(--ph3-ah-o)', color: 'var(--ph3-vong-tim)' }} aria-hidden="true"><BtAi /></span>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 2, minWidth: 0 }}>
                  <h2 id="ph3-thu" style={{ fontSize: 17 }}>{thu.thuTuan ? 'Thư tuần về con' : 'Lời nhắn hôm nay về con'}</h2>
                  {thu.ngay && <span className="ph3-ah__ky">{ngayDayDuVn(`${thu.ngay}T12:00:00+07:00`)}</span>}
                </div>
              </div>
              <p className="ph3-ah__thu">{thu.thuTuan || thu.loi}</p>
              <span className="ph3-ah__ky">Bộ não A.I hỗ trợ riêng em {pm?.hoTen || 'của anh/chị'}</span>
            </section>
          ) : moiNhat ? (
            <section className="ph3-ah ph3-o-rong" aria-labelledby="ph3-nx-moi" data-vung="nhan-xet-moi">
              <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                <span className="ph3-o-bt" data-mau="thay" aria-hidden="true">ĐH</span>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 2, minWidth: 0 }}>
                  <h2 id="ph3-nx-moi" style={{ fontSize: 17 }}>Nhận xét mới nhất của thầy</h2>
                  <span className="ph3-ah__ky">{moiNhat.tenCa}{moiNhat.nopLuc ? ` · ${ngayDayDuVn(moiNhat.nopLuc)}` : ''}</span>
                </div>
              </div>
              <p className="ph3-ah__thu">{moiNhat.noiDung}</p>
              <a className="ph3-ah__chip" href={lienKetCa(moiNhat.maCa)} style={{ alignSelf: 'flex-start', minHeight: 44 }}>Xem bài làm của ca này<BtPhai co={16} day={2.5} /></a>
            </section>
          ) : null}

          {canhBao.length > 0 && (
            <The id="ph3-cb" className="ph3-o-hep" vung="canh-bao-thay" tieuDe="Cảnh báo của thầy" bieuTuong={<BtChuong />} mau="ho">
              <ul style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                {canhBao.map((cb) => (
                  <li key={cb.id} className={`ph3-canh-bao${cb.daXem ? ' ph3-canh-bao--da-xem' : ''}`}>
                    <span className="ph3-canh-bao__dau">{chuGuiLuc(cb)}</span>
                    <p><b>{tieuDeCanhBao(cb, 'phuhuynh')}</b></p>
                    {cb.loi && <p>{cb.loi}</p>}
                    <p>{chuHanNop(cb, nay)}</p>
                    {cb.daXem ? (
                      <Chip mau="xl" nho><BtTich co={12} day={3} />Đã xem</Chip>
                    ) : (
                      <button type="button" className="ph3-nut-vien" style={{ alignSelf: 'flex-start' }} onClick={() => onDaXem(cb.id)}>Đã xem cảnh báo</button>
                    )}
                  </li>
                ))}
              </ul>
            </The>
          )}

          {loiThay.chuLoi && !ds ? (
            <TheLoi chu={loiThay.chuLoi} thuLai={thuLaiLoiThay} />
          ) : ds && ds.length > 0 ? (
            <The id="ph3-ds-nx" className="ph3-o-hep" vung="ds-nhan-xet" tieuDe="Nhận xét sau từng ca kiểm tra" bieuTuong="ĐH" mau="thay">
              <ul className="ph3-ds-nx">
                {ds.map((x) => (
                  <li key={x.maCa}>
                    <a href={lienKetCa(x.maCa)}>
                      <span className="ph3-ds-nx__dong"><b>{x.tenCa}</b>{x.tong !== null && <b>{soVn(x.tong)}</b>}</span>
                      {(x.nopLuc || x.capNhatLuc) && <span className="ph3-ds-nx__ngay">{ngayDayDuVn(x.nopLuc || x.capNhatLuc)}</span>}
                      <span className="ph3-ds-nx__noi">{x.noiDung}</span>
                      <span className="ph3-nut-chu" style={{ minHeight: 0 }}>Xem bài làm<BtPhai co={16} day={2.5} /></span>
                    </a>
                  </li>
                ))}
              </ul>
            </The>
          ) : null}

          {!coLoi && ds !== null && (
            <TheTrong id="ph3-lt-trong" tieuDe="Chưa có lời nào của thầy" chu="Khi thầy nhận xét bài kiểm tra của con hoặc gửi cảnh báo, lời của thầy hiện ở đây." />
          )}
        </div>
      )}
    </div>
  )
}
