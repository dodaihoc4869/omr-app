// LỜI GIẢI THU GỌN TRÊN MÁY CHIẾU (thầy 07/11 «tất cả phần lời giải khi tôi bấm giải hiện trên máy chiếu đều chỉ hiện lời giải thu gọn thôi,
// hiện với hiệu ứng đẹp mắt hơn, phù hợp hiện đại với giao diện hiện tại»). Tờ chiếu chỉ dựng bản thu gọn (`oGiaiHtml`); CSS dưới đây:
//   · hộp lời giải mở ra từ trên xuống (clip-path) + trượt nhẹ — không dùng opacity / transform vì tờ đang khoá hai thuộc tính ấy bằng !important;
//   · từng dòng hiện nối tiếp (trượt + hết nhoè), cách nhau 70 ms, tối đa 12 dòng đầu;
//   · bước đang nói (Space) có vạch màu bên trái mọc lên + nền nhạt.
// Máy giảm chuyển động ⇒ hiện thẳng. Chỉ dùng biến màu sẵn có của tờ (--mc-*).
export const CSS_LOI_GIAI_GON = `
@keyframes mc-lg-mo{from{clip-path:inset(0 0 100% 0 round 16px);translate:0 14px}to{clip-path:inset(0 0 0 0 round 16px);translate:0 0}}
@keyframes mc-lg-dong{from{translate:0 .5em;filter:blur(5px)}to{translate:0 0;filter:none}}
@keyframes mc-lg-vach{from{scale:1 0}to{scale:1 1}}
body.mc .mc-giai:not([hidden])>.sol-box{animation:mc-lg-mo .6s cubic-bezier(.2,.8,.2,1) both;box-shadow:0 10px 32px color-mix(in srgb,var(--mc-ll-vien,currentColor) 40%,transparent)}
body.mc .mc-giai:not([hidden])>.sol-box>*{animation:mc-lg-dong .5s cubic-bezier(.2,.8,.2,1) both;animation-delay:.72s}
${Array.from({ length: 12 }, (_, i) => `body.mc .mc-giai:not([hidden])>.sol-box>:nth-child(${i + 1}){animation-delay:${180 + i * 70}ms}`).join('\n')}
body.mc .mc-giai .mc-buoc-nay{position:relative;background:color-mix(in srgb,var(--mc-ll-chon,transparent) 70%,transparent);border-radius:10px}
body.mc .mc-giai .mc-buoc-nay::before{content:"";position:absolute;left:-12px;top:.2em;bottom:.2em;width:5px;border-radius:3px;background:var(--mc-ll-nhan,currentColor);transform-origin:top;animation:mc-lg-vach .35s ease-out both}
@media (prefers-reduced-motion:reduce){body.mc .mc-giai:not([hidden])>.sol-box,body.mc .mc-giai:not([hidden])>.sol-box>*,body.mc .mc-giai .mc-buoc-nay::before{animation:none}}
`
