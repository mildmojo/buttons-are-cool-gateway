#!/bin/bash
version=`node -e 'console.log(require("./package.json").version)'`

for arch in linux-ia32 linux-x64 win32-ia32 win32-x64 darwin-x64
do
  distname=buttons-are-cool-gateway-$arch
  distpath=dist/$distname
  [[ ! -d "$distpath" ]] && mkdir -p $distpath
  echo
  echo "Building for $arch..."
  cmd="$(npm bin)/pkg . -t node8-$arch --out-path $distpath"

  # Build it
  echo $cmd
  $cmd

  # Install relevant files
  cp -v config.json.example cal*.xml $distpath

  pushd dist
  rm -v $distname-*.zip 2>/dev/null
  zip -r $distname-$version.zip $distname -x $distname/config.json
  popd
done
