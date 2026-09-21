// ĐỌC / ĐỔI CỜ CỦA BỘ NÃO A.I trên máy chủ (`POST /ai/cau-hinh`). Mã bí mật đọc từ ~/.omr-bo-nao/ma-bi-mat qua `chung.mjs` — KHÔNG in, KHÔNG nhận qua tham số.
//   node scripts/bo-nao/cau-hinh.mjs              → chỉ ĐỌC
//   node scripts/bo-nao/cau-hinh.mjs that         → bật CHẠY THẬT cả trường
//   node scripts/bo-nao/cau-hinh.mjs bong         → về CHẠY THỬ
//   node scripts/bo-nao/cau-hinh.mjs tat | bat    → tắt / bật bộ não
import { docMaBiMat, taoGoiMayChu } from './chung.mjs'
const lenh = process.argv[2] || ''
const than = lenh === 'that' ? { cheDo: 'that' } : lenh === 'bong' ? { cheDo: 'bong' } : lenh === 'tat' ? { bat: false } : lenh === 'bat' ? { bat: true } : lenh === '' ? {} : null
if (than === null) { console.error('Tham số chỉ nhận: (trống) | that | bong | tat | bat'); process.exit(1) }
try {
  const { ma } = docMaBiMat()
  const goi = taoGoiMayChu({ ma })
  const r = await goi('/ai/cau-hinh', than)
  const c = r?.cauHinh ?? r
  console.log(`${lenh ? 'ĐÃ GỬI "' + lenh + '"' : 'ĐỌC'} → ok=${r?.ok} · bat=${c?.bat} · cheDo=${c?.cheDo} · lopThat=${JSON.stringify(c?.lopThat ?? [])}`)
} catch (e) { console.error(String(e?.message ?? e).slice(0, 200)); process.exit(2) }
