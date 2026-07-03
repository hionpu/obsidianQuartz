# ZK 트리 탐색기 — 노드의 '직속 자식'만 반환 (lazy traversal).
# 사용:
#   pwsh "inbox/_zk-tree.ps1"          → 루트 노드 목록
#   pwsh "inbox/_zk-tree.ps1" 6        → 6의 직속 자식만
#   pwsh "inbox/_zk-tree.ps1" 6a       → 6a의 직속 자식만
# ▸ 표시 = 더 내려갈 자식이 있음. 전체를 읽지 말고 필요한 가지만 타고 들어갈 것.
param([string]$node = "")

$zk = Join-Path $PSScriptRoot "..\ZK"
$notes = @()

Get-ChildItem $zk -Filter *.md | Where-Object { $_.Name -notlike "_*" } | ForEach-Object {
    $base  = $_.BaseName
    $parts = $base -split '\s+', 2
    $id    = $parts[0]
    $title = if ($parts.Count -gt 1) { $parts[1] } else { "" }

    $lines = Get-Content $_.FullName -Encoding UTF8
    $fmEnd = -1
    if ($lines.Count -gt 0 -and $lines[0].Trim() -eq '---') {
        for ($i = 1; $i -lt $lines.Count; $i++) { if ($lines[$i].Trim() -eq '---') { $fmEnd = $i; break } }
    }
    $tags = ""
    for ($i = 0; $i -le $fmEnd; $i++) {
        if ($lines[$i] -match '^tags:\s*(.+)$') { $tags = ($Matches[1] -replace '[\[\]]', '').Trim() }
        elseif ($lines[$i] -match '^tags:\s*$') {
            $c = @(); for ($j = $i + 1; $j -le $fmEnd; $j++) { if ($lines[$j] -match '^\s*-\s*(.+)$') { $c += $Matches[1].Trim() } else { break } }
            if ($c.Count) { $tags = ($c -join ',') }
        }
    }
    $core = ""
    for ($i = $fmEnd + 1; $i -lt $lines.Count; $i++) {
        $l = $lines[$i].Trim()
        if ($l -eq "" -or $l -eq "---" -or $l.StartsWith("#")) { continue }
        $core = $l; break
    }

    $segs   = @([regex]::Matches($id, '\d+|[a-zA-Z]+') | ForEach-Object { $_.Value })
    $depth  = $segs.Count - 1
    $parent = if ($segs.Count -le 1) { "" } else { -join $segs[0..($segs.Count - 2)] }

    $notes += [pscustomobject]@{ id = $id; title = $title; tags = $tags; core = $core; depth = $depth; parent = $parent }
}

$target = $node.Trim()
if ($target -eq "" -or $target -eq "roots") {
    $sel = $notes | Where-Object { $_.depth -eq 0 }
    $hdr = "# roots (▸ = 자식 있음. 필요한 가지만 _zk-tree.ps1 <id> 로 조회)"
} else {
    $sel = $notes | Where-Object { $_.parent -eq $target }
    $hdr = "# children of $target"
}

$lines = @($hdr)
foreach ($n in ($sel | Sort-Object id)) {
    $hasKids = (@($notes | Where-Object { $_.parent -eq $n.id })).Count -gt 0
    $mark = if ($hasKids) { " ▸" } else { "" }
    $t = if ($n.tags) { " #$($n.tags -replace '\s+','')" } else { "" }
    $c = if ($n.core) { " | $($n.core)" } else { "" }
    $lines += "- $($n.id) $($n.title)$mark$t$c"
}
if ($sel.Count -eq 0) { $lines += "(자식 없음 — 여기에 새 하위 노트를 붙일 수 있음)" }
$lines -join "`n"
