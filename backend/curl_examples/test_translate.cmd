@echo off
REM Windows CMD test script for the /api/translate endpoint

setlocal enabledelayedexpansion
set BODY={"text":"Hello world","target":"es"}
curl -s -X POST "http://localhost:3000/api/translate" -H "Content-Type: application/json" -d "%BODY%"
