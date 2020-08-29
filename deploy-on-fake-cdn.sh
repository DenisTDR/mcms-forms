#!/bin/bash

keyPath=/home/nm/.key/hashtag_2_key
cName=mcms-form

pushd ./dist/$cName > /dev/null || exit

echo "deploying to tdrs fake cdn..."

tar -czf ../mcms-form.tgz ./*.js ./*.js.map ./*.css ./*.css.map 3rdpartylicenses.txt || exit

targetPath=/var/www/tdrs.ro/fake-cdn/

scp -i $keyPath ../mcms-form.tgz root@tdrs.ro:$targetPath/public_html
ssh -i $keyPath root@tdrs.ro "$targetPath/deploy-mcms-form.sh"

rm ../mcms-form.tgz

echo "done!"

popd > /dev/null || exit
