// Current UTC epoch seconds (integer).
export function epochSecondsNow() {
  return Math.floor(Date.now() / 1000);
}

// Convert Date | number(ms|s) | ISO-like string to UTC epoch seconds.
// Returns integer seconds or null.
export function toEpochSeconds(input) {
  if (input == null) return null;

  // If a number: treat >= 1e12 as ms, otherwise seconds
  if (typeof input === "number" && Number.isFinite(input)) {
    return Math.floor(input > 1e12 ? input / 1000 : input);
  }

  // If a Date
  if (input instanceof Date) {
    const t = input.getTime();
    return Number.isFinite(t) ? Math.floor(t / 1000) : null;
  }

  // If an ISO-like string (with timezone or Z)
  if (typeof input === "string") {
    const parsed = Date.parse(input);
    if (Number.isFinite(parsed)) return Math.floor(parsed / 1000);
  }

  return null;
}

// Format epoch seconds in an IANA zone using Intl; respects DST.
// Returns a localized string or null.
export function formatEpochSecondsInZone(epochSeconds, timeZone, options = {}) {
  const s = toEpochSeconds(epochSeconds);
  if (s == null || !timeZone) return null;
  const d = new Date(s * 1000);
  const fmt = new Intl.DateTimeFormat(undefined, {
    dateStyle: "medium",
    timeStyle: "short",
    timeZone,
    ...options,
  });
  return fmt.format(d);
}

// Format epoch seconds in an IANA zone and include short zone name (e.g., SAST).
// Returns a localized string or null.
export function formatEpochSecondsInZoneWithName(
  epochSeconds,
  timeZone,
  options = {}
) {
  const s = toEpochSeconds(epochSeconds);
  if (s == null || !timeZone) return null;
  const d = new Date(s * 1000);
  const fmt = new Intl.DateTimeFormat(undefined, {
    dateStyle: "medium",
    timeStyle: "short",
    timeZone,
    timeZoneName: "short",
    ...options,
  });
  return fmt.format(d);
}
