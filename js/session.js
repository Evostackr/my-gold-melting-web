/**
 * SessionManager equivalent for Gold Melting Management Web
 * Replicates SessionManager.java:
 * Preserves temporary input states, cross-dialog synchronization (Gold Weight, Melting, Gold Rate),
 * and active JewelleryCost and JewelleryCostExpenses objects.
 */

const KEY_GOLD_WEIGHT = "melting_gold_weight";
const KEY_MELTING = "melting_melting";
const KEY_GOLD_RATE = "melting_gold_rate";
const KEY_COST_EXPENSES = "melting_cost_expenses";
const KEY_JEWELLERY_COST = "melting_jewellery_cost";

export class SessionManager {
    static getGoldWeight() {
        return localStorage.getItem(KEY_GOLD_WEIGHT) || "";
    }

    static setGoldWeight(val) {
        localStorage.setItem(KEY_GOLD_WEIGHT, val || "");
    }

    static getMelting() {
        return localStorage.getItem(KEY_MELTING) || "";
    }

    static setMelting(val) {
        localStorage.setItem(KEY_MELTING, val || "");
    }

    static getGoldRate() {
        return localStorage.getItem(KEY_GOLD_RATE) || "";
    }

    static setGoldRate(val) {
        localStorage.setItem(KEY_GOLD_RATE, val || "");
    }

    static getJewelleryExps() {
        try {
            const raw = localStorage.getItem(KEY_COST_EXPENSES);
            return raw ? JSON.parse(raw) : null;
        } catch (e) {
            return null;
        }
    }

    static setJewelleryExps(expenses) {
        if (expenses) {
            localStorage.setItem(KEY_COST_EXPENSES, JSON.stringify(expenses));
        } else {
            localStorage.removeItem(KEY_COST_EXPENSES);
        }
    }

    static clearJewelleryCost() {
        localStorage.removeItem(KEY_COST_EXPENSES);
    }

    static clearPopExp() {
        this.setGoldWeight("");
        this.setMelting("");
        this.setGoldRate("");
    }

    static getJewelleryCost() {
        try {
            const raw = localStorage.getItem(KEY_JEWELLERY_COST);
            return raw ? JSON.parse(raw) : {};
        } catch (e) {
            return {};
        }
    }

    static setJewelleryCost(cost) {
        if (cost) {
            localStorage.setItem(KEY_JEWELLERY_COST, JSON.stringify(cost));
        } else {
            localStorage.removeItem(KEY_JEWELLERY_COST);
        }
    }

    static clearStoredJewelleryExp() {
        localStorage.removeItem(KEY_JEWELLERY_COST);
    }

    static clearAll() {
        this.clearJewelleryCost();
        this.clearPopExp();
        this.clearStoredJewelleryExp();
    }
}
