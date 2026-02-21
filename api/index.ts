import { createApp } from "./createApp";

let appPromise: ReturnType<typeof createApp> | null = null;

function getApp() {
  if (!appPromise) appPromise = createApp();
  return appPromise;
}

export default async function handler(req: import("http").IncomingMessage, res: import("http").ServerResponse) {
  const { app } = await getApp();
  return new Promise<void>((resolve) => {
    res.on("finish", () => resolve());
    app(req, res);
  });
}
