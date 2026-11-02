import { DateTime } from 'luxon';
import { ApiError } from './http';
export const ZONE='Asia/Manila';
export function localDate(date=new Date()){return DateTime.fromJSDate(date).setZone(ZONE).toISODate()!;}
export function localLabel(date:Date|string){return DateTime.fromJSDate(new Date(date)).setZone(ZONE).toFormat('MMM d, yyyy · h:mm a');}
export function pickupTime(input:string,settings:{openTime:string,closeTime:string,closedDates:unknown,prepMinutes:number,advanceOrdering:boolean,acceptOrders:boolean}){
  if (!settings.acceptOrders) throw new ApiError(409,'Online pickup ordering is currently paused.');
  const date = DateTime.fromISO(input,{zone:ZONE}); const now = DateTime.now().setZone(ZONE);
  if (!date.isValid || date.toFormat("yyyy-MM-dd'T'HH:mm")!==input) throw new ApiError(400,'Invalid pickup date and time');
  if (date < now.plus({minutes:settings.prepMinutes}) || date>now.plus({days:7})) throw new ApiError(409,'Pickup must be within seven days and allow enough preparation time.');
  if (!settings.advanceOrdering && date.toISODate()!==now.toISODate()) throw new ApiError(409,'Advance orders are disabled.');
  if (date.toFormat('HH:mm') < settings.openTime || date.toFormat('HH:mm') >= settings.closeTime) throw new ApiError(409,'Pickup time is outside business hours.');
  if (Array.isArray(settings.closedDates) && settings.closedDates.includes(date.toISODate())) throw new ApiError(409,'The café is closed on the requested date.');
  return date.toUTC().toJSDate();
}
