#!/bin/bash

dotnet build -c Release

cd ./bin/Release || exit 0

if [ -z "$1" ]
  then
    echo "No key argument supplied"
    exit
fi

key="$1"

dotnet nuget push MCMS.Forms.1.3.1.nupkg --api-key "$key" --source https://api.nuget.org/v3/index.json