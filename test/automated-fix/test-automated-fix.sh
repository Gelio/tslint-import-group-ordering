cp cases cases-backup -r
npx tslint --fix cases
diff -bur --color cases expected
rm cases -r
mv cases-backup cases
