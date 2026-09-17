# Shared experiment illustrations

`ExperimentDemo` (React) and `experimentHtml` (standalone HTML) use the same offline SVG scenes. Illustrations are visible during question answering at the teacher's explicit request. They show qualitative observations, not marked answer choices or computed answers.

## Source and maintenance

- `scripts/experiment-reviewed-map.json` records exact normalized stem fingerprints, source question IDs and authored scene IDs. It contains no student records or answer keys.
- Rebuild using `python3 scripts/build-experiment-catalog.py` and `python3 scripts/build-experiment-map.py`.
- Never automatically map an unknown stem using keywords or answer choices. Edits fail closed.
- Generic stems whose experiment is determined only by a table/figure need separate review and a context-aware identifier before mapping. Matching a generic stem to an arbitrary experiment is unsafe.
- Preserve original labels, numerical graphs and whole-question crops. Only the original two fully reviewed figure families can collapse their supplementary original image.
- `scripts/audit-experiments.py` audits an exported whole-bank snapshot. A keyword candidate is NOT a confirmed experiment; missing coverage must stay explicit.

## Scientific references used for review

The authored scenes are qualitative educational schematics; source question conditions determine which scene can be attached.

- https://edu.rsc.org/experiments/the-silver-mirror-test-with-tollens-reagent/822.article
- https://edu.rsc.org/experiments/making-esters-from-alcohols-and-acids/1743.article
- https://edu.rsc.org/experiments/investigating-redox-reactions-on-a-microscale/511.article
- https://edu.rsc.org/experiments/the-chemical-properties-of-phenol/547.article
- https://edu.rsc.org/experiments/reactivity-trends-of-the-alkali-metals/731.article
- https://edu.rsc.org/resources/flame-tests-using-metal-salts/1875.article
- https://edu.rsc.org/experiments/the-chemistry-of-silver/516.article
- https://home.miracosta.edu/dlr/102exp8.htm

The animation is not a laboratory procedure or quantitative model. Apparatus diagrams preserve the principles they depict but do not replace source apparatus labels or measurements. Changes to concentrations, excess reagents, heating and indicator can change the phenomenon and require review.

## Verification

- `npx vitest run tests/experiment-demo.test.tsx tests/experiment-catalog.test.tsx tests/projector-linebreak.test.ts`
- `node scripts/kiem-experiment-catalog.mjs` against the local Vite server: all scenes at mobile/desktop sizes, dark mode, labelled SVGs and reduced motion.
- `npm run build`

Whole-bank coverage is not complete. See the local audit report for exact covered records and remaining candidate groups. Do not describe the number of scanned records as the number of experiments implemented.
