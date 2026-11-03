"""Dựng PNG phục vụ soát hình, không đưa PNG xem trước vào app."""
from pathlib import Path
from concurrent.futures import ProcessPoolExecutor
import cairosvg
G=Path(__file__).resolve().parents[1]
S=G/'docs/hinh-vector-0311/ung-vien';O=Path('/workspace/scratch/vector-render');O.mkdir(parents=True,exist_ok=True)
def run(f):
 try:cairosvg.svg2png(url=str(f),write_to=str(O/(f.stem+'.png')));return None
 except Exception as e:return {'svg':f.name,'loi':str(e)}
if __name__=='__main__':
 with ProcessPoolExecutor(max_workers=4)as p:
  for r in p.map(run,sorted(S.glob('*.svg'))):
   if r:print(r,flush=True)
