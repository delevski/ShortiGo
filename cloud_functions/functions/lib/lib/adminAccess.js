"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.assertAdmin = assertAdmin;
const https_1 = require("firebase-functions/v2/https");
function assertAdmin(auth) {
    if (!auth) {
        throw new https_1.HttpsError('unauthenticated', 'Sign in required');
    }
    const isClaimAdmin = auth.token.admin === true;
    const allowlist = (process.env.ADMIN_UIDS ?? '')
        .split(',')
        .map((uid) => uid.trim())
        .filter((uid) => uid.length > 0);
    if (!isClaimAdmin && !allowlist.includes(auth.uid)) {
        throw new https_1.HttpsError('permission-denied', 'Admin access required');
    }
    return auth.uid;
}
