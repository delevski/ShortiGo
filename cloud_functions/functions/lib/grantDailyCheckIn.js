"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.grantDailyCheckIn = void 0;
const admin = __importStar(require("firebase-admin"));
const https_1 = require("firebase-functions/v2/https");
const ledger_1 = require("./lib/ledger");
const CHECK_IN_COOLDOWN_MS = 20 * 60 * 60 * 1000;
const CHECK_IN_BONUS = 5;
exports.grantDailyCheckIn = (0, https_1.onCall)(async (request) => {
    if (!request.auth) {
        throw new https_1.HttpsError('unauthenticated', 'Sign in required');
    }
    const userId = request.auth.uid;
    const userRef = admin.firestore().collection('users').doc(userId);
    const snap = await userRef.get();
    const lastCheckIn = snap.get('lastDailyCheckIn');
    const now = admin.firestore.Timestamp.now();
    if (lastCheckIn &&
        now.toMillis() - lastCheckIn.toMillis() < CHECK_IN_COOLDOWN_MS) {
        throw new https_1.HttpsError('failed-precondition', 'Already claimed today');
    }
    await userRef.update({ lastDailyCheckIn: now });
    await (0, ledger_1.appendLedgerAndApply)({
        userId,
        type: 'dailyCheckIn',
        coinsDelta: 0,
        bonusDelta: CHECK_IN_BONUS,
        reference: 'dailyCheckIn',
    });
    return { ok: true, bonusDelta: CHECK_IN_BONUS };
});
