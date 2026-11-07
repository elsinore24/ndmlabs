/** The NDMLABS wordmark: white NDM, green LABS. Off the homepage it is the
 *  way back to it (Dan, 2026-11-06), so pages wrap it in a link to "/". */
export default function NdmLabsMark({ className = "" }: { className?: string }) {
  return (
    <span className={`font-bold tracking-tight text-white whitespace-nowrap ${className}`}>
      NDM<span className="text-[#00ff88]">LABS</span>
    </span>
  );
}
