// THANH CHỌN BÚT GỌN + NAM CHÂM HÚT MÉP + TỰ MỜ (thầy 12/11: «Giữ nguyên bút hiện tại cho cả 2 chế độ học và bảng, thanh chọn bút làm cho nhỏ gọn lại
// tinh tế đẹp hơn và có nam châm hút vào mép các cạnh của màn hình tự động mờ di vào mới sáng. Tối ưu diện tích hiển thị nhé.»).
// BÚT KHÔNG ĐỔI (màu, cỡ nét, tẩy, hoàn tác, phím tắt, cách vẽ) — tệp này chỉ lo DÁNG và CHỖ ĐỨNG của thanh `.mc-but-cu`.
//   · `CSS_THANH_HUT` nối vào cuối `CSS_BUT_BANG`; `JS_THANH_HUT` chèn vào GIỮA `JS_BUT_BANG` (but-bang-to-chieu.ts), cùng phạm vi với bộ máy bút:
//     butCu · S · B · u · datThanh · oThanh. Tách tệp riêng vì cổng cỡ tệp.
//   · DÁNG: ô bấm vuông `--o` (≥ 32 px) xếp sát nhau, hình bên trong nhỏ (chấm màu 14 px, biểu tượng 16 px); thanh dày `--o` − 2 px, nền kính tối.
//   · HÚT MÉP: nắm thanh (vùng chấm ở đầu thanh, nền thanh, hoặc kéo từ một nút quá ngưỡng) ⇒ thả ra thanh trượt 180 ms và dính mép GẦN CON TRỎ NHẤT
//     (trên / dưới / trái / phải), giữ chỗ dọc theo mép (đổi ngang ↔ dọc thì tâm thanh về chỗ con trỏ); mép trái / phải ⇒ xếp dọc; mép dưới ⇒ nằm trên thanh đáy `.mc-thanh`.
//     Nhớ ở localStorage `ddh.but.thanh` = «mép:tỉ lệ» (tỉ lệ = tâm thanh / bề dài mép, 0..1). Chưa nhớ ⇒ mép trên, chỗ như cũ
//     (giữa màn; tờ có cột bảng đen ⇒ sát mép trái cột bảng).
//   · TỰ MỜ: nghỉ ⇒ mờ 0,32 + lùi 6 px sát mép; con trỏ (không đè nút) vào vùng 24 px quanh thanh hoặc tiêu điểm bàn phím trong thanh ⇒ sáng;
//     rời 1,2 giây ⇒ mờ lại. Nền kính (backdrop-filter) CHỈ bật lúc sáng ⇒ lúc đang viết không tốn công làm mờ nền mỗi khung hình.
//   · Công thức thuần ở dưới (TS) và trong `JS_LOI_HUT` (chuỗi chạy trên tờ) là MỘT; tests/but-thanh-hut-1211.test.ts so hai bên trên lưới điểm.

/** Mép màn mà thanh bút dính vào. */
export type MepHut = 'tren' | 'duoi' | 'trai' | 'phai'
/** Chỗ đã nhớ: mép + tỉ lệ tâm thanh dọc theo mép (0..1). */
export type NhoHut = { mep: MepHut; t: number }

/** Khe giữa thanh (lúc sáng) và mép màn, px. */
export const LE_HUT = 6
const MEP: MepHut[] = ['tren', 'duoi', 'trai', 'phai']

/** Kẹp v vào [a, b]; khoảng rỗng (b < a: thanh dài hơn màn) ⇒ a. */
export function kepHut(v: number, a: number, b: number): number { return b < a ? a : v < a ? a : v > b ? b : v }

/** Mép gần điểm (cx, cy) nhất — tờ đưa vào chỗ con trỏ lúc thả. `day` = bề cao thanh đáy (mép dưới tính từ đỉnh thanh đáy). Hoà ⇒ trên, dưới, trái, phải. */
export function chonMepHut(cx: number, cy: number, W: number, H: number, day: number): MepHut {
  const d = [cy, H - day - cy, cx, W - cx]
  let k = 0
  for (let i = 1; i < 4; i++) if (d[i] < d[k]) k = i
  return MEP[k]
}

/** Góc trên trái của thanh (rộng w, cao h) khi dính mép `m`, tâm ở tỉ lệ `t` dọc mép; luôn nằm trọn trong màn và trên thanh đáy. */
export function viTriThanhHut(m: MepHut, t: number, w: number, h: number, W: number, H: number, day: number): { x: number; y: number } {
  const ngang = m === 'tren' || m === 'duoi'
  return {
    x: Math.round(ngang ? kepHut(t * W - w / 2, LE_HUT, W - w - LE_HUT) : m === 'trai' ? LE_HUT : W - w - LE_HUT),
    y: Math.round(ngang ? (m === 'tren' ? LE_HUT : H - day - h - LE_HUT) : kepHut(t * H - h / 2, LE_HUT, H - day - h - LE_HUT)),
  }
}

/** Đọc chuỗi đã nhớ; hỏng / thiếu ⇒ null (mặc định mép trên như cũ). */
export function docNhoThanhHut(s: unknown): NhoHut | null {
  const p = String(s || '').split(':'), t = +p[1]
  return p.length === 2 && MEP.indexOf(p[0] as MepHut) >= 0 && p[1] !== '' && t >= 0 && t <= 1 ? { mep: p[0] as MepHut, t } : null
}

/** Chuỗi để nhớ. */
export function ghiNhoThanhHut(m: MepHut, t: number): string { return m + ':' + Math.round(kepHut(t, 0, 1) * 1000) / 1000 }

export const CSS_THANH_HUT = `
.mc-but-cu{--o:max(32px,calc(var(--u)*1.7));top:6px;transform:none;gap:0;padding:0 5px;border:1px solid color-mix(in srgb,var(--mc-b) 14%,transparent);border-radius:calc(var(--o)/2);background:color-mix(in srgb,var(--mc-thanh2) 84%,transparent);box-shadow:0 1px 5px color-mix(in srgb,var(--mc-den) 25%,transparent);opacity:.32;transition:opacity .12s,transform .18s cubic-bezier(.2,.8,.2,1);user-select:none;-webkit-user-select:none;white-space:nowrap;touch-action:none;cursor:grab}
.mc-but-cu:before{content:"";flex:none;width:8px;height:13px;margin:0 5px 0 4px;background:radial-gradient(circle,color-mix(in srgb,var(--mc-b) 50%,transparent) 1px,transparent 1.5px) 0 0/4px 5px}
.mc-but-cu[data-mep=trai],.mc-but-cu[data-mep=phai]{flex-direction:column;padding:5px 0}
.mc-but-cu[data-mep=trai]:before,.mc-but-cu[data-mep=phai]:before{width:13px;height:8px;margin:4px 0 5px;background-size:5px 4px}
.mc-but-cu[data-mep=tren]:not(.mc-sang){transform:translateY(-6px)}
.mc-but-cu[data-mep=duoi]:not(.mc-sang){transform:translateY(6px)}
.mc-but-cu[data-mep=trai]:not(.mc-sang){transform:translateX(-6px)}
.mc-but-cu[data-mep=phai]:not(.mc-sang){transform:translateX(6px)}
.mc-but-cu.mc-sang{opacity:1;-webkit-backdrop-filter:blur(8px);backdrop-filter:blur(8px)}
.mc-but-cu.mc-keo{transition:none;cursor:grabbing}
.mc-but-cu.mc-viet{opacity:.18;pointer-events:none}
.mc-but-cu .mc-m,.mc-but-cu .mc-n{flex:none;box-sizing:border-box;width:var(--o);height:var(--o);min-width:0;min-height:0;margin:-2px 0;border:0;border-radius:50%;background-clip:content-box!important}
.mc-but-cu[data-mep=trai] button,.mc-but-cu[data-mep=phai] button{margin:0 -2px}
.mc-but-cu .mc-m{padding:calc(var(--o)/2 - 7px)}
.mc-but-cu .mc-m.mc-chon{transform:none;box-shadow:none;outline:1.5px solid var(--mc-b);outline-offset:calc(11px - var(--o)/2)}
.mc-but-cu .mc-n{display:inline-flex;align-items:center;justify-content:center;padding:4px;background-color:transparent}
.mc-but-cu .mc-n:hover{background-color:color-mix(in srgb,var(--mc-b) 16%,transparent)}
.mc-but-cu .mc-n.mc-chon{background-color:var(--mc-b)}
.mc-but-cu .mc-n[disabled]{opacity:.32;cursor:default;background-color:transparent}
.mc-but-cu button:focus-visible{outline:2px solid var(--mc-vang-noi);outline-offset:-3px}
.mc-but-cu .mc-n svg{width:16px;height:16px;stroke-width:2;stroke-linecap:round;stroke-linejoin:round}
.mc-but-cu .mc-bv{align-self:center;height:14px;margin:0 3px}
.mc-but-cu[data-mep=trai] .mc-bv,.mc-but-cu[data-mep=phai] .mc-bv{width:14px;height:1px;margin:3px 0}
@media (prefers-reduced-motion:reduce){.mc-but-cu{transition:none}}
`

/** Công thức thuần chạy trên tờ (ES5) — cùng công thức với các hàm TS ở trên. */
export const JS_LOI_HUT = `
  var HUT = (function () {
    var LE = ${LE_HUT}, MEP = ['tren', 'duoi', 'trai', 'phai'];
    function kep(v, a, b) { return b < a ? a : v < a ? a : v > b ? b : v; }
    return {
      mep: function (cx, cy, W, H, day) { var d = [cy, H - day - cy, cx, W - cx], k = 0, i; for (i = 1; i < 4; i++) if (d[i] < d[k]) k = i; return MEP[k]; },
      viTri: function (m, t, w, h, W, H, day) {
        var ngang = m === 'tren' || m === 'duoi';
        return { x: Math.round(ngang ? kep(t * W - w / 2, LE, W - w - LE) : m === 'trai' ? LE : W - w - LE), y: Math.round(ngang ? (m === 'tren' ? LE : H - day - h - LE) : kep(t * H - h / 2, LE, H - day - h - LE)) };
      },
      doc: function (s) { var p = String(s || '').split(':'), t = +p[1]; return p.length === 2 && MEP.indexOf(p[0]) >= 0 && p[1] !== '' && t >= 0 && t <= 1 ? { mep: p[0], t: t } : null; },
      ghi: function (m, t) { return m + ':' + Math.round(kep(t, 0, 1) * 1000) / 1000; }
    };
  })();
`

export const JS_THANH_HUT = `${JS_LOI_HUT}
` + /* hNho = chỗ đã nhớ (null = mặc định) · hKeo = lượt nắm thanh · hMo = hẹn mờ · hGan = con trỏ đang ở gần thanh · hBat = bút bật ở lượt đặt trước · hVua = vừa thả sau khi kéo */ `
  var hNho = null, hKeo = null, hMo = 0, hGan = false, hBat = false, hVua = 0;
  try { hNho = HUT.doc(window.localStorage.getItem('ddh.but.thanh')); } catch (e) {}
  butCu.title = 'Nắm kéo để dời thanh bút · thả ra thanh tự dính vào mép màn';
  function hutDay() { var t = document.getElementById('mc-thanh'), r = t ? t.getBoundingClientRect() : null; return r && r.height ? Math.max(0, window.innerHeight - r.top) : 0; }
  function hutBanPhim() { try { return !!butCu.querySelector(':focus-visible'); } catch (e) { return false; } }
  function hutSang(b) {
    if (b) { clearTimeout(hMo); hMo = 0; butCu.classList.add('mc-sang'); }
    else if (!hMo) hMo = setTimeout(function () { hMo = 0; if (!hGan && !hKeo && !hutBanPhim()) butCu.classList.remove('mc-sang'); }, 1200);
  }
` + /* Đặt thanh vào mép đã nhớ (gọi từ datThanh mỗi lần tờ xếp lại / đổi cỡ cửa sổ). co = tờ có cột bảng đen ⇒ chỗ mặc định sát mép trái cột bảng. */ `
  function hutDat(co) {
    if (!S.but) { hBat = false; return; }
    if (hKeo && hKeo.keo) return;
    var W = window.innerWidth, H = window.innerHeight, m = hNho ? hNho.mep : 'tren', w, h, p;
    butCu.setAttribute('data-mep', m);
    w = butCu.offsetWidth; h = butCu.offsetHeight;
    p = HUT.viTri(m, hNho ? hNho.t : co ? (B[0] * W - u() * 0.9 - w / 2) / W : 0.5, w, h, W, H, hutDay());
    butCu.style.left = p.x + 'px'; butCu.style.top = p.y + 'px';
` + /* vừa bật bút ⇒ sáng một nhịp cho thầy thấy thanh ở đâu rồi mờ */ `
    if (!hBat) { hBat = true; hGan = false; hutSang(true); hutSang(false); }
  }
  butCu.addEventListener('pointerdown', function (e) {
    if (e.pointerType === 'mouse' && e.button !== 0) return;
    hutSang(true);
` + /* bút / ngón tay bấm nút hay run tay ⇒ ngưỡng kéo rộng hơn khi bắt đầu trên một nút */ `
    hKeo = { id: e.pointerId, x: e.clientX, y: e.clientY, l: butCu.offsetLeft, t: butCu.offsetTop, dx: 0, dy: 0, keo: false, ng: e.pointerType !== 'mouse' && e.target.closest && e.target.closest('button') ? 10 : 4 };
  });
  document.addEventListener('pointermove', function (e) {
    var k = hKeo, o = oThanh, x = e.clientX, y = e.clientY;
    if (k && e.pointerId === k.id) {
      k.dx = x - k.x; k.dy = y - k.y;
      if (!k.keo) {
        if (k.dx * k.dx + k.dy * k.dy < k.ng * k.ng) return;
        k.keo = true; butCu.classList.add('mc-keo');
        try { butCu.setPointerCapture(k.id); } catch (e2) {}
      }
      butCu.style.transform = 'translate(' + k.dx + 'px,' + k.dy + 'px)';
      return;
    }
    if (!S.but || !o) return;
` + /* đang đè nút (đang viết) thì không tính là «đi vào thanh» */ `
    k = !e.buttons && x > o.left - 24 && x < o.right + 24 && y > o.top - 24 && y < o.bottom + 24;
    if (k !== hGan) { hGan = k; hutSang(k); }
  }, { passive: true });
  function hutTha(e) {
    var k = hKeo, W = window.innerWidth, H = window.innerHeight, cx, cy, m, ngang, tx, ty;
    if (!k || e.pointerId !== k.id) return;
    hKeo = null;
` + /* thả xong luôn hẹn mờ; con trỏ còn ở gần thì lần rê kế tiếp bật sáng lại */ `
    hGan = false; hutSang(false);
    if (!k.keo) return;
    cx = k.l + k.dx + butCu.offsetWidth / 2; cy = k.t + k.dy + butCu.offsetHeight / 2;
` + /* mép = mép gần CON TRỎ nhất. Chỗ dọc mép: thanh giữ nguyên chiều ⇒ đúng chỗ vừa kéo tới; thanh đổi ngang ↔ dọc ⇒ tâm thanh về chỗ con trỏ */ `
    m = HUT.mep(e.clientX, e.clientY, W, H, hutDay()); ngang = m === 'tren' || m === 'duoi';
    if (ngang !== (butCu.offsetWidth >= butCu.offsetHeight)) { tx = e.clientX; ty = e.clientY; } else { tx = cx; ty = cy; }
    hNho = { mep: m, t: Math.min(1, Math.max(0, ngang ? tx / W : ty / H)) };
    try { window.localStorage.setItem('ddh.but.thanh', HUT.ghi(hNho.mep, hNho.t)); } catch (e2) {}
` + /* đặt vào chỗ mới ngay, rồi trượt từ chỗ vừa thả về (tâm → tâm, vì thanh có thể vừa đổi ngang ↔ dọc) */ `
    butCu.style.transform = ''; henThanh();
    butCu.style.transform = 'translate(' + Math.round(cx - butCu.offsetLeft - butCu.offsetWidth / 2) + 'px,' + Math.round(cy - butCu.offsetTop - butCu.offsetHeight / 2) + 'px)';
    void butCu.offsetWidth;
    butCu.classList.remove('mc-keo'); butCu.style.transform = '';
    hVua = e.timeStamp;
  }
  document.addEventListener('pointerup', hutTha); document.addEventListener('pointercancel', hutTha);
` + /* cú bấm sinh ra ngay sau khi thả thanh không được bấm vào nút nào */ `
  butCu.addEventListener('click', function (e) { if (hVua && e.timeStamp - hVua < 400) { e.stopPropagation(); e.preventDefault(); } hVua = 0; }, true);
  butCu.addEventListener('focusin', function () { if (hutBanPhim()) hutSang(true); });
  butCu.addEventListener('focusout', function () { hutSang(false); });
` + /* con trỏ ra khỏi cửa sổ (thanh nằm sát mép nên rất hay gặp) ⇒ không còn pointermove báo rời ⇒ tự hẹn mờ */ `
  document.documentElement.addEventListener('pointerleave', function () { hGan = false; hutSang(false); });
`
