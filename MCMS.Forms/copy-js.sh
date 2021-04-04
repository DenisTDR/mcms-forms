#!/bin/bash

resPath=./wwwroot/mcms-forms-files
version=$(awk -F'[<>]' '/<Version>/{print $3}' ./MCMS.Forms.csproj)

rm -rf ${resPath:?}

fullPath=$resPath/$version

mkdir -p "$fullPath"

cp ../mcms-forms-ng/dist/mcms-form/mcms-form.*.js ../mcms-forms-ng/dist/mcms-form/styles.css \
  ../mcms-forms-ng/dist/mcms-form/3rdpartylicenses.txt "${fullPath:?}" || exit
  
echo "copied: "
  
ls -lh "${fullPath:?}"