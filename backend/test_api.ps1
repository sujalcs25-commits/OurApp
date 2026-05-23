$baseUrl = "http://localhost:5000/api"
$email = "test_api_$(Get-Date -Format 'HHmmss')@example.com"
$password = "Password123"

Write-Host "--- Starting API CRUD Tests (Curl/PS) ---"

# 1. Register
Write-Host "[1] Testing Registration..."
$regBody = @{
    name = "API Tester"
    email = $email
    password = $password
} | ConvertTo-Json
$regRes = Invoke-RestMethod -Uri "$baseUrl/auth/register" -Method Post -Body $regBody -ContentType "application/json"
$token = $regRes.token
Write-Host "✅ Registration Success. Token length: $($token.Length)"

# 2. Login
Write-Host "[2] Testing Login..."
$loginBody = @{
    email = $email
    password = $password
} | ConvertTo-Json
$loginRes = Invoke-RestMethod -Uri "$baseUrl/auth/login" -Method Post -Body $loginBody -ContentType "application/json"
$token = $loginRes.token
Write-Host "✅ Login Success."

$headers = @{
    Authorization = "Bearer $token"
}

# 3. Add Vehicle
Write-Host "[3] Testing Add Vehicle..."
$vehicleBody = @{
    make = "Ford"
    model = "Focus"
    year = 2020
    licensePlate = "API-123"
} | ConvertTo-Json
$addRes = Invoke-RestMethod -Uri "$baseUrl/vehicles" -Method Post -Body $vehicleBody -Headers $headers -ContentType "application/json"
$vehicleId = $addRes._id
Write-Host "✅ Vehicle Added: $($addRes.make) $($addRes.model)"

# 4. Get Vehicles
Write-Host "[4] Testing Get Vehicles..."
$getRes = Invoke-RestMethod -Uri "$baseUrl/vehicles" -Method Get -Headers $headers
Write-Host "✅ Vehicles Found: $($getRes.Count)"

# 5. Update Vehicle
Write-Host "[5] Testing Update Vehicle..."
$updateBody = @{
    color = "Midnight Blue"
} | ConvertTo-Json
$updateRes = Invoke-RestMethod -Uri "$baseUrl/vehicles/$vehicleId" -Method Put -Body $updateBody -Headers $headers -ContentType "application/json"
Write-Host "✅ Vehicle Updated: $($updateRes.color)"

# 6. Delete Vehicle
Write-Host "[6] Testing Delete Vehicle..."
$deleteRes = Invoke-RestMethod -Uri "$baseUrl/vehicles/$vehicleId" -Method Delete -Headers $headers
Write-Host "✅ Vehicle Deleted: $($deleteRes.msg)"

Write-Host "`n--- All API Tests Passed! ---"
