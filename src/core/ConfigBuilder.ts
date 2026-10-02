import { join, resolve } from "@std/path";

/* Types */

export type Mode = "probe" | "service";

export type BaseConfig = {
  xrayExecPath: string;
  logLevel: "silent" | "info" | "debug";
};

export type SourcesConfig = {
  urls: string[]; // Xray-core subscription URLs
  files: string[]; // Xray-core configuration files
  downloadProxy: string | null; // Whether to proxy subscription requests
  downloadsDir: string | null; // Subscription download directory; uses a temporary directory if not specified
  keepDownloads: boolean; // Whether to keep downloaded subscriptions; deleted after being added to the probe pool by default
};

export type ProbeConfig = {
  pingEnabled: boolean; // Enable ping checks
  httpEnabled: boolean; // Enable HTTP request checks
  pingTimeoutMs: number; // Timeout for the proxy server to respond
  httpTimeoutMs: number; // Timeout for the proxy server to process an HTTP request
  retries: number; // Number of attempts for each check before the proxy is marked as unreachable
  poolSize: number; // Probe pool size; number of Xray instances running in parallel during checks
  outputFilePath: string; // Path to the file containing working proxies
};

type ServiceProxyType = "http" | "socks" | "both";

export type ServiceConfig = {
  inboundProxyType: ServiceProxyType; // Proxy type used by the application when creating an Xray instance
  socksEnableUdp: boolean; // Enable or disable UDP for the SOCKS inbound
  sourcesUpdateIntervalMs: number; // Subscription update interval; 0 disables automatic updates
  geodataUpdateIntervalMs: number; // Geodata file update interval; 0 disables automatic updates
  geodataDir: string; // Directory for storing geodata files
  geodataSourceUrl?: string; // Geodata file source URL
  dropUnreachable: boolean; // Remove unreachable proxies from the probe pool; enabled by default
};

export type AppConfig = {
  mode: Mode; // Application operating mode
  base: BaseConfig;
  sources: SourcesConfig;
  probe: ProbeConfig;
  service?: ServiceConfig;
};

/* Constants */

const XRAY_BIN_UNIX_PATH = "/usr/local/bin/";
const HOUR_MS = 60 * 60 * 1000;
const DAY_MS = 24 * HOUR_MS;

/* Functions */

function isFile(p: string): boolean {
  try {
    return (Deno.statSync(p)).isFile;
  } catch (e) {
    if (e instanceof Deno.errors.NotFound) return false;
    throw e;
  }
}

export function defaultConfig(mode: Mode = "probe"): AppConfig {
  const cwd = Deno.cwd();
  const isWindows = Deno.build.os === "windows";
  const bin = Deno.build.os === "windows" ? "xray.exe" : "xray";
  const timestamp = new Date().toISOString().replace(/:/g, "-");

  const config: AppConfig = {
    mode,
    base: {
      xrayExecPath: resolve(
        isWindows ? join(cwd, bin) : join(XRAY_BIN_UNIX_PATH, bin),
      ),
      logLevel: "info",
    },
    sources: {
      urls: [],
      files: [],
      keepDownloads: false,
      downloadProxy: null,
      downloadsDir: null,
    },
    probe: {
      pingEnabled: true,
      httpEnabled: true,
      pingTimeoutMs: 3_000,
      httpTimeoutMs: 10_000,
      retries: 3,
      poolSize: 20,
      outputFilePath: resolve(cwd, `sentry-${timestamp}.txt`),
    },
  };

  if (mode === "service") {
    config.service = {
      inboundProxyType: "both",
      socksEnableUdp: true,
      sourcesUpdateIntervalMs: DAY_MS,
      geodataUpdateIntervalMs: 7 * DAY_MS,
      geodataDir: join(cwd, "geodata"),
      dropUnreachable: true,
    };
  }

  return config;
}

/* Errors */

export class ConfigError extends Error {
  constructor(readonly issues: string[]) {
    super(issues.join("\n"));
    this.name = "ConfigError";
  }
}

export class ConfigBuilder {
  #cfg: AppConfig;
  #issues: string[] = [];

  constructor(mode: Mode = "probe") {
    this.#cfg = defaultConfig(mode);
  }

  #reject(message: string): this {
    this.#issues.push(message);
    return this;
  }

  poolSize(n: number): this {
    if (!Number.isInteger(n) || n < 1 || n > 500) {
      return this.#reject(
        `poolSize: must be an integer between 1 and 500, got ${n}`,
      );
    }
    this.#cfg.probe.poolSize = n;
    return this;
  }

  httpTimeoutMs(ms: number): this {
    if (!Number.isInteger(ms) || ms < 100) {
      return this.#reject(
        `httpTimeoutMs: must be an integer greater than or equal to 100, got ${ms}`,
      );
    }
    this.#cfg.probe.httpTimeoutMs = ms;
    return this;
  }

  addUrl(url: string): this {
    if (!URL.canParse(url) || !/^https?:$/.test(new URL(url).protocol)) {
      return this.#reject(`url: invalid URL ${url}`);
    }
    this.#cfg.sources.urls.push(url);
    return this;
  }

  addFile(path: string): this {
    this.#cfg.sources.files.push(resolve(Deno.cwd(), path));
    return this;
  }

  downloadsDir(path: string): this {
    if (this.#cfg.mode !== "probe") {
      return this.#reject("setDownloadsDir: only available in probe mode");
    }

    this.#cfg.sources.downloadsDir = resolve(path);
    return this;
  }

  downloadProxy(conn: string): this {
    if (
      !URL.canParse(conn) || !/^(socks5h?|http):$/.test(new URL(conn).protocol)
    ) {
      return this.#reject(
        `downloadProxy: expected socks5://, socks5h://, or http://, got ${conn}`,
      );
    }
    this.#cfg.sources.downloadProxy = conn;
    return this;
  }

  stages(opts: { ping?: boolean; http?: boolean }): this {
    this.#cfg.probe.pingEnabled = opts.ping ?? this.#cfg.probe.pingEnabled;
    this.#cfg.probe.httpEnabled = opts.http ?? this.#cfg.probe.httpEnabled;
    return this;
  }

  geodataDir(dir: string): this {
    if (!this.#cfg.service) {
      return this.#reject("geodataDir: only available in service mode");
    }
    this.#cfg.service.geodataDir = resolve(Deno.cwd(), dir);
    return this;
  }

  inboundProxyMode(mode: ServiceProxyType): this {
    if (!this.#cfg.service) {
      return this.#reject("inboundProxyMode: only available in service mode");
    }

    this.#cfg.service.geodataDir = mode;
    return this;
  }

  socksEnableUdp(udp: boolean): this {
    if (!this.#cfg.service) {
      return this.#reject(
        'socksEnableUdp: only available in service mode and inboundProxyMode = "socks" or "http"',
      );
    }

    if (this.#cfg.service.inboundProxyType !== "http") {
      return this.#reject(
        'socksEnableUdp: only available inboundProxyMode = "socks" or "http"',
      );
    }
    this.#cfg.service.socksEnableUdp = udp;
    return this;
  }

  dropUnreachable(drop: boolean): this {
    if (!this.#cfg.service) {
      return this.#reject("dropUnreachable: only available in service mode");
    }

    this.#cfg.service.dropUnreachable = drop;
    return this;
  }

  build(): AppConfig {
    const issues = [...this.#issues];
    const conf = this.#cfg;

    if (conf.sources.urls.length === 0 && conf.sources.files.length === 0) {
      issues.push("Specify at least one URL or file");
    }

    if (!conf.probe.pingEnabled && !conf.probe.httpEnabled) {
      issues.push("At least one probe stage must be enabled");
    }

    for (const f of conf.sources.files) {
      if (!(isFile(f))) issues.push(`File not found: ${f}`);
    }

    if (conf.probe.httpEnabled && !(isFile(conf.base.xrayExecPath))) {
      issues.push(`Xray executable not found: ${conf.base.xrayExecPath}`);
    }

    if (conf.mode === "service" && !conf.service?.geodataSourceUrl) {
      issues.push("service: geodataSourceUrl is not configured");
    }

    if (issues.length > 0) throw new ConfigError(issues);

    return structuredClone(conf);
  }
}
