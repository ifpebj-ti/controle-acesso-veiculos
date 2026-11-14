import { searchUserAccounts } from "../services/userAccountsService";
import type { ReadReactivationAccount } from "./types";

// A bounded, independent catalog read: absence is inconclusive, never rollback.
// Search uses the existing literal name filter; matching always uses the ID.
export const readReactivationAccount: ReadReactivationAccount = async (
  target,
) => {
  for (let page = 1; page <= 5; page++) {
    const result = await searchUserAccounts({
      search: target.name,
      page,
      pageSize: 100,
    });
    const account = result.items.find((item) => item.id === target.id);
    if (account) {
      return {
        id: account.id,
        name: account.name,
        active: account.active,
        authenticationMethod: account.authenticationMethod,
      };
    }
    if (page >= result.totalPages) break;
  }
  return null;
};
