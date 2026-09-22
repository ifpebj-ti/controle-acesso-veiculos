import { afterEach, describe, expect, it, vi } from "vitest";

import { api } from "../../../services/api";
import { changeAuthenticatedPassword } from "./passwordChangeService";

afterEach(() => vi.restoreAllMocks());

describe("authenticated password change service", () => {
  it("sends exactly the endpoint contract without enabling session retry", async () => {
    const post = vi.spyOn(api, "post").mockResolvedValue({ data: undefined });
    const request = {
      currentPassword: "current-test-password",
      newPassword: "new-test-password-value",
    };

    await changeAuthenticatedPassword(request);

    expect(post).toHaveBeenCalledOnce();
    expect(post).toHaveBeenCalledWith("/auth/password", request, {
      skipSessionRetry: true,
    });
  });
});
