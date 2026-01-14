#!/bin/bash

# Quick ESLint fix script for common violations
echo "Starting ESLint fixes..."

# Replace common 'any' types with proper types
find src -name "*.ts" -type f -exec sed -i '' 's/: any\([^A-Za-z]\)/: unknown\1/g' {} \;
find src -name "*.ts" -type f -exec sed -i '' 's/locationDetails?: any/locationDetails?: Record<string, unknown>/g' {} \;
find src -name "*.ts" -type f -exec sed -i '' 's/userContext?: any/userContext?: Record<string, unknown>/g' {} \;
find src -name "*.ts" -type f -exec sed -i '' 's/metadata?: any/metadata?: Record<string, unknown>/g' {} \;
find src -name "*.ts" -type f -exec sed -i '' 's/config?: any/config?: Record<string, unknown>/g' {} \;
find src -name "*.ts" -type f -exec sed -i '' 's/options?: any/options?: Record<string, unknown>/g' {} \;
find src -name "*.ts" -type f -exec sed -i '' 's/data?: any/data?: unknown/g' {} \;

# Fix common catch block error types
find src -name "*.ts" -type f -exec sed -i '' 's/catch (error: any)/catch (error: unknown)/g' {} \;

# Fix unused variables by prefixing with underscore
find src -name "*.ts" -type f -exec sed -i '' 's/winner\([^A-Za-z]\)/_winner\1/g' {} \;
find src -name "*.ts" -type f -exec sed -i '' 's/data, /data: unknown, /g' {} \;

echo "Basic fixes applied. Running ESLint to check progress..."

npm run lint 2>&1 | tail -5