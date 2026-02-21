import type { IncomingMessage, ServerResponse } from "http";
import { createApp } from "./createApp.js";

let appPromise: ReturnType<typeof createApp> | null = null;

function getApp() {
  if (!appPromise) appPromise = createApp();
  return appPromise;
}

export default async function handler(req: IncomingMessage, res: ServerResponse) {
  try {
    const { app } = await getApp();
    return new Promise<void>((resolve, reject) => {
      const onDone = () => {
        res.removeListener("finish", onDone);
        res.removeListener("error", onError);
        resolve();
      };
      const onError = (err: Error) => {
        res.removeListener("finish", onDone);
        res.removeListener("error", onError);
        if (!res.headersSent) {
          res.statusCode = 500;
          res.setHeader("Content-Type", "application/json");
          res.end(JSON.stringify({ error: "internal_error", message: "Ocorreu um erro interno no servidor." }));
        }
        resolve();
      };
      res.once("finish", onDone);
      res.once("error", onError);
      app(req, res);
    });
  } catch (err) {
    console.error("FUNCTION_INVOCATION_FAILED:", err);
    if (!res.headersSent) {
      res.statusCode = 500;
      res.setHeader("Content-Type", "application/json");
      res.end(
        JSON.stringify({
          error: "internal_error",
          message: "Ocorreu um erro interno no servidor.",
        })
      );
    }
  }
}
