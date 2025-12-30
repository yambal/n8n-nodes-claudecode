# n8n Custom Node Development Script (PowerShell)
# Usage: .\scripts\dev-test.ps1 [command]
#   build    - Build only
#   link     - Build + Link setup (first time only)
#   unlink   - Remove links
#   start    - Build + Start n8n
#   test     - Build + Run workflow test
#   all      - Full cycle (Build -> Link -> Test)

param(
    [Parameter(Position=0)]
    [ValidateSet("build", "link", "unlink", "start", "test", "all", "help")]
    [string]$Command = "help"
)

$ErrorActionPreference = "Stop"

# Project root
$ProjectRoot = Split-Path -Parent (Split-Path -Parent $MyInvocation.MyCommand.Path)
$N8nCustomDir = Join-Path $env:USERPROFILE ".n8n\custom"
$PackageName = "n8n-nodes-claudecode"

# Log functions
function Write-Info { param($Message) Write-Host "[INFO] $Message" -ForegroundColor Blue }
function Write-Success { param($Message) Write-Host "[OK] $Message" -ForegroundColor Green }
function Write-Warn { param($Message) Write-Host "[WARN] $Message" -ForegroundColor Yellow }
function Write-Err { param($Message) Write-Host "[ERROR] $Message" -ForegroundColor Red }

# Build
function Invoke-Build {
    Write-Info "Starting build..."
    Set-Location $ProjectRoot

    # Lint (continue on error)
    try {
        npm run lint
    } catch {
        Write-Warn "Lint errors found, continuing..."
    }

    # Build
    npm run build
    if ($LASTEXITCODE -ne 0) { throw "Build failed" }
    Write-Success "Build completed"
}

# Link setup (run after build)
function Invoke-Link {
    Write-Info "Setting up links..."
    Set-Location $ProjectRoot

    # Create global link
    npm link
    Write-Success "npm link completed"

    # Prepare n8n custom directory
    if (-not (Test-Path $N8nCustomDir)) {
        Write-Info "Creating ~/.n8n/custom..."
        New-Item -ItemType Directory -Path $N8nCustomDir -Force | Out-Null
        Set-Location $N8nCustomDir
        npm init -y
    }

    # Link
    Set-Location $N8nCustomDir
    npm link $PackageName
    Write-Success "Link to n8n completed"

    # Return to project root
    Set-Location $ProjectRoot
}

# Remove links
function Invoke-Unlink {
    Write-Info "Removing links..."

    # Remove link from n8n custom directory
    if (Test-Path $N8nCustomDir) {
        Set-Location $N8nCustomDir
        try {
            npm unlink $PackageName 2>$null
            Write-Success "Removed link from n8n"
        } catch {
            Write-Warn "n8n link does not exist or already removed"
        }
    }

    # Remove global link
    Set-Location $ProjectRoot
    try {
        npm unlink 2>$null
        Write-Success "Removed global link"
    } catch {
        Write-Warn "Global link does not exist or already removed"
    }

    Set-Location $ProjectRoot
}

# Check link status
function Test-LinkExists {
    $linkPath = Join-Path $N8nCustomDir "node_modules\$PackageName"
    return Test-Path $linkPath
}

# Start n8n
function Invoke-Start {
    Write-Info "Starting n8n..."
    Write-Info "Open http://localhost:5678 in your browser"
    Write-Info "Press Ctrl+C to stop"
    n8n start
}

# Run workflow test
function Invoke-Test {
    $WorkflowFile = Join-Path $ProjectRoot "test-workflows\test-example.json"

    if (-not (Test-Path $WorkflowFile)) {
        Write-Warn "Test workflow not found: $WorkflowFile"
        Write-Info "Please create a test workflow"
        return
    }

    Write-Info "Running workflow test..."
    n8n execute --file="$WorkflowFile"
    Write-Success "Test completed"
}

# Help
function Show-Help {
    Write-Host @"
n8n Custom Node Development Script

Usage: .\scripts\dev-test.ps1 [command]

Commands:
  build    Build only
  link     Build + Link setup (first time setup)
  unlink   Remove links (cleanup)
  start    Build + Start n8n (if linked)
  test     Build + Run workflow test
  all      Full cycle (Build -> Link -> Test)
  help     Show this help

Workflow:
  1. First time: .\scripts\dev-test.ps1 link
  2. Development: .\scripts\dev-test.ps1 start
  3. Cleanup: .\scripts\dev-test.ps1 unlink

Examples:
  .\scripts\dev-test.ps1 link    # First time setup
  .\scripts\dev-test.ps1 start   # Build and start during development
  .\scripts\dev-test.ps1 unlink  # Remove links
"@
}

# Main
switch ($Command) {
    "build" {
        Invoke-Build
    }
    "link" {
        Invoke-Build
        Invoke-Link
    }
    "unlink" {
        Invoke-Unlink
    }
    "start" {
        Invoke-Build
        if (-not (Test-LinkExists)) {
            Write-Warn "Links not set up. Run 'link' first."
            Write-Info ".\scripts\dev-test.ps1 link"
            return
        }
        Invoke-Start
    }
    "test" {
        Invoke-Build
        if (-not (Test-LinkExists)) {
            Write-Warn "Links not set up. Run 'link' first."
            return
        }
        Invoke-Test
    }
    "all" {
        Invoke-Build
        Invoke-Link
        Invoke-Test
    }
    "help" {
        Show-Help
    }
}
