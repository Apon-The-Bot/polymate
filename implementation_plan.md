# Scalable Polytechnic Filters, Locations & Dynamic Sessions

This plan implements advanced UX features for PolyMate: dynamic descending session generation (last 10 years by default, expandable via a "See More" trigger), physical location markers for Marketplace items and Lost & Found notices, and default institute-filtered feeds with an "All campuses" toggle.

---

## User Review Required

> [!IMPORTANT]
> - **Feeds Filtration Model:** All dashboard feeds (Mess Finder, Marketplace, Lost & Found, Study Hub) will automatically default to showing listings matching the active user's `institute_id`. We will add a beautiful segmented toggle at the top: **[ My Institute ] [ All / public ]** to let them swap views.
> - **Locations in Database:** We will add `pickup_location` to `marketplace_items` and `location` to `lost_found_items`.
> - **Dynamic Session Windowing:** The session selector will generate the last 10 years of sessions dynamically in descending order (e.g. `2025-26`, `2024-25`). We will add a `"See Older Sessions (পুরাতন সেশন)"` button at the bottom of the list to load older sessions dynamically.

---

## Proposed Changes

### 1. Database Schema Refactoring

#### [MODIFY] [schema.sql](file:///c:/Users/mdama/OneDrive/Desktop/PolyMate/docs/schema.sql)
- Append migrations at the end of the file:
  - Add `current_address` to `users` table.
  - Add `pickup_location` to `marketplace_items`.
  - Add `location` (where item was lost/found) to `lost_found_items`.
  - Seed the 48 government polytechnic institutes.

---

### 2. Backend API Feed Filtering

#### [MODIFY] [MarketplaceController.php](file:///c:/Users/mdama/OneDrive/Desktop/PolyMate/backend/controllers/MarketplaceController.php), [LostFoundController.php](file:///c:/Users/mdama/OneDrive/Desktop/PolyMate/backend/controllers/LostFoundController.php), [MessController.php](file:///c:/Users/mdama/OneDrive/Desktop/PolyMate/backend/controllers/MessController.php)
- Update query handlers to accept an optional `filter` query parameter:
  - If `filter = 'my'` (default): filter items where the creator's `institute_id` matches the requesting user's `institute_id`.
  - If `filter = 'all'`: return all items without institute filtering.
- Include `location` / `pickup_location` in the insert and response objects.

#### [MODIFY] [register.php](file:///c:/Users/mdama/OneDrive/Desktop/PolyMate/backend/register.php)
- Handle saving `current_address` and dynamic `custom_institute_name`.

---

### 3. Frontend Registration & Feed UX

#### [MODIFY] [RegisterScreen.tsx](file:///c:/Users/mdama/OneDrive/Desktop/PolyMate/src/features/auth/components/RegisterScreen.tsx)
- Add input field for **Current Address** (বর্তমান ঠিকানা).
- Fetch and display the list of 48 polytechnics with an "Other / General" custom option.
- Implement descending dynamic session generator (10 years window) with a "See More" button to append 10 more years.

#### [MODIFY] [MarketplaceDashboard.tsx](file:///c:/Users/mdama/OneDrive/Desktop/PolyMate/src/features/marketplace/components/MarketplaceDashboard.tsx), [LostFoundDashboard.tsx](file:///c:/Users/mdama/OneDrive/Desktop/PolyMate/src/features/lost-found/components/LostFoundDashboard.tsx), [RoomFinderDashboard.tsx](file:///c:/Users/mdama/OneDrive/Desktop/PolyMate/src/features/room-finder/components/RoomFinderDashboard.tsx)
- Add a top segment filter: **[ My Polytechnic (আমার পলিটেকনিক) ] [ All (সব) ]**.
- Update hooks to pass the selected filter mode (`'my'` vs `'all'`).
- Display location tags on marketplace product cards ("Pickup: Library") and Lost & Found notices ("Lost near: Main Gate").
