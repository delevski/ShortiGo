import { useCallback, useEffect, useMemo, useState, type FormEvent } from "react";
import {
  GoogleAuthProvider,
  onAuthStateChanged,
  signInWithPopup,
  signOut,
  type User,
} from "firebase/auth";
import {
  arrayUnion,
  collection,
  doc,
  getDoc,
  getDocs,
  query,
  serverTimestamp,
  setDoc,
  where,
} from "firebase/firestore";
import { auth, db, firebaseConfigError } from "./firebase";
import { FileDropzone } from "./components/FileDropzone";
import { MediaPreview } from "./components/MediaPreview";
import { StatusBanner } from "./components/StatusBanner";
import { useToast } from "./components/ToastStack";
import { UploadOverlay } from "./components/UploadOverlay";
import { AppError, toUserMessage } from "./lib/appError";
import { logError, logInfo } from "./lib/logger";
import {
  cloudinaryConfigError,
  cloudinaryGeneratedThumbnailUrl,
  cloudinaryVideoDeliveryUrl,
  formatFileSize,
  uploadToCloudinaryWithProgress,
} from "./lib/cloudinary";

type SeriesOption = {
  id: string;
  title: string;
  coverUrl: string;
  category: string;
  isVip: boolean;
};

type StatusVariant = "idle" | "success" | "error" | "info";

type OverlayStep = { label: string; done: boolean; active: boolean };

function isHttpUrl(value: string): boolean {
  return value.startsWith("http://") || value.startsWith("https://");
}

function slugifySeriesId(title: string): string {
  const slug = title
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "_")
    .replace(/^_+|_+$/g, "");
  return slug || "series";
}

function statusVariantFromMessage(message: string): StatusVariant {
  if (message.startsWith("Failed:")) {
    return "error";
  }
  if (message.startsWith("Published") || message.includes("Cloudinary ready")) {
    return "success";
  }
  if (message === "Ready") {
    return "idle";
  }
  return "info";
}

async function fetchSeriesOptions(): Promise<SeriesOption[]> {
  if (!db) {
    return [];
  }
  const snap = await getDocs(collection(db, "series"));
  const rows = snap.docs.map((item) => {
    const data = item.data();
    return {
      id: item.id,
      title: typeof data.title === "string" ? data.title : item.id,
      coverUrl: typeof data.coverUrl === "string" ? data.coverUrl : "",
      category: typeof data.category === "string" ? data.category : "new",
      isVip: data.isVip === true,
    };
  });
  rows.sort((a, b) => a.title.localeCompare(b.title));
  return rows;
}

async function fetchNextEpisodeOrder(seriesId: string): Promise<number> {
  if (!db || !seriesId.trim()) {
    return 1;
  }
  const snap = await getDocs(
    query(collection(db, "episodes"), where("seriesId", "==", seriesId.trim())),
  );
  let maxOrder = 0;
  for (const item of snap.docs) {
    const order = item.data().order;
    if (typeof order === "number" && order > maxOrder) {
      maxOrder = order;
    }
  }
  return maxOrder + 1;
}

async function syncSeriesStats(
  seriesId: string,
  meta: {
    title: string;
    coverUrl: string;
    category: string;
    isVip: boolean;
  },
): Promise<{ episodeCount: number; totalDurationSec: number }> {
  if (!db) {
    return { episodeCount: 0, totalDurationSec: 0 };
  }

  const snap = await getDocs(
    query(collection(db, "episodes"), where("seriesId", "==", seriesId)),
  );

  let totalDurationSec = 0;
  for (const item of snap.docs) {
    const duration = item.data().durationSec;
    if (typeof duration === "number") {
      totalDurationSec += duration;
    }
  }
  const episodeCount = snap.size;
  const seriesRef = doc(db, "series", seriesId);
  const existing = await getDoc(seriesRef);

  const fields = {
    id: seriesId,
    title: meta.title,
    coverUrl: meta.coverUrl,
    category: meta.category,
    isVip: meta.isVip,
    episodeCount,
    totalDurationSec,
    isPublished: true,
  };

  if (!existing.exists()) {
    await setDoc(seriesRef, {
      ...fields,
      description: "",
      createdAt: serverTimestamp(),
      popularity: 0,
    });
  } else {
    await setDoc(seriesRef, fields, { merge: true });
  }

  return { episodeCount, totalDurationSec };
}

function initialUploadSteps(hasThumbnail: boolean): OverlayStep[] {
  const steps: OverlayStep[] = [
    { label: "Video upload", done: false, active: true },
  ];
  if (hasThumbnail) {
    steps.push({ label: "Thumbnail upload", done: false, active: false });
  }
  steps.push({ label: "Apply URLs", done: false, active: false });
  return steps;
}

function markStep(
  steps: OverlayStep[],
  index: number,
  done: boolean,
  active: boolean,
): OverlayStep[] {
  return steps.map((step, i) => ({
    ...step,
    done: i < index ? true : i === index ? done : step.done,
    active: i === index ? active : false,
  }));
}

export function App() {
  const [user, setUser] = useState<User | null>(null);
  const [seriesMode, setSeriesMode] = useState<"existing" | "new">("existing");
  const [seriesOptions, setSeriesOptions] = useState<SeriesOption[]>([]);
  const [selectedSeriesId, setSelectedSeriesId] = useState("");
  const [seriesId, setSeriesId] = useState("");
  const [order, setOrder] = useState(1);
  const [durationSec, setDurationSec] = useState(0);
  const [isVipLocked, setIsVipLocked] = useState(false);
  const [seriesTitle, setSeriesTitle] = useState("");
  const [seriesCoverUrl, setSeriesCoverUrl] = useState("");
  const [seriesCategory, setSeriesCategory] = useState("new");
  const [seriesIsVip, setSeriesIsVip] = useState(false);
  const [addToForYou, setAddToForYou] = useState(true);
  const [videoUrl, setVideoUrl] = useState("");
  const [thumbnailUrl, setThumbnailUrl] = useState("");
  const [videoFile, setVideoFile] = useState<File | null>(null);
  const [thumbnailFile, setThumbnailFile] = useState<File | null>(null);
  const [replaceExisting, setReplaceExisting] = useState(false);
  const [status, setStatus] = useState("Ready");
  const toast = useToast();

  const notifyError = useCallback(
    (title: string, error: unknown) => {
      const message = toUserMessage(error);
      const details =
        error instanceof AppError ? error.details : undefined;
      logError(title, error, details);
      toast.error(title, message);
      setStatus(`Failed: ${message}`);
    },
    [toast],
  );

  const notifySuccess = useCallback(
    (title: string, message: string) => {
      logInfo(title, { message });
      toast.success(title, message);
      setStatus(message);
    },
    [toast],
  );
  const [loading, setLoading] = useState(false);
  const [uploadingMedia, setUploadingMedia] = useState(false);
  const [overlayOpen, setOverlayOpen] = useState(false);
  const [overlayTitle, setOverlayTitle] = useState("");
  const [overlaySubtitle, setOverlaySubtitle] = useState("");
  const [overlayPercent, setOverlayPercent] = useState(0);
  const [overlayIndeterminate, setOverlayIndeterminate] = useState(false);
  const [overlaySteps, setOverlaySteps] = useState<OverlayStep[]>([]);

  const activeSeriesId = seriesMode === "existing" ? selectedSeriesId : seriesId;
  const statusVariant = statusVariantFromMessage(status);
  const cloudinaryReady = !cloudinaryConfigError();

  const refreshSeriesList = useCallback(async () => {
    if (!db || !user) {
      return;
    }
    const options = await fetchSeriesOptions();
    setSeriesOptions(options);
    if (options.length > 0 && !selectedSeriesId) {
      setSelectedSeriesId(options[0].id);
    }
  }, [user, selectedSeriesId]);

  const applyExistingSeries = useCallback((option: SeriesOption) => {
    setSelectedSeriesId(option.id);
    setSeriesId(option.id);
    setSeriesTitle(option.title);
    setSeriesCoverUrl(option.coverUrl);
    setSeriesCategory(option.category);
    setSeriesIsVip(option.isVip);
  }, []);

  const refreshNextEpisodeMeta = useCallback(
    async (targetSeriesId: string) => {
      const nextOrder = await fetchNextEpisodeOrder(targetSeriesId);
      setOrder(nextOrder);
    },
    [],
  );

  useEffect(() => {
    if (!auth) {
      return;
    }
    return onAuthStateChanged(auth, setUser);
  }, []);

  useEffect(() => {
    if (!user) {
      return;
    }
    void refreshSeriesList();
  }, [user, refreshSeriesList]);

  useEffect(() => {
    if (seriesMode !== "existing" || !selectedSeriesId) {
      return;
    }
    const option = seriesOptions.find((item) => item.id === selectedSeriesId);
    if (option) {
      applyExistingSeries(option);
    }
    void refreshNextEpisodeMeta(selectedSeriesId);
  }, [
    seriesMode,
    selectedSeriesId,
    seriesOptions,
    applyExistingSeries,
    refreshNextEpisodeMeta,
  ]);

  useEffect(() => {
    if (seriesMode !== "new") {
      return;
    }
    if (seriesTitle.trim()) {
      setSeriesId(slugifySeriesId(seriesTitle));
    }
  }, [seriesMode, seriesTitle]);

  useEffect(() => {
    if (seriesMode === "new" && seriesId.trim()) {
      void refreshNextEpisodeMeta(seriesId);
    }
  }, [seriesMode, seriesId, refreshNextEpisodeMeta]);

  const canSubmit = useMemo(() => {
    return (
      !!user &&
      activeSeriesId.trim().length > 0 &&
      isHttpUrl(videoUrl.trim()) &&
      isHttpUrl(thumbnailUrl.trim()) &&
      order >= 1 &&
      durationSec >= 1
    );
  }, [user, activeSeriesId, videoUrl, thumbnailUrl, order, durationSec]);

  function resetEpisodeForm(keepSeries: boolean) {
    setVideoFile(null);
    setThumbnailFile(null);
    setVideoUrl("");
    setThumbnailUrl("");
    setReplaceExisting(false);
    setDurationSec(0);
    if (!keepSeries) {
      setSeriesTitle("");
      setSeriesCoverUrl("");
      setSeriesCategory("new");
      setSeriesIsVip(false);
      setSeriesId("");
      setSelectedSeriesId("");
    }
  }

  async function handleSignIn() {
    if (!auth) {
      return;
    }
    const provider = new GoogleAuthProvider();
    await signInWithPopup(auth, provider);
  }

  async function handlePublish(event: FormEvent) {
    event.preventDefault();
    if (!canSubmit || !db) {
      return;
    }

    setLoading(true);
    setOverlayOpen(true);
    setOverlayIndeterminate(true);
    setOverlayTitle("Publishing episode");
    setOverlaySubtitle("Writing to Firestore…");
    setOverlaySteps([
      { label: "Save episode", done: false, active: true },
      { label: "Update series", done: false, active: false },
      { label: "Update discovery", done: false, active: false },
    ]);
    try {
      const safeSeriesId = activeSeriesId.trim();
      const safeVideoUrl = videoUrl.trim();
      const safeThumbnailUrl = thumbnailUrl.trim();
      const safeSeriesTitle = seriesTitle.trim() || `Series ${safeSeriesId}`;
      const safeCoverUrl = seriesCoverUrl.trim() || safeThumbnailUrl;
      const episodeId = `${safeSeriesId}_e${order}`;
      const episodeRef = doc(db, "episodes", episodeId);

      setStatus("Checking existing episode...");
      const existing = await getDoc(episodeRef);
      if (existing.exists() && !replaceExisting) {
        throw new Error(
          `Episode ${episodeId} already exists. Enable "Replace existing" to overwrite.`,
        );
      }

      setStatus("Saving episode to Firestore...");
      await setDoc(episodeRef, {
        id: episodeId,
        seriesId: safeSeriesId,
        order,
        isVipLocked,
        durationSec,
        videoUrl: safeVideoUrl,
        thumbnailUrl: safeThumbnailUrl,
      });

      setStatus("Syncing series episode count...");
      const stats = await syncSeriesStats(safeSeriesId, {
        title: safeSeriesTitle,
        coverUrl: safeCoverUrl,
        category: seriesCategory,
        isVip: seriesIsVip || isVipLocked,
      });

      if (addToForYou) {
        setStatus("Adding series to For You...");
        await setDoc(
          doc(db, "admin", "featured"),
          {
            seriesIds: arrayUnion(safeSeriesId),
            updatedAt: serverTimestamp(),
          },
          { merge: true },
        );
      }

      const publishedSeriesId = safeSeriesId;
      resetEpisodeForm(true);
      await refreshSeriesList();
      setSeriesMode("existing");
      setSelectedSeriesId(publishedSeriesId);
      await refreshNextEpisodeMeta(publishedSeriesId);

      notifySuccess(
        "Published",
        `Episode ${episodeId} is live. Series "${safeSeriesId}" has ${stats.episodeCount} episode(s).`,
      );
    } catch (error) {
      notifyError("Publish failed", error);
    } finally {
      setLoading(false);
      setOverlayOpen(false);
      setOverlayIndeterminate(false);
      setOverlaySteps([]);
    }
  }

  async function handleUploadMedia() {
    if (!videoFile) {
      toast.error("Upload", "Select a video file first.");
      setStatus("Failed: select a video file first.");
      return;
    }
    const configError = cloudinaryConfigError();
    if (configError) {
      toast.error("Cloudinary not configured", configError);
      setStatus(`Failed: ${configError}`);
      return;
    }
    if (!activeSeriesId.trim()) {
      toast.error("Upload", "Choose or create a series first.");
      setStatus("Failed: choose or create a series first.");
      return;
    }

    const hasThumbnail = !!thumbnailFile;
    let steps = initialUploadSteps(hasThumbnail);

    setUploadingMedia(true);
    setOverlayOpen(true);
    setOverlayIndeterminate(false);
    setOverlayPercent(0);
    setOverlaySteps(steps);
    setOverlayTitle("Uploading to Cloudinary");
    setOverlaySubtitle(videoFile.name);

    try {
      if (order < 1) {
        await refreshNextEpisodeMeta(activeSeriesId);
      }

      setStatus("Uploading video to Cloudinary…");
      const uploadedVideo = await uploadToCloudinaryWithProgress(
        videoFile,
        "video",
        ({ loaded, total }) => {
          const percent =
            total > 0 ? Math.min(100, Math.round((loaded / total) * 100)) : 0;
          setOverlayPercent(percent);
          setOverlaySubtitle(
            `${videoFile.name} · ${formatFileSize(loaded)} / ${formatFileSize(total)}`,
          );
        },
      );

      let stepIndex = 0;
      steps = markStep(steps, stepIndex, true, false);
      if (hasThumbnail) {
        stepIndex += 1;
        steps = markStep(steps, stepIndex, false, true);
      } else {
        stepIndex += 1;
        steps = markStep(steps, 0, true, false);
        steps = markStep(steps, stepIndex, false, true);
      }
      setOverlaySteps([...steps]);

      const deliveryUrl = cloudinaryVideoDeliveryUrl(uploadedVideo);
      setVideoUrl(deliveryUrl);

      const detectedDuration = Math.max(
        1,
        Math.round(uploadedVideo.duration ?? 0),
      );
      setDurationSec(detectedDuration);

      if (thumbnailFile) {
        setOverlayTitle("Uploading thumbnail");
        setOverlaySubtitle(thumbnailFile.name);
        setOverlayPercent(0);
        setStatus("Uploading thumbnail to Cloudinary…");

        const uploadedThumb = await uploadToCloudinaryWithProgress(
          thumbnailFile,
          "image",
          ({ loaded, total }) => {
            const percent =
              total > 0 ? Math.min(100, Math.round((loaded / total) * 100)) : 0;
            setOverlayPercent(percent);
            setOverlaySubtitle(
              `${thumbnailFile.name} · ${formatFileSize(loaded)} / ${formatFileSize(total)}`,
            );
          },
        );
        setThumbnailUrl(uploadedThumb.secure_url);
        steps = markStep(steps, stepIndex, true, false);
        stepIndex += 1;
      } else {
        setThumbnailUrl(cloudinaryGeneratedThumbnailUrl(uploadedVideo));
        if (hasThumbnail) {
          steps = markStep(steps, stepIndex, true, false);
          stepIndex += 1;
        }
      }

      setOverlayIndeterminate(true);
      setOverlayTitle("Finishing up");
      setOverlaySubtitle("Applying delivery URLs…");
      steps = markStep(steps, stepIndex, true, false);
      setOverlaySteps([...steps]);

      notifySuccess(
        "Upload complete",
        `Video ready for episode #${order} (${detectedDuration}s). You can publish when ready.`,
      );
    } catch (error) {
      notifyError("Cloudinary upload failed", error);
    } finally {
      setUploadingMedia(false);
      setOverlayOpen(false);
      setOverlayIndeterminate(false);
      setOverlayPercent(0);
    }
  }

  if (firebaseConfigError) {
    return (
      <main className="page">
        <header className="hero">
          <h1>ShortiGo CRM</h1>
        </header>
        <section className="card card--alert">
          <p>
            Missing Firebase config (<code>{firebaseConfigError}</code>).
          </p>
          <p>
            Copy <code>admin/.env.example</code> to <code>admin/.env</code> and
            fill your Web app values from Firebase Console.
          </p>
        </section>
      </main>
    );
  }

  return (
    <main className="page">
      <UploadOverlay
        open={overlayOpen || loading}
        title={overlayTitle}
        subtitle={overlaySubtitle}
        percent={overlayPercent}
        indeterminate={overlayIndeterminate}
        steps={overlaySteps}
      />

      <header className="hero">
        <div>
          <p className="hero__eyebrow">Content ops</p>
          <h1>ShortiGo Studio</h1>
          <p className="hero__caption">
            Upload vertical episodes to Cloudinary and publish to your app in one
            flow.
          </p>
        </div>
        {!cloudinaryReady && (
          <span className="badge badge--warn">Cloudinary env missing</span>
        )}
      </header>

      <section className="card card--auth">
        {!user ? (
          <button className="btn btn--primary" type="button" onClick={handleSignIn}>
            Sign in with Google
          </button>
        ) : (
          <div className="user-row">
            <div className="user-row__info">
              <span className="user-row__label">Signed in</span>
              <span className="user-row__email">{user.email}</span>
            </div>
            <button
              className="btn btn--ghost"
              type="button"
              onClick={() => auth && signOut(auth)}
            >
              Sign out
            </button>
          </div>
        )}
      </section>

      <form className="layout" onSubmit={handlePublish}>
        <section className="card">
          <h2 className="section-title">Series</h2>
          <div className="segmented" role="tablist" aria-label="Series mode">
            <button
              type="button"
              className={seriesMode === "existing" ? "is-active" : ""}
              onClick={() => setSeriesMode("existing")}
            >
              Existing series
            </button>
            <button
              type="button"
              className={seriesMode === "new" ? "is-active" : ""}
              onClick={() => setSeriesMode("new")}
            >
              New series
            </button>
          </div>

          {seriesMode === "existing" ? (
            <div className="field">
              <span className="field__label">Existing series</span>
              <select
                value={selectedSeriesId}
                onChange={(e) => setSelectedSeriesId(e.target.value)}
              >
                {seriesOptions.length === 0 ? (
                  <option value="">No series found</option>
                ) : (
                  seriesOptions.map((option) => (
                    <option key={option.id} value={option.id}>
                      {option.title} ({option.id})
                    </option>
                  ))
                )}
              </select>
            </div>
          ) : (
            <>
              <div className="field">
                <span className="field__label">New series title</span>
                <input
                  value={seriesTitle}
                  onChange={(e) => setSeriesTitle(e.target.value)}
                  placeholder="My New Series"
                />
              </div>
              <div className="field">
                <span className="field__label">Series ID (auto)</span>
                <input value={seriesId} readOnly />
              </div>
            </>
          )}

          {seriesMode === "existing" && (
            <p className="hint">
              Series ID: <code>{activeSeriesId || "—"}</code>
            </p>
          )}

          {seriesMode === "new" && (
            <>
              <div className="field">
                <span className="field__label">Cover URL (optional)</span>
                <input
                  type="url"
                  value={seriesCoverUrl}
                  onChange={(e) => setSeriesCoverUrl(e.target.value)}
                  placeholder="https://..."
                />
              </div>
              <div className="field-row">
                <div className="field">
                  <span className="field__label">Category</span>
                  <select
                    value={seriesCategory}
                    onChange={(e) => setSeriesCategory(e.target.value)}
                  >
                    <option value="new">New</option>
                    <option value="hot">Hot</option>
                    <option value="adventure">Adventure</option>
                    <option value="scary">Scary</option>
                    <option value="anime">Anime</option>
                    <option value="vip">VIP</option>
                  </select>
                </div>
                <label className="check">
                  <input
                    type="checkbox"
                    checked={seriesIsVip}
                    onChange={(e) => setSeriesIsVip(e.target.checked)}
                  />
                  Series is VIP
                </label>
              </div>
            </>
          )}
        </section>

        <section className="card">
          <h2 className="section-title">Episode</h2>
          <div className="chips">
            <span className="chip">
              Order <strong>{order > 0 ? order : "—"}</strong>
            </span>
            <span className="chip">
              Duration{" "}
              <strong>{durationSec > 0 ? `${durationSec}s` : "—"}</strong>
            </span>
          </div>

          <div className="checks">
            <label className="check">
              <input
                type="checkbox"
                checked={isVipLocked}
                onChange={(e) => setIsVipLocked(e.target.checked)}
              />
              VIP locked episode
            </label>
            <label className="check">
              <input
                type="checkbox"
                checked={addToForYou}
                onChange={(e) => setAddToForYou(e.target.checked)}
              />
              Add to For You
            </label>
            <label className="check">
              <input
                type="checkbox"
                checked={replaceExisting}
                onChange={(e) => setReplaceExisting(e.target.checked)}
              />
              Replace existing episode
            </label>
          </div>
        </section>

        <section className="card">
          <h2 className="section-title">Media</h2>
          <p className="hint">
            Video is cropped to 9:16 on Cloudinary for fullscreen mobile playback.
          </p>

          <FileDropzone
            label="Video"
            hint="MP4 or MOV recommended"
            accept="video/*"
            file={videoFile}
            disabled={uploadingMedia || loading}
            onFile={setVideoFile}
          />

          <FileDropzone
            label="Thumbnail (optional)"
            hint="Leave empty to auto-generate from video"
            accept="image/*"
            file={thumbnailFile}
            disabled={uploadingMedia || loading}
            onFile={setThumbnailFile}
          />

          <MediaPreview
            videoUrl={videoUrl}
            thumbnailUrl={thumbnailUrl}
            durationSec={durationSec}
          />

          <div className="actions">
            <button
              className="btn btn--primary"
              disabled={
                !user ||
                !videoFile ||
                uploadingMedia ||
                loading ||
                !cloudinaryReady
              }
              type="button"
              onClick={handleUploadMedia}
            >
              {uploadingMedia ? "Uploading…" : "Upload to Cloudinary"}
            </button>
            <button
              className="btn btn--success"
              disabled={!canSubmit || loading || uploadingMedia}
              type="submit"
            >
              {loading ? "Publishing…" : "Publish episode"}
            </button>
            <button
              className="btn btn--ghost"
              disabled={loading || uploadingMedia}
              type="button"
              onClick={() => {
                resetEpisodeForm(true);
                void refreshNextEpisodeMeta(activeSeriesId);
                toast.info("Form cleared", "Ready for the next upload.");
                setStatus("Form cleared. Ready for next upload.");
              }}
            >
              Clear &amp; next
            </button>
          </div>
        </section>
      </form>

      <StatusBanner message={status} variant={statusVariant} />
    </main>
  );
}
