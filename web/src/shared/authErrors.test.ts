import { describe, expect, it } from "vitest";
import { formatAuthError } from "./authErrors";

describe("formatAuthError", () => {
  it("explains unauthorized-domain failures", () => {
    expect(
      formatAuthError(new Error("Firebase: Error (auth/unauthorized-domain).")),
    ).toContain("Authorized domains");
  });
});
