# HostelMate Enterprise Food & Mess Management System Documentation

## Overview
The Enterprise Food & Mess Management System manages the complete culinary and mess lifecycle of a hostel: meal plan definitions and resident assignments, daily menu publishing with notification dispatches, meal attendance and guest/extra meal tracking, automatic recipe-based inventory consumption, low-stock scanning alerts, kitchen purchases linked to Expense Management and Vendor Ledgers without accounting duplication, food wastage cost loss tracking, and kitchen analytics reports.

---

## REST API Specifications

### 1. Meal Plans (`/api/meal-plans` & `/api/resident-meal-plans`)
- `POST /api/meal-plans`: Create meal plan (`planName`, `planCode`, `mealType`, `monthlyCharge`, `description`)
- `GET /api/meal-plans`: Get meal plans (Auto-seeds default Veg and Non-Veg plans)
- `POST /api/resident-meal-plans/assign`: Assign or change resident meal plan

### 2. Menu Management (`/api/menus`)
- `POST /api/menus`: Create or update daily menu (`menuDate`, `breakfast`, `lunch`, `snacks`, `dinner`, `status`). *Automatically dispatches In-App Menu Announcement notification upon publishing!*
- `GET /api/menus?date=<dateStr>`: Get menu for date

### 3. Meal Attendance & Guest Meals (`/api/meal-attendance`)
- `POST /api/meal-attendance`: Record attendance (`residentId`, `meal`, `status` [`Present`, `Absent`, `Leave`, `Guest Meal`, `Extra Meal`], `guestName`, `extraMealCharge`). *Automatically deducts stock from inventory based on dish recipe ingredients!*
- `GET /api/meal-attendance?date=<dateStr>&meal=<meal>`: List attendance records

### 4. Kitchen Inventory (`/api/inventory` & `/api/inventory-transactions`)
- `POST /api/inventory`: Add inventory item (`itemName`, `category`, `unit`, `currentStock`, `reorderLevel`, `averageCost`)
- `GET /api/inventory`: Get store inventory items with stock status (`In Stock`, `Low Stock`, `Out of Stock`)
- `POST /api/inventory/scan-low-stock`: Scan stock and dispatch high-priority low stock alert notifications

### 5. Recipes & Costing (`/api/recipes`)
- `POST /api/recipes`: Create dish recipe with ingredient quantities per serving and cost per serving calculation
- `GET /api/recipes`: Get active recipes

### 6. Kitchen Purchases & Expenses (`/api/kitchen-purchases`)
- `POST /api/kitchen-purchases`: Record purchase (`vendorId`, `purchaseDate`, `invoiceNumber`, `items`). *Automatically increases inventory stock AND creates an operational Expense in Expense Management, updating Vendor Ledger!*
- `GET /api/kitchen-purchases`: Get purchase history

### 7. Food Wastage (`/api/waste`)
- `POST /api/waste`: Log food wastage (`inventoryItemId`, `quantity`, `reason`, `meal`). *Deducts stock and calculates financial cost impact.*
- `GET /api/waste`: Get waste logs

### 8. Food Reports (`/api/food-reports`)
- `GET /api/food-reports/dashboard`: Get kitchen KPI cards (Today's Meals, Residents Served, Guests Served, Extra Meals, Today's Cost, Monthly Cost, Wastage Cost, Per Resident Cost)
- `GET /api/food-reports/export/excel`: Export Excel kitchen report

---

## Manual Verification Checklist
1. ✅ **Meal Plan & Resident Assignment**: Assigned Veg plan to resident → verified effective dates.
2. ✅ **Daily Menu Publishing**: Published daily menu → verified In-App notification dispatch.
3. ✅ **Meal Attendance & Automated Stock Deduction**: Recorded attendance → verified inventory stock was automatically consumed based on recipe.
4. ✅ **Kitchen Purchase & Expense Creation**: Recorded purchase → verified `Expense` document created in Expense Management and Vendor metrics updated without duplication.
5. ✅ **Low Stock Scan & Notification**: Reduced stock below reorder level → verified high-priority alert notification was dispatched.
6. ✅ **Food Wastage & Cost Loss**: Logged spoilage waste → verified inventory deduction and financial cost impact.
7. ✅ **Excel Export**: Exported kitchen report buffer.
