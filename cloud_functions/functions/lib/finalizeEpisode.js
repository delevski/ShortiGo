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
exports.finalizeEpisode = void 0;
const admin = __importStar(require("firebase-admin"));
const https_1 = require("firebase-functions/v2/https");
const adminAccess_1 = require("./lib/adminAccess");
function assertString(value, field) {
    if (typeof value !== 'string' || value.trim().length === 0) {
        throw new https_1.HttpsError('invalid-argument', `${field} must be a non-empty string`);
    }
    return value.trim();
}
function assertPositiveInt(value, field) {
    if (typeof value !== 'number' || !Number.isInteger(value) || value < 1) {
        throw new https_1.HttpsError('invalid-argument', `${field} must be a positive integer`);
    }
    return value;
}
function assertBoolean(value, field) {
    if (typeof value !== 'boolean') {
        throw new https_1.HttpsError('invalid-argument', `${field} must be boolean`);
    }
    return value;
}
function storageHttpUrl(bucket, objectPath) {
    const encoded = encodeURIComponent(objectPath);
    return `https://firebasestorage.googleapis.com/v0/b/${bucket}/o/${encoded}?alt=media`;
}
exports.finalizeEpisode = (0, https_1.onCall)(async (request) => {
    (0, adminAccess_1.assertAdmin)(request.auth);
    const body = request.data;
    const seriesId = assertString(body.seriesId, 'seriesId');
    const order = assertPositiveInt(body.order, 'order');
    const durationSec = assertPositiveInt(body.durationSec, 'durationSec');
    const isVipLocked = assertBoolean(body.isVipLocked, 'isVipLocked');
    const bucket = assertString(body.bucket, 'bucket');
    const videoPath = assertString(body.videoPath, 'videoPath');
    const thumbnailPath = assertString(body.thumbnailPath, 'thumbnailPath');
    const replaceExisting = body.replaceExisting === true;
    const episodeId = `${seriesId}_e${order}`;
    if (!videoPath.endsWith(`/${episodeId}.mp4`)) {
        throw new https_1.HttpsError('invalid-argument', 'videoPath does not match schema');
    }
    if (!thumbnailPath.endsWith(`/${episodeId}.jpg`)) {
        throw new https_1.HttpsError('invalid-argument', 'thumbnailPath does not match schema');
    }
    const episodeRef = admin.firestore().collection('episodes').doc(episodeId);
    const episodeSnap = await episodeRef.get();
    if (episodeSnap.exists && !replaceExisting) {
        throw new https_1.HttpsError('already-exists', `Episode ${episodeId} already exists`);
    }
    const [videoExists] = await admin.storage().bucket(bucket).file(videoPath).exists();
    const [thumbnailExists] = await admin.storage().bucket(bucket).file(thumbnailPath).exists();
    if (!videoExists || !thumbnailExists) {
        throw new https_1.HttpsError('failed-precondition', 'Uploaded files were not found in storage');
    }
    await episodeRef.set({
        id: episodeId,
        seriesId,
        order,
        videoUrl: videoPath,
        thumbnailUrl: storageHttpUrl(bucket, thumbnailPath),
        durationSec,
        isVipLocked,
    });
    return { episodeId };
});
