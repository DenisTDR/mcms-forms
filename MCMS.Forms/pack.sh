#!/bin/bash

if [ $# -eq 0 ] || [[ $1 != "publish-"* ]]; then
  echo "Invalid git tag argument supplied. Usage: pack.sh publish-x.y.z"
  exit 1
fi

version=${1#publish-}

buildDir=../nuget-build

export VERSION=$version
export ENV_TYPE=CI_BUILD

mkdir -p $buildDir

dotnet pack -c Release -o "$buildDir" -p:PackageVersion="$version" MCMS.Forms.csproj
