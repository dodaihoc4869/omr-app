import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import { fileURLToPath } from 'node:url';
import { execFileSync } from 'node:child_process';
import assert from 'node:assert/strict';

// Bộ kiểm tài liệu và hồ sơ bằng chứng. KHÔNG chạy code sản phẩm.
const dir = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(dir, '../..');
const hash = value => crypto.createHash('sha256').update(value).digest('hex');
const read = name => JSON.parse(fs.readFileSync(path.join(dir, name), 'utf8'));
const sourcePattern = /^(src\/|server\/(?:src|migrations|schema)\/|server\/[^/]+\.sql$|tests\/|e2e\/|scripts\/|package(?:-lock)?\.json$|(?:pnpm-lock\.yaml|yarn\.lock|bun\.lock)$|(?:vite|vitest|playwright|tsconfig|wrangler)[^/]*\.(?:ts|js|json|toml)$|server\/(?:package(?:-lock)?\.json|tsconfig\.json|wrangler\.toml)$)/;

function fingerprint() {
  const names = execFileSync('git', ['ls-files', '-co', '--exclude-standard', '-z'], { cwd: root, maxBuffer: 20 * 1024 * 1024 })
    .toString().split('\0').filter(Boolean);
  const digest = crypto.createHash('sha256');
  for (const name of [...new Set(names)].filter(n => sourcePattern.test(n)).sort()) {
    const file = path.join(root, name);
    if (!fs.existsSync(file) || !fs.statSync(file).isFile()) continue;
    digest.update(name + '\0').update(fs.readFileSync(file)).update('\0');
  }
  return digest.digest('hex');
}

if (process.argv.includes('--fingerprint')) {
  console.log(fingerprint());
  process.exit(0);
}

function insideRoot(relative) {
  assert.equal(typeof relative, 'string');
  assert(!path.isAbsolute(relative), 'Bằng chứng/sourceRefs phải là đường dẫn tương đối repo');
  const resolved = path.resolve(root, relative);
  assert(resolved.startsWith(root + path.sep), 'Đường dẫn ra ngoài repo');
  const real = fs.realpathSync(resolved);
  assert(real.startsWith(fs.realpathSync(root) + path.sep), 'Symlink bằng chứng ra ngoài repo');
  assert(fs.statSync(real).isFile(), 'Bằng chứng phải là file');
  return real;
}

function checkEvidence(evidence, current, strictFingerprint = true) {
  assert(Array.isArray(evidence) && evidence.length > 0, 'Thiếu evidence');
  for (const e of evidence) {
    assert(typeof e.command === 'string' && e.command.trim().length > 4, 'Thiếu command/quy trình thực chạy');
    assert(Number.isFinite(Date.parse(e.executedAt)), 'Thiếu thời điểm chạy');
    assert(Date.parse(e.executedAt) <= Date.now() + 300000, 'Thời điểm chạy ở tương lai');
    assert.equal(e.exitCode, 0, 'Evidence PASS phải có exitCode 0');
    assert(/^[a-f0-9]{64}$/.test(e.sourceFingerprint), 'Thiếu SHA-256 code');
    if (strictFingerprint) assert.equal(e.sourceFingerprint, current, 'Bằng chứng khác fingerprint code hiện tại');
    assert(Array.isArray(e.artifacts) && e.artifacts.length > 0, 'Thiếu artifact');
    for (const a of e.artifacts) {
      const file = insideRoot(a.path);
      assert(fs.statSync(file).size > 0, 'Artifact rỗng');
      assert.equal(hash(fs.readFileSync(file)), a.sha256, 'Checksum artifact không khớp');
    }
  }
}

function arithmetic(vector, p) {
  const x = vector.input, e = p.economy;
  switch (vector.kind) {
    case 'core': {
      const due = x.achieved ? e.coreCap : Math.min(e.coreCap, x.raw);
      const grant = Math.max(0, due - x.paid);
      return { grant, paidAfter: x.paid + grant };
    }
    case 'optional': {
      const grant = Math.min(x.price, Math.max(0, e.optionalCap - x.paid));
      return { grant, paidAfter: x.paid + grant };
    }
    case 'absorb': {
      const limit = { achieved: e.achievedAbsorbCap, studied: e.studiedAbsorbCap, none: e.noneAbsorbCap }[x.state];
      const take = Math.min(x.wallet, Math.max(0, limit - x.absorbed), x.missingToMax);
      return { take, walletAfter: x.wallet - take, absorbedAfter: x.absorbed + take };
    }
    case 'shield': {
      const nominalCost = x.firstClaimed ? e.laterShieldExpCost : e.firstShieldExpCost;
      const allowed = x.level >= e.shieldMinLevel && x.fragments >= e.fragmentsPerShield
        && x.unused < e.maxUnusedShields && (x.firstClaimed
          ? x.wallet - nominalCost >= e.reserveExp
          : x.days >= e.firstShieldMinAchievedDays);
      const cost = allowed ? nominalCost : 0;
      return { allowed, cost, walletAfter: x.wallet - cost,
        fragmentsAfter: x.fragments - (allowed ? e.fragmentsPerShield : 0), unusedAfter: x.unused + Number(allowed) };
    }
    case 'exchange': {
      const allowed = Number.isInteger(x.amount) && x.amount > 0 && x.wallet - x.amount >= e.reserveExp;
      return { allowed, walletAfter: x.wallet - (allowed ? x.amount : 0), goldAfter: x.gold + (allowed ? x.amount * e.expToGold : 0) };
    }
    case 'budget': {
      const each = x.solve + x.feedback;
      const count = Math.min(x.available, Math.floor(x.budget / each));
      return { count, total: count * each };
    }
    case 'corePartII':
      return { raw: e.baseValidCoreAttempt + Math.floor((e.correctCorePrice.II[x.difficulty] - e.baseValidCoreAttempt) * x.correct / x.total) };
    case 'simulation': {
      let wallet = 0, invested = 0, fragments = 0, shields = 0;
      const result = {};
      const to10 = e.firstNineBars.reduce((a, b) => a + b, 0);
      for (let d = 1; d <= x.days; d++) {
        wallet += x.earnedEachAchievedDay;
        const take = Math.min(e.achievedAbsorbCap, wallet);
        wallet -= take; invested += take; fragments++;
        if (invested >= to10 && !result.level10Day) result.level10Day = d;
        if (invested >= to10 && fragments >= e.fragmentsPerShield && shields < e.maxUnusedShields) {
          const cost = shields ? e.laterShieldExpCost : 0;
          if (!shields || wallet - cost >= e.reserveExp) {
            wallet -= cost; fragments -= e.fragmentsPerShield; shields++;
            if (shields === 1) result.firstShieldDay = d;
            if (shields === 2) result.secondShieldDay = d;
          }
        }
        if ([12, 21, 42].includes(d)) result['walletDay' + d] = wallet;
      }
      return result;
    }
    case 'weekdaySchedule': {
      const result = {}; let studied = 0;
      for (let d = 1; studied < 42; d++) {
        if (x.studyWeekdays.includes((d - 1) % 7 + 1)) studied++;
        if ([12, 21, 42].includes(studied) && !result['studyDay' + studied + 'Calendar']) result['studyDay' + studied + 'Calendar'] = d;
      }
      return result;
    }
    case 'day': return { learningDay: new Date(Date.parse(x.acceptedAt) + p.utcOffsetMinutes * 60000).toISOString().slice(0, 10) };
    case 'dayGoal': {
      const fraction = x.role === 'maintenance' ? p.learning.maintenanceSuccessFraction : p.learning.consolidationSuccessFraction;
      const minimumCorrect = Math.ceil(fraction * x.n);
      const achieved = x.n > 0 && x.submitted >= x.n && x.independentCorrect >= minimumCorrect && x.familyConditionMet !== false;
      return { state: achieved ? 'achieved' : x.submitted > 0 ? 'studied' : 'none', minimumCorrect };
    }
    case 'confidence': return { value: Math.min(x.families / p.learning.minFamilies, 1) * Math.min(x.days / p.learning.minEvidenceDays, 1) };
    case 'grading': return null; // Chỉ code sản phẩm mới chứng minh bộ chấm đúng.
    default: throw new Error('Vector kind chưa được định nghĩa: ' + vector.kind);
  }
}

try {
  const params = read('THAM-SO.json'), samples = read('MAU-KET-QUA.json'), progress = read('TIEN-DO.json'), lock = read('SPEC-LOCK.json');
  assert.equal(params.policyVersion, 'CNH-1.0');
  assert.equal(progress.specVersion, params.policyVersion);
  assert.equal(samples.specVersion, params.policyVersion);
  assert.equal(lock.specVersion, params.policyVersion);
  assert.equal(params.economy.firstNineBars.reduce((a, b) => a + b, 0), 2400);
  assert.equal(params.economy.enable365DayCurve, false);
  assert.equal(params.memory.enableFSRS7, false);
  for (const [relative, expected] of Object.entries(lock.files)) assert.equal(hash(fs.readFileSync(insideRoot(relative))), expected, 'Đặc tả đã thay đổi chưa có version/đối chiếu: ' + relative);
  for (const collection of [progress.requirements, progress.tests, progress.phases, samples.vectors]) assert.equal(new Set(collection.map(x => x.id)).size, collection.length, 'ID trùng');
  assert.deepEqual(progress.requirements.map(({id,phase,level,title,tests}) => ({id,phase,level,title,tests})), lock.requirements, 'Danh sách yêu cầu chuẩn đã đổi');
  assert.deepEqual(progress.tests.map(({id,phase,level,title}) => ({id,phase,level,title})), lock.tests, 'Danh sách test chuẩn đã đổi');
  assert.deepEqual(progress.phases.map(({id,dependsOn}) => ({id,dependsOn})), lock.phases, 'Gói/phụ thuộc đã đổi');
  const statuses = new Set(['NOT_RUN', 'IN_PROGRESS', 'PASS', 'FAIL', 'BLOCKED']);
  const testMap = new Map(progress.tests.map(t => [t.id, t]));
  for (const item of [...progress.requirements, ...progress.tests, ...progress.phases]) assert(statuses.has(item.status), 'Status không hợp lệ: ' + item.id);
  for (const r of progress.requirements) for (const id of r.tests) assert(testMap.has(id), 'Không tìm thấy test: ' + id);
  let computed = 0;
  for (const sample of samples.vectors) {
    const actual = arithmetic(sample, params);
    if (actual !== null) { assert.deepEqual(actual, sample.expected, sample.id + ': phép tính đặc tả sai'); computed++; }
  }
  console.log(`Bộ bàn giao hợp lệ: ${progress.requirements.length} yêu cầu, ${progress.tests.length} tình huống, ${samples.vectors.length} vector; tự kiểm ${computed} vector số học. Chưa kiểm code sản phẩm.`);

  if (process.argv.includes('--acceptance')) {
    const current = fingerprint(), failures = [];
    for (const phase of progress.phases.filter(p => p.id !== 'P11')) {
      if (phase.status !== 'PASS') failures.push(phase.id + ': gói chưa PASS');
    }
    for (const r of progress.requirements.filter(x => x.level === 'code')) {
      try {
        assert.equal(r.status, 'PASS', r.id + ' chưa PASS');
        assert(r.sourceRefs.length > 0, r.id + ' thiếu sourceRefs');
        for (const ref of r.sourceRefs) insideRoot(ref);
        assert(r.notes.trim().length > 0, r.id + ' thiếu giải thích');
        for (const id of r.tests) {
          const t = testMap.get(id); assert.equal(t.status, 'PASS', id + ' chưa PASS');
          checkEvidence(t.evidence, current);
        }
      } catch (error) { failures.push(`${r.id}: ${error.message.split('\n')[0]}`); }
    }
    if (failures.length) {
      console.error(`CHƯA ĐẠT CODE_VERIFIED: ${failures.length} mục yêu cầu/gói thiếu bằng chứng hợp lệ.`);
      console.error(failures.slice(0, 8).join('\n'));
      process.exitCode = 1;
    } else {
      console.log('Hồ sơ CODE_VERIFIED đủ và khớp fingerprint. Cần review ý nghĩa test/log; chưa xác nhận triển khai hoặc hiệu quả học tập.');
    }
  }
} catch (error) {
  console.error('Bộ kiểm không đạt: ' + error.message);
  process.exitCode = 1;
}
