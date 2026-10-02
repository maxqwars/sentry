import { parseArgs } from "@std/cli/parse-args";
import { helpRecords, printHelpMessage } from "./src/cli/printHelpMessage.ts";

/*
 * Define cli flags
 */
const flags = parseArgs(Deno.args, {
  boolean: [
    "help",
    "no-clean",
    "disable-ping",
    "disable-http",
    "drop-unreachable",
    "disable-udp",
  ],
  string: [
    "mode",
    "xray-bin",
    "download-proxy",
    "downloads-dir",
    "ping-timeout",
    "http-timeout",
    "test-retries",
    "pool-size",
    "in-proxy-type",
    "in-proxy-http-port",
    "in-proxy-socks-port",
    "out-dir",
    "sources-upd-interval",
    "geodata-upd-interval",
    "geodata-dir",
    "geodata-src-url",
  ],
  collect: ["url", "file"],
});

function main() {
  if (Deno.args.length === 0 || flags["help"]) {
    printHelpMessage({
      name: "Sentry",
      description:
        "Sentry is an open-source daemon and xray-core probe designed to optimize internet performance.",
      records: helpRecords,
    });
    Deno.exit();
  }

  return;
}

main();
