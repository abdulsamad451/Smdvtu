const CACHE_NAME = "smdvtu-v1";

const APP_FILES = [
  "/",
  "/index.html",
  "/style.css",
  "/script.js",
  "/auth.css",
  "/auth.js",
  "/services.css",
  "/services.js",
  "/fund.js",
  "/welcome-image.jpeg"
];

/* Install */
self.addEventListener("install", event => {
  
  event.waitUntil(
    caches.open(CACHE_NAME)
    .then(cache => cache.addAll(APP_FILES))
  );
  
  self.skipWaiting();
});


/* Activate */
self.addEventListener("activate", event => {
  
  event.waitUntil(
    caches.keys().then(keys =>
      Promise.all(
        keys
        .filter(key => key !== CACHE_NAME)
        .map(key => caches.delete(key))
      )
    )
  );
  
  self.clients.claim();
});


/* Fetch */
self.addEventListener("fetch", event => {
  
  /*
    Only handle normal GET requests.
  */
  
  if (event.request.method !== "GET") {
    return;
  }
  
  event.respondWith(
    
    fetch(event.request)
    .then(response => {
      
      /*
        Save successful responses.
      */
      
      const responseClone =
        response.clone();
      
      caches.open(CACHE_NAME)
        .then(cache => {
          cache.put(
            event.request,
            responseClone
          );
        });
      
      return response;
      
    })
    .catch(() => {
      
      /*
        If there is no internet,
        try the cached version.
      */
      
      return caches.match(
        event.request
      );
      
    })
    
  );
  
});