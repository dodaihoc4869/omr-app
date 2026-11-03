"""Ghi nhận kết quả soát độc lập có hash cụ thể; không tự duyệt hình."""
from pathlib import Path
import sys,json,hashlib
G=Path(__file__).resolve().parents[1];P=G/'docs/hinh-vector-0311/kiem'
target=Path(sys.argv[1]);incoming=json.loads(Path(sys.argv[2]).read_text());rows=json.loads(target.read_text());proofFile=target.with_name(target.stem.replace('-ban-dung','')+'-soat-doc-lap.json');proof=json.loads(proofFile.read_text())if proofFile.exists()else[]
for x in incoming:
 a=next(a for a in rows if a['i']==x['i']);actual=hashlib.sha256((P/a['svg']).read_bytes()).hexdigest();assert actual==a['hashSvg']==x['hashSvg'],x['i'];assert x['nguoiSoat']and x['ketQua'];a.update(trangThai='da-soat-doc-lap',hashSvgDaSoat=actual,nguoiSoat=x['nguoiSoat']);proof=[p for p in proof if p['i']!=x['i']];proof.append(dict(x,hash=a['hash'],hashSvgDaSoat=actual))
target.write_text(json.dumps(rows,ensure_ascii=False,indent=2));proofFile.write_text(json.dumps(proof,ensure_ascii=False,indent=2));print('Ghi nhận',len(incoming),'kết quả độc lập khớp hash.')
