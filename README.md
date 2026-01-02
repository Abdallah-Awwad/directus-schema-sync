# Directus Schema Sync
This repository contains scripts to synchronize the Directus schema between two environments (Source to Destination).
It utilizes the [Official Directus Schema Sync API](https://directus.io/docs/api/schema).

## Prerequisites
- Node.js (v18+ recommended)

## Setup
1. Copy `.env.example` to `.env`:

2. Fill in your Directus credentials in `.env`:
   - `SOURCE_URL`: URL of the source Directus instance.
   - `SOURCE_TOKEN`: Admin token for the source.
   - `DESTINATION_URL`: URL of the destination Directus instance.
   - `DESTINATION_TOKEN`: Admin token for the destination.

## Workflow

### 1. Sync (Generate Diff)
This step fetches the current schema snapshots from both environments and generates a difference file.

**Command:**
```sh
npm run sync
```

**Note:** The script generates `snapshots/schema-diff.json` automatically.

### 2. Review
Carefully review the generated `snapshots/schema-diff.json` file. Ensure that the changes listed are exactly what you intend to apply to the destination.

### 3. Apply
Apply the difference to the destination environment.

**Command:**
```sh
npm run apply
```
