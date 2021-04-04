#!/bin/bash

resPath=./wwwroot/mcms-forms-files
version=1.5.1008

rm -rf ${resPath:?}

fullPath=$resPath/$version

mkdir -p $fullPath

cp ../mcms-forms-ng/dist/mcms-form/mcms-form.*.js ../mcms-forms-ng/dist/mcms-form/styles.css \
  ../mcms-forms-ng/dist/mcms-form/3rdpartylicenses.txt ${fullPath:?} || exit
  
echo "copied: "
  
ls -lh ${fullPath:?}