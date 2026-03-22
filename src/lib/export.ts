export function exportToCSV(filename: string, columns: string[], data: any[][]) {
  const csvContent = [
    columns.join(','),
    ...data.map((row) => row.map((cell) => `"${String(cell).replace(/"/g, '""')}"`).join(',')),
  ].join('\n')

  const blob = new Blob([new Uint8Array([0xef, 0xbb, 0xbf]), csvContent], {
    type: 'text/csv;charset=utf-8;',
  })
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.setAttribute('href', url)
  link.setAttribute('download', `${filename}.csv`)
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
}

export function printHTML(title: string, htmlContent: string) {
  const printWindow = window.open('', '_blank')
  if (!printWindow) return

  printWindow.document.write(`
    <html>
      <head>
        <title>${title}</title>
        <style>
          body { font-family: sans-serif; padding: 20px; color: #333; max-width: 800px; margin: 0 auto; }
          table { width: 100%; border-collapse: collapse; margin-top: 20px; font-size: 14px; }
          th, td { border: 1px solid #e2e8f0; padding: 10px; text-align: left; }
          th { background-color: #f8fafc; color: #475569; }
          h1 { color: #0f172a; margin-bottom: 5px; }
          h3 { color: #334155; margin-top: 30px; border-bottom: 2px solid #e2e8f0; padding-bottom: 5px; }
          .meta { margin-bottom: 20px; font-size: 14px; color: #64748b; background: #f8fafc; padding: 15px; border-radius: 8px; }
          .meta p { margin: 5px 0; }
        </style>
      </head>
      <body>
        ${htmlContent}
      </body>
    </html>
  `)
  printWindow.document.close()

  setTimeout(() => {
    printWindow.print()
  }, 250)
}
