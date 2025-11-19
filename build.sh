#!/bin/bash

# 获取版本号
VERSION=$(grep '"version"' manifest.json | sed 's/.*"\([0-9.]*\)".*/\1/')
PACKAGE_NAME="Marsunso-v${VERSION}.zip"

echo "📦 Building Marsunso v${VERSION}..."

# 创建临时目录
TEMP_DIR="build_temp"
rm -rf $TEMP_DIR
mkdir -p $TEMP_DIR

# 复制需要的文件
echo "📋 Copying files..."
cp manifest.json $TEMP_DIR/
cp popup.html $TEMP_DIR/
cp popup.js $TEMP_DIR/
cp popup.css $TEMP_DIR/
cp background.js $TEMP_DIR/

# 复制目录
cp -r scripts $TEMP_DIR/
cp -r images $TEMP_DIR/
cp -r lib $TEMP_DIR/

# 创建压缩包
echo "🗜️  Creating zip file..."
cd $TEMP_DIR
zip -r ../$PACKAGE_NAME . -x "*.DS_Store"
cd ..

# 清理临时目录
rm -rf $TEMP_DIR

echo "✅ Build complete: $PACKAGE_NAME"
echo ""
echo "📤 Next steps:"
echo "1. Create a new release on GitHub: https://github.com/Helchan/Marsunso/releases/new"
echo "2. Tag version: v${VERSION}"
echo "3. Upload: $PACKAGE_NAME"
