// Chạy sau npm run dev. Chỉ dữ liệu giả; chặn mọi máy chủ ngoài dev local.
// GOC_XEM_THU có thể đổi cổng Vite; không dùng URL bản sống.
import { chromium } from 'playwright';
import assert from 'node:assert/strict';
import { mkdirSync } from 'node:fs';
const base = process.env.GOC_XEM_THU || 'http://127.0.0.1:5173';
assert.ok(['127.0.0.1', 'localhost'].includes(new URL(base).hostname));
const out = process.env.UI_OUTPUT || '/tmp/omr-ui-2309';
mkdirSync(out, { recursive: true });
const b = await chromium.launch({ headless: true });
const p = await b.newPage({ reducedMotion: 'reduce' });
const errors = [];
p.on('pageerror', e => errors.push(e.message));
// Các phiên khác đang sửa cùng repo: chặn HMR để fixture không bị thay bằng trang gốc giữa phép đo.
await p.routeWebSocket('**/*', ws => ws.close());
await p.route('**/*', r => new URL(r.request().url()).origin === new URL(base).origin ? r.continue() : r.abort());
await p.goto(base + '/src/components/xem-thu/btvn-da-giao.html?vo=1');
await p.waitForTimeout(800);
await p.evaluate(async () => {
    const R = (await import('/node_modules/.vite/deps/react.js')).default;
    const { createRoot } = (await import('/node_modules/.vite/deps/react-dom_client.js')).default;
    const { default: TheCau } = await import('/src/components/TheCau.tsx');
    const { default: Hop } = await import('/src/components/HopXacNhan.tsx');
    const { default: PH } = await import('/src/components/ph-moi/ManChinh.tsx');
    const { default: HS } = await import('/src/components/bang-nhiem-vu/BangNhiemVu.tsx');
    const { dungBangNhiemVu } = await import('/src/lib/nhiem-vu-adapter.ts');
    const { tongHopKeHoachTroLy } = await import('/src/lib/tro-ly-ca-nhan.ts');
    await import('/node_modules/katex/dist/katex.min.css');
    const { default: Setup } = await import('/src/screens/ExamSetupScreen.tsx');
    const { default: BangPH } = await import('/src/components/ph-moi/BangMoiThu.tsx');
    const { PH_APPLE } = await import('/tests/_ph-moi/du-lieu-mau-apple.ts');
    const { docTatCaVeCon } = await import('/src/lib/ph-moi/du-lieu.ts');
    document.body.replaceChildren();
    const host = document.createElement('div');
    document.body.append(host);
    const root = createRoot(host);
    const h = R.createElement, noop = () => { };
    const now = Date.now();
    const long = 'TênChuyênĐềHoáHọcKhôngNgắtDòng'.repeat(8);
    const img = 'data:image/svg+xml,' + encodeURIComponent('<svg xmlns="http://www.w3.org/2000/svg" width="1400" height="400"><rect width="1400" height="400" fill="white"/><text x="20" y="100">H2O</text></svg>');
    window.uiRender = (kind) => {
        let child;
        if (kind === 'setup')
            child = h('div', { className: 'm3 vo-thay', 'data-teacher-screen': 'setup' }, h('aside', { className: 'ben-trai' }, 'GV'), h('main', { className: 'khung-noi-dung' }, h('div', { className: 'giua-noi-dung' }, h(Setup))));
        if (kind === 'phbang')
            child = h(BangPH, { pm: docTatCaVeCon(PH_APPLE), sbd: 'TEST', lop: long, giaoThem: { san: true, dangTai: false, conLai: 3, goiGanNhat: null, the: null, dangGui: false, giao: noop }, onVe: noop });
        if (kind === 'cau')
            child = h('div', { className: 'm3', style: { padding: 16 } }, h(TheCau, { phan: 'I', cheDo: 'thi', stt: 1, tieuDe: long, text: long + ' $\\frac{123456789012345678901234567890}{9876543210}$', choices: [long, 'H₂O', 'CO₂', 'O₂'], choicePerm: [0, 1, 2, 3], selected: null, onSelect: noop, table: [['Tên chất', ...Array(10).fill('Dữ kiện rất dài')]], hinhAnh: [{ src: img, viTri: 'sau_de', alt: 'Kiểm thử ảnh lớn' }] }));
        if (kind === 'hop')
            child = h('div', { className: 'm3' }, h(Hop, { tieuDe: 'Kiểm thử nội dung dài', noiDung: h('p', null, ('Nội dung kiểm thử hộp thoại dài. ').repeat(100) + long), nhanXacNhan: 'Xác nhận thay đổi', onXacNhan: noop, onHuy: noop, yeuCauGo: { nhan: 'Nhập xác nhận', giaTri: 'ok' } }));
        if (kind === 'ph')
            child = h(PH, { v: { trangThai: 'ok', pm: { serverNow: now, tongQuan: { soCau: 1234, soDung: 1200, phutHoc: 240, datNhiemVu: true, viecTong: 5, viecXong: 5 }, caGanNhat: null, nhipHoc: null }, thuLai: noop }, tenCon: long, lop: long, now, canhBao: [], onCanhBaoDaXem: noop, giaoThem: { trangThai: 'san_sang', conLai: 3, onGiao: noop }, onMoBang: noop, onDoiSbd: noop });
        if (kind === 'hs')
            child = h(HS, { vaiTro: 'hocsinh', hoTen: long, now, duLieu: dungBangNhiemVu({ keHoachTroLy: tongHopKeHoachTroLy({ sbd: 'TEST', hoTen: long, dsBtvn: [{ maBtvn: 'BTEST', tenBtvn: long, soCau: 12, giaoLuc: new Date(now - 1000).toISOString(), hanNop: new Date(now + 3600000).toISOString() }], dsMomGiao: [], dsLichSu: [], tongCauSai: 0, now }), now }), onHanhDong: noop, onVaoThi: noop, onMoThanThu: noop });
        root.render(child);
    };
});
// Bỏ chốt che toàn app trong phép đo: phát hiện cả nội dung bị cắt mà
// document.scrollWidth thường không thấy. Nền trang trí giữ vùng cắt riêng.
await p.addStyleTag({ content: 'body,.khung-noi-dung,.vo-thay .khung-noi-dung,.phm-ap,.bnv{overflow-x:visible!important}' });
let checks = 0;
try {
    for (const theme of ['light', 'dark'])
        for (const font of [100, 115])
            for (const width of [320, 390, 768, 1280]) {
                await p.emulateMedia({ colorScheme: theme });
                await p.setViewportSize({ width, height: 720 });
                await p.evaluate(f => document.documentElement.style.fontSize = f + '%', font);
                for (const kind of ['setup', 'cau', 'hop', 'ph', 'phbang', 'hs']) {
                    await p.evaluate(k => window.uiRender(k), kind);
                    await p.waitForTimeout(100);
                    await p.evaluate(() => document.fonts.ready);
                    const label = `${kind} ${width}px ${font}% ${theme}`;
                    const result = await p.evaluate(() => {
                        const bad = [];
                        function exempt(el) {
                            if (el instanceof SVGElement || el.closest('[aria-hidden="true"],.sr-only,.phm-ap-sr,.bnv-an'))
                                return true;
                            for (let a = el; a && a !== document.body; a = a.parentElement) {
                                const c = getComputedStyle(a);
                                if (/auto|scroll/.test(c.overflowX) || c.textOverflow === 'ellipsis' || c.clipPath !== 'none' || (c.clip && c.clip !== 'auto'))
                                    return true;
                            }
                            return false;
                        }
                        for (const el of document.querySelectorAll('body *')) {
                            if (exempt(el))
                                continue;
                            const r = el.getBoundingClientRect();
                            if (!r.width || !r.height)
                                continue;
                            if (r.right > innerWidth + 1 || r.left < -1)
                                bad.push(el.className || el.tagName);
                        }
                        const walker = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT);
                        for (let node = walker.nextNode(); node; node = walker.nextNode()) {
                            if (!node.textContent.trim() || !node.parentElement || exempt(node.parentElement))
                                continue;
                            const range = document.createRange();
                            range.selectNodeContents(node);
                            for (const r of range.getClientRects())
                                if (r.width && r.height && (r.right > innerWidth + 1 || r.left < -1))
                                    bad.push('chữ: ' + node.textContent.slice(0, 30));
                        }
                        const d = document.querySelector('[role=alertdialog]')?.getBoundingClientRect();
                        return { scroll: document.documentElement.scrollWidth, bad: bad.slice(0, 8), dialog: d && [d.top, d.bottom] };
                    });
                    assert.equal(result.scroll <= width + 1, true, `${label}: trang ${result.scroll}px`);
                    assert.deepEqual(result.bad, [], `${label}: nội dung ngoài màn`);
                    if (kind === 'hop') {
                        assert.ok(result.dialog && result.dialog[0] >= 0 && result.dialog[1] <= 720, `${label}: hộp ngoài màn ${result.dialog}`);
                        const dialog = p.getByRole('alertdialog');
                        await dialog.evaluate(e => e.scrollTop = 0);
                        assert.ok(await dialog.locator('h2').isVisible());
                        await dialog.getByRole('button', { name: 'Xác nhận thay đổi' }).scrollIntoViewIfNeeded();
                        const r = await dialog.getByRole('button', { name: 'Xác nhận thay đổi' }).boundingBox();
                        assert.ok(r && r.y >= 0 && r.y + r.height <= 720, `${label}: nút xác nhận không tới được`);
                    }
                    if (kind === 'cau') {
                        const table = await p.locator('.cau-bang').evaluate(e => ({ width: e.clientWidth, scroll: e.scrollWidth }));
                        assert.ok(table.scroll > table.width, `${label}: bảng rộng phải cuộn riêng`);
                        assert.ok(await p.locator('.katex').count() > 0, `${label}: phải có công thức thật`);
                        await p.locator('.cau-hinh img').scrollIntoViewIfNeeded();
                        await p.waitForFunction(() => document.querySelector('.cau-hinh img')?.complete);
                        assert.ok(await p.locator('.cau-hinh img').evaluate(e => e.complete && e.naturalWidth === 1400), `${label}: ảnh lớn phải nạp được`);
                    }
                    if (kind === 'setup' && width === 1280) {
                        const right = await p.locator('.khung-noi-dung').evaluate(e => e.getBoundingClientRect().right);
                        assert.equal(right, 1268, `${label}: grid phải chừa 12px bên phải`);
                    }
                    if (font === 100 && [390, 1280].includes(width))
                        await p.screenshot({ path: `${out}/${kind}-${width}-${theme}.jpg`, quality: 60 });
                    checks++;
                }
            }
    // Bàn phím/điện thoại nằm ngang: hộp vẫn cuộn tới nút trong chiều cao 320px.
    await p.setViewportSize({ width: 390, height: 320 });
    await p.evaluate(() => window.uiRender('hop'));
    await p.waitForTimeout(100);
    const short = await p.getByRole('alertdialog').boundingBox();
    assert.ok(short && short.y >= 0 && short.y + short.height <= 320);
    await p.getByRole('button', { name: 'Xác nhận thay đổi' }).scrollIntoViewIfNeeded();
    assert.deepEqual(errors, []);
    console.log(`ĐẠT ${checks} cảnh (6 màn × 4 bề rộng × chữ 100/115% × sáng/tối), hộp thấp 320px; bảng cuộn riêng, ảnh/công thức, không che tràn.`);
}
finally {
    await b.close();
}
