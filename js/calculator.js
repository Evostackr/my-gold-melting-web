/**
 * Mathematical calculations and formatting utility for Gold Melting Management
 * Direct reproduction of Java classes:
 * - MeltingActivity.java
 * - JewelleryCostActivity.java
 * - DialogManager.java
 * - Utils.java
 */

export const ADD_PALO = "add_palo";
export const ADD_FINE_GOLD = "add_fine_gold";

/**
 * Format a number to exactly 3 decimal places
 * Equivalent to Utils.format3Decimal(double d)
 */
export function format3Decimal(d) {
    try {
        const num = Number(d);
        if (isNaN(num)) return "0.000";
        return num.toFixed(3);
    } catch (e) {
        return "0.000";
    }
}

/**
 * Safe double parsing or 0.000
 * Equivalent to Utils.getZeroFromEmpty(String value)
 */
export function getZeroFromEmpty(val) {
    if (val === null || val === undefined) return 0.0;
    const s = String(val).trim();
    if (s === "") return 0.0;
    const num = parseFloat(s);
    return isNaN(num) ? 0.0 : num;
}

/**
 * Gold Melting Calculation
 * Equivalent to MeltingActivity.calculate()
 * 
 * @param {string} enterWeight - Space separated weights (e.g. "10 20")
 * @param {string} enterTouch - Space separated touche (e.g. "80 90")
 * @param {string|number} enterOutput - Target output touche (e.g. "85")
 * @returns {object} Result object with { success, error, label, addFineOrPalo, finalWeight, weight, touch, outputTouch }
 */
export function calculateMelting(enterWeight, enterTouch, enterOutput) {
    const wStr = String(enterWeight || "").trim();
    const tStr = String(enterTouch || "").trim();
    const oStr = String(enterOutput || "").trim();

    if (!wStr || !tStr || !oStr) {
        return { success: false, errorKey: "Field_can_not_be_blank" };
    }

    const splitW = wStr.split(/\s+/).filter(Boolean);
    const splitT = tStr.split(/\s+/).filter(Boolean);
    const outputTouch = parseFloat(oStr);

    if (splitW.length !== splitT.length) {
        return { success: false, errorKey: "Total_Weights_and_Total_Touch" };
    }

    if (isNaN(outputTouch) || outputTouch > 100.0) {
        return { success: false, errorMessage: "Value Can not be > 100" };
    }

    if (outputTouch === 100.0) {
        return { success: false, errorKey: "Nothing_to_Add" };
    }

    let formulaOne = 0.0;
    let totalWeight = 0.0;

    for (let i = 0; i < splitW.length; i++) {
        let inputWeight = parseFloat(splitW[i]);
        if (isNaN(inputWeight)) inputWeight = 0.0;
        let inputTouch = parseFloat(splitT[i]);
        if (isNaN(inputTouch)) inputTouch = 0.0;

        totalWeight += inputWeight;
        formulaOne += (inputWeight * inputTouch) / 100.0;
    }

    const fineWeight = (formulaOne / outputTouch) * 100.0;
    let finalWeight = 0.0;
    let addFineOrPalo = 0.0;
    let lblFineOrPalo = "";

    if (totalWeight > fineWeight) {
        addFineOrPalo = ((totalWeight - fineWeight) * outputTouch) / (100.0 - outputTouch);
        finalWeight = totalWeight + addFineOrPalo;
        lblFineOrPalo = ADD_FINE_GOLD;
    } else {
        addFineOrPalo = fineWeight - totalWeight;
        finalWeight = addFineOrPalo + totalWeight;
        lblFineOrPalo = ADD_PALO;
    }

    return {
        success: true,
        weight: wStr,
        touch: tStr,
        outputTouch: oStr,
        lblFineOrPalo,
        valueFineOrPalo: format3Decimal(addFineOrPalo),
        finalWeight: format3Decimal(finalWeight),
        dateTime: getCurrentDateTime()
    };
}

/**
 * Jewellery Cost Calculation
 * Equivalent to JewelleryCostActivity.calculate()
 * 
 * @param {string} itemName
 * @param {string|number} goldWeight
 * @param {string|number} adStone
 * @param {string|number} castingExpenses
 * @param {string|number} melting
 * @returns {object}
 */
export function calculateJewelleryCost(itemName, goldWeight, adStone, castingExpenses, melting) {
    const mGoldWeight = parseFloat(goldWeight);
    const mADStone = parseFloat(adStone);
    const mCastingExpenses = parseFloat(castingExpenses);
    const mMelting = parseFloat(melting);

    if (isNaN(mGoldWeight) || isNaN(mADStone) || isNaN(mCastingExpenses) || isNaN(mMelting)) {
        return { success: false, errorKey: "Field_can_not_be_blank" };
    }

    if (mGoldWeight <= 0.0) {
        return { success: false, errorMessage: "Gold Weight must be greater than 0" };
    }

    const fineGold = (mGoldWeight - mADStone + mCastingExpenses) * mMelting;
    const finalResult = fineGold / mGoldWeight;

    const resultFineGold = format3Decimal(fineGold / 100.0);
    const resultJewelleryCosting = format3Decimal(finalResult);

    return {
        success: true,
        itemName: String(itemName || "").trim(),
        goldWeight: String(mGoldWeight),
        adStone: String(mADStone),
        meltingMain: String(mMelting),
        castingOtherExp: String(mCastingExpenses),
        resultFineGold,
        resultJewelleryCosting,
        createdAt: getCurrentDateTime()
    };
}

/**
 * Alloy Loss Sub-Calculation
 * Equivalent to DialogManager.alloyLoss()
 */
export function calculateAlloyLoss(alloyWeight, rate, goldRate, melting) {
    const w = getZeroFromEmpty(alloyWeight);
    const r = getZeroFromEmpty(rate);
    const gr = getZeroFromEmpty(goldRate);
    const m = getZeroFromEmpty(melting);

    if (w > 0 && r > 0 && gr > 0 && m > 0) {
        const alloy = (w * r) / 1000;
        const milli = (alloy / gr) * 10;
        const allowLoss = (milli / m) * 100;
        return format3Decimal(allowLoss);
    }
    return "0.000";
}

/**
 * Stone Bills Loss Sub-Calculation
 * Equivalent to DialogManager.stoneLoss()
 */
export function calculateStoneLoss(adRate, goldRate, melting) {
    const ar = getZeroFromEmpty(adRate);
    const gr = getZeroFromEmpty(goldRate);
    const m = getZeroFromEmpty(melting);

    if (ar > 0 && gr > 0 && m > 0) {
        const fine = (ar / gr) * 10;
        const stoneBill = (fine / m) * 100;
        return format3Decimal(stoneBill);
    }
    return "0.000";
}

/**
 * Gillet Loss Sub-Calculation
 * Equivalent to DialogManager.gilletLoss()
 */
export function calculateGilletLoss(goldWeight, gilletRate, goldRate, melting) {
    const gw = getZeroFromEmpty(goldWeight);
    const grt = getZeroFromEmpty(gilletRate);
    const gr = getZeroFromEmpty(goldRate);
    const m = getZeroFromEmpty(melting);

    if (gw > 0 && grt > 0 && gr > 0 && m > 0) {
        const rate = gw * grt;
        const fine = (rate / gr) * 10;
        const gilletLoss = (fine / m) * 100;
        return format3Decimal(gilletLoss);
    }
    return "0.000";
}

/**
 * Rhodium Loss Sub-Calculation
 * Equivalent to DialogManager.rhodiumLoss()
 */
export function calculateRhodiumLoss(pair, rRate, goldRate, melting) {
    const p = getZeroFromEmpty(pair);
    const rr = getZeroFromEmpty(rRate);
    const gr = getZeroFromEmpty(goldRate);
    const m = getZeroFromEmpty(melting);

    if (p > 0 && rr > 0 && gr > 0 && m > 0) {
        const rate = p * rr;
        const fine = (rate / gr) * 10;
        const rodiumLoss = (fine / m) * 100;
        return format3Decimal(rodiumLoss);
    }
    return "0.000";
}

/**
 * Total Casting Other Expenses Calculation
 * Equivalent to DialogManager lines 420-432
 */
export function calculateTotalExpenses(expenses) {
    const sum = getZeroFromEmpty(expenses.expAlloy)
        + getZeroFromEmpty(expenses.expCasting)
        + getZeroFromEmpty(expenses.expFailing)
        + getZeroFromEmpty(expenses.expSitting)
        + getZeroFromEmpty(expenses.expPolishing)
        + getZeroFromEmpty(expenses.expStoneBills)
        + getZeroFromEmpty(expenses.expGillet)
        + getZeroFromEmpty(expenses.expRodium)
        + getZeroFromEmpty(expenses.expLathiyaPech)
        + getZeroFromEmpty(expenses.expExtraCost);
    return format3Decimal(sum);
}

/**
 * Current date time string in yyyy-MM-dd hh:mm:ss format
 * Equivalent to Utils.getCurrentDateTime()
 */
export function getCurrentDateTime() {
    const now = new Date();
    const pad = (n) => String(n).padStart(2, '0');
    const yyyy = now.getFullYear();
    const mm = pad(now.getMonth() + 1);
    const dd = pad(now.getDate());
    const hh = pad(now.getHours());
    const min = pad(now.getMinutes());
    const ss = pad(now.getSeconds());
    return `${yyyy}-${mm}-${dd} ${hh}:${min}:${ss}`;
}
