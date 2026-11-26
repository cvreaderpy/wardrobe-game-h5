param(
  [int]$Port = 8080,
  [string]$Bind = "127.0.0.1"
)

# Zero-dependency static file server for local preview.
# Usage:
#   powershell -ExecutionPolicy Bypass -File .\serve.ps1
#   powershell -ExecutionPolicy Bypass -File .\serve.ps1 -Bind 0.0.0.0 -Port 8080
# Phone: http://<your-lan-ip>:8080

$root = Split-Path -Parent $MyInvocation.MyCommand.Path
$root = [System.IO.Path]::GetFullPath($root)
$rootWithSep = $root.TrimEnd('\') + '\'

$listener = New-Object System.Net.Sockets.TcpListener([System.Net.IPAddress]::Parse($Bind), $Port)
$listener.Start()

Write-Host ""
Write-Host "  Yi Jian Xiao Ri Zi - local preview" -ForegroundColor Yellow
Write-Host "  http://${Bind}:${Port}/" -ForegroundColor Cyan
if ($Bind -eq "0.0.0.0") {
  Write-Host "  Phone: http://<your-lan-ip>:${Port}/" -ForegroundColor Cyan
  Write-Host "  If the phone cannot connect, allow PowerShell through Windows Firewall." -ForegroundColor DarkGray
}
Write-Host "  Press Ctrl+C to stop." -ForegroundColor DarkGray
Write-Host ""

$mime = @{
  ".html" = "text/html; charset=utf-8"
  ".css"  = "text/css; charset=utf-8"
  ".js"   = "application/javascript; charset=utf-8"
  ".json" = "application/json; charset=utf-8"
  ".webmanifest" = "application/manifest+json; charset=utf-8"
  ".svg"  = "image/svg+xml"
  ".png"  = "image/png"
  ".jpg"  = "image/jpeg"
  ".jpeg" = "image/jpeg"
  ".webp" = "image/webp"
  ".gif"  = "image/gif"
  ".woff" = "font/woff"
  ".woff2" = "font/woff2"
  ".ico"  = "image/x-icon"
  ".txt"  = "text/plain; charset=utf-8"
  ".md"   = "text/plain; charset=utf-8"
}

try {
  while ($true) {
    $client = $listener.AcceptTcpClient()
    try {
      $stream = $client.GetStream()
      $stream.ReadTimeout = 5000
      $buffer = New-Object byte[] 8192
      $sb = New-Object System.Text.StringBuilder
      $headerEnd = -1

      while ($headerEnd -lt 0) {
        $read = $stream.Read($buffer, 0, $buffer.Length)
        if ($read -le 0) { break }
        [void]$sb.Append([System.Text.Encoding]::ASCII.GetString($buffer, 0, $read))
        $headerEnd = $sb.ToString().IndexOf("`r`n`r`n")
        if ($sb.Length -gt 65536) { break }
      }

      $request = $sb.ToString()
      $firstLine = ($request -split "`r`n")[0]
      $parts = $firstLine -split " "
      if ($parts.Length -lt 2) { continue }

      $method = $parts[0].ToUpperInvariant()
      $rawPath = $parts[1]
      $pathOnly = ($rawPath -split "\?")[0]
      $pathOnly = [System.Uri]::UnescapeDataString($pathOnly)

      if ($method -ne "GET" -and $method -ne "HEAD") {
        $status = "405 Method Not Allowed"
        $body = [System.Text.Encoding]::UTF8.GetBytes("Method Not Allowed")
        $contentType = "text/plain; charset=utf-8"
      } elseif ($pathOnly -eq "/" -or $pathOnly -eq "") {
        $relative = "index.html"
        $full = [System.IO.Path]::GetFullPath((Join-Path $root $relative))
        if (-not (Test-Path -LiteralPath $full -PathType Leaf)) {
          $status = "404 Not Found"
          $body = [System.Text.Encoding]::UTF8.GetBytes("Not Found")
          $contentType = "text/plain; charset=utf-8"
        } else {
          $status = "200 OK"
          $body = [System.IO.File]::ReadAllBytes($full)
          $ext = [System.IO.Path]::GetExtension($full).ToLowerInvariant()
          $contentType = $mime[$ext]
          if (-not $contentType) { $contentType = "application/octet-stream" }
        }
      } else {
        $relative = $pathOnly.TrimStart("/") -replace "/", "\"
        $full = [System.IO.Path]::GetFullPath((Join-Path $root $relative))

        if (-not $full.StartsWith($rootWithSep, [System.StringComparison]::OrdinalIgnoreCase)) {
          $status = "403 Forbidden"
          $body = [System.Text.Encoding]::UTF8.GetBytes("Forbidden")
          $contentType = "text/plain; charset=utf-8"
        } elseif (-not (Test-Path -LiteralPath $full -PathType Leaf)) {
          $status = "404 Not Found"
          $body = [System.Text.Encoding]::UTF8.GetBytes("Not Found")
          $contentType = "text/plain; charset=utf-8"
        } else {
          $status = "200 OK"
          $body = [System.IO.File]::ReadAllBytes($full)
          $ext = [System.IO.Path]::GetExtension($full).ToLowerInvariant()
          $contentType = $mime[$ext]
          if (-not $contentType) { $contentType = "application/octet-stream" }
        }
      }

      $headers = "HTTP/1.1 $status`r`n" +
        "Content-Type: $contentType`r`n" +
        "Content-Length: $($body.Length)`r`n" +
        "Cache-Control: no-store`r`n" +
        "Connection: close`r`n`r`n"
      $headerBytes = [System.Text.Encoding]::ASCII.GetBytes($headers)
      $stream.Write($headerBytes, 0, $headerBytes.Length)
      if ($method -ne "HEAD") {
        $stream.Write($body, 0, $body.Length)
      }
      $stream.Flush()
    } catch {
      # Ignore a single bad request.
    } finally {
      $client.Close()
    }
  }
} finally {
  $listener.Stop()
}
