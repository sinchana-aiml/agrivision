/**
 * AgriVision Administrative Officer Dashboard
 * Handles loading claims list from server, approving/rejecting, and updating key metrics.
 */

const DashboardService = {
    // Current in-memory list of claims rendered
    claimsList: [],

    /**
     * Helper to compute government insurance compensation payout.
     * @param {number} damagePercent - Estimated damage percentage (0-100)
     * @returns {number} Compensation amount in ₹
     */
    calculatePmfbyPayout(damagePercent) {
        if (damagePercent >= 80) return 50000;
        if (damagePercent >= 50) return 30000;
        if (damagePercent >= 30) return 15000;
        return 0;
    },

    /**
     * Fetches fresh claim records from backend API and re-renders components.
     */
    async loadClaims() {
        try {
            const response = await fetch("/dashboard");
            if (!response.ok) throw new Error("Failed to fetch claims list.");
            
            this.claimsList = await response.json();
            this.renderTable();
            this.updateMetrics();
        } catch (error) {
            console.error("Dashboard load error:", error);
        }
    },

    /**
     * Renders claim records into HTML table format.
     */
    renderTable() {
        const table = document.getElementById("dashboard");
        if (!table) return;

        // Clear all except header row
        while (table.rows.length > 1) {
            table.deleteRow(1);
        }

        if (this.claimsList.length === 0) {
            const row = table.insertRow();
            row.innerHTML = `<td colspan="8" style="color: #94a3b8; text-align: center; padding: 2rem;">No insurance claims registered yet. Use the upload panel to analyze crops.</td>`;
            return;
        }

        // Populate records in reverse order (newest first)
        const sortedClaims = [...this.claimsList].reverse();

        sortedClaims.forEach(claim => {
            const row = table.insertRow();
            
            // Build Status Badge CSS
            let statusBadge = "badge-secondary";
            if (claim.status === "Approved") statusBadge = "badge-success";
            if (claim.status === "Rejected") statusBadge = "badge-danger";
            if (claim.status === "Pending") statusBadge = "badge-warning";

            // Build Prediction Badge CSS
            let resultBadge = "badge-secondary";
            if (claim.result === "Healthy") resultBadge = "badge-success";
            if (claim.result === "Damaged") resultBadge = "badge-danger";

            // Build Actions
            let actionHtml = `-`;
            if (claim.status === "Pending") {
                actionHtml = `
                    <div class="action-btn-group">
                        <button class="table-btn approve" onclick="DashboardService.approveClaim(${claim.id}, ${claim.damage})">Approve</button>
                        <button class="table-btn reject" onclick="DashboardService.rejectClaim(${claim.id})">Reject</button>
                    </div>
                `;
            }

            row.innerHTML = `
                <td><strong>#${claim.id}</strong></td>
                <td>${claim.crop}</td>
                <td><strong>${claim.damage}%</strong></td>
                <td><span class="badge ${resultBadge}">${claim.result}</span></td>
                <td class="location-cell" style="font-family: monospace; font-size: 0.8rem;">${claim.location}</td>
                <td><span class="badge ${statusBadge}">${claim.status}</span></td>
                <td><strong>₹${claim.amount.toLocaleString()}</strong></td>
                <td>${actionHtml}</td>
            `;
        });
    },

    /**
     * Summarizes aggregate claims details and populates KPI status boards.
     */
    updateMetrics() {
        const totalCount = this.claimsList.length;
        const pendingCount = this.claimsList.filter(c => c.status === "Pending").length;
        const totalAmount = this.claimsList
            .filter(c => c.status === "Approved")
            .reduce((sum, c) => sum + c.amount, 0);

        const avgDamage = totalCount > 0 
            ? (this.claimsList.reduce((sum, c) => sum + c.damage, 0) / totalCount).toFixed(1)
            : "0.0";

        // Update elements if they exist
        const totalEl = document.getElementById("metric-total");
        const pendingEl = document.getElementById("metric-pending");
        const amountEl = document.getElementById("metric-amount");
        const avgEl = document.getElementById("metric-avg");

        if (totalEl) totalEl.innerText = totalCount;
        if (pendingEl) pendingEl.innerText = pendingCount;
        if (amountEl) amountEl.innerText = `₹${totalAmount.toLocaleString()}`;
        if (avgEl) avgEl.innerText = `${avgDamage}%`;
    },

    /**
     * Submits an approval action to the server.
     * @param {number} claimId 
     * @param {number} damagePercent 
     */
    async approveClaim(claimId, damagePercent) {
        const payout = this.calculatePmfbyPayout(damagePercent);
        try {
            const response = await fetch("/sanction", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    id: claimId,
                    amount: payout,
                    status: "Approved"
                })
            });

            if (!response.ok) throw new Error("Failed to sanction claim.");
            
            console.log(`Claim #${claimId} approved with ₹${payout} payout.`);
            await this.loadClaims();
        } catch (error) {
            alert(`Approval failed: ${error.message}`);
        }
    },

    /**
     * Submits a rejection action to the server.
     * @param {number} claimId 
     */
    async rejectClaim(claimId) {
        if (!confirm(`Are you sure you want to reject Claim #${claimId}?`)) return;

        try {
            const response = await fetch("/sanction", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    id: claimId,
                    amount: 0,
                    status: "Rejected"
                })
            });

            if (!response.ok) throw new Error("Failed to update status.");
            
            console.log(`Claim #${claimId} rejected.`);
            await this.loadClaims();
        } catch (error) {
            alert(`Rejection failed: ${error.message}`);
        }
    }
};

// Auto-run dashboard on load
window.DashboardService = DashboardService;
document.addEventListener("DOMContentLoaded", () => {
    DashboardService.loadClaims();
});
