#!/bin/bash
set -e  # Exit the script if any command fails

if [ -f .env ]; then
  export $(grep -v '^#' .env | xargs)
fi

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
CURRENT_VERSION=$(node -p "require('./package.json').version")
if [ "$CURRENT_VERSION" != "$NEW_VERSION" ]; then
  pnpm version "$NEW_VERSION" --no-git-tag-version
fi
pnpm install --frozen-lockfile
pnpm run typecheck
pnpm run lint
pnpm run format:check
pnpm run test
pnpm run build
if ! git diff --quiet; then
  git commit -am "Version $NEW_VERSION"
  git push
fi
git tag "v$NEW_VERSION"
git push origin "v$NEW_VERSION"
pnpm publish --access public --no-git-checks
gh release create "v$NEW_VERSION" --generate-notes

echo "Setting version to $NEXT_VERSION"
pnpm version "$NEXT_VERSION" --no-git-tag-version
git commit -am "Version $NEXT_VERSION"
git push
