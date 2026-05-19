/**
 * AgriVision Geolocation Utility Services
 * Handles HTML5 GPS acquisition and reports coordinates to the Flask backend.
 */

const LocationService = {
    /**
     * Retrieves current GPS coordinates from the browser.
     * @returns {Promise<{latitude: number, longitude: number}>}
     */
    getCurrentLocation() {
        return new Promise((resolve, reject) => {
            if (!navigator.geolocation) {
                reject(new Error("Geolocation is not supported by your browser."));
                return;
            }

            const options = {
                enableHighAccuracy: true,
                timeout: 10000,
                maximumAge: 0
            };

            navigator.geolocation.getCurrentPosition(
                (position) => {
                    resolve({
                        latitude: position.coords.latitude,
                        longitude: position.coords.longitude
                    });
                },
                (error) => {
                    let msg = "Failed to acquire location.";
                    switch (error.code) {
                        case error.PERMISSION_DENIED:
                            msg = "User denied Geolocation permission.";
                            break;
                        case error.POSITION_UNAVAILABLE:
                            msg = "Location information is unavailable.";
                            break;
                        case error.TIMEOUT:
                            msg = "Request to get user location timed out.";
                            break;
                    }
                    reject(new Error(msg));
                },
                options
            );
        });
    },

    /**
     * Reports GPS coordinates to Flask to update a specific claim record.
     * @param {number} claimId - The ID of the submitted claim.
     * @param {number} latitude - Latitude coordinate.
     * @param {number} longitude - Longitude coordinate.
     * @returns {Promise<boolean>}
     */
    async updateClaimLocation(claimId, latitude, longitude) {
        try {
            const response = await fetch("/add_location", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json"
                },
                body: JSON.stringify({
                    id: claimId,
                    latitude: latitude,
                    longitude: longitude
                })
            });

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.error || "Failed to update location on server.");
            }

            console.log(`Successfully pinned location for claim #${claimId}: ${latitude}, ${longitude}`);
            return true;
        } catch (error) {
            console.error("Location reporting error:", error);
            return false;
        }
    }
};

// Export to window object
window.LocationService = LocationService;
