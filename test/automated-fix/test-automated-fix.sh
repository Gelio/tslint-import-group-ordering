cp cases cases-backup -r

(cd ../.. && npx tslint test/automated-fix/cases/tslint.json test/automated-fix/cases/*.ts --fix)

DIFF=$(diff -bur --color cases expected)
rm cases -r
mv cases-backup cases

if (( $(grep -c . <<<"$DIFF") > 1 )); then
  echo "Diff is not empty. The test did not pass"
  echo "$DIFF"
  exit 1
else
  exit 0
fi
