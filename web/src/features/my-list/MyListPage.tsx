import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "../../app/AuthContext";
import { EmptyView } from "../../components/EmptyView";
import { ErrorView } from "../../components/ErrorView";
import { LoadingView } from "../../components/LoadingView";
import type { Series } from "../../domain/types";
import { db } from "../../firebase/firebase";
import { fetchSeriesByIds } from "../../repositories/catalogRepository";
import { SeriesCard } from "../discover/SeriesCard";

export function MyListPage() {
  const { appUser, loading: authLoading } = useAuth();
  const [series, setSeries] = useState<Series[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let active = true;
    async function load() {
      if (authLoading) return;
      if (!appUser) {
        setSeries([]);
        return;
      }
      if (!db) {
        setError("Firebase web config is missing.");
        return;
      }
      setLoading(true);
      setError(null);
      try {
        const next = await fetchSeriesByIds(db, appUser.favoriteSeriesIds);
        if (active) setSeries(next);
      } catch (cause) {
        if (active) setError(cause instanceof Error ? cause.message : "Failed to load saved series.");
      } finally {
        if (active) setLoading(false);
      }
    }
    void load();
    return () => {
      active = false;
    };
  }, [appUser, authLoading]);

  if (authLoading || loading) return <LoadingView title="Loading saved series" />;
  if (!appUser) return <EmptyView title="Log in to view My List" message="Saved series are linked to your account." />;
  if (error) return <ErrorView title="Unable to load My List" message={error} />;
  if (series.length === 0) return <EmptyView title="My List is empty" message="Save a series from Shorts or Explore." />;

  return (
    <section className="catalog-page">
      <h1>My List</h1>
      <div className="series-grid">
        {series.map((item) => <SeriesCard key={item.id} series={item} />)}
      </div>
      <Link className="text-button" to="/explore">Explore more series</Link>
    </section>
  );
}
