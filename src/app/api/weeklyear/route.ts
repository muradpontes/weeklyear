import { NextRequest, NextResponse } from "next/server";
import axios from "axios";

const ipMap = new Map<string, number>();
const RATE_LIMIT_MS = 10 * 60 * 1000;

export async function GET(req: NextRequest) {
  const ip = req.headers.get("x-forwarded-for") || req.headers.get("x-real-ip") || "unknown";

  const last = ipMap.get(ip) || 0;
  if (Date.now() - last < RATE_LIMIT_MS) {
    return NextResponse.json({ error: "rate limit exceeded" }, { status: 429 });
  }
  ipMap.set(ip, Date.now());

  const user = req.nextUrl.searchParams.get("user");
  const apiKey = process.env.API_KEY;

  if (!user || !apiKey) {
    return NextResponse.json({ error: "missing user or api key" }, { status: 400 });
  }

  try {
    const chartListRes = await axios.get("http://ws.audioscrobbler.com/2.0/", {
      params: {
        method: "user.getweeklychartlist",
        user,
        api_key: apiKey,
        format: "json",
      },
    });

    const charts: { from: string; to: string }[] =
      chartListRes.data?.weeklychartlist?.chart || [];

    const year = new Date().getFullYear();
    const startOfYear = Math.floor(new Date(year, 0, 1).getTime() / 1000);
    const now = Math.floor(Date.now() / 1000);

    const thisYearCharts = charts.filter(
      (c) => parseInt(c.from) >= startOfYear && parseInt(c.to) <= now
    );

    const results: {
      from: string;
      to: string;
      album: string | null;
      artist: string | null;
      cover: string | null;
    }[] = [];

    for (const { from, to } of thisYearCharts) {
      let album: string | null = null;
      let artist: string | null = null;
      let cover: string | null = null;

      const weeklyAlbumsRes = await axios.get("http://ws.audioscrobbler.com/2.0/", {
        params: {
          method: "user.getweeklyalbumchart",
          user,
          api_key: apiKey,
          format: "json",
          from,
          to,
        },
      });

      const albums = weeklyAlbumsRes.data?.weeklyalbumchart?.album || [];
      if (albums.length > 0) {
        const top = albums[0];
        album = top.name || null;
        artist = top.artist?.["#text"] || null;

        if (artist && album) {
          try {
            const albumInfoRes = await axios.get("http://ws.audioscrobbler.com/2.0/", {
              params: {
                method: "album.getinfo",
                api_key: apiKey,
                artist,
                album,
                format: "json",
              },
            });

            const images = albumInfoRes.data?.album?.image || [];
            const large = images.find((img: any) => img.size === "large");
            cover = large?.["#text"] || null;
          } catch (e) {
            cover = null;
          }
        }
      }

      results.push({ from, to, album, artist, cover });
    }

    return NextResponse.json({
      user,
      year,
      weeks: results,
    });
  } catch (err: any) {
    return NextResponse.json(
      { error: err.response?.data?.message || err.message || "failed to fetch" },
      { status: 500 }
    );
  }
}
