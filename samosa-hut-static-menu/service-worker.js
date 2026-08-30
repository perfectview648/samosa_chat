"use strict";

const CACHE_NAME = "samosa-hut-menu-v26";

const CORE_FILES = [
  "./",
  "./index.html",
  "./styles.css?v=9",
  "./script.js?v=11",
  "./menu.json",
  "./manifest.webmanifest",
  "./images/samosa-hut-header-logo.png",
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

  const isMenuData = url.pathname.endsWith("/menu.json");
  const isNavigation = request.mode === "navigate";

  if (isMenuData || isNavigation) {
    event.respondWith(
      fetch(request)
        .then((response) => {
          const copy = response.clone();

          caches
            .open(CACHE_NAME)
            .then((cache) => cache.put(request, copy));

          return response;
        })
        .catch(() =>
          caches
            .match(request)
            .then(
              (cached) =>
                cached || caches.match("./index.html"),
            ),
        ),
    );

    return;
  }

  event.respondWith(
    caches.match(request).then((cached) => {
      if (cached) return cached;

      return fetch(request).then((response) => {
        if (!response || response.status !== 200) {
          return response;
        }

        const copy = response.clone();

        caches
          .open(CACHE_NAME)
          .then((cache) => cache.put(request, copy));

        return response;
      });
    }),
  );
});
