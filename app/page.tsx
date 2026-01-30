"use client"

import { useState, useRef, useCallback, useEffect } from "react"
import { BellowsCanvas, type BellowsParams } from "@/components/bellows-canvas"
import { ParameterPanel } from "@/components/parameter-panel"
import { ExportDialog } from "@/components/export-dialog"
import { HelpDialog } from "@/components/help-dialog"
import { ImportDialog } from "@/components/import-dialog"
import { Button } from "@/components/ui/button"
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet"
import { RotateCcw, Menu, Camera, Undo2, Redo2 } from "lucide-react"

const DEFAULT_PARAMS: BellowsParams = {
  frontWidth: 100,
  frontHeight: 100,
  rearWidth: 120,
  rearHeight: 120,
  folds: 8,
  foldDepth: 15,
  showAnnotations: true,
  pageSize: "A4",
  useBdMode: false,
  useGeneratorMode: false,
  useFiveFaces: false,
  seamAllowance: 10,
  bdData: {
    cameraFocalDist: 120,
    frontStdSize: 100,
    rearStdSize: 120,
    foldDist: 18.5,
    flexFactor: 2,
  },
}

export default function BellowsDesigner() {
  const [params, setParams] = useState<BellowsParams>(DEFAULT_PARAMS)
  const [viewBox, setViewBox] = useState({ x: 0, y: 0, width: 800, height: 600 })
  const [dimensions, setDimensions] = useState("")
  const [history, setHistory] = useState<BellowsParams[]>([DEFAULT_PARAMS])
  const [historyIndex, setHistoryIndex] = useState(0)
  const svgRef = useRef<SVGSVGElement>(null)

  const handleParamsChange = useCallback((newParams: BellowsParams) => {
    setParams(newParams)
    // Add to history (limit to 50 entries)
    setHistory((prev) => {
      const newHistory = [...prev.slice(0, historyIndex + 1), newParams].slice(-50)
      setHistoryIndex(newHistory.length - 1)
      return newHistory
    })
  }, [historyIndex])

  const handleUndo = useCallback(() => {
    if (historyIndex > 0) {
      setHistoryIndex((prev) => prev - 1)
      setParams(history[historyIndex - 1])
    }
  }, [history, historyIndex])

  const handleRedo = useCallback(() => {
    if (historyIndex < history.length - 1) {
      setHistoryIndex((prev) => prev + 1)
      setParams(history[historyIndex + 1])
    }
  }, [history, historyIndex])

  const handleReset = useCallback(() => {
    setParams(DEFAULT_PARAMS)
    setHistory([DEFAULT_PARAMS])
    setHistoryIndex(0)
  }, [])

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === "z" && !e.shiftKey) {
        e.preventDefault()
        handleUndo()
      } else if ((e.metaKey || e.ctrlKey) && e.key === "z" && e.shiftKey) {
        e.preventDefault()
        handleRedo()
      } else if ((e.metaKey || e.ctrlKey) && e.key === "y") {
        e.preventDefault()
        handleRedo()
      }
    }
    window.addEventListener("keydown", handleKeyDown)
    return () => window.removeEventListener("keydown", handleKeyDown)
  }, [handleUndo, handleRedo])

  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* Header */}
      <header className="border-b border-border bg-card/50 backdrop-blur-sm sticky top-0 z-50">
        <div className="container mx-auto px-4 h-14 flex items-center justify-between">
          <div className="flex items-center gap-3">
            {/* Mobile menu */}
            <Sheet>
              <SheetTrigger asChild>
                <Button variant="ghost" size="icon" className="lg:hidden">
                  <Menu className="w-5 h-5" />
                  <span className="sr-only">メニュー</span>
                </Button>
              </SheetTrigger>
              <SheetContent side="left" className="w-80 p-0">
                <div className="p-4 border-b border-border">
                  <h2 className="font-semibold">パラメータ設定</h2>
                </div>
                <div className="p-4 overflow-y-auto h-[calc(100vh-60px)]">
                  <ParameterPanel params={params} onChange={handleParamsChange} />
                </div>
              </SheetContent>
            </Sheet>

            <div className="flex items-center gap-2">
              <Camera className="w-5 h-5 text-primary" />
              <h1 className="font-semibold text-lg hidden sm:block">蛇腹展開図作成ツール</h1>
              <h1 className="font-semibold text-lg sm:hidden">蛇腹ツール</h1>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <div className="hidden sm:flex items-center gap-1 mr-2">
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8"
                onClick={handleUndo}
                disabled={historyIndex === 0}
                title="元に戻す"
              >
                <Undo2 className="w-4 h-4" />
                <span className="sr-only">元に戻す</span>
              </Button>
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8"
                onClick={handleRedo}
                disabled={historyIndex === history.length - 1}
                title="やり直す"
              >
                <Redo2 className="w-4 h-4" />
                <span className="sr-only">やり直す</span>
              </Button>
            </div>
            <ImportDialog onImport={handleParamsChange} />
            <Button variant="ghost" size="icon" className="h-9 w-9" onClick={handleReset} title="リセット">
              <RotateCcw className="w-4 h-4" />
              <span className="sr-only">リセット</span>
            </Button>
            <HelpDialog />
            <ExportDialog svgRef={svgRef} viewBox={viewBox} params={params} />
          </div>
        </div>
      </header>

      {/* Main Content */}
      <div className="flex-1 flex overflow-hidden">
        {/* Desktop Sidebar */}
        <aside className="hidden lg:flex w-80 border-r border-border bg-card/30 flex-col">
          <div className="p-4 border-b border-border">
            <h2 className="font-semibold text-sm text-muted-foreground uppercase tracking-wide">パラメータ設定</h2>
          </div>
          <div className="flex-1 overflow-y-auto p-4">
            <ParameterPanel params={params} onChange={handleParamsChange} />
          </div>
        </aside>

        {/* Canvas Area */}
        <main className="flex-1 flex flex-col overflow-hidden">
          {/* Dimension Info */}
          <div className="px-4 py-2 border-b border-border bg-card/30">
            <p className="text-xs text-muted-foreground font-mono">{dimensions || "展開図を生成中..."}</p>
          </div>

          {/* SVG Canvas */}
          <div className="flex-1 p-4 overflow-hidden">
            <BellowsCanvas
              params={params}
              onViewBoxChange={setViewBox}
              onDimensionsChange={setDimensions}
              svgRef={svgRef}
            />
          </div>

          {/* Legend */}
          <div className="px-4 py-3 border-t border-border bg-card/30">
            <div className="flex flex-wrap items-center gap-4 text-xs">
              <div className="flex items-center gap-2">
                <div className="w-6 h-0.5 border-t-2 border-dashed border-[#e11d48]" />
                <span className="text-muted-foreground">山折り</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-6 h-0.5 border-t-2 border-dotted border-[#2563eb]" />
                <span className="text-muted-foreground">谷折り</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-6 h-0.5 bg-[#1a1a2e]" />
                <span className="text-muted-foreground">輪郭線</span>
              </div>
              {params.showAnnotations && (
                <div className="flex items-center gap-2">
                  <div className="w-6 h-0.5 border-t border-dashed border-[#22c55e]" />
                  <span className="text-muted-foreground">用紙枠</span>
                </div>
              )}
            </div>
          </div>
        </main>
      </div>
    </div>
  )
}
