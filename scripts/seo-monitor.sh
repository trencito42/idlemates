#!/bin/bash

# IdleMates SEO Monitor Script
# This script runs comprehensive SEO audits and can be used in CI/CD or scheduled monitoring

set -e

echo "🚀 IdleMates SEO Monitor Starting..."
echo "⏰ $(date)"
echo ""

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Function to check if service is running
check_service() {
    local service_name=$1
    local port=$2
    
    if curl -s -o /dev/null -w "%{http_code}" "http://localhost:$port" | grep -q "200\|301\|302"; then
        echo -e "${GREEN}✅ $service_name is running on port $port${NC}"
        return 0
    else
        echo -e "${RED}❌ $service_name is not accessible on port $port${NC}"
        return 1
    fi
}

# Function to test OG endpoint
test_og_endpoint() {
    local endpoint=$1
    echo "🖼️  Testing OG: $endpoint"
    
    local status=$(curl -s -o /dev/null -w "%{http_code}" "https://idlemat.es$endpoint")
    
    if [ "$status" = "200" ]; then
        echo -e "${GREEN}   ✅ Working (HTTP $status)${NC}"
        return 0
    else
        echo -e "${RED}   ❌ Failed (HTTP $status)${NC}"
        return 1
    fi
}

# Function to check page metadata
check_page_metadata() {
    local page=$1
    echo "📄 Checking metadata: $page"
    
    local content=$(curl -s "https://idlemat.es$page")
    
    # Check for essential meta tags
    local has_title=$(echo "$content" | grep -c "<title>" || true)
    local has_description=$(echo "$content" | grep -c 'name="description"' || true)
    local has_og_image=$(echo "$content" | grep -c 'property="og:image"' || true)
    local has_twitter_image=$(echo "$content" | grep -c 'name="twitter:image"' || true)
    
    local errors=0
    
    if [ "$has_title" -eq 0 ]; then
        echo -e "${RED}   ❌ Missing <title> tag${NC}"
        ((errors++))
    fi
    
    if [ "$has_description" -eq 0 ]; then
        echo -e "${RED}   ❌ Missing meta description${NC}"
        ((errors++))
    fi
    
    if [ "$has_og_image" -eq 0 ]; then
        echo -e "${RED}   ❌ Missing og:image${NC}"
        ((errors++))
    fi
    
    if [ "$has_twitter_image" -eq 0 ]; then
        echo -e "${YELLOW}   ⚠️  Missing twitter:image${NC}"
    fi
    
    if [ "$errors" -eq 0 ]; then
        echo -e "${GREEN}   ✅ All essential metadata present${NC}"
        return 0
    else
        return 1
    fi
}

# Main execution
main() {
    echo -e "${BLUE}1. Checking Services...${NC}"
    
    # Check if Next.js is running
    if ! check_service "Next.js" "3699"; then
        echo -e "${YELLOW}⚠️  Starting IdleMates services...${NC}"
        ./start.sh
        sleep 10
        
        if ! check_service "Next.js" "3699"; then
            echo -e "${RED}💥 Failed to start services${NC}"
            exit 1
        fi
    fi
    
    echo ""
    echo -e "${BLUE}2. Quick OG Image Tests...${NC}"
    
    og_errors=0
    
    test_og_endpoint "/api/og" || ((og_errors++))
    test_og_endpoint "/api/og?title=Test&subtitle=Description" || ((og_errors++))
    
    echo ""
    echo -e "${BLUE}3. Quick Metadata Checks...${NC}"
    
    metadata_errors=0
    
    check_page_metadata "/" || ((metadata_errors++))
    check_page_metadata "/pricing" || ((metadata_errors++))
    check_page_metadata "/faq" || ((metadata_errors++))
    check_page_metadata "/news" || ((metadata_errors++))
    
    echo ""
    echo -e "${BLUE}4. Running Full SEO Audit...${NC}"
    
    if node scripts/seo-audit.js; then
        audit_success=true
    else
        audit_success=false
    fi
    
    echo ""
    echo "==================== SUMMARY ===================="
    
    if [ "$og_errors" -eq 0 ] && [ "$metadata_errors" -eq 0 ] && [ "$audit_success" = true ]; then
        echo -e "${GREEN}🎉 ALL CHECKS PASSED! SEO is perfect!${NC}"
        exit 0
    else
        echo -e "${RED}💥 SOME ISSUES FOUND:${NC}"
        [ "$og_errors" -gt 0 ] && echo -e "${RED}   • $og_errors OG image errors${NC}"
        [ "$metadata_errors" -gt 0 ] && echo -e "${RED}   • $metadata_errors metadata errors${NC}"
        [ "$audit_success" = false ] && echo -e "${RED}   • Full audit failed${NC}"
        exit 1
    fi
}

# Run if executed directly
if [[ "${BASH_SOURCE[0]}" == "${0}" ]]; then
    cd "$(dirname "$0")/.."
    main "$@"
fi