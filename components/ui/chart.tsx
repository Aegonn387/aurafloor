"use client"

import * as React from "react"
import {
  Bar,
  BarChart,
  Line,
  LineChart,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts"

export type ChartConfig = Record<
  string,
  {
    label?: string
    color?: string
  }
>

/**
 * ✅ FIX: This function was missing and caused the build to fail
 */
function getPayloadConfigFromPayload(
  config: ChartConfig,
  payloadItem: any,
  key: string
) {
  if (!payloadItem) return undefined

  return (
    config[payloadItem.dataKey as keyof ChartConfig] ||
    config[key as keyof ChartConfig] ||
    undefined
  )
}

export function ChartContainer({
  children,
  className,
}: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div className={className}>
      <ResponsiveContainer width="100%" height={300}>
        {children as React.ReactElement}
      </ResponsiveContainer>
    </div>
  )
}

export function ChartTooltip({
  active,
  payload,
  label,
  config,
  labelKey,
}: {
  active?: boolean
  payload?: any[]
  label?: string
  config: ChartConfig
  labelKey?: string
}) {
  if (!active || !payload || payload.length === 0) return null

  const [item] = payload
  const key = `${labelKey || item?.dataKey || item?.name || "value"}`
  const itemConfig = getPayloadConfigFromPayload(config, item, key)

  const value =
    !labelKey && typeof label === "string"
      ? config[label as keyof typeof config]?.label || label
      : itemConfig?.label || key

  return (
    <div className="rounded-lg border bg-background p-2 text-xs shadow">
      <div className="font-medium">{value}</div>
      <div className="text-muted-foreground">
        {item?.value}
      </div>
    </div>
  )
}

export {
  Bar,
  BarChart,
  Line,
  LineChart,
  Pie,
  PieChart,
  Tooltip,
  XAxis,
  YAxis,
}
