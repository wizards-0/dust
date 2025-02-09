#!/bin/sh
yarn install
yarn run playwright install --with-deps
yarn run dev &