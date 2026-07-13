import { Hono } from "hono";
import ntfy from "./ntfy.js";

const app = new Hono();

app.route("/ntfy/coolify", ntfy);

export default app;
