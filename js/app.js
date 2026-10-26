/**
 * Main Application Controller for My Gold Melting Web App
 * Connects UI, Routing, Calculation Business Logic, IndexedDB, SessionManager, and i18n
 */

import { translations, setLanguage, getLanguage, t, applyTranslations } from './i18n.js';
import {
    calculateMelting,
    calculateJewelleryCost,
    calculateAlloyLoss,
    calculateStoneLoss,
    calculateGilletLoss,
    calculateRhodiumLoss,
    calculateTotalExpenses,
    format3Decimal,
    ADD_FINE_GOLD,
    ADD_PALO
} from './calculator.js';
import { SessionManager } from './session.js';
import { MeltingDao, JewelleryCostDao } from './db.js';

// App Config Constants
const APP_CONFIG = {
    VERSION: "1.0.0",
    AUTHOR: "Ujwal Anand (Evostackr)",
    EMAIL: "support@evostackr.in",
    WEBSITE: "https://www.evostackr.in/",
    CONTACT: "+91 62028 50596",
    PRIVACY_URL: "https://www.termsfeed.com/live/c756768f-a5ee-4451-bf0c-86baaffc8793"
};

// UI Elements & State
let currentRoute = "#/";
let activeJewelleryCostItem = null;

// Toast Utility
export function showToast(message, isKey = false) {
    const text = isKey ? t(message) : message;
    const toast = document.getElementById("toastMsg");
    if (!toast) return;
    toast.textContent = text;
    toast.classList.add("show");
    setTimeout(() => {
        toast.classList.remove("show");
    }, 2800);
}

// Router
function navigateTo(route) {
    window.location.hash = route;
}

function handleRoute() {
    const hash = window.location.hash || "#/";
    currentRoute = hash;

    document.querySelectorAll(".screen").forEach(s => s.classList.remove("active"));

    // Route matching
    let targetId = "screen-dashboard";
    if (hash === "#/" || hash === "#/dashboard") {
        targetId = "screen-dashboard";
        updateDashboardGreetings();
    } else if (hash === "#/melting") {
        targetId = "screen-melting";
    } else if (hash === "#/melting-history") {
        targetId = "screen-melting-history";
        loadMeltingHistory();
    } else if (hash === "#/jewellery-cost") {
        targetId = "screen-jewellery-cost";
        initJewelleryCostScreen();
    } else if (hash === "#/jewellery-history") {
        targetId = "screen-jewellery-history";
        loadJewelleryHistory();
    } else if (hash === "#/settings") {
        targetId = "screen-settings";
        updateSettingsLanguageDisplay();
    } else if (hash === "#/about") {
        targetId = "screen-about";
    } else if (hash === "#/privacy-policy") {
        targetId = "screen-privacy";
        loadPrivacyPolicy();
    } else {
        targetId = "screen-dashboard";
    }

    const targetElem = document.getElementById(targetId);
    if (targetElem) {
        targetElem.classList.add("active");
    }
}

// Dynamic Greeting (MainActivity.java lines 46-60)
function updateDashboardGreetings() {
    const hour = new Date().getHours();
    let greeting = "Good Morning";
    if (hour < 12) {
        greeting = "Good Morning";
    } else if (hour < 16) {
        greeting = "Good Afternoon";
    } else if (hour < 21) {
        greeting = "Good Evening";
    } else {
        greeting = "Good Night";
    }
    const elem = document.getElementById("lblGreetings");
    if (elem) elem.textContent = greeting;
}

// ==========================================================================
// Melting Activity Logic
// ==========================================================================
function setupMeltingEvents() {
    const btnCalc = document.getElementById("btnMeltingCalc");
    const btnClear = document.getElementById("btnMeltingClear");
    const txtWeight = document.getElementById("txtMeltingWeight");
    const txtTouch = document.getElementById("txtMeltingTouch");
    const txtOutput = document.getElementById("txtMeltingOutput");
    const resultBox = document.getElementById("meltingResultBox");
    const lblFinePalo = document.getElementById("lblAddPalo");
    const txtFinePalo = document.getElementById("txtAddPalo");
    const txtFinalWeight = document.getElementById("txtFinalWeight");

    btnCalc?.addEventListener("click", async () => {
        const res = calculateMelting(txtWeight.value, txtTouch.value, txtOutput.value);
        if (!res.success) {
            if (res.errorKey) {
                showToast(res.errorKey, true);
            } else if (res.errorMessage) {
                showToast(res.errorMessage, false);
            }
            return;
        }

        // Display results
        if (res.lblFineOrPalo === ADD_FINE_GOLD) {
            lblFinePalo.textContent = t("lblAddFineGold");
        } else {
            lblFinePalo.textContent = t("lblAddPalo");
        }
        txtFinePalo.textContent = `${res.valueFineOrPalo} G`;
        txtFinalWeight.textContent = `${res.finalWeight} G`;
        resultBox.classList.add("visible");

        // Save to Database
        try {
            await MeltingDao.insert({
                weight: res.weight,
                touch: res.touch,
                outputTouch: res.outputTouch,
                lblFineOrPalo: res.lblFineOrPalo,
                valueFineOrPalo: res.valueFineOrPalo,
                finalWeight: res.finalWeight,
                dateTime: res.dateTime
            });
        } catch (e) {
            console.error("Melting save error:", e);
        }
    });

    btnClear?.addEventListener("click", () => {
        txtWeight.value = "";
        txtTouch.value = "";
        txtOutput.value = "";
        resultBox.classList.remove("visible");
        txtWeight.focus();
    });
}

// Melting History Screen
async function loadMeltingHistory() {
    const container = document.getElementById("meltingHistoryList");
    const noData = document.getElementById("meltingNoData");
    if (!container) return;

    const list = await MeltingDao.getAll();
    container.innerHTML = "";

    if (!list || list.length === 0) {
        if (noData) noData.style.display = "flex";
        container.style.display = "none";
        return;
    }

    if (noData) noData.style.display = "none";
    container.style.display = "flex";

    list.forEach(item => {
        const card = document.createElement("div");
        card.className = "history-card";

        const labelText = (item.lblFineOrPalo === ADD_FINE_GOLD)
            ? t("lblAddFineGold")
            : (item.lblFineOrPalo === ADD_PALO ? t("lblAddPalo") : item.lblFineOrPalo);

        card.innerHTML = `
            <div class="history-card-header">${t("history")}${item.id}</div>
            <div class="history-grid-3">
                <div>
                    <div class="history-label">${t("lblWeight")}</div>
                    <div class="history-val">${item.weight || "0.0"}</div>
                </div>
                <div>
                    <div class="history-label">${t("lblTouch")}</div>
                    <div class="history-val">${item.touch || "0.0"}</div>
                </div>
                <div>
                    <div class="history-label">${t("lblOutputTouch")}</div>
                    <div class="history-val">${item.outputTouch || "0.0"}</div>
                </div>
            </div>
            <div class="history-grid-2">
                <div>
                    <div class="history-label">${labelText}</div>
                    <div class="history-val">${item.valueFineOrPalo || "0.000"}</div>
                </div>
                <div>
                    <div class="history-label">${t("lblFinalWeight")}</div>
                    <div class="history-val">${item.finalWeight || "0.000"}</div>
                </div>
            </div>
            <div class="history-date">${item.dateTime || ""}</div>
        `;

        card.addEventListener("click", () => {
            showConfirmDialog(t("lblDelete"), t("msg_delete_melting"), async () => {
                await MeltingDao.delete(item.id);
                loadMeltingHistory();
            });
        });

        container.appendChild(card);
    });
}

// ==========================================================================
// Jewellery Cost Screen Logic
// ==========================================================================
function initJewelleryCostScreen() {
    const txtGoldWeight = document.getElementById("txtCostGoldWeight");
    const txtMelting = document.getElementById("txtCostMelting");
    if (txtGoldWeight && SessionManager.getGoldWeight()) {
        txtGoldWeight.value = SessionManager.getGoldWeight();
    }
    if (txtMelting && SessionManager.getMelting()) {
        txtMelting.value = SessionManager.getMelting();
    }
}

function setupJewelleryCostEvents() {
    const txtItemName = document.getElementById("txtCostItemName");
    const txtGoldWeight = document.getElementById("txtCostGoldWeight");
    const txtADStone = document.getElementById("txtCostADStone");
    const txtMelting = document.getElementById("txtCostMelting");
    const txtCastingExpenses = document.getElementById("txtCostCastingExpenses");
    const btnCalc = document.getElementById("btnCostCalc");
    const btnClear = document.getElementById("btnCostClear");
    const resultBox = document.getElementById("costResultBox");
    const txtFineOutput = document.getElementById("txtCostFineOutput");
    const txtJewelleryCostingOutput = document.getElementById("txtCostJewelleryOutput");

    // Live sync to session
    txtGoldWeight?.addEventListener("input", (e) => {
        SessionManager.setGoldWeight(e.target.value);
    });
    txtMelting?.addEventListener("input", (e) => {
        SessionManager.setMelting(e.target.value);
    });

    // Open Other Expenses Modal
    txtCastingExpenses?.addEventListener("click", () => {
        openExpensesModal();
    });

    btnCalc?.addEventListener("click", async () => {
        const res = calculateJewelleryCost(
            txtItemName.value,
            txtGoldWeight.value,
            txtADStone.value,
            txtCastingExpenses.value,
            txtMelting.value
        );

        if (!res.success) {
            if (res.errorKey) showToast(res.errorKey, true);
            else if (res.errorMessage) showToast(res.errorMessage, false);
            return;
        }

        txtFineOutput.textContent = res.resultFineGold;
        txtJewelleryCostingOutput.textContent = res.resultJewelleryCosting;
        resultBox.classList.add("visible");

        // Merge and save detailed model
        const currentJCost = SessionManager.getJewelleryCost();
        const fullRecord = {
            ...currentJCost,
            itemName: res.itemName,
            goldWeight: res.goldWeight,
            adStone: res.adStone,
            meltingMain: res.meltingMain,
            castingOtherExp: res.castingOtherExp,
            resultFineGold: res.resultFineGold,
            resultJewelleryCosting: res.resultJewelleryCosting,
            createdAt: res.createdAt
        };

        try {
            await JewelleryCostDao.insert(fullRecord);
        } catch (e) {
            console.error("JewelleryCost save error:", e);
        }
    });

    btnClear?.addEventListener("click", () => {
        txtItemName.value = "";
        txtGoldWeight.value = "";
        txtADStone.value = "";
        txtMelting.value = "";
        txtCastingExpenses.value = "";
        resultBox.classList.remove("visible");
        SessionManager.clearAll();
        txtItemName.focus();
    });
}

// Jewellery Cost History Screen
async function loadJewelleryHistory() {
    const container = document.getElementById("jewelleryHistoryList");
    const noData = document.getElementById("jewelleryNoData");
    if (!container) return;

    const list = await JewelleryCostDao.getAll();
    container.innerHTML = "";

    if (!list || list.length === 0) {
        if (noData) noData.style.display = "flex";
        container.style.display = "none";
        return;
    }

    if (noData) noData.style.display = "none";
    container.style.display = "flex";

    list.forEach(item => {
        const card = document.createElement("div");
        card.className = "history-card";

        card.innerHTML = `
            <div class="history-card-header">${item.itemName || "Item"}</div>
            <div class="history-grid-2">
                <div>
                    <div class="history-label">${t("lblFineGold")}</div>
                    <div class="history-val large">${item.resultFineGold || "0.000"}</div>
                </div>
                <div>
                    <div class="history-label">${t("lblJewelleryCosting")}</div>
                    <div class="history-val large">${item.resultJewelleryCosting || "0.000"}</div>
                </div>
            </div>
            <div class="history-date">${item.createdAt || ""}</div>
        `;

        card.addEventListener("click", () => {
            openJewelleryHistoryDetailModal(item);
        });

        container.appendChild(card);
    });
}

// ==========================================================================
// Detailed Jewellery History Popup Dialog (dialog_history_expenses)
// ==========================================================================
function openJewelleryHistoryDetailModal(item) {
    activeJewelleryCostItem = item;
    const modal = document.getElementById("modalHistoryDetail");
    if (!modal) return;

    document.getElementById("txtHisItemName").textContent = item.itemName || "";
    document.getElementById("txtHisGoldWeight").textContent = item.goldWeight || "0.000";

    let goldRate = item.alGoldRate || item.glGoldRate || item.rlGoldRate || item.slGoldRate || "0.000";
    document.getElementById("txtHisGoldRate").textContent = goldRate;
    document.getElementById("txtHisMelting").textContent = item.meltingMain || "0.000";
    document.getElementById("txtHisADStone").textContent = item.adStone || "0.000";
    document.getElementById("txtHisAlloy").textContent = item.alloyLoss || "0.000";
    document.getElementById("txtHisCasting").textContent = item.castingLoss || "0.000";
    document.getElementById("txtHisFailing").textContent = item.failingLoss || "0.000";
    document.getElementById("txtHisSitting").textContent = item.sittingLoss || "0.000";
    document.getElementById("txtHisPolishing").textContent = item.polishingLoss || "0.000";
    document.getElementById("txtHisStoneBill").textContent = item.stoneLoss || "0.000";
    document.getElementById("txtHisGillet").textContent = item.gilletLoss || "0.000";
    document.getElementById("txtHisRhodium").textContent = item.rhodiumLoss || "0.000";
    document.getElementById("txtHisLathiya").textContent = item.lathiyaPatch || "0.000";
    document.getElementById("txtHisExtra").textContent = item.extraLoss || "0.000";
    document.getElementById("txtHisTotalLoss").textContent = item.castingOtherExp || "0.000";
    document.getElementById("txtResFineGold").textContent = item.resultFineGold || "0.000";
    document.getElementById("txtResJewelleryCost").textContent = item.resultJewelleryCosting || "0.000";

    modal.classList.add("open");
}

function setupHistoryDetailModalEvents() {
    const modal = document.getElementById("modalHistoryDetail");
    const btnClose = document.getElementById("btnHisClose");
    const btnDelete = document.getElementById("btnHisDelete");
    const btnShare = document.getElementById("btnHisShare");

    btnClose?.addEventListener("click", () => {
        modal.classList.remove("open");
    });

    btnDelete?.addEventListener("click", async () => {
        if (!activeJewelleryCostItem) return;
        await JewelleryCostDao.delete(activeJewelleryCostItem.id);
        modal.classList.remove("open");
        showToast("lblDelete", true);
        loadJewelleryHistory();
    });

    btnShare?.addEventListener("click", () => {
        if (!activeJewelleryCostItem) return;
        const text = `Item: ${activeJewelleryCostItem.itemName}\nGold Weight: ${activeJewelleryCostItem.goldWeight}\nFine: ${activeJewelleryCostItem.resultFineGold}\nJewellery Costing: ${activeJewelleryCostItem.resultJewelleryCosting}\n\n${t("share_text")}`;
        if (navigator.share) {
            navigator.share({
                title: activeJewelleryCostItem.itemName,
                text: text
            }).catch(() => {});
        } else {
            navigator.clipboard.writeText(text);
            showToast("Copied costing details to clipboard!");
        }
    });

    modal?.addEventListener("click", (e) => {
        if (e.target === modal) modal.classList.remove("open");
    });
}

// ==========================================================================
// Casting Other Expenses Bottom Sheet Modal (dialog_jewellery_expenses)
// ==========================================================================
function openExpensesModal() {
    const modal = document.getElementById("modalExpenses");
    if (!modal) return;

    const savedExps = SessionManager.getJewelleryExps();
    if (savedExps) {
        document.getElementById("txtExpAlloy").value = savedExps.expAlloy || "";
        document.getElementById("txtExpCastingLoss").value = savedExps.expCasting || "";
        document.getElementById("txtExpFailingLoss").value = savedExps.expFailing || "";
        document.getElementById("txtExpSittingLoss").value = savedExps.expSitting || "";
        document.getElementById("txtExpPolishingLoss").value = savedExps.expPolishing || "";
        document.getElementById("txtExpStoneBills").value = savedExps.expStoneBills || "";
        document.getElementById("txtExpGilletLoss").value = savedExps.expGillet || "";
        document.getElementById("txtExpRhodiumLoss").value = savedExps.expRodium || "";
        document.getElementById("txtExpLathiyaPechLoss").value = savedExps.expLathiyaPech || "";
        document.getElementById("txtExpExtraCost").value = savedExps.expExtraCost || "";
    }

    modal.classList.add("open");
}

function setupExpensesModalEvents() {
    const modal = document.getElementById("modalExpenses");
    const btnSubmit = document.getElementById("btnExpSubmit");
    const btnClear = document.getElementById("btnExpClear");
    const txtCastingExpenses = document.getElementById("txtCostCastingExpenses");

    // Sub-modal triggers
    document.getElementById("txtExpAlloy")?.addEventListener("click", openAlloyModal);
    document.getElementById("txtExpStoneBills")?.addEventListener("click", openStoneBillsModal);
    document.getElementById("txtExpGilletLoss")?.addEventListener("click", openGilletModal);
    document.getElementById("txtExpRhodiumLoss")?.addEventListener("click", openRhodiumModal);

    btnSubmit?.addEventListener("click", () => {
        const exps = {
            expAlloy: document.getElementById("txtExpAlloy").value,
            expCasting: document.getElementById("txtExpCastingLoss").value,
            expFailing: document.getElementById("txtExpFailingLoss").value,
            expSitting: document.getElementById("txtExpSittingLoss").value,
            expPolishing: document.getElementById("txtExpPolishingLoss").value,
            expStoneBills: document.getElementById("txtExpStoneBills").value,
            expGillet: document.getElementById("txtExpGilletLoss").value,
            expRodium: document.getElementById("txtExpRhodiumLoss").value,
            expLathiyaPech: document.getElementById("txtExpLathiyaPechLoss").value,
            expExtraCost: document.getElementById("txtExpExtraCost").value
        };

        const total = calculateTotalExpenses(exps);
        SessionManager.setJewelleryExps({ ...exps, expOutput: total });

        const jCost = SessionManager.getJewelleryCost();
        jCost.alloyLoss = exps.expAlloy || "0.000";
        jCost.castingLoss = exps.expCasting || "0.000";
        jCost.failingLoss = exps.expFailing || "0.000";
        jCost.sittingLoss = exps.expSitting || "0.000";
        jCost.polishingLoss = exps.expPolishing || "0.000";
        jCost.stoneLoss = exps.expStoneBills || "0.000";
        jCost.gilletLoss = exps.expGillet || "0.000";
        jCost.rhodiumLoss = exps.expRodium || "0.000";
        jCost.lathiyaPatch = exps.expLathiyaPech || "0.000";
        jCost.extraLoss = exps.expExtraCost || "0.000";
        jCost.castingOtherExp = total;
        SessionManager.setJewelleryCost(jCost);

        if (txtCastingExpenses) {
            txtCastingExpenses.value = total;
        }

        modal.classList.remove("open");
    });

    btnClear?.addEventListener("click", () => {
        [
            "txtExpAlloy", "txtExpCastingLoss", "txtExpFailingLoss", "txtExpSittingLoss",
            "txtExpPolishingLoss", "txtExpStoneBills", "txtExpGilletLoss",
            "txtExpRhodiumLoss", "txtExpLathiyaPechLoss", "txtExpExtraCost"
        ].forEach(id => {
            const input = document.getElementById(id);
            if (input) input.value = "";
        });

        SessionManager.clearJewelleryCost();
        if (txtCastingExpenses) txtCastingExpenses.value = "";
    });

    modal?.addEventListener("click", (e) => {
        if (e.target === modal) modal.classList.remove("open");
    });
}

// ==========================================================================
// Sub-Loss Modals Logic (Alloy, Stone, Gillet, Rhodium)
// ==========================================================================

// 1. Alloy Loss Modal
function openAlloyModal() {
    const modal = document.getElementById("modalLossAlloy");
    const jCost = SessionManager.getJewelleryCost();
    const txtWeight = document.getElementById("txtALWeight");
    const txtRate = document.getElementById("txtALRate");
    const txtGoldRate = document.getElementById("txtALGoldRate");
    const txtMelting = document.getElementById("txtALMelting");
    const lblResult = document.getElementById("lblAlloyResult");

    txtWeight.value = jCost.alGoldWeight || SessionManager.getGoldWeight() || "";
    txtRate.value = jCost.alAlloyRate || "";
    txtGoldRate.value = jCost.alGoldRate || SessionManager.getGoldRate() || "";
    txtMelting.value = jCost.alMelting || SessionManager.getMelting() || "";

    const compute = () => {
        const res = calculateAlloyLoss(txtWeight.value, txtRate.value, txtGoldRate.value, txtMelting.value);
        lblResult.textContent = res;
    };

    [txtWeight, txtRate, txtGoldRate, txtMelting].forEach(inp => {
        inp.oninput = compute;
    });

    compute();
    modal.classList.add("open");
}

function setupAlloyModalEvents() {
    const modal = document.getElementById("modalLossAlloy");
    document.getElementById("btnAlloyOk")?.addEventListener("click", () => {
        const txtWeight = document.getElementById("txtALWeight");
        const txtRate = document.getElementById("txtALRate");
        const txtGoldRate = document.getElementById("txtALGoldRate");
        const txtMelting = document.getElementById("txtALMelting");
        const res = calculateAlloyLoss(txtWeight.value, txtRate.value, txtGoldRate.value, txtMelting.value);

        document.getElementById("txtExpAlloy").value = res;

        // Save into active JewelleryCost & Session
        SessionManager.setGoldRate(txtGoldRate.value);
        SessionManager.setMelting(txtMelting.value);

        const jCost = SessionManager.getJewelleryCost();
        jCost.alGoldWeight = txtWeight.value;
        jCost.alAlloyRate = txtRate.value;
        jCost.alGoldRate = txtGoldRate.value;
        jCost.alMelting = txtMelting.value;
        jCost.alloyLoss = res;
        SessionManager.setJewelleryCost(jCost);

        modal.classList.remove("open");
    });

    document.getElementById("btnAlloyCancel")?.addEventListener("click", () => {
        modal.classList.remove("open");
    });

    modal?.addEventListener("click", (e) => {
        if (e.target === modal) modal.classList.remove("open");
    });
}

// 2. Stone Bills Loss Modal
function openStoneBillsModal() {
    const modal = document.getElementById("modalLossStone");
    const jCost = SessionManager.getJewelleryCost();
    const txtADRate = document.getElementById("txtSADRate");
    const txtGoldRate = document.getElementById("txtSGoldRate");
    const txtMelting = document.getElementById("txtSMelting");
    const lblResult = document.getElementById("lblStoneResult");

    txtADRate.value = jCost.slAdRate || "";
    txtGoldRate.value = jCost.slGoldRate || SessionManager.getGoldRate() || "";
    txtMelting.value = jCost.slMelting || SessionManager.getMelting() || "";

    const compute = () => {
        const res = calculateStoneLoss(txtADRate.value, txtGoldRate.value, txtMelting.value);
        lblResult.textContent = res;
    };

    [txtADRate, txtGoldRate, txtMelting].forEach(inp => {
        inp.oninput = compute;
    });

    compute();
    modal.classList.add("open");
}

function setupStoneModalEvents() {
    const modal = document.getElementById("modalLossStone");
    document.getElementById("btnStoneOk")?.addEventListener("click", () => {
        const txtADRate = document.getElementById("txtSADRate");
        const txtGoldRate = document.getElementById("txtSGoldRate");
        const txtMelting = document.getElementById("txtSMelting");
        const res = calculateStoneLoss(txtADRate.value, txtGoldRate.value, txtMelting.value);

        document.getElementById("txtExpStoneBills").value = res;

        SessionManager.setGoldRate(txtGoldRate.value);
        SessionManager.setMelting(txtMelting.value);

        const jCost = SessionManager.getJewelleryCost();
        jCost.slAdRate = txtADRate.value;
        jCost.slGoldRate = txtGoldRate.value;
        jCost.slMelting = txtMelting.value;
        jCost.stoneLoss = res;
        SessionManager.setJewelleryCost(jCost);

        modal.classList.remove("open");
    });

    document.getElementById("btnStoneCancel")?.addEventListener("click", () => {
        modal.classList.remove("open");
    });

    modal?.addEventListener("click", (e) => {
        if (e.target === modal) modal.classList.remove("open");
    });
}

// 3. Gillet Loss Modal
function openGilletModal() {
    const modal = document.getElementById("modalLossGillet");
    const jCost = SessionManager.getJewelleryCost();
    const txtWeight = document.getElementById("txtGGoldWeight");
    const txtGilletRate = document.getElementById("txtGGilletRate");
    const txtGoldRate = document.getElementById("txtGGoldRate");
    const txtMelting = document.getElementById("txtGMelting");
    const lblResult = document.getElementById("lblGilletResult");

    txtWeight.value = jCost.glGoldWeight || SessionManager.getGoldWeight() || "";
    txtGilletRate.value = jCost.glGilletRate || "";
    txtGoldRate.value = jCost.glGoldRate || SessionManager.getGoldRate() || "";
    txtMelting.value = jCost.glMelting || SessionManager.getMelting() || "";

    const compute = () => {
        const res = calculateGilletLoss(txtWeight.value, txtGilletRate.value, txtGoldRate.value, txtMelting.value);
        lblResult.textContent = res;
    };

    [txtWeight, txtGilletRate, txtGoldRate, txtMelting].forEach(inp => {
        inp.oninput = compute;
    });

    compute();
    modal.classList.add("open");
}

function setupGilletModalEvents() {
    const modal = document.getElementById("modalLossGillet");
    document.getElementById("btnGilletOk")?.addEventListener("click", () => {
        const txtWeight = document.getElementById("txtGGoldWeight");
        const txtGilletRate = document.getElementById("txtGGilletRate");
        const txtGoldRate = document.getElementById("txtGGoldRate");
        const txtMelting = document.getElementById("txtGMelting");
        const res = calculateGilletLoss(txtWeight.value, txtGilletRate.value, txtGoldRate.value, txtMelting.value);

        document.getElementById("txtExpGilletLoss").value = res;

        SessionManager.setGoldRate(txtGoldRate.value);
        SessionManager.setMelting(txtMelting.value);

        const jCost = SessionManager.getJewelleryCost();
        jCost.glGoldWeight = txtWeight.value;
        jCost.glGilletRate = txtGilletRate.value;
        jCost.glGoldRate = txtGoldRate.value;
        jCost.glMelting = txtMelting.value;
        jCost.gilletLoss = res;
        SessionManager.setJewelleryCost(jCost);

        modal.classList.remove("open");
    });

    document.getElementById("btnGilletCancel")?.addEventListener("click", () => {
        modal.classList.remove("open");
    });

    modal?.addEventListener("click", (e) => {
        if (e.target === modal) modal.classList.remove("open");
    });
}

// 4. Rhodium Loss Modal
function openRhodiumModal() {
    const modal = document.getElementById("modalLossRhodium");
    const jCost = SessionManager.getJewelleryCost();
    const txtPair = document.getElementById("txtRPair");
    const txtRate = document.getElementById("txtRRate");
    const txtGoldRate = document.getElementById("txtRGoldRate");
    const txtMelting = document.getElementById("txtRMelting");
    const lblResult = document.getElementById("lblRhodiumResult");

    txtPair.value = jCost.rlPair || "";
    txtRate.value = jCost.rlRate || "";
    txtGoldRate.value = jCost.rlGoldRate || SessionManager.getGoldRate() || "";
    txtMelting.value = jCost.rlMelting || SessionManager.getMelting() || "";

    const compute = () => {
        const res = calculateRhodiumLoss(txtPair.value, txtRate.value, txtGoldRate.value, txtMelting.value);
        lblResult.textContent = res;
    };

    [txtPair, txtRate, txtGoldRate, txtMelting].forEach(inp => {
        inp.oninput = compute;
    });

    compute();
    modal.classList.add("open");
}

function setupRhodiumModalEvents() {
    const modal = document.getElementById("modalLossRhodium");
    document.getElementById("btnRhodiumOk")?.addEventListener("click", () => {
        const txtPair = document.getElementById("txtRPair");
        const txtRate = document.getElementById("txtRRate");
        const txtGoldRate = document.getElementById("txtRGoldRate");
        const txtMelting = document.getElementById("txtRMelting");
        const res = calculateRhodiumLoss(txtPair.value, txtRate.value, txtGoldRate.value, txtMelting.value);

        document.getElementById("txtExpRhodiumLoss").value = res;

        SessionManager.setGoldRate(txtGoldRate.value);
        SessionManager.setMelting(txtMelting.value);

        const jCost = SessionManager.getJewelleryCost();
        jCost.rlPair = txtPair.value;
        jCost.rlRate = txtRate.value;
        jCost.rlGoldRate = txtGoldRate.value;
        jCost.rlMelting = txtMelting.value;
        jCost.rhodiumLoss = res;
        SessionManager.setJewelleryCost(jCost);

        modal.classList.remove("open");
    });

    document.getElementById("btnRhodiumCancel")?.addEventListener("click", () => {
        modal.classList.remove("open");
    });

    modal?.addEventListener("click", (e) => {
        if (e.target === modal) modal.classList.remove("open");
    });
}

// ==========================================================================
// Settings & Language Modal Logic
// ==========================================================================
function updateSettingsLanguageDisplay() {
    const elem = document.getElementById("lblLanguageOption");
    if (!elem) return;
    const currentLang = getLanguage();
    if (currentLang === 0) elem.textContent = t("lang_english");
    else if (currentLang === 1) elem.textContent = t("lang_hindi");
    else elem.textContent = t("lang_bengali");
}

function openLanguageModal() {
    const modal = document.getElementById("modalLanguage");
    const currentLang = getLanguage();
    const radio = document.querySelector(`input[name="langOption"][value="${currentLang}"]`);
    if (radio) radio.checked = true;
    modal?.classList.add("open");
}

function setupSettingsEvents() {
    document.getElementById("layoutChooseLanguage")?.addEventListener("click", openLanguageModal);

    document.getElementById("btnLangOk")?.addEventListener("click", () => {
        const selected = document.querySelector(`input[name="langOption"]:checked`);
        if (selected) {
            setLanguage(selected.value);
            updateSettingsLanguageDisplay();
            updateDashboardGreetings();
        }
        document.getElementById("modalLanguage")?.classList.remove("open");
    });

    document.getElementById("btnLangCancel")?.addEventListener("click", () => {
        document.getElementById("modalLanguage")?.classList.remove("open");
    });

    document.getElementById("btn_about")?.addEventListener("click", () => {
        navigateTo("#/about");
    });

    document.getElementById("btn_privacy_policy")?.addEventListener("click", () => {
        navigateTo("#/privacy-policy");
    });

    document.getElementById("btn_rate")?.addEventListener("click", () => {
        document.getElementById("modalRate")?.classList.add("open");
    });

    document.getElementById("btnRateClose")?.addEventListener("click", () => {
        document.getElementById("modalRate")?.classList.remove("open");
    });

    document.getElementById("btn_share")?.addEventListener("click", () => {
        const text = `${t("app_name")}\n\n${t("share_text")}\n\n${window.location.origin}`;
        if (navigator.share) {
            navigator.share({ title: t("app_name"), text: text, url: window.location.href }).catch(() => {});
        } else {
            navigator.clipboard.writeText(text);
            showToast("App share link copied!");
        }
    });
}

// Confirmation Dialog Utility (showYesNo)
let confirmCallback = null;
export function showConfirmDialog(title, message, onYes) {
    const modal = document.getElementById("modalConfirm");
    if (!modal) return;
    document.getElementById("modalConfirmTitle").textContent = title;
    document.getElementById("modalConfirmMsg").textContent = message;
    confirmCallback = onYes;
    modal.classList.add("open");
}

function setupConfirmDialogEvents() {
    const modal = document.getElementById("modalConfirm");
    document.getElementById("btnConfirmYes")?.addEventListener("click", () => {
        modal.classList.remove("open");
        if (confirmCallback) confirmCallback();
    });
    document.getElementById("btnConfirmNo")?.addEventListener("click", () => {
        modal.classList.remove("open");
        confirmCallback = null;
    });
}

// Privacy Policy iframe loader
function loadPrivacyPolicy() {
    const frame = document.getElementById("privacyIframe");
    if (frame && !frame.src) {
        frame.src = APP_CONFIG.PRIVACY_URL;
    }
}

// Global App Initialization
function initApp() {
    // 1. Language
    getLanguage();
    applyTranslations();

    // 2. Routing
    window.addEventListener("hashchange", handleRoute);

    // Toolbar back buttons
    document.querySelectorAll("[data-nav-back]").forEach(btn => {
        btn.addEventListener("click", () => {
            if (window.history.length > 1) {
                window.history.back();
            } else {
                navigateTo("#/");
            }
        });
    });

    // Navigation links
    document.querySelectorAll("[data-navigate]").forEach(btn => {
        btn.addEventListener("click", () => {
            const dest = btn.getAttribute("data-navigate");
            if (dest) navigateTo(dest);
        });
    });

    // 3. Event Setups
    setupMeltingEvents();
    setupJewelleryCostEvents();
    setupExpensesModalEvents();
    setupAlloyModalEvents();
    setupStoneModalEvents();
    setupGilletModalEvents();
    setupRhodiumModalEvents();
    setupHistoryDetailModalEvents();
    setupSettingsEvents();
    setupConfirmDialogEvents();

    // 4. Initial Route
    if (!window.location.hash) {
        // Show splash screen for 1.2s then fade into dashboard
        const splash = document.getElementById("screen-splash");
        if (splash) {
            splash.classList.add("active");
            setTimeout(() => {
                splash.classList.remove("active");
                navigateTo("#/");
            }, 1200);
        } else {
            navigateTo("#/");
        }
    } else {
        handleRoute();
    }
}

document.addEventListener("DOMContentLoaded", initApp);
