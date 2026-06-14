import { useEffect, useState } from "react";
import { EmptyView } from "../../components/EmptyView";
import { ErrorView } from "../../components/ErrorView";
import { LoadingView } from "../../components/LoadingView";
import { categories, type CategoryId, type Series } from "../../domain/types";
import { db, firebaseConfigError } from "../../firebase/firebase";
import { fetchSeriesByCategory } from "../../repositories/catalogRepository";
import { SeriesCard } from "./SeriesCard";

type DiscoverState = {
  error: Error | null;
  loading: boolean;
  series: Series[];
};

export function DiscoverPage() {
  const [category, setCategory] = useState<CategoryId>("forYou");
  const [state, setState] = useState<DiscoverState>({
    error: null,
    loading: Boolean(db),
    series: [],
  });

  useEffect(() => {
    if (!db) {
      setState({ error: null, loading: false, series: [] });
      return;
    }

    let active = true;
    setState((current) => ({ ...current, error: null, loading: true }));

    fetchSeriesByCategory(db, category, 24)
      .then((series) => {
        if (active) setState({ error: null, loading: false, series });
      })
      .catch((error: unknown) => {
        if (active) {
          setState({
            error: error instanceof Error ? error : new Error("Unable to load series."),
            loading: false,
            series: [],
          });
        }
      });

    return () => {
      active = false;
    };
  }, [category]);

  if (!db) {
    return (
      <section className="catalog-page">
        <ErrorView
          title="Discover needs Firebase"
          message={
            firebaseConfigError
              ? `Missing ${firebaseConfigError}. Add Firebase env values to load the catalog.`
              : "Firebase is not configured for this preview."
          }
        />
      </section>
    );
  }

  return (
    <section className="catalog-page" aria-labelledby="discover-title">
      <header className="catalog-header">
        <div>
          <span>Explore</span>
          <h1 id="discover-title">Series catalog</h1>
        </div>
      </header>

      <div className="category-tabs" role="tablist" aria-label="Series categories">
        {categories.map((item) => (
          <button
            key={item.id}
            className={item.id === category ? "category-tab category-tab--active" : "category-tab"}
            type="button"
            role="tab"
            aria-selected={item.id === category}
            onClick={() => setCategory(item.id)}
          >
            {item.label}
          </button>
        ))}
      </div>

      {state.loading ? <LoadingView title="Loading series" /> : null}
      {state.error ? <ErrorView title="Unable to load series" message={state.error.message} /> : null}
      {!state.loading && !state.error && state.series.length === 0 ? (
        <EmptyView title="No series here yet" message="Try another category while the catalog fills up." />
      ) : null}
      {!state.loading && !state.error && state.series.length > 0 ? (
        <div className="series-grid">
          {state.series.map((series) => (
            <SeriesCard key={series.id} series={series} />
          ))}
        </div>
      ) : null}
    </section>
  );
}
