@echo off
echo ========================================
echo DriveCare Production APK Builder
echo ========================================
echo.
echo IMPORTANT: Make sure you have deployed your backend first!
echo.
echo Your backend should be deployed at:
echo https://drivecare-backend.onrender.com
echo.
echo If you haven't deployed yet:
echo 1. Go to https://render.com
echo 2. Create Web Service
echo 3. Deploy backend folder
echo 4. Update the URL in frontend/.env
echo.
pause
echo.

cd frontend

echo Checking if you're logged in to Expo...
call npx eas whoami
if errorlevel 1 (
    echo.
    echo You're not logged in. Logging in now...
    call npx eas login
    if errorlevel 1 (
        echo ERROR: Login failed!
        pause
        exit /b 1
    )
)
echo.

echo ========================================
echo Building Production APK...
echo ========================================
echo.
echo This will take 10-15 minutes.
echo The APK will be optimized and ready for distribution.
echo.
echo You can check build status at: https://expo.dev
echo.

call npx eas build --platform android --profile production

if errorlevel 1 (
    echo.
    echo ========================================
    echo Build Failed!
    echo ========================================
    echo.
    echo Common issues:
    echo 1. Not logged in to Expo
    echo 2. Network connection issues
    echo 3. Configuration errors
    echo.
    echo Try running: npx eas build:configure
    echo.
    pause
    exit /b 1
)

echo.
echo ========================================
echo Build Started Successfully!
echo ========================================
echo.
echo Your APK is being built on Expo servers.
echo.
echo What to do now:
echo 1. Wait 10-15 minutes for build to complete
echo 2. Download APK from the link shown above
echo 3. Install on your Android phone
echo 4. Open app and login - it will work from anywhere!
echo.
echo Check build status: https://expo.dev
echo.
pause
