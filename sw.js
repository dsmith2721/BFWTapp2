var CACHE='feelings-wheel-v1';
self.addEventListener('install',function(e){self.skipWaiting();
e.waitUntil(caches.open(CACHE).then(function(c){return c.add(new Request(self.registration.scope,{cache:'reload'}));}).catch(function(){}));});
self.addEventListener('activate',function(e){e.waitUntil(caches.keys().then(function(k){
return Promise.all(k.filter(function(n){return n!==CACHE;}).map(function(n){return caches.delete(n);}));}).then(function(){return self.clients.claim();}));});
self.addEventListener('fetch',function(e){if(e.request.method!=='GET')return;
e.respondWith(fetch(e.request).then(function(r){if(r&&r.ok){var c=r.clone();caches.open(CACHE).then(function(ch){ch.put(e.request,c);});}return r;})
.catch(function(){return caches.match(e.request).then(function(m){return m||caches.match(self.registration.scope);});}));});
