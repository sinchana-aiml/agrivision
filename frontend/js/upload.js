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
    
    // Live Camera elements
    const cameraZone = document.getElementById("camera-zone");
    const cameraContainer = document.getElementById("camera-container");
    const cameraStream = document.getElementById("camera-stream");
    const captureBtn = document.getElementById("capture-btn");
    const closeCameraBtn = document.getElementById("close-camera-btn");
    const cameraErrorMsg = document.getElementById("camera-error-msg");
    const uploadOptionsGrid = document.getElementById("upload-options-grid");

    let activeFile = null;
    let activeStream = null;

    // =====================================================================
    // CAMERA EVENT HANDLERS & API LOGIC
    // =====================================================================
    if (cameraZone) {
        cameraZone.addEventListener("click", () => {
            startCamera();
        });
    }

    if (captureBtn) {
        captureBtn.addEventListener("click", () => {
            capturePhoto();
        });
    }

    if (closeCameraBtn) {
        closeCameraBtn.addEventListener("click", () => {
            stopCamera();
        });
    }

    /**
     * Starts the device camera stream and handles browser media access permissions.
     */
    async function startCamera() {
        if (cameraErrorMsg) {
            cameraErrorMsg.style.display = "none";
            cameraErrorMsg.innerText = "";
        }

        try {
            // Check browser mediaDevices support
            if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
                throw new Error("Your browser or device does not support camera access.");
            }

            // Hide main upload options and reveal live camera viewfinder
            if (uploadOptionsGrid) uploadOptionsGrid.style.display = "none";
            if (cameraContainer) cameraContainer.style.display = "flex";

            // Optimize constraints for back-facing high quality camera
            const constraints = {
                video: {
                    facingMode: { ideal: "environment" },
                    width: { ideal: 1280 },
                    height: { ideal: 960 }
                },
                audio: false
            };

            activeStream = await navigator.mediaDevices.getUserMedia(constraints);
            
            if (cameraStream) {
                cameraStream.srcObject = activeStream;
                cameraStream.onloadedmetadata = () => {
                    cameraStream.play().catch(e => console.error("Camera play failure:", e));
                };
            }

        } catch (error) {
            console.error("Camera access error:", error);
            let userMessage = "Could not access the camera. ";
            if (error.name === "NotAllowedError" || error.name === "PermissionDeniedError") {
                userMessage += "Please grant camera permission in your browser or system settings.";
            } else if (error.name === "NotFoundError" || error.name === "DevicesNotFoundError") {
                userMessage += "No camera hardware detected on this device.";
            } else {
                userMessage += error.message || "Please check device capabilities.";
            }

            if (cameraErrorMsg) {
                cameraErrorMsg.innerText = userMessage;
                cameraErrorMsg.style.display = "block";
            }

            if (uploadOptionsGrid) uploadOptionsGrid.style.display = "grid";
            if (cameraContainer) cameraContainer.style.display = "none";
            
            alert(userMessage);
        }
    }

    /**
     * Captures current stream frame from the video tag, maps it to a canvas,
     * converts it to a standard JPEG image blob, and passes it to the preview.
     */
    function capturePhoto() {
        if (!activeStream || !cameraStream) return;

        const canvas = document.createElement("canvas");
        const videoWidth = cameraStream.videoWidth || 640;
        const videoHeight = cameraStream.videoHeight || 480;

        canvas.width = videoWidth;
        canvas.height = videoHeight;

        const ctx = canvas.getContext("2d");
        ctx.drawImage(cameraStream, 0, 0, videoWidth, videoHeight);

        // Convert canvas image into high quality JPEG blob
        canvas.toBlob((blob) => {
            if (!blob) {
                alert("Failed to capture picture. Please try again.");
                return;
            }

            // Wrap blob in standard File object matching traditional file uploads
            const file = new File([blob], "camera_capture.jpg", {
                type: "image/jpeg",
                lastModified: Date.now()
            });

            activeFile = file;

            // Load captured stream into preview container
            if (imgPreview) {
                imgPreview.src = URL.createObjectURL(blob);
            }
            if (previewContainer) {
                previewContainer.style.display = "block";
            }
            if (analyzeBtn) {
                analyzeBtn.disabled = false;
            }

            // Close stream and release device camera resources
            stopCamera();

        }, "image/jpeg", 0.9);
    }

    /**
     * Stop active camera stream tracks and release hardware lock.
     */
    function stopCamera() {
        if (activeStream) {
            activeStream.getTracks().forEach(track => track.stop());
            activeStream = null;
        }
        if (cameraStream) {
            cameraStream.srcObject = null;
        }
        if (cameraContainer) {
            cameraContainer.style.display = "none";
        }
        if (uploadOptionsGrid) {
            uploadOptionsGrid.style.display = "grid";
        }
    }

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
     * Resets the file upload area and releases active camera locks.
     */
    window.resetUpload = function() {
        stopCamera();
        activeFile = null;
        if (fileInput) fileInput.value = "";
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
                    // Plant validation failure — show a styled inline warning
                    // panel instead of a disruptive raw alert() popup.
                    if (err.error === "invalid_plant") {
                        renderInvalidPlantMessage(err.message);
                        return;
                    }
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
     * Renders a styled amber warning panel when the uploaded image fails
     * plant validation (non-plant image detected by the backend).
     * Uses the existing result-panel element — no new DOM nodes needed.
     * @param {string} message - User-friendly message returned by the backend.
     */
    function renderInvalidPlantMessage(message) {
        resultPanel.className = "result-panel invalid"; // amber style
        document.getElementById("panel-result-title").innerHTML =
            `<span>⚠️</span> Invalid Image Detected`;
        document.getElementById("panel-result-details").innerHTML = message;
        resultPanel.style.display = "block";
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
