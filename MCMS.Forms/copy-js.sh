#!/bin/bash

set -e

destPath=./wwwroot/mcms-forms-files

if [ $# -eq 0 ] || [[ $1 != "publish-"* ]]; then
  echo "Invalid git tag argument supplied. Usage: pack.sh publish-x.y.z"
  exit 1
fi


version=${1#publish-}
#version=$(awk -F'[<>]' '/<Version>/{print $3}' ./MCMS.Forms.csproj)

rm -rf ${destPath:?}

destPath=$destPath/$version

mkdir -p "$destPath"

srcPath=../mcms-forms-ng/dist/mcms-form

cp ${srcPath:?}/mcms-form.*.js ${srcPath:?}/styles.css ${srcPath:?}/3rdpartylicenses.txt "${destPath:?}" || exit

echo "copied for version" "${version:?}"":"
ls -lh "${destPath:?}"
