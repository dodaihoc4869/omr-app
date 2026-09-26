while true; do
  node fix_ts.cjs > out.txt
  if grep -q "Made 0 changes" out.txt; then
    break
  fi
  cat out.txt
done
