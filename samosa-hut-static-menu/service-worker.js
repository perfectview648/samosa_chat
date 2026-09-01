"use strict";

const CACHE_NAME = "samosa-hut-menu-v44";

const CORE_FILES = [
  "./",
  "./index.html",
  "./styles.css?v=44",
  "./script.js?v=44",
  "./menu.json",
  "./manifest.webmanifest",
  "./images/samosa-hut-header-logo.png",
  "./images/chalk-background.png",
];
 
self.addEventListener("install", (event) => {
  event.waitUntil(
    caches
      .open(CACHE_NAME)
      .then((cache) => cache.addAll(CORE_FILES))
      .then(() => self.skipWaiting()),
  );
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) =>
        Promise.all(
          keys
            .filter((key) => key !== CACHE_NAME)
            .map((key) => caches.delete(key)),
        ),
      )
      .then(() => self.clients.claim()),
  );
});

self.addEventListener("fetch", (event) => {
  const request = event.request;

  if (request.method !== "GET") return;

  const url = new URL(request.url);

  if (url.origin !== self.location.origin) return;

  const isMenuData =
    url.pathname.endsWith("/menu.json");

  const isNavigation =
    request.mode === "navigate";

  const isLiveAsset =
    url.pathname.endsWith("/styles.css") ||
    url.pathname.endsWith("/script.js");

  /*
    Always request the newest HTML, menu data,
    CSS and JavaScript before using the cache.
  */
  if (
    isMenuData ||
    isNavigation ||
    isLiveAsset
  ) {
    event.respondWith(
      fetch(request)
        .then((response) => {
          const copy = response.clone();

          caches
            .open(CACHE_NAME)
            .then((cache) =>
              cache.put(request, copy),
            );

          return response;
        })
        .catch(async () => {
          const cached =
            await caches.match(request);

          if (cached) return cached;

          if (isNavigation) {
            return caches.match("./index.html");
          }

          return new Response(
            "Content unavailable while offline.",
            {
              status: 503,
              statusText: "Service Unavailable",
            },
          );
        }),
    );

    return;
  }

  event.respondWith(
    caches.match(request).then((cached) => {
      if (cached) return cached;

      return fetch(request).then((response) => {
        if (
          !response ||
          response.status !== 200
        ) {
          return response;
        }

        const copy = response.clone();

        caches
          .open(CACHE_NAME)
          .then((cache) =>
            cache.put(request, copy),
          );

        return response;
      });
    }),
  );
});
