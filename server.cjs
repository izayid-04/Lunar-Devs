// Custom Next.js production server for Hodifly / cPanel (Phusion Passenger).
//
// Passenger's "Application Node" mode starts this exact file itself, via
// require() — it injects PORT and expects the process to bind to it. We do
// NOT use Next's `output: 'standalone'` mode: standalone generates its own
// server.js and is explicitly incompatible with a custom server (see
// next.config.ts / docs).
//
// MUST stay .cjs and 100% CommonJS, with no top-level await anywhere in
// this file or in anything it requires: Passenger's require() cannot load
// an ESM graph that contains a top-level await (Node throws
// ERR_REQUIRE_ASYNC_MODULE at startup — see docs/DEPLOIEMENT.md, "Piège
// Passenger + ESM"). `app.prepare().then(...)` below is the async-safe
// equivalent — never rewrite it as `await app.prepare()` at the top level.
const { createServer } = require("node:http");
const next = require("next");

const port = parseInt(process.env.PORT || "3000", 10);
const hostname = process.env.HOSTNAME || "0.0.0.0";
// Passenger sets NODE_ENV=production; default to production if unset so a
// stray `require('./server.cjs')` in prod never accidentally boots in dev mode.
const dev = process.env.NODE_ENV === "development";

const app = next({ dev, hostname, port });
const handle = app.getRequestHandler();

app
  .prepare()
  .then(() => {
    createServer((req, res) => {
      handle(req, res);
    }).listen(port, hostname, () => {
      console.log(
        `> Lunar Devs ready on http://${hostname}:${port} (${dev ? "development" : "production"})`
      );
    });
  })
  .catch((err) => {
    console.error("Failed to start Next.js custom server:", err);
    process.exit(1);
  });
