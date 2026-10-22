# Kafe Lilim

A warm, modern cafe website and staff management portal for Kafe Lilim.

## Overview
This project provides a complete small-cafe web application with:
- public menu browsing, search, and category filters
- anonymous loyalty stamp card generation and recovery
- review submission with 1-5 star ratings
- a separate staff portal secured with server-side session authentication
- inventory tracking and audit logging
- persistent SQLite storage for menu, loyalty, reviews, and settings

## Stack
- Node.js + Express
- SQLite via better-sqlite3
- vanilla HTML, CSS, and JavaScript

## Local setup
1. Install dependencies:
   npm install
2. Copy `.env.example` to `.env` and update values.
3. Start the server:
   npm start
4. Visit:
   - public website: 
   - staff portal: 

## Environment configuration
Set the following in `.env`:
- `SESSION_SECRET`: secret used for secure session cookies
- `STAFF_PASSCODE`: the shared passcode used for staff login
- `STAFF_ACCOUNTS`: optional JSON array of staff accounts with roles
- `SESSION_TTL_MINUTES`: session duration in minutes
- `NODE_ENV`: set to `production` for secure cookies

## Staff login
The default login flow uses the shared passcode from `STAFF_PASSCODE`.
When `STAFF_ACCOUNTS` is configured, the server uses that list instead and assigns roles from the configured credentials.

Important limitations:
- a shared passcode is not a secure individual identity system
- browser storage is never used as the source of truth for staff permissions
- roles are validated server-side and not trusted from the client

## Database
The app uses SQLite in the `data/` folder. Records persist across restarts and refreshes.

## Notes
- Public pages never expose employee contact data or protected staff-only APIs.
- Staff security is enforced via authenticated sessions and backend permission checks.
- Some cafe details are intentionally placeholder values and can be edited in the staff settings screen.
