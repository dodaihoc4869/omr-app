#!/bin/bash
set -e
D=$(dirname "$0")
{ cat "$D/p1-head.html"; cat "$D/p2-body.html"; echo "<script>"; cat "$D/p3-data.js" "$D/p4-core.js" "$D/p5-labs.js" "$D/p6-quiz.js"; echo "</script>"; } > "$D/ester-lab.html"
{ echo '<!DOCTYPE html>'; echo '<html lang="vi">'; echo '<head>'; echo '<meta charset="UTF-8">'; echo '<meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover">';
  cat "$D/p1-head.html"; echo '</head>'; echo '<body>'; cat "$D/p2-body.html"; echo "<script>"; cat "$D/p3-data.js" "$D/p4-core.js" "$D/p5-labs.js" "$D/p6-quiz.js"; echo "</script>"; echo '</body>'; echo '</html>'; } > "$D/ester-lab-full.html"
wc -c "$D/ester-lab.html" "$D/ester-lab-full.html"
