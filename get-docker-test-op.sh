#!/bin/sh
docker cp dust-dev-server-1:/workspace/coverage .
docker cp dust-dev-server-1:/workspace/playwright-report .
docker cp dust-dev-server-1:/workspace/public/user-guide.md ./public