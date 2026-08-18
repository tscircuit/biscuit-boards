import type { PcbBoard, Point } from "circuit-json"
import { getBoardOutline } from "./add-full-copper-pours"

interface Bounds {
  maxX: number
  maxY: number
  minX: number
  minY: number
}

const getBounds = (points: Point[]): Bounds => ({
  maxX: Math.max(...points.map((point) => point.x)),
  maxY: Math.max(...points.map((point) => point.y)),
  minX: Math.min(...points.map((point) => point.x)),
  minY: Math.min(...points.map((point) => point.y)),
})

const getPolygonArea = (points: Point[]) => {
  let twiceArea = 0
  for (let index = 0; index < points.length; index++) {
    const point = points[index]!
    const nextPoint = points[(index + 1) % points.length]!
    twiceArea += point.x * nextPoint.y - nextPoint.x * point.y
  }
  return Math.abs(twiceArea) / 2
}

const parseGerberRegions = (gerber: string): Point[][] => {
  const formatMatch = gerber.match(/%FSLAX\d(\d)Y\d(\d)\*%/)
  if (!formatMatch) throw new Error("Gerber coordinate format is missing")
  const xScale = 10 ** Number(formatMatch[1])
  const yScale = 10 ** Number(formatMatch[2])
  const regions: Point[][] = []
  let currentRegion: Point[] | undefined

  for (const rawLine of gerber.split(/\r?\n/)) {
    const line = rawLine.trim()
    if (line === "G36*") {
      currentRegion = []
      continue
    }
    if (line === "G37*") {
      if (currentRegion && currentRegion.length >= 3) {
        regions.push(currentRegion)
      }
      currentRegion = undefined
      continue
    }
    if (!currentRegion) continue

    const coordinateMatch = line.match(/^X(-?\d+)Y(-?\d+)D0[12]\*$/)
    if (!coordinateMatch) continue
    currentRegion.push({
      x: Number(coordinateMatch[1]) / xScale,
      y: Number(coordinateMatch[2]) / yScale,
    })
  }

  return regions
}

const valuesAreClose = (actual: number, expected: number, tolerance: number) =>
  Math.abs(actual - expected) <= tolerance

const boundsMatch = (actual: Bounds, expected: Bounds) => {
  const tolerance = 0.000_01
  return (
    valuesAreClose(actual.minX, expected.minX, tolerance) &&
    valuesAreClose(actual.maxX, expected.maxX, tolerance) &&
    valuesAreClose(actual.minY, expected.minY, tolerance) &&
    valuesAreClose(actual.maxY, expected.maxY, tolerance)
  )
}

export const getBoardsMissingFullCopperRegions = (
  gerber: string,
  pcbBoards: PcbBoard[],
) => {
  const regions = parseGerberRegions(gerber)

  return pcbBoards.filter((pcbBoard) => {
    const boardOutline = getBoardOutline(pcbBoard)
    const expectedBounds = getBounds(boardOutline)
    const expectedArea = getPolygonArea(boardOutline)
    const areaTolerance = Math.max(0.000_1, expectedArea * 0.000_001)

    return !regions.some(
      (region) =>
        boundsMatch(getBounds(region), expectedBounds) &&
        valuesAreClose(getPolygonArea(region), expectedArea, areaTolerance),
    )
  })
}
