# ZK 구조 맵 생성기 — ZK/ 노트에서 id+제목+핵심문장+tags만 추출해 한 파일로.
# 사용: pwsh "inbox/_zk-map 생성.ps1"  → inbox/_zk-map.md 갱신 (AI 토큰 0)
$zk  = Join-Path $PSScriptRoot "..\ZK"
$out = @("# ZK 구조 맵 (자동 생성 — 직접 수정 금지. 스크립트로 재생성)", "")

Get-ChildItem $zk -Filter *.md | Where-Object { $_.Name -notlike "_*" } | Sort-Object Name | ForEach-Object {
    $lines = Get-Content $_.FullName -Encoding UTF8
    $fmEnd = -1
    if ($lines.Count -gt 0 -and $lines[0].Trim() -eq '---') {
        for ($i = 1; $i -lt $lines.Count; $i++) { if ($lines[$i].Trim() -eq '---') { $fmEnd = $i; break } }
    }

    # tags: 인라인([a,b]) 또는 블록(- a) 둘 다 처리
    $tags = ""
    for ($i = 0; $i -le $fmEnd; $i++) {
        if ($lines[$i] -match '^tags:\s*(.+)$') { $tags = ($Matches[1] -replace '[\[\]]', '').Trim() }
        elseif ($lines[$i] -match '^tags:\s*$') {
            $collected = @()
            for ($j = $i + 1; $j -le $fmEnd; $j++) {
                if ($lines[$j] -match '^\s*-\s*(.+)$') { $collected += $Matches[1].Trim() } else { break }
            }
            if ($collected.Count) { $tags = ($collected -join ', ') }
        }
    }

    # 핵심 문장 = 프런트매터/H1/구분선/빈줄 제외 첫 줄
    $core = ""
    for ($i = $fmEnd + 1; $i -lt $lines.Count; $i++) {
        $l = $lines[$i].Trim()
        if ($l -eq "" -or $l -eq "---" -or $l.StartsWith("#")) { continue }
        $core = $l; break
    }

    $line = "- $($_.BaseName)"
    if ($tags) { $line += " | tags: $tags" }
    if ($core) { $line += " | $core" }
    $out += $line
}

$dest = Join-Path $PSScriptRoot "_zk-map.md"
$out -join "`n" | Set-Content $dest -Encoding UTF8
Write-Output "생성 완료: $dest ($($out.Count - 2) notes)"
