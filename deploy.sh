#!/bin/sh

npm config set //registry.npmjs.org/:_authToken=$NPM_TOKEN
npm run deploy