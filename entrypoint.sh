#!/bin/sh
set -e

echo "==> Pushing database schema..."
./node_modules/.bin/prisma db push --skip-generate

echo "==> Running seed..."
node -e "
const { execSync } = require('child_process');
try {
  execSync('npx tsx prisma/seed.ts', { stdio: 'inherit' });
  console.log('Seed completed successfully');
} catch (err) {
  console.error('Seed failed, continuing anyway:', err.message);
}
"

echo "==> Starting Next.js..."
exec npx next start -p 80 -H 0.0.0.0
