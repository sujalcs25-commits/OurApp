@echo off
echo ========================================
echo DriveCare APK Builder
echo ========================================
echo.

cd frontend

echo Step 1: Checking EAS CLI...
call npx eas-cli --version
if errorlevel 1 (
    echo ERROR: EAS CLI not found!
    echo Installing EAS CLI...
    call npm install -g eas-cli
)
echo.

echo Step 2: Logging in to Expo...
echo Please enter your Expo credentials when prompted.
echo If you don't have an account, create one at https://expo.dev
echo.
call npx eas login
if errorlevel 1 (
    echo ERROR: Login failed!
    echo Please create an account at https://expo.dev and try again.
    pause
    exit /b 1
)
echo.

echo Step 3: Building APK...
echo This will take 10-15 minutes. The build happens on Expo's servers.
echo You can close this window and check status at: https://expo.dev
echo.
call npx eas build --platform android --profile preview
if errorlevel 1 (
    echo ERROR: Build failed!
    echo Check the error messages above.
    pause
    exit /b 1
)
echo.

echo ========================================
echo Build Complete!
echo ========================================
echo.
echo Your APK is ready to download!
echo.
echo Next steps:
echo 1. Download the APK from the link above
echo 2. Transfer it to your Android phone
echo 3. Install the APK
echo 4. Open the app and configure backend URL in Settings
echo.
echo See BUILD_APK_GUIDE.md for detailed instructions.
echo.
pause
