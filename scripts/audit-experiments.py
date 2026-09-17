"""Audit the exported whole-bank snapshot against reviewed illustration fingerprints.
Usage: python3 scripts/audit-experiments.py [snapshot.json] [output-directory]
No mutation of questions, marks, accounts or progress.
"""
import json,re,html,pathlib,collections,unicodedata,sys
source=pathlib.Path(sys.argv[1] if len(sys.argv)>1 else '/tmp/experiment-bank-index.json')
root=pathlib.Path(sys.argv[2] if len(sys.argv)>2 else '/Volumes/SSD NGOÀI/dac-ta-than-thu-8-he-2026-09-16/thi-nghiem');root.mkdir(parents=True,exist_ok=True)
def key(t):
 a=2166136261;b=5381
 for c in re.sub(r'\s+',' ',unicodedata.normalize('NFC',t)).strip():a=((a^ord(c))*16777619)&0xffffffff;b=((b*33)^ord(c))&0xffffffff
 return f'{a}-{b}'
qs=[json.loads(r['json']) for r in json.loads(source.read_text())[0]['results']]
registry={r['fingerprint']:r['scenes'] for r in json.loads(pathlib.Path('scripts/experiment-reviewed-map.json').read_text())}
registry.update({k:[v] for k,v in re.findall(r'"(\d+-\d+)": "(no2|rutherford)"',pathlib.Path('src/lib/experiments/verified.ts').read_text())})
pat=r'thí nghiệm|thực nghiệm|ống nghiệm|đun nóng|kết tủa|sục khí|nhỏ.*dung dịch|điện phân|chuẩn độ|nhúng|nhỏ (?:vài|từng|dung)|sục|lắc|đốt cháy|điện cực|phễu chiết|sinh hàn|quỳ tím|burette|pipette'
groups=collections.defaultdict(list)
for q in qs:
 if re.search(pat,q['text'],re.I) or key(q['text']) in registry:groups[q['group']].append(q)
records=[]
for group,items in groups.items():
 q=items[0];scenes=registry.get(key(q['text']),[])
 records.append(dict(group=group,ids=[x['qid'] for x in items],status='Đã gắn minh hoạ đã đối chiếu' if scenes else 'Chưa kết luận: cần phân loại / đối chiếu',scenes=scenes,text=q['text'],hasImages=bool(q.get('hinhAnh') or q.get('thanCauImg') or q.get('imageDataUrl'))))
counts=dict(banks=len({q['maDe'] for q in qs}),questions=len(qs),candidateQuestions=sum(len(v) for v in groups.values()),candidateGroups=len(groups),illustratedQuestions=sum(key(q['text']) in registry for q in qs),illustratedGroups=sum(bool(r['scenes']) for r in records),pendingCandidateGroups=sum(not r['scenes'] for r in records))
(root/'kiem-ke.json').write_text(json.dumps(dict(**counts,records=records),ensure_ascii=False,indent=2))
parts=['<article data-status="'+('done' if r['scenes'] else 'pending')+'"><b>'+html.escape(r['status'])+'</b><small>'+html.escape(' · '.join(r['ids']))+'</small><p>'+html.escape(r['text'])+'</p><small>'+html.escape(', '.join(r['scenes']))+'</small></article>' for r in records]
intro=f"{counts['banks']} bộ đề · {counts['questions']:,} bản ghi. Đã gắn minh hoạ cho {counts['illustratedQuestions']:,} bản ghi thuộc {counts['illustratedGroups']} nhóm. Quét rộng thu được {counts['candidateGroups']} nhóm ứng viên; chưa gắn {counts['pendingCandidateGroups']} nhóm."
(root/'kiem-ke-thi-nghiem.html').write_text('''<!doctype html><html lang="vi"><meta charset="utf-8"><title>Kiểm kê thí nghiệm toàn kho</title><style>body{font:16px/1.6 system-ui;background:#f5f7fa;color:#20304a;margin:30px auto;max-width:1050px;padding:20px}article{padding:20px;border:1px solid #ccd5e1;border-radius:18px;background:white;margin:15px 0}small{display:block;color:#50657c}p{white-space:pre-wrap}input,select{padding:14px;max-width:90%;font:inherit}b{color:#195a9a}.note{background:#fff2c9;padding:18px;border-radius:12px}</style><h1>Kiểm kê toàn kho · 16/09/2026</h1><p>'''+intro+'''</p><p class="note">Chưa xác nhận hoàn thành 100% toàn kho. Danh sách ứng viên gồm cả bài tính, lý thuyết và thí nghiệm thật. Câu phụ thuộc ảnh, bảng hoặc thiếu điều kiện phải đối chiếu riêng; không tự suy hiện tượng từ đáp án. Các câu chưa có minh hoạ vẫn giữ nguyên đề và hình.</p><label>Lọc trạng thái <select id="status" onchange="filter()"><option value="">Tất cả</option><option value="done">Đã gắn minh hoạ</option><option value="pending">Cần đối chiếu</option></select></label> <input id="search" aria-label="Tìm câu" placeholder="Tìm mã câu, hoá chất…" oninput="filter()"><script>function filter(){const s=document.getElementById('search').value.toLocaleLowerCase('vi'),t=document.getElementById('status').value;for(const a of document.querySelectorAll('article'))a.hidden=(!a.textContent.toLocaleLowerCase('vi').includes(s))||(t&&a.dataset.status!==t)}</script>'''+''.join(parts)+'</html>')
print(json.dumps(counts,ensure_ascii=False))
