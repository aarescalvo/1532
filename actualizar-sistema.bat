@echo off
title TrazaSole - Actualizar Sistema
echo ========================================
echo   TRAZASOLE - Actualizando Sistema
echo ========================================
echo.
cd /d "C:\TrazaSole"

echo [1/4] Descargando actualizaciones de GitHub...
git pull origin master
if %ERRORLEVEL% neq 0 (
    echo.
    echo [ERROR] No se pudo descargar actualizaciones
    echo Verifica tu conexion a internet
    pause
    exit /b 1
)

echo.
echo [2/4] Instalando dependencias...
bun install
if %ERRORLEVEL% neq 0 (
    echo.
    echo [ERROR] Error al instalar dependencias
    pause
    exit /b 1
)

echo.
echo [3/4] Sincronizando base de datos...
bun run db:push
if %ERRORLEVEL% neq 0 (
    echo.
    echo [ERROR] Error al sincronizar base de datos
    pause
    exit /b 1
)

echo.
echo [4/4] Generando cliente Prisma...
bun run db:generate

echo.
echo ========================================
echo   Actualizacion completada!
echo ========================================
echo.
echo Reinicia el servidor para aplicar cambios.
echo.
pause
