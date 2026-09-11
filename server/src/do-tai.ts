// TRANG ĐO TẢI — do chính Worker phục vụ.
//
// VÌ SAO PHẢI CÙNG NGUỒN: máy dựng bản này không ra được internet, nên không tự
// bắn được lượt gọi. Trang đo chạy trong trình duyệt của thầy; đặt nó ngay trên
// Worker thì không vướng CORS, không vướng luật chặn tên miền của tiện ích.
//
// AN TOÀN: mọi dòng trang này ghi đều nằm trong ca `DOTAI` — hằng số chết trong
// mã, không nhận từ ngoài. Lệnh dọn cũng chỉ xoá đúng `ma_ca = 'DOTAI'`. Không
// có đường nào để trang này chạm tới dữ liệu thật của học sinh.
export const CA_DO_TAI = 'DOTAI'

export const TRANG_DO_TAI = `<!doctype html>
<html lang="vi"><head><meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<title>Đo tải máy chủ mới</title>
<style>
:root{--nen:#faf9f7;--muc:#1c1a17;--mo:#6b6560;--vien:#e3ded7;--xanh:#1a7f5a;--do:#b3261e;--vang:#9a6b00}
*{box-sizing:border-box}
body{margin:0;padding:24px 16px;background:var(--nen);color:var(--muc);
  font:15px/1.55 -apple-system,BlinkMacSystemFont,"Segoe UI",system-ui,sans-serif}
main{max-width:880px;margin:0 auto}
h1{font-size:22px;margin:0 0 4px}
p.mo{color:var(--mo);margin:0 0 20px;font-size:14px}
.hop{background:#fff;border:1px solid var(--vien);border-radius:10px;padding:16px;margin-bottom:16px}
button{font:inherit;font-weight:600;padding:10px 18px;border-radius:8px;border:1px solid var(--muc);
  background:var(--muc);color:#fff;cursor:pointer}
button.phu{background:#fff;color:var(--muc)}
button:disabled{opacity:.45;cursor:not-allowed}
table{width:100%;border-collapse:collapse;font-variant-numeric:tabular-nums;font-size:14px}
th,td{text-align:right;padding:7px 8px;border-bottom:1px solid var(--vien)}
th:first-child,td:first-child{text-align:left}
th{font-size:12px;text-transform:uppercase;letter-spacing:.04em;color:var(--mo);font-weight:600}
.dat{color:var(--xanh);font-weight:600}.truot{color:var(--do);font-weight:600}
#nhatky{font:12px/1.5 ui-monospace,SFMono-Regular,Menlo,monospace;white-space:pre-wrap;
  color:var(--mo);max-height:220px;overflow:auto;margin:0}
.cuon{overflow-x:auto}
</style></head><body><main>
<h1>Đo tải máy chủ mới</h1>
<p class="mo">Mỗi “em ảo” chạy đủ ba bước thật: vào thi → lưu tạm → nộp. Dữ liệu ghi vào ca <code>DOTAI</code>, không đụng ca thật.</p>

<div class="hop">
  <button id="chay">Đo 10 · 20 · 30 · 50 lượt đồng thời</button>
  <button id="don" class="phu">Dọn dữ liệu đo</button>
</div>

<div class="hop cuon">
  <table id="bang"><thead><tr>
    <th>Đồng thời</th><th>Lệnh</th><th>p50 ms</th><th>p95 ms</th><th>Cao nhất</th><th>Lỗi</th>
  </tr></thead><tbody><tr><td colspan="6" style="text-align:center;color:var(--mo)">chưa đo</td></tr></tbody></table>
</div>

<div class="hop"><pre id="nhatky">sẵn sàng.</pre></div>
</main>
<script>
const $ = (s) => document.querySelector(s)
const ghi = (t) => { $('#nhatky').textContent += '\\n' + t; $('#nhatky').scrollTop = 1e9 }
const phanVi = (a, p) => { if (!a.length) return 0; const b=[...a].sort((x,y)=>x-y); return Math.round(b[Math.min(b.length-1, Math.floor(b.length*p))]) }

async function goi(duong, than) {
  const t0 = performance.now()
  try {
    const r = await fetch(duong, { method:'POST', headers:{'content-type':'application/json'}, body: JSON.stringify(than) })
    const j = await r.json()
    return { ms: performance.now() - t0, ok: r.ok && j.ok !== false, j }
  } catch (e) { return { ms: performance.now() - t0, ok:false, loi:String(e) } }
}

async function motEm(i) {
  const sbd = 'DOTAI' + String(i).padStart(4,'0')
  const a = await goi('/vao-thi', { maCa:'DOTAI', sbd, idThietBi:'do-tai-'+i })
  const b = await goi('/luu-tam', { maCa:'DOTAI', sbd, dapAn:{ c1:'A', c2:'B', c3:'C' } })
  const c = await goi('/nop',     { maCa:'DOTAI', sbd, dapAn:{ c1:'A', c2:'B', c3:'C' }, integrity:{ leaveCount:0, totalHiddenMs:0 } })
  return { a, b, c }
}

async function mucDo(n) {
  await fetch('/do-tai/don', { method:'POST' })
  const t0 = performance.now()
  const kq = await Promise.all(Array.from({length:n}, (_,i) => motEm(i+1)))
  const tong = Math.round(performance.now() - t0)
  const hang = []
  for (const [ten, khoa] of [['vào thi','a'],['lưu tạm','b'],['nộp','c']]) {
    const ds = kq.map(k => k[khoa])
    const ms = ds.map(x => x.ms)
    hang.push({ n, ten, p50:phanVi(ms,.5), p95:phanVi(ms,.95), max:Math.round(Math.max(...ms)), loi:ds.filter(x=>!x.ok).length })
  }
  ghi(n + ' lượt đồng thời — xong cả ba bước trong ' + tong + ' ms')
  const hong = kq.flatMap(k => [k.a,k.b,k.c]).filter(x => !x.ok)
  if (hong.length) ghi('  lỗi mẫu: ' + JSON.stringify(hong[0].loi ?? hong[0].j))
  return hang
}

$('#chay').onclick = async () => {
  $('#chay').disabled = $('#don').disabled = true
  $('#nhatky').textContent = 'bắt đầu đo…'
  const tbody = $('#bang tbody'); tbody.innerHTML = ''
  for (const n of [10,20,30,50]) {
    for (const h of await mucDo(n)) {
      const tr = document.createElement('tr')
      tr.innerHTML = '<td>' + h.n + '</td><td>' + h.ten + '</td><td>' + h.p50 + '</td><td>' + h.p95 +
        '</td><td>' + h.max + '</td><td class="' + (h.loi ? 'truot':'dat') + '">' + h.loi + '</td>'
      tbody.appendChild(tr)
    }
  }
  ghi('đo xong.')
  $('#chay').disabled = $('#don').disabled = false
}

$('#don').onclick = async () => {
  const r = await (await fetch('/do-tai/don', { method:'POST' })).json()
  ghi('đã dọn ' + (r.xoa ?? 0) + ' dòng của ca DOTAI.')
}
</script></body></html>`
