# Okane

React Native mobile app for iOS and Android, built with Expo, TypeScript, Expo Router, and NativeWind (Tailwind CSS).

## Stack

- **Expo SDK 54** (React Native 0.81, React 19.1)
- **TypeScript**
- **Expo Router** — file-based routing in `app/`
- **NativeWind v4** — Tailwind CSS via `className` on React Native components

## Prerequisites

- Node.js LTS (20.19+)
- **iOS:** Xcode 16.1+ (works with Xcode 26.0.1; SDK 56/57 require Xcode 26.4+)
- **Android:** Android Studio + SDK + emulator or physical device

NativeWind uses native modules (Reanimated). Use a **development build** — **Expo Go is not supported** for this stack. Run `npm run android` or `npm run ios` to install the dev client first.

## Getting started

```bash
npm install
```

### First-time native setup

Generate native projects and build locally:

```bash
# iOS (macOS only)
npm run ios

# Android
npm run android
```

These run `expo run:ios` / `expo run:android`, which prebuilds `ios/` and `android/` if needed and installs the dev client on a simulator or device.

### Day-to-day development

After the initial native build:

```bash
npx expo start --dev-client
```

### Web (optional)

```bash
npm run web
```

## Project structure

```
app/                  Expo Router screens
components/           Shared components
global.css            Tailwind directives
tailwind.config.js    Tailwind + NativeWind preset
metro.config.js       Metro + NativeWind
babel.config.js       NativeWind Babel preset
nativewind-env.d.ts   TypeScript types for className
```

## Styling

Use Tailwind utility classes with the `className` prop:

```tsx
<View className="flex-1 items-center justify-center bg-white">
  <Text className="text-2xl font-bold text-blue-600">Okane</Text>
</View>
```

If styles do not update after changes, restart Metro with a clean cache:

```bash
npx expo start -c
```

## Troubleshooting

- **`className` not working:** Confirm `global.css` is imported in `app/_layout.tsx` and restart with `-c`.
- **TypeScript errors on `className`:** Ensure `nativewind-env.d.ts` exists at the project root.
- **Hot reload crashes:** Use NativeWind >= 4.2.5 (included in this project).
- **iOS build fails with `weak let` errors:** You are on Expo SDK 56+ with Xcode older than 26.4. This project uses SDK 54 for compatibility with Xcode 26.0.1. To use SDK 57 later, upgrade Xcode to 26.4+.
