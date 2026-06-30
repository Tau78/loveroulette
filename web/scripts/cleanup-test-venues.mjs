import { pathToFileURL } from "node:url";

const isDirectRun =
  typeof process.argv[1] === "string" &&
  import.meta.url === pathToFileURL(process.argv[1]).href;

if (isDirectRun) {
  const { main } = await import("./cleanup-test-venues.ts");
  await main();
}
