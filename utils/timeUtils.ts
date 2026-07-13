// Helper functions to convert 24h ↔ 12h time
export const format24hTo12h = (time24h: string): string => {
  if (!time24h) return "";
  const [hours, minutes] = time24h.split(":").map(Number);
  const period = hours >= 12 ? "PM" : "AM";
  let hours12 = hours % 12;
  if (hours12 === 0) hours12 = 12;
  return `${hours12.toString().padStart(2, "0")}:${minutes.toString().padStart(2, "0")} ${period}`;
};

export const parse12hTo24h = (time12h: string): string => {
  if (!time12h) return "";
  const [timePart, period] = time12h.toUpperCase().split(" ");
  if (!timePart || !period) return time12h; // fallback to 24h if format is wrong
  let [hours, minutes] = timePart.split(":").map(Number);
  if (period === "PM" && hours !== 12) hours += 12;
  if (period === "AM" && hours === 12) hours = 0;
  return `${hours.toString().padStart(2, "0")}:${minutes.toString().padStart(2, "0")}`;
};

// Generate time options in 30-minute increments
export const generateTimeOptions = (): string[] => {
  const options: string[] = [];
  for (let hour = 0; hour < 24; hour++) {
    for (let minute = 0; minute < 60; minute += 30) {
      const period = hour >= 12 ? "PM" : "AM";
      let hours12 = hour % 12;
      if (hours12 === 0) hours12 = 12;
      const timeStr = `${hours12.toString().padStart(2, "0")}:${minute.toString().padStart(2, "0")} ${period}`;
      options.push(timeStr);
    }
  }
  return options;
};

// Check if a clock-in time is early or late relative to shift start
export const getAttendanceStatus = (
  clockInDate: Date | null,
  shiftStartTime24h?: string | null,
): "Early" | "Late" | "N/A" => {
  if (!clockInDate) return "N/A";
  const timeInMinutes = clockInDate.getHours() * 60 + clockInDate.getMinutes();

  // Default to 8:00 AM if no shift
  let shiftStartMinutes = 480;
  if (shiftStartTime24h) {
    const [shiftHours, shiftMinutes] = shiftStartTime24h.split(":").map(Number);
    if (!isNaN(shiftHours) && !isNaN(shiftMinutes)) {
      shiftStartMinutes = shiftHours * 60 + shiftMinutes;
    }
  }

  return timeInMinutes <= shiftStartMinutes ? "Early" : "Late";
};
