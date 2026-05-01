#!/bin/bash
set -e  # Exit the script if any command fails

if [ -z "$1" ]; then
  echo "Please provide the version to release and the next development version. Example: ./release.sh 0.2.0 0.3.0"
  exit 1
fi

if [ -z "$2" ]; then
  echo "Please provide the version to release and the next development version. Example: ./release.sh 0.2.0 0.3.0"
  exit 1
fi

if ! [[ "$1" =~ ^[0-9]+\.[0-9]+\.[0-9]+$ ]]; then
  echo "The release version must be in the format A.B.C. Example: 0.2.0"
  exit 1
fi

if ! [[ "$2" =~ ^[0-9]+\.[0-9]+\.[0-9]+$ ]]; then
  echo "The next development version must be in the format A.B.C. Example: 0.3.0"
  exit 1
fi

NEW_VERSION="$1"
NEXT_VERSION="$2"

echo "Releasing version $NEW_VERSION"
pnpm version "$NEW_VERSION" --no-git-tag-version
pnpm run build
pnpm run test
git commit -am "Version $NEW_VERSION"
git tag "v$NEW_VERSION"
git push
git push origin "v$NEW_VERSION"
pnpm publish --access public
gh release create "v$NEW_VERSION" --generate-notes

echo "Setting version to $NEXT_VERSION"
pnpm version "$NEXT_VERSION" --no-git-tag-version
git commit -am "Version $NEXT_VERSION"
git push
