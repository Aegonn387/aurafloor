export const PI_SDK_VERSION = "2.0";

export function getPiInitOptions() {
  return {
    version: PI_SDK_VERSION,
    sandbox: process.env.NODE_ENV === "development",
  };
}
