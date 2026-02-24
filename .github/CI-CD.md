# CI/CD Pipeline Documentation

## Overview

This project uses **GitHub Actions** to automate testing, building, and quality checks on every push and pull request.

## Workflows

### 1. Tests & Coverage (`test.yml`)

**Trigger**: Push to main/develop, Pull Requests

**What it does**:
- Runs all tests (backend + frontend)
- Generates coverage reports
- Uploads coverage to Codecov
- Comments PRs with coverage summary
- Fails if coverage drops below 80%

**Duration**: ~10-15 minutes

**Key Steps**:
1. Checkout code
2. Setup Node.js 20.x
3. Install dependencies
4. Run linter (ESLint/TypeScript)
5. Run tests with coverage
6. Upload artifacts
7. Report to Codecov
8. Comment PR with results

**Example Output**:
```
✅ Tests passed: 927/927
✅ Coverage: 82% (↑ 2% from main)
  - Lines: 85%
  - Functions: 88%
  - Branches: 75%
  - Statements: 85%
```

### 2. Build & Type Check (`build.yml`)

**Trigger**: Push to main/develop, Pull Requests

**What it does**:
- Verifies TypeScript compilation
- Builds Vite bundle
- Checks build output
- Validates build structure

**Duration**: ~5-10 minutes

**Key Steps**:
1. Checkout code
2. Setup Node.js
3. Install dependencies
4. Run TypeScript type check
5. Build application
6. Validate output
7. Upload build artifacts

**Example Output**:
```
✅ Type check passed
✅ Build successful
Build size: 125KB (gzipped: 35KB)
```

### 3. Docker Build & Healthcheck (`docker.yml`)

**Trigger**: Push to main/develop, Pull Requests

**What it does**:
- Builds Docker image
- Starts container
- Runs health checks
- Tests API endpoints
- Verifies container startup

**Duration**: ~10 minutes

**Key Steps**:
1. Checkout code
2. Setup Docker Buildx
3. Build Docker image
4. Run container
5. Health check `/api/health`
6. Test API endpoints
7. Cleanup

**Example Output**:
```
✅ Docker image built
✅ Container started
✅ Health check passed
✅ API endpoints responding
```

## Coverage Requirements

- **Minimum Coverage**: 80%
- **Per-file Targets**:
  - Services: 90%+
  - Hooks: 85%+
  - Components: 80%+
  - Utils: 80%+

## Branch Protection

The `main` branch is configured with the following required checks:

1. ✅ **Tests & Coverage** - Must pass
2. ✅ **Build & Type Check** - Must pass
3. ✅ **Docker Build & Healthcheck** - Must pass (recommended)

**Requirements**:
- All checks must be passing
- Coverage must not drop below 80%
- PRs must be approved (if configured)

## Local Testing

### Run Tests Locally

```bash
# Run all tests
npm run test

# Run with coverage report
npm run test:coverage

# Run in watch mode
npm run test:watch

# Run UI dashboard
npm run test:ui

# Run specific test suite
npm run test:backend
npm run test:frontend
```

### Build Locally

```bash
# Build production bundle
npm run build

# Preview production build
npm run preview

# Type check
npm run lint
```

### Docker Build Locally

```bash
# Build Docker image
docker build -t promocode:local .

# Run container
docker run -d -p 3000:3000 --name promocode promocode:local

# Check health
curl http://localhost:3000/api/health

# Stop container
docker stop promocode
docker rm promocode

# Use docker-compose
docker-compose up -d
docker-compose logs -f
docker-compose down
```

### Test Workflows Locally (with `act`)

```bash
# Install act (GitHub Actions local runner)
brew install act  # macOS
# or
sudo apt install act  # Linux

# Run test workflow
act push -j test

# Run build workflow
act push -j build

# Run docker workflow
act push -j docker

# List available jobs
act -l
```

## Codecov Integration

Coverage reports are automatically uploaded to [Codecov.io](https://codecov.io).

**Features**:
- Detailed coverage breakdown
- PR comments with coverage diff
- Coverage history tracking
- Badge for README

**Coverage Badge**:
```markdown
[![codecov](https://codecov.io/gh/thallesfreitas/druid-tickets/branch/main/graph/badge.svg)](https://codecov.io/gh/thallesfreitas/druid-tickets)
```

## Artifacts

GitHub Actions stores the following artifacts from workflow runs:

### Test Workflow
- `coverage-report-20.x/` - Coverage HTML report, LCOV files

**Access**:
1. Go to Actions tab
2. Select workflow run
3. Download artifact at bottom

### Build Workflow
- `build-dist-20.x/` - Production build output (`dist/`)

**Access**: Same as above

## Troubleshooting

### Coverage Below Threshold

**Problem**: Workflow fails with "Coverage below 80%"

**Solution**:
1. Run tests locally: `npm run test:coverage`
2. Check coverage report: `open coverage/index.html`
3. Write missing tests for untested code
4. Commit and push

### Build Fails with TypeScript Error

**Problem**: Build workflow fails at type check

**Solution**:
1. Run type check locally: `npm run lint`
2. Fix errors shown
3. Rebuild: `npm run build`
4. Commit and push

### Docker Container Won't Start

**Problem**: Docker workflow fails health check

**Solution**:
1. Build locally: `docker build -t test .`
2. Run: `docker run -it -p 3000:3000 test`
3. Check logs: `docker logs <container-id>`
4. Fix issues and rebuild

### Workflow Takes Too Long

**Problem**: Workflow duration > expected

**Solution**:
1. Check for slow tests: `npm run test -- --reporter=verbose`
2. Parallelize tests if needed
3. Use `cache: 'npm'` in workflows (already configured)
4. Check Node.js version compatibility

## Environment Variables

Workflows can access environment variables:

### Available in Workflows
- `GITHUB_SHA` - Commit hash
- `GITHUB_REF` - Branch name
- `GITHUB_EVENT_NAME` - push/pull_request
- `GITHUB_TOKEN` - GitHub API token (automatic)

### Secrets
Configure in **Settings → Secrets and variables → Actions**:

- `CODECOV_TOKEN` (optional) - For Codecov authentication
- `REGISTRY_PASSWORD` (future) - For Docker registry push

## Maintenance

### Update Actions Versions

Periodically update action versions for security:

```bash
# Check for outdated actions
# Look for "uses: actions/..." in .github/workflows/

# Update example:
# OLD: uses: actions/setup-node@v3
# NEW: uses: actions/setup-node@v4
```

### Monitor Coverage Trends

1. Visit Codecov dashboard
2. Review coverage history
3. Identify declining files
4. Add tests to trending down areas

### Clean Up Old Artifacts

GitHub automatically removes artifacts after 30 days, but you can:

1. Go to **Actions → Workflow**
2. Delete specific run artifacts manually
3. Or configure retention period in workflow

## Performance Tips

1. **Use npm cache**: Already enabled (`cache: 'npm'`)
2. **Parallel jobs**: Workflows run sequentially; use matrix strategy
3. **Condition jobs**: Use `if:` to skip unnecessary jobs
4. **Docker buildx cache**: Uses GitHub Actions cache
5. **Upload only important artifacts**: Reduces storage

## References

- [GitHub Actions Documentation](https://docs.github.com/en/actions)
- [Codecov Documentation](https://docs.codecov.com)
- [Vitest Documentation](https://vitest.dev)
- [Docker Build Action](https://github.com/docker/build-push-action)

## Support

For issues with CI/CD workflows:

1. Check workflow logs in **Actions** tab
2. Run tests locally: `npm run test:coverage`
3. Review error messages carefully
4. Check documentation links above

---

**Last updated**: 2026-02-22
**Node.js Version**: 20.x LTS
**Coverage Threshold**: 80%
