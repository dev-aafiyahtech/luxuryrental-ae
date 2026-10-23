"use client";

import { useCallback, useMemo } from "react";
import { useSearchParams } from "next/navigation";
import { FleetView, type FleetViewProps } from "./FleetView";
import { parseFilters, toQuery, type FleetFilters } from "./filters";

/**
 * Reads the filters from the URL and keeps them there. Must sit inside <Suspense>: the server
 * renders the fallback (every car, default filters) and this takes over in the browser.
 */
export function FleetBrowser(props: Omit<FleetViewProps, "filters" | "onChange">) {
  const params = useSearchParams();
  const query = params.toString();
  const filters = useMemo(() => parseFilters((k) => new URLSearchParams(query).get(k)), [query]);

  const onChange = useCallback((next: FleetFilters) => {
    // The native History API is wired into the Next router, so useSearchParams follows along
    // without a server round trip.
    window.history.replaceState(null, "", `${window.location.pathname}${toQuery(next)}`);
  }, []);

  return <FleetView {...props} filters={filters} onChange={onChange} />;
}
