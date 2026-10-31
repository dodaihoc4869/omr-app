#!/usr/bin/env python3
# SINH .github/workflows/thu-tai-50k-3110.yml (31/10) — bốn giai đoạn 500 → 2.000 → 10.000 → 50.000 em ảo, mỗi giai đoạn một ma trận lát + một cổng.
# Sửa ở đây rồi chạy: python3 scripts/thu-tai-50k/sinh-workflow.py  (đừng sửa tay tệp YAML sinh ra).
GIAI_DOAN = [(500, 1), (2000, 2), (10000, 5), (50000, 20)]  # (số em ảo, số lát song song ≤ 20)

dau = r"""# THỬ TẢI «50.000 EM CÙNG LÚC» (31/10, thầy: app học sinh phải mượt như Duolingo dù 50.000 em cùng lúc — chỉ mở lại app khi thử tải chứng minh).
# MÔI TRƯỜNG THỬ RIÊNG: Worker `omr-thu` + D1 `omr-thu` (+ R2 `omr-thu-de` nếu khoá có quyền) — KHÔNG chạm Worker/D1/R2 thật `omr` (chốt trong
# scripts/thu-tai-50k/tao-cau-hinh.mjs + do-cf.mjs). Dữ liệu TỔNG HỢP hoàn toàn (scripts/thu-tai-50k/sinh-kho.ts, cùng cách nạp tests/do-tai-nong-3010.test.ts):
# 50.000 em lớp 12 (2.000 em có 250 sự kiện học, 50 em «nặng» 1.500), 121 đề × 25 câu, Gói bài 7, Hành trình khối 12 (mọi em), vòng chữa câu sai bật.
# Mã máy chủ: nhánh main LÚC CHẠY (checkout `srv`), cấu hình sinh từ server/wrangler.toml: đổi tên/D1/R2, BỎ cron + AI, GIỮ Durable Object (ngăn riêng học sinh).
# MA_BI_MAT của Worker thử: băm (khoá CF + số lượt chạy) — mỗi job tự tính lại, che bằng ::add-mask::, KHÔNG in. Máy tải tự ký token em bằng mã ấy.
# Giai đoạn: 500 → 2.000 → 10.000 → 50.000 em ảo (ramp RAMP_S giây rồi ổn định ON_DINH_S giây); mỗi lát một tiến trình Node (scripts/thu-tai-50k/may-tai.mjs).
# Cổng sau mỗi giai đoạn: lỗi > 20 % / có lát dừng sớm / answer ok < 80 % ⇒ DỪNG, không sang giai đoạn sau. Job cuối gộp bảng + số GraphQL (D1, Worker, DO).
# CHẠY LẠI: đổi `LAN` dưới đây rồi đẩy tệp này lên nhánh claude/thu-tai-50k-3110. Tệp SINH bởi scripts/thu-tai-50k/sinh-workflow.py.
name: Thử tải 50k em (omr-thu)
on:
  push:
    branches: [claude/thu-tai-50k-3110]
    paths: ['.github/workflows/thu-tai-50k-3110.yml']
permissions:
  contents: read
concurrency:
  group: thu-tai-50k
  cancel-in-progress: false
env:
  LAN: '1'
  # 1 = dựng lại D1 omr-thu từ kho giả (≈ 5–10 phút, xoá sạch dữ liệu lượt trước); 0 = giữ D1 đang có.
  DUNG_KHO: '1'
  # Giai đoạn cuối được phép chạy (500 | 2000 | 10000 | 50000).
  GIAI_DOAN_TOI: '500'
  # Biến riêng Worker thử (tao-cau-hinh.mjs), vd. 'BAT_GOM_LIEN_NGAN=1'.
  VARS_THU: ''
  RAMP_S: '60'
  ON_DINH_S: '180'
jobs:
  dung:
    name: Dựng D1 + Worker thử
    runs-on: ubuntu-latest
    timeout-minutes: 50
    outputs:
      bat_dau: ${{ steps.moc.outputs.bat_dau }}
      goc: ${{ steps.day.outputs.goc }}
      d1: ${{ steps.d1.outputs.d1 }}
    steps:
      - uses: actions/checkout@v4
      - name: Mã máy chủ đang sống (main)
        uses: actions/checkout@v4
        with:
          ref: main
          path: srv
      - uses: actions/setup-node@v4
        with:
          node-version: 24
          cache: npm
          cache-dependency-path: srv/package-lock.json
      - name: Cài gói (main) + chép script thử tải
        run: |
          mkdir -p srv/scripts && cp -r scripts/thu-tai-50k srv/scripts/ && cp tests/kho-tai-lon.ts srv/tests/
          cd srv && npm ci --ignore-scripts --no-audit --no-fund
          echo "main: $(git rev-parse --short HEAD) — $(git log -1 --format=%s | cut -c1-120)"
      - name: Làm sạch khoá Cloudflare
        env:
          T: ${{ secrets.CLOUDFLARE_API_TOKEN }}
          A: ${{ secrets.CLOUDFLARE_ACCOUNT_ID }}
        run: bash scripts/lam-sach-khoa-cf.sh
      - name: Mã bí mật của lượt (che)
        run: |
          MB=$(printf '%s' "omr-thu|${CF_TOKEN_SACH}|${GITHUB_RUN_ID}" | sha256sum | cut -c1-48); echo "::add-mask::$MB"; echo "MB_THU=$MB" >> "$GITHUB_ENV"
      - name: D1 omr-thu (tạo nếu chưa có, vùng APAC như D1 thật)
        id: d1
        working-directory: srv/server
        env:
          CLOUDFLARE_API_TOKEN: ${{ env.CF_TOKEN_SACH }}
          CLOUDFLARE_ACCOUNT_ID: ${{ env.CF_ACC_SACH }}
        run: |
          tim() { npx -y wrangler@4 d1 list --json 2>/dev/null | jq -r '.[] | select(.name=="omr-thu") | (.uuid // .id)' | head -n1; }
          ID=$(tim)
          if [ -z "$ID" ]; then npx -y wrangler@4 d1 create omr-thu --location apac | grep -vE 'database_id' ; ID=$(tim); fi
          if [ -z "$ID" ]; then echo "::error::Không tạo/tìm được D1 omr-thu"; exit 1; fi
          if [ "$ID" = "d2e6d322-374a-45d7-83a3-9fac486b23f1" ]; then echo "::error::CHẶN: omr-thu trỏ vào D1 thật"; exit 1; fi
          echo "D1_THU=$ID" >> "$GITHUB_ENV"; echo "d1=$ID" >> "$GITHUB_OUTPUT"; echo "D1 omr-thu sẵn sàng"
          printf 'name = "omr-thu-nap"\nmain = "src/index.ts"\ncompatibility_date = "2026-09-11"\n[[d1_databases]]\nbinding = "DB"\ndatabase_name = "omr-thu"\ndatabase_id = "%s"\n' "$ID" > wrangler.nap.toml
      - name: Sinh kho giả → SQL (< 150 MB)
        if: env.DUNG_KHO == '1'
        working-directory: srv
        run: |
          npx esbuild scripts/thu-tai-50k/sinh-kho.ts --bundle --platform=node --format=esm --target=node22 --outfile=/tmp/sinh-kho.mjs --log-level=warning
          node --no-warnings /tmp/sinh-kho.mjs /tmp/kho.sql | grep -v '…'
          B=$(stat -c %s /tmp/kho.sql); echo "Cỡ SQL: $((B/1048576)) MB"; [ "$B" -lt 157286400 ] || { echo "::error::SQL ≥ 150 MB"; exit 1; }
          printf "CREATE TABLE IF NOT EXISTS thu_tai_moc(id INTEGER PRIMARY KEY, sha TEXT, luc TEXT);\nINSERT OR REPLACE INTO thu_tai_moc VALUES(1,'%s','%s');\n" "$(git rev-parse --short HEAD)" "$(date -u +%FT%TZ)" >> /tmp/kho.sql
      - name: Nạp SQL vào D1 omr-thu (--remote)
        if: env.DUNG_KHO == '1'
        working-directory: srv/server
        env:
          CLOUDFLARE_API_TOKEN: ${{ env.CF_TOKEN_SACH }}
          CLOUDFLARE_ACCOUNT_ID: ${{ env.CF_ACC_SACH }}
        run: |
          grep -q 'database_name = "omr-thu"' wrangler.nap.toml && ! grep -q d2e6d322 wrangler.nap.toml
          T0=$(date +%s)
          npx -y wrangler@4 d1 execute omr-thu --remote --config wrangler.nap.toml --file /tmp/kho.sql --yes 2>&1 | grep -vE '^\s*$' | tail -15
          echo "Nạp xong sau $(( $(date +%s) - T0 )) s"
          npx -y wrangler@4 d1 execute omr-thu --remote --config wrangler.nap.toml --yes --json --command "PRAGMA optimize" > /dev/null 2>&1 || echo "PRAGMA optimize không chạy được (bỏ qua)"
      - name: Kiểm kho trên D1 omr-thu
        working-directory: srv/server
        env:
          CLOUDFLARE_API_TOKEN: ${{ env.CF_TOKEN_SACH }}
          CLOUDFLARE_ACCOUNT_ID: ${{ env.CF_ACC_SACH }}
        run: |
          npx -y wrangler@4 d1 execute omr-thu --remote --config wrangler.nap.toml --yes --json --command "SELECT (SELECT COUNT(*) FROM hoc_sinh) hoc_sinh, (SELECT COUNT(*) FROM su_kien_hoc) su_kien_hoc, (SELECT COUNT(*) FROM game_v2_attempt) attempt, (SELECT COUNT(*) FROM game_v2_question) cau, (SELECT length(sbd_json) FROM chien_dich WHERE id='hanh-trinh-v3-khoi-12') sbd_json, (SELECT sha||' '||luc FROM thu_tai_moc WHERE id=1) moc" | jq -c '.[0].results[0]'
      - name: Lập bảng tra chiến dịch (chien-dich-tv, #669) — Worker thử không có cron
        working-directory: srv/server
        env:
          CLOUDFLARE_API_TOKEN: ${{ env.CF_TOKEN_SACH }}
          CLOUDFLARE_ACCOUNT_ID: ${{ env.CF_ACC_SACH }}
        run: |
          grep -q 'database_name = "omr-thu"' wrangler.nap.toml && ! grep -q d2e6d322 wrangler.nap.toml
          if [ ! -f migration-z-3110-chien-dich-tv.sql ]; then echo "Mã máy chủ chưa có bảng tra — bỏ qua"; exit 0; fi
          npx -y wrangler@4 d1 execute omr-thu --remote --config wrangler.nap.toml --file migration-z-3110-chien-dich-tv.sql --yes 2>&1 | grep -vE '^\s*$' | tail -3
          npx -y wrangler@4 d1 execute omr-thu --remote --config wrangler.nap.toml --yes --json --command "DELETE FROM chien_dich_tv; INSERT OR IGNORE INTO chien_dich_tv (sbd, chien_dich_id) SELECT j.value, c.id FROM chien_dich c, json_each(CASE WHEN json_valid(c.sbd_json) AND json_type(c.sbd_json) = 'array' THEN c.sbd_json ELSE '[]' END) j WHERE j.type = 'text'; INSERT OR REPLACE INTO chien_dich_tv_dau (chien_dich_id, luc) SELECT id, strftime('%Y-%m-%dT%H:%M:%fZ','now') FROM chien_dich; SELECT (SELECT COUNT(*) FROM chien_dich_tv) tv, (SELECT COUNT(*) FROM chien_dich_tv_dau) dau, (SELECT COUNT(*) FROM chien_dich) cd" | jq -c '.[-1].results[0]'
      - name: R2 thử omr-thu-de (nếu khoá có quyền)
        working-directory: srv/server
        env:
          CLOUDFLARE_API_TOKEN: ${{ env.CF_TOKEN_SACH }}
          CLOUDFLARE_ACCOUNT_ID: ${{ env.CF_ACC_SACH }}
        run: |
          if npx -y wrangler@4 r2 bucket list 2>/dev/null | grep -q 'omr-thu-de'; then echo "R2_THU=omr-thu-de" >> "$GITHUB_ENV"; echo "R2 omr-thu-de có sẵn"
          elif npx -y wrangler@4 r2 bucket create omr-thu-de > /tmp/r2.log 2>&1; then echo "R2_THU=omr-thu-de" >> "$GITHUB_ENV"; echo "Đã tạo R2 omr-thu-de"
          else echo "R2_THU=-" >> "$GITHUB_ENV"; echo "::warning::Không tạo được R2 thử (bỏ binding DE): $(head -c 200 /tmp/r2.log | tr -d '\n')"; fi
      - name: Đẩy Worker omr-thu (mã main) + đặt MA_BI_MAT
        id: day
        working-directory: srv/server
        env:
          CLOUDFLARE_API_TOKEN: ${{ env.CF_TOKEN_SACH }}
          CLOUDFLARE_ACCOUNT_ID: ${{ env.CF_ACC_SACH }}
        run: |
          node ../scripts/thu-tai-50k/tao-cau-hinh.mjs wrangler.toml wrangler.thu.toml "$D1_THU" "$R2_THU"
          npx -y wrangler@4 deploy --config wrangler.thu.toml 2>&1 | tee /tmp/day.log | grep -vE '^\s*$' | tail -25
          GOC=$(grep -oE 'https://omr-thu\.[a-z0-9.-]+\.workers\.dev' /tmp/day.log | head -n1)
          if [ -z "$GOC" ]; then SUB=$(curl -sS -H "Authorization: Bearer $CLOUDFLARE_API_TOKEN" "https://api.cloudflare.com/client/v4/accounts/$CLOUDFLARE_ACCOUNT_ID/workers/subdomain" | jq -r '.result.subdomain // empty'); [ -n "$SUB" ] && GOC="https://omr-thu.$SUB.workers.dev"; fi
          if [ -z "$GOC" ]; then echo "::error::Không biết địa chỉ workers.dev của omr-thu"; exit 1; fi
          echo "goc=$GOC" >> "$GITHUB_OUTPUT"; echo "GOC=$GOC" >> "$GITHUB_ENV"; echo "Địa chỉ thử: $GOC"
          printf '%s' "$MB_THU" | npx -y wrangler@4 secret put MA_BI_MAT --config wrangler.thu.toml 2>&1 | tail -3
      - name: Kiểm nhanh một em (ok:true, qua ngăn)
        env:
          MA_BI_MAT: ${{ env.MB_THU }}
        run: sleep 10; node scripts/thu-tai-50k/kiem-nhanh.mjs "$GOC" E10 && node scripts/thu-tai-50k/kiem-nhanh.mjs "$GOC" E40000
      - name: Mốc bắt đầu giai đoạn đầu
        id: moc
        run: echo "bat_dau=$(( ($(date +%s) + 100) * 1000 ))" >> "$GITHUB_OUTPUT"
"""

def buoc_chung():
    return r"""      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: 24
      - name: Làm sạch khoá Cloudflare
        env:
          T: ${{ secrets.CLOUDFLARE_API_TOKEN }}
          A: ${{ secrets.CLOUDFLARE_ACCOUNT_ID }}
        run: bash scripts/lam-sach-khoa-cf.sh
      - name: Mã bí mật của lượt (che)
        run: |
          MB=$(printf '%s' "omr-thu|${CF_TOKEN_SACH}|${GITHUB_RUN_ID}" | sha256sum | cut -c1-48); echo "::add-mask::$MB"; echo "MB_THU=$MB" >> "$GITHUB_ENV"
"""

jobs = []
truoc = None  # (tên job cổng trước)
for i, (n, lat) in enumerate(GIAI_DOAN):
    gd, cong = f"gd{n}", f"cong{n}"
    if truoc is None:
        needs, dk, bat = "[dung]", "needs.dung.result == 'success'", "${{ needs.dung.outputs.bat_dau }}"
    else:
        needs, dk, bat = f"[dung, {truoc}]", f"always() && needs.dung.result == 'success' && needs.{truoc}.outputs.tiep == '1'", "${{ needs.%s.outputs.bat_dau }}" % truoc
    phan = ", ".join(str(x) for x in range(lat))
    jobs.append(f"""  {gd}:
    name: {n} em ảo · lát ${{{{ matrix.phan }}}}/{lat}
    needs: {needs}
    if: {dk}
    runs-on: ubuntu-latest
    timeout-minutes: 15
    strategy:
      fail-fast: false
      max-parallel: 20
      matrix:
        phan: [{phan}]
    steps:
{buoc_chung()}      - name: Chạy {n} em ảo (lát ${{{{ matrix.phan }}}})
        env:
          MA_BI_MAT: ${{{{ env.MB_THU }}}}
          GOC: ${{{{ needs.dung.outputs.goc }}}}
        run: |
          ulimit -n 65535 2>/dev/null || ulimit -n 16384 2>/dev/null || true
          node scripts/thu-tai-50k/may-tai.mjs --goc "$GOC" --so-em {n} --phan ${{{{ matrix.phan }}}} --tong-phan {lat} --ramp "$RAMP_S" --on-dinh "$ON_DINH_S" --bat-dau {bat} --giai-doan {n} --ra ket-qua-{n}-${{{{ matrix.phan }}}}.json
      - uses: actions/upload-artifact@v4
        if: always()
        with:
          name: ket-qua-{n}-${{{{ matrix.phan }}}}
          path: ket-qua-{n}-*.json
          retention-days: 14
          if-no-files-found: warn
  {cong}:
    name: Cổng sau {n} em
    needs: [{gd}]
    if: always() && needs.{gd}.result != 'skipped'
    runs-on: ubuntu-latest
    timeout-minutes: 5
    outputs:
      tiep: ${{{{ steps.c.outputs.tiep }}}}
      bat_dau: ${{{{ steps.c.outputs.bat_dau }}}}
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: 24
      - uses: actions/download-artifact@v4
        with:
          pattern: ket-qua-{n}-*
          path: kq
          merge-multiple: true
      - id: c
        run: |
          node scripts/thu-tai-50k/gop.mjs kq --cong {n} --md "$GITHUB_STEP_SUMMARY"
          QUA=$(grep -oE '^qua=[01]' "$GITHUB_OUTPUT" | tail -n1 | cut -d= -f2)
          SAU={GIAI_DOAN[i + 1][0] if i + 1 < len(GIAI_DOAN) else 0}
          if [ "$QUA" = "1" ] && [ "$SAU" -gt 0 ] && [ "$SAU" -le "$GIAI_DOAN_TOI" ]; then echo "tiep=1" >> "$GITHUB_OUTPUT"; echo "→ sang giai đoạn $SAU em"; else echo "tiep=0" >> "$GITHUB_OUTPUT"; echo "→ dừng ở đây"; fi
          echo "bat_dau=$(( ($(date +%s) + 100) * 1000 ))" >> "$GITHUB_OUTPUT"
""")
    truoc = cong

tat_ca = ", ".join(["dung"] + [x for n, _ in GIAI_DOAN for x in (f"gd{n}", f"cong{n}")])
cuoi = r"""  tong:
    name: Tổng hợp + số Cloudflare
    needs: [""" + tat_ca + r"""]
    if: always() && needs.dung.result == 'success'
    runs-on: ubuntu-latest
    timeout-minutes: 15
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: 24
      - uses: actions/download-artifact@v4
        with:
          pattern: ket-qua-*
          path: kq
          merge-multiple: true
      - name: Bảng từng giai đoạn
        run: |
          echo "## Thử tải 50k — lượt $LAN (main lúc chạy, Worker omr-thu)" >> "$GITHUB_STEP_SUMMARY"
          node scripts/thu-tai-50k/gop.mjs kq --md "$GITHUB_STEP_SUMMARY" --json tom.json
      - name: Làm sạch khoá Cloudflare
        env:
          T: ${{ secrets.CLOUDFLARE_API_TOKEN }}
          A: ${{ secrets.CLOUDFLARE_ACCOUNT_ID }}
        run: bash scripts/lam-sach-khoa-cf.sh
      - name: Số Cloudflare (D1 / Worker / Durable Object) cho từng giai đoạn
        env:
          TOKEN: ${{ env.CF_TOKEN_SACH }}
          ACC: ${{ env.CF_ACC_SACH }}
          D1_THU: ${{ needs.dung.outputs.d1 }}
        run: |
          echo "Chờ 150 s cho số phân tích của Cloudflare về đủ…"; sleep 150
          node scripts/thu-tai-50k/do-cf.mjs tom.json --md "$GITHUB_STEP_SUMMARY"
      - uses: actions/upload-artifact@v4
        if: always()
        with:
          name: tom-tat
          path: tom.json
          retention-days: 30
"""

with open('.github/workflows/thu-tai-50k-3110.yml', 'w', encoding='utf-8') as f:
    f.write(dau + "\n".join(jobs) + cuoi)
print('đã sinh .github/workflows/thu-tai-50k-3110.yml')
