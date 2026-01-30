"use client"

import React from "react"

import { useState } from "react"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Download, FileImage, FileJson, Printer } from "lucide-react"
import type { BellowsParams } from "./bellows-canvas"

interface ViewBox {
  x: number
  y: number
  width: number
  height: number
}

interface Props {
  svgRef: React.RefObject<SVGSVGElement | null>
  viewBox: ViewBox
  params: BellowsParams
}

const PAGE_SIZES = {
  A4: { width: 210, height: 297, label: "A4" },
  B4: { width: 257, height: 364, label: "B4" },
  A3: { width: 297, height: 420, label: "A3" },
}

export function ExportDialog({ svgRef, viewBox, params }: Props) {
  const [oneToOne, setOneToOne] = useState(true)
  const [pageSize, setPageSize] = useState<"A4" | "B4" | "A3">(params.pageSize)
  const [pngSplitVertical, setPngSplitVertical] = useState(true)
  const [pngPages, setPngPages] = useState<number>(0)
  const [pngRangeStart, setPngRangeStart] = useState<number>(0)
  const [pngRangeEnd, setPngRangeEnd] = useState<number>(0)

  const buildExportSvg = () => {
    if (!svgRef.current) return null
    const exportSvg = svgRef.current.cloneNode(true) as SVGSVGElement
    exportSvg.setAttribute("xmlns", "http://www.w3.org/2000/svg")
    exportSvg.setAttribute("width", `${viewBox.width}mm`)
    exportSvg.setAttribute("height", `${viewBox.height}mm`)
    exportSvg.setAttribute("viewBox", `0 0 ${viewBox.width} ${viewBox.height}`)
    return exportSvg
  }

  const downloadSvg = () => {
    const exportSvg = buildExportSvg()
    if (!exportSvg) return

    const serialized = new XMLSerializer().serializeToString(exportSvg)
    const blob = new Blob([serialized], { type: "image/svg+xml;charset=utf-8" })
    const url = URL.createObjectURL(blob)
    const link = document.createElement("a")
    link.href = url
    link.download = "bellows.svg"
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    URL.revokeObjectURL(url)
  }

  const downloadPng = async () => {
    const exportSvg = buildExportSvg()
    if (!exportSvg) return

    const scale = 4

    const renderSvgToPng = (serialized: string, width: number, height: number, filename: string) =>
      new Promise<void>((resolve) => {
        const blob = new Blob([serialized], { type: "image/svg+xml;charset=utf-8" })
        const url = URL.createObjectURL(blob)
        const img = new Image()
        img.crossOrigin = "anonymous"
        img.onload = () => {
          const canvas = document.createElement("canvas")
          canvas.width = width * scale
          canvas.height = height * scale
          const ctx = canvas.getContext("2d")
          if (ctx) {
            ctx.fillStyle = "#fff"
            ctx.fillRect(0, 0, canvas.width, canvas.height)
            ctx.scale(scale, scale)
            ctx.drawImage(img, 0, 0)
            canvas.toBlob((pngBlob) => {
              if (pngBlob) {
                const pngUrl = URL.createObjectURL(pngBlob)
                const link = document.createElement("a")
                link.href = pngUrl
                link.download = filename
                document.body.appendChild(link)
                link.click()
                document.body.removeChild(link)
                URL.revokeObjectURL(pngUrl)
              }
              URL.revokeObjectURL(url)
              resolve()
            }, "image/png")
          } else {
            URL.revokeObjectURL(url)
            resolve()
          }
        }
        img.src = url
      })

    if (params.useGeneratorMode && pngSplitVertical) {
      const page = PAGE_SIZES[pageSize]
      const margin = 10
      const availableHeight = page.height - margin * 2
      const start = Math.max(0, pngRangeStart)
      const end = pngRangeEnd > 0 ? pngRangeEnd : viewBox.height
      const rangeEnd = Math.min(viewBox.height, Math.max(end, start))
      const rangeHeight = Math.max(1, rangeEnd - start)
      const autoPages = Math.max(1, Math.ceil(rangeHeight / availableHeight))
      const pages = pngPages > 0 ? Math.max(1, Math.min(pngPages, autoPages)) : autoPages
      const tileHeight = rangeHeight / pages

      for (let i = 0; i < pages; i++) {
        const y0 = viewBox.y + start + i * tileHeight
        const tileSvg = exportSvg.cloneNode(true) as SVGSVGElement
        tileSvg.setAttribute("viewBox", `${viewBox.x} ${y0} ${viewBox.width} ${tileHeight}`)
        tileSvg.setAttribute("width", `${viewBox.width}mm`)
        tileSvg.setAttribute("height", `${tileHeight}mm`)
        const serialized = new XMLSerializer().serializeToString(tileSvg)
        const filename = `bellows-${String(i + 1).padStart(2, "0")}.png`
        await renderSvgToPng(serialized, viewBox.width, tileHeight, filename)
      }
      return
    }

    const serialized = new XMLSerializer().serializeToString(exportSvg)
    await renderSvgToPng(serialized, viewBox.width, viewBox.height, "bellows.png")
  }

  const downloadJson = () => {
    const data = {
      params,
      viewBox,
      exportDate: new Date().toISOString(),
    }
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: "application/json;charset=utf-8" })
    const url = URL.createObjectURL(blob)
    const link = document.createElement("a")
    link.href = url
    link.download = "bellows_config.json"
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    URL.revokeObjectURL(url)
  }

  const printPdf = () => {
    const exportSvg = buildExportSvg()
    if (!exportSvg) return

    const serialized = new XMLSerializer().serializeToString(exportSvg)
    const page = PAGE_SIZES[pageSize]
    const margin = 10
    const availableWidth = page.width - margin * 2
    const availableHeight = page.height - margin * 2
    const scale = oneToOne ? 1 : Math.min(availableWidth / viewBox.width, availableHeight / viewBox.height, 1)

    const style = `
      @page { size: ${page.label}; margin: 0; }
      html, body { margin: 0; padding: 0; }
      body { font-family: "Segoe UI", system-ui, sans-serif; }
      .page { width: ${page.width}mm; height: ${page.height}mm; }
      .sheet { width: ${page.width}mm; height: ${page.height}mm; padding: ${margin}mm; box-sizing: border-box; overflow: hidden; }
      .frame { width: ${viewBox.width}mm; height: ${viewBox.height}mm; transform-origin: top left; transform: scale(${scale}); }
      svg { display: block; }
    `

    const buildTiledPages = () => {
      if (!params.useGeneratorMode || !oneToOne) {
        return `
          <div class="page">
            <div class="sheet">
              <div class="frame">${serialized}</div>
            </div>
          </div>
        `
      }

      const tilesX = Math.max(1, Math.ceil(viewBox.width / availableWidth))
      const tilesY = Math.max(1, Math.ceil(viewBox.height / availableHeight))
      let pages = ""

      for (let y = 0; y < tilesY; y++) {
        for (let x = 0; x < tilesX; x++) {
          const offsetX = x * availableWidth
          const offsetY = y * availableHeight
          pages += `
            <div class="page">
              <div class="sheet">
                <div class="frame" style="transform: translate(-${offsetX}mm, -${offsetY}mm);">
                  ${serialized}
                </div>
              </div>
            </div>
          `
        }
      }
      return pages
    }

    const html = `
      <!DOCTYPE html>
      <html lang="ja">
      <head>
        <meta charset="UTF-8">
        <title>蛇腹展開図</title>
        <style>${style}</style>
      </head>
      <body>
        ${buildTiledPages()}
      </body>
      </html>
    `

    const printWindow = window.open("", "_blank")
    if (printWindow) {
      printWindow.document.open()
      printWindow.document.write(html)
      printWindow.document.close()
      printWindow.focus()
      setTimeout(() => {
        printWindow.print()
      }, 250)
    }
  }

  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button className="gap-2">
          <Download className="w-4 h-4" />
          エクスポート
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>展開図をエクスポート</DialogTitle>
          <DialogDescription>SVG、PNG、またはPDF形式で保存できます</DialogDescription>
        </DialogHeader>

        <div className="space-y-6 py-4">
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <Label className="text-sm">1:1スケールで出力</Label>
              <Switch checked={oneToOne} onCheckedChange={setOneToOne} />
            </div>
            <div className="space-y-2">
              <Label className="text-sm">用紙サイズ</Label>
              <Select value={pageSize} onValueChange={(v) => setPageSize(v as typeof pageSize)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="A4">A4 (210 x 297mm)</SelectItem>
                  <SelectItem value="B4">B4 (257 x 364mm)</SelectItem>
                  <SelectItem value="A3">A3 (297 x 420mm)</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-3 rounded-md border border-border p-3">
            <div className="flex items-center justify-between">
              <Label className="text-sm">PNGを縦分割して出力</Label>
              <Switch checked={pngSplitVertical} onCheckedChange={setPngSplitVertical} />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <Label className="text-xs">分割枚数（0=自動）</Label>
                <input
                  type="number"
                  value={pngPages}
                  onChange={(e) => setPngPages(Number(e.target.value))}
                  className="w-full h-8 text-xs px-2 rounded-md border border-input bg-background"
                  min={0}
                />
              </div>
              <div className="space-y-1">
                <Label className="text-xs">範囲: 開始(mm)</Label>
                <input
                  type="number"
                  value={pngRangeStart}
                  onChange={(e) => setPngRangeStart(Number(e.target.value))}
                  className="w-full h-8 text-xs px-2 rounded-md border border-input bg-background"
                  min={0}
                />
              </div>
              <div className="space-y-1">
                <Label className="text-xs">範囲: 終了(mm)</Label>
                <input
                  type="number"
                  value={pngRangeEnd}
                  onChange={(e) => setPngRangeEnd(Number(e.target.value))}
                  className="w-full h-8 text-xs px-2 rounded-md border border-input bg-background"
                  min={0}
                />
              </div>
              <div className="text-[11px] text-muted-foreground pt-1">
                高精度モード時のみ有効。開始/終了は展開図の縦方向(mm)です。
              </div>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <Button variant="outline" className="flex flex-col h-auto py-4 gap-2 bg-transparent" onClick={downloadSvg}>
              <FileImage className="w-6 h-6" />
              <span className="text-xs">SVG</span>
            </Button>
            <Button variant="outline" className="flex flex-col h-auto py-4 gap-2 bg-transparent" onClick={downloadPng}>
              <FileImage className="w-6 h-6" />
              <span className="text-xs">PNG (高解像度)</span>
            </Button>
            <Button variant="outline" className="flex flex-col h-auto py-4 gap-2 bg-transparent" onClick={downloadJson}>
              <FileJson className="w-6 h-6" />
              <span className="text-xs">設定JSON</span>
            </Button>
            <Button variant="outline" className="flex flex-col h-auto py-4 gap-2 bg-transparent" onClick={printPdf}>
              <Printer className="w-6 h-6" />
              <span className="text-xs">印刷/PDF</span>
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
