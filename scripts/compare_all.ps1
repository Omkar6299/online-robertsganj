param(
    [string]$SrcBase = "c:\Users\Admin\Desktop\projects\Online Admission projects\Online Jalesar",
    [string]$DestBase = "c:\Users\Admin\Desktop\projects\Online Admission projects\Online Robertsganj"
)

$folders = @(
    "controllers\admin",
    "controllers",
    "models",
    "views\admin_panel\semesters",
    "views\admin_panel\settings",
    "views\admin_panel\course_semesters",
    "views\admin_panel\courses",
    "views\admin_panel\student",
    "views\admin_panel\home",
    "views\admin_panel\reports",
    "views\admin_panel\form_verification",
    "views\admin_panel\weightages",
    "views\admin_panel\subjects",
    "views\admin_panel\skills",
    "views\admin_panel\cocurricular",
    "views\admin_panel\academic_years",
    "views\admin_panel\course_types",
    "views\admin_panel\document_types",
    "views\admin_panel\users",
    "views\admin_panel\roles",
    "views\admin_panel\fee_maintenance",
    "views\admin_panel\payments",
    "views\admin_panel\counselling"
)

$diffs = @()
$missing = @()

foreach ($folder in $folders) {
    $srcDir = Join-Path $SrcBase $folder
    $destDir = Join-Path $DestBase $folder
    if (-not (Test-Path $srcDir)) { continue }
    Get-ChildItem -Path $srcDir -ErrorAction SilentlyContinue | Where-Object { $_.Extension -in ".js",".ejs" } | ForEach-Object {
        $srcFile = $_.FullName
        $destFile = Join-Path $destDir $_.Name
        if (-not (Test-Path $destFile)) {
            $missing += "$folder\$($_.Name)"
        } else {
            $a = Get-Content $srcFile -Raw
            $b = Get-Content $destFile -Raw
            if ($a -ne $b) {
                $diffs += "$folder\$($_.Name)"
            }
        }
    }
}

Write-Host "`n=== MISSING FILES ===" -ForegroundColor Red
$missing | ForEach-Object { Write-Host "  MISSING: $_" -ForegroundColor Red }

Write-Host "`n=== DIFFERENT FILES ===" -ForegroundColor Yellow
$diffs | ForEach-Object { Write-Host "  DIFF: $_" -ForegroundColor Yellow }

Write-Host "`nTotal missing: $($missing.Count), Total diffs: $($diffs.Count)" -ForegroundColor Cyan
