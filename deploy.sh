#!/bin/sh

# NPM_TOKEN set in travis-ci.org dashboard and used by npm publish

npm config set //registry.npmjs.org/:_authToken=$NPM_TOKEN
npm run deploy