# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

**ttScraper** is a Chrome extension that scrapes TikTok Studio analytics data and sends it to n8n webhooks. It allows creators to automatically extract video performance metrics (views, engagement, followers, etc.) from TikTok's analytics pages and forward that data to external workflows.

## Architecture

The extension follows the standard Chrome Extension Manifest v3 architecture with three main components:

### 1. **Content Script** (`content.js`)
- Executes in the context of both TikTok Studio and TikTok Shop pages
- **Auto-detects page type** using URL patterns:
  - Video Analytics: URLs containing `tiktokstudio/analytics`
  - Product: URLs containing `shop.tiktok.com`
- Routes to appropriate scraping function automatically

#### Video Analytics Scraping (`scrapeTikTokAnalytics()`)
- Extracts: video ID, username, views, play time, engagement metrics (likes, comments, shares), followers, retention data
- Uses two strategies:
  - **Strategy 1**: Query specific CSS classes (`.absolute-value`, `.TUXText--weight-medium`)
  - **Strategy 2**: Regex pattern matching on page text (fallback if selectors fail)

#### Product Scraping (`scrapeTikTokShopProduct()`)
- Extracts comprehensive product information using **dynamic, pattern-based extraction** instead of fixed CSS selectors
- **Key extraction strategies**:
  1. **Title**: Searches `h1`/`h2` elements by text length (5-200 chars), falls back to `document.title`
  2. **Pricing** (`getPriceData()` helper):
     - **Step 1**: Search for discount pattern (`-XX%`) in leaf elements (no children)
     - **Step 2**: Find numeric prices matching pattern `1,234` (numbers with comma grouping)
     - **Step 3**: Classify prices by `font-size` (larger = current, smaller or strikethrough = original)
     - **Step 4**: Fallback to regex pattern matching for `3,222円` or `¥3,222` format
     - Robust against TikTok's variable HTML structure (prices may be in separate nodes)
  3. **Social Proof**: Uses regex patterns for rating (decimal format), reviews count (number + "reviews"), sales volume (number + "sold")
  4. **Seller Info**: Pattern matching for "Sold by" or "Seller:" text
  5. **Variants**: Iteratively finds containers with `[class*="variant"]`, `[class*="option"]`, etc.; extracts labels and associated buttons
  6. **Product Description** (`getUniversalDescription()` helper):
     - **Format-agnostic**: Works with lists (`<li>`), text blocks (`<div>`), paragraphs (`<p>`), or any HTML element
     - Locates description header semantically (supports EN/JP/multi-lang: "About", "商品説明", "Features", "説明", etc.)
     - Extracts raw text from container using `.innerText` (preserves visual line breaks)
     - Splits by line breaks (`\n`) to isolate individual lines/points
     - Removes decorative characters at start of lines: ・, *, -, •, emoji, Japanese brackets 【】, etc.
     - **Validation filters**: >5 chars, <500 chars, excludes "View more"/"もっと見る", removes duplicates
     - Works with complex formats: bullet points, titles in brackets, paragraph blocks, mixed structures
     - **Real-world examples**: Handles both bullet-based (・ワンタッチで自動開閉♪) and title-based (【最高純度99.9%】 パラグラフ completo) formats
  7. **Media** (`getProductImages()` helper):
     - **Filter 1 - ALT Text**: Matches images with alt attribute containing first 12 chars of product title (most reliable)
     - **Filter 2 - CDN Origin**: Validates URLs from TikTok CDNs (tiktokcdn, tos-, /obj/, amazonaws), excludes avatars/icons/SVGs, checks for valid image formats (.jpg, .png, .webp, .gif)
     - **Filter 3 - Fallback**: Uses large images (>100x100) if other filters fail
     - Deduplicates URLs using `Set`, handles lazy-loaded images via `data-src`
- **Robustness**: Uses fallback strategies for each field; doesn't break if TikTok's class names change

- Includes error handling and extensive console logging for debugging
- Sends data back to popup via Chrome message passing (listens for `scrapeTikTokAnalytics` action)
- Key challenge: Both platforms' page structures may change, requiring CSS selector updates

### 2. **Popup UI** (`popup.js` + `popup.html`)
- Provides user interface with three main buttons: Scrapear (Scrape), Enviar (Send), Limpiar (Clear)
- Manages webhook URL persistence using Chrome storage API (with localStorage fallback)
- Handles communication with content script to trigger scraping
- **Auto-routes to correct webhook based on data type**:
  - Product data → `https://flows.lemonsushi.com/webhook-test/ttchop_productScrapper`
  - Video analytics → `https://flows.lemonsushi.com/webhook/ttchop_ttAnalytics`
- Also allows manual send to custom webhook URL via input field (user-provided URL)
- Displays real-time status messages to user
- Uses CSS classes for styling status messages (`status`, `info`, `success`, `error`)

### 3. **Background Service Worker** (`background.js`)
- Activates when user clicks extension icon
- Triggers data scraping from content script
- **Auto-routes to correct webhook based on data type**:
  - Product data → `https://flows.lemonsushi.com/webhook-test/ttchop_productScrapper`
  - Video analytics → `https://flows.lemonsushi.com/webhook/ttchop_ttAnalytics`
- Shows notifications using Chrome notifications API indicating data type and result
- Note: This may be redundant with popup functionality but handles icon-click actions

### 4. **Configuration** (`manifest.json`)
- Manifest v3 configuration
- Permissions: `activeTab`, `scripting`, `storage`, `notifications`
- Host permissions: `https://www.tiktok.com/*`
- Content scripts run at `document_end` to ensure DOM is fully loaded

## Key Files & Their Purposes

| File | Purpose |
|------|---------|
| `manifest.json` | Extension configuration, permissions, entry points |
| `popup.html` | User interface layout (buttons, input fields, textarea) |
| `popup.js` | UI logic, webhook URL management, data send handlers |
| `content.js` | Page scraping logic, data extraction from TikTok |
| `background.js` | Extension icon click handling, webhook notifications |
| `notification.js` | Toast notification system (referenced in manifest) |
| `README.md` | User-facing documentation |
| `INSTALACION.md` | Installation guide for users |

## Common Development Tasks

### Installing the Extension Locally
1. Open `chrome://extensions/` in Chrome
2. Enable "Developer mode" (top right)
3. Click "Load unpacked"
4. Select this repository directory

### Testing Analytics Scraping
1. Navigate to `https://www.tiktok.com/creator/analytics`
2. Click on any video to view its analytics page
3. Click the extension icon or popup button to trigger scraping
4. Check browser console (F12) for debug logs with `[TikTok Scraper]` prefix

### Debugging Extraction Issues
- If data isn't being extracted correctly, it usually means TikTok changed their HTML structure
- Open DevTools (F12) on the analytics page and inspect elements to find updated selectors
- Update CSS selectors in `content.js` (around lines 68-147)
- Alternatively, update regex patterns for text-based matching (fallback strategy)

### Updating Webhook Endpoints
- Hardcoded webhook in `popup.js` (line 90): `https://flows.lemonsushi.com/webhook/ttchop_ttAnalytics`
- Hardcoded webhook in `background.js` (line 2): Same endpoint
- Users can also input custom webhook URLs in the UI

### Adding New Metrics
1. Add new data field to the `data` object in `content.js` (around line 40)
2. Implement extraction logic (query selectors or regex patterns)
3. Add console logging for debugging
4. Test on TikTok analytics page

## Data Structure

The extension extracts and sends different JSON structures depending on the page type:

### Video Analytics Data

```javascript
{
  timestamp: ISO string,
  videoId: string,
  username: string,
  publicUrl: string,
  videoViews: string,
  estimatedEarnings: string,
  totalPlayTime: string,
  averageWatchTime: string,
  watchedFullVideo: number (%),
  newFollowers: number,
  likes: number,
  comments: number,
  shares: number,
  saved: number,
  retentionInfo: string,
  postedOn: string,
  updatedOn: string,
  pageUrl: string
}
```

### Product Data (TikTok Shop)

```javascript
{
  title: string,                          // Product title extracted from h1/h2
  timestamp: ISO string,                  // Scraping timestamp
  type: 'product',

  price: {
    current: string,                      // Current price with currency symbol
    original: string || null,             // Original/strikethrough price
    discount: string || null              // Discount percentage (e.g., "20%")
  },

  social_proof: {
    rating: string || null,               // Rating as decimal (e.g., "4.5")
    reviews_count: string || null,        // Number of reviews
    sales_volume: string || null          // Sales count (e.g., "1.2K sold")
  },

  seller_info: {
    name: string || null                  // Seller name from "Sold by" text
  },

  variants: {
    // Dynamic object where keys are variant names and values are arrays
    // Example: { "Color": ["Red", "Blue"], "Size": ["S", "M", "L"] }
  },

  marketing_points: string[],             // Array of feature/description bullets

  media: string[],                        // Array of product image URLs

  source_url: string                      // Page URL where data was extracted
}
```

## Important Notes

- The extension only works on authenticated TikTok Studio pages
- CSS selectors in `content.js` are fragile and may break if TikTok updates their site
- Two webhook endpoints are hardcoded; consider making them configurable via settings
- The extension uses both Chrome storage API and localStorage for fallback compatibility
- All main functionality includes extensive console logging with `[TikTok Scraper]` prefix for debugging

## Storage & Persistence

- Webhook URL is saved to Chrome's local storage via `chrome.storage.local`
- Fallback to `localStorage` for environments where Chrome storage isn't available
- Storage key: `webhookUrl`
