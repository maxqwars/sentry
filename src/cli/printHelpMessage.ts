type HelpRecord = {
  flag: string;
  alias?: string;
  value?: string;
  default?: string;
  required?: boolean;
  description: string;
};

type HelpMessageOptions = {
  name: string;
  description: string;
  records: HelpRecord[];
};

export function printHelpMessage({
  name,
  description,
  records,
}: HelpMessageOptions): void {
  if (records.length === 0) return;

  const options = records.map((record) => {
    const alias = record.alias ? `${record.alias}, ` : "    ";
    const value = record.value ? ` ${record.value}` : "";

    return {
      ...record,
      usage: `${alias}${record.flag}${value}`,
    };
  });

  const width = Math.max(...options.map(({ usage }) => usage.length));

  console.log(`Usage: ${name} [options]`);
  console.log();
  console.log(description);
  console.log();
  console.log("Options:");

  for (const record of options) {
    const required = record.required ? " [required]" : "";
    const defaultValue = record.default !== undefined
      ? ` (default: ${record.default})`
      : "";

    console.log(
      `  ${
        record.usage.padEnd(width)
      }  ${record.description}${required}${defaultValue}`,
    );
  }
}

export const helpRecords: HelpRecord[] = [
  {
    flag: "--help",
    alias: "-h",
    description: "Show this help message",
  },
  {
    flag: "--disable-ping",
    description: "Disable ping scanning",
  },
  {
    flag: "--disable-http",
    description: "Disable HTTP scanning",
  },
  {
    flag: "--drop-unreachable",
    description: "Remove unreachable configs from the test pool",
  },
  {
    flag: "--disable-udp",
    description: "Disable UDP support for the inbound proxy",
  },
  {
    flag: "--mode",
    value: "probe",
    description: "Set the Sentry operating mode",
  },
  {
    flag: "--xray-bin",
    value: "Platform-specific xray-core location, see README.md",
    description: "Path to the xray-core executable",
  },
  {
    flag: "--download-proxy",
    description: "Set the proxy used to download files from external sources",
  },
  {
    flag: "--downloads-dir",
    description: "Override the default downloads directory",
  },
  {
    flag: "--ping-timeout",
    description: "Override the default ping scan timeout",
  },
  {
    flag: "--http-timeout",
    description: "Override the default HTTP scan timeout",
  },
  {
    flag: "--test-retries",
    description: "Override the default number of test retries",
  },
  {
    flag: "--pool-size",
    description: "Override the default test pool size",
  },
  {
    flag: "--in-proxy-type",
    description: "Set the inbound proxy type (HTTP, SOCKS, or both)",
  },
  {
    flag: "--in-proxy-http-port",
    description: "Override the default HTTP proxy port",
  },
  {
    flag: "--in-proxy-socks-port",
    description: "Override the default SOCKS proxy port",
  },
  {
    flag: "--out-dir",
    description: "Set the directory for probe result reports",
  },
  {
    flag: "--sources-upd-interval",
    description: "Override the default sources update interval",
  },
  {
    flag: "--geodata-upd-interval",
    description: "Override the default geodata update interval",
  },
  {
    flag: "--geodata-dir",
    description: "Set the directory containing geodata files",
  },
  {
    flag: "--geodata-src-url",
    description: "Set the URL of the geodata source",
  },
];
