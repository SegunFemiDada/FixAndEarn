export function getDeviceName(userAgent?: string | null): string {
  if (!userAgent) {
    return "Unknown Device";
  }

  const ua = userAgent.toLowerCase();

  let os = "Unknown OS";

  if (ua.includes("windows")) {
    os = "Windows";
  } else if (ua.includes("mac os") || ua.includes("macintosh")) {
    os = "macOS";
  } else if (ua.includes("android")) {
    os = "Android";
  } else if (ua.includes("iphone") || ua.includes("ipad") || ua.includes("ios")) {
    os = "iOS";
  } else if (ua.includes("linux")) {
    os = "Linux";
  }

  let browser = "Unknown Browser";

  if (ua.includes("edg/")) {
    browser = "Edge";
  } else if (ua.includes("chrome/") && !ua.includes("edg/")) {
    browser = "Chrome";
  } else if (ua.includes("firefox/")) {
    browser = "Firefox";
  } else if (
    ua.includes("safari/") &&
    !ua.includes("chrome/") &&
    !ua.includes("chromium/")
  ) {
    browser = "Safari";
  } else if (ua.includes("opr/") || ua.includes("opera")) {
    browser = "Opera";
  }

  return `${os} • ${browser}`;
}