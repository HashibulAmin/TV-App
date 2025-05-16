import { useEffect, useState, useCallback } from "react";
import Head from "next/head";
import ReactPlayer from "react-player";
import styles from "../styles/Home.module.css";

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

  // fixed token for all streams
  const FIXED_TOKEN =
    "5c04cad87b3fe51326b9227801117f24ced893a3-782a46ed37420de6b02ec5a9ad8a099a-1747375362-1747364562";

  // Fetch channel list and autoplay first
  useEffect(() => {
    fetch("/api/channels")
      .then((res) => {
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        return res.json();
      })
      .then((data) => {
        if (Array.isArray(data)) {
          setChannels(data);
          setFiltered(data);
          if (data.length > 0) {
            // autoplay first channel
            setCurrentIndex(0);
            setCurrentUrl(data[0].ch_url + FIXED_TOKEN);
          }
        } else {
          console.error("Unexpected payload:", data);
        }
      })
      .catch((err) => {
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
      const ch = channels[index];
      if (!ch) return;
      setCurrentIndex(index);
      setCurrentUrl(ch.ch_url + FIXED_TOKEN);
    },
    [channels, FIXED_TOKEN]
  );

  // Handle remote Next/Prev buttons
  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === "ArrowRight" || e.code === "MediaTrackNext") {
        e.preventDefault();
        const next = (currentIndex + 1) % channels.length;
        updateChannel(next);
      } else if (e.key === "ArrowLeft" || e.code === "MediaTrackPrevious") {
        e.preventDefault();
        const prev = (currentIndex - 1 + channels.length) % channels.length;
        updateChannel(prev);
      }
    };
    window.addEventListener("keydown", handleKey);
    return () => window.removeEventListener("keydown", handleKey);
  }, [channels.length, currentIndex, updateChannel]);

  // On user click
  const selectChannel = (index: number) => {
    updateChannel(index);
  };

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