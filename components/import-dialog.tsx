"use client"

import React from "react"

import { useState, useRef } from "react"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Upload, FileJson } from "lucide-react"
import type { BellowsParams } from "./bellows-canvas"

interface Props {
  onImport: (params: BellowsParams) => void
}

export function ImportDialog({ onImport }: Props) {
  const [error, setError] = useState<string | null>(null)
  const [open, setOpen] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    setError(null)

    const reader = new FileReader()
    reader.onload = (event) => {
      try {
        const content = event.target?.result as string
        const data = JSON.parse(content)

        // Validate the imported data
        if (data.params) {
          // New format with params object
          const params = data.params as BellowsParams
          if (validateParams(params)) {
            onImport(params)
            setOpen(false)
          } else {
            setError("無効なパラメータ形式です")
          }
        } else if (data.frontWidth !== undefined) {
          // Direct params format
          if (validateParams(data as BellowsParams)) {
            onImport(data as BellowsParams)
            setOpen(false)
          } else {
            setError("無効なパラメータ形式です")
          }
        } else if (data.cameraFocalDist !== undefined) {
          // BellowsDesigner format
          const params: BellowsParams = {
            frontWidth: data.frontStdSize || 100,
            frontHeight: data.frontStdSize || 100,
            rearWidth: data.rearStdSize || 120,
            rearHeight: data.rearStdSize || 120,
            folds: data.numFolds || 8,
            foldDepth: data.foldDist || 15,
            showAnnotations: true,
            pageSize: "A4",
            useBdMode: true,
            bdData: {
              cameraFocalDist: data.cameraFocalDist || 120,
              frontStdSize: data.frontStdSize || 100,
              rearStdSize: data.rearStdSize || 120,
              foldDist: data.foldDist || 18.5,
              flexFactor: data.flexFactor || 2,
            },
          }
          onImport(params)
          setOpen(false)
        } else {
          setError("認識できないファイル形式です")
        }
      } catch {
        setError("ファイルの読み込みに失敗しました")
      }
    }
    reader.readAsText(file)
  }

  const validateParams = (params: BellowsParams): boolean => {
    return (
      typeof params.frontWidth === "number" &&
      typeof params.frontHeight === "number" &&
      typeof params.rearWidth === "number" &&
      typeof params.rearHeight === "number" &&
      typeof params.folds === "number" &&
      typeof params.foldDepth === "number"
    )
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="ghost" size="icon" className="h-9 w-9" title="設定をインポート">
          <Upload className="w-4 h-4" />
          <span className="sr-only">インポート</span>
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>設定をインポート</DialogTitle>
          <DialogDescription>以前保存した設定ファイル（JSON）を読み込みます</DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <input
            ref={fileInputRef}
            type="file"
            accept=".json"
            onChange={handleFileChange}
            className="hidden"
          />

          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            className="w-full h-32 border-2 border-dashed border-border rounded-lg flex flex-col items-center justify-center gap-2 hover:border-primary/50 hover:bg-muted/50 transition-colors cursor-pointer"
          >
            <FileJson className="w-8 h-8 text-muted-foreground" />
            <span className="text-sm text-muted-foreground">クリックしてJSONファイルを選択</span>
          </button>

          {error && (
            <p className="text-sm text-destructive text-center">{error}</p>
          )}

          <div className="text-xs text-muted-foreground space-y-1">
            <p>対応形式:</p>
            <ul className="list-disc list-inside pl-2">
              <li>本ツールからエクスポートしたJSON</li>
              <li>BellowsDesigner形式のJSON</li>
            </ul>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
