#!/bin/sh

export VENDOR=$(pwd)/vendor/
export GOPATH=$VENDOR
export PATH=$PATH:$VENDOR/bin/

export GO=go