# PolyMate: Frontend UI/UX Design System & UI Specification

This specification is built directly from the **PolyMate Brand Identity Guidelines (v1.0)**. It defines the exact visual assets, layout grids, spacing rules, and color ratios required to design or build a premium, consistent frontend interface.

---

## Part 1: Design Tokens & System Assets

### 🎨 1. Color Palette (The 70-20-10 Rule)
*   **70% Dominant (Clarity & Structure):** 
    *   `Light Background:` HEX `#FAFAFC` (RGB: 250, 250, 252) — Use for app screens and page containers.
    *   `Card/Surface BG:` HEX `#FFFFFF` (RGB: 255, 255, 255) — Use for cards, inputs, and modals.
    *   `Dark Text:` HEX `#1A1A1A` (RGB: 26, 26, 26) — Use for headings, primary body text, and labels.
*   **20% Secondary (Identity & Theme):**
    *   `Primary Teal:` HEX `#0D6F73` (RGB: 13, 111, 115) — Use for primary buttons, active states, active tab icons, and header accents.
    *   `Toned Charcoal:` HEX `#1E1F21` (RGB: 30, 31, 33) — Use for dark mode backgrounds or headers.
    *   `Toned Gray:` HEX `#6B7280` (RGB: 107, 114, 128) — Use for secondary labels, inactive icons, and descriptions.
    *   `Toned Light Gray:` HEX `#F3F4F6` (RGB: 243, 244, 246) — Use for input fields, inactive tabs, and borders.
*   **10% Accent (Highlights & Actions):**
    *   `Premium Gold:` HEX `#C9AA68` (RGB: 201, 170, 104) — Use for notifications, highlights, ratings, and special visual details.
*   **Semantic Alert Colors:**
    *   `Success Green:` HEX `#10B981` (RGB: 16, 185, 129) — Available status, positive balance.
    *   `Warning Orange:` HEX `#F59E0B` (RGB: 245, 158, 11) — Pending states, near budget limits (80%).
    *   `Danger Red:` HEX `#EF4444` (RGB: 239, 68, 68) — Over budget (100%), unavailable status, deficit balance, logout, delete buttons.

### 📐 2. Spacing & Grid System (4px Base)
All layout margins, paddings, and element gaps must be multiples of **4px** to maintain perfect alignment:
*   `Spacing-1:` 4px (Inside element padding)
*   `Spacing-2:` 8px (Small margins, between inputs and labels)
*   `Spacing-3:` 12px (Gap between text elements, avatar to title)
*   `Spacing-4:` 16px (Standard padding inside cards, items list gap)
*   `Spacing-5:` 24px (Standard screen margins, gap between sections)
*   `Spacing-6:` 32px (Header to content container spacing)
*   `Spacing-8:` 64px (Large layout spacers)

### 🔠 3. Typography Hierarchy
*   **Primary Font (Headings & Navigation):** **Poppins** (with clean geometric spacing)
*   **Secondary Font (Body Text & Forms):** **Inter** (optimized for readability)

| Class | Font Name | Font Weight | Font Size | Line Height | Color | Usage |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| `Display` | Poppins | Bold (700) | 28px | 34px | `#1A1A1A` | Main headers |
| `Heading 1` | Poppins | SemiBold (600) | 20px | 26px | `#1A1A1A` | Section titles |
| `Heading 2` | Poppins | SemiBold (600) | 16px | 22px | `#1A1A1A` | Card headers |
| `Subheading`| Inter | SemiBold (600) | 12px | 16px | `#0D6F73` | Active tab, tags |
| `Body Text` | Inter | Regular (400) | 12px | 18px | `#1A1A1A` | List items, paragraphs |
| `Caption` | Inter | Medium (500) | 10px | 14px | `#6B7280` | Labels, details, dates |

### 🔳 4. Component Radii & Shadows
*   `Input Fields & Small Cards:` Corner radius: **12px** (`rounded-xl`).
*   `Standard Cards & Action Blocks:` Corner radius: **16px** (`rounded-2xl`).
*   `Outer Dashboard Containers & Modals:` Corner radius: **24px** (`rounded-3xl`).
*   `Pill-style Tabs & Avatars:` Corner radius: **9999px** (`rounded-full`).
*   `Soft UI Shadows:` Elevation: `shadow-sm` (Offset: Y=4px, Blur=10px, Color: `rgba(26, 26, 26, 0.05)`).

---

## Part 2: Pixel-Perfect Screen Mockup Specifications

### 📱 Screen 1: Welcome & Auth Portal
*   **View A: Login Layout**
    *   **Container:** Margin: Left/Right 24px, Top padding: 64px. BG: `#FAFAFC`.
    *   **Logo Area:** Displayed centered. Size: Height 96px, Width 96px. Logo title: "PolyMate" (Poppins 28px Bold), Subtitle: "Learn Smarter. Achieve Faster." (Inter 10px Medium in `#6B7280`).
    *   **Input Forms:**
        *   Label: "Email Address *" (Inter 10px SemiBold in `#6B7280`).
        *   Input Field: Height 48px, Padding-X 16px, Rounded-12px, BG: `#F3F4F6`, Border: `#F3F4F6`. Text: Inter 12px Regular, placeholder color: `#6B7280`.
        *   Label: "Password *" (Inter 10px SemiBold in `#6B7280`).
        *   Password Field: Height 48px, Padding-X 16px, right icon `eye-outline` to toggle visible text.
    *   **Buttons:**
        *   Primary Button ("LOG IN"): Height 48px, BG: `#0D6F73`, Rounded-full, Text color: `#FFFFFF`, Poppins 12px SemiBold, uppercase.
        *   Link Button ("Register"): Centered, padding 12px, Text color: `#0D6F73`, Inter 12px SemiBold.

*   **View B: Registration Layout**
    *   **Scroll Container:** ScrollView, Content padding-bottom: 40px.
    *   **Structure:**
        *   Section Title: "Create Student Account" (Poppins 20px SemiBold).
        *   Inputs (Name, Email, Phone, Password) mapped to standard 48px text inputs.
        *   *Special Polytechnic Dropdown:* Height 48px, border-radius 12px, BG: `#F3F4F6`, trailing icon `chevron-down`. On click, opens options list. If "Other" is chosen, reveals two sub-inputs: custom name and custom shortcode.
        *   Academic Section: Board Roll (Numeric keypad), Registration No (Numeric keypad), Department/Technology Dropdown (Computer, Civil, etc.), Session Input (e.g. 2021-22).
        *   Location Section: "Current Address" input field (multiline, height 80px).

---

### 🏠 Screen 2: Home Dashboard
*   **User Header Block:**
    *   Padding-X: 24px, Top Margin: 24px.
    *   Title: "Hello, [Name]" (Poppins 20px SemiBold, `#1A1A1A`).
    *   Subtitle: "[Institute Name]" (Inter 10px Medium, `#6B7280`).
*   **Mess Status Summary Widget (Active State):**
    *   Card Container: Margin: 24px, Padding: 20px, BG: `#0D6F73` (Primary Teal), Rounded-24px, Soft shadow.
    *   Layout Grid:
        *   Row 1: Title "ACTIVE MESS" (Inter 10px Bold, color: `#C9AA68`), value "@engineers.mess" (Poppins 16px Bold, color: `#FFFFFF`).
        *   Row 2: "Today Meals: 1.5" (Inter 12px Regular, `#FFFFFF`), "Balance: + ৳ 450" (Inter 12px Bold, color: `#10B981` in positive state, or `- ৳ 120` in red `#EF4444` in negative).
        *   Row 3: Budget track label: "Monthly Expense Spent: ৳2,750 of ৳5,000" (Inter 10px Regular, color: `#FAFAFC`).
        *   Row 4: Progress Bar track: Height 6px, BG: `rgba(255, 255, 255, 0.2)`, inner progress fill BG: `#C9AA68` (Gold), current progress width: 55%.
*   **Core Navigation Grid:**
    *   Container: FlatList or flex-wrap row, Margin-X: 16px, gap between items: 12px.
    *   Each Grid Card (Item Box):
        *   Layout: Column, Width: 46% of screen, Height: 120px.
        *   Styling: BG: `#FFFFFF`, Border: 1px solid `#F3F4F6`, Rounded-20px, Padding: 16px.
        *   Inside Components: Top-left icon holder (Size 36px, Rounded-12px, BG: `#F3F4F6`, containing a Teal `#0D6F73` icon), bottom text label "Mess Manager" (Poppins 12px SemiBold, `#1A1A1A`).

---

### 🏢 Screen 3: Mess Manager

#### State A: Search & Create Mess View (When User has No Mess)
*   **Join Mess Form View (Default Tab):**
    *   Search Bar: Margin-Bottom 16px, Height 48px, BG: `#FFFFFF`, Border: 1px solid `#F3F4F6`, Rounded-12px, prefix search icon, text "Search messes...".
    *   Join Alphanumeric Input: Label "Enter Join Code", Input box (Height 48px, center-aligned characters, Poppins 16px Bold), and primary button "Submit Join Request".
    *   Footer Callout: "Want to start your own mess? Create New Mess" button (Outline style, border: `#0D6F73`, text: `#0D6F73`).
*   **Create Mess View:**
    *   Back Header: Touchable row, icon `arrow-back` (Teal), text "Back to Search" (Inter 12px SemiBold).
    *   Input 1: Label "Mess Name *" (Inter 10px SemiBold). TextInput: Height 48px, placeholder "e.g. Engineers Mess".
    *   Input 2: Label "Username *" (Inter 10px SemiBold). TextInput: Height 48px, placeholder "e.g. engineers.mess".
    *   *Real-time Availability Status (Positioned directly below Input 2, spacing 8px):*
        *   When checking: Spinner icon + Text "Checking availability..." (Inter 10px Medium, `#6B7280`).
        *   When available: Text "@handle is available" (Inter 12px Bold in green `#10B981`) + Checkmark icon (`checkmark-circle`, size 16px, `#10B981`) positioned at the end of the row.
        *   When taken: Text "@handle is already taken" (Inter 12px Bold in red `#EF4444`) + Close icon (`close-circle`, size 16px, `#EF4444`) positioned at the end of the row.

#### State B: Active Mess Dashboard Tabbed Interface
*   **Global Mess Header Card:**
    *   Margin-X: 24px, Top Margin: 16px, Padding: 20px, BG: `#0D6F73`, Rounded-24px.
    *   Contains Mess name, handle, direct share button (triggers native device sharing drawer), and Net balance widget.
*   **Horizontal Tabs Nav Bar:**
    *   ScrollView container, horizontal scroll enabled, no scroll indicators.
    *   Tab Items: Rounded-xl buttons (Padding: X=16px, Y=10px, Margin-Right: 8px).
    *   Active Tab Style: BG: `#0D6F73` (Teal), Text: `#FFFFFF`, Border: `#0D6F73`.
    *   Inactive Tab Style: BG: `#FFFFFF`, Text: `#6B7280`, Border: 1px solid `#F3F4F6`.

*   **Tab 1 Layout: Dashboard Tab**
    *   **Bazaar Shoppers Widget:**
        *   Container Card: BG: `#FFFFFF`, Rounded-20px, Border: `#F3F4F6`, Padding: 16px, Margin: 16px.
        *   Rows: "Today Shoppers" list, displaying assigned member avatars side-by-side. "Tomorrow Shoppers" list displaying next day's members.
    *   **Cost Submission Button:**
        *   Floating Action Button (FAB) or prominent button: "Submit Bazaar Cost" (Teal BG, Poppins 12px Bold). Opens a modal popup with inputs: Title (Potato, Rice), Cost Amount (৳), and receipt attachment field.
*   **Tab 2 Layout: Meal Sheet Tab**
    *   **Monthly Meals Grid Spreadsheet:**
        *   Header Column: Member Names.
        *   Body Columns: Date slots (1st to 31st). Scrollable horizontally and vertically.
        *   Cell Block: Width 48px, Height 36px, BG: `#FAFAFC`, Border: 0.5px solid `#E2E8F0`, Text: Inter 12px Medium, center-aligned.
    *   **Audit Logger Section:**
        *   Container BG: `#FFFFFF`, Rounded-20px, Padding: 16px.
        *   Lists audit logs: "Manager updated Roll 102 meals on June 12: 1.5 -> 2.0" (Inter 10px Medium, text `#6B7280`).
*   **Tab 3 Layout: Bazaar Planner Tab (Manager Only)**
    *   **Monthly Grid Calendar:**
        *   Each calendar cell display: Date number, list of assigned member initials (e.g. "AS", "RM"), and an edit button to assign new members from a list overlay modal.
*   **Tab 4 Layout: Approvals Tab (Manager Only)**
    *   **Pending Costs List:**
        *   Item Card: BG: `#FFFFFF`, Rounded-16px, Padding: 12px, Row layout.
        *   Left side: Member name, expense title, amount (e.g. "৳ 1,250"), date.
        *   Right side: Two action buttons:
            *   Accept: Size 32px, Rounded-8px, BG: `#10B981`, containing `checkmark` icon.
            *   Reject: Size 32px, Rounded-8px, BG: `#EF4444`, containing `close` icon.

---

### 💳 Screen 4: Personal Expense Tracker

*   **View A: Monthly Tracker Dashboard**
    *   **Header Section:** Budget indicator card (Rounded-24px, BG: `#FFFFFF`, Border: 1px solid `#F3F4F6`, Padding: 20px).
        *   Main text: "Total Spent this Month" (Inter 10px SemiBold, `#6B7280`).
        *   Value: "৳ 3,450.00" (Poppins 22px Bold, `#1A1A1A`).
        *   Threshold Alert Bar:
            *   Shows progress bar of total expenses against the threshold budget.
            *   If total spent < 80% of limit: Progress bar is Teal (`#0D6F73`).
            *   If total spent between 80% and 99%: Progress bar shifts to Orange (`#F59E0B`), and warning text displays: *"⚠️ Warning: You have used 85% of your budget!"*
            *   If total spent >= 100%: Progress bar shifts to Red (`#EF4444`), and warning displays: *"❌ Danger: You have exceeded your monthly limit!"*
    *   **Category Spending grid:**
        *   Shows cards representing categories: Commute, Food, Tuition, Mess Rent, Books/Stationery, Others.
        *   Each category card shows: Category Name, icon, total spent, and percentage of overall budget.
    *   **Add Transaction Trigger:**
        *   Floating Action Button (Teal BG, size 52px, center-aligned plus icon). On press, slides up:
*   **View B: Add Transaction Modal Sheet**
    *   **Components:**
        *   Title: "Add New Expense" (Poppins 16px Bold).
        *   Input 1: Title (text input, placeholder "e.g. Bus fare to campus").
        *   Input 2: Amount in ৳ (numeric keypad, placeholder "e.g. 150").
        *   Input 3: Category Picker Dropdown (Food, Commute, Tuition, Mess Rent, Others).
        *   Input 4: Date Selector field (defaults to Today).
        *   Action buttons: "Add Expense" (Teal BG) and "Cancel" (light gray BG).

---

### 📢 Screen 5: Campus Lost & Found Dashboard

*   **View A: Listings notice board**
    *   **Header Section:** Search bar (height 44px, Rounded-12px, border `#F3F4F6`) + Status Filter Toggle (row layout):
        *   "All Items" (Active: Teal BG, White text).
        *   "Lost Items Only" (Inactive: White BG, gray text, border `#F3F4F6`).
        *   "Found Items Only" (Inactive: White BG, gray text, border `#F3F4F6`).
    *   **Listings Grid Layout:**
        *   Card Container: Column layout, Rounded-20px, BG: `#FFFFFF`, Border: `#F3F4F6`, Padding: 12px, Margin-bottom: 12px.
        *   Inside Item:
            *   Row 1: Image container (Height 120px, Rounded-12px, displaying the reported item photo, or placeholder graphic).
            *   Row 2: Status Badge:
                *   If Lost: BG `rgba(239, 68, 68, 0.1)`, Text: "LOST" (Danger Red `#EF4444` 9px Bold, uppercase).
                *   If Found: BG `rgba(16, 185, 129, 0.1)`, Text: "FOUND" (Success Green `#10B981` 9px Bold, uppercase).
            *   Row 3: Title: "Scientific Calculator FX-991ES" (Poppins 12px Bold, `#1A1A1A`).
            *   Row 4: Location details: "Found at Academic Building 2, Room 304" (Inter 10px Medium, `#6B7280`) + date.
            *   Row 5: **"Claim Item"** button (pills-style, height 32px, Teal BG, text: "Claim / Contact Owner" Poppins 10px Bold). Clicking it slides up:
*   **View B: Report Lost/Found Item Modal Form**
    *   **Components:**
        *   Title: "Report Lost/Found Item" (Poppins 16px Bold).
        *   Input 1: Item Title (placeholder: "e.g. Keys, ID Card, Calculator").
        *   Input 2: Status Toggle (Select "Lost" or "Found").
        *   Input 3: Description details (multiline, height 80px, placeholder: "Describe color, brand, or unique features").
        *   Input 4: Location where lost/found (placeholder: "e.g. Campus Library / Aud2").
        *   Input 5: Contact Mobile Number (numeric keypad).
        *   Input 6: Upload Item Image button.
        *   Action buttons: "Publish Report" (Teal BG) and "Cancel".

---

### 👤 Screen 6: Profile & Account Settings
*   **Large Profile Badge:**
    *   Avatar: Size 80px, Circle shape, BG: `#FAFAFC` (in light mode) or `#0D6F73` (in dark mode), letter "A" (Poppins 32px Bold, color: `#0D6F73` or `#C9AA68`).
    *   Name Label: Poppins 18px Bold, `#1A1A1A`.
    *   Role Badge: Text "Student" or "Manager" inside a light background badge (Padding: X=12px, Y=4px, border-radius 12px, BG: `#F3F4F6`, text: `#6B7280` 10px Bold).
*   **Profile Form Fields Card (View Mode):**
    *   BG: `#FFFFFF`, Border: 1px solid `#F3F4F6`, Rounded-24px, Padding: 20px, Margin-Bottom: 16px.
    *   Each property display row:
        *   Left side: Label title + icon (e.g. `mail-outline`, size 16px, Teal).
        *   Right side: Actual value (Inter 12px Bold, color: `#1A1A1A`).
*   **Interactive Edit Form Fields (Edit Mode):**
    *   When the user clicks "Edit Profile", all values are replaced by TextInput fields (Height 42px, padding-X 12px, border-radius 8px, BG: `#FAFAFC`, border: 1px solid `#E2E8F0`).
    *   Actions Row:
        *   Cancel Button: Width 45%, BG: `#F3F4F6`, text color: `#1A1A1A`.
        *   Save Button: Width 45%, BG: `#0D6F73` (Teal), text color: `#FFFFFF`.
*   **Settings Modal overlays:**
    *   Change Password Modal: Transparent background, bottom-sheet sliding layout. Rounded-t-24px, padding 20px. Contains Current Password, New Password, Confirm Password text inputs. Update Button triggers verification API.
*   **Log Out Button:**
    *   Pill button at the bottom of the scroll view. BG: `rgba(239, 68, 68, 0.1)`, Border: 1px solid `rgba(239, 68, 68, 0.2)`, text color: `#EF4444` (Danger Red), Poppins 12px Bold.
