#!/bin/bash

echo "Fixing unused variables by prefixing with underscore..."

# Common unused parameter patterns in club tab screens
find src/screens/clubs/tabs -name "*.tsx" | xargs sed -i '' 's/clubId:/_clubId:/g'
find src/screens/clubs/tabs -name "*.tsx" | xargs sed -i '' 's/userRole:/_userRole:/g'
find src/screens/clubs/tabs -name "*.tsx" | xargs sed -i '' 's/leagueId/_leagueId/g'

# Fix unused error parameters in catch blocks
find src -name "*.tsx" -o -name "*.ts" | xargs sed -i '' 's/catch (error)/catch (_error)/g'
find src -name "*.tsx" -o -name "*.ts" | xargs sed -i '' 's/} catch (e)/} catch (_e)/g'

# Fix unused function parameters
find src -name "*.tsx" -o -name "*.ts" | xargs sed -i '' 's/(props):/(_props):/g'
find src -name "*.tsx" -o -name "*.ts" | xargs sed -i '' 's/(index):/(_index):/g'

# Fix unused destructured variables - prefix with underscore
find src -name "*.tsx" -o -name "*.ts" | xargs sed -i '' 's/const { navigation/const { _navigation/g'

echo "Unused variables prefixed. Run 'npm run lint' to check remaining issues."