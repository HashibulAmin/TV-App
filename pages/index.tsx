// pages/index.tsx
import dynamic from "next/dynamic";
import { useEffect, useState, useCallback } from "react";
import Head from "next/head";
import styles from "../styles/Home.module.css";

// Load ReactPlayer only on the client to avoid SSR issues
const ReactPlayer = dynamic(() => import("react-player"), { ssr: false });

type Channel = {
  ch_id:   string;
  ch_name: string;
  img_url: string;
  ch_url:  string; // ends with '?token='
};

export default function Home() {
  const [channels, setChannels] = useState<Channel[]>([]);
  const [filtered, setFiltered] = useState<Channel[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [currentUrl, setCurrentUrl] = useState("");
  const [currentIndex, setCurrentIndex] = useState(0);
  const [volume, setVolume] = useState(0.8); // default 80%

  // fixed token for all streams
  const FIXED_TOKEN =
    "5c04cad87b3fe51326b9227801117f24ced893a3-782a46ed37420de6b02ec5a9ad8a099a-1747375362-1747364562";

  // Fetch channel list and autoplay first (client-side only)
  useEffect(() => {
    // Only run in the browser
    if (typeof window === "undefined") return;
  
    // // Use the same protocol your page is on (http or https)
    // const protocol = window.location.protocol; 
    // const channelApi = `${protocol}//tv.roarzone.info/app.php?per=true`;
  
    fetch('/api/v1/videos', {
      method: "GET",
      mode: "cors",
      cache: "no-cache",
    })
      .then(res => {
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        return res.json();
      })
      .then((data: Channel[]) => {
        if (Array.isArray(data) && data.length) {
          setChannels(data);
          setFiltered(data);
          // Autoplay first channel
          setCurrentIndex(0);
          setCurrentUrl(data[0].ch_url + FIXED_TOKEN);
        }
      })
      .catch(err => {
        console.error("Failed to fetch channels:", err);
      });
  }, []);

  // Apply search filter
  useEffect(() => {
    setFiltered(
      channels.filter((ch) =>
        ch.ch_name.toLowerCase().includes(searchTerm.toLowerCase())
      )
    );
  }, [searchTerm, channels]);

  // Helper to update current channel
  const updateChannel = useCallback(
    (index: number) => {
      const ch = filtered[index];
      if (!ch) return;
      setCurrentIndex(index);
      setCurrentUrl(ch.ch_url + FIXED_TOKEN);
    },
    [filtered]
  );

  // Handle remote Next/Prev and Volume Up/Down keys
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

  // On user click
  const selectChannel = (index: number) => updateChannel(index);

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
              volume={volume}
              width="100%"
              height="100%"
              style={{ backgroundColor: "#000" }}
            />
          ) : (
            <div className={styles.placeholder}>
              Select a channel to watch
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
              onClick={() => selectChannel(idx)}
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
