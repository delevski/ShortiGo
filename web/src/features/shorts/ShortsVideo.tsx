import { Play } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import type { Episode } from "../../domain/types";
import { ShortsProgressBar } from "./ShortsProgressBar";

type ShortsVideoProps = {
  active: boolean;
  episode: Episode;
  unlocked: boolean;
};

export function ShortsVideo({ active, episode, unlocked }: ShortsVideoProps) {
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const [playing, setPlaying] = useState(false);
  const [progress, setProgress] = useState(0);
  const [isLandscape, setIsLandscape] = useState(false);

  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    if (!active || !unlocked) {
      video.pause();
      return;
    }

    const play = async () => {
      try {
        await video.play();
      } catch {
        setPlaying(false);
      }
    };

    void play();
  }, [active, unlocked, episode.id]);

  useEffect(() => {
    setIsLandscape(false);
  }, [episode.id]);

  const handleToggle = () => {
    const video = videoRef.current;
    if (!video || !unlocked) return;

    if (video.paused) {
      void video.play();
      return;
    }
    video.pause();
  };

  const handleLoadedMetadata = (video: HTMLVideoElement) => {
    setIsLandscape(video.videoWidth > video.videoHeight);
  };

  return (
    <div className="shorts-video-shell">
      <button
        className={`shorts-video-button${isLandscape ? " shorts-video-button--landscape" : ""}`}
        type="button"
        onClick={handleToggle}
        aria-label={playing ? "Pause episode" : "Play episode"}
      >
        <video
          ref={videoRef}
          src={episode.videoUrl}
          poster={episode.thumbnailUrl}
          playsInline
          loop
          muted
          onPlay={() => setPlaying(true)}
          onPause={() => setPlaying(false)}
          onLoadedMetadata={(event) => handleLoadedMetadata(event.currentTarget)}
          onTimeUpdate={(event) => {
            const video = event.currentTarget;
            setProgress(video.duration ? video.currentTime / video.duration : 0);
          }}
        />
        {!playing || !unlocked ? (
          <span className="shorts-video-button__play">
            <Play aria-hidden="true" size={32} fill="currentColor" />
          </span>
        ) : null}
      </button>
      <ShortsProgressBar progress={progress} />
    </div>
  );
}
