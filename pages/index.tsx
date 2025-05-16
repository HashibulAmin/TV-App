import { useEffect, useState } from "react";
import Head from "next/head";
import ReactPlayer from "react-player";
import styles from "../styles/Home.module.css";

type Channel = {
  ch_id: string;
  ch_name: string;
  img_url: string;
  ch_url: string;
  // …other fields
};

export default function Home() {
  const [channels, setChannels] = useState<Channel[]>([]);
  const [filtered, setFiltered] = useState<Channel[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [currentUrl, setCurrentUrl] = useState("");
  const [loading, setLoading] = useState(false);

  // ❶ Fetch channels directly from the PHP backend
  useEffect(() => {
    fetch("http://tv.roarzone.info/app.php?per=true")
      .then((res) => {
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        return res.json();
      })
      .then((data) => {
        if (Array.isArray(data)) {
          setChannels(data);
          setFiltered(data);
        } else {
          console.error("Unexpected payload:", data);
        }
      })
      .catch((err) => {
        console.error("Failed to fetch channels:", err);
      });
  }, []);

  // ❷ Apply search‐filter
  useEffect(() => {
    setFiltered(
      channels.filter((ch) =>
        ch.ch_name.toLowerCase().includes(searchTerm.toLowerCase()),
      ),
    );
  }, [searchTerm, channels]);

  // ❸ When user clicks, POST to get a fresh token
  const selectChannel = async (ch: Channel) => {
    setLoading(true);
    try {
      const resp = await fetch(`http://tv.roarzone.info/${ch.ch_id}`, {
        method: "POST",
        headers: {
          // Basic admin:admin123
          Authorization: "Basic YWRtaW46YWRtaW4xMjM=",
        },
      });
      if (!resp.ok) throw new Error(`Token HTTP ${resp.status}`);
      let txt = (await resp.text()).trim().replace(/^\//, "");
      setCurrentUrl(`http://peer19.roarzone.info:8080/${txt}`);
    } catch (e) {
      console.error("Token fetch failed:", e);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className={styles.container}>
      <Head>
        <title>TV Channels</title>
      </Head>

      <main className={styles.main}>
        {/* Video Player + Loading */}
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
          {loading && <div className={styles.loading}>Loading…</div>}
        </div>

        {/* Search Bar */}
        <input
          type="text"
          placeholder="Search channels…"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className={styles.search}
        />

        {/* Grid of Channels */}
        <div className={styles.grid}>
          {filtered.map((ch) => (
            <div
              key={ch.ch_id}
              className={styles.card}
              onClick={() => selectChannel(ch)}
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
