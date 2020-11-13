#!/bin/bash

resPath=./resources/mcms-forms-files/

rm -rf ${resPath:?}*

cp ../mcms-forms-ng/dist/mcms-form/mcms-form.*.js ../mcms-forms-ng/dist/mcms-form/styles.css \
  ../mcms-forms-ng/dist/mcms-form/3rdpartylicenses.txt ${resPath:?} || exit
  
echo "copied: "
  
ls -lh ${resPath:?}