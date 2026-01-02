#!/bin/bash

# Builds the libary by setting the required environment necessary

set -e

echo "Creating artificial library environment"

SCRIPT_PATH="$(dirname "$0")"
ROOT_PATH="$(realpath "${SCRIPT_PATH}/..")"
OUTPUT_PATH="${ROOT_PATH}/output/tmp"
SYMLINK="${OUTPUT_PATH}/flibbles"

# Libraries can only be built from the TIDDLYWIKI_PLUGIN_PATH env
# Which expects plugins to available in (author)/(plugin)/plugin.info format.
# Our repository is not that way, so we need to fake it for a second.
mkdir -p "${OUTPUT_PATH}"
ln -s "${ROOT_PATH}/plugins" "${SYMLINK}"

# We want to be sure to clean this up by the time we're done
trap "rm -Rf \"${OUTPUT_PATH}\"" EXIT

# OUTPUT_PATH comes first, so it supercedes any globally installed relink
TIDDLYWIKI_PLUGIN_PATH=${OUTPUT_PATH}:${TIDDLYWIKI_PLUGIN_PATH}

#Diagnostic stuff for now
echo "TIDDLYWIKI_PLUGIN_PATH=${TIDDLYWIKI_PLUGIN_PATH}"
ls -la "${SYMLINK}"

# Now let's run the library with the path set correctly
tiddlywiki --build library
