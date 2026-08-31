import { useMemo, useRef, useState } from "react";
import { PanResponder, Text, View } from "react-native";
import Svg, { Circle, Defs, LinearGradient, Line, Path, Stop } from "react-native-svg";

export type ChartSeries = {
  code: string;
  color: string;
  points: { x: number; y: number }[];
};

const CHART_HEIGHT = 220;
const Y_TICKS = 4;
const TOOLTIP_WIDTH = 150;

function buildLinePath(points: { x: number; y: number }[]): string {
  return points.map((p, i) => `${i === 0 ? "M" : "L"} ${p.x} ${p.y}`).join(" ");
}

function buildAreaPath(points: { x: number; y: number }[], baseline: number): string {
  if (points.length === 0) return "";
  const first = points[0];
  const last = points[points.length - 1];
  return `${buildLinePath(points)} L ${last.x} ${baseline} L ${first.x} ${baseline} Z`;
}

function formatTick(value: number): string {
  return value.toLocaleString("es-VE", { maximumFractionDigits: 0 });
}

function formatTooltipDate(timestamp: number): string {
  const label = new Date(timestamp).toLocaleDateString("es-VE", {
    weekday: "short",
    day: "numeric",
    month: "short",
  });
  return label.charAt(0).toUpperCase() + label.slice(1);
}

/**
 * Pure-view/SVG line chart (single-series area fill, multi-series overlay), no
 * chart library. `activeX` draws a crosshair + tooltip at that data point —
 * driven either by dragging on the chart itself or by the parent selecting a
 * row elsewhere (e.g. the history list), so the two stay in sync.
 */
export function RateLineChart({
  series,
  activeX,
  onScrub,
}: {
  series: ChartSeries[];
  activeX?: number | null;
  onScrub?: (x: number) => void;
}) {
  const [width, setWidth] = useState(0);
  const allPoints = series.flatMap((s) => s.points);

  const sortedXs = useMemo(
    () => Array.from(new Set(allPoints.map((p) => p.x))).sort((a, b) => a - b),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [series]
  );

  const minX = sortedXs[0] ?? 0;
  const maxX = sortedXs[sortedXs.length - 1] ?? 0;
  const rangeX = maxX - minX || 1;

  const toPxX = (x: number) => ((x - minX) / rangeX) * width;

  const widthRef = useRef(width);
  widthRef.current = width;
  const sortedXsRef = useRef(sortedXs);
  sortedXsRef.current = sortedXs;

  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onMoveShouldSetPanResponder: () => true,
      onPanResponderGrant: (evt) => handleTouch(evt.nativeEvent.locationX),
      onPanResponderMove: (evt) => handleTouch(evt.nativeEvent.locationX),
    })
  ).current;

  function handleTouch(localX: number) {
    const xs = sortedXsRef.current;
    const w = widthRef.current;
    if (xs.length === 0 || w === 0 || !onScrub) return;
    let nearest = xs[0];
    let bestDist = Infinity;
    for (const x of xs) {
      const px = ((x - xs[0]) / (xs[xs.length - 1] - xs[0] || 1)) * w;
      const dist = Math.abs(px - localX);
      if (dist < bestDist) {
        bestDist = dist;
        nearest = x;
      }
    }
    onScrub(nearest);
  }

  if (allPoints.length < 2) {
    return (
      <View
        style={{ height: CHART_HEIGHT }}
        className="items-center justify-center rounded-2xl bg-white/5"
      >
        <Text className="text-white/40">No hay suficientes datos para graficar.</Text>
      </View>
    );
  }

  const rawMinY = Math.min(...allPoints.map((p) => p.y));
  const rawMaxY = Math.max(...allPoints.map((p) => p.y));
  const padY = (rawMaxY - rawMinY || rawMaxY * 0.05 || 1) * 0.15;
  const minY = rawMinY - padY;
  const maxY = rawMaxY + padY;
  const rangeY = maxY - minY || 1;

  const toPx = (p: { x: number; y: number }) => ({
    x: toPxX(p.x),
    y: CHART_HEIGHT - ((p.y - minY) / rangeY) * CHART_HEIGHT,
  });

  const pixelSeries = series.map((s) => ({ ...s, pixels: s.points.map(toPx) }));
  const isSingleSeries = series.length === 1;

  const activeXInRange =
    activeX !== null && activeX !== undefined && sortedXs.includes(activeX) ? activeX : null;
  const activePxX = activeXInRange !== null ? toPxX(activeXInRange) : null;
  const activePoints =
    activeXInRange !== null
      ? series
          .map((s) => {
            const point = s.points.find((p) => p.x === activeXInRange);
            return point ? { code: s.code, color: s.color, value: point.y } : null;
          })
          .filter((p): p is { code: string; color: string; value: number } => p !== null)
      : [];

  const tooltipLeft =
    activePxX !== null
      ? Math.min(Math.max(activePxX - TOOLTIP_WIDTH / 2, 0), Math.max(width - TOOLTIP_WIDTH, 0))
      : 0;

  return (
    <View
      onLayout={(e) => setWidth(e.nativeEvent.layout.width)}
      style={{ height: CHART_HEIGHT }}
      {...panResponder.panHandlers}
    >
      {width > 0 && (
        <>
          <Svg width={width} height={CHART_HEIGHT}>
            <Defs>
              {pixelSeries.map((s) => (
                <LinearGradient key={s.code} id={`fill-${s.code}`} x1="0" y1="0" x2="0" y2="1">
                  <Stop offset="0" stopColor={s.color} stopOpacity={0.35} />
                  <Stop offset="1" stopColor={s.color} stopOpacity={0} />
                </LinearGradient>
              ))}
            </Defs>

            {Array.from({ length: Y_TICKS + 1 }).map((_, i) => {
              const y = (CHART_HEIGHT / Y_TICKS) * i;
              return (
                <Line
                  key={i}
                  x1={0}
                  x2={width}
                  y1={y}
                  y2={y}
                  stroke="rgba(255,255,255,0.08)"
                  strokeWidth={1}
                />
              );
            })}

            {pixelSeries.map((s) => (
              <Path
                key={`area-${s.code}`}
                d={buildAreaPath(s.pixels, CHART_HEIGHT)}
                fill={isSingleSeries ? `url(#fill-${s.code})` : "transparent"}
              />
            ))}
            {pixelSeries.map((s) => (
              <Path
                key={`line-${s.code}`}
                d={buildLinePath(s.pixels)}
                fill="none"
                stroke={s.color}
                strokeWidth={2.5}
                strokeLinejoin="round"
                strokeLinecap="round"
              />
            ))}
            {pixelSeries.map((s) => {
              const last = s.pixels[s.pixels.length - 1];
              return <Circle key={`dot-${s.code}`} cx={last.x} cy={last.y} r={4} fill={s.color} />;
            })}

            {activePxX !== null && (
              <Line
                x1={activePxX}
                x2={activePxX}
                y1={0}
                y2={CHART_HEIGHT}
                stroke="rgba(255,255,255,0.4)"
                strokeWidth={1}
                strokeDasharray="4,4"
              />
            )}
            {activePoints.map((p) => {
              const px = pixelSeries.find((s) => s.code === p.code);
              const pixel = px?.pixels.find((_, i) => px.points[i].x === activeXInRange);
              if (!pixel) return null;
              return (
                <Circle
                  key={`active-${p.code}`}
                  cx={pixel.x}
                  cy={pixel.y}
                  r={5.5}
                  fill={p.color}
                  stroke="#000"
                  strokeWidth={1.5}
                />
              );
            })}
          </Svg>

          {Array.from({ length: Y_TICKS + 1 }).map((_, i) => {
            const y = (CHART_HEIGHT / Y_TICKS) * i;
            const value = maxY - (rangeY / Y_TICKS) * i;
            return (
              <Text
                key={i}
                className="text-white/40"
                style={{ position: "absolute", left: 6, top: y - 14, fontSize: 10 }}
              >
                {formatTick(value)}
              </Text>
            );
          })}

          {activePoints.length > 0 && (
            <View
              pointerEvents="none"
              style={{
                position: "absolute",
                left: tooltipLeft,
                top: 4,
                width: TOOLTIP_WIDTH,
              }}
              className="rounded-lg bg-neutral-900 px-2 py-1.5"
            >
              <Text className="mb-0.5 text-[10px] text-white/50">
                {formatTooltipDate(activeXInRange as number)}
              </Text>
              {activePoints.map((p) => (
                <View key={p.code} className="flex-row items-center gap-1.5">
                  <View className="h-1.5 w-1.5 rounded-full" style={{ backgroundColor: p.color }} />
                  <Text className="text-xs font-bold text-white">Bs {formatTick(p.value)}</Text>
                </View>
              ))}
            </View>
          )}
        </>
      )}
    </View>
  );
}
