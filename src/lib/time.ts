export function humanTime(timestamp: number): string {
  const now = Date.now();
  let diff = timestamp - now; // positive: future, negative: past
  const isPast = diff < 0;
  diff = Math.abs(diff);

  const seconds = Math.floor(diff / 1000);
  const minutes = Math.floor(diff / (1000 * 60));
  const hours = Math.floor(diff / (1000 * 60 * 60));
  const days = Math.floor(diff / (1000 * 60 * 60 * 24));
  const months = Math.floor(days / 30);
  const years = Math.floor(days / 365);

  let result = "";

  if (years > 0) result = `${years} year${years > 1 ? "s" : ""}`;
  else if (months > 0) result = `${months} month${months > 1 ? "s" : ""}`;
  else if (days > 0) result = `${days} day${days > 1 ? "s" : ""}`;
  else if (hours > 0) result = `${hours} hour${hours > 1 ? "s" : ""}`;
  else if (minutes > 0) result = `${minutes} minute${minutes > 1 ? "s" : ""}`;
  else if (seconds == 0) return "just now";
  else result = `${seconds} second${seconds !== 1 ? "s" : ""}`;

  return isPast ? `${result} ago` : `${result} left`;
}


export function formatDateInput(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}