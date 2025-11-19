#!/bin/bash

VERSION=$(grep '"version"' manifest.json | sed 's/.*"\([0-9.]*\)".*/\1/')
TAG="v${VERSION}"
ZIP_FILE="Marsunso-v${VERSION}.zip"

echo "🚀 Preparing to release ${TAG}..."

# 检查是否已有该 tag
if git rev-parse "$TAG" >/dev/null 2>&1; then
    echo "❌ Tag $TAG already exists!"
    exit 1
fi

# 检查压缩包是否存在
if [ ! -f "$ZIP_FILE" ]; then
    echo "❌ $ZIP_FILE not found! Run ./build.sh first."
    exit 1
fi

# 创建并推送 tag
echo "📌 Creating tag ${TAG}..."
git tag -a "$TAG" -m "Release ${TAG}"
git push origin "$TAG"

echo ""
echo "✅ Tag pushed successfully!"
echo ""
echo "📦 Now please manually create the release:"
echo "1. Visit: https://github.com/Helchan/Marsunso/releases/new?tag=${TAG}"
echo "2. Upload: $ZIP_FILE"
echo "3. Add release notes and publish"
echo ""
echo "Or install GitHub CLI and run:"
echo "   gh release create ${TAG} ${ZIP_FILE} --title 'Marsunso ${TAG}' --notes '发布 ${TAG} 版本'"
