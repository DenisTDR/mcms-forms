#!/bin/bash

if [ -z "$1" ]
  then
    echo "No version argument supplied. taking from package.json"
    node extract_version.js
    version=$(cat version.txt)
    rm version.txt
    echo "Found version $version"
  else
    version=$1
fi

keyPath=/home/nm/.key/hashtag_2_key
cName=mcms-form

pushd ./dist/$cName >/dev/null || exit

echo "deploying to tdrs fake cdn..."

sed "s/{{version}}/$version/g" ../../cdn-index.html > ./index.html || exit

tar -czf ../mcms-form.tgz ./index.html ./*.css.map 3rdpartylicenses.txt || exit

targetPath=/var/www/tdrs.ro/fake-cdn

echo "uploading ..."
scp -i $keyPath ../mcms-form.tgz tdr@tdrs.ro:~/ || exit
ssh -i $keyPath tdr@tdrs.ro "sudo mv ~/mcms-form.tgz $targetPath/public_html" || exit

echo "deploying ..."
ssh -i $keyPath tdr@tdrs.ro "sudo $targetPath/deploy-mcms-form.sh $version" || exit

rm ../mcms-form.tgz

echo "done!"

popd >/dev/null || exit
