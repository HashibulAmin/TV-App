// pages/index.tsx
import dynamic from "next/dynamic";
import { useEffect, useState, useCallback } from "react";
import Head from "next/head";
import type { GetServerSideProps } from "next";
import styles from "../styles/Home.module.css";

// Only import ReactPlayer on the client
const ReactPlayer = dynamic(() => import("react-player"), { ssr: false });

export type Channel = {
  ch_id:   string;
  ch_name: string;
  img_url: string;
  ch_url:  string; // ends with '?token='
};

interface Props {
  channels: Channel[];
}

export default function Home({ channels: initialChannels }: Props) {
  const [channels]   = useState<Channel[]>(initialChannels);
  const [filtered, setFiltered] = useState<Channel[]>(initialChannels);
  const [searchTerm, setSearchTerm] = useState("");
  const [currentUrl, setCurrentUrl]   = useState("");
  const [currentIndex, setCurrentIndex] = useState(0);

  // fixed token for all streams
  const FIXED_TOKEN =
    "5c04cad87b3fe51326b9227801117f24ced893a3-782a46ed37420de6b02ec5a9ad8a099a-1747375362-1747364562";

  // On first render, autoplay the first channel
  useEffect(() => {
    if (channels.length > 0) {
      setCurrentIndex(0);
      setCurrentUrl(channels[0].ch_url + FIXED_TOKEN);
    }
  }, [channels]);

  // Apply search filter
  useEffect(() => {
    setFiltered(
      channels.filter((ch) =>
        ch.ch_name.toLowerCase().includes(searchTerm.toLowerCase())
      )
    );
  }, [searchTerm, channels]);

  // Helper to switch channel by index
  const updateChannel = useCallback(
    (index: number) => {
      const ch = filtered[index];
      if (!ch) return;
      setCurrentIndex(index);
      setCurrentUrl(ch.ch_url + FIXED_TOKEN);
    },
    [filtered]
  );

  // Handle remote Next/Prev and volume Up/Down
  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      if (["ArrowRight","MediaTrackNext"].includes(e.code) || e.key==="ArrowRight") {
        e.preventDefault();
        updateChannel((currentIndex + 1) % filtered.length);
      }
      if (["ArrowLeft","MediaTrackPrevious"].includes(e.code) || e.key==="ArrowLeft") {
        e.preventDefault();
        updateChannel((currentIndex - 1 + filtered.length) % filtered.length);
      }
      // volume keys typically don't reach the browser on TV; omit here or add if you see them
    };
    window.addEventListener("keydown", handleKey);
    return () => window.removeEventListener("keydown", handleKey);
  }, [filtered, currentIndex, updateChannel]);

  return (
    <div className={styles.container}>
      <Head>
        <title>TV Channels</title>
      </Head>

      <main className={styles.main}>
        <div className={styles.header}>
          <h1 className={styles.title}>HappyNet</h1>
        </div>

        {/* Video Player */}
        <div className={styles.player}>
          {currentUrl ? (
            <ReactPlayer
              url={currentUrl}
              playing
              controls
              width="100%"
              height="100%"
              style={{ backgroundColor: "#000" }}
            />
          ) : (
            <div className={styles.placeholder}>
              Loading channel…
            </div>
          )}
        </div>

        {/* Search Bar */}
        <input
          type="text"
          placeholder="Search channels…"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className={styles.search}
        />

        {/* Channel Grid */}
        <div className={styles.grid}>
          {filtered.map((ch, idx) => (
            <div
              key={ch.ch_id}
              className={styles.card}
              onClick={() => updateChannel(idx)}
            >
              <img
                src={`http://tv.roarzone.info${ch.img_url}`}
                alt={ch.ch_name}
                className={styles.thumb}
              />
              <h3>{ch.ch_name}</h3>
            </div>
          ))}
        </div>
      </main>
    </div>
  );
}

// Server‐side fetch avoids CORS and Vercel edge restrictions
export const getServerSideProps: GetServerSideProps<Props> = async () => {
  try {
    const res = await fetch("http://tv.roarzone.info/app.php?per=true");
    if (!res.ok) {
      console.error("Upstream status:", res.status);
      return { props: { channels: [] } };
    }
    const channels: Channel[] = await res.json();
    return { props: { channels } };
  } catch (err) {
    console.error("Error fetching channels SSR:", err);
    return { props: { channels: [] } };
  }
};
