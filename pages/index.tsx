import { useEffect, useState } from "react";
import Head from "next/head";
import ReactPlayer from "react-player";
import styles from "../styles/Home.module.css";

const Home = () => {
  const [channels, setChannels] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [filtered, setFiltered] = useState([]);
  const [currentUrl, setCurrentUrl] = useState("");

  useEffect(() => {
    fetch("/api/channels")
      .then((res) => res.json())
      .then((data) => {
        setChannels(data);
        setFiltered(data);
      })
      .catch(console.error);
  }, []);

  useEffect(() => {
    const f = channels.filter((ch) =>
      ch.ch_name.toLowerCase().includes(searchTerm.toLowerCase()),
    );
    setFiltered(f);
  }, [searchTerm, channels]);

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
              onClick={() => setCurrentUrl(ch.ch_url)}
            >
              <div className={styles.cardIcon}>📺</div>
              <h3>{ch.ch_name}</h3>
            </div>
          ))}
        </div>
      </main>
    </div>
  );
};

export default Home;
