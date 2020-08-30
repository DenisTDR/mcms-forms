#!/bin/bash

keyPath=/home/nm/.key/hashtag_2_key
cName=mcms-form

pushd ./dist/$cName >/dev/null || exit

echo "deploying to tdrs fake cdn..."

cp ../../cdn-index.html ../../index.html || exit

tar -czf ../mcms-form.tgz ../../index.html ./*.js ./*.js.map ./*.css ./*.css.map 3rdpartylicenses.txt || exit

rm ../../index.html || exit

targetPath=/var/www/tdrs.ro/fake-cdn/

echo "uploading ..."
scp -i $keyPath ../mcms-form.tgz root@tdrs.ro:$targetPath/public_html || exit

echo "deploying ..."
ssh -i $keyPath root@tdrs.ro "$targetPath/deploy-mcms-form.sh" || exit

rm ../mcms-form.tgz

echo "done!"

popd >/dev/null || exit
