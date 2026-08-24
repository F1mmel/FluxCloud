# FluxCloud

FluxCloud is a lightweight, self-hosted personal cloud storage and direct content delivery service designed as a fast, clean alternative to heavy platforms like Nextcloud or OwnCloud.

It gives you full ownership over your files, instant direct CDN access for hotlinking and media streaming, public share links with granular security controls, an in-browser code editor, and seamless WebDAV sync.

---

## Key Features

### High-Speed File Management
- Fast file browser with instant search, multi-file uploads, and drag-and-drop support.
- Streamed ZIP downloads: Folders and multi-file selections are streamed immediately in real time with minimal memory consumption, eliminating server-side zip buffering delays.
- Visual storage breakdown with category analytics and a largest-files overview.
- Soft-delete recycle bin with one-click restore and permanent purge options.
- Folder navigation and item tagging via Favorites.

### Direct CDN Links & Hotlinking
- Generate cryptographically unguessable, permanent direct tokens for any file or directory.
- Direct inline CDN links for raw embedding in websites (`<img src="...">`), markdown documents, audio/video streaming players, or API integrations.
- Instant auto-download URLs that trigger immediate browser downloads on click without an intermediate landing page.
- Built-in QR codes for quick access on mobile devices.

### Public File Sharing & Guest File Drop
- Create custom share links with optional password protection, expiration dates, view-only modes, and download quotas.
- Public folder explorer: External visitors can browse shared folder contents with breadcrumb navigation, search filters, inline file previews, and individual downloads.
- Strict View-Only protection: When enabled, all downloads and in-browser previews are restricted.
- Guest uploads (File Drop): Allow clients or friends to upload files directly into a shared folder without requiring an account.
- Dynamic branding with custom title, logo, and optional blurred wallpaper backgrounds on public share pages.

### In-Browser Code & Text Editor
- Built-in editor for text, markdown, source code, configuration files, and scripts.
- Line numbers gutter, automatic syntax detection, 2-space tab handling, word wrap toggle, font scaling, and keyboard shortcut support (Ctrl+S to save).

### Multi-User & Access Control
- Local user management with role separation (Administrator and Standard Users).
- Per-user storage isolation with automated directory provisioning under `data/users/`.
- Admin-controlled upload quotas, CORS configuration, API keys, and server branding.

### WebDAV Integration & Desktop Sync
- Built-in WebDAV server endpoint for mounting your cloud directly as a network drive in Windows Explorer, macOS Finder, or Linux file managers.
- Ready for sync clients and third-party WebDAV integrations.

---

## Quick Start

### Requirements
- Node.js 18.x or later
- npm or pnpm

### Installation

1. Clone the repository:
```bash
git clone https://github.com/F1mmel/FluxCloud.git
cd FluxCloud
```

2. Install dependencies:
```bash
npm install
```

3. Start the development server:
```bash
npm run dev
```

4. Open your browser and navigate to:
```
http://localhost:3033
```

### Production Deployment

Build the production server:
```bash
npm run build
```

Run the built Nitro server:
```bash
node .output/server/index.mjs
```

---

## Data & Storage Layout

All persistent application data is stored in the local `data/` directory:

- `data/uploads/`: Storage directory for uploaded files and user workspaces.
- `data/shares.json`: Active share link configurations, access rules, and download limits.
- `data/config.json`: Instance settings, appearance options, and system parameters.
- `data/metadata.json`: Favorites, direct CDN tokens, and file metadata.
- `data/trash/`: Soft-deleted files pending restoration or permanent cleanup.

Note: The `data/` directory is excluded from version control via `.gitignore` to protect personal files, configurations, and credentials.

---

## License

This project is licensed under the MIT License. Feel free to use, modify, and self-host.
