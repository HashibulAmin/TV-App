import { useEffect, useState } from "react";
import Head from "next/head";
import ReactPlayer from "react-player";
import styles from "../styles/Home.module.css";

export default function Home() {
  const [channels, setChannels] = useState<any[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [filtered, setFiltered] = useState<any[]>([]);
  const [currentUrl, setCurrentUrl] = useState("");
  const [loading, setLoading] = useState(false);

  // fetch channel list
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
        }
      })
      .catch(console.error);
  }, []);

  // filter by searchTerm
  useEffect(() => {
    setFiltered(
      channels.filter((ch) =>
        ch.ch_name.toLowerCase().includes(searchTerm.toLowerCase()),
      ),
    );
  }, [searchTerm, channels]);

  // when a user clicks a channel, fetch a fresh token URL
  const selectChannel = async (ch: any) => {
    setLoading(true);
    try {
      const res = await fetch(
        `/api/token?ch_id=${encodeURIComponent(ch.ch_id)}`,
      );
      if (!res.ok) throw new Error(`Token HTTP ${res.status}`);
      const { path } = await res.json();
      setCurrentUrl(path);
    } catch (err) {
      console.error("Token error:", err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className={styles.container}>
      <Head>
        <title>TV Channels</title>
        <meta name="description" content="Watch TV channels" />
      </Head>

      <main className={styles.main}>
        <div className={styles.player}>
          {currentUrl ? (
            <ReactPlayer
              url={currentUrl}
              controls
              width="100%"
              height="100%"
              style={{ backgroundColor: "#000" }}
            />
          ) : (
            <div className={styles.placeholder}>Select a channel to watch</div>
          )}
          {loading && <div className={styles.loading}>Loading...</div>}
        </div>

        <input
          type="text"
          placeholder="Search channels..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className={styles.search}
        />

        <div className={styles.grid}>
          {filtered.map((ch) => (
            <div
              key={ch.ch_id}
              className={styles.card}
              onClick={() => selectChannel(ch)}
            >
              <div className={styles.cardIcon}>📺</div>
              <h3>{ch.ch_name}</h3>
            </div>
          ))}
        </div>
      </main>
    </div>
  );
}
