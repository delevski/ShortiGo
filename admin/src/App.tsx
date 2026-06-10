import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  type FormEvent,
} from "react";
import {
  GoogleAuthProvider,
  onAuthStateChanged,
  signInWithPopup,
  signOut,
  type User,
} from "firebase/auth";
import {
  arrayUnion,
  doc,
  getDoc,
  serverTimestamp,
  setDoc,
} from "firebase/firestore";
import { auth, db, firebaseConfigError } from "./firebase";
import { ActivityLog } from "./components/ActivityLog";
import { CatalogHealth } from "./components/CatalogHealth";
import { Dashboard } from "./components/Dashboard";
import { FileDropzone } from "./components/FileDropzone";
import { MediaLibrary } from "./components/MediaLibrary";
import { MediaPreview } from "./components/MediaPreview";
import { ProvidersAdmin } from "./components/ProvidersAdmin";
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
  normalizeCloudinaryEpisodeUrls,
  uploadToCloudinaryWithProgress,
} from "./lib/cloudinary";
import {
  cloudinaryPublicIdFromUrl,
  episodeAppLabel,
  plannedEpisodeDocId,
} from "./lib/episodeMeta";
import {
  fetchPublishedEpisodes,
  findEpisodesByCloudinaryId,
  type PublishedEpisodeRow,
} from "./lib/firestoreEpisodes";
import { writeAuditEvent } from "./lib/auditLog";
import {
  loadStudioAccess,
  providerPrefixedSeriesId,
  type StudioAccess,
} from "./lib/studioAccess";
import {
  ensureSeriesDoc,
  fetchNextEpisodeOrder,
  fetchSeriesOptions,
  getSeriesOwnership,
  resolveSeriesCoverUrl,
  type SeriesMeta,
  type SeriesOption,
} from "./lib/seriesFirestore";
import { applyEpisodePublishStats } from "./lib/seriesStats";
import { invalidateSeriesEpisodeCache } from "./lib/episodeSeriesCache";

type StatusVariant = "idle" | "success" | "error" | "info";

type OverlayStep = { label: string; done: boolean; active: boolean };

type AppView =
  | "upload"
  | "library"
  | "dashboard"
  | "health"
  | "providers"
  | "activity";

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
  const [bonusUnlockCost, setBonusUnlockCost] = useState(60);
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
  const [view, setView] = useState<AppView>("upload");
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
  const [studioAccess, setStudioAccess] = useState<StudioAccess | null>(null);
  const auditedSignInUid = useRef<string | null>(null);
  const [publishedEpisodes, setPublishedEpisodes] = useState<
    PublishedEpisodeRow[]
  >([]);
  const [cloudinaryMatches, setCloudinaryMatches] = useState<
    (PublishedEpisodeRow & { seriesId: string })[]
  >([]);

  const activeSeriesId = seriesMode === "existing" ? selectedSeriesId : seriesId;
  const plannedEpisodeId = activeSeriesId.trim()
    ? plannedEpisodeDocId(activeSeriesId, order)
    : "";
  const cloudinaryAssetId = videoUrl
    ? cloudinaryPublicIdFromUrl(videoUrl)
    : null;
  const statusVariant = statusVariantFromMessage(status);
  const cloudinaryReady = !cloudinaryConfigError();

  const catalogScope =
    studioAccess?.role === "provider" ? studioAccess.providerId : null;

  const refreshSeriesList = useCallback(async () => {
    if (!db || !user || !studioAccess?.canPublish) {
      return;
    }
    try {
    const options = await fetchSeriesOptions(catalogScope);
    setSeriesOptions(options);
    if (options.length > 0 && !selectedSeriesId) {
      setSelectedSeriesId(options[0].id);
    }
    } catch (error) {
      logError("Failed to load series list", error, { catalogScope });
      toast.error("Could not load series", toUserMessage(error));
    }
  }, [user, selectedSeriesId, studioAccess, catalogScope, toast]);

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

  const refreshStudioAccess = useCallback(async () => {
    if (!user) {
      setStudioAccess(null);
      return;
    }
    try {
      const access = await loadStudioAccess(user.uid);
      setStudioAccess(access);
      toast.info(
        "Role refreshed",
        access.role === "superAdmin"
          ? "Super admin — full catalog access."
          : access.role === "provider"
            ? `Provider · ${access.providerId ?? "unknown org"}`
            : "No adminUsers access — cannot publish.",
      );
    } catch (error) {
      logError("Studio access check failed", error, { uid: user.uid });
      setStudioAccess(null);
      toast.error(
        "Permission error",
        `Could not read adminUsers/${user.uid}. ${toUserMessage(error)}`,
      );
    }
  }, [user, toast]);

  useEffect(() => {
    if (!user) {
      setStudioAccess(null);
      return;
    }
    void refreshStudioAccess();
  }, [user, refreshStudioAccess]);

  useEffect(() => {
    if (!user) {
      return;
    }
    const onFocus = () => {
      void refreshStudioAccess();
    };
    window.addEventListener("focus", onFocus);
    return () => window.removeEventListener("focus", onFocus);
  }, [user, refreshStudioAccess]);

  useEffect(() => {
    if (!user || !studioAccess?.canPublish) {
      return;
    }
    void refreshSeriesList();
  }, [user, studioAccess, refreshSeriesList]);

  useEffect(() => {
    if (!user || !studioAccess || studioAccess.role === "none") {
      return;
    }
    if (auditedSignInUid.current === user.uid) {
      return;
    }
    auditedSignInUid.current = user.uid;
    void writeAuditEvent({
      action: "auth.sign_in",
      actorUid: user.uid,
      actorEmail: user.email,
      role: studioAccess.role,
      providerId: studioAccess.providerId,
      targetType: "session",
      targetId: user.uid,
    });
  }, [user, studioAccess]);

  const refreshPublishedEpisodes = useCallback(async (targetSeriesId: string) => {
    const rows = await fetchPublishedEpisodes(targetSeriesId);
    setPublishedEpisodes(rows);
  }, []);

  useEffect(() => {
    if (!activeSeriesId.trim()) {
      setPublishedEpisodes([]);
      return;
    }
    void refreshPublishedEpisodes(activeSeriesId);
  }, [activeSeriesId, refreshPublishedEpisodes]);

  useEffect(() => {
    if (!videoUrl.trim()) {
      setCloudinaryMatches([]);
      return;
    }
    const excludeEpisodeId =
      replaceExisting && activeSeriesId.trim() && order >= 1
        ? plannedEpisodeDocId(activeSeriesId, order)
        : null;
    const timer = window.setTimeout(() => {
      void findEpisodesByCloudinaryId(
        videoUrl,
        catalogScope,
        excludeEpisodeId,
      ).then(setCloudinaryMatches);
    }, 400);
    return () => window.clearTimeout(timer);
  }, [videoUrl, catalogScope, replaceExisting, activeSeriesId, order]);

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
      const slug = slugifySeriesId(seriesTitle);
      if (studioAccess?.role === "provider" && studioAccess.providerId) {
        setSeriesId(providerPrefixedSeriesId(studioAccess.providerId, slug));
      } else {
        setSeriesId(slug);
      }
    }
  }, [seriesMode, seriesTitle, studioAccess]);

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

  type ResolvedMedia = {
    videoUrl: string;
    thumbnailUrl: string;
    durationSec: number;
  };

  type PublishResult = {
    episodeId: string;
    seriesId: string;
    seriesTitle: string;
    episodeOrder: number;
    episodeCount: number;
  };

  async function persistEpisode(media: ResolvedMedia): Promise<PublishResult> {
    if (!db) {
      throw new Error("Firestore is not ready.");
    }
    const safeSeriesId = activeSeriesId.trim();
    if (!safeSeriesId) {
      throw new Error("Choose or create a series first.");
    }
    const normalized = normalizeCloudinaryEpisodeUrls(
      media.videoUrl.trim(),
      media.thumbnailUrl.trim(),
    );
    const safeVideoUrl = normalized.videoUrl;
    const safeThumbnailUrl = normalized.thumbnailUrl;
    if (!isHttpUrl(safeVideoUrl)) {
      throw new Error("Video URL is missing — upload the video first.");
    }
    if (!isHttpUrl(safeThumbnailUrl)) {
      throw new Error("Thumbnail URL is missing.");
    }
    const safeSeriesTitle = seriesTitle.trim() || `Series ${safeSeriesId}`;
    const existingSeriesSnap = await getDoc(doc(db, "series", safeSeriesId));
    const isNewSeries = !existingSeriesSnap.exists();
    const existingCover =
      existingSeriesSnap.exists() &&
      typeof existingSeriesSnap.data()?.coverUrl === "string"
        ? (existingSeriesSnap.data()?.coverUrl as string)
        : null;
    const safeCoverUrl = resolveSeriesCoverUrl({
      manualCover: seriesCoverUrl,
      episodeThumbnailUrl: safeThumbnailUrl,
      isNewSeries,
      episodeOrder: order,
      existingCoverUrl: existingCover,
    });
    const safeDuration = media.durationSec || durationSec;
    const episodeId = `${safeSeriesId}_e${order}`;
    const episodeRef = doc(db, "episodes", episodeId);
    const seriesMeta: SeriesMeta = {
      title: safeSeriesTitle,
      coverUrl: safeCoverUrl,
      category: seriesCategory,
      isVip: seriesIsVip || isVipLocked,
    };

    setStatus("Checking existing episode...");
    const existing = await getDoc(episodeRef);
    if (existing.exists() && !replaceExisting) {
      throw new Error(
        `Episode ${episodeId} already exists. Enable "Replace existing" to overwrite.`,
      );
    }

    setStatus("Creating series record...");
    const ownershipForCreate =
      studioAccess?.role === "provider" &&
      studioAccess.providerId &&
      user
        ? {
            providerId: studioAccess.providerId,
            createdByUid: user.uid,
          }
        : undefined;
    const seriesCreate = await ensureSeriesDoc(
      safeSeriesId,
      seriesMeta,
      ownershipForCreate,
    );

    const seriesOwnership =
      (await getSeriesOwnership(safeSeriesId)) ?? ownershipForCreate;

    const videoPublicId = cloudinaryPublicIdFromUrl(safeVideoUrl);
    const thumbPublicId = cloudinaryPublicIdFromUrl(safeThumbnailUrl);
    const episodePayload: Record<string, unknown> = {
      id: episodeId,
      seriesId: safeSeriesId,
      order,
      isVipLocked,
      ...(!isVipLocked && bonusUnlockCost > 0 ? { bonusUnlockCost } : {}),
      durationSec: safeDuration,
      videoUrl: safeVideoUrl,
      thumbnailUrl: safeThumbnailUrl,
    };
    if (videoPublicId) {
      episodePayload.cloudinaryVideoPublicId = videoPublicId;
    }
    if (thumbPublicId) {
      episodePayload.cloudinaryThumbPublicId = thumbPublicId;
    }
    if (seriesOwnership?.providerId && seriesOwnership.createdByUid) {
      episodePayload.providerId = seriesOwnership.providerId;
      episodePayload.createdByUid = seriesOwnership.createdByUid;
    } else if (ownershipForCreate) {
      episodePayload.providerId = ownershipForCreate.providerId;
      episodePayload.createdByUid = ownershipForCreate.createdByUid;
    }

    setStatus("Saving episode to Firestore...");
    const previousDuration =
      existing.exists() && typeof existing.data()?.durationSec === "number"
        ? (existing.data()?.durationSec as number)
        : 0;
    await setDoc(episodeRef, episodePayload);
    invalidateSeriesEpisodeCache(safeSeriesId);

    setStatus("Updating series stats...");
    const stats = await applyEpisodePublishStats(safeSeriesId, seriesMeta, {
      durationSec: safeDuration,
      isNewEpisode: !existing.exists(),
      previousDurationSec: previousDuration,
    });

    if (addToForYou && studioAccess?.canWriteFeatured) {
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

    if (studioAccess && user) {
      await writeAuditEvent({
        action: existing.exists() ? "episode.replace" : "episode.publish",
        actorUid: user.uid,
        actorEmail: user.email,
        role: studioAccess.role,
        providerId: studioAccess.providerId,
        targetType: "episode",
        targetId: episodeId,
        seriesId: safeSeriesId,
        metadata: {
          order,
          durationSec: safeDuration,
          seriesCreated: seriesCreate.created,
        },
      });
      if (seriesCreate.created) {
        await writeAuditEvent({
          action: "series.create",
          actorUid: user.uid,
          actorEmail: user.email,
          role: studioAccess.role,
          providerId: studioAccess.providerId,
          targetType: "series",
          targetId: safeSeriesId,
          seriesId: safeSeriesId,
          metadata: { title: safeSeriesTitle },
        });
      } else {
        await writeAuditEvent({
          action: "series.update",
          actorUid: user.uid,
          actorEmail: user.email,
          role: studioAccess.role,
          providerId: studioAccess.providerId,
          targetType: "series",
          targetId: safeSeriesId,
          seriesId: safeSeriesId,
        });
      }
    }

    return {
      episodeId,
      seriesId: safeSeriesId,
      seriesTitle: safeSeriesTitle,
      episodeOrder: order,
      episodeCount: stats.episodeCount,
    };
  }

  async function finishPublish(result: PublishResult): Promise<void> {
    resetEpisodeForm(true);
    await refreshSeriesList();
    setSeriesMode("existing");
    setSelectedSeriesId(result.seriesId);
    await refreshNextEpisodeMeta(result.seriesId);
    await refreshPublishedEpisodes(result.seriesId);

    notifySuccess(
      "Published to Firestore",
      `${episodeAppLabel(result.episodeOrder)} saved as ${result.episodeId}. Series "${result.seriesTitle}" now has ${result.episodeCount} episode(s).`,
    );
  }

  async function handlePublish(event: FormEvent) {
    event.preventDefault();
    if (!db) {
      return;
    }
    if (!studioAccess?.canPublish) {
      toast.error(
        "Cannot publish",
        `Create or activate adminUsers/${user?.uid ?? "{uid}"} in Firestore first.`,
      );
      return;
    }

    setLoading(true);
    setOverlayOpen(true);
    setOverlayIndeterminate(true);
    setOverlayTitle("Publishing episode");
    setOverlaySubtitle("Writing to Firestore…");
    setOverlaySteps([
      { label: "Create / update series", done: false, active: true },
      { label: "Save episode", done: false, active: false },
      { label: "Update discovery", done: false, active: false },
    ]);
    try {
      const result = await persistEpisode({
        videoUrl,
        thumbnailUrl,
        durationSec,
      });
      await finishPublish(result);
    } catch (error) {
      notifyError("Publish failed", error);
    } finally {
      setLoading(false);
      setOverlayOpen(false);
      setOverlayIndeterminate(false);
      setOverlaySteps([]);
    }
  }

  async function runUpload(): Promise<ResolvedMedia | null> {
    if (!videoFile) {
      toast.error("Upload", "Select a video file first.");
      setStatus("Failed: select a video file first.");
      return null;
    }
    const configError = cloudinaryConfigError();
    if (configError) {
      toast.error("Cloudinary not configured", configError);
      setStatus(`Failed: ${configError}`);
      return null;
    }
    if (!activeSeriesId.trim()) {
      toast.error("Upload", "Choose or create a series first.");
      setStatus("Failed: choose or create a series first.");
      return null;
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

      let resolvedThumbnailUrl: string;
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
        resolvedThumbnailUrl = uploadedThumb.secure_url;
        setThumbnailUrl(resolvedThumbnailUrl);
        steps = markStep(steps, stepIndex, true, false);
        stepIndex += 1;
      } else {
        resolvedThumbnailUrl = cloudinaryGeneratedThumbnailUrl(uploadedVideo);
        setThumbnailUrl(resolvedThumbnailUrl);
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

      if (user && studioAccess && studioAccess.role !== "none") {
        await writeAuditEvent({
          action: "upload.cloudinary.success",
          actorUid: user.uid,
          actorEmail: user.email,
          role: studioAccess.role,
          providerId: studioAccess.providerId,
          targetType: "cloudinary",
          targetId: cloudinaryPublicIdFromUrl(deliveryUrl),
          seriesId: activeSeriesId.trim() || null,
          metadata: {
            fileName: videoFile.name,
            durationSec: detectedDuration,
          },
        });
      }

      return {
        videoUrl: deliveryUrl,
        thumbnailUrl: resolvedThumbnailUrl,
        durationSec: detectedDuration,
      };
    } catch (error) {
      if (user && studioAccess && studioAccess.role !== "none") {
        await writeAuditEvent({
          action: "upload.cloudinary.failure",
          actorUid: user.uid,
          actorEmail: user.email,
          role: studioAccess.role,
          providerId: studioAccess.providerId,
          targetType: "cloudinary",
          metadata: {
            fileName: videoFile.name,
            error: toUserMessage(error),
          },
        });
      }
      notifyError("Cloudinary upload failed", error);
      return null;
    } finally {
      setUploadingMedia(false);
    }
  }

  async function handleUploadMedia() {
    const resolved = await runUpload();
    setOverlayOpen(false);
    setOverlayIndeterminate(false);
    setOverlayPercent(0);
    if (resolved) {
      notifySuccess(
        "Upload complete",
        `Video ready for ${episodeAppLabel(order)} (${resolved.durationSec}s). Click Publish to add it to the app.`,
      );
    }
  }

  async function handleUploadAndPublish() {
    if (!studioAccess?.canPublish) {
      toast.error(
        "Cannot publish",
        `Create or activate adminUsers/${user?.uid ?? "{uid}"} in Firestore first.`,
      );
      return;
    }
    const resolved = await runUpload();
    if (!resolved) {
      setOverlayOpen(false);
      setOverlayIndeterminate(false);
      setOverlayPercent(0);
      return;
    }
    setLoading(true);
    setOverlayOpen(true);
    setOverlayIndeterminate(true);
    setOverlayTitle("Publishing episode");
    setOverlaySubtitle("Writing to Firestore…");
    try {
      const result = await persistEpisode(resolved);
      await finishPublish(result);
    } catch (error) {
      notifyError("Publish failed", error);
    } finally {
      setLoading(false);
      setOverlayOpen(false);
      setOverlayIndeterminate(false);
      setOverlayPercent(0);
      setOverlaySteps([]);
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

      <nav className="app-nav" aria-label="Main">
        <button
          type="button"
          className={`app-nav__item ${view === "upload" ? "is-active" : ""}`}
          onClick={() => setView("upload")}
        >
          Upload
        </button>
        <button
          type="button"
          className={`app-nav__item ${view === "library" ? "is-active" : ""}`}
          onClick={() => setView("library")}
        >
          Media library
        </button>
        {user && studioAccess?.role !== "none" ? (
          <button
            type="button"
            className={`app-nav__item ${view === "dashboard" ? "is-active" : ""}`}
            onClick={() => setView("dashboard")}
          >
            Dashboard
          </button>
        ) : null}
        {user && studioAccess?.role !== "none" ? (
          <button
            type="button"
            className={`app-nav__item ${view === "health" ? "is-active" : ""}`}
            onClick={() => setView("health")}
          >
            Health
          </button>
        ) : null}
        {studioAccess?.canManageProviders ? (
          <button
            type="button"
            className={`app-nav__item ${view === "providers" ? "is-active" : ""}`}
            onClick={() => setView("providers")}
          >
            Providers
          </button>
        ) : null}
        {studioAccess?.canViewAudit ? (
          <button
            type="button"
            className={`app-nav__item ${view === "activity" ? "is-active" : ""}`}
            onClick={() => setView("activity")}
          >
            Activity
          </button>
        ) : null}
      </nav>

      {user && studioAccess?.role === "none" && (
        <section className="card card--alert">
          <h2 className="section-title">Cannot publish yet</h2>
          <p>
            Your account can upload to Cloudinary, but Firestore rules block{" "}
            <strong>Publish episode</strong> until an admin document exists:
          </p>
          <p>
            <code>adminUsers/{user.uid}</code> (create in Firebase Console →
            Firestore, or ask a super-admin to link you under Providers).
          </p>
        </section>
      )}

      {user && studioAccess?.role === "provider" && studioAccess.providerId ? (
        <section className="card card--info">
          <p className="hint">
            Provider account · <strong>{studioAccess.displayName ?? studioAccess.providerId}</strong>
            {" "}· series IDs are prefixed with{" "}
            <code>{studioAccess.providerId}_</code>. You can upload and edit your
            content but cannot delete or manage other providers.
          </p>
        </section>
      ) : null}

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
              {studioAccess && studioAccess.role !== "none" ? (
                <span className="user-row__role badge">
                  {studioAccess.role === "superAdmin" ? "Super admin" : "Provider"}
                </span>
              ) : null}
              <span className="user-row__uid hint">
                UID: <code>{user.uid}</code>{" "}
                <button
                  type="button"
                  className="btn btn--ghost btn--sm"
                  onClick={() => {
                    void navigator.clipboard.writeText(user.uid);
                    toast.info("Copied", "Firebase UID copied to clipboard.");
                  }}
                >
                  Copy UID
                </button>
              </span>
            </div>
            <div className="user-row__actions">
              <button
                className="btn btn--ghost btn--sm"
                type="button"
                onClick={() => void refreshStudioAccess()}
              >
                Refresh role
              </button>
              <button
                className="btn btn--ghost"
                type="button"
                onClick={() => auth && signOut(auth)}
              >
                Sign out
              </button>
            </div>
          </div>
        )}
      </section>

      {view === "dashboard" && user && studioAccess?.role !== "none" ? (
        <Dashboard
          scopeProviderId={catalogScope}
          studioAccess={studioAccess}
        />
      ) : null}

      {view === "health" && user && studioAccess?.role !== "none" ? (
        <CatalogHealth
          scopeProviderId={catalogScope}
          canRepair={studioAccess?.role === "superAdmin"}
        />
      ) : null}

      {view === "library" ? (
        <MediaLibrary
          userReady={
            !!user && studioAccess != null && studioAccess.role !== "none"
          }
          canDelete={studioAccess?.canDelete === true}
          scopeProviderId={catalogScope}
          studioAccess={studioAccess}
          actorUid={user?.uid}
          actorEmail={user?.email}
        />
      ) : null}

      {view === "providers" && user && studioAccess?.canManageProviders ? (
        <ProvidersAdmin user={user} studioAccess={studioAccess} />
      ) : null}

      {view === "activity" && studioAccess?.canViewAudit ? (
        <ActivityLog scopeProviderId={catalogScope} />
      ) : null}

      {view === "upload" ? (
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
              onClick={() => {
                resetEpisodeForm(false);
                setOrder(1);
                setIsVipLocked(false);
                setBonusUnlockCost(60);
                setAddToForYou(true);
                setSeriesMode("new");
              }}
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
              Series ID: <code>{activeSeriesId || "—"}</code> — in the app, open
              this series by ID (Discover → series → episode list).
            </p>
          )}

          {activeSeriesId && (
            <div className="episode-catalog">
              <h3 className="episode-catalog__title">
                Episodes already in Firestore ({publishedEpisodes.length})
              </h3>
              {publishedEpisodes.length === 0 ? (
                <p className="hint">
                  No published episodes for this series yet. Upload +{" "}
                  <strong>Publish episode</strong> to add one.
                </p>
              ) : (
                <ul className="episode-catalog__list">
                  {publishedEpisodes.map((ep) => (
                    <li key={ep.id}>
                      <strong>{episodeAppLabel(ep.order)}</strong>{" "}
                      <code>{ep.id}</code> · {ep.durationSec}s
                    </li>
                  ))}
                </ul>
              )}
            </div>
          )}

          {seriesMode === "new" && (
            <div className="field">
              <span className="field__label">Cover URL (optional)</span>
              <input
                type="url"
                value={seriesCoverUrl}
                onChange={(e) => setSeriesCoverUrl(e.target.value)}
                placeholder="Leave empty to use EP.1's first frame"
              />
              <p className="hint">
                Leave empty — on publish, the cover is set from the first frame
                of this series' first episode. Only paste a URL here to override
                with a custom cover.
              </p>
            </div>
          )}

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
          <p className="hint">
            Category &amp; VIP apply to the whole series and update it on publish.
          </p>
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
            {plannedEpisodeId ? (
              <span className="chip">
                App label <strong>{episodeAppLabel(order)}</strong>
              </span>
            ) : null}
          </div>

          {plannedEpisodeId ? (
            <div className="publish-target">
              <p className="publish-target__label">After you publish</p>
              <dl className="publish-target__grid">
                <div>
                  <dt>Firestore document</dt>
                  <dd>
                    <code>{plannedEpisodeId}</code>
                  </dd>
                </div>
                <div>
                  <dt>Shown in mobile app</dt>
                  <dd>
                    <strong>{episodeAppLabel(order)}</strong> under &quot;
                    {seriesTitle || activeSeriesId}&quot;
                  </dd>
                </div>
                {cloudinaryAssetId ? (
                  <div>
                    <dt>Cloudinary asset</dt>
                    <dd>
                      <code>{cloudinaryAssetId}</code>
                    </dd>
                  </div>
                ) : null}
              </dl>
              {isHttpUrl(videoUrl.trim()) && (
                <p className="hint publish-target__warn">
                  Video is on Cloudinary but <strong>not in the app</strong>{" "}
                  until you click <strong>Publish episode</strong>.
                </p>
              )}
            </div>
          ) : null}

          {cloudinaryMatches.length > 0 && (
            <div className="card card--inline card--success-soft">
              <p>
                This Cloudinary file is already published:{" "}
                {cloudinaryMatches
                  .map((m) => `${m.id} (series ${m.seriesId})`)
                  .join(", ")}
                . Pull to refresh on that series in the app.
              </p>
            </div>
          )}

          <div className="checks">
            <label className="check">
              <input
                type="checkbox"
                checked={isVipLocked}
                onChange={(e) => setIsVipLocked(e.target.checked)}
              />
              VIP locked episode
            </label>
            <label>
              Bonus unlock cost
              <input
                type="number"
                min={0}
                step={5}
                value={bonusUnlockCost}
                disabled={isVipLocked}
                onChange={(e) =>
                  setBonusUnlockCost(Math.max(0, Number(e.target.value) || 0))
                }
              />
            </label>
            {studioAccess?.canWriteFeatured ? (
              <label className="check">
                <input
                  type="checkbox"
                  checked={addToForYou}
                  onChange={(e) => setAddToForYou(e.target.checked)}
                />
                Add to For You
              </label>
            ) : null}
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
              className="btn btn--success"
              disabled={
                !user ||
                !videoFile ||
                uploadingMedia ||
                loading ||
                !cloudinaryReady ||
                !activeSeriesId.trim() ||
                !studioAccess?.canPublish
              }
              type="button"
              onClick={handleUploadAndPublish}
              title={
                !studioAccess?.canPublish
                  ? "Requires an active adminUsers/{uid} document"
                  : undefined
              }
            >
              {uploadingMedia || loading
                ? "Working…"
                : "Upload & Publish to app"}
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

          <details className="advanced-actions">
            <summary>Advanced: upload and publish separately</summary>
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
                {uploadingMedia ? "Uploading…" : "1. Upload to Cloudinary"}
              </button>
              <button
                className="btn btn--success"
                disabled={
                  !canSubmit || loading || uploadingMedia || !studioAccess?.canPublish
                }
                type="submit"
                title={
                  !studioAccess?.canPublish
                    ? "Requires an active adminUsers/{uid} document"
                    : undefined
                }
              >
                {loading ? "Publishing…" : "2. Publish episode"}
              </button>
            </div>
          </details>
        </section>
      </form>
      ) : null}

      {view === "upload" ? (
        <StatusBanner message={status} variant={statusVariant} />
      ) : null}
    </main>
  );
}
