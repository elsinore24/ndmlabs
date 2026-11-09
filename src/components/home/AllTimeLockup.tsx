/** The All-Time 5 lockup at panel size: ALL-TIME over a gold rule and a small
 *  tracked BASKETBALL, beside a big gold 5 (same build as AllTimeFiveMark). */
export default function AllTimeLockup() {
  return (
    <span role="img" aria-label="All-Time 5" className="inline-flex items-center gap-3 leading-none">
      <span aria-hidden="true" className="flex flex-col items-end gap-[5px]">
        <span className="text-[30px] font-black italic tracking-[-0.01em] text-white">ALL-TIME</span>
        <span className="h-[2px] w-full bg-[#f2c14e]" />
        <span className="text-[10px] font-bold tracking-[0.42em] text-[#e9d9a8]">BASKETBALL</span>
      </span>
      <span
        aria-hidden="true"
        className="text-[74px] font-black leading-[0.8] bg-clip-text text-transparent"
        style={{ backgroundImage: "linear-gradient(180deg, #ffe08a 0%, #f2c14e 45%, #b8862a 100%)" }}
      >
        5
      </span>
    </span>
  );
}
