#!/bin/sh

# ==========================================
# Aethyr Git Pre-Commit Compliance Gate
# ==========================================

# Colors for terminal output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[0;33m'
NC='\033[0m' # No Color

echo "${YELLOW}🔍 Running Aethyr Compliance Checks...${NC}"

# ------------------------------------------
# 1. Check for Exposed Stellar Private Seeds
# ------------------------------------------
# Stellar seeds are 56 characters, uppercase, starting with 'S'
echo "🔒 Checking for private keys..."
SECRETS_FOUND=$(git diff --cached | grep -E "S[A-D][A-Z2-7]{54}" | grep -E "^\+")

if [ ! -z "$SECRETS_FOUND" ]; then
    echo "${RED}❌ ERROR: Stellar Private Seed detected in git diff! Commit aborted.${NC}"
    echo "$SECRETS_FOUND"
    exit 1
fi
echo "${GREEN}✅ Secret check passed.${NC}"

# ------------------------------------------
# 2. Selective Test Execution
# ------------------------------------------
STAGED_FILES=$(git diff --cached --name-only)
RUN_RUST=false
RUN_FRONTEND=false

for file in $STAGED_FILES; do
    case "$file" in
        contracts/*) RUN_RUST=true ;;
        src/*|package.json|tailwind.config.*|tsconfig.json) RUN_FRONTEND=true ;;
    esac
done

# Run Rust Tests
if [ "$RUN_RUST" = true ]; then
    echo "🦀 Rust changes detected. Running Soroban tests..."
    if [ -d "contracts" ]; then
        (cd contracts && cargo test)
        if [ $? -ne 0 ]; then
            echo "${RED}❌ ERROR: Rust tests failed! Commit aborted.${NC}"
            exit 1
        fi
    else
        echo "${YELLOW}⚠️ contracts directory not found, skipping Rust tests.${NC}"
    fi
fi

# Run Frontend Tests
if [ "$RUN_FRONTEND" = true ]; then
    echo "⚛️ Frontend changes detected. Running Vitest..."
    # Check if package.json has test script and node_modules exist
    if [ -f "package.json" ] && [ -d "node_modules" ]; then
        npm run test -- --run
        if [ $? -ne 0 ]; then
            echo "${RED}❌ ERROR: Frontend tests failed! Commit aborted.${NC}"
            exit 1
        fi
    else
        echo "${YELLOW}⚠️ package.json or node_modules not found, skipping frontend tests.${NC}"
    fi
fi

echo "${GREEN}✅ All compliance checks passed successfully!${NC}"
exit 0
