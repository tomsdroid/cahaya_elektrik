$ErrorActionPreference = "Stop"

$contentsPath = Join-Path $PSScriptRoot "contents"
if (-not (Test-Path -LiteralPath $contentsPath -PathType Container)) {
  throw "Folder contents tidak ditemukan: $contentsPath"
}

$files = @(Get-ChildItem -LiteralPath $contentsPath -Filter "*.md" -File | Sort-Object Name)
$items = @()

foreach ($file in $files) {
  $markdown = [System.IO.File]::ReadAllText($file.FullName, [System.Text.Encoding]::UTF8)
  $frontMatter = [regex]::Match(
    $markdown,
    '\A---\r?\n(?<metadata>[\s\S]*?)\r?\n---(?:\r?\n|$)(?<content>[\s\S]*)\z'
  )

  $metadata = @{}
  $content = $markdown
  if ($frontMatter.Success) {
    $content = $frontMatter.Groups["content"].Value

    foreach ($line in ($frontMatter.Groups["metadata"].Value -split "\r?\n")) {
      if ([string]::IsNullOrWhiteSpace($line)) {
        continue
      }

      if ($line -notmatch '^\s*([A-Za-z][A-Za-z0-9_-]*)\s*:\s*(.*?)\s*$') {
        throw "Metadata tidak valid pada $($file.Name): $line"
      }

      $key = $Matches[1].ToLowerInvariant()
      $value = $Matches[2].Trim()
      if ($metadata.ContainsKey($key)) {
        throw "Metadata '$key' ditulis lebih dari sekali pada $($file.Name)."
      }
      if ($value.Length -ge 2 -and (($value.StartsWith('"') -and $value.EndsWith('"')) -or ($value.StartsWith("'") -and $value.EndsWith("'")))) {
        $value = $value.Substring(1, $value.Length - 2)
      }
      $metadata[$key] = $value
    }
  } elseif ($markdown.StartsWith("---")) {
    throw "Front matter tidak ditutup dengan --- pada $($file.Name)."
  }

  $content = $content.Trim()
  if ([string]::IsNullOrWhiteSpace($content)) {
    throw "Isi Markdown kosong pada $($file.Name)."
  }

  $firstHeading = [regex]::Match($content, '(?m)^#\s+(.+?)\s*$')
  $title = $metadata["title"]
  if ([string]::IsNullOrWhiteSpace($title)) {
    if ($firstHeading.Success) {
      $title = $firstHeading.Groups[1].Value.Trim()
    } else {
      $title = ($file.BaseName -replace "[-_]+", " ").Trim()
    }
  }

  if ($firstHeading.Success -and $firstHeading.Groups[1].Value.Trim() -eq $title) {
    $headingPattern = [regex]::new('(?m)^#\s+' + [regex]::Escape($title) + '\s*(?:\r?\n|$)')
    $content = $headingPattern.Replace($content, "", 1).Trim()
  }

  $summary = $metadata["summary"]
  if ([string]::IsNullOrWhiteSpace($summary)) {
    $summaryBlock = $content -split '(?:\r?\n){2,}' |
      Where-Object { $_.Trim() -and $_ -notmatch '^\s*(#{1,6}\s|[-*+]\s|\d+[.)]\s|>|```)' } |
      Select-Object -First 1
    $summary = [regex]::Replace($summaryBlock, '!\[([^\]]*)\]\([^)]+\)|\[([^\]]+)\]\([^)]+\)', '$1$2')
    $summary = [regex]::Replace($summary, '[#*_~`]', "")
    $summary = [regex]::Replace($summary, '\s+', " ").Trim()
    if ($summary.Length -gt 180) {
      $summary = $summary.Substring(0, 177).TrimEnd() + "..."
    }
  }
  if ([string]::IsNullOrWhiteSpace($summary)) {
    $summary = "Buka untuk melihat detail proyek."
  }

  $category = $metadata["category"]
  if ([string]::IsNullOrWhiteSpace($category)) {
    $category = "Portofolio"
  }

  $items += [PSCustomObject]@{
    slug     = $file.BaseName
    title    = $title
    category = $category
    summary  = $summary
    content  = $content
    metadata = $metadata
  }
}

$json = ConvertTo-Json -InputObject $items -Depth 8 -Compress
$outputPath = Join-Path $PSScriptRoot "portfolio-data.js"
$output = "window.portfolioItems = $json;`r`n"
$encoding = New-Object System.Text.UTF8Encoding($false)
[System.IO.File]::WriteAllText($outputPath, $output, $encoding)

Write-Output "Generated portfolio-data.js from $($items.Count) Markdown file(s)."
