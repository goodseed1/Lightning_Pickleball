#!/bin/bash

# Fix common any types in the codebase

echo "Fixing common any types..."

# Fix setState<any> to proper types
find src -name "*.tsx" -o -name "*.ts" | xargs sed -i '' 's/useState<any>/useState<unknown>/g'

# Fix common event handler any types
find src -name "*.tsx" -o -name "*.ts" | xargs sed -i '' 's/(e: any)/(e: React.ChangeEvent<HTMLInputElement>)/g'
find src -name "*.tsx" -o -name "*.ts" | xargs sed -i '' 's/(error: any)/(error: Error | unknown)/g'
find src -name "*.tsx" -o -name "*.ts" | xargs sed -i '' 's/(data: any)/(data: unknown)/g'

# Fix function parameter any types
find src -name "*.tsx" -o -name "*.ts" | xargs sed -i '' 's/: any\[\]/: unknown[]/g'
find src -name "*.tsx" -o -name "*.ts" | xargs sed -i '' 's/Record<string, any>/Record<string, unknown>/g'

echo "Common any types fixed. Run 'npm run lint' to check remaining issues."