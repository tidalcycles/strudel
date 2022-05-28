#/bin/sh
printf "{\n"
dircount=0
# for d in $searchRoot/*; do
find $1 -mindepth 1 -maxdepth 1 -iname "*" | sort | while read d; do
  if [ -d "$d" ]
  then
    if [ $dircount -ne 0 ]
    then
      printf ",\n"
    fi
    (( dircount++ ))
    dirname=`basename $d`
    printf "\"%s\": [" "$dirname"
    search2=$searchRoot/$dirname/*.WAV
    filecount=0
    find "$d" -iname "*.wav" | sort | while read f; do
    # for f in $search2; do
      filename=$(printf %q "$f")
      basename=${f##*/}
      if [[ ${basename:0:1} != "." ]]; then
        if [ $filecount -ne 0 ]; then
          printf ","
        fi
        (( filecount++ ))
        printf "\"%s/%s\"" "$dirname" "$basename"
      fi
    done
    printf "]"
  fi
done
printf "\n}\n"
