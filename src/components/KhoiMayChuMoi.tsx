// CÀI ĐẶT → MÁY CHỦ MỚI (MAY-CHU-MOI.md mục 8).
//
// Ba thứ và chỉ ba thứ: địa chỉ · cờ bật · nút thử. Không giấu trạng thái nào
// sau lớp chữ đẹp — thầy phải nhìn ra ngay là đang chạy đường nào.
//
// CỜ MẶC ĐỊNH TẮT. Bật rồi mà máy chủ mới hỏng thì từng lượt gọi TỰ rơi về
// Apps Script, em không thấy gì khác ngoài chậm hơn một nhịp.
import { useEffect, useState } from 'react'
import { NutChinh, OThongBao } from './DesignSystem'
import { loadCauHinhMayChu, loadScriptUrl, loadTeacherSecret, saveCauHinhMayChu } from '../lib/exam-db'
import { MAC_DINH_MAY_CHU, type CauHinhMayChu } from '../lib/cau-hinh-may-chu'
import { quenCauHinhMayChu, thuKetNoi } from '../lib/may-chu-moi'
import { laySoSheet, napToanBoCaLenMayChuMoi } from '../lib/exam-api'
import { CHUA_DUNG, daChuyenXong, dungBangDoiChieu, laySoMayChuMoi, type DongDoiChieu } from '../lib/doi-chieu-hai-ben'

const NHAN_NHO: React.CSSProperties = { fontFamily: 'var(--sans)', fontSize: 'var(--cx-1)', color: 'var(--nhat)', lineHeight: 1.6 }
const O_NHAP: React.CSSProperties = {
  height: 46,
  width: '100%',
  borderRadius: 'var(--bo-1)',
  padding: '0 var(--k4)',
  background: 'var(--the-2)',
  border: '1.5px solid transparent',
  fontFamily: 'var(--serif)',
  fontSize: 'var(--cx-2)',
  color: 'var(--muc)',
  outline: 'none',
}

export default function KhoiMayChuMoi({ showToast }: { showToast: (chu: string, kieu?: 'success' | 'error' | 'warn') => void }) {
  const [ch, setCh] = useState<CauHinhMayChu>(MAC_DINH_MAY_CHU)
  const [dangThu, setDangThu] = useState(false)
  const [ketQua, setKetQua] = useState<{ ok: boolean; chu: string } | null>(null)
  const [dangNap, setDangNap] = useState(false)
  const [tienNap, setTienNap] = useState('')
  const [ketNap, setKetNap] = useState<{ ok: boolean; chu: string } | null>(null)
  const [dangDo, setDangDo] = useState(false)
  const [bang, setBang] = useState<DongDoiChieu[] | null>(null)
  const [loiDo, setLoiDo] = useState('')

  useEffect(() => {
    // NUỐT LỖI Ở ĐÂY LÀ CỐ Ý. Khối cài đặt này nằm trong màn Ngân hàng đề —
    // IndexedDB hỏng hoặc bị chặn mà để lỗi ném ra thì React gỡ nguyên cả màn,
    // thầy mất luôn chỗ nạp đề vì một ô cấu hình phụ. Đọc không được thì dùng
    // mặc định (cờ TẮT), đúng thứ an toàn nhất.
    Promise.resolve()
      .then(loadCauHinhMayChu)
      .then(setCh)
      .catch(() => setCh(MAC_DINH_MAY_CHU))
  }, [])

  async function luu(moi: CauHinhMayChu) {
    setCh(moi)
    await saveCauHinhMayChu(moi).catch(() => showToast('Không ghi được cấu hình vào máy', 'error'))
    // Bộ nhớ tạm sống 5 giây; xoá ngay để thầy gạt cờ là có tác dụng tức thì.
    quenCauHinhMayChu()
  }

  async function thu() {
    setDangThu(true)
    setKetQua(null)
    const r = await thuKetNoi(ch.URL)
    setKetQua(r)
    setDangThu(false)
  }

  /** CHUYỂN TOÀN BỘ CA VÀ LƯỢT THI CŨ SANG MÁY CHỦ MỚI — chạy một lần.
   *
   * Chỉ ĐỌC Apps Script và GHI vào D1, không xoá gì ở Sheet. Xong thì tự đối
   * chiếu số ca và số dòng lượt hai bên; **lệch một dòng cũng không ghi dấu**,
   * và màn Ca thi tiếp tục đọc đường cũ. Không có trạng thái nào ở giữa. */
  /** ĐO HAI BÊN — việc đầu tiên của cả đợt bỏ Apps Script.
   *
   * Chỉ ĐỌC, không ghi một dòng nào ở cả hai đầu. Gọi bao nhiêu lần cũng được. */
  async function doHaiBen() {
    setDangDo(true)
    setBang(null)
    setLoiDo('')
    try {
      const url = (await loadScriptUrl()) ?? ''
      const mat = (await loadTeacherSecret()) ?? ''
      if (!url || !mat) throw new Error('Thiếu link Apps Script hoặc mã bí mật')
      const [sheet, moi] = await Promise.all([laySoSheet(url, mat), laySoMayChuMoi(ch, mat)])
      if (!moi) throw new Error('Máy chủ mới không trả lời — kiểm địa chỉ rồi bấm Thử kết nối')
      setBang(dungBangDoiChieu(sheet, moi))
    } catch (e) {
      setLoiDo(e instanceof Error ? e.message : 'Không đo được')
    } finally {
      setDangDo(false)
    }
  }

  async function chuyenCa() {
    if (dangNap) return
    if (!ch.BAT || !ch.URL.trim()) return showToast('Bật máy chủ mới trước đã', 'error')
    setDangNap(true)
    setKetNap(null)
    setTienNap('đang đọc danh sách ca…')
    try {
      const [url, mat] = await Promise.all([loadScriptUrl(), loadTeacherSecret()])
      if (!url.trim() || !mat.trim()) throw new Error('Thiếu link Apps Script hoặc mã bí mật')
      const kq = await napToanBoCaLenMayChuMoi(url.trim(), mat.trim(), (xong, tong, viec) => {
        setTienNap(`${xong}/${tong} · ${viec}`)
      })
      // NÓI RÕ LỆCH Ở ĐÂU, không chỉ nói "không khớp". Lượt chạy 15h10 báo
      // không khớp mà không ai biết vì sao — thầy không có gì để lần.
      const phan = [`Sheet ${kq.soCa} ca / ${kq.soLuot} lượt`, `máy chủ mới ${kq.soCaD1} ca / ${kq.soLuotD1} lượt`]
      if (kq.lechCa !== 0) phan.push(`lệch ${kq.lechCa} ca`)
      if (kq.lechLuot > 0) phan.push(`thiếu ${kq.lechLuot} lượt`)
      setKetNap({
        ok: kq.khop,
        chu: kq.khop
          ? `Đã chuyển và ĐỐI CHIẾU KHỚP: ${phan.join(' · ')}. Màn Ca thi từ giờ đọc máy chủ mới.`
          : `CHƯA khớp — ${phan.join(' · ')}. Màn Ca thi vẫn đọc Apps Script như cũ.`,
      })
      showToast(kq.khop ? 'Màn Ca thi đã sang máy chủ mới' : 'Chưa khớp — vẫn đọc đường cũ', kq.khop ? 'success' : 'warn')
    } catch (e) {
      setKetNap({ ok: false, chu: e instanceof Error ? e.message : 'Không chuyển được' })
    } finally {
      setDangNap(false)
      setTienNap('')
    }
  }

  async function gatCo(bat: boolean) {
    if (bat && !ch.URL.trim()) return showToast('Điền địa chỉ máy chủ trước đã', 'error')
    if (bat) {
      // KHÔNG cho bật mù. Bật khi máy chủ chưa sẵn sàng là cả lớp vào ca rồi mới
      // phát hiện, giữa giờ thi.
      setDangThu(true)
      const r = await thuKetNoi(ch.URL)
      setDangThu(false)
      setKetQua(r)
      if (!r.ok) return showToast('Chưa bật được — ' + r.chu, 'error')
    }
    await luu({ ...ch, BAT: bat })
    showToast(bat ? 'Đã bật máy chủ mới' : 'Đã tắt — quay về Apps Script', bat ? 'success' : 'warn')
  }

  return (
    <div className="flex flex-col" style={{ gap: 'var(--k3)' }}>
      <div className="font-bold" style={{ fontFamily: 'var(--serif)', fontSize: 'var(--cx-2)' }}>
        Máy chủ mới (Cloudflare)
      </div>

      <div>
        <div style={{ ...NHAN_NHO, marginBottom: 'var(--k1)' }}>Địa chỉ Worker</div>
        <input
          style={O_NHAP}
          value={ch.URL}
          onChange={(e) => setCh({ ...ch, URL: e.target.value })}
          onBlur={() => luu(ch)}
          placeholder="https://omr.ttadodaihoc.workers.dev"
          autoComplete="off"
        />
      </div>

      <div className="flex items-center" style={{ gap: 'var(--k2)' }}>
        <NutChinh variant="phu" onClick={thu} disabled={dangThu || !ch.URL.trim()}>
          {dangThu ? 'Đang thử…' : 'Thử kết nối'}
        </NutChinh>
        <NutChinh variant={ch.BAT ? 'nguyhiem' : undefined} onClick={() => gatCo(!ch.BAT)} disabled={dangThu}>
          {ch.BAT ? 'Tắt, quay về Apps Script' : 'Bật máy chủ mới'}
        </NutChinh>
      </div>

      {ketQua && <OThongBao tone={ketQua.ok ? 'xanh' : 'do'}>{ketQua.chu}</OThongBao>}

      <div className="flex items-center" style={{ gap: 'var(--k2)' }}>
        <NutChinh variant="phu" onClick={chuyenCa} disabled={dangNap || !ch.BAT}>
          {dangNap ? 'Đang chuyển…' : 'Chuyển ca cũ sang máy chủ mới'}
        </NutChinh>
        {dangNap && <span style={NHAN_NHO}>{tienNap}</span>}
      </div>

      {ketNap && <OThongBao tone={ketNap.ok ? 'xanh' : 'do'}>{ketNap.chu}</OThongBao>}

      <div style={{ height: 1, background: 'var(--vien)', margin: 'var(--k2) 0' }} />

      <div className="flex items-center" style={{ gap: 'var(--k2)' }}>
        <NutChinh variant="phu" onClick={doHaiBen} disabled={dangDo || !ch.URL.trim()}>
          {dangDo ? 'Đang đo…' : 'Đối chiếu Sheet ↔ máy chủ mới'}
        </NutChinh>
      </div>

      {loiDo && <OThongBao tone="do">{loiDo}</OThongBao>}

      {bang && (
        <div>
          <OThongBao tone={daChuyenXong(bang) ? 'xanh' : 'cam'}>
            {daChuyenXong(bang)
              ? 'Hai bên khớp và không bảng nào còn thiếu.'
              : 'Chưa chuyển xong — xem dòng nào còn lệch hoặc chưa dựng ở bảng dưới.'}
          </OThongBao>
          <div style={{ marginTop: 'var(--k2)', display: 'grid', gap: 'var(--k2)' }}>
            {bang.map((d) => (
              <div key={d.ten} style={{ background: 'var(--the-2)', borderRadius: 'var(--bo-1)', padding: 'var(--k3)' }}>
                <div className="flex items-center" style={{ justifyContent: 'space-between', gap: 'var(--k2)' }}>
                  <span style={{ fontFamily: 'var(--sans)', fontSize: 'var(--cx-1)', color: 'var(--muc)' }}>{d.ten}</span>
                  <span style={{ fontFamily: 'var(--sans)', fontSize: 'var(--cx-1)', whiteSpace: 'nowrap' }}>
                    {d.mayChuMoi === CHUA_DUNG ? (
                      <b style={{ color: 'var(--nhat)' }}>chưa dựng</b>
                    ) : (
                      <>
                        <span style={{ color: 'var(--nhat)' }}>{d.sheet === null ? '—' : d.sheet}</span>
                        <span style={{ color: 'var(--nhat)' }}> → </span>
                        <b style={{ color: d.khop === false ? 'var(--do)' : 'var(--muc)' }}>{d.mayChuMoi}</b>
                        {d.khop === false && <span style={{ color: 'var(--do)' }}> lệch</span>}
                      </>
                    )}
                  </span>
                </div>
                <div style={{ ...NHAN_NHO, marginTop: 4 }}>{d.nghia}</div>
              </div>
            ))}
          </div>
          <div style={{ ...NHAN_NHO, marginTop: 'var(--k2)' }}>
            Số bên trái là Google Sheet, bên phải là máy chủ mới. Dấu — nghĩa là Apps
            {' '}Script không có số tương ứng để so, không phải bằng không.
            {' '}Nút này chỉ ĐỌC, không sửa gì ở cả hai nơi.
          </div>
        </div>
      )}

      <div style={NHAN_NHO}>
        Nút trên chỉ ĐỌC Apps Script và GHI vào máy chủ mới, không xoá gì ở Google Sheet.
        {' '}Chạy xong trong vài giây: nó chép ba số đếm Apps Script đã tính sẵn cho
        {' '}mỗi ca, không đọc lại chi tiết từng ca.
        {' '}Chuyển xong nó tự đối chiếu số ca và số lượt hai bên; lệch một dòng là
        {' '}màn Ca thi vẫn đọc đường cũ — thà chậm còn hơn đếm sai số em.
      </div>

      <div style={NHAN_NHO}>
        Đang chạy: <b>{ch.BAT ? 'máy chủ mới, hỏng thì tự rơi về Apps Script' : 'Apps Script như cũ'}</b>.
        {' '}Bật cờ chỉ đổi bốn lệnh lúc thi (hỏi phòng chờ · đẩy trạng thái · lưu tạm · nộp).
        Mọi việc khác của thầy vẫn đi Apps Script.
      </div>
      <div style={NHAN_NHO}>
        Ca thật đầu tiên bật cờ nên là một lớp nhỏ và thầy ngồi xem.
      </div>
    </div>
  )
}
