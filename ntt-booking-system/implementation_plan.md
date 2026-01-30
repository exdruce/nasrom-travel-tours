# NTT Booking System - Implementation Plan

## 1. Core Feature: Public Booking Page

The public page where customers view services and make bookings.

- [ ] **Public Layout**: Create `src/app/[slug]/page.tsx` for the business storefront.
- [ ] **Service Listing**: Fetch and display active services for the business.
- [ ] **Booking Flow**:
  - Select Service
  - Select Date/Time (Availability check)
  - Enter Customer Details
  - Confirmation

## 2. Core Feature: Dashboard - Bookings Management

Manage incoming bookings.

- [ ] **Bookings List**: Replace placeholder in `src/app/(dashboard)/dashboard/bookings/page.tsx` with real data table.
- [ ] **Booking Details**: View customer info, status (Pending, Confirmed, Cancelled).
- [ ] **Actions**: Accept/Reject/Cancel bookings.

## 3. Core Feature: Dashboard - Calendar

Visual overview of schedule.

- [ ] **Calendar View**: implement `react-big-calendar` or similar in `src/app/(dashboard)/dashboard/calendar/page.tsx`.
- [ ] **Sync**: Display bookings on the calendar.

## 4. Service Management (Expansion)

- [ ] **Services Page**: CRUD for Services (Add new, Edit existing, Delete).
- [ ] **Availability Settings**: Define operating hours and blocks.

## 5. Polish & Integration

- [ ] **Emails**: Confirmation emails (using Resend or Supabase Auth SMTP).
- [x] **Phase 7: Payments**: Integrated Bayarcash Payment Gateway (FPX).
  - [x] Payment Intent creation
  - [x] Return URL handling (POST/GET)
  - [x] Webhook/Callback simulation for localhost
  - [x] Status synchronization
