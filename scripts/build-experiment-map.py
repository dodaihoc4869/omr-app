"""Rebuild exact matches from the reviewed, text-free manifest."""
import json,pathlib
r=json.loads(pathlib.Path('scripts/experiment-reviewed-map.json').read_text());registry={}
for row in r:
 key=row['fingerprint'];scenes=row['scenes']
 if key in registry and registry[key]!=scenes:raise ValueError('Conflicting reviewed mappings: '+key)
 registry[key]=scenes
pathlib.Path('src/lib/experiments/expanded.ts').write_text('// Exact reviewed stems only. Regenerate with scripts/build-experiment-map.py.\nexport const EXPANDED:Record<string,string[]>='+json.dumps(registry,ensure_ascii=False,indent=2)+'\n')
print(len(registry),'reviewed stems')
