// TRANG CHỤP TỜ CHIẾU THẬT (taoHtmlMayChieu → iframe srcdoc) nối với một "app thầy" GIẢ ngay trong trang: nghe tin của tờ (SAN_SANG · AI_SAI · HO_SO) và trả dữ liệu giả đúng hình tin thật.
// `?kich=thuong|dong|ngay-dau|chua-diem-danh` (nút X) · `?kich=em|em-chua-do` (bảng chi tiết em).
import { taoHtmlMayChieu, type OBang } from '../../src/lib/html-may-chieu'
import { TIN_TO_CHIEU } from '../../src/lib/to-chieu-cau-noi'
import { hoSoEmGia, luotSaiGia, type KichBan } from './du-lieu-chieu'

const MA = 'PHIEN-chup'
const kich = new URLSearchParams(location.search).get('kich') ?? 'thuong'
const o: OBang = {
  sbd: 'S2', hoTen: 'Lê Thu Hà', qid: 'Q12', soCau: 12, sao: 1,
  cau: { phan: 'I', id: 'Q12', text: 'Cho pin điện hóa Zn–Cu. Phát biểu nào sau đây đúng?', luaChon: ['Zn là cực âm', 'Cu là cực âm', 'Dòng electron đi từ Cu sang Zn', 'Anion di chuyển về phía cực Cu'], dapAn: 'A', buoc: [] } as unknown as OBang['cau'],
}
const f = document.createElement('iframe')
f.style.cssText = 'border:0;width:100vw;height:100vh;display:block'
f.srcdoc = taoHtmlMayChieu([o], { cauNoi: { maPhien: MA } })
document.body.append(f)
window.addEventListener('message', (e) => {
  if (e.source !== f.contentWindow) return
  const d = e.data as { type?: string; maPhien?: string; id?: string } | null
  if (!d || d.maPhien !== MA) return
  const gui = (m: Record<string, unknown>) => f.contentWindow!.postMessage({ maPhien: MA, ...m }, '*')
  if (d.type === TIN_TO_CHIEU.SAN_SANG) gui({ type: TIN_TO_CHIEU.KET_NOI })
  else if (d.type === TIN_TO_CHIEU.AI_SAI) gui({ type: TIN_TO_CHIEU.AI_SAI_TRA, id: d.id, conNua: false, ...luotSaiGia(kich as KichBan) })
  else if (d.type === TIN_TO_CHIEU.HO_SO) gui({ type: TIN_TO_CHIEU.HO_SO_TRA, id: d.id, hoSo: hoSoEmGia(kich === 'em-chua-do') })
})
