/**
 * AgriVision Farmer Image Upload Controller
 * Integrates image selection, preview, Flask CNN prediction uploads, and triggers GIS geotagging.
 */

document.addEventListener("DOMContentLoaded", () => {
    const dropZone = document.getElementById("drop-zone");
    const fileInput = document.getElementById("image");
    const cropSelect = document.getElementById("crop");
    const analyzeBtn = document.getElementById("analyze-btn");
    const previewContainer = document.getElementById("preview-container");
    const imgPreview = document.getElementById("image-preview");
    const resultPanel = document.getElementById("result-panel");
    const gpsStatusText = document.getElementById("gps-coords");
    
    let activeFile = null;

    // =====================================================================
    // DRAG AND DROP HANDLERS
    // =====================================================================
    if (dropZone && fileInput) {
        dropZone.addEventListener("dragover", (e) => {
            e.preventDefault();
            dropZone.classList.add("dragover");
        });

        dropZone.addEventListener("dragleave", () => {
            dropZone.classList.remove("dragover");
        });

        dropZone.addEventListener("drop", (e) => {
            e.preventDefault();
            dropZone.classList.remove("dragover");
            
            if (e.dataTransfer.files.length > 0) {
                handleFileSelection(e.dataTransfer.files[0]);
            }
        });

        // Sync standard file clicks
        fileInput.addEventListener("change", (e) => {
            if (e.target.files.length > 0) {
                handleFileSelection(e.target.files[0]);
            }
        });
    }

    /**
     * Previews selected image and stores it locally.
     * @param {File} file 
     */
    function handleFileSelection(file) {
        if (!file.type.startsWith("image/")) {
            alert("Please upload a valid crop image file.");
            return;
        }

        activeFile = file;
        
        // Show in Preview
        const reader = new FileReader();
        reader.onload = (e) => {
            imgPreview.src = e.target.result;
            previewContainer.style.display = "block";
            analyzeBtn.disabled = false;
        };
        reader.readAsDataURL(file);
    }

    /**
     * Resets the file upload area
     */
    window.resetUpload = function() {
        activeFile = null;
        fileInput.value = "";
        previewContainer.style.display = "none";
        analyzeBtn.disabled = true;
        resultPanel.style.display = "none";
        
        // Reset analysis button styling
        analyzeBtn.innerHTML = `<span>🔍</span> Analyze Crop Health`;
    };

    // =====================================================================
    // CORE ANALYSIS REQUEST (FLASK + GEOTAGGING INTEGRATION)
    // =====================================================================
    if (analyzeBtn) {
        analyzeBtn.addEventListener("click", async () => {
            if (!activeFile) return;

            // Update UI State: Loading
            analyzeBtn.disabled = true;
            analyzeBtn.innerHTML = `<span class="spinner"></span> Analyzing crop...`;
            resultPanel.style.display = "none";

            const formData = new FormData();
            formData.append("image", activeFile);
            formData.append("crop", cropSelect.value);

            try {
                // 1. Submit Image to CNN prediction API
                const response = await fetch("/analyze", {
                    method: "POST",
                    body: formData
                });

                if (!response.ok) {
                    const err = await response.json();
                    throw new Error(err.error || "Failed to process image.");
                }

                const data = await response.json();
                
                // 2. Render Prediction Output Card
                renderAnalysisResults(data.result, data.damage);
                
                // 3. Initiate Geolocation Capture for Verification
                if (gpsStatusText) gpsStatusText.innerText = "Acquiring secure GPS lock...";
                
                try {
                    const coords = await window.LocationService.getCurrentLocation();
                    
                    // Display details in GIS panel
                    document.getElementById("gis-lat").innerText = coords.latitude.toFixed(6);
                    document.getElementById("gis-lon").innerText = coords.longitude.toFixed(6);
                    gpsStatusText.innerText = `✅ Verified: ${coords.latitude.toFixed(4)}, ${coords.longitude.toFixed(4)}`;
                    gpsStatusText.style.color = "#16a34a";

                    // Pin on real Google Map
                    window.LocationService.pinOnMap(coords.latitude, coords.longitude);

                    // Send coordinates to link with the newly created claim
                    await window.LocationService.updateClaimLocation(
                        data.claim_id,
                        coords.latitude,
                        coords.longitude
                    );

                } catch (locationError) {
                    console.warn("Geotagging failed:", locationError);
                    if (gpsStatusText) gpsStatusText.innerText = "Verification failed (GPS offline)";
                    document.getElementById("gis-lat").innerText = "Offline";
                    document.getElementById("gis-lon").innerText = "Offline";
                }

                // 4. Reload the Admin Officer Dashboard to display the new claim live
                if (window.DashboardService) {
                    window.DashboardService.loadClaims();
                }

            } catch (error) {
                alert(`Analysis Error: ${error.message}`);
            } finally {
                // Reset Button
                analyzeBtn.disabled = false;
                analyzeBtn.innerHTML = `<span>🔍</span> Re-Analyze Crop Health`;
            }
        });
    }

    /**
     * Renders styling and data inside the results card panel.
     * @param {string} result - "Healthy" | "Damaged"
     * @param {number} damagePercent 
     */
    function renderAnalysisResults(result, damagePercent) {
        resultPanel.className = "result-panel"; // reset class
        
        const titleEl = document.getElementById("panel-result-title");
        const detailsEl = document.getElementById("panel-result-details");

        if (result === "Healthy") {
            resultPanel.classList.add("healthy");
            titleEl.innerHTML = `<span>✓</span> Crop Classified: Healthy`;
            detailsEl.innerHTML = `Model prediction details show highly stable features with only <strong>${damagePercent}%</strong> estimated leaf damage. Claim sanction recommended for decline.`;
        } else {
            resultPanel.classList.add("damaged");
            titleEl.innerHTML = `<span>✗</span> Crop Classified: Damaged`;
            detailsEl.innerHTML = `Significant structural damage detected: <strong>${damagePercent}%</strong>. This claim qualifies under standard PMFBY guidelines.`;
        }

        resultPanel.style.display = "block";
    }
});
