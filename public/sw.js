self.addEventListener('push',event=>{
  if(!event.data)return;
  const message=event.data.json();
  event.waitUntil(self.registration.showNotification(message.title||'Kafe Lilim',{body:message.body||'An update on your order',icon:'/icon.svg',data:{url:message.url||'/'},tag:'kafe-lilim-ready'}));
});
self.addEventListener('notificationclick',event=>{
  event.notification.close();const url=new URL(event.notification.data?.url||'/',self.location.origin);
  if(url.origin!==self.location.origin)return;
  event.waitUntil(clients.openWindow(url.href));
});
