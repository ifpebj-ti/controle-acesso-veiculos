import { useCallback, useEffect, useState } from "react";

import { getAuthenticationProviders } from "../services/authenticationService";

type AuthenticationProvidersState =
  | { status: "loading" }
  | { googleEnabled: boolean; status: "ready" }
  | { status: "unavailable" };

export function useAuthenticationProviders() {
  const [requestVersion, setRequestVersion] = useState(0);
  const [state, setState] = useState<AuthenticationProvidersState>({
    status: "loading",
  });

  const retry = useCallback(() => {
    setState({ status: "loading" });
    setRequestVersion((version) => version + 1);
  }, []);

  useEffect(() => {
    let active = true;

    void getAuthenticationProviders()
      .then(({ googleEnabled }) => {
        if (active) setState({ googleEnabled, status: "ready" });
      })
      .catch(() => {
        if (active) setState({ status: "unavailable" });
      });

    return () => {
      active = false;
    };
  }, [requestVersion]);

  return { retry, state };
}
