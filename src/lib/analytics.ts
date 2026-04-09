import { isAnalyticsAllowed } from "@/utils/consent";

export const GA_MEASUREMENT_ID = "G-6F2R8R0H3Y";
export const GA_READY_EVENT = "turkiyeguessr:ga4-ready";

export const ANALYTICS_ENABLED =
  process.env.NEXT_PUBLIC_ENABLE_ANALYTICS !== "false" &&
  GA_MEASUREMENT_ID.length > 0;

export type AnalyticsEventParams = Record<
  string,
  string | number | boolean | undefined
>;

function hasGtag(): boolean {
  if (typeof window === "undefined") return false;
  return typeof window.gtag === "function";
}

export function canSendAnalytics(): boolean {
  if (!ANALYTICS_ENABLED) return false;
  if (!isAnalyticsAllowed()) return false;
  if (!hasGtag()) return false;
  return true;
}

export function pageview(url: string): void {
  if (!canSendAnalytics()) return;

  window.gtag("event", "page_view", {
    page_path: url,
    page_location: new URL(url, window.location.origin).toString(),
    send_to: GA_MEASUREMENT_ID,
  });
}

export function event(
  action: string,
  params?: AnalyticsEventParams,
): void {
  if (!canSendAnalytics()) return;

  window.gtag("event", action, {
    send_to: GA_MEASUREMENT_ID,
    ...params,
  });
}
