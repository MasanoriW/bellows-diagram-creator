"use client"

import React from "react"

import { useEffect, useRef, useCallback, useState } from "react"

export interface BellowsParams {
  frontWidth: number
  frontHeight: number
  rearWidth: number
  rearHeight: number
  folds: number
  foldDepth: number
  showAnnotations: boolean
  pageSize: "A4" | "B4" | "A3"
  useBdMode: boolean
  useGeneratorMode: boolean
  useFiveFaces: boolean
  seamAllowance: number
  bdData: {
    cameraFocalDist: number
    frontStdSize: number
    rearStdSize: number
    foldDist: number
    flexFactor: number
  }
}

interface ViewBox {
  x: number
  y: number
  width: number
  height: number
}

interface Props {
  params: BellowsParams
  onViewBoxChange?: (viewBox: ViewBox) => void
  onDimensionsChange?: (dims: string) => void
  svgRef?: React.RefObject<SVGSVGElement | null>
}

const PAGE_SIZES = {
  A4: { width: 210, height: 297, label: "A4" },
  B4: { width: 257, height: 364, label: "B4" },
  A3: { width: 297, height: 420, label: "A3" },
}

interface Matrix {
  a: number
  b: number
  c: number
  d: number
  e: number
  f: number
}

export function BellowsCanvas({ params, onViewBoxChange, onDimensionsChange, svgRef: externalSvgRef }: Props) {
  const internalSvgRef = useRef<SVGSVGElement>(null)
  const svgRef = externalSvgRef || internalSvgRef
  const [viewBox, setViewBox] = useState<ViewBox>({ x: 0, y: 0, width: 800, height: 600 })
  const [isPanning, setIsPanning] = useState(false)
  const [startPan, setStartPan] = useState({ x: 0, y: 0 })
  const [zoom, setZoom] = useState(1)

  const getBellowsDesignerData = useCallback(() => {
    const { cameraFocalDist, frontStdSize, rearStdSize, foldDist, flexFactor } = params.bdData
    const flexPanelSideLength = cameraFocalDist * flexFactor
    const cSqr = flexPanelSideLength * flexPanelSideLength
    const aSqr = ((rearStdSize - frontStdSize) / 2) ** 2
    const panelLength = Math.sqrt(Math.max(cSqr - aSqr, 0))
    const numFolds = Math.ceil(panelLength / foldDist)
    const bellowsLength = panelLength
    const canvasWidth = rearStdSize > frontStdSize ? 2 * rearStdSize : 1.5 * frontStdSize
    const canvasHeight = 1.5 * bellowsLength

    return {
      ...params.bdData,
      flexPanelSideLength,
      panelLength,
      numFolds,
      bellowsLength,
      canvasWidth,
      canvasHeight,
    }
  }, [params.bdData])

  const drawBellowsDesigner = useCallback((svg: SVGSVGElement) => {
    const data = getBellowsDesignerData()
    const dash = 6
    const { frontStdSize, rearStdSize, numFolds, bellowsLength, canvasWidth, canvasHeight } = data

    const createSVGElement = <K extends keyof SVGElementTagNameMap>(
      tag: K,
      attrs: Record<string, string | number>
    ): SVGElementTagNameMap[K] => {
      const elem = document.createElementNS("http://www.w3.org/2000/svg", tag)
      for (const [key, value] of Object.entries(attrs)) {
        elem.setAttribute(key, String(value))
      }
      return elem
    }

    const lineIntersection = (line1: number[][], line2: number[][]): number[] => {
      const [x1, y1] = line1[0]
      const [x2, y2] = line1[1]
      const [x3, y3] = line2[0]
      const [x4, y4] = line2[1]
      const denom = (x1 - x2) * (y3 - y4) - (y1 - y2) * (x3 - x4)
      if (Math.abs(denom) < 0.0001) return [0, 0]
      const t = ((x1 - x3) * (y3 - y4) - (y1 - y3) * (x3 - x4)) / denom
      return [x1 + t * (x2 - x1), y1 + t * (y2 - y1)]
    }

    const slopeLine = (line: number[][]): number => {
      return Math.atan2(line[1][1] - line[0][1], line[1][0] - line[0][0])
    }

    const pointAngleLine = (point: number[], angle: number, length: number): number[][] => {
      return [point, [point[0] + length * Math.cos(angle), point[1] + length * Math.sin(angle)]]
    }

    const drawPleats = (
      startLine: number[][],
      foldDistIn: number,
      numFoldsIn: number,
      rightLineInner: number[][],
      leftLineInner: number[][],
      slope: number,
      sign: number
    ) => {
      let [prevRightX, prevRightY] = startLine[0]
      let [prevLeftX, prevLeftY] = startLine[1]
      let leftPrevIntrLine: number[][] | null = null
      let leftPrevIntrLineOther: number[][] | null = null
      let rightPrevIntrLine: number[][] | null = null
      let rightPrevIntrLineOther: number[][] | null = null
      let isUpPleat = false

      for (let x = 0; x <= 2 * numFoldsIn; x++) {
        const intrLine = [
          [startLine[0][0], startLine[0][1] - foldDistIn * 0.5 * x],
          [startLine[1][0], startLine[1][1] - foldDistIn * 0.5 * x],
        ]
        const lftPoint = lineIntersection(leftLineInner, intrLine)
        const rgtPoint = lineIntersection(rightLineInner, intrLine)

        if (x % 2 === 0) {
          let leftPleatLine: number[][]
          let leftPleatLineOther: number[][]
          let rightPleatLine: number[][]
          let rightPleatLineOther: number[][]

          if (!isUpPleat) {
            leftPleatLine = pointAngleLine([prevLeftX, prevLeftY], (-slope + Math.PI / 4) * sign, 10000)
            leftPleatLineOther = pointAngleLine([prevLeftX, prevLeftY], -(slope + Math.PI / 4) * sign, -10000)
            rightPleatLine = pointAngleLine([prevRightX, prevRightY], -(-slope + Math.PI / 4) * sign, -10000)
            rightPleatLineOther = pointAngleLine([prevRightX, prevRightY], (slope + Math.PI / 4) * sign, -10000)
            isUpPleat = true
          } else {
            leftPleatLine = pointAngleLine([prevLeftX, prevLeftY], -(slope + Math.PI / 4) * sign, 10000)
            leftPleatLineOther = pointAngleLine([prevLeftX, prevLeftY], (-slope + Math.PI / 4) * sign, -10000)
            rightPleatLine = pointAngleLine([prevRightX, prevRightY], (slope + Math.PI / 4) * sign, -10000)
            rightPleatLineOther = pointAngleLine([prevRightX, prevRightY], -(-slope + Math.PI / 4) * sign, -10000)
            isUpPleat = false
          }

          if (leftPrevIntrLine !== null) {
            let leftPoint: number[]
            let rightPoint: number[]
            if (!isUpPleat) {
              leftPoint = lineIntersection(leftPrevIntrLine, leftPleatLine)
              rightPoint = lineIntersection(rightPrevIntrLine!, rightPleatLine)
              svg.appendChild(
                createSVGElement("line", {
                  x1: leftPrevIntrLine[0][0],
                  y1: leftPrevIntrLine[0][1],
                  x2: leftPoint[0],
                  y2: leftPoint[1],
                  stroke: "#1a1a2e",
                  "stroke-width": 1,
                })
              )
              svg.appendChild(
                createSVGElement("line", {
                  x1: rightPrevIntrLine![0][0],
                  y1: rightPrevIntrLine![0][1],
                  x2: rightPoint[0],
                  y2: rightPoint[1],
                  stroke: "#1a1a2e",
                  "stroke-width": 1,
                })
              )
            } else {
              leftPoint = lineIntersection(leftPrevIntrLineOther!, leftPleatLineOther)
              rightPoint = lineIntersection(rightPrevIntrLineOther!, rightPleatLineOther)
              svg.appendChild(
                createSVGElement("line", {
                  x1: leftPrevIntrLineOther![0][0],
                  y1: leftPrevIntrLineOther![0][1],
                  x2: leftPoint[0],
                  y2: leftPoint[1],
                  stroke: "#1a1a2e",
                  "stroke-width": 1,
                })
              )
              svg.appendChild(
                createSVGElement("line", {
                  x1: rightPrevIntrLineOther![0][0],
                  y1: rightPrevIntrLineOther![0][1],
                  x2: rightPoint[0],
                  y2: rightPoint[1],
                  stroke: "#1a1a2e",
                  "stroke-width": 1,
                })
              )
            }

            svg.appendChild(
              createSVGElement("line", {
                x1: leftPoint[0],
                y1: leftPoint[1],
                x2: rightPoint[0],
                y2: rightPoint[1],
                stroke: "#2563eb",
                "stroke-width": 1,
                "stroke-dasharray": `${dash},${dash}`,
              })
            )
          }

          leftPrevIntrLine = leftPleatLine
          leftPrevIntrLineOther = leftPleatLineOther
          rightPrevIntrLine = rightPleatLine
          rightPrevIntrLineOther = rightPleatLineOther
        } else {
          svg.appendChild(
            createSVGElement("line", {
              x1: lftPoint[0],
              y1: lftPoint[1],
              x2: rgtPoint[0],
              y2: rgtPoint[1],
              stroke: "#2563eb",
              "stroke-width": 1,
              "stroke-dasharray": `${dash},${dash}`,
            })
          )
        }

        prevLeftX = lftPoint[0]
        prevLeftY = lftPoint[1]
        prevRightX = rgtPoint[0]
        prevRightY = rgtPoint[1]
      }
    }

    const newViewBox = { x: 0, y: 0, width: canvasWidth, height: canvasHeight }
    svg.setAttribute("viewBox", `0 0 ${canvasWidth} ${canvasHeight}`)
    setViewBox(newViewBox)
    onViewBoxChange?.(newViewBox)

    const centerX = canvasWidth / 2
    const centerY = canvasHeight / 2
    const bellowsMidTop = centerY - bellowsLength / 2
    const bellowsMidBtm = centerY + bellowsLength / 2

    svg.appendChild(
      createSVGElement("line", {
        x1: centerX,
        y1: bellowsMidBtm,
        x2: centerX,
        y2: bellowsMidTop,
        stroke: "#1a1a2e",
        "stroke-width": 1,
        "stroke-dasharray": `${dash},${dash}`,
      })
    )

    const frontStrLft: number[] = [centerX - frontStdSize / 2, bellowsMidTop]
    const frontStrRgt: number[] = [centerX + frontStdSize / 2, bellowsMidTop]
    const rearStrLft: number[] = [centerX - rearStdSize / 2, bellowsMidBtm]
    const rearStrRgt: number[] = [centerX + rearStdSize / 2, bellowsMidBtm]

    svg.appendChild(
      createSVGElement("line", {
        x1: frontStrLft[0],
        y1: frontStrLft[1],
        x2: frontStrRgt[0],
        y2: frontStrRgt[1],
        stroke: "#1a1a2e",
        "stroke-width": 2,
      })
    )
    svg.appendChild(
      createSVGElement("line", {
        x1: rearStrLft[0],
        y1: rearStrLft[1],
        x2: rearStrRgt[0],
        y2: rearStrRgt[1],
        stroke: "#1a1a2e",
        "stroke-width": 2,
      })
    )
    svg.appendChild(
      createSVGElement("line", {
        x1: frontStrRgt[0],
        y1: frontStrRgt[1],
        x2: rearStrRgt[0],
        y2: rearStrRgt[1],
        stroke: "#1a1a2e",
        "stroke-width": 2,
      })
    )
    svg.appendChild(
      createSVGElement("line", {
        x1: frontStrLft[0],
        y1: frontStrLft[1],
        x2: rearStrLft[0],
        y2: rearStrLft[1],
        stroke: "#1a1a2e",
        "stroke-width": 2,
      })
    )

    const slope = slopeLine([rearStrRgt, frontStrRgt])
    drawPleats(
      [rearStrRgt, rearStrLft],
      bellowsLength / numFolds,
      numFolds,
      [rearStrRgt, frontStrRgt],
      [rearStrLft, frontStrLft],
      -slope,
      -1
    )

    const dims = `前枠: ${frontStdSize.toFixed(1)}mm | 後枠: ${rearStdSize.toFixed(1)}mm | 段数: ${numFolds} | パネル長: ${data.panelLength.toFixed(1)}mm`
    onDimensionsChange?.(dims)
  }, [getBellowsDesignerData, onViewBoxChange, onDimensionsChange])

  const drawGeneratorBellows = useCallback((svg: SVGSVGElement) => {
    const page = PAGE_SIZES[params.pageSize]
    const frontIW = params.frontWidth
    const frontIH = params.frontHeight
    const backIW = params.rearWidth
    const backIH = params.rearHeight
    const fold = Math.max(params.foldDepth, 1)
    const folds = Math.max(2, Math.round(params.folds))
    const length = folds * fold
    const seamAllowance = Math.max(0, params.seamAllowance)
    const frontOW = frontIW + 2 * fold
    const frontOH = frontIH + 2 * fold
    const backOW = backIW + 2 * fold
    const backOH = backIH + 2 * fold

    const createSVGElement = <K extends keyof SVGElementTagNameMap>(
      tag: K,
      attrs: Record<string, string | number>
    ): SVGElementTagNameMap[K] => {
      const elem = document.createElementNS("http://www.w3.org/2000/svg", tag)
      for (const [key, value] of Object.entries(attrs)) {
        elem.setAttribute(key, String(value))
      }
      return elem
    }

    const identityMatrix = (): Matrix => ({ a: 1, b: 0, c: 0, d: 1, e: 0, f: 0 })
    const translateMatrix = (m: Matrix, tx: number, ty: number): Matrix => ({
      a: m.a,
      b: m.b,
      c: m.c,
      d: m.d,
      e: m.e + m.a * tx + m.c * ty,
      f: m.f + m.b * tx + m.d * ty,
    })
    const matrixToString = (m: Matrix) => `matrix(${m.a} ${m.b} ${m.c} ${m.d} ${m.e} ${m.f})`
    const transformPoint = (m: Matrix, point: number[]) => [m.a * point[0] + m.c * point[1] + m.e, m.b * point[0] + m.d * point[1] + m.f]

    const bounds = { minX: Infinity, minY: Infinity, maxX: -Infinity, maxY: -Infinity }
    const updateBounds = (m: Matrix, start: number[], end: number[]) => {
      const s = transformPoint(m, start)
      const e = transformPoint(m, end)
      bounds.minX = Math.min(bounds.minX, s[0], e[0])
      bounds.minY = Math.min(bounds.minY, s[1], e[1])
      bounds.maxX = Math.max(bounds.maxX, s[0], e[0])
      bounds.maxY = Math.max(bounds.maxY, s[1], e[1])
    }

    const line = (group: SVGGElement, m: Matrix, start: number[], end: number[], stroke: string, dash?: string) => {
      const element = createSVGElement("line", {
        x1: start[0],
        y1: start[1],
        x2: end[0],
        y2: end[1],
        stroke,
        "stroke-width": 0.8,
      })
      if (dash) {
        element.setAttribute("stroke-dasharray", dash)
      }
      group.appendChild(element)
      updateBounds(m, start, end)
    }

    const taper = (back: number, front: number, len: number, pos: number) => {
      const diff = (back - front) / 2
      return (diff / len) * pos
    }

    const drawSeamFlap = (group: SVGGElement, m: Matrix, start: number[], end: number[]) => {
      if (seamAllowance <= 0) return
      const dx = end[0] - start[0]
      const dy = end[1] - start[1]
      const len = Math.hypot(dx, dy)
      if (len === 0) return
      const nx = (dy / len) * seamAllowance
      const ny = (-dx / len) * seamAllowance
      const s2 = [start[0] + nx, start[1] + ny]
      const e2 = [end[0] + nx, end[1] + ny]
      line(group, m, start, s2, "#1a1a2e")
      line(group, m, end, e2, "#1a1a2e")
      line(group, m, s2, e2, "#1a1a2e")
    }

    const parts = 4
    const over = false

    const sideW = (group: SVGGElement, m: Matrix) => {
      const frontOffset = (backOW - frontOW) / 2
      const X = -backOW / 2
      const Y = -length / 2

      const foldIN = X + (backOW - backIW) / 2
      const foldOUT = X
      let t = 0
      let t2 = 0

      line(group, m, [X, Y], [X + frontOffset, Y + length], "#1a1a2e")
      if (parts === 4 && !over) {
        line(group, m, [X + backOW, Y], [X + backOW - frontOffset, Y + length], "#1a1a2e")
        for (let i = 1; i < folds; i++) {
          if (i % 2 === 0) {
            t = backIW !== frontIW ? taper(backIW, frontIW, length, i * fold) : 0
            line(
              group,
              m,
              [foldIN + backIW - t, Y + i * fold],
              [foldIN + backIW - t + (backOW - backIW) / 2, Y + i * fold],
              "#1a1a2e"
            )
          }
        }
      }
      line(group, m, [X, Y], [X + backOW, Y], "#1a1a2e")
      line(group, m, [X + frontOffset, Y + length], [X + frontOW + frontOffset, Y + length], "#1a1a2e")

      for (let i = 1; i < folds; i++) {
        if (i % 2 === 0) {
          t = backIW !== frontIW ? taper(backIW, frontIW, length, i * fold) : 0
          line(group, m, [foldIN + t, Y + i * fold], [foldIN + backIW - t, Y + i * fold], "#2563eb", "4,4")
        } else {
          t = backOW !== frontOW ? taper(backOW, frontOW, length, i * fold) : 0
          line(group, m, [foldOUT + t, Y + i * fold], [foldOUT + backOW - t, Y + i * fold], "#e11d48", "4,4")
        }
      }

      for (let i = 0; i < folds; i++) {
        if (i % 2 === 0) {
          if (backIW !== frontIW) {
            t = taper(backIW, frontIW, length, i * fold)
            t2 = taper(backIW, frontIW, length, (i + 1) * fold)
          } else {
            t = 0
            t2 = 0
          }
          line(group, m, [foldIN + t, Y + i * fold], [foldIN - (backOW - backIW) / 2 + t2, Y + (i + 1) * fold], "#1a1a2e")
        } else {
          if (backIW !== frontIW) {
            t = taper(backIW, frontIW, length, i * fold)
            t2 = taper(backIW, frontIW, length, (i + 1) * fold)
          } else {
            t = 0
            t2 = 0
          }
          line(group, m, [foldOUT + t, Y + i * fold], [foldIN + t2, Y + (i + 1) * fold], "#1a1a2e")
        }
      }

      for (let i = 0; i < folds; i++) {
        if (i % 2 === 0) {
          if (backIW !== frontIW) {
            t = taper(backIW, frontIW, length, i * fold)
            t2 = taper(backIW, frontIW, length, (i + 1) * fold)
          } else {
            t = 0
            t2 = 0
          }
          line(group, m, [foldIN + backIW - t, Y + i * fold], [foldOUT + backOW - t2, Y + (i + 1) * fold], "#2563eb", "4,4")
        } else {
          if (backIW !== frontIW) {
            t = taper(backIW, frontIW, length, i * fold)
            t2 = taper(backIW, frontIW, length, (i + 1) * fold)
          } else {
            t = 0
            t2 = 0
          }
          line(group, m, [foldOUT + backOW - t, Y + i * fold], [foldIN + backIW - t2, Y + (i + 1) * fold], "#2563eb", "4,4")
        }
      }
    }

    const seamEdgeW = () => {
      const frontOffset = (backOW - frontOW) / 2
      const X = -backOW / 2
      const Y = -length / 2
      return {
        start: [X, Y],
        end: [X + frontOffset, Y + length],
      }
    }

    const sideH = (group: SVGGElement, m: Matrix) => {
      const frontOffset = (backOH - frontOH) / 2
      const X = -backOH / 2
      const Y = -length / 2

      const foldIN = X + (backOH - backIH) / 2
      const foldOUT = X
      let t = 0
      let t2 = 0

      if (parts === 4) {
        line(group, m, [X, Y], [X + frontOffset, Y + length], "#1a1a2e")
      }
      if (!over) {
        line(group, m, [X + backOH, Y], [X + backOH - frontOffset, Y + length], "#1a1a2e")
        for (let i = 1; i < folds; i++) {
          if (i % 2 !== 0) {
            t = backIH !== frontIH ? taper(backIH, frontIH, length, i * fold) : 0
            line(
              group,
              m,
              [foldIN + backIH - t, Y + i * fold],
              [foldIN + backIH - t + (backOH - backIH) / 2, Y + i * fold],
              "#1a1a2e"
            )
          }
        }
      }
      line(group, m, [X, Y], [X + backOH, Y], "#1a1a2e")
      line(group, m, [X + frontOffset, Y + length], [X + frontOH + frontOffset, Y + length], "#1a1a2e")

      for (let i = 1; i < folds; i++) {
        if (i % 2 !== 0) {
          t = backIH !== frontIH ? taper(backIH, frontIH, length, i * fold) : 0
          line(group, m, [foldIN + t, Y + i * fold], [foldIN + backIH - t, Y + i * fold], "#2563eb", "4,4")
        } else {
          t = backOH !== frontOH ? taper(backOH, frontOH, length, i * fold) : 0
          line(group, m, [foldOUT + t, Y + i * fold], [foldOUT + backOH - t, Y + i * fold], "#e11d48", "4,4")
        }
      }

      for (let i = 0; i < folds; i++) {
        if (i % 2 !== 0) {
          if (backIH !== frontIH) {
            t = taper(backIH, frontIH, length, i * fold)
            t2 = taper(backIH, frontIH, length, (i + 1) * fold)
          } else {
            t = 0
            t2 = 0
          }
          line(group, m, [foldIN + t, Y + i * fold], [foldIN - (backOH - backIH) / 2 + t2, Y + (i + 1) * fold], "#1a1a2e")
        } else {
          if (backIH !== frontIH) {
            t = taper(backIH, frontIH, length, i * fold)
            t2 = taper(backIH, frontIH, length, (i + 1) * fold)
          } else {
            t = 0
            t2 = 0
          }
          line(group, m, [foldOUT + t, Y + i * fold], [foldIN + t2, Y + (i + 1) * fold], "#1a1a2e")
        }
      }

      for (let i = 0; i < folds; i++) {
        if (i % 2 !== 0) {
          if (backIH !== frontIH) {
            t = taper(backIH, frontIH, length, i * fold)
            t2 = taper(backIH, frontIH, length, (i + 1) * fold)
          } else {
            t = 0
            t2 = 0
          }
          line(group, m, [foldIN + backIH - t, Y + i * fold], [foldOUT + backOH - t2, Y + (i + 1) * fold], "#2563eb", "4,4")
        } else {
          if (backIH !== frontIH) {
            t = taper(backIH, frontIH, length, i * fold)
            t2 = taper(backIH, frontIH, length, (i + 1) * fold)
          } else {
            t = 0
            t2 = 0
          }
          line(group, m, [foldOUT + backOH - t, Y + i * fold], [foldIN + backIH - t2, Y + (i + 1) * fold], "#2563eb", "4,4")
        }
      }
    }

    const drawGroup = (matrix: Matrix, drawFn: (group: SVGGElement, m: Matrix) => void) => {
      const group = createSVGElement("g", { transform: matrixToString(matrix) })
      drawFn(group, matrix)
      svg.appendChild(group)
    }

    const drawArrow = (group: SVGGElement, from: number[], to: number[], color: string) => {
      const dx = to[0] - from[0]
      const dy = to[1] - from[1]
      const len = Math.hypot(dx, dy)
      if (len === 0) return
      const ux = dx / len
      const uy = dy / len
      const size = 4
      const left = [to[0] - ux * size - uy * size * 0.6, to[1] - uy * size + ux * size * 0.6]
      const right = [to[0] - ux * size + uy * size * 0.6, to[1] - uy * size - ux * size * 0.6]
      const arrow = createSVGElement("polyline", {
        points: `${left[0]},${left[1]} ${to[0]},${to[1]} ${right[0]},${right[1]}`,
        fill: "none",
        stroke: color,
        "stroke-width": 1,
      })
      group.appendChild(arrow)
    }

    const drawDimension = (
      group: SVGGElement,
      start: number[],
      end: number[],
      label: string,
      color: string
    ) => {
      const lineElem = createSVGElement("line", {
        x1: start[0],
        y1: start[1],
        x2: end[0],
        y2: end[1],
        stroke: color,
        "stroke-width": 1,
      })
      group.appendChild(lineElem)
      drawArrow(group, end, start, color)
      drawArrow(group, start, end, color)
      const midX = (start[0] + end[0]) / 2
      const midY = (start[1] + end[1]) / 2
      const text = createSVGElement("text", {
        x: midX,
        y: midY - 2,
        fill: color,
        "font-size": 10,
        "text-anchor": "middle",
      })
      text.textContent = label
      group.appendChild(text)
    }

    const gap = 10
    const startX = 20
    const startY = 20
    const faceRow = [
      { width: backOW, draw: sideW },
      { width: backOH, draw: sideH },
      { width: backOW, draw: sideW },
      { width: backOH, draw: sideH },
    ]

    let cursorX = startX
    const cursorY = startY

    faceRow.forEach((face, index) => {
      const extra = params.useFiveFaces && index === 0 ? seamAllowance : 0
      const m = translateMatrix(identityMatrix(), cursorX + face.width / 2 + extra, cursorY + length / 2)
      drawGroup(m, face.draw)
      if (params.useFiveFaces && index === 0) {
        const seamEdge = seamEdgeW()
        drawGroup(m, (group, matrix) => drawSeamFlap(group, matrix, seamEdge.start, seamEdge.end))
      }
      cursorX += face.width + gap + extra
    })

    if (params.showAnnotations) {
      const annGroup = createSVGElement("g", {
        fill: "none",
        stroke: "#22c55e",
        "stroke-width": 1,
        "stroke-dasharray": "4,4",
      })
      const pageRect = createSVGElement("rect", {
        x: 0,
        y: 0,
        width: page.width,
        height: page.height,
      })
      annGroup.appendChild(pageRect)
      svg.appendChild(annGroup)
    }

    const margin = 10
    const annotationPad = params.showAnnotations ? 30 : 0
    const minX = Math.min(bounds.minX - margin - annotationPad, 0 - annotationPad)
    const minY = Math.min(bounds.minY - margin - annotationPad, 0 - annotationPad)
    const maxX = Math.max(bounds.maxX + margin + annotationPad, page.width + annotationPad)
    const maxY = Math.max(bounds.maxY + margin + annotationPad, page.height + annotationPad)
    const viewWidth = maxX - minX
    const viewHeight = maxY - minY

    const newViewBox = { x: minX, y: minY, width: viewWidth, height: viewHeight }
    svg.setAttribute("viewBox", `${minX} ${minY} ${viewWidth} ${viewHeight}`)
    setViewBox(newViewBox)
    onViewBoxChange?.(newViewBox)

    if (params.showAnnotations) {
      const dimGroup = createSVGElement("g", {
        fill: "none",
        stroke: "#22c55e",
        "stroke-width": 1,
      })
      const topY = minY + 12
      const rightX = maxX - 12
      drawDimension(dimGroup, [minX + 20, topY], [maxX - 20, topY], "ページ幅", "#22c55e")
      drawDimension(dimGroup, [rightX, minY + 20], [rightX, maxY - 20], "ページ高", "#22c55e")

      const label = createSVGElement("text", {
        x: (minX + maxX) / 2,
        y: minY + 28,
        fill: "#22c55e",
        "font-size": 11,
        "text-anchor": "middle",
      })
      label.textContent = `段数: ${folds} / 段高: ${fold.toFixed(1)}mm`
      dimGroup.appendChild(label)

      const seamLabel = createSVGElement("text", {
        x: minX + 20,
        y: maxY - 12,
        fill: "#22c55e",
        "font-size": 10,
        "text-anchor": "start",
      })
      seamLabel.textContent = `のりしろ: ${seamAllowance.toFixed(1)}mm`
      dimGroup.appendChild(seamLabel)

      svg.appendChild(dimGroup)
    }

    const dims = `前内寸: ${frontIW.toFixed(1)}×${frontIH.toFixed(1)}mm | 後内寸: ${backIW.toFixed(1)}×${backIH.toFixed(1)}mm | 折幅: ${fold.toFixed(1)}mm | 段数: ${folds} | 全長: ${length.toFixed(1)}mm | のりしろ: ${seamAllowance.toFixed(1)}mm`
    onDimensionsChange?.(dims)
  }, [params, onViewBoxChange, onDimensionsChange])

  const drawStandardBellows = useCallback((svg: SVGSVGElement) => {
    const { frontWidth, frontHeight, rearWidth, rearHeight, folds, foldDepth, showAnnotations, pageSize } = params
    const page = PAGE_SIZES[pageSize]
    const margin = 30

    const widthStep = (rearWidth - frontWidth) / folds
    const heightStep = (rearHeight - frontHeight) / folds

    const points: { x: number; y: number; w: number; h: number; type: string }[] = []
    let currentX = margin

    for (let i = 0; i <= folds; i++) {
      const w = frontWidth + widthStep * i
      const h = frontHeight + heightStep * i
      points.push({ x: currentX, y: margin, w, h, type: i % 2 === 0 ? "谷" : "山" })
      currentX += foldDepth
    }

    const maxHeight = Math.max(frontHeight, rearHeight)
    const totalWidth = foldDepth * folds

    // Draw main path
    let pathData = `M ${points[0].x} ${points[0].y}`
    for (const point of points) {
      pathData += ` L ${point.x} ${point.y}`
    }
    for (let i = points.length - 1; i >= 0; i--) {
      pathData += ` L ${points[i].x} ${points[i].y + points[i].h}`
    }
    pathData += " Z"

    const path = document.createElementNS("http://www.w3.org/2000/svg", "path")
    path.setAttribute("d", pathData)
    path.setAttribute("fill", "none")
    path.setAttribute("stroke", "#1a1a2e")
    path.setAttribute("stroke-width", "2")
    svg.appendChild(path)

    // Draw fold lines
    for (const point of points) {
      const line = document.createElementNS("http://www.w3.org/2000/svg", "line")
      line.setAttribute("x1", String(point.x))
      line.setAttribute("y1", String(point.y))
      line.setAttribute("x2", String(point.x))
      line.setAttribute("y2", String(point.y + point.h))
      if (point.type === "山") {
        line.setAttribute("stroke", "#e11d48")
        line.setAttribute("stroke-dasharray", "6,4")
      } else {
        line.setAttribute("stroke", "#2563eb")
        line.setAttribute("stroke-dasharray", "2,3")
      }
      line.setAttribute("stroke-width", "1")
      svg.appendChild(line)

      const label = document.createElementNS("http://www.w3.org/2000/svg", "text")
      label.setAttribute("x", String(point.x))
      label.setAttribute("y", String(point.y - 5))
      label.setAttribute("font-size", "10")
      label.setAttribute("fill", "#64748b")
      label.setAttribute("text-anchor", "middle")
      label.textContent = point.type
      svg.appendChild(label)
    }

    // Dimension lines
    const dimGroup = document.createElementNS("http://www.w3.org/2000/svg", "g")
    dimGroup.setAttribute("fill", "#64748b")
    dimGroup.setAttribute("stroke", "#64748b")
    dimGroup.setAttribute("stroke-width", "1")
    svg.appendChild(dimGroup)

    // Width dimension
    const wY = margin - 12
    const wLine = document.createElementNS("http://www.w3.org/2000/svg", "line")
    wLine.setAttribute("x1", String(margin))
    wLine.setAttribute("y1", String(wY))
    wLine.setAttribute("x2", String(margin + totalWidth))
    wLine.setAttribute("y2", String(wY))
    dimGroup.appendChild(wLine)

    const wText = document.createElementNS("http://www.w3.org/2000/svg", "text")
    wText.setAttribute("x", String(margin + totalWidth / 2))
    wText.setAttribute("y", String(wY - 6))
    wText.setAttribute("font-size", "10")
    wText.setAttribute("text-anchor", "middle")
    wText.textContent = `幅: ${totalWidth.toFixed(1)} mm`
    dimGroup.appendChild(wText)

    // Height dimension
    const hX = margin - 12
    const hLine = document.createElementNS("http://www.w3.org/2000/svg", "line")
    hLine.setAttribute("x1", String(hX))
    hLine.setAttribute("y1", String(margin))
    hLine.setAttribute("x2", String(hX))
    hLine.setAttribute("y2", String(margin + maxHeight))
    dimGroup.appendChild(hLine)

    const hText = document.createElementNS("http://www.w3.org/2000/svg", "text")
    hText.setAttribute("x", String(hX - 6))
    hText.setAttribute("y", String(margin + maxHeight / 2))
    hText.setAttribute("font-size", "10")
    hText.setAttribute("text-anchor", "middle")
    hText.setAttribute("dominant-baseline", "middle")
    hText.setAttribute("transform", `rotate(-90 ${hX - 6} ${margin + maxHeight / 2})`)
    hText.textContent = `高さ: ${maxHeight.toFixed(1)} mm`
    dimGroup.appendChild(hText)

    // Page boundary (if annotations enabled)
    if (showAnnotations) {
      const annGroup = document.createElementNS("http://www.w3.org/2000/svg", "g")
      annGroup.setAttribute("fill", "#22c55e")
      annGroup.setAttribute("stroke", "#22c55e")
      annGroup.setAttribute("stroke-width", "1")
      annGroup.setAttribute("stroke-dasharray", "4,4")
      svg.appendChild(annGroup)

      const pageRect = document.createElementNS("http://www.w3.org/2000/svg", "rect")
      pageRect.setAttribute("x", "0")
      pageRect.setAttribute("y", "0")
      pageRect.setAttribute("width", String(page.width))
      pageRect.setAttribute("height", String(page.height))
      pageRect.setAttribute("fill", "none")
      annGroup.appendChild(pageRect)

      const pageLabel = document.createElementNS("http://www.w3.org/2000/svg", "text")
      pageLabel.setAttribute("x", String(page.width - 5))
      pageLabel.setAttribute("y", "15")
      pageLabel.setAttribute("font-size", "10")
      pageLabel.setAttribute("text-anchor", "end")
      pageLabel.setAttribute("stroke", "none")
      pageLabel.textContent = `${page.label} (${page.width}×${page.height}mm)`
      annGroup.appendChild(pageLabel)
    }

    const boundsWidth = margin * 2 + totalWidth + 20
    const boundsHeight = margin * 2 + maxHeight + 20
    const viewWidth = Math.max(boundsWidth, page.width) + (showAnnotations ? 30 : 0)
    const viewHeight = Math.max(boundsHeight, page.height) + (showAnnotations ? 30 : 0)

    const newViewBox = { x: 0, y: 0, width: viewWidth, height: viewHeight }
    svg.setAttribute("viewBox", `0 0 ${viewWidth} ${viewHeight}`)
    setViewBox(newViewBox)
    onViewBoxChange?.(newViewBox)

    const dims = `前枠: ${frontWidth.toFixed(1)}×${frontHeight.toFixed(1)}mm | 後枠: ${rearWidth.toFixed(1)}×${rearHeight.toFixed(1)}mm | 段数: ${folds} | 深さ: ${foldDepth.toFixed(1)}mm | 全長: ${(foldDepth * folds).toFixed(1)}mm`
    onDimensionsChange?.(dims)
  }, [params, onViewBoxChange, onDimensionsChange])

  useEffect(() => {
    const svg = svgRef.current
    if (!svg) return

    svg.innerHTML = ""

    if (params.useGeneratorMode) {
      drawGeneratorBellows(svg)
    } else if (params.useBdMode) {
      drawBellowsDesigner(svg)
    } else {
      drawStandardBellows(svg)
    }
  }, [params, drawBellowsDesigner, drawGeneratorBellows, drawStandardBellows])

  // Pan handlers
  const handleMouseDown = (e: React.MouseEvent) => {
    if (e.button === 0) {
      setIsPanning(true)
      setStartPan({ x: e.clientX, y: e.clientY })
    }
  }

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isPanning || !svgRef.current) return
    const svg = svgRef.current
    const rect = svg.getBoundingClientRect()
    const dx = ((e.clientX - startPan.x) / rect.width) * viewBox.width * zoom
    const dy = ((e.clientY - startPan.y) / rect.height) * viewBox.height * zoom
    setViewBox((prev) => ({
      ...prev,
      x: prev.x - dx,
      y: prev.y - dy,
    }))
    setStartPan({ x: e.clientX, y: e.clientY })
  }

  const handleMouseUp = () => {
    setIsPanning(false)
  }

  const handleWheel = (e: React.WheelEvent) => {
    e.preventDefault()
    const delta = e.deltaY > 0 ? 1.1 : 0.9
    setZoom((prev) => Math.min(Math.max(prev * delta, 0.1), 5))
  }

  return (
    <div className="relative w-full h-full overflow-hidden rounded-xl border border-border bg-[var(--svg-background)]">
      <svg
        ref={svgRef}
        className="w-full h-full cursor-grab active:cursor-grabbing"
        viewBox={`${viewBox.x} ${viewBox.y} ${viewBox.width * zoom} ${viewBox.height * zoom}`}
        preserveAspectRatio="xMidYMid meet"
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp}
        onWheel={handleWheel}
      />
      <div className="absolute bottom-3 right-3 flex items-center gap-2 bg-card/80 backdrop-blur-sm rounded-lg px-3 py-1.5 border border-border">
        <button
          onClick={() => setZoom((z) => Math.max(z * 0.8, 0.1))}
          className="text-muted-foreground hover:text-foreground transition-colors px-1"
          type="button"
        >
          -
        </button>
        <span className="text-xs text-muted-foreground min-w-[3rem] text-center">{Math.round(100 / zoom)}%</span>
        <button
          onClick={() => setZoom((z) => Math.min(z * 1.25, 5))}
          className="text-muted-foreground hover:text-foreground transition-colors px-1"
          type="button"
        >
          +
        </button>
        <button
          onClick={() => setZoom(1)}
          className="text-xs text-muted-foreground hover:text-foreground transition-colors ml-2"
          type="button"
        >
          Reset
        </button>
      </div>
    </div>
  )
}

export function getSvgContent(svgElement: SVGSVGElement | null, viewBox: ViewBox): string | null {
  if (!svgElement) return null
  const exportSvg = svgElement.cloneNode(true) as SVGSVGElement
  exportSvg.setAttribute("xmlns", "http://www.w3.org/2000/svg")
  exportSvg.setAttribute("width", `${viewBox.width}mm`)
  exportSvg.setAttribute("height", `${viewBox.height}mm`)
  exportSvg.setAttribute("viewBox", `0 0 ${viewBox.width} ${viewBox.height}`)
  return new XMLSerializer().serializeToString(exportSvg)
}
