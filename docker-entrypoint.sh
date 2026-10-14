#!/bin/sh
set -e
# 바인드 마운트한 data 폴더가 root 소유로 만들어져도 node 사용자가 쓸 수 있게 맞춘다
if [ "$(id -u)" = "0" ]; then
  mkdir -p "$DATA_DIR"
  chown -R node:node "$DATA_DIR"
  exec su-exec node "$@"
fi
exec "$@"
