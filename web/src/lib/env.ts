export function isDevApp(): boolean {
  return process.env.NODE_ENV === "development";
}

export function isProductionApp(): boolean {
  return process.env.NODE_ENV === "production";
}
