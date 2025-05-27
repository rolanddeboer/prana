#!/bin/bash

HOSTNAME="$( hostname )"

if [[ ! $HOSTNAME == "ibu" ]]; then
  echo "This script is only allowed to run on host Ibu."
  exit
fi

if [ -x /root ]; then
  echo "You are running as root. Don't do that!"
  exit 1
fi

DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" >/dev/null 2>&1 && pwd )"
cd "$DIR/.."

# Update the project
git pull

# Build the project
npm run build