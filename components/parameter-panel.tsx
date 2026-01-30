"use client"

import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { Slider } from "@/components/ui/slider"
import { Switch } from "@/components/ui/switch"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import type { BellowsParams } from "./bellows-canvas"
import { Camera, Ruler, Settings2, Layers } from "lucide-react"

interface Props {
  params: BellowsParams
  onChange: (params: BellowsParams) => void
}

export function ParameterPanel({ params, onChange }: Props) {
  const updateParam = <K extends keyof BellowsParams>(key: K, value: BellowsParams[K]) => {
    onChange({ ...params, [key]: value })
  }

  const updateBdData = <K extends keyof BellowsParams["bdData"]>(key: K, value: BellowsParams["bdData"][K]) => {
    onChange({
      ...params,
      bdData: { ...params.bdData, [key]: value },
    })
  }

  const setBdMode = (value: boolean) => {
    onChange({
      ...params,
      useBdMode: value,
      useGeneratorMode: value ? false : params.useGeneratorMode,
    })
  }

  const setGeneratorMode = (value: boolean) => {
    onChange({
      ...params,
      useGeneratorMode: value,
      useBdMode: value ? false : params.useBdMode,
    })
  }

  return (
    <div className="flex flex-col gap-4 h-full overflow-y-auto pb-4">
      <Tabs defaultValue="basic" className="w-full">
        <TabsList className="w-full grid grid-cols-3">
          <TabsTrigger value="basic" className="flex items-center gap-1.5">
            <Ruler className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">基本</span>
          </TabsTrigger>
          <TabsTrigger value="advanced" className="flex items-center gap-1.5">
            <Settings2 className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">詳細</span>
          </TabsTrigger>
          <TabsTrigger value="bellows" className="flex items-center gap-1.5">
            <Camera className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">BD互換</span>
          </TabsTrigger>
        </TabsList>

        <TabsContent value="basic" className="space-y-4 mt-4">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm flex items-center gap-2">
                <div className="w-2 h-2 rounded-full bg-primary" />
                前枠サイズ
              </CardTitle>
              <CardDescription className="text-xs">レンズ側（小さい方）</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label className="text-xs">幅 (mm)</Label>
                  <span className="text-xs text-muted-foreground">{params.frontWidth}</span>
                </div>
                <div className="flex items-center gap-2">
                  <Slider
                    value={[params.frontWidth]}
                    onValueChange={([v]) => updateParam("frontWidth", v)}
                    min={10}
                    max={300}
                    step={1}
                    className="flex-1"
                  />
                  <Input
                    type="number"
                    value={params.frontWidth}
                    onChange={(e) => updateParam("frontWidth", Number(e.target.value))}
                    className="w-20 h-8 text-xs"
                    min={10}
                    max={300}
                  />
                </div>
              </div>
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label className="text-xs">高さ (mm)</Label>
                  <span className="text-xs text-muted-foreground">{params.frontHeight}</span>
                </div>
                <div className="flex items-center gap-2">
                  <Slider
                    value={[params.frontHeight]}
                    onValueChange={([v]) => updateParam("frontHeight", v)}
                    min={10}
                    max={300}
                    step={1}
                    className="flex-1"
                  />
                  <Input
                    type="number"
                    value={params.frontHeight}
                    onChange={(e) => updateParam("frontHeight", Number(e.target.value))}
                    className="w-20 h-8 text-xs"
                    min={10}
                    max={300}
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm flex items-center gap-2">
                <div className="w-2 h-2 rounded-full bg-chart-2" />
                後枠サイズ
              </CardTitle>
              <CardDescription className="text-xs">フィルム側（大きい方）</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label className="text-xs">幅 (mm)</Label>
                  <span className="text-xs text-muted-foreground">{params.rearWidth}</span>
                </div>
                <div className="flex items-center gap-2">
                  <Slider
                    value={[params.rearWidth]}
                    onValueChange={([v]) => updateParam("rearWidth", v)}
                    min={10}
                    max={400}
                    step={1}
                    className="flex-1"
                  />
                  <Input
                    type="number"
                    value={params.rearWidth}
                    onChange={(e) => updateParam("rearWidth", Number(e.target.value))}
                    className="w-20 h-8 text-xs"
                    min={10}
                    max={400}
                  />
                </div>
              </div>
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label className="text-xs">高さ (mm)</Label>
                  <span className="text-xs text-muted-foreground">{params.rearHeight}</span>
                </div>
                <div className="flex items-center gap-2">
                  <Slider
                    value={[params.rearHeight]}
                    onValueChange={([v]) => updateParam("rearHeight", v)}
                    min={10}
                    max={400}
                    step={1}
                    className="flex-1"
                  />
                  <Input
                    type="number"
                    value={params.rearHeight}
                    onChange={(e) => updateParam("rearHeight", Number(e.target.value))}
                    className="w-20 h-8 text-xs"
                    min={10}
                    max={400}
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm flex items-center gap-2">
                <Layers className="w-4 h-4" />
                蛇腹構造
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label className="text-xs">段数</Label>
                  <span className="text-xs text-muted-foreground">{params.folds}</span>
                </div>
                <div className="flex items-center gap-2">
                  <Slider
                    value={[params.folds]}
                    onValueChange={([v]) => updateParam("folds", v)}
                    min={2}
                    max={40}
                    step={1}
                    className="flex-1"
                  />
                  <Input
                    type="number"
                    value={params.folds}
                    onChange={(e) => updateParam("folds", Number(e.target.value))}
                    className="w-20 h-8 text-xs"
                    min={2}
                    max={40}
                  />
                </div>
              </div>
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label className="text-xs">折り深さ (mm)</Label>
                  <span className="text-xs text-muted-foreground">{params.foldDepth}</span>
                </div>
                <div className="flex items-center gap-2">
                  <Slider
                    value={[params.foldDepth]}
                    onValueChange={([v]) => updateParam("foldDepth", v)}
                    min={5}
                    max={50}
                    step={0.5}
                    className="flex-1"
                  />
                  <Input
                    type="number"
                    value={params.foldDepth}
                    onChange={(e) => updateParam("foldDepth", Number(e.target.value))}
                    className="w-20 h-8 text-xs"
                    min={5}
                    max={50}
                    step={0.5}
                  />
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="advanced" className="space-y-4 mt-4">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm">出力設定</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label className="text-xs">ページサイズ</Label>
                <Select value={params.pageSize} onValueChange={(v) => updateParam("pageSize", v as "A4" | "B4" | "A3")}>
                  <SelectTrigger className="h-9">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="A4">A4 (210 x 297mm)</SelectItem>
                    <SelectItem value="B4">B4 (257 x 364mm)</SelectItem>
                    <SelectItem value="A3">A3 (297 x 420mm)</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="flex items-center justify-between">
                <Label className="text-xs">注釈を表示</Label>
                <Switch checked={params.showAnnotations} onCheckedChange={(v) => updateParam("showAnnotations", v)} />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm">高精度(4面展開)</CardTitle>
              <CardDescription className="text-xs">
                bellows-generator互換の折線を生成します（前後枠は内寸として扱います）
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex items-center justify-between">
                <Label className="text-xs">高精度モードを使用</Label>
                <Switch checked={params.useGeneratorMode} onCheckedChange={setGeneratorMode} />
              </div>
              <p className="text-[11px] text-muted-foreground">
                折り深さは「折幅」として扱い、外寸は内寸＋折幅×2で計算します。
              </p>
              <div className="flex items-center justify-between">
                <Label className="text-xs">5面展開（継ぎ目用）</Label>
                <Switch
                  checked={params.useFiveFaces}
                  onCheckedChange={(v) => updateParam("useFiveFaces", v)}
                  disabled={!params.useGeneratorMode}
                />
              </div>
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label className="text-xs">のりしろ幅 (mm)</Label>
                  <span className="text-xs text-muted-foreground">{params.seamAllowance}</span>
                </div>
                <div className="flex items-center gap-2">
                  <Slider
                    value={[params.seamAllowance]}
                    onValueChange={([v]) => updateParam("seamAllowance", v)}
                    min={0}
                    max={30}
                    step={0.5}
                    className="flex-1"
                    disabled={!params.useGeneratorMode}
                  />
                  <Input
                    type="number"
                    value={params.seamAllowance}
                    onChange={(e) => updateParam("seamAllowance", Number(e.target.value))}
                    className="w-20 h-8 text-xs"
                    min={0}
                    max={30}
                    step={0.5}
                    disabled={!params.useGeneratorMode}
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm">プリセット</CardTitle>
              <CardDescription className="text-xs">よく使われるカメラサイズ</CardDescription>
            </CardHeader>
            <CardContent className="grid grid-cols-2 gap-2">
              {[
                { name: "4x5", front: 100, rear: 127 },
                { name: "5x7", front: 127, rear: 178 },
                { name: "8x10", front: 203, rear: 254 },
                { name: "11x14", front: 280, rear: 356 },
              ].map((preset) => (
                <button
                  key={preset.name}
                  type="button"
                  className="px-3 py-2 text-xs bg-secondary hover:bg-secondary/80 rounded-lg transition-colors"
                  onClick={() => {
                    onChange({
                      ...params,
                      frontWidth: preset.front,
                      frontHeight: preset.front,
                      rearWidth: preset.rear,
                      rearHeight: preset.rear,
                    })
                  }}
                >
                  {preset.name}
                </button>
              ))}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="bellows" className="space-y-4 mt-4">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm">BellowsDesigner互換モード</CardTitle>
              <CardDescription className="text-xs">より精密な展開図を生成します</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <Label className="text-xs">BD互換モードを使用</Label>
                <Switch checked={params.useBdMode} onCheckedChange={setBdMode} />
              </div>
            </CardContent>
          </Card>

          {params.useBdMode && (
            <>
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm">カメラパラメータ</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <Label className="text-xs">焦点距離 (mm)</Label>
                      <span className="text-xs text-muted-foreground">{params.bdData.cameraFocalDist}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Slider
                        value={[params.bdData.cameraFocalDist]}
                        onValueChange={([v]) => updateBdData("cameraFocalDist", v)}
                        min={50}
                        max={500}
                        step={1}
                        className="flex-1"
                      />
                      <Input
                        type="number"
                        value={params.bdData.cameraFocalDist}
                        onChange={(e) => updateBdData("cameraFocalDist", Number(e.target.value))}
                        className="w-20 h-8 text-xs"
                      />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <Label className="text-xs">前枠サイズ (mm)</Label>
                      <span className="text-xs text-muted-foreground">{params.bdData.frontStdSize}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Slider
                        value={[params.bdData.frontStdSize]}
                        onValueChange={([v]) => updateBdData("frontStdSize", v)}
                        min={50}
                        max={300}
                        step={1}
                        className="flex-1"
                      />
                      <Input
                        type="number"
                        value={params.bdData.frontStdSize}
                        onChange={(e) => updateBdData("frontStdSize", Number(e.target.value))}
                        className="w-20 h-8 text-xs"
                      />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <Label className="text-xs">後枠サイズ (mm)</Label>
                      <span className="text-xs text-muted-foreground">{params.bdData.rearStdSize}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Slider
                        value={[params.bdData.rearStdSize]}
                        onValueChange={([v]) => updateBdData("rearStdSize", v)}
                        min={50}
                        max={400}
                        step={1}
                        className="flex-1"
                      />
                      <Input
                        type="number"
                        value={params.bdData.rearStdSize}
                        onChange={(e) => updateBdData("rearStdSize", Number(e.target.value))}
                        className="w-20 h-8 text-xs"
                      />
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm">蛇腹パラメータ</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <Label className="text-xs">折り間隔 (mm)</Label>
                      <span className="text-xs text-muted-foreground">{params.bdData.foldDist}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Slider
                        value={[params.bdData.foldDist]}
                        onValueChange={([v]) => updateBdData("foldDist", v)}
                        min={5}
                        max={50}
                        step={0.5}
                        className="flex-1"
                      />
                      <Input
                        type="number"
                        value={params.bdData.foldDist}
                        onChange={(e) => updateBdData("foldDist", Number(e.target.value))}
                        className="w-20 h-8 text-xs"
                        step={0.5}
                      />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <Label className="text-xs">フレックス係数</Label>
                      <span className="text-xs text-muted-foreground">{params.bdData.flexFactor}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Slider
                        value={[params.bdData.flexFactor]}
                        onValueChange={([v]) => updateBdData("flexFactor", v)}
                        min={0.5}
                        max={5}
                        step={0.1}
                        className="flex-1"
                      />
                      <Input
                        type="number"
                        value={params.bdData.flexFactor}
                        onChange={(e) => updateBdData("flexFactor", Number(e.target.value))}
                        className="w-20 h-8 text-xs"
                        step={0.1}
                      />
                    </div>
                  </div>
                </CardContent>
              </Card>
            </>
          )}
        </TabsContent>
      </Tabs>
    </div>
  )
}
