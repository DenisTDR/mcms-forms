#!/bin/bash


cd ./bin/Release || exit 0
rm -f ./MCMS.Forms.*.nupkg
cd ../../

./build.sh || exit 0

cd ./bin/Release || exit 0

if [ -z "$1" ]
  then
    echo "No key argument supplied"
    exit
fi

key="$1"

dotnet nuget push MCMS.Forms.*.nupkg --api-key "$key" --source https://api.nuget.org/v3/index.json