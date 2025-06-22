// This is a simple in-memory store for demonstration purposes.
// In a production environment, especially a serverless one, you would
// use a more robust, shared caching solution like Redis or a database
// to ensure state is preserved across different function invocations.

import { type ListingData } from "@/app/create-listing/page";

// By attaching the store to the global object, we can ensure that it persists
// across hot reloads in a development environment. This is a common pattern
// for managing state in a Next.js dev server without a database.
//
// NOTE: This is NOT suitable for production in a serverless environment.
// A shared cache like Redis or a database would be required.

declare global {
  // eslint-disable-next-line no-var
  var tempStore: Map<string, ListingData> | undefined;
}

const tempStore =
  global.tempStore || (global.tempStore = new Map<string, ListingData>());

export default tempStore; 