export function timeAgo(value: string): string {
  if (!value) return "";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;

  const seconds = Math.floor((Date.now() - date.getTime()) / 1000);
  if (seconds < 0) return "just now";

  const intervals: [number, string][] = [
    [60, "sec"],
    [60, "min"],
    [24, "hour"],
    [7, "day"],
    [4.34524, "week"],
    [12, "month"],
    [Number.POSITIVE_INFINITY, "year"],
  ];

  let count = seconds;
  let unit = "sec";
  for (let i = 0; i < intervals.length; i++) {
    if (count < intervals[i][0]) {
      unit = intervals[i][1];
      break;
    }
    count = Math.floor(count / intervals[i][0]);
  }

  if (count <= 1) {
    return unit === "hour" ? "1 hour ago" : `1 ${unit} ago`;
  }
  return `${count} ${unit}s ago`;
}
