# PolyMate - Campus Hub App

A **React Native (Expo)** campus management app for polytechnic students of Bangladesh.

## Features
- 🏠 **Home Dashboard** — Announcements & quick access
- 🍽️ **Mess Manager** — Meal tracking & expense splitting
- 🛒 **Marketplace** — Buy/sell among students
- 💸 **Expense Tracker** — Personal finance management
- 🔍 **Lost & Found** — Report & find lost items
- 📚 **Study Hub** — Resources & notes sharing
- 🏘️ **Room Finder** — Find room/seat near campus

## Tech Stack
- **Frontend:** React Native + Expo + NativeWind (TailwindCSS)
- **Backend:** PHP + MySQL (hosted at bloodhelpbd.com/polymate-api)
- **State:** Zustand + TanStack Query
- **Auth:** JWT via expo-secure-store

## Getting Started

```bash
npm install
npx expo start
```

## Project Structure
```
src/
├── app/              # Expo Router screens
├── features/         # Feature modules
│   ├── auth/
│   ├── dashboard/
│   ├── mess-manager/
│   ├── marketplace/
│   ├── expense-tracker/
│   ├── lost-found/
│   ├── study-hub/
│   └── room-finder/
├── store/            # Zustand stores
└── components/       # Shared components
backend/              # PHP REST API
```

## Developer
**Amanullah Sheikh** — mdamanullahsheikhapon@gmail.com
