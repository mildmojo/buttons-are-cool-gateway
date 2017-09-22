#!/bin/bash

for i in dist/*
do
  [[ ! -d "$i" ]] && continue
  arch="${i##*/}"
  echo
  echo "Building for $arch..."
  cmd="$(npm bin)/pkg . -t node8-$arch --out-path $i"
  echo $cmd
  $cmd
  cp -v config.json.example cal*.xml $i
  pushd dist
  zip -r buttons-are-cool-server-$arch.zip $arch
  popd
done
