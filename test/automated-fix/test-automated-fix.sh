cp cases cases-backup -r

(cd ../.. && npx tslint test/automated-fix/cases/tslint.json test/automated-fix/cases/*.ts --fix)

echo "Diff between the test cases and the expected version. If empty, then the test passed"
echo

diff -bur --color cases expected
rm cases -r
mv cases-backup cases
