# Check-in / Check-out Feature Log

Date: 2026-04-26

## New Files

- `tests/unit/transaction-history.test.js`
  Purpose: Adds unit coverage for building assignment history from checkout/checkin transactions.

- `documentation/checkin-checkout-feature-log.md`
  Purpose: Tracks the generated files and folders related to the new feature.

## New Folders

- No new folders were created for this feature.

## Existing Folders Reused

- `uploads/documents/`
  Purpose: Stores uploaded checkout reference documents and checkin inspection documents.

- `views/items/`
  Purpose: Contains the item detail and item history screens.

- `views/transactions/`
  Purpose: Contains the check-out and check-in forms.

## Updated Files

- `src/app.js`
  Added Handlebars helper support and static document serving at `/documents`.

- `src/server.js`
  Restored MongoDB connection on startup so transaction history can persist.

- `src/controllers/items.controller.js`
  Implemented item detail and history API responses.

- `src/controllers/transactions.controller.js`
  Implemented checkout and checkin endpoints.

- `src/controllers/web.controller.js`
  Connected the web pages to live item, user, and transaction data.

- `src/services/item.service.js`
  Added item detail and history aggregation for the item pages.

- `src/services/transaction.service.js`
  Added transaction creation, document link generation, open assignment detection, and asset history building.

- `views/items/index.hbs`
  Replaced placeholder item rows with a live inventory table.

- `views/items/detail.hbs`
  Added current assignment, recent transaction log, and historical usage summary.

- `views/items/history.hbs`
  Added full transaction log and historical assignment view with document links.

- `views/transactions/checkout.hbs`
  Added the working check-out form with assignee and document upload fields.

- `views/transactions/checkin.hbs`
  Added the working check-in form with return note and inspection document upload.

- `public/js/main.js`
  Added client-side submission handling for authenticated multipart transaction forms.

## Tracking Notes

- Uploaded documents are saved into the existing `uploads/documents/` directory.
- Transaction records are stored in the existing `Transaction` collection.
- Assignment history is derived from transactions instead of being stored in a separate new collection.
