# Stop leftover processes
Get-Process python -ErrorAction SilentlyContinue | Stop-Process -Force -ErrorAction SilentlyContinue
Get-Process uvicorn -ErrorAction SilentlyContinue | Stop-Process -Force -ErrorAction SilentlyContinue
Start-Sleep -Seconds 1

# Set env for this session
$env:DATABASE_URL = "sqlite:///./test.db"
$env:SECRET_KEY = "f1e2d3c4b5a6978877665544332211ffeeddccbbaa99887766554433221100aa"
$env:PYTHONPATH = Join-Path $PWD 'backend'

# Remove old log
if (Test-Path "backend\uvicorn8001.log") { Remove-Item "backend\uvicorn8001.log" -Force }

# Start uvicorn in background writing to log
$pythonPath = Join-Path $PWD '.venv\Scripts\python.exe'
$uvicornArgs = @('-m','uvicorn','app.main:app','--host','127.0.0.1','--port','8001','--log-level','debug')
$proc = Start-Process -FilePath $pythonPath -ArgumentList $uvicornArgs -RedirectStandardOutput "backend\uvicorn8001.log" -RedirectStandardError "backend\uvicorn8001.log" -NoNewWindow -PassThru
Start-Sleep -Seconds 3
Write-Output "Started uvicorn PID=$($proc.Id), log -> backend\uvicorn8001.log"

# Run the registration test
Write-Output "--- Running registration script ---"
& $pythonPath (Join-Path $PWD 'tmp\send_register.py')

Start-Sleep -Seconds 1
Write-Output "--- Server log (tail 200) ---"
if (Test-Path "backend\uvicorn8001.log") { Get-Content -Path "backend\uvicorn8001.log" -Tail 200 | Write-Output } else { Write-Output "Log file not found" }
Write-Output "--- End log ---"

# Stop uvicorn by owning process on port 8001
$owner = (Get-NetTCPConnection -LocalPort 8001 -ErrorAction SilentlyContinue).OwningProcess
if ($owner) { Write-Output "Stopping server PID=$owner"; Stop-Process -Id $owner -Force -ErrorAction SilentlyContinue } else { Write-Output "No owning process found for port 8001" }
