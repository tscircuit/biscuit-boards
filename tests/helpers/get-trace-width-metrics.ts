type WirePoint = {
  route_type: "wire"
  x: number
  y: number
  width: number
  layer: string
}

type RoutePoint = WirePoint | { route_type: string }

export const getTraceWidthMetrics = (
  traces: Array<{ route: RoutePoint[] }>,
  nominalWidth: number,
) => {
  let totalLength = 0
  let nominalLength = 0
  let widthLength = 0
  for (const trace of traces) {
    for (let index = 0; index < trace.route.length - 1; index++) {
      const start = trace.route[index]
      const end = trace.route[index + 1]
      if (
        start?.route_type !== "wire" ||
        end?.route_type !== "wire" ||
        !("layer" in start) ||
        !("layer" in end) ||
        start.layer !== end.layer
      ) {
        continue
      }
      const length = Math.hypot(end.x - start.x, end.y - start.y)
      totalLength += length
      widthLength += length * start.width
      if (start.width >= nominalWidth - 1e-6) nominalLength += length
    }
  }
  return {
    nominalCoverage: totalLength === 0 ? 1 : nominalLength / totalLength,
    averageWidth: totalLength === 0 ? nominalWidth : widthLength / totalLength,
  }
}
