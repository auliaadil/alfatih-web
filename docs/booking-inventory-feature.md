# Booking Inventory Feature Design

## Understanding Summary
*   **What is being built:** A feature to track standalone flight and hotel bookings (inventory), complete with a simple status workflow (e.g., Planned, Quoted, Booked, Paid, Cancelled). It includes a dedicated list of "Agents" (vendors) for selection.
*   **Why it exists:** Admins need to record booking progress, track costs (prices, paxes, room types, dates) before finalizing Tour Package prices, and reference historical prices for future planning.
*   **Who it is for:** Admins planning trips.
*   **Key constraints:** Bookings are standalone inventory records. They exist independently but can be referenced later.
*   **Explicit non-goals:** Avoiding complex accounting features (like tracking partial payments, agent commissions, or balance sheets).

## Assumptions
*   **Data Scale & Performance:** This is an admin-only feature, so we don't expect high-traffic concurrency. Standard database indexing on dates, hotel/airline IDs, and statuses will be sufficient for performance.
*   **Price History Visibility:** The requirement to "see previous booked prices" can be fulfilled by having a history filter or button within the Hotel/Airline views or Bookings tables, rather than building a complex analytics dashboard.
*   **Currency:** Supports multi-currency (IDR / USD).
*   **Attachments:** Receipts/Invoices must be attached to the bookings.

## Decision Log

| Decision | What was decided | Alternatives considered | Why this option was chosen |
| :--- | :--- | :--- | :--- |
| **Database Architecture** | Specialized tables (`hotel_bookings`, `flight_bookings`) | Unified `inventory_bookings` table with JSON details | Specialized tables provide stronger typing, better relationships with existing airlines/hotels tables, and leave room for vendor-specific logic later without messing up a unified table. |
| **Agent Handling** | Add `agents` table with an `agent_type` field (Person, OTA) | Free text field in bookings | Reusability of agent data across bookings and better search/filtering. Supporting OTAs vs Real people is handled elegantly by the `agent_type` field. |
| **Attachment Handling** | Separate `booking_attachments` table mapped via nullable FKs | Storing a simple string array in the bookings table | Allows for multiple attachments per booking (e.g. invoice + receipt) with proper file metadata tracking. |

## Final Design

### 1. Database Schema
*   **`agents`**: `id` (UUID), `name`, `company`, `contact_info`, `agent_type` (Person, OTA, Direct), `created_at`
*   **`hotel_bookings`**: `id` (UUID), `hotel_id` (FK), `agent_id` (FK, nullable), `check_in_date`, `check_out_date`, `room_type`, `paxes` (Int), `price` (Decimal), `currency` (IDR/USD), `status` (Planned, Quoted, Booked, Paid, Cancelled), `created_at`
*   **`flight_bookings`**: `id` (UUID), `airline_id` (FK), `agent_id` (FK, nullable), `departure_date`, `return_date`, `flight_route`, `paxes` (Int), `price` (Decimal), `currency` (IDR/USD), `status`, `created_at`
*   **`booking_attachments`**: `id`, `file_url`, `file_name`, `hotel_booking_id` (FK nullable), `flight_booking_id` (FK nullable)
*   **Storage:** Supabase Storage Bucket `booking-receipts` (private).

### 2. UI Components & Workflow
*   **Routes:** `/admin/agents`, `/admin/hotel-bookings`, `/admin/flight-bookings`.
*   **List Views:** Use the standard `PageHeader` and `TableCard`. Quick filters for Status, Currency, and Hotel/Airline.
*   **Form Views:** SlideOver/Modal inside the List views. Form includes fields mapping to the database schema + file upload dropzone.
*   **Price History:** Quick access to filter the Bookings tables by Hotel or Airline to see past negotiated prices.
*   **Edge Cases:** Deleting a booking or attachment row will cascade the deletion of the physical file in Supabase Storage.
