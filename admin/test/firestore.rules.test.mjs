import fs from "node:fs";
import { after, before, beforeEach, test } from "node:test";

import {
  assertFails,
  assertSucceeds,
  initializeTestEnvironment,
} from "@firebase/rules-unit-testing";
import { deleteDoc, doc, setDoc, updateDoc } from "firebase/firestore";

const projectId = "shortigo-rules-test";
const userId = "mobile-user";
let testEnv;

before(async () => {
  testEnv = await initializeTestEnvironment({
    projectId,
    firestore: {
      rules: fs.readFileSync("../firestore.rules", "utf8"),
    },
  });
});

beforeEach(async () => {
  await testEnv.clearFirestore();
  await testEnv.withSecurityRulesDisabled(async (context) => {
    await setDoc(doc(context.firestore(), "users", userId), {
      id: userId,
      email: "viewer@example.com",
      displayName: "Viewer",
      photoUrl: null,
      isVip: false,
      vipExpiresAt: null,
      coins: 0,
      bonus: 0,
      favoriteSeriesIds: [],
      lastDailyCheckIn: null,
    });
  });
});

after(async () => {
  await testEnv.cleanup();
});

test("mobile users cannot self-grant VIP", async () => {
  const db = testEnv.authenticatedContext(userId).firestore();
  await assertFails(updateDoc(doc(db, "users", userId), { isVip: true }));
});

test("mobile users cannot self-grant coins", async () => {
  const db = testEnv.authenticatedContext(userId).firestore();
  await assertFails(updateDoc(doc(db, "users", userId), { coins: 1000 }));
});

test("mobile users can update My List", async () => {
  const db = testEnv.authenticatedContext(userId).firestore();
  await assertSucceeds(
    updateDoc(doc(db, "users", userId), {
      favoriteSeriesIds: ["series-1"],
    }),
  );
});

test("Spark rewards allow one bounded bonus increment", async () => {
  const db = testEnv.authenticatedContext(userId).firestore();
  await assertSucceeds(updateDoc(doc(db, "users", userId), { bonus: 12 }));
  await assertFails(updateDoc(doc(db, "users", userId), { bonus: 25 }));
});

test("mobile users can delete their profile", async () => {
  const db = testEnv.authenticatedContext(userId).firestore();
  await assertSucceeds(deleteDoc(doc(db, "users", userId)));
});

test("mobile users cannot delete transaction history", async () => {
  await testEnv.withSecurityRulesDisabled(async (context) => {
    await setDoc(
      doc(context.firestore(), "users", userId, "transactions", "tx-1"),
      { userId, type: "spend" },
    );
  });
  const db = testEnv.authenticatedContext(userId).firestore();
  await assertFails(
    deleteDoc(doc(db, "users", userId, "transactions", "tx-1")),
  );
});
