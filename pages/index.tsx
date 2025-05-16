// pages/index.tsx
import dynamic from "next/dynamic";
import { useState, useEffect, useCallback } from "react";
import Head from "next/head";
import type { GetServerSideProps } from "next";
import styles from "../styles/Home.module.css";

// Dynamically load ReactPlayer on client only
const ReactPlayer = dynamic(() => import("react-player"), { ssr: false });

type Channel = {
  ch_id:   string;
  ch_name: string;
  img_url: string;
  ch_url:  string; // ends with '?token='
};

interface Props {
  channels: Channel[];
}

export default function Home({ channels }: Props) {
  const [filtered, setFiltered] = useState<Channel[]>(channels);
  const [searchTerm, setSearchTerm] = useState("");
  const [currentUrl, setCurrentUrl] = useState("");
  const [currentIndex, setCurrentIndex] = useState(0);

  const FIXED_TOKEN =
    "5c04cad87b3fe51326b9227801117f24ced893a3-782a46ed37420de6b02ec5a9ad8a099a-1747375362-1747364562";

  // Autoplay first channel on mount
  useEffect(() => {
    if (channels.length > 0) {
      setCurrentIndex(0);
      setCurrentUrl(channels[0].ch_url + FIXED_TOKEN);
    }
  }, [channels]);

  // Filter channels
  useEffect(() => {
    setFiltered(
      channels.filter((ch) =>
        ch.ch_name.toLowerCase().includes(searchTerm.toLowerCase())
      )
    );
    // Reset to first of filtered
    setCurrentIndex(0);
  }, [searchTerm, channels]);

  const updateChannel = useCallback(
    (index: number) => {
      const ch = filtered[index];
      if (!ch) return;
      setCurrentIndex(index);
      setCurrentUrl(ch.ch_url + FIXED_TOKEN);
    },
    [filtered]
  );

  // Keyboard navigation
  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === "ArrowRight") {
        const next = (currentIndex + 1) % filtered.length;
        updateChannel(next);
      } else if (e.key === "ArrowLeft") {
        const prev = (currentIndex - 1 + filtered.length) % filtered.length;
        updateChannel(prev);
      }
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
            <div className={styles.placeholder}>Loading...</div>
          )}
        </div>
        <input
          type="text"
          placeholder="Search channels..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className={styles.search}
        />
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

export const getServerSideProps: GetServerSideProps<Props> = async () => {
  try {
    const res = await fetch("http://tv.roarzone.info/app.php?per=true");
    const channels: Channel[] = res.ok ? await res.json() : [];
    return { props: { channels } };
  } catch (err) {
    console.error("SSR fetch error:", err);
    return { props: { channels: [] } };
  }
};
