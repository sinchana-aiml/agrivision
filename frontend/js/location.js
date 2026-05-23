/**
 * AgriVision Location Service
 * Google Maps + Geocoding + Places + Routes API
 */

const GOOGLE_API_KEY = "AIzaSyBgDbBWN9erHD47IHX51b_ZHdIs7jA0Jhg";

let googleMap           = null;
let farmerMarker        = null;
let officeMarker        = null;
let directionsRenderer  = null;
let farmerLatLng        = null;
let nearestOffice       = null;

// ── Init Map ───────────────────────────────────────────────────────────
function initMap() {
    const mapEl = document.getElementById("google-map");
    if (!mapEl || typeof google === "undefined") return;

    googleMap = new google.maps.Map(mapEl, {
        center: { lat: 20.5937, lng: 78.9629 },
        zoom: 5,
        mapTypeId: "roadmap",
        streetViewControl: false,
        mapTypeControl: false,
        fullscreenControl: true,
        zoomControl: true,
    });

    directionsRenderer = new google.maps.DirectionsRenderer({
        suppressMarkers: true,   // we use custom markers
        polylineOptions: {
            strokeColor: "#2d7a4f",
            strokeWeight: 5,
            strokeOpacity: 0.85
        }
    });
    directionsRenderer.setMap(googleMap);
}

const LocationService = {

    // ── 1. Get GPS coords ──────────────────────────────────────────────
    getCurrentLocation() {
        return new Promise((resolve, reject) => {
            if (!navigator.geolocation) {
                reject(new Error("Geolocation not supported."));
                return;
            }
            navigator.geolocation.getCurrentPosition(
                (pos) => resolve({
                    latitude:  pos.coords.latitude,
                    longitude: pos.coords.longitude,
                    accuracy:  pos.coords.accuracy
                }),
                (err) => {
                    const msgs = {
                        1: "Location permission denied.",
                        2: "Location unavailable.",
                        3: "Location request timed out."
                    };
                    reject(new Error(msgs[err.code] || "Failed to acquire location."));
                },
                { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 }
            );
        });
    },

    // ── 2. Pin farmer on map (red marker) + geocode + auto find office ─
    async pinOnMap(latitude, longitude) {
        if (!googleMap || typeof google === "undefined") return;

        farmerLatLng = new google.maps.LatLng(latitude, longitude);

        // Remove old markers
        if (farmerMarker) farmerMarker.setMap(null);
        if (officeMarker) officeMarker.setMap(null);

        googleMap.setCenter(farmerLatLng);
        googleMap.setZoom(15);

        // Red farmer marker (standard Google red pin)
        farmerMarker = new google.maps.Marker({
            position:  farmerLatLng,
            map:       googleMap,
            title:     "Your Farm Location",
            animation: google.maps.Animation.DROP,
            icon: {
                url: "https://maps.google.com/mapfiles/ms/icons/red-dot.png",
                scaledSize: new google.maps.Size(40, 40)
            }
        });

        // Accuracy circle
        new google.maps.Circle({
            map:           googleMap,
            center:        farmerLatLng,
            radius:        80,
            fillColor:     "#ef4444",
            fillOpacity:   0.08,
            strokeColor:   "#ef4444",
            strokeWeight:  1.5
        });

        // Reverse geocode address
        const address = await this._reverseGeocode(latitude, longitude);
        const addrEl  = document.getElementById("gis-address");
        if (addrEl) addrEl.textContent = address || `${latitude.toFixed(5)}, ${longitude.toFixed(5)}`;

        // Farmer info window
        const infoWindow = new google.maps.InfoWindow({
            content: `
                <div style="font-family:'Outfit',sans-serif;padding:6px 8px;font-size:13px;color:#0f2318;max-width:220px;">
                    <strong style="color:#dc2626;">📍 Your Farm Location</strong><br>
                    <span style="font-size:11px;color:#3a5c47;line-height:1.5;">${address || ""}</span><br>
                    <span style="font-family:monospace;font-size:10px;color:#7a9e8a;">
                        ${latitude.toFixed(6)}, ${longitude.toFixed(6)}
                    </span>
                </div>`
        });
        farmerMarker.addListener("click", () => infoWindow.open(googleMap, farmerMarker));
        infoWindow.open(googleMap, farmerMarker);

        // Auto-find nearest office
        this.findNearestOffice();
    },

    // ── 3. Reverse geocode ─────────────────────────────────────────────
    async _reverseGeocode(lat, lng) {
        try {
            const res  = await fetch(
                `https://maps.googleapis.com/maps/api/geocode/json?latlng=${lat},${lng}&key=${GOOGLE_API_KEY}`
            );
            const data = await res.json();
            if (data.results && data.results.length > 0) {
                return data.results[0].formatted_address;
            }
        } catch (e) { console.warn("Geocoding failed:", e); }
        return null;
    },

    // ── 4. Find nearest agriculture office ────────────────────────────
    findNearestOffice() {
        if (!farmerLatLng || typeof google === "undefined") return;

        const btn = document.getElementById("find-office-btn");
        if (btn) { btn.textContent = "🔍 Searching..."; btn.disabled = true; }

        const service = new google.maps.places.PlacesService(googleMap);

        service.nearbySearch({
            location: farmerLatLng,
            rankBy:   google.maps.places.RankBy.DISTANCE,
            keyword:  "agriculture office krishi vigyan kendra government"
        }, (results, status) => {
            if (btn) { btn.textContent = "🏛️ Find Nearest Agriculture Office"; btn.disabled = false; }

            if (status === google.maps.places.PlacesServiceStatus.OK && results.length > 0) {
                this._showOffice(results[0]);
            } else {
                // broader fallback
                service.nearbySearch({
                    location: farmerLatLng,
                    radius:   25000,
                    keyword:  "krishi department agriculture"
                }, (r2, s2) => {
                    if (s2 === google.maps.places.PlacesServiceStatus.OK && r2.length > 0) {
                        this._showOffice(r2[0]);
                    } else {
                        document.getElementById("office-name").textContent     = "⚠️ No office found nearby";
                        document.getElementById("office-address").textContent  = "Try searching on Google Maps directly.";
                        document.getElementById("office-distance").textContent = "";
                        document.getElementById("office-result").style.display = "block";
                    }
                });
            }
        });
    },

    // ── Show office on map + card ──────────────────────────────────────
    _showOffice(place) {
        nearestOffice = place;
        const loc     = place.geometry.location;

        // Blue office marker
        if (officeMarker) officeMarker.setMap(null);
        officeMarker = new google.maps.Marker({
            position:  loc,
            map:       googleMap,
            title:     place.name,
            animation: google.maps.Animation.DROP,
            icon: {
                url: "https://maps.google.com/mapfiles/ms/icons/blue-dot.png",
                scaledSize: new google.maps.Size(40, 40)
            }
        });

        const officeInfo = new google.maps.InfoWindow({
            content: `
                <div style="font-family:'Outfit',sans-serif;padding:6px 8px;font-size:13px;color:#0f2318;max-width:200px;">
                    <strong style="color:#1d4ed8;">🏛️ ${place.name}</strong><br>
                    <span style="font-size:11px;color:#3a5c47;">${place.vicinity || ""}</span>
                </div>`
        });
        officeMarker.addListener("click", () => officeInfo.open(googleMap, officeMarker));

        // Straight-line distance
        const dist = this._haversineDistance(
            farmerLatLng.lat(), farmerLatLng.lng(),
            loc.lat(), loc.lng()
        );

        // Update result card
        document.getElementById("office-name").textContent     = "🏛️ " + place.name;
        document.getElementById("office-address").textContent  = "📍 " + (place.vicinity || "");
        document.getElementById("office-distance").textContent = `📏 ~${dist} km away (straight line)`;
        document.getElementById("office-result").style.display = "block";

        // Fit both markers in view
        const bounds = new google.maps.LatLngBounds();
        bounds.extend(farmerLatLng);
        bounds.extend(loc);
        googleMap.fitBounds(bounds);

        // Auto get road directions
        this.getDirections();
    },

    // ── 5. Get shortest road route ─────────────────────────────────────
    getDirections() {
        if (!farmerLatLng || !nearestOffice || typeof google === "undefined") return;

        const directionsService = new google.maps.DirectionsService();

        directionsService.route({
            origin:      farmerLatLng,
            destination: nearestOffice.geometry.location,
            travelMode:  google.maps.TravelMode.DRIVING,
            provideRouteAlternatives: false
        }, (result, status) => {
            if (status === "OK") {
                directionsRenderer.setDirections(result);
                const leg = result.routes[0].legs[0];
                document.getElementById("office-distance").textContent =
                    `🛣️ ${leg.distance.text} by road  ·  ⏱️ ${leg.duration.text} drive`;
            } else {
                console.warn("Directions failed:", status);
            }
        });
    },

    // ── 6. Report to backend ───────────────────────────────────────────
    async updateClaimLocation(claimId, latitude, longitude) {
        try {
            const res = await fetch("/add_location", {
                method:  "POST",
                headers: { "Content-Type": "application/json" },
                body:    JSON.stringify({ id: claimId, latitude, longitude })
            });
            if (!res.ok) throw new Error("Failed to update location.");
            return true;
        } catch (e) {
            console.error("Location reporting error:", e);
            return false;
        }
    },

    // ── Haversine straight-line distance ──────────────────────────────
    _haversineDistance(lat1, lon1, lat2, lon2) {
        const R  = 6371;
        const dL = (lat2 - lat1) * Math.PI / 180;
        const dN = (lon2 - lon1) * Math.PI / 180;
        const a  = Math.sin(dL/2) ** 2 +
                   Math.cos(lat1 * Math.PI/180) * Math.cos(lat2 * Math.PI/180) *
                   Math.sin(dN/2) ** 2;
        return (R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))).toFixed(1);
    }
};

window.LocationService = LocationService;
window.addEventListener("load", () => {
    initMap();
    // Ask for location immediately on farmer page load
    const role = new URLSearchParams(window.location.search).get("role");
    if (role === "farmer") {
        const statusEl = document.getElementById("gps-coords");
        if (statusEl) statusEl.textContent = "Requesting location...";
        LocationService.getCurrentLocation()
            .then(coords => {
                document.getElementById("gis-lat").textContent = coords.latitude.toFixed(6);
                document.getElementById("gis-lon").textContent = coords.longitude.toFixed(6);
                if (statusEl) {
                    statusEl.textContent = "✅ Location Locked";
                    statusEl.style.color = "#16a34a";
                }
                LocationService.pinOnMap(coords.latitude, coords.longitude);
            })
            .catch(err => {
                if (statusEl) {
                    statusEl.textContent = "❌ " + err.message;
                    statusEl.style.color = "#dc2626";
                }
            });
    }
});
