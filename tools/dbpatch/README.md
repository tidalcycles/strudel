# dbpatch

this is a little script to update all patterns in the db. Go to supabase and export as csv as `code_rows.csv` to this folder.
Then run

```sh
node dbpatch.mjs > code_rows_patched.csv
```

It will output a csv file with the changes implemented in dbpatch.mjs
