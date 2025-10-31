// hour_index: 0..23 where 23 = current local hour
export function startOfCurrentHour(): Date {
    const d = new Date();
    d.setMinutes(0, 0, 0);
    return d;
  }
  
  export function hourIndexToLocalMs(hour: number, anchor = startOfCurrentHour()): number {
    const d = new Date(anchor);
    d.setHours(d.getHours() - (23 - hour)); // 23→0h back, 22→1h, ... 0→23h
    return d.getTime();
  }
  
  export function last24HourStarts(): number[] {
    const end = startOfCurrentHour();
    const out: number[] = [];
    for (let i = 23; i >= 0; i--) {
      const d = new Date(end);
      d.setHours(d.getHours() - i);
      out.push(d.getTime());
    }
    return out; // oldest → newest
  }
  