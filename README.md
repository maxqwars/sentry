![Repository image](image.jpg)

# ✳️ Sentry \[WIP\]

Sentry is an open-source daemon and xray-core probe designed to optimize internet performance. This project is written in TypeScript and runs on Deno. **Sentry does not implement the xray-core functionality and requires that it be installed on the system.**

Sentry is primarily designed for use on Linux as a service, the closest comparable project is [v2rayA](https://github.com/v2rayA/v2rayA).

### 🔀 probe-mode

In probe mode, Sentry checks xray-core configurations, selects the ones that work on your network, and saves them to a file that you can use for your own purposes.

### 🔄️ deamon-mode

In daemon (or service) mode, Sentry constantly checks the xray-core lists and rotates them so that you always have the best connection option. In this mode, Sentry configures xray-core via a configuration file and restarts the service on its own.

# License

This project is distributed under the MIT License
