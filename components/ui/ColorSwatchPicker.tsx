import { Pressable, ScrollView, View } from 'react-native'

export const ACCOUNT_COLOR_SWATCHES = [
  // Neutrals
  '#f5f5f5',
  '#d4d4d4',
  '#9ca3af',
  '#78716c',
  '#57534e',
  '#44403c',
  '#374151',
  '#27272a',
  '#1f2937',
  '#18181b',
  // Reds
  '#fca5a5',
  '#ef4444',
  '#dc2626',
  '#b91c1c',
  '#991b1b',
  '#7f1d1d',
  // Oranges & ambers
  '#fdba74',
  '#fb923c',
  '#f97316',
  '#ea580c',
  '#c2410c',
  '#9a3412',
  '#fde047',
  '#eab308',
  '#ca8a04',
  '#a16207',
  '#713f12',
  '#422006',
  // Greens & limes
  '#bef264',
  '#84cc16',
  '#65a30d',
  '#22c55e',
  '#16a34a',
  '#15803d',
  '#166534',
  '#14532d',
  // Teal & cyan
  '#6ee7b7',
  '#10b981',
  '#059669',
  '#047857',
  '#134e4a',
  '#67e8f9',
  '#06b6d4',
  '#0891b2',
  '#0e7490',
  '#164e63',
  // Blues & sky
  '#93c5fd',
  '#38bdf8',
  '#0ea5e9',
  '#3b82f6',
  '#2563eb',
  '#1d4ed8',
  '#1e40af',
  '#1e3a8a',
  // Indigo, violet & purple
  '#818cf8',
  '#6366f1',
  '#4f46e5',
  '#4338ca',
  '#a78bfa',
  '#8b5cf6',
  '#7c3aed',
  '#6d28d9',
  '#581c87',
  // Pink, rose & fuchsia
  '#f9a8d4',
  '#ec4899',
  '#db2777',
  '#be185d',
  '#831843',
  '#fb7185',
  '#f43f5e',
  '#e879f9',
  '#d946ef',
  '#c026d3',
] as const

type ColorSwatchPickerProps = {
  value: string
  onChange: (color: string) => void
}

function isDarkSwatch(color: string) {
  const hex = color.replace('#', '')
  const r = parseInt(hex.slice(0, 2), 16)
  const g = parseInt(hex.slice(2, 4), 16)
  const b = parseInt(hex.slice(4, 6), 16)
  return (r * 299 + g * 587 + b * 114) / 1000 < 96
}

export function ColorSwatchPicker({ value, onChange }: ColorSwatchPickerProps) {
  return (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      contentContainerClassName="gap-3 px-1"
    >
      {ACCOUNT_COLOR_SWATCHES.map((color) => {
        const selected = color === value
        const dark = isDarkSwatch(color)
        return (
          <Pressable key={color} onPress={() => onChange(color)}>
            <View
              className={`h-11 w-11 rounded-2xl ${
                selected ? 'border-2 border-white' : dark ? 'border border-white/20' : ''
              }`}
              style={{ backgroundColor: color }}
            />
          </Pressable>
        )
      })}
    </ScrollView>
  )
}
