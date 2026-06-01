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
exports.grantVipSubscription = void 0;
const admin = __importStar(require("firebase-admin"));
const https_1 = require("firebase-functions/v2/https");
exports.grantVipSubscription = (0, https_1.onRequest)(async (req, res) => {
    const authHeader = req.headers.authorization ?? '';
    if (authHeader !== `Bearer ${process.env.RC_WEBHOOK_SECRET ?? ''}`) {
        res.status(401).send('unauthorized');
        return;
    }
    const event = req.body?.event;
    if (!event) {
        res.status(400).send('missing event');
        return;
    }
    const appUserId = event.app_user_id;
    if (!appUserId) {
        res.status(400).send('missing app_user_id');
        return;
    }
    const active = event.type === 'INITIAL_PURCHASE' || event.type === 'RENEWAL';
    const expiresAt = event.expiration_at_ms
        ? admin.firestore.Timestamp.fromMillis(event.expiration_at_ms)
        : null;
    await admin.firestore().collection('users').doc(appUserId).update({
        isVip: active,
        vipExpiresAt: expiresAt,
    });
    res.status(200).send('ok');
});
