// Local-only visual review. Existing game fixtures call their own in-memory API.
import '../../src/components/bat-linh/bat-linh.css'
import '../../src/components/bat-linh/hoc-sinh.css'
import '../../src/components/bat-linh/phu-huynh.css'
import '../../src/components/bat-linh/game-toan-bo.css'
import '../../src/components/bat-linh/che-do-toi.css'
import '@fontsource/noto-serif/vietnamese-700.css'
import '@fontsource/noto-serif/latin-700.css'
document.body.setAttribute('data-bat-linh', 'hs')
document.getElementById('root')!.classList.add('bl-app')
const fetchGoc = window.fetch.bind(window)
window.fetch = (input, init) => {
  const url = new URL(typeof input === 'string' ? input : input instanceof URL ? input.href : input.url, location.href)
  if (url.origin !== location.origin) return Promise.resolve(new Response(JSON.stringify({ ok: false, error: 'Bản xem thử ngoại tuyến' }), { headers: { 'content-type': 'application/json' } }))
  return fetchGoc(input, init)
}
const game = new URLSearchParams(location.search).get('game')
if (game === 'bieu-cam') await import('./bieu-cam')
else if (game === 'chuong') await import('./chuong')
else if (game === 'thu') await import('../../src/game/than-thu-v2/dao/xem-thu')
else if (game === 'shop') await import('../../src/game/than-thu-v2/shop/xem-thu')
else if (game === 'doan') await import('../../src/game/than-thu-v2/doan2/xem-thu-2')
else if (game === 'bia') await import('../../src/game/bi-a/xem-thu')
else await import('../../src/game/than-thu-v2/dao2/xem-thu')
