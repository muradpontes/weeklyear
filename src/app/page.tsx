"use client";

import { useState } from "react";
import html2canvas from "html2canvas";

export default function WeeklyCollage() {
  const [username, setUsername] = useState("");
  const [selectedSize, setSelectedSize] = useState<number>(3);
  const [appliedCovers, setAppliedCovers] = useState<string[]>([]);
  const [allCovers, setAllCovers] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [borderColor, setBorderColor] = useState("#000000");
  const [showGrid, setShowGrid] = useState(false);

  const sizes = [3, 4, 5, 6, 7];

  const handleFetch = async () => {
    if (!username) return;
    setLoading(true);
    try {
      const res = await fetch(`/api/weeklyear?user=${username}`);
      if (!res.ok) throw new Error("failed to fetch");
      const data = await res.json();

      const covers: string[] = data.weeks
        .map((w: any) => w.cover)
        .filter((c: string) => !!c);

      setAllCovers(covers);
      setAppliedCovers(covers.slice(0, selectedSize * selectedSize));
    } catch (err) {
      console.error(err);
      setAllCovers([]);
      setAppliedCovers([]);
    } finally {
      setLoading(false);
    }
  };

  const handleDownload = async () => {
    const collage = document.getElementById("collage");
    if (!collage) return;
    const canvas = await html2canvas(collage, {
      useCORS: true,
      backgroundColor: null,
      scale: 3,
    });
    const link = document.createElement("a");
    link.download = "weeklyar.png";
    link.href = canvas.toDataURL("image/png");
    link.click();
  };

  const handleSizeChange = (size: number) => {
    setSelectedSize(size);
    setAppliedCovers(allCovers.slice(0, size * size));
  };

  return (
    <div className="flex flex-col items-center justify-start min-h-screen bg-gray-100 p-6">
      <h1 className="text-2xl sm:text-xl font-bold mb-4 text-center">
        weeklyear
      </h1>
      <h1 className="text-xl sm:text-sm font-bold mb-4 text-center">
        a collage of your most streamed album of each week of the year!
      </h1>
      <div className="flex flex-col items-center gap-3 w-full max-w-xs">

        <input
          type="text"
          placeholder="last.fm username"
          value={username}
          onChange={(e) => setUsername(e.target.value)}
          className="w-40 sm:w-42 px-3 py-1  border-1 rounded text-center text-base sm:text-xm"
        />

        <div className="flex gap-3 items-center w-full justify-center">
          <select
            value={selectedSize}
            onChange={(e) => handleSizeChange(Number(e.target.value))}
            className="w-20 sm:w-19 px-3 py border-1 rounded text-base sm:text-xm"
          >
            {sizes.map((s) => (
              <option
                key={s}
                value={s}
                disabled={s === 7 && allCovers.length < 42}
              >
                {s}x{s}
              </option>
            ))}
          </select>

          <div className="flex gap-2 items-center text-base sm:text-lg">
            <label className="flex items-center gap-1">
              <input
                type="checkbox"
                checked={showGrid}
                onChange={() => setShowGrid(!showGrid)}
                className="border rounded w-5 h-5 sm:w-5 sm:h-5"
              />
              grid
            </label>
            {showGrid && (
              <input
                type="color"
                value={borderColor}
                onChange={(e) => setBorderColor(e.target.value)}
                className="w-8 h-8 sm:w-5 sm:h-6"
              />
            )}
          </div>
        </div>


        <button
          onClick={handleFetch}
          disabled={loading || !username}
          className={`w-28 sm:w-25 px-3 py bg-red-700 text-white rounded text-base sm:text-lg hover:bg-red-800 disabled:opacity-50 ${username ? "cursor-pointer" : "cursor-default"
            }`}
        >
          {loading ? "loading..." : "generate"}
        </button>
      </div>

      {appliedCovers.length > 0 && (
        <div className="flex flex-col items-center justify-center w-full mt-4">
          <div
            id="collage"
            className="grid w-full max-w-[500px] aspect-square"
            style={{
              gridTemplateColumns: `repeat(${selectedSize}, 1fr)`,
              border: showGrid ? `4px solid ${borderColor}` : "none",
            }}
          >
            {appliedCovers.map((url, idx) => (
              <img
                key={idx}
                src={url}
                alt={`album ${idx + 1}`}
                className="w-full h-full object-cover"
                style={{
                  border: showGrid ? `1px solid ${borderColor}` : "none",
                }}
              />
            ))}
          </div>

          <button
            onClick={handleDownload}
            className="mt-3 px-2 py bg-red-700 text-white text-base sm:text-xm rounded hover:bg-red-800 cursor-pointer w-32 sm:w-24"
          >
            download
          </button>
        </div>
      )}
    </div>
  );
}
