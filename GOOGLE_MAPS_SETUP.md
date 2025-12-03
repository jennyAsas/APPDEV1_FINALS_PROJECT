# Google Maps Setup Instructions

## Overview

The application has been upgraded to use Google Maps instead of OpenStreetMap for better user experience and interactive features.

## Features Added

✅ **Google Maps Integration** - Professional, user-friendly map interface
✅ **Clickable Incident Markers** - Color-coded markers based on priority (Red=High, Orange=Medium, Green=Low)
✅ **Interactive Info Windows** - Click markers to see incident details
✅ **View Full Report Button** - Direct navigation to detailed incident reports
✅ **Animated High-Priority Markers** - Bouncing animation for urgent incidents
✅ **Click to Report** - Click anywhere on the map to create a new incident report

## Setup Instructions

### 1. Get a Google Maps API Key

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project or select an existing one
3. Enable the **Maps JavaScript API**:
   - Go to "APIs & Services" > "Library"
   - Search for "Maps JavaScript API"
   - Click "Enable"

4. Create an API Key:
   - Go to "APIs & Services" > "Credentials"
   - Click "Create Credentials" > "API Key"
   - Copy the generated API key

5. (Optional but Recommended) Restrict the API Key:
   - Click on the API key you just created
   - Under "Application restrictions", select "HTTP referrers"
   - Add your domain (e.g., `localhost:4200/*` for development)
   - Under "API restrictions", select "Restrict key"
   - Choose "Maps JavaScript API"

### 2. Add API Key to Your Application

Open `src/index.html` and replace `YOUR_GOOGLE_MAPS_API_KEY` with your actual API key:

```html
<script src="https://maps.googleapis.com/maps/api/js?key=YOUR_ACTUAL_API_KEY_HERE"></script>
```

### 3. Test the Application

```bash
npm start
```

Navigate to the map view and you should see:

- A fully rendered Google Map centered on Baguio
- Color-coded markers for incidents
- Clickable markers that show incident details
- A "View Full Report" button in each info window

## Map Features

### Marker Colors

- 🔴 **Red** - High Priority Incidents (with bounce animation)
- 🟠 **Orange** - Medium Priority Incidents
- 🟢 **Green** - Low Priority Incidents

### Interactions

- **Click a marker** - Opens an info window with incident details
- **Click "View Full Report"** - Navigates to the full incident report
- **Click anywhere on map** - Start creating a new incident report (requires login)
- **Zoom/Pan** - Standard Google Maps controls

### Info Window Content

Each marker displays:

- Incident description
- Current status
- Priority level (color-coded)
- Timestamp
- Reporter name (if available)
- "View Full Report" button

## Troubleshooting

### Map not loading?

1. Check browser console for errors
2. Verify your API key is correctly placed in `index.html`
3. Ensure "Maps JavaScript API" is enabled in Google Cloud Console
4. Check if there are any billing issues in your Google Cloud account

### Markers not showing?

1. Check if incidents exist in your Firestore database
2. Verify the `location.lat` and `location.lng` fields are populated
3. Check browser console for any errors

### API Key errors?

- Make sure you've enabled the Maps JavaScript API
- Check if your API key has the correct restrictions
- Verify billing is enabled (Google Maps requires a billing account)

## Alternative: Keep OpenStreetMap (Leaflet)

If you prefer to keep using OpenStreetMap, the original Leaflet implementation is still available. The fix was to add the Leaflet CSS to `angular.json`:

```json
"styles": [
  "node_modules/bootstrap/dist/css/bootstrap.min.css",
  "node_modules/leaflet/dist/leaflet.css",  // This fixes the rendering
  "src/styles.css"
]
```

## Cost Considerations

Google Maps offers:

- **$200 monthly credit** (free tier)
- **28,000+ map loads per month** for free
- Pay-as-you-go pricing after that

For most applications, this is sufficient for free usage.

## Next Steps

1. Get your Google Maps API key
2. Add it to `src/index.html`
3. Run the application
4. Test the interactive features
5. (Optional) Add more customizations like custom marker icons or map styles

Need help? Check the [Google Maps JavaScript API documentation](https://developers.google.com/maps/documentation/javascript).
