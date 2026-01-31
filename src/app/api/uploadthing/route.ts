import { createRouteHandler } from "uploadthing/next";
import { ourFileRouter } from "./core";

// Required for Uploadthing callback to work
export const runtime = "nodejs";

export const { GET, POST } = createRouteHandler({
  router: ourFileRouter,
});
