"use client";

import { useState } from "react";
import { DateRangePicker, type DateRange } from "@/components/ui/date-range-picker";

export default function DateRangePickerDemo() {
  const [report, setReport] = useState<DateRange>({ start: "2026-11-02", end: "2026-11-15" });
  const [stay, setStay] = useState<DateRange>({ start: null, end: null });

  const nights = stay.start && stay.end ? Math.round((Date.parse(stay.end) - Date.parse(stay.start)) / 86_400_000) : 0;

  return (
    <div className="w-full rounded-2xl bg-zinc-950 px-4 py-8 sm:px-8 sm:py-10">
      <div className="grid gap-10 md:grid-cols-2">
        <div>
          <DateRangePicker label="Report period" value={report} onChange={setReport} />
          <p className="mt-3 text-xs text-zinc-500" aria-live="polite">
            onChange: {report.start ?? "null"} → {report.end ?? "null"}
          </p>
        </div>
        <div>
          <DateRangePicker
            label="Your stay"
            value={stay}
            onChange={setStay}
            minDate="2026-11-20"
            maxDate="2027-03-31"
            maxDays={14}
            presets={false}
            accent="#34d399"
          />
          <p className="mt-3 text-xs text-zinc-500" aria-live="polite">
            {nights
              ? `${nights} night${nights === 1 ? "" : "s"} booked`
              : "Bookable Nov 20 – Mar 31, up to 14 days. No presets."}
          </p>
        </div>
      </div>
      <p className="mt-10 text-xs text-zinc-600">
        In the calendar: arrows move a day or a week, Page Up/Down a month (with Shift a year), Home/End jump to the
        week&apos;s edges, Enter picks, Escape cancels then closes.
      </p>
    </div>
  );
}
