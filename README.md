# Surf Conditions PWA

A Progressive Web App that displays real-time surf conditions with animated wave visualization and push notifications.

## Features

- 🌊 Real-time surf condition data
- 📊 Animated sine wave visualization matching swell data
- 🔔 Push notifications for good surf conditions
- 📱 Progressive Web App (installable)
- 🎨 Modern, responsive design
- ⚡ Offline support with service worker
- 🔄 Auto-refresh every 5 minutes

## API Integration

The app fetches data from:
https://c0cgocok00o40c48c40k8g04.mttwhlly.cc/surfability

Expected JSON format:
```json
{
  "location": "St. Augustine, FL",
  "timestamp": "2025-06-05T17:23:04.387Z",
  "surfable": true,
  "rating": "Marginal",
  "score": 45,
  "goodSurfDuration": "Good surf for most of the day!",
  "details": {
    "wave_height_ft": 1.5,
    "wave_period_sec": 6,
    "swell_direction_deg": 90,
    "wind_direction_deg": 117,
    "wind_speed_kts": 22.9,
    "tide_state": "High",
    "data_source": "Weather API + defaults"
  }
}
```

## Technologies Used

- Vanilla JavaScript (ES6+)
- Canvas API for wave animation
- Service Workers for PWA functionality
- Web Notifications API
- CSS Grid and Flexbox
- Modern CSS features (backdrop-filter, custom properties)

## Browser Support

- Chrome/Edge 88+
- Firefox 87+
- Safari 14+
- Mobile browsers with PWA support

## Development
To run locally:
```bash
bash# Using Python
python -m http.server 8000
```

## Usage
You'll need [Caddy](https://caddyserver.com/) installed.

Then run the following command from `/src` directory to serve the app over HTTPS:

```bash
caddy run
```