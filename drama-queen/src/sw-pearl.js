/* eslint-disable no-restricted-globals */

// This service worker can be customized!
// See https://developers.google.com/web/tools/workbox/modules
// for the list of available Workbox modules, or add any other
// code you'd like.
// You can also remove this file if you'd prefer not to use a
// service worker, and the Workbox build step will be skipped.

//import { CacheableResponsePlugin } from "workbox-cacheable-response";
import { clientsClaim } from "workbox-core";
import { createHandlerBoundToURL, precacheAndRoute } from "workbox-precaching";
//import { registerRoute } from "workbox-routing";
//import { CacheFirst, NetworkFirst } from "workbox-strategies";

self._QUEEN_URL = import.meta.env.VITE_QUEEN_URL;
self._QUEEN_V2_URL = import.meta.env.VITE_QUEEN_V2_URL;

importScripts(`${self._QUEEN_URL}/queen-service-worker.js`);
importScripts(`${self._QUEEN_V2_URL}/queen-service-worker.js`);

clientsClaim();

// Precache all of the assets generated by your build process.
// Their URLs are injected into the manifest variable below.
// This variable must be present somewhere in your service worker file,
// even if you decide not to use precaching. See https://cra.link/PWA
precacheAndRoute(self.__WB_MANIFEST);

// Set up App Shell-style routing, so that all navigation requests
// are fulfilled with your index.html shell. Learn more at
// https://developers.google.com/web/fundamentals/architecture/app-shell
const fileExtensionRegexp = new RegExp("/[^/?]+\\.[^/]+$");
registerRoute(
  // Return false to exempt requests from being fulfilled by index.html.
  ({ request, url }) => {
    // If this isn't a navigation, skip.
    if (request.mode !== "navigate") {
      return false;
    } // If this is a URL that starts with /_, skip.

    if (url.pathname.startsWith("/_")) {
      return false;
    } // If this looks like a URL for a resource, because it contains // a file extension, skip.

    if (url.pathname.match(fileExtensionRegexp)) {
      return false;
    } // Return true to signal that we want to use the handler.

    return true;
  },
  createHandlerBoundToURL(`./index.html`)
);

const getUrlRegexJson = function (url) {
  return url.replace("http", "^http").concat("/(.*)(.json)");
};

const getUrlRegexManifestFiles = function (url) {
  return url.replace("http", "^http").concat("/(.*)((.ico)|(.png))");
};

const configurationCacheName = "configuration-cache";
const manifestImageCacheName = "manifest-cache";

registerRoute(
  new RegExp(getUrlRegexJson(self.location.origin)),
  new NetworkFirst({
    cacheName: configurationCacheName,
    plugins: [
      new CacheableResponsePlugin({
        statuses: [0, 200],
      }),
    ],
  })
);
registerRoute(
  new RegExp(getUrlRegexManifestFiles(self.location.origin)),
  new CacheFirst({
    cacheName: manifestImageCacheName,
    plugins: [
      new CacheableResponsePlugin({
        statuses: [0, 200],
      }),
    ],
  })
);

const cacheConfiguration = async () => {
  const manifest = await fetch("/manifest.json");
  const { icons } = await manifest.json();
  const urlsToPrecache = [`/manifest.json`].concat(icons.map(({ src }) => src));
  const cache = await self.caches.open(configurationCacheName);
  await cache.addAll(urlsToPrecache);
};

self.addEventListener("install", (event) => {
  console.log("Pearl  sw : installing configuration..");
  event.waitUntil(cacheConfiguration());
});

// This allows the web app to trigger skipWaiting via
// registration.waiting.postMessage({type: 'SKIP_WAITING'})
self.addEventListener("message", (event) => {
  if (event.data && event.data.type === "SKIP_WAITING") {
    self.skipWaiting();
  }
});

// Any other custom service worker logic can go here.
