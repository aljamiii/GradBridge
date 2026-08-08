import { useEffect, useMemo, useRef, useState } from "react";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import { api } from "../lib/api";

const CATEGORIES = {
  mosques: {
    label: "Mosques",
    shortLabel: "Mosques",
    emoji: "🕌",
    color: "#16a34a",
    description: "Muslim places of worship near campus",
  },

  halal: {
    label: "Halal Food & Groceries",
    shortLabel: "Halal",
    emoji: "🥘",
    color: "#ea580c",
    description: "Halal food and grocery options",
  },

  hospitals: {
    label: "Hospitals",
    shortLabel: "Healthcare",
    emoji: "🏥",
    color: "#dc2626",
    description: "Hospitals near your university",
  },

  transit: {
    label: "Transit Stops",
    shortLabel: "Transit",
    emoji: "🚇",
    color: "#2563eb",
    description: "Nearby public transportation",
  },
};

const createDotIcon = (color) =>
  L.divIcon({
    className: "",
    html: `
      <div
        style="
          width: 16px;
          height: 16px;
          border-radius: 50%;
          background: ${color};
          border: 3px solid white;
          box-shadow: 0 2px 6px rgba(15, 23, 42, 0.35);
        "
      ></div>
    `,
    iconSize: [16, 16],
    iconAnchor: [8, 8],
  });

const campusIcon = L.divIcon({
  className: "",
  html: `
    <div
      style="
        width: 38px;
        height: 38px;
        display: flex;
        align-items: center;
        justify-content: center;
        border-radius: 12px;
        background: #4f46e5;
        border: 3px solid white;
        color: white;
        font-size: 20px;
        box-shadow: 0 4px 12px rgba(15, 23, 42, 0.3);
      "
    >
      🎓
    </div>
  `,
  iconSize: [38, 38],
  iconAnchor: [19, 19],
});

function createPopup({
  emoji,
  name,
  distanceKm,
  detail,
  campus = false,
}) {
  const wrapper = document.createElement("div");

  const title = document.createElement("strong");

  title.textContent = campus
    ? `🎓 ${name}`
    : `${emoji} ${name}`;

  wrapper.appendChild(title);

  if (campus) {
    const subtitle = document.createElement("div");

    subtitle.textContent = "University campus";
    subtitle.style.marginTop = "4px";
    subtitle.style.color = "#64748b";

    wrapper.appendChild(subtitle);

    return wrapper;
  }

  const distance = document.createElement("div");

  distance.textContent = `${distanceKm} km from campus`;
  distance.style.marginTop = "5px";

  wrapper.appendChild(distance);

  if (detail) {
    const detailElement = document.createElement("div");

    detailElement.textContent = detail;
    detailElement.style.marginTop = "4px";
    detailElement.style.color = "#64748b";

    wrapper.appendChild(detailElement);
  }

  return wrapper;
}

export default function SurvivalGuide() {
  const [query, setQuery] = useState("");
  const [result, setResult] = useState(null);

  const [favorites, setFavorites] = useState([]);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const [selectedCategory, setSelectedCategory] =
    useState("all");

  const mapDivRef = useRef(null);
  const mapRef = useRef(null);
  const layerRef = useRef(null);

  const markerRefs = useRef(new Map());

  /*
    Create Leaflet map once.
  */
  useEffect(() => {
    if (
      mapRef.current ||
      !mapDivRef.current
    ) {
      return;
    }

    const map = L.map(
      mapDivRef.current
    ).setView(
      [23.8103, 90.4125],
      3
    );

    L.tileLayer(
      "https://tile.openstreetmap.org/{z}/{x}/{y}.png",
      {
        attribution:
          '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',

        maxZoom: 18,
      }
    ).addTo(map);

    layerRef.current =
      L.layerGroup().addTo(map);

    mapRef.current = map;

    setTimeout(() => {
      map.invalidateSize();
    }, 100);

    return () => {
      map.remove();

      mapRef.current = null;
      layerRef.current = null;

      markerRefs.current.clear();
    };
  }, []);

  /*
    Existing favorites functionality.
  */
  useEffect(() => {
    api("/api/favorites")
      .then((data) => {
        setFavorites(
          data.favorites ?? []
        );
      })
      .catch(() => {});
  }, []);

  /*
    Create one combined list for UI filtering.
  */
  const visiblePlaces =
    useMemo(() => {
      if (!result?.places) {
        return [];
      }

      if (
        selectedCategory === "all"
      ) {
        return Object.entries(
          result.places
        ).flatMap(
          ([category, places]) =>
            (places ?? []).map(
              (place, index) => ({
                ...place,

                category,

                markerKey:
                  `${category}-${index}`,
              })
            )
        );
      }

      return (
        result.places[
          selectedCategory
        ] ?? []
      ).map(
        (place, index) => ({
          ...place,

          category:
            selectedCategory,

          markerKey:
            `${selectedCategory}-${index}`,
        })
      );
    }, [
      result,
      selectedCategory,
    ]);

  /*
    Redraw map when search/category changes.
  */
  useEffect(() => {
    const map =
      mapRef.current;

    const layer =
      layerRef.current;

    if (
      !map ||
      !layer ||
      !result
    ) {
      return;
    }

    layer.clearLayers();

    markerRefs.current.clear();

    const campusMarker =
      L.marker(
        [
          result.center.lat,
          result.center.lng,
        ],
        {
          icon: campusIcon,
        }
      )
        .addTo(layer)
        .bindPopup(
          createPopup({
            name: result.query,
            campus: true,
          })
        );

    const bounds = [
      [
        result.center.lat,
        result.center.lng,
      ],
    ];

    visiblePlaces.forEach(
      (place) => {
        const category =
          CATEGORIES[
            place.category
          ];

        const marker =
          L.marker(
            [
              place.lat,
              place.lng,
            ],
            {
              icon:
                createDotIcon(
                  category.color
                ),
            }
          )
            .addTo(layer)
            .bindPopup(
              createPopup({
                emoji:
                  category.emoji,

                name:
                  place.name,

                distanceKm:
                  place.distanceKm,

                detail:
                  place.detail,
              })
            );

        markerRefs.current.set(
          place.markerKey,
          marker
        );

        bounds.push([
          place.lat,
          place.lng,
        ]);
      }
    );

    map.invalidateSize();

    if (bounds.length > 1) {
      map.fitBounds(
        L.latLngBounds(
          bounds
        ).pad(0.18),
        {
          maxZoom: 15,
        }
      );
    } else {
      map.setView(
        [
          result.center.lat,
          result.center.lng,
        ],
        14
      );

      campusMarker.openPopup();
    }
  }, [
    result,
    visiblePlaces,
  ]);

  /*
    Search existing backend.
  */
  const search =
    async (
      event,
      preset
    ) => {
      event?.preventDefault();

      const value =
        (
          preset ??
          query
        ).trim();

      if (value.length < 3) {
        setError(
          "Enter a university name or address."
        );

        return;
      }

      setLoading(true);
      setError("");

      setSelectedCategory(
        "all"
      );

      try {
        const data =
          await api(
            `/api/survival-guide?q=${encodeURIComponent(
              value
            )}`
          );

        setResult(data);
      } catch (err) {
        setResult(null);

        setError(
          err.message ||
            "Unable to retrieve nearby places."
        );
      } finally {
        setLoading(false);
      }
    };

  /*
    Existing favorite shortcut.
  */
  const searchFavorite =
    (
      event,
      favorite
    ) => {
      const value =
        [
          favorite.name,
          favorite.country,
        ]
          .filter(Boolean)
          .join(", ");

      setQuery(value);

      search(
        event,
        value
      );
    };

  /*
    List item → corresponding marker.
  */
  const focusPlace =
    (place) => {
      const map =
        mapRef.current;

      if (!map) {
        return;
      }

      map.flyTo(
        [
          place.lat,
          place.lng,
        ],
        17,
        {
          duration: 0.7,
        }
      );

      const marker =
        markerRefs.current.get(
          place.markerKey
        );

      marker?.openPopup();
    };

  return (
    <main className="mx-auto w-full max-w-7xl flex-1 px-4 py-8 sm:px-6 lg:px-8">

      {/* PAGE HEADER */}

      <section className="relative overflow-hidden rounded-3xl border border-indigo-100 bg-gradient-to-br from-indigo-50 via-white to-sky-50 p-6 sm:p-8">

        <div className="relative z-10 max-w-3xl">

          <span className="inline-flex items-center rounded-full border border-indigo-200 bg-white/80 px-3 py-1 text-xs font-semibold uppercase tracking-[0.16em] text-indigo-600">
            Student Life
          </span>

          <h1 className="mt-4 text-3xl font-bold tracking-tight text-slate-900 sm:text-4xl">
            Housing & Survival Guide
          </h1>

          <p className="mt-3 max-w-2xl text-base leading-7 text-slate-600">
            Understand what daily life looks
            like around your future campus.
            Discover nearby mosques, halal
            food, hospitals, and public
            transport before you arrive.
          </p>

        </div>


        <div className="pointer-events-none absolute -right-10 -top-12 hidden text-[150px] opacity-[0.07] sm:block">
          🧭
        </div>

      </section>


      {/* SEARCH CARD */}

      <section className="relative z-20 mt-5 rounded-2xl border border-slate-200 bg-white p-4 shadow-lg shadow-slate-200/40 sm:p-5">
        <form
          onSubmit={search}
        >

          <label
            htmlFor="survival-search"
            className="mb-2 block text-sm font-semibold text-slate-700"
          >
            Where are you planning to study?
          </label>


          <div className="flex flex-col gap-3 sm:flex-row">

            <div className="relative flex-1">

              <span className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-slate-400">
                🔎
              </span>


              <input
                id="survival-search"
                value={query}
                onChange={(event) =>
                  setQuery(
                    event.target.value
                  )
                }
                placeholder="University of Toronto, Toronto, Canada"
                className="w-full rounded-xl border border-slate-300 bg-slate-50 py-3 pl-11 pr-4 text-slate-800 outline-none transition placeholder:text-slate-400 focus:border-indigo-500 focus:bg-white focus:ring-4 focus:ring-indigo-100"
              />

            </div>


            <button
              type="submit"
              disabled={loading}
              className="rounded-xl bg-indigo-600 px-6 py-3 font-semibold text-white shadow-sm transition hover:bg-indigo-700 hover:shadow-md disabled:cursor-not-allowed disabled:opacity-50"
            >
              {loading
                ? "Searching..."
                : "Explore Nearby"}
            </button>

          </div>


          <p className="mt-2 text-xs text-slate-400">
            Include city and country for
            more accurate results.
          </p>

        </form>

      </section>


      {/* FAVORITES */}

      {favorites.length > 0 &&
        !result && (
          <section className="mt-6">

            <p className="mb-3 text-xs font-semibold uppercase tracking-[0.14em] text-slate-400">
              Quick search from saved universities
            </p>


            <div className="flex flex-wrap gap-2">

              {favorites
                .slice(0, 4)
                .map(
                  (favorite) => (

                    <button
                      key={
                        favorite._id
                      }
                      type="button"
                      onClick={(
                        event
                      ) =>
                        searchFavorite(
                          event,
                          favorite
                        )
                      }
                      className="rounded-full border border-slate-200 bg-white px-4 py-2 text-sm font-medium text-slate-600 shadow-sm transition hover:-translate-y-0.5 hover:border-indigo-300 hover:text-indigo-600 hover:shadow"
                    >
                      ★{" "}
                      {
                        favorite.name
                      }
                    </button>

                  )
                )}

            </div>

          </section>
        )}


      {/* ERROR */}

      {error && (
        <section className="mt-6 rounded-2xl border border-red-200 bg-red-50 p-4">

          <div className="flex gap-3">

            <div className="text-xl">
              ⚠️
            </div>

            <div>
              <p className="font-semibold text-red-800">
                Unable to load nearby facilities
              </p>

              <p className="mt-1 text-sm text-red-700">
                {error}
              </p>
            </div>

          </div>

        </section>
      )}


      {/* INITIAL STATE */}

      {!result &&
        !error && (
          <section className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">

            {Object.entries(
              CATEGORIES
            ).map(
              ([
                key,
                category,
              ]) => (

                <div
                  key={key}
                  className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm"
                >

                  <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-slate-100 text-2xl">
                    {
                      category.emoji
                    }
                  </div>

                  <h2 className="mt-4 font-semibold text-slate-800">
                    {
                      category.shortLabel
                    }
                  </h2>

                  <p className="mt-1 text-sm leading-6 text-slate-500">
                    {
                      category.description
                    }
                  </p>

                </div>

              )
            )}

          </section>
        )}


      {/* CAMPUS INFO */}

      {result && (
        <section className="mt-6 flex flex-col gap-4 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:flex-row sm:items-center sm:justify-between">

          <div className="flex items-start gap-4">

            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-indigo-100 text-xl">
              🎓
            </div>


            <div>

              <p className="text-xs font-semibold uppercase tracking-[0.14em] text-slate-400">
                Selected campus
              </p>

              <h2 className="mt-1 font-semibold text-slate-900">
                {
                  result.query
                }
              </h2>

              <p className="mt-1 text-xs text-slate-400">
                {Number(
                  result.center.lat
                ).toFixed(5)}
                ,{" "}
                {Number(
                  result.center.lng
                ).toFixed(5)}
              </p>

            </div>

          </div>


          <span
            className={`w-fit rounded-full px-3 py-1.5 text-xs font-semibold ${
              result.cached
                ? "bg-amber-50 text-amber-700"
                : "bg-emerald-50 text-emerald-700"
            }`}
          >
            {result.cached
              ? "Cached result"
              : "Live map result"}
          </span>

        </section>
      )}


      {/* SUMMARY CARDS */}

      {result && (
        <section className="mt-5 grid grid-cols-2 gap-3 lg:grid-cols-4">

          {Object.entries(
            CATEGORIES
          ).map(
            ([
              key,
              category,
            ]) => {

              const items =
                result.places[
                  key
                ] ?? [];

              const selected =
                selectedCategory ===
                key;

              return (
                <button
                  key={key}
                  type="button"
                  onClick={() =>
                    setSelectedCategory(
                      key
                    )
                  }
                  className={`group rounded-2xl border bg-white p-4 text-left shadow-sm transition hover:-translate-y-0.5 hover:shadow-md ${
                    selected
                      ? "border-indigo-500 ring-4 ring-indigo-50"
                      : "border-slate-200 hover:border-indigo-200"
                  }`}
                >

                  <div className="flex items-start justify-between gap-3">

                    <div
                      className="flex h-11 w-11 items-center justify-center rounded-xl text-xl"
                      style={{
                        backgroundColor:
                          `${category.color}12`,
                      }}
                    >
                      {
                        category.emoji
                      }
                    </div>


                    <span className="text-3xl font-bold tracking-tight text-slate-900">
                      {
                        items.length
                      }
                    </span>

                  </div>


                  <p className="mt-3 font-semibold text-slate-800">
                    {
                      category.shortLabel
                    }
                  </p>

                  <p className="mt-1 text-xs text-slate-400">
                    Showing closest mapped places
                  </p>

                </button>
              );
            }
          )}

        </section>
      )}


      {/* FILTERS */}

      {result && (
        <section className="mt-6 flex flex-wrap gap-2">

          <button
            type="button"
            onClick={() =>
              setSelectedCategory(
                "all"
              )
            }
            className={`rounded-full px-4 py-2 text-sm font-medium transition ${
              selectedCategory ===
              "all"
                ? "bg-slate-900 text-white shadow-sm"
                : "border border-slate-200 bg-white text-slate-600 hover:border-slate-300 hover:bg-slate-50"
            }`}
          >
            All
          </button>


          {Object.entries(
            CATEGORIES
          ).map(
            ([
              key,
              category,
            ]) => (

              <button
                key={key}
                type="button"
                onClick={() =>
                  setSelectedCategory(
                    key
                  )
                }
                className={`rounded-full px-4 py-2 text-sm font-medium transition ${
                  selectedCategory ===
                  key
                    ? "bg-slate-900 text-white shadow-sm"
                    : "border border-slate-200 bg-white text-slate-600 hover:border-slate-300 hover:bg-slate-50"
                }`}
              >
                {
                  category.emoji
                }{" "}
                {
                  category.shortLabel
                }
              </button>

            )
          )}

        </section>
      )}


      {/* MAP + LIST */}

      <section
        className={`mt-5 grid gap-5 ${
          result
            ? "lg:grid-cols-[minmax(0,1.45fr)_minmax(300px,.75fr)]"
            : ""
        }`}
      >

        {/* MAP */}

        <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white p-2 shadow-sm">

          <div
            ref={mapDivRef}
            className="h-[56vh] min-h-[430px] w-full overflow-hidden rounded-xl"
          />

        </div>


        {/* LIST */}

        {result && (
          <aside className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">

            <div className="border-b border-slate-100 p-5">

              <div className="flex items-start justify-between gap-3">

                <div>

                  <h2 className="font-semibold text-slate-900">
                    {selectedCategory ===
                    "all"
                      ? "Nearby Essentials"
                      : CATEGORIES[
                          selectedCategory
                        ].label}
                  </h2>

                  <p className="mt-1 text-sm text-slate-400">
                    Sorted by distance
                  </p>

                </div>


                <span className="rounded-full bg-slate-100 px-2.5 py-1 text-xs font-semibold text-slate-500">
                  {
                    visiblePlaces.length
                  }{" "}
                  shown
                </span>

              </div>

            </div>


            <div className="max-h-[500px] overflow-y-auto p-3">

              {visiblePlaces.length ===
              0 ? (

                <div className="px-4 py-12 text-center">

                  <div className="text-4xl">
                    🔎
                  </div>

                  <p className="mt-3 font-semibold text-slate-700">
                    Nothing mapped nearby
                  </p>

                  <p className="mx-auto mt-1 max-w-xs text-sm leading-6 text-slate-400">
                    OpenStreetMap may not
                    currently contain places
                    in this category near the
                    selected campus.
                  </p>

                </div>

              ) : (

                <div className="space-y-2">

                  {visiblePlaces.map(
                    (place) => {

                      const category =
                        CATEGORIES[
                          place.category
                        ];

                      return (
                        <button
                          key={
                            place.markerKey
                          }
                          type="button"
                          onClick={() =>
                            focusPlace(
                              place
                            )
                          }
                          className="w-full rounded-xl border border-transparent p-3 text-left transition hover:border-indigo-100 hover:bg-indigo-50/50"
                        >

                          <div className="flex items-start gap-3">

                            <div
                              className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl text-lg"
                              style={{
                                backgroundColor:
                                  `${category.color}12`,
                              }}
                            >
                              {
                                category.emoji
                              }
                            </div>


                            <div className="min-w-0 flex-1">

                              <div className="flex items-start justify-between gap-3">

                                <div className="min-w-0">

                                  <p className="truncate font-semibold text-slate-800">
                                    {
                                      place.name
                                    }
                                  </p>

                                  <p className="mt-0.5 text-xs text-slate-400">
                                    {
                                      category.label
                                    }
                                  </p>

                                </div>


                                <span className="shrink-0 rounded-full bg-slate-100 px-2 py-1 text-xs font-semibold text-slate-600">
                                  {
                                    place.distanceKm
                                  }{" "}
                                  km
                                </span>

                              </div>


                              {place.detail && (
                                <p className="mt-2 line-clamp-2 text-sm text-slate-500">
                                  {
                                    place.detail
                                  }
                                </p>
                              )}


                              <p className="mt-2 text-xs font-semibold text-indigo-600">
                                View on map →
                              </p>

                            </div>

                          </div>

                        </button>
                      );
                    }
                  )}

                </div>
              )}

            </div>

          </aside>
        )}

      </section>


      {/* DATA NOTE */}

      {result && (
        <section className="mt-5 rounded-xl bg-slate-100/70 px-4 py-3">

          <p className="text-xs leading-5 text-slate-500">
            Map data comes from
            OpenStreetMap contributors.
            Coverage varies between cities,
            so unlisted facilities may still
            exist. Distances shown are
            straight-line distances from the
            campus.
          </p>

        </section>
      )}

    </main>
  );
}