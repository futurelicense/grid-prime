import { createServer } from "node:http";
import { parse } from "node:url";
import next from "next";

const port = 3010;
const app = next({ dev: true, hostname: "127.0.0.1", port });
const handle = app.getRequestHandler();

app.prepare().then(() => {
  createServer((request, response) => {
    const parsed = parse(request.url ?? "/", true);
    handle(request, response, parsed);
  }).listen(port, "127.0.0.1", () => {
    console.log(`ready http://127.0.0.1:${port}`);
  });
});
