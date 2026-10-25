$word = New-Object -ComObject Word.Application
$word.Visible = $false
try {
    $doc = $word.Documents.Open('C:\Yug Shah\DAAA\docs\RouteOptimaAI_Project_Report.docx')
    $pages = $doc.ComputeStatistics(2)
    Write-Output "EXACT_PAGE_COUNT: $pages"
    $doc.Close([ref]$false)
} finally {
    $word.Quit()
}
