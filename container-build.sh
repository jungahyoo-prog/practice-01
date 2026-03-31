#!/bin/bash

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo "=================================="
echo "🚀 Container Build Script"
echo "=================================="
echo ""

# Function to display error and exit
error_exit() {
    echo -e "${RED}✗ Error: $1${NC}" >&2
    exit 1
}

# Function to display success
success() {
    echo -e "${GREEN}✓ $1${NC}"
}

# Function to display info
info() {
    echo -e "${YELLOW}→ $1${NC}"
}

# Function to install podman
install_podman() {
    info "Podman 설치를 시작합니다..."
    echo ""

    if [[ "$OSTYPE" == "darwin"* ]]; then
        # macOS
        if command -v brew &> /dev/null; then
            info "Homebrew를 사용하여 Podman을 설치합니다..."
            brew install podman || error_exit "Podman 설치 실패"
            info "Podman machine을 초기화합니다..."
            podman machine init || error_exit "Podman machine 초기화 실패"
            info "Podman machine을 시작합니다..."
            podman machine start || error_exit "Podman machine 시작 실패"
            success "Podman 설치 완료!"
        else
            error_exit "Homebrew가 설치되어 있지 않습니다. https://brew.sh 에서 먼저 Homebrew를 설치해주세요."
        fi
    elif [[ "$OSTYPE" == "linux-gnu"* ]]; then
        # Linux
        if command -v apt-get &> /dev/null; then
            # Debian/Ubuntu
            info "apt-get을 사용하여 Podman을 설치합니다..."
            sudo apt-get update || error_exit "패키지 목록 업데이트 실패"
            sudo apt-get install -y podman || error_exit "Podman 설치 실패"
            success "Podman 설치 완료!"
        elif command -v dnf &> /dev/null; then
            # Fedora/RHEL
            info "dnf를 사용하여 Podman을 설치합니다..."
            sudo dnf install -y podman || error_exit "Podman 설치 실패"
            success "Podman 설치 완료!"
        elif command -v yum &> /dev/null; then
            # CentOS
            info "yum을 사용하여 Podman을 설치합니다..."
            sudo yum install -y podman || error_exit "Podman 설치 실패"
            success "Podman 설치 완료!"
        else
            error_exit "지원되지 않는 Linux 배포판입니다. https://podman.io/getting-started/installation 에서 수동으로 설치해주세요."
        fi
    else
        error_exit "지원되지 않는 운영체제입니다. https://podman.io/getting-started/installation 에서 수동으로 설치해주세요."
    fi

    echo ""
}

# Detect container runtime (Docker or Podman)
info "컨테이너 런타임을 확인하는 중..."

CONTAINER_CMD=""

# Check Docker first
if command -v docker &> /dev/null; then
    # Check if Docker is actually usable
    if docker ps &> /dev/null; then
        CONTAINER_CMD="docker"
        success "Docker를 사용합니다"
    else
        echo -e "${YELLOW}⚠ Docker가 설치되어 있지만 실행되지 않습니다${NC}"
        echo -e "${YELLOW}  Docker Desktop을 시작하거나 Docker daemon을 실행해주세요${NC}"
    fi
fi

# If Docker is not available, check Podman
if [ -z "$CONTAINER_CMD" ] && command -v podman &> /dev/null; then
    # Check if Podman is actually usable
    if podman ps &> /dev/null; then
        CONTAINER_CMD="podman"
        success "Podman을 사용합니다"
    else
        echo -e "${YELLOW}⚠ Podman이 설치되어 있지만 실행되지 않습니다${NC}"
        echo -e "${YELLOW}  macOS의 경우: podman machine start${NC}"
    fi
fi

# If no container runtime is available
if [ -z "$CONTAINER_CMD" ]; then
    echo ""
    echo -e "${YELLOW}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
    echo -e "${YELLOW}⚠ Docker와 Podman이 모두 설치되어 있지 않습니다${NC}"
    echo -e "${YELLOW}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
    echo ""
    echo "컨테이너 이미지를 빌드하려면 Docker 또는 Podman이 필요합니다."
    echo ""
    echo "설치 옵션:"
    echo "  1. Docker   - https://docs.docker.com/get-docker/"
    echo "  2. Podman   - https://podman.io/getting-started/installation"
    echo ""
    echo "💡 Podman은 Docker와 호환되며 무료 오픈소스입니다."
    echo ""
    read -p "지금 Podman을 자동으로 설치하시겠습니까? (y/n): " INSTALL_PODMAN

    if [[ "$INSTALL_PODMAN" =~ ^[Yy]$ ]]; then
        install_podman
        CONTAINER_CMD="podman"
    else
        echo ""
        echo -e "${BLUE}설치를 건너뛰었습니다.${NC}"
        echo ""
        echo "나중에 Docker 또는 Podman을 설치한 후 다시 실행해주세요:"
        echo "  ${GREEN}npm run container:build${NC}"
        echo ""
        exit 0
    fi
fi

echo ""

# Check if node_modules exists, if not run npm install
if [ ! -d "node_modules" ]; then
    echo ""
    info "node_modules가 없습니다. 의존성을 설치합니다..."
    if npm install; then
        success "의존성 설치 완료"
    else
        error_exit "의존성 설치 실패"
    fi
    echo ""
fi

# Get project name from package.json
if [ -f "package.json" ]; then
    PROJECT_NAME=$(grep -o '"name": *"[^"]*"' package.json | sed 's/"name": *"\(.*\)"/\1/')
else
    PROJECT_NAME=$(basename "$PWD")
fi

# Use custom tag if provided, otherwise use project name
if [ -n "$1" ]; then
    IMAGE_NAME="$1"
    info "커스텀 이미지 이름: $IMAGE_NAME"
else
    IMAGE_NAME="${PROJECT_NAME}:latest"
    info "이미지 이름: $IMAGE_NAME"
fi

echo ""

# Check if Dockerfile exists
if [ ! -f "Dockerfile" ]; then
    error_exit "Dockerfile이 현재 디렉토리에 없습니다"
fi

success "Dockerfile을 찾았습니다"
echo ""

# Build container image
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
info "컨테이너 이미지를 빌드합니다..."
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""

BUILD_START=$(date +%s)

if $CONTAINER_CMD build -t "$IMAGE_NAME" .; then
    BUILD_END=$(date +%s)
    BUILD_TIME=$((BUILD_END - BUILD_START))

    echo ""
    echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
    success "빌드 성공! 🎉"
    echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
    echo ""
    echo -e "${BLUE}빌드 시간: ${BUILD_TIME}초${NC}"

    # Get image size
    IMAGE_SIZE=$($CONTAINER_CMD images "$IMAGE_NAME" --format "{{.Size}}")
    echo -e "${BLUE}이미지 크기: ${IMAGE_SIZE}${NC}"
    echo ""

    echo "다음 단계:"
    echo ""
    echo "1. 컨테이너 실행:"
    echo -e "   ${GREEN}$CONTAINER_CMD run -p 3000:3000 $IMAGE_NAME${NC}"
    echo ""
    echo "2. 브라우저에서 확인:"
    echo -e "   ${GREEN}http://localhost:3000${NC}"
    echo ""
    echo "3. 컨테이너 중지 (다른 터미널에서):"
    echo -e "   ${GREEN}$CONTAINER_CMD ps${NC}  # 실행 중인 컨테이너 확인"
    echo -e "   ${GREEN}$CONTAINER_CMD stop <container-id>${NC}"
    echo ""
    echo "4. 컨테이너 및 이미지 정리 (필요시):"
    echo -e "   ${GREEN}# 방법 1: 개별 삭제${NC}"
    echo -e "   ${GREEN}$CONTAINER_CMD ps -a${NC}  # 모든 컨테이너 확인"
    echo -e "   ${GREEN}$CONTAINER_CMD rm <container-id>${NC}  # 컨테이너 삭제"
    echo -e "   ${GREEN}$CONTAINER_CMD rmi $IMAGE_NAME${NC}  # 이미지 삭제"
    echo ""
    echo -e "   ${GREEN}# 방법 2: 강제 삭제 (사용 중인 컨테이너도 삭제)${NC}"
    echo -e "   ${GREEN}$CONTAINER_CMD rm -f \$($CONTAINER_CMD ps -aq --filter ancestor=$IMAGE_NAME)${NC}"
    echo -e "   ${GREEN}$CONTAINER_CMD rmi -f $IMAGE_NAME${NC}"
    echo ""
    echo -e "   ${GREEN}# 방법 3: 정리 명령어 사용 (가장 간단)${NC}"
    echo -e "   ${GREEN}$CONTAINER_CMD container prune -f${NC}  # 중지된 모든 컨테이너 삭제"
    echo -e "   ${GREEN}$CONTAINER_CMD rmi $IMAGE_NAME${NC}  # 이미지 삭제"
    echo ""
    echo -e "${YELLOW}💡 Tip: 이미지 삭제 시 \"image is in use\" 에러가 나면${NC}"
    echo -e "${YELLOW}   먼저 해당 이미지를 사용하는 컨테이너를 삭제해야 합니다.${NC}"
    echo ""
else
    echo ""
    echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
    error_exit "빌드 실패"
fi
