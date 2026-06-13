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
      likedEpisodeIds: [],
      followedSeriesIds: [],
      unlockedEpisodeIds: [],
      lastDailyCheckIn: null,
    });
    await setDoc(doc(context.firestore(), "series", "series-1"), {
      title: "Series",
      saveCount: 0,
      followerCount: 0,
    });
    await setDoc(doc(context.firestore(), "episodes", "episode-1"), {
      seriesId: "series-1",
      likeCount: 0,
      shareCount: 0,
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

test("mobile users can update social user lists", async () => {
  const db = testEnv.authenticatedContext(userId).firestore();
  await assertSucceeds(
    updateDoc(doc(db, "users", userId), {
      likedEpisodeIds: ["episode-1"],
      followedSeriesIds: ["series-1"],
    }),
  );
});

test("mobile users can update social counters by one only", async () => {
  const db = testEnv.authenticatedContext(userId).firestore();
  await assertSucceeds(updateDoc(doc(db, "series", "series-1"), { saveCount: 1 }));
  await assertSucceeds(updateDoc(doc(db, "series", "series-1"), { followerCount: 1 }));
  await assertSucceeds(updateDoc(doc(db, "episodes", "episode-1"), { likeCount: 1 }));
  await assertSucceeds(updateDoc(doc(db, "episodes", "episode-1"), { shareCount: 1 }));
});

test("mobile users cannot overstep social counter bounds", async () => {
  const db = testEnv.authenticatedContext(userId).firestore();
  await assertFails(updateDoc(doc(db, "series", "series-1"), { saveCount: 2 }));
  await assertFails(updateDoc(doc(db, "series", "series-1"), { followerCount: -1 }));
  await assertFails(updateDoc(doc(db, "episodes", "episode-1"), { likeCount: 2 }));
  await assertFails(updateDoc(doc(db, "episodes", "episode-1"), { shareCount: -1 }));
});

test("mobile users cannot mix social counters with content edits", async () => {
  const db = testEnv.authenticatedContext(userId).firestore();
  await assertFails(
    updateDoc(doc(db, "series", "series-1"), {
      saveCount: 1,
      title: "Tampered",
    }),
  );
  await assertFails(
    updateDoc(doc(db, "episodes", "episode-1"), {
      shareCount: 1,
      videoUrl: "https://example.com/tampered.mp4",
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
