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
      `  ${record.usage.padEnd(width)}  ${record.description}${required}${defaultValue}`,
    );
  }
}

export const helpRecords: HelpRecord[] = [
  {
    flag: "--help",
    alias: "-h",
    description: "Print this message",
  },
  {
    flag: "--no-clean",
    description: "Do not clean downloaded files",
    default: "true",
  },
  {
    flag: "--disable-ping",
    description: "Disable ping check",
    default: "false",
  },
  {
    flag: "--disable-http",
    description: "Disable HTTP check",
    default: "false",
  },
];
