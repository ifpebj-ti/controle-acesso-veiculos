import { act, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";

import type { UserAccountPage } from "../types";
import { UserAccountCatalog } from "./UserAccountCatalog";

const page: UserAccountPage = {
  items: [
    {
      active: true,
      createdAtUtc: "2030-06-10T11:00:00Z",
      email: "porteiro.ficticio@example.test",
      id: 8,
      lockedUntilUtc: null,
      name: "Porteiro Fictício",
      profileName: "Porteiro",
      requiresPasswordChange: true,
      temporaryCredentialExpiresAtUtc: "2030-06-10T11:30:00Z",
      updatedAtUtc: null,
    },
  ],
  page: 1,
  pageSize: 25,
  totalCount: 1,
  totalPages: 1,
};

describe("UserAccountCatalog", () => {
  afterEach(() => {
    vi.useRealTimers();
  });

  it("updates an expiring credential without reloading the catalog", () => {
    vi.useFakeTimers();
    vi.setSystemTime("2030-06-10T11:29:00Z");
    const onPageChange = vi.fn();
    const onResetCredential = vi.fn();
    const onToggle = vi.fn();
    const view = render(
      <UserAccountCatalog
        currentUserId={1}
        onPageChange={onPageChange}
        onResetCredential={onResetCredential}
        onToggle={onToggle}
        page={page}
        pendingAction={null}
        status="ready"
      />,
    );

    expect(screen.getAllByText("Troca obrigatória pendente")).toHaveLength(2);
    expect(screen.getAllByText(/Expira em/)).toHaveLength(2);

    act(() => vi.advanceTimersByTime(60_001));

    expect(screen.getAllByText("Credencial expirada")).toHaveLength(2);
    expect(screen.getAllByText(/Expirou em/)).toHaveLength(2);
    expect(
      screen.queryByText("Troca obrigatória pendente"),
    ).not.toBeInTheDocument();
    expect(onPageChange).not.toHaveBeenCalled();
    expect(onResetCredential).not.toHaveBeenCalled();
    expect(onToggle).not.toHaveBeenCalled();

    view.unmount();
    expect(vi.getTimerCount()).toBe(0);
  });
});
