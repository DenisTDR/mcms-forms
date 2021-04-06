#!/bin/bash

if [ -z "$1" ]
  then
    echo "No key argument supplied"
    exit
fi

key="$1"

dotnet nuget push "./nuget-build/*.nupkg" "./nuget-build/*.snupkg" --api-key "$key" --source https://api.nuget.org/v3/index.json --skip-duplicate