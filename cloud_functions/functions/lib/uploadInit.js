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
exports.uploadInit = void 0;
const admin = __importStar(require("firebase-admin"));
const https_1 = require("firebase-functions/v2/https");
const adminAccess_1 = require("./lib/adminAccess");
function normalizeSeriesId(value) {
    if (typeof value !== 'string') {
        throw new https_1.HttpsError('invalid-argument', 'seriesId must be a string');
    }
    const normalized = value.trim();
    if (!/^[a-zA-Z0-9_-]{2,64}$/.test(normalized)) {
        throw new https_1.HttpsError('invalid-argument', 'seriesId has invalid format');
    }
    return normalized;
}
function normalizeOrder(value) {
    if (typeof value !== 'number' || !Number.isInteger(value) || value < 1) {
        throw new https_1.HttpsError('invalid-argument', 'order must be a positive integer');
    }
    return value;
}
function resolveBucketName() {
    return (process.env.FIREBASE_STORAGE_BUCKET ??
        admin.app().options.storageBucket ??
        'shortigo-prod.firebasestorage.app');
}
exports.uploadInit = (0, https_1.onCall)(async (request) => {
    (0, adminAccess_1.assertAdmin)(request.auth);
    const { seriesId, order } = request.data;
    const safeSeriesId = normalizeSeriesId(seriesId);
    const safeOrder = normalizeOrder(order);
    const episodeId = `${safeSeriesId}_e${safeOrder}`;
    const videoPath = `series/${safeSeriesId}/episodes/${episodeId}.mp4`;
    const thumbnailPath = `series/${safeSeriesId}/thumbnails/${episodeId}.jpg`;
    const bucketName = resolveBucketName();
    const bucket = admin.storage().bucket(bucketName);
    const expiresAt = Date.now() + 15 * 60 * 1000;
    const [videoUploadUrl] = await bucket.file(videoPath).getSignedUrl({
        action: 'write',
        version: 'v4',
        expires: expiresAt,
        contentType: 'video/mp4',
    });
    const [thumbnailUploadUrl] = await bucket.file(thumbnailPath).getSignedUrl({
        action: 'write',
        version: 'v4',
        expires: expiresAt,
        contentType: 'image/jpeg',
    });
    return {
        episodeId,
        bucket: bucketName,
        videoPath,
        thumbnailPath,
        videoUploadUrl,
        thumbnailUploadUrl,
    };
});
