import { format, parse } from 'date-fns';
import * as Linking from 'expo-linking';

interface CalendarParams {
  title: string;
  date: string; // yyyy-MM-dd
  startTime: string; // HH:mm:ss
  endTime: string; // HH:mm:ss
  description?: string;
}

/**
 * Build a Google Calendar "Add Event" URL.
 * Works on both iOS and Android — opens in the device browser.
 */
export function buildGoogleCalendarUrl({
  title,
  date,
  startTime,
  endTime,
  description,
}: CalendarParams): string {
  const startDt = parse(`${date} ${startTime}`, 'yyyy-MM-dd HH:mm:ss', new Date());
  const endDt = parse(`${date} ${endTime}`, 'yyyy-MM-dd HH:mm:ss', new Date());

  // Google Calendar expects yyyyMMdd'T'HHmmss format (local time)
  const dtStart = format(startDt, "yyyyMMdd'T'HHmmss");
  const dtEnd = format(endDt, "yyyyMMdd'T'HHmmss");

  const params = new URLSearchParams({
    action: 'TEMPLATE',
    text: title,
    dates: `${dtStart}/${dtEnd}`,
  });

  if (description) {
    params.set('details', description);
  }

  return `https://calendar.google.com/calendar/render?${params.toString()}`;
}

/**
 * Open the Google Calendar "Add Event" page via the device browser.
 */
export async function openAddToCalendar(params: CalendarParams): Promise<void> {
  const url = buildGoogleCalendarUrl(params);
  await Linking.openURL(url);
}
