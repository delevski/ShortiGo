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
exports.finalizeEpisode = exports.uploadInit = exports.grantVipSubscription = exports.grantDailyCheckIn = exports.grantAdReward = void 0;
const admin = __importStar(require("firebase-admin"));
admin.initializeApp();
var grantAdReward_1 = require("./grantAdReward");
Object.defineProperty(exports, "grantAdReward", { enumerable: true, get: function () { return grantAdReward_1.grantAdReward; } });
var grantDailyCheckIn_1 = require("./grantDailyCheckIn");
Object.defineProperty(exports, "grantDailyCheckIn", { enumerable: true, get: function () { return grantDailyCheckIn_1.grantDailyCheckIn; } });
var grantVipSubscription_1 = require("./grantVipSubscription");
Object.defineProperty(exports, "grantVipSubscription", { enumerable: true, get: function () { return grantVipSubscription_1.grantVipSubscription; } });
var uploadInit_1 = require("./uploadInit");
Object.defineProperty(exports, "uploadInit", { enumerable: true, get: function () { return uploadInit_1.uploadInit; } });
var finalizeEpisode_1 = require("./finalizeEpisode");
Object.defineProperty(exports, "finalizeEpisode", { enumerable: true, get: function () { return finalizeEpisode_1.finalizeEpisode; } });
