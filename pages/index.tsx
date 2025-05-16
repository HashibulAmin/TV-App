// pages/index.tsx
import dynamic from "next/dynamic";
import { useState, useEffect, useCallback, useRef } from "react";
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
  const [volume, setVolume] = useState(0.5);
  const scrollRef = useRef<HTMLDivElement>(null);
  // const [muted, setMuted] = useState(false);
  // const [playbackRate, setPlaybackRate] = useState(1.0);

  const FIXED_TOKEN =
    "1fd181a9b035498110ec2a36a585b378be52fe13-13683c860a7b7efc2a6e45dcf182723b-1747408584-1747397784";

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

  const scrollByItems = (direction: "left" | "right") => {
      if (!scrollRef.current) return;
      const gap = 16;               // matches your CSS 1rem gap
      const cardWidth = 200;        // matches your CSS grid-auto-columns
      const amount = (cardWidth + gap) * 2;
      scrollRef.current.scrollBy({
        left: direction === "right" ? amount : -amount,
        behavior: "smooth",
      });
    };

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
      // CHANNEL NAVIGATION
      if (["ArrowRight","MediaTrackNext","ChannelDown"].includes(e.code) || e.key==="ArrowRight") {
        e.preventDefault();
        updateChannel((currentIndex + 1) % filtered.length);
      }
      else if (["ArrowLeft","MediaTrackPrevious","ChannelUp"].includes(e.code) || e.key==="ArrowLeft") {
        e.preventDefault();
        updateChannel((currentIndex - 1 + filtered.length) % filtered.length);
      }
  
      // VOLUME CONTROL (if the TV forwards these)
      else if (["ArrowUp","AudioVolumeUp","VolumeUp","MediaVolumeUp"].includes(e.code) || e.key==="ArrowUp") {
        e.preventDefault();
        setVolume(v => Math.min(1, v + 0.1));
      }
      else if (["ArrowDown","AudioVolumeDown","VolumeDown","MediaVolumeDown"].includes(e.code) || e.key==="ArrowDown") {
        e.preventDefault();
        setVolume(v => Math.max(0, v - 0.1));
      }
    };
  
    // Log unknown keys during testing:
    const logger = (e: KeyboardEvent) => console.log("KeyEvent:", e.key, e.code);
    window.addEventListener("keydown", handleKey);
    window.addEventListener("keydown", logger);
  
    return () => {
      window.removeEventListener("keydown", handleKey);
      window.removeEventListener("keydown", logger);
    };
  }, [filtered, currentIndex, updateChannel]);

  return (
    <div className={styles.container}>
      <Head>
        <title>HappyNet TV Channels</title>
      </Head>
      <main className={styles.main}>
        <div className={styles.header}>
        <img
          src="/happynet.jpeg"
          alt="HappyNet TV"
          className={styles.logo}
          />
        </div>
        <div className={styles.player}>
          {currentUrl ? (
            <ReactPlayer
              url={currentUrl}
              playing
              controls
              width="100%"
              height="100%"
              volume={volume}
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
        <div className={styles.controls}>
          <div className={styles.arrows}>
            <button
              onClick={() => scrollByItems("left")}
              aria-label="Scroll Left"
              className={styles.arrowBtn}
            >‹</button>
            <button
              onClick={() => scrollByItems("right")}
              aria-label="Scroll Right"
              className={styles.arrowBtn}
            >›</button>
          </div>
        </div>  
        <div className={styles.gridWrapper}>
          <div ref={scrollRef} className={styles.gridScrollable}>
            {filtered.map((ch, idx) => (
              <div
                key={ch.ch_id}
                className={styles.cardScrollable}
                onClick={() => updateChannel(idx)}
              >
                <img
                  src={`http://tv.roarzone.info${ch.img_url}`}
                  alt={ch.ch_name}
                  className={styles.thumbScrollable}
                />
                <h3>{ch.ch_name}</h3>
              </div>
            ))}
          </div>
        </div>
      </main>
    </div>
  );
}

export const getServerSideProps: GetServerSideProps<Props> = async () => {
  const apiUrl = process.env.VIDEO_URI || "http://tv.roarzone.info/app.php?per=true";
  try {
    const res = await fetch(apiUrl);
    if (!res.ok) {
      console.error(`Upstream status: ${res.status}`);
      return { props: { channels: [] } };
    }
    const channels: Channel[] = await res.json();
    return { props: { channels } };
  } catch (err) {
    console.error("SSR fetch error:", err);
    return { props: { channels: [] } };
  }
};