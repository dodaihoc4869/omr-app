// Playwright: bản cài toàn cục (khớp trình duyệt trong /opt/pw-browsers) nếu có, không thì bản của repo.
let pw; try { pw = require('/opt/node22/lib/node_modules/playwright'); } catch { pw = require('playwright'); }
const { chromium } = pw;
const fs = require('fs');
const DIR = __dirname; // chạy: node docs/ban-ve-bpu-dua-top-0911/chup.cjs [A-lam|A-mo|B-lam|B-mo]
(async () => {
  const b = await chromium.launch();
  const chi = process.argv[2];
  for (const [w, h] of [[1920, 1080], [1366, 768]]) {
    const p = await b.newPage({ viewport: { width: w, height: h }, deviceScaleFactor: 1 });
    for (const pa of ['A', 'B']) for (const tt of ['lam', 'mo']) {
      if (chi && chi !== `${pa}-${tt}`) continue;
      await p.goto(`file://${DIR}/ban-ve.html?chup=1&r=${Date.now()}#${pa}-${tt}`);
      await p.evaluate(() => document.fonts.ready);
      await p.waitForTimeout(300);
      const ok = await p.evaluate(() => document.fonts.check('800 30px "Be Vietnam Pro"', 'Đặng ượ'));
      const tran = await p.evaluate(() => [...document.querySelectorAll('.ten-em span,.hang .t,.B-cot .t')].filter((e) => e.scrollWidth > e.clientWidth + 1).map((e) => e.textContent));
      const ten = `${DIR}/${pa}-${tt === 'lam' ? 'dang-lam' : 'mo-dap-an'}-${w}.jpg`;
      let q = 84, buf;
      do { buf = await p.screenshot({ type: 'jpeg', quality: q }); q -= 4; } while (buf.length > 150_000 && q > 30);
      fs.writeFileSync(ten, buf);
      console.log(ten.split('/').pop(), Math.round(buf.length / 1024) + 'KB', 'q' + (q + 4), 'font', ok, 'tran', JSON.stringify(tran));
    }
    await p.close();
  }
  await b.close();
})();
