"use client"

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { HelpCircle } from "lucide-react"
import { ScrollArea } from "@/components/ui/scroll-area"

export function HelpDialog() {
  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button variant="ghost" size="icon" className="h-9 w-9">
          <HelpCircle className="w-5 h-5" />
          <span className="sr-only">ヘルプ</span>
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-lg max-h-[85vh]">
        <DialogHeader>
          <DialogTitle>蛇腹展開図の作成方法</DialogTitle>
          <DialogDescription>大判カメラ用蛇腹の展開図を作成するためのガイド</DialogDescription>
        </DialogHeader>

        <ScrollArea className="h-[60vh] pr-4">
          <div className="space-y-6 text-sm">
            <section>
              <h3 className="font-semibold text-foreground mb-2">基本的な使い方</h3>
              <ol className="list-decimal list-inside space-y-2 text-muted-foreground">
                <li>
                  <strong className="text-foreground">前枠サイズ</strong>
                  を設定します。これはレンズ側（小さい方）のサイズです。
                </li>
                <li>
                  <strong className="text-foreground">後枠サイズ</strong>
                  を設定します。これはフィルム側（大きい方）のサイズです。
                </li>
                <li>
                  <strong className="text-foreground">段数</strong>
                  で蛇腹の折り目の数を指定します。段数が多いほど伸縮性が上がります。
                </li>
                <li>
                  <strong className="text-foreground">折り深さ</strong>
                  は各折り目の深さ（mm）を指定します。
                </li>
              </ol>
            </section>

            <section>
              <h3 className="font-semibold text-foreground mb-2">折り線の見方</h3>
              <div className="space-y-2 text-muted-foreground">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-0.5 border-t-2 border-dashed border-[#e11d48]" />
                  <span>
                    山折り線 - <strong className="text-[#e11d48]">赤</strong>の破線
                  </span>
                </div>
                <div className="flex items-center gap-3">
                  <div className="w-12 h-0.5 border-t-2 border-dotted border-[#2563eb]" />
                  <span>
                    谷折り線 - <strong className="text-[#2563eb]">青</strong>の点線
                  </span>
                </div>
              </div>
            </section>

            <section>
              <h3 className="font-semibold text-foreground mb-2">プリセット</h3>
              <p className="text-muted-foreground mb-2">よく使われる大判カメラのサイズが用意されています：</p>
              <ul className="list-disc list-inside space-y-1 text-muted-foreground">
                <li>
                  <strong>4x5</strong> - 100mm x 127mm
                </li>
                <li>
                  <strong>5x7</strong> - 127mm x 178mm
                </li>
                <li>
                  <strong>8x10</strong> - 203mm x 254mm
                </li>
                <li>
                  <strong>11x14</strong> - 280mm x 356mm
                </li>
              </ul>
            </section>

            <section>
              <h3 className="font-semibold text-foreground mb-2">BellowsDesigner互換モード</h3>
              <p className="text-muted-foreground">
                BellowsDesignerソフトウェアと互換性のある、より精密な展開図を生成できます。
                カメラの焦点距離やフレックス係数を指定することで、実際の使用環境に最適化された蛇腹を設計できます。
              </p>
            </section>

            <section>
              <h3 className="font-semibold text-foreground mb-2">高精度(4面展開)モード</h3>
              <p className="text-muted-foreground">
                bellows-generatorを参考にした折線を生成し、4面を折って組み立てられる展開図を描画します。
                前枠・後枠は内寸として扱い、折り深さは折幅として外寸に反映されます。
              </p>
            </section>

            <section>
              <h3 className="font-semibold text-foreground mb-2">のりしろと5面展開</h3>
              <p className="text-muted-foreground">
                高精度モードで「5面展開」を有効にすると、継ぎ目用ののりしろを描画できます。
                のりしろ幅は0mm以上で設定できます。
              </p>
            </section>

            <section>
              <h3 className="font-semibold text-foreground mb-2">エクスポート</h3>
              <ul className="list-disc list-inside space-y-1 text-muted-foreground">
                <li>
                  <strong>SVG</strong> - ベクター形式。編集ソフトで加工可能
                </li>
                <li>
                  <strong>PNG</strong> - 高解像度の画像形式
                </li>
                <li>
                  <strong>JSON</strong> - パラメータの保存・共有用
                </li>
                <li>
                  <strong>印刷/PDF</strong> - 直接印刷またはPDF保存
                </li>
              </ul>
            </section>

            <section>
              <h3 className="font-semibold text-foreground mb-2">操作方法</h3>
              <ul className="list-disc list-inside space-y-1 text-muted-foreground">
                <li>
                  <strong>ズーム</strong> - マウスホイールまたは右下のボタン
                </li>
                <li>
                  <strong>パン</strong> - キャンバスをドラッグ
                </li>
                <li>
                  <strong>リセット</strong> - 右下の「Reset」ボタン
                </li>
              </ul>
            </section>

            <section>
              <h3 className="font-semibold text-foreground mb-2">制作のヒント</h3>
              <ul className="list-disc list-inside space-y-1 text-muted-foreground">
                <li>素材は薄手の革や合成皮革、厚紙などが適しています</li>
                <li>折り目には定規を当ててカッターの背などで型をつけると綺麗に折れます</li>
                <li>内側には遮光のために黒いベルベットなどを貼ると良いでしょう</li>
                <li>枠との接合部分には10〜15mmののりしろを追加してください</li>
              </ul>
            </section>
          </div>
        </ScrollArea>
      </DialogContent>
    </Dialog>
  )
}
