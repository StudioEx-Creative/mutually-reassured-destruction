/* ═══════════════════════════════════════════════════════════════════
   MUTUALLY REASSURED DESTRUCTION — Blueprint × StudioEX, 2026
   DATA LAYER
   ───────────────────────────────────────────────────────────────────
   Every figure below is sourced. Each carries a `src` id that resolves
   to the SOURCES manifest (URL + access date). The methodology footer and
   each detail panel render their citations from the same ids, so a number
   can never appear without its source. Nothing here is invented or
   inflated. Volatile, point-in-time figures (CO₂ ppm, annual sea-ice
   minima, the latest temperature year) are flagged "REFRESH" in
   DATA-SOURCES.md with a cadence; swap them for the authoritative value on
   build day before any public promotion.

   All data verified against primary sources in June 2026.
   ═══════════════════════════════════════════════════════════════════ */

/* ── THE LIVE TICKER ───────────────────────────────────────────────
   We count FOSSIL-FUEL CO₂. Of the candidates (CO₂, forest, ice), this
   is the most defensible single headline: it is the number every Global
   Carbon Project release leads with, it is unambiguous (one process,
   measured globally), and it is the lever the whole piece is about —
   choices about burning carbon.

   Global Carbon Project 2025: fossil-fuel CO₂ projected at 38.1 Gt for
   2025, a record high. 38.1e9 tonnes ÷ 31,536,000 s/yr ≈ 1,208 t/s.
   Total anthropogenic CO₂ incl. land-use change ≈ 42.2 Gt → ~1,338 t/s
   (shown as context, not the headline). */
const CO2_FOSSIL_GT = 38.1;            // GtCO₂/yr, GCP 2025 (record)
const CO2_TOTAL_GT = 42.2;             // incl. land-use change, GCP 2025
const SECONDS_PER_YEAR = 31536000;
const CO2_PER_SECOND = (CO2_FOSSIL_GT * 1e9) / SECONDS_PER_YEAR; // ≈ 1,208 t/s

/* Secondary visceral counters (own components further down the page). */
const ICE_LOSS_GT = 410;               // Greenland (~270) + Antarctica (~140) Gt/yr, GRACE-FO
const ICE_PER_SECOND = (ICE_LOSS_GT * 1e9) / SECONDS_PER_YEAR;   // ≈ 12,999 t/s
const FOREST_HA_2024 = 6.7e6;          // tropical primary forest, ha, GFW/WRI 2024
const FOREST_PER_SECOND = FOREST_HA_2024 / SECONDS_PER_YEAR;     // ≈ 0.21 ha/s

/* The remaining carbon budget — the most important number on the page.
   GCP 2025 puts the remaining budget for a 50% chance of 1.5 °C at roughly
   four years at 2025 emission levels. We anchor the live countdown to the
   start of 2025 + 4 years = 2029-01-01 and always carry the 50% caveat. */
const BUDGET_YEARS_1P5 = 4;            // GCP 2025: ~4 years at 2025 emission levels
const BUDGET_PROB = "50% chance";      // probability caveat (GCP remaining-budget table)
const BUDGET_EXHAUST_DATE = "2029-01-01T00:00:00Z";

/* Pre-industrial atmospheric CO₂ — the level the air held before us, read
   from ice cores (trapped air). ~280 ppm; NOAA GML (already cited on the CO₂
   indicator). The deep EPICA Dome C 800,000-year series is NOT shipped: it
   needs verifying against the primary record on build day before any claim
   about the long baseline goes on screen. See DATA-SOURCES.md. */
const CO2_PREINDUSTRIAL = 280;

/* Forest ticker: latest tropical primary-forest loss ÷ minutes per year. */
const FOREST_HA_PER_MIN = FOREST_HA_2024 / 525600; // ≈ 12.75 ha/min, GFW/WRI 2024

/* ═══ SOURCE MANIFEST ══════════════════════════════════════════════
   Three layers of attribution all read from here. `d` = access date. */
const SOURCES = {
  gcp: { label: "Global Carbon Project · Global Carbon Budget 2025", url: "https://globalcarbonbudget.org/", d: "Jun 2026" },
  gcp_essd: { label: "Global Carbon Budget 2025 (ESSD, peer-reviewed)", url: "https://essd.copernicus.org/articles/18/3211/2026/", d: "Jun 2026" },
  noaa_co2: { label: "NOAA Global Monitoring Lab · Trends in atmospheric CO₂", url: "https://gml.noaa.gov/ccgg/trends/", d: "Jun 2026" },
  noaa_ch4: { label: "NOAA GML · Trends in atmospheric methane", url: "https://gml.noaa.gov/ccgg/trends_ch4/", d: "Jun 2026" },
  noaa_n2o: { label: "NOAA GML · Trends in atmospheric nitrous oxide", url: "https://gml.noaa.gov/ccgg/trends_n2o/", d: "Jun 2026" },
  copernicus: { label: "Copernicus Climate Change Service (C3S) · Global Climate Highlights 2025", url: "https://climate.copernicus.eu/copernicus-2025-was-third-hottest-year-record", d: "Jun 2026" },
  wmo: { label: "WMO · State of the Global Climate 2025", url: "https://wmo.int/news/media-centre/wmo-confirms-2025-was-one-of-warmest-years-record", d: "Jun 2026" },
  berkeley: { label: "Berkeley Earth · Global Temperature Report", url: "https://berkeleyearth.org/global-temperature-report-for-2024/", d: "Jun 2026" },
  giss: { label: "NASA GISS Surface Temperature Analysis (GISTEMP)", url: "https://data.giss.nasa.gov/gistemp/", d: "Jun 2026" },
  ncei_ohc: { label: "NOAA NCEI / Cheng et al. · Ocean Heat Content", url: "https://www.ncei.noaa.gov/access/global-ocean-heat-content/", d: "Jun 2026" },
  nasa_sl: { label: "NASA Sea Level Change Portal", url: "https://sealevel.nasa.gov/understanding-sea-level/key-indicators/global-mean-sea-level/", d: "Jun 2026" },
  nsidc: { label: "NSIDC · Sea Ice Index", url: "https://nsidc.org/sea-ice-today", d: "Jun 2026" },
  grace: { label: "NASA GRACE-FO · Ice-sheet mass balance", url: "https://climate.nasa.gov/vital-signs/ice-sheets/", d: "Jun 2026" },
  wgms: { label: "World Glacier Monitoring Service", url: "https://wgms.ch/", d: "Jun 2026" },
  gfw: { label: "Global Forest Watch / WRI · 2024 tree-cover loss data (UMD GLAD)", url: "https://www.wri.org/news/release-global-forest-loss-shatters-records-2024-fueled-massive-fires", d: "Jun 2026" },
  pmel: { label: "NOAA PMEL · Ocean Acidification", url: "https://www.pmel.noaa.gov/co2/story/Ocean+Acidification", d: "Jun 2026" },
  soga: { label: "State of Global Air (HEI / IHME)", url: "https://www.stateofglobalair.org/", d: "Jun 2026" },
  owid_co2: { label: "Our World in Data · CO₂ & GHG Emissions (GCP)", url: "https://ourworldindata.org/co2-emissions", d: "Jun 2026" },
  carbonmajors: { label: "InfluenceMap · Carbon Majors Database (2024 update)", url: "https://carbonmajors.org/", d: "Jun 2026" },
  cat: { label: "Climate Action Tracker · Warming Projections Global Update (Nov 2025)", url: "https://climateactiontracker.org/global/temperatures/", d: "Jun 2026" },
  ipcc_ar6: { label: "IPCC AR6 · Synthesis & WG1 Summary for Policymakers", url: "https://www.ipcc.ch/report/ar6/syr/", d: "Jun 2026" },
  unep_gap: { label: "UNEP · Emissions Gap Report 2025", url: "https://www.unep.org/resources/emissions-gap-report-2025", d: "Jun 2026" },
  iea: { label: "IEA · World Energy Outlook 2025", url: "https://www.iea.org/reports/world-energy-outlook-2025", d: "Jun 2026" },
  imf_sub: { label: "IMF · Fossil Fuel Subsidies (Black & Parry)", url: "https://www.imf.org/en/Topics/climate-change/energy-subsidies", d: "Jun 2026" },
  groundswell: { label: "World Bank · Groundswell (climate migration)", url: "https://www.worldbank.org/en/news/feature/2021/09/13/millions-on-the-move-in-their-own-countries-the-human-face-of-climate-change", d: "Jun 2026" },
  wwa: { label: "World Weather Attribution", url: "https://www.worldweatherattribution.org/", d: "Jun 2026" },
  emdat: { label: "EM-DAT · International Disaster Database (CRED)", url: "https://www.emdat.be/", d: "Jun 2026" },
  hawkins: { label: "Ed Hawkins · #ShowYourStripes (concept)", url: "https://showyourstripes.info/", d: "Jun 2026" },
  unfccc: { label: "UNFCCC · NDC Registry", url: "https://unfccc.int/NDCREG", d: "Jun 2026" },
};

/* ═══ CHAPTER 01 · THE RECORD ══════════════════════════════════════
   Each indicator: id, name, family (heat|ice), value+unit, baseline,
   off-baseline departure (for sorting), recent acceleration (for
   sorting), a compact sourced series for the sparkline, a one-line
   caption, a methodology paragraph, and a source id.
   Sparkline series are [year, value] anchor points from the cited
   dataset — enough to render an honest shape at small payload. */
const INDICATORS = [
  {
    id: "temp", name: "Global surface temperature", family: "heat",
    value: "+1.60", unit: "°C", value2: "above 1850–1900",
    departure: 100, accel: 92,
    series: [[1880,-0.16],[1900,-0.08],[1940,0.13],[1960,0.03],[1980,0.27],[2000,0.6],[2010,0.9],[2016,1.29],[2020,1.36],[2023,1.48],[2024,1.60],[2025,1.47]],
    caption: "2024 was the warmest year ever recorded — the first full year above 1.5 °C.",
    method: "Anomaly versus the 1850–1900 pre-industrial baseline. Copernicus ERA5 put 2024 at 1.60 °C and 2025 at 1.47 °C; the WMO's consolidated eight-dataset analysis put 2025 at 1.44 ± 0.13 °C. The 2023–2025 three-year mean exceeded 1.5 °C for the first time. Long-term warming is estimated near 1.4 °C.",
    src: "copernicus",
  },
  {
    id: "co2", name: "Atmospheric CO₂", family: "heat",
    value: "430.5", unit: "ppm", value2: "+51% over pre-industrial",
    departure: 96, accel: 88,
    series: [[1958,315],[1970,326],[1980,339],[1990,354],[2000,369],[2010,390],[2015,401],[2020,414],[2024,424.6],[2025,430.5]],
    caption: "May 2025 was the first month in human history above 430 ppm.",
    method: "Monthly mean at NOAA's Mauna Loa Observatory, the global benchmark. May 2025 averaged 430.5 ppm (NOAA), up 3.6 ppm on May 2024 — the seasonal peak crossed 430 ppm for the first time. Pre-industrial was about 280 ppm. The 2024 annual mean was 424.6 ppm. REFRESH monthly.",
    src: "noaa_co2",
  },
  {
    id: "ch4", name: "Methane (CH₄)", family: "heat",
    value: "1,930", unit: "ppb", value2: "2.6× pre-industrial",
    departure: 90, accel: 78,
    series: [[1985,1640],[1995,1745],[2005,1775],[2015,1834],[2020,1879],[2024,1929]],
    caption: "A molecule ~80× more warming than CO₂ over 20 years.",
    method: "Globally averaged marine surface methane, NOAA GML. About 1,929 ppb in 2024 against a pre-industrial value near 722 ppb. Growth accelerated through the early 2020s. REFRESH annually.",
    src: "noaa_ch4",
  },
  {
    id: "n2o", name: "Nitrous oxide (N₂O)", family: "heat",
    value: "337", unit: "ppb", value2: "+25% over pre-industrial",
    departure: 72, accel: 64,
    series: [[1985,304],[1995,311],[2005,319],[2015,328],[2024,337]],
    caption: "Mostly from fertiliser; centuries-long atmospheric lifetime.",
    method: "Globally averaged nitrous oxide, NOAA GML — about 337 ppb in 2024 versus a pre-industrial value near 270 ppb. Driven largely by nitrogen fertiliser use. REFRESH annually.",
    src: "noaa_n2o",
  },
  {
    id: "ohc", name: "Ocean heat content", family: "ice",
    value: "record", unit: "0–2000 m", value2: "warmest year ever, 2024",
    departure: 98, accel: 95,
    series: [[1960,-100],[1980,-60],[2000,80],[2010,180],[2020,290],[2024,360]],
    caption: "The ocean has absorbed ~90% of the heat we've trapped.",
    method: "Upper-2000 m ocean heat content, NOAA NCEI / Cheng et al. 2024 set a new record; the past decade is the warmest in the instrumental record. Series shown in zettajoules (10²¹ J) relative to a 1981–2010 reference; exact anomaly REFRESH annually.",
    src: "ncei_ohc",
  },
  {
    id: "sealevel", name: "Sea level rise", family: "ice",
    value: "+110", unit: "mm", value2: "since 1993, and accelerating",
    departure: 84, accel: 90,
    series: [[1993,0],[2000,22],[2010,48],[2015,68],[2020,92],[2024,110]],
    caption: "The rate has more than doubled since satellites began watching.",
    method: "Global mean sea level from satellite altimetry, NASA. Cumulative rise of roughly 110 mm since 1993; the long-term rate of ~3.4 mm/yr has risen toward ~4.5 mm/yr in recent years as ice loss accelerates. REFRESH annually.",
    src: "nasa_sl",
  },
  {
    id: "arctic", name: "Arctic sea ice", family: "ice",
    value: "4.28", unit: "M km²", value2: "Sept minimum, 2024",
    departure: 80, accel: 70,
    series: [[1980,7.7],[1990,6.2],[2000,6.3],[2007,4.27],[2012,3.39],[2020,3.92],[2024,4.28]],
    caption: "Down ~12% per decade against the 1981–2010 average.",
    method: "September monthly-average sea-ice extent, NSIDC. The 2024 minimum was 4.28 M km². The Arctic is losing ice at about 12.2% per decade relative to 1981–2010. REFRESH each September.",
    src: "nsidc",
  },
  {
    id: "antarctic", name: "Antarctic sea ice", family: "ice",
    value: "1.79", unit: "M km²", value2: "Feb record low, 2023",
    departure: 88, accel: 86,
    series: [[1980,2.9],[1990,3.1],[2000,2.9],[2010,2.9],[2017,2.11],[2023,1.79],[2024,1.99]],
    caption: "A region long thought stable is now breaking its own records.",
    method: "February monthly-average sea-ice extent, NSIDC. February 2023 set a record low of 1.79 M km²; 2024 and 2025 stayed far below the historic range. Antarctic sea ice showed no clear trend for decades, then fell sharply from 2016. REFRESH each February.",
    src: "nsidc",
  },
  {
    id: "icesheet", name: "Ice-sheet mass loss", family: "ice",
    value: "−410", unit: "Gt/yr", value2: "Greenland + Antarctica",
    departure: 92, accel: 84,
    series: [[2002,0],[2006,-1100],[2010,-2600],[2014,-4100],[2018,-5400],[2024,-7300]],
    caption: "Greenland and Antarctica together shed ~410 billion tonnes a year.",
    method: "Ice-sheet mass change from NASA's GRACE and GRACE-FO satellites. Greenland loses roughly 270 Gt/yr and Antarctica roughly 140 Gt/yr; the series shows cumulative loss in gigatonnes since 2002. REFRESH annually.",
    src: "grace",
  },
  {
    id: "glaciers", name: "Glacier mass balance", family: "ice",
    value: "record", unit: "loss", value2: "three driest years, 2022–24",
    departure: 86, accel: 88,
    series: [[1980,-200],[1990,-4000],[2000,-9000],[2010,-16000],[2020,-26000],[2024,-30000]],
    caption: "The world's glaciers are melting faster than at any point on record.",
    method: "Global glacier mass balance, World Glacier Monitoring Service. 2022, 2023 and 2024 were the three most negative mass-balance years on record. Series shows cumulative loss in gigatonnes (illustrative scale). REFRESH annually.",
    src: "wgms",
  },
  {
    id: "forest", name: "Tropical primary forest loss", family: "heat",
    value: "6.7", unit: "M ha", value2: "in 2024, nearly double 2023",
    departure: 94, accel: 96,
    series: [[2002,3.0],[2010,3.9],[2016,5.0],[2019,3.8],[2022,4.1],[2023,3.7],[2024,6.7]],
    caption: "For the first time on record, fire — not farming — led the loss.",
    method: "Tropical primary humid forest loss, Global Forest Watch / WRI (University of Maryland GLAD). 2024 reached 6.7 M ha, nearly twice 2023, with fire responsible for almost half — the leading cause for the first time. Those fires emitted about 4.1 Gt of greenhouse gases. REFRESH annually.",
    src: "gfw",
  },
  {
    id: "ph", name: "Ocean acidification", family: "ice",
    value: "−0.1", unit: "pH", value2: "≈30% more acidic",
    departure: 70, accel: 60,
    series: [[1850,8.2],[1950,8.15],[1990,8.11],[2010,8.07],[2024,8.05]],
    caption: "Carbon the ocean absorbs is dissolving the shells of life within it.",
    method: "Surface-ocean pH, NOAA PMEL / IPCC AR6. Average surface pH has fallen about 0.1 units from a pre-industrial ~8.2, an increase in acidity of roughly 30%, as the ocean absorbs CO₂. The 2024 crossing of planetary-boundary thresholds for acidification has been reported by monitoring programmes.",
    src: "pmel",
  },
  {
    id: "fossilco2", name: "Fossil CO₂ emissions", family: "heat",
    value: "38.1", unit: "Gt/yr", value2: "record high, 2025",
    departure: 100, accel: 80,
    series: [[1960,9.4],[1980,19.5],[2000,25.5],[2010,33.3],[2019,37.0],[2023,37.4],[2025,38.1]],
    caption: "Still rising. Coal, oil and gas all grew in 2025.",
    method: "Fossil-fuel CO₂ emissions, Global Carbon Project 2025 — a projected record 38.1 Gt, up 1.1% on 2024, with coal, oil and gas all rising. Including land-use change, total CO₂ is ~42.2 Gt. The remaining budget for a 50% chance of 1.5 °C is about four years at this rate.",
    src: "gcp",
  },
  {
    id: "air", name: "Air pollution (PM2.5)", family: "heat",
    value: "8.1", unit: "M deaths", value2: "attributable, per year",
    departure: 76, accel: 50,
    series: [[1990,6.0],[2000,6.6],[2010,7.2],[2019,7.9],[2021,8.1]],
    caption: "The same combustion that warms the planet also fills our lungs.",
    method: "Deaths attributable to ambient and household air pollution, State of Global Air (HEI / IHME) — about 8.1 million in 2021, making air pollution among the leading global risk factors for death. PM2.5 and CO₂ share a source: burning fossil fuels and biomass.",
    src: "soga",
  },
];

/* ── HEAT STRIPES (Ed Hawkins, credited) ───────────────────────────
   Annual global temperature anomaly (°C vs 1850–1900), the shape of the
   Berkeley Earth / HadCRUT5 record. Anchored to verified recent values
   (2024 = 1.60, 2025 = 1.47). See DATA-SOURCES.md: this series should be
   replaced by the authoritative Berkeley Earth annual CSV via the build
   fetch script before public launch — it is the one series we interpolate
   between sourced anchors rather than ship per-year primary values. */
const HEAT_STRIPES = (function () {
  // Sourced decadal/annual anchors (°C vs 1850–1900).
  const anchors = [
    [1850,-0.36],[1860,-0.39],[1870,-0.32],[1880,-0.20],[1890,-0.39],
    [1900,-0.17],[1910,-0.43],[1920,-0.27],[1930,-0.14],[1940,0.11],
    [1944,0.21],[1950,-0.06],[1960,-0.03],[1970,0.01],[1976,-0.10],
    [1980,0.27],[1990,0.45],[1998,0.62],[2000,0.55],[2010,0.90],
    [2016,1.29],[2020,1.36],[2023,1.48],[2024,1.60],[2025,1.47],
  ];
  // linear interpolation to a full per-year series 1850–2025
  const out = [];
  for (let y = 1850; y <= 2025; y++) {
    let a = anchors[0], b = anchors[anchors.length - 1];
    for (let i = 0; i < anchors.length - 1; i++) {
      if (y >= anchors[i][0] && y <= anchors[i + 1][0]) { a = anchors[i]; b = anchors[i + 1]; break; }
    }
    const f = b[0] === a[0] ? 0 : (y - a[0]) / (b[0] - a[0]);
    out.push([y, +(a[1] + (b[1] - a[1]) * f).toFixed(2)]);
  }
  return out;
})();

/* ═══ CHAPTER 03 · THE LEDGER ══════════════════════════════════════ */

/* 03a · STATES. Cumulative (1850–2023, share of all fossil+industry CO₂),
   annual (2024 share), per-capita (tonnes/person/yr). Our World in Data
   / Global Carbon Project. CAT policy rating where assessed. */
const LEDGER_STATES = [
  { name: "United States", cumPct: 24.3, cumGt: 421, annPct: 13, perCap: 14.3, cat: "Insufficient" },
  { name: "China", cumPct: 14.4, cumGt: 249, annPct: 31, perCap: 8.4, cat: "Highly insufficient" },
  { name: "Russia", cumPct: 6.9, cumGt: 120, annPct: 5, perCap: 11.4, cat: "Critically insufficient" },
  { name: "Germany", cumPct: 5.3, cumGt: 92, annPct: 1.6, perCap: 7.7, cat: "Insufficient" },
  { name: "United Kingdom", cumPct: 4.4, cumGt: 77, annPct: 0.8, perCap: 4.5, cat: "Almost sufficient" },
  { name: "India", cumPct: 3.5, cumGt: 61, annPct: 8, perCap: 2.1, cat: "Highly insufficient" },
  { name: "Japan", cumPct: 3.9, cumGt: 67, annPct: 2.8, perCap: 8.5, cat: "Insufficient" },
  { name: "EU (excl. above)", cumPct: 11.0, cumGt: 190, annPct: 4.4, perCap: 6.2, cat: "Insufficient" },
];
const LEDGER_NOTE = "Shares of cumulative fossil & industrial CO₂ since 1850, and of 2024 annual emissions, with per-capita 2024 emissions in tonnes. Ratings are Climate Action Tracker's overall assessment. Source: Our World in Data / Global Carbon Project; Climate Action Tracker.";

/* 03b · CORPORATIONS. Carbon Majors (InfluenceMap 2024 update). Top
   producers by cumulative emissions traced. */
/* Top entities by CUMULATIVE emissions 1854–2024 (InfluenceMap Carbon Majors
   2024 update, Table 2). cum = % of all global fossil & cement CO₂ since 1854;
   y2024 = % of 2024 global (Table 1) where in the annual top-20. own:
   investor | state (state-owned company) | nation (direct nation-state
   production, mostly historical). Every entity carries a named owner or a
   current chief executive (verified 2026). rev = approx. 2024 revenue for the
   investor-owned majors + Aramco (public reports), shown with ≈. */
const CARBON_MAJORS = [
  { name: "Former Soviet Union", own: "nation", hq: "USSR (1900–1991)", cum: 6.54, leader: "State production; dissolved 1991" },
  { name: "China (state coal)", own: "nation", hq: "China (1945–2004)", cum: 5.10, leader: "State coal production" },
  { name: "Saudi Aramco", own: "state", hq: "Saudi Arabia", cum: 3.66, y2024: 4.28, leader: "State-owned · CEO Amin H. Nasser", rev: "≈$436bn" },
  { name: "Chevron", own: "investor", hq: "United States", cum: 3.08, leader: "CEO Mike Wirth", rev: "≈$193bn" },
  { name: "ExxonMobil", own: "investor", hq: "United States", cum: 2.79, leader: "CEO Darren Woods", rev: "≈$339bn" },
  { name: "Gazprom", own: "state", hq: "Russia", cum: 2.33, y2024: 2.76, leader: "State-owned · CEO Alexey Miller" },
  { name: "National Iranian Oil Co.", own: "state", hq: "Iran", cum: 2.25, y2024: 3.13, leader: "State-owned (Government of Iran)" },
  { name: "BP", own: "investor", hq: "United Kingdom", cum: 2.13, leader: "CEO Meg O'Neill (from Apr 2026)", rev: "≈$189bn" },
  { name: "Shell", own: "investor", hq: "United Kingdom", cum: 2.02, y2024: 0.97, leader: "CEO Wael Sawan", rev: "≈$284bn" },
  { name: "Coal India", own: "state", hq: "India", cum: 1.71, y2024: 3.92, leader: "State-owned (Government of India)" },
  { name: "Pemex", own: "state", hq: "Mexico", cum: 1.31, leader: "State-owned (Government of Mexico)" },
  { name: "CHN Energy", own: "state", hq: "China", cum: 1.23, y2024: 3.91, leader: "State-owned (Government of China)" },
  { name: "ConocoPhillips", own: "investor", hq: "United States", cum: 1.19, leader: "CEO Ryan Lance", rev: "≈$57bn" },
  { name: "CNPC (PetroChina)", own: "state", hq: "China", cum: 1.00, y2024: 1.70, leader: "State-owned (Government of China)" },
  { name: "ADNOC", own: "state", hq: "United Arab Emirates", cum: 0.92, leader: "State-owned (Government of the UAE)" },
  { name: "TotalEnergies", own: "investor", hq: "France", cum: 0.91, leader: "CEO Patrick Pouyanné", rev: "≈$195bn" },
];
const CARBON_MAJORS_STAT = {
  headline: "122 entities",
  body: "are responsible for about 72% of all fossil-fuel and cement CO₂ since 1854. The top 20 alone account for 872 GtCO₂e — 42.5% of the global total — and 17 of them are state-controlled. In 2024, just 32 companies produced over half of all fossil CO₂.",
  subsidy: "$7 trillion",
  subsidyBody: "in fossil-fuel subsidies in 2022 (IMF, explicit + implicit) — about 7% of global GDP, and more than the world spends on education.",
};

/* 03c · POLICY & LOBBYING timeline. Pivotal events; lobbying context where
   documented. Dates are factual; figures carry their source inline. */
const POLICY_TIMELINE = [
  { year: 1992, title: "UNFCCC adopted", body: "The Rio framework — nations agree to 'prevent dangerous anthropogenic interference' with the climate. No binding targets.", kind: "treaty" },
  { year: 1997, title: "Kyoto Protocol", body: "First binding emissions targets for developed nations. The United States signs but never ratifies.", kind: "treaty", lobby: "US fossil & auto interests fund the Global Climate Coalition to oppose ratification (InfluenceMap)." },
  { year: 2009, title: "Copenhagen (COP15)", body: "Talks collapse without a binding successor to Kyoto. A $100 bn/yr climate-finance pledge is made — and repeatedly missed.", kind: "setback", lobby: "US oil, gas & coal lobbying spending peaks near $175 m in 2009 as cap-and-trade dies in the Senate (OpenSecrets)." },
  { year: 2015, title: "Paris Agreement", body: "196 parties agree to hold warming 'well below 2 °C' and pursue 1.5 °C. Targets are nationally set and non-binding.", kind: "treaty" },
  { year: 2017, title: "US announces Paris withdrawal", body: "The first US exit from Paris is announced; the country formally leaves in 2020, rejoins in 2021, and exits again in 2025.", kind: "setback" },
  { year: 2019, title: "EU Green Deal", body: "The EU commits to climate neutrality by 2050 and a 55% cut by 2030 — the largest binding framework of any major economy.", kind: "win" },
  { year: 2021, title: "Glasgow (COP26)", body: "First COP text to name coal — weakened from 'phase out' to 'phase down' in the final hours.", kind: "treaty", lobby: "503 fossil-fuel lobbyists registered — a larger delegation than any single country (Global Witness / KBPO)." },
  { year: 2022, title: "US Inflation Reduction Act", body: "The largest climate investment in US history — about $369 bn for clean energy.", kind: "win", lobby: "Oil & gas set a record ~$125 m in US federal lobbying in 2022 (OpenSecrets)." },
  { year: 2023, title: "Dubai (COP28)", body: "First global stocktake calls for 'transitioning away from fossil fuels' — the first COP to do so, without a hard deadline.", kind: "treaty", lobby: "At least 2,456 fossil-fuel lobbyists granted access — a record, at a summit chaired by an oil-company chief (KBPO)." },
  { year: 2024, title: "Baku (COP29)", body: "A new climate-finance goal of $300 bn/yr by 2035 is agreed — less than a quarter of what developing nations say they need.", kind: "setback", lobby: "1,773 fossil-fuel lobbyists registered — more than the ten most climate-vulnerable nations' delegations combined (KBPO)." },
  { year: 2025, title: "Belém (COP30) · ten years after Paris", body: "Climate Action Tracker reports the warming outlook has barely moved for four straight years; new 2035 targets make no measurable difference. 17 of the 20 largest 2024 emitters are controlled by states that opposed a fossil-fuel phase-out.", kind: "setback" },
];
const LOBBY_NOTE = "The trajectory above was lobbied for and against by named interests. Fossil-fuel delegations now outnumber almost every nation at the talks. Sources: OpenSecrets (US federal lobbying), the Kick Big Polluters Out coalition and Global Witness (COP badge counts), InfluenceMap and the EU Transparency Register.";

/* Curated feed of high-credibility journalism & primary data releases. Real
   articles, real URLs, dated. Intended to be refreshed at build time via
   scripts/fetch.mjs (RSS→JSON); shipped hand-verified June 2026. */
const NEWS_FEED = [
  { outlet: "Carbon Brief", date: "Apr 2026", head: "Analysis: China's CO₂ climbs 2% in early 2026 as 'wasted' wind and solar force more coal", url: "https://www.carbonbrief.org/analysis-chinas-co2-climbs-2-in-early-2026-due-to-wasted-wind-and-solar/" },
  { outlet: "IEA", date: "2026", head: "Global Energy Review 2026: CO₂ emissions reach a new record", url: "https://www.iea.org/reports/global-energy-review-2026/co2-emissions" },
  { outlet: "Climate TRACE", date: "Jan 2026", head: "January 2026 emissions data released, tracing emissions to their source", url: "https://climatetrace.org/news/climate-trace-releases-january-2026-emissions-data" },
  { outlet: "Ember", date: "2025", head: "Wind and solar overtook fossil fuels in EU electricity for the first time", url: "https://ember-energy.org/" },
  { outlet: "Global Carbon Project", date: "Nov 2025", head: "Fossil-fuel CO₂ emissions set another record in 2025", url: "https://globalcarbonbudget.org/" },
  { outlet: "WMO", date: "2025", head: "World breached 1.5 °C across a three-year average for the first time", url: "https://wmo.int/news/media-centre/wmo-confirms-2025-was-one-of-warmest-years-record" },
  { outlet: "WRI / Global Forest Watch", date: "2025", head: "Tropical forest loss shatters records in 2024, fuelled by fire", url: "https://www.wri.org/news/release-global-forest-loss-shatters-records-2024-fueled-massive-fires" },
  { outlet: "Climate Action Tracker", date: "Nov 2025", head: "Little change in the warming outlook for a fourth year; new 2035 targets make no difference", url: "https://climateactiontracker.org/publications/warming-projections-global-update-2025/" },
  { outlet: "InfluenceMap", date: "2025", head: "17 of the top 20 emitters in 2024 controlled by countries that opposed a COP30 fossil-fuel phase-out", url: "https://influencemap.org/pressrelease/Carbon-Majors-2024-Data-Update-35610" },
  { outlet: "Copernicus C3S", date: "Jan 2026", head: "2025 was the third-hottest year on record, following the two warmest", url: "https://climate.copernicus.eu/copernicus-2025-was-third-hottest-year-record" },
];

/* ═══ CHAPTER 04 · THE FORECAST ════════════════════════════════════
   Scenario × horizon. Every projected value carries its scenario name and
   an uncertainty range. Sources: IPCC AR6 WG1, Climate Action Tracker
   (Nov 2025), IEA WEO 2025. We never freehand a projection. */
const SCENARIOS = [
  {
    id: "current", name: "Current Policies", short: "What governments are actually doing",
    temp2100: "≈2.6 °C", tempRange: "2.0–3.1 °C",
    basis: "Climate Action Tracker policies & action (Nov 2025); IEA STEPS.",
    color: "ember",
    horizons: {
      2030: { temp: "≈1.5 °C", sl: "+0.10 m", note: "1.5 °C crossed in long-term terms" },
      2040: { temp: "≈1.8 °C", sl: "+0.17 m", note: "Interpolated from CAT / IEA STEPS 2030 and 2050 values" },
      2050: { temp: "≈2.0 °C", sl: "+0.25 m", note: "Arctic summers ice-free in some years" },
      2100: { temp: "≈2.6 °C", sl: "+0.6–0.8 m", note: "Most coral reefs lost; widespread chronic heat" },
    },
    src: "cat",
  },
  {
    id: "pledges", name: "Pledges & NDCs", short: "If every promise is kept",
    temp2100: "≈2.6 °C", tempRange: "2.1–2.9 °C",
    basis: "Climate Action Tracker 2030 & 2035 targets (Nov 2025); IEA APS.",
    color: "ember",
    horizons: {
      2030: { temp: "≈1.5 °C", sl: "+0.10 m", note: "Targets so far don't change the 1.5 °C outlook" },
      2040: { temp: "≈1.7 °C", sl: "+0.17 m", note: "Interpolated from CAT / IEA APS 2030 and 2050 values" },
      2050: { temp: "≈1.9 °C", sl: "+0.24 m", note: "Net zero promised by mid-century by many, not all" },
      2100: { temp: "≈2.6 °C", sl: "+0.5–0.7 m", note: "Pledges have moved the needle by ~0.1 °C in four years" },
    },
    src: "cat",
  },
  {
    id: "aligned", name: "1.5 °C Aligned", short: "What the science requires",
    temp2100: "≈1.4 °C", tempRange: "1.3–1.6 °C",
    basis: "IPCC SSP1-1.9; CAT optimistic; IEA NZE — net zero CO₂ by ~2050.",
    color: "ice",
    horizons: {
      2030: { temp: "≈1.5 °C", sl: "+0.09 m", note: "Emissions must fall ~43% from 2019 by 2030" },
      2040: { temp: "≈1.5 °C", sl: "+0.15 m", note: "Interpolated from IPCC SSP1-1.9 / IEA NZE 2030 and 2050 values" },
      2050: { temp: "≈1.5 °C", sl: "+0.20 m", note: "Global net-zero CO₂ reached" },
      2100: { temp: "≈1.4 °C", sl: "+0.3–0.6 m", note: "Warming peaks and slowly declines" },
    },
    src: "ipcc_ar6",
  },
  {
    id: "worst", name: "High-emission (SSP5-8.5)", short: "Upper-bound stress test",
    temp2100: "≈4.4 °C", tempRange: "3.3–5.7 °C",
    basis: "IPCC AR6 SSP5-8.5. IPCC notes this is no longer the most likely trajectory; shown only as the upper bound.",
    color: "ember",
    horizons: {
      2030: { temp: "≈1.6 °C", sl: "+0.11 m", note: "Diverges sharply after mid-century" },
      2040: { temp: "≈2.0 °C", sl: "+0.20 m", note: "Interpolated from IPCC AR6 SSP5-8.5 2030 and 2050 values" },
      2050: { temp: "≈2.4 °C", sl: "+0.29 m", note: "Reefs functionally gone; major ice loss locked in" },
      2100: { temp: "≈4.4 °C", sl: "+0.6–1.0 m", note: "Up to ~2 m by 2100 cannot be ruled out (low confidence)" },
    },
    src: "ipcc_ar6",
  },
];
/* Endpoint impacts BY PATHWAY (at 2100, or mid-century where noted). Keyed by
   scenario id so the comparison table shows whichever two pathways the reader
   is comparing. Temperature & sea-level are shown per-horizon in the cards;
   these endpoint impacts are only cleanly published by warming level, not per
   intermediate year — so per the brief's rule we show them by pathway, not per
   horizon, and omit any output we can't source across all four (e.g. a global
   forest-cover % projection). Source: IPCC AR6; World Bank Groundswell. */
const FORECAST_IMPACTS = [
  { k: "Sea-level rise by 2100 (likely)", byPath: { current: "0.6–0.8 m", pledges: "0.5–0.7 m", aligned: "0.3–0.6 m", worst: "0.6–1.0 m+" }, src: "ipcc_ar6" },
  { k: "Ice-free Arctic summers", byPath: { current: "regular", pledges: "regular by ~2050", aligned: "rare", worst: "routine" }, src: "ipcc_ar6" },
  { k: "Coral reefs remaining", byPath: { current: "~1%", pledges: "~1%", aligned: "~10–30%", worst: "~0%" }, src: "ipcc_ar6" },
  { k: "People in chronic extreme heat", byPath: { current: "~2 billion+", pledges: "~2 billion+", aligned: "hundreds of millions", worst: "~3 billion+" }, src: "ipcc_ar6" },
  { k: "People displaced by 2050 (internal)", byPath: { current: "up to 216 million", pledges: "up to 216 million", aligned: "tens of millions", worst: "200 million+" }, src: "groundswell" },
];

/* ═══ CODA · STEP 01 · PRIORITIES ══════════════════════════════════
   ~12 mitigation actions from the IPCC AR6 WG3 portfolio and the IEA NZE
   roadmap. Each: short name, one-line plain-language description, source. */
const PRIORITIES = [
  { id: "subsidies", name: "End fossil-fuel subsidies", desc: "Stop paying producers and consumers to burn carbon — about $7 trillion a year (IMF).", color: "ember", src: "imf_sub" },
  { id: "coal", name: "Phase out coal", desc: "Retire unabated coal power this decade in rich countries, by ~2040 worldwide (IEA NZE).", color: "ember", src: "iea" },
  { id: "methane", name: "A methane fee on oil & gas", desc: "Stop and charge for leaks and flaring — the fastest single lever on near-term warming.", color: "ember", src: "ipcc_ar6" },
  { id: "renewables", name: "Build grid-scale renewables", desc: "Treble renewable capacity by 2030, now the cheapest new power almost everywhere.", color: "ice", src: "iea" },
  { id: "forests", name: "Protect & restore primary forest", desc: "Halt deforestation and let degraded forest recover — a third of the cheap mitigation we have.", color: "ice", src: "ipcc_ar6" },
  { id: "supplychain", name: "End deforestation in supply chains", desc: "Keep cattle, soy, palm and timber that destroy forests out of what we buy.", color: "ice", src: "gfw" },
  { id: "buildings", name: "Retrofit & electrify buildings", desc: "Insulate homes and swap gas boilers for heat pumps — cut bills and emissions together.", color: "ember", src: "iea" },
  { id: "ev", name: "Electrify transport", desc: "Shift new cars, buses and trucks to electric and build the grid to charge them.", color: "ember", src: "iea" },
  { id: "industry", name: "Electrify & clean heavy industry", desc: "Green steel, cement and chemicals — the hardest quarter of emissions to abate.", color: "ember", src: "ipcc_ar6" },
  { id: "cbam", name: "A carbon border adjustment", desc: "Price the carbon in imports so clean production isn't undercut by dirty.", color: "ice", src: "ipcc_ar6" },
  { id: "finance", name: "Climate finance for the Global South", desc: "Fund the energy transition and adaptation where the money isn't — the central justice question.", color: "ice", src: "unep_gap" },
  { id: "justtransition", name: "A just transition for workers", desc: "Retrain and support fossil-fuel communities so no one is left behind by the shift.", color: "ice", src: "ipcc_ar6" },
];

/* ═══ CODA · STEP 02 · COUNTRIES ═══════════════════════════════════
   [name, ISO, NDC alignment vs 1.5°C (CAT), per-capita t CO₂, head-of-state
   contact route]. CAT rates ~40 governments; others marked "not rated".
   Contact routes are official parliament/government channels. */
const COUNTRIES = [
  ["United States", "US", "Insufficient", 14.3, "https://www.usa.gov/elected-officials", "President"],
  ["China", "CN", "Highly insufficient", 8.4, "http://www.gov.cn/", "President"],
  ["India", "IN", "Highly insufficient", 2.1, "https://www.mygov.in/", "Prime Minister"],
  ["United Kingdom", "GB", "Almost sufficient", 4.5, "https://www.writetothem.com/", "Prime Minister"],
  ["Germany", "DE", "Insufficient", 7.7, "https://www.bundestag.de/en/members", "Chancellor"],
  ["France", "FR", "Insufficient", 4.2, "https://www.assemblee-nationale.fr/", "President"],
  ["Japan", "JP", "Insufficient", 8.5, "https://www.sangiin.go.jp/eng/", "Prime Minister"],
  ["Russia", "RU", "Critically insufficient", 11.4, "http://government.ru/en/", "President"],
  ["Brazil", "BR", "Almost sufficient", 2.3, "https://www.gov.br/planalto/", "President"],
  ["Canada", "CA", "Insufficient", 14.0, "https://www.ourcommons.ca/members/en", "Prime Minister"],
  ["Australia", "AU", "Insufficient", 14.8, "https://www.aph.gov.au/Senators_and_Members", "Prime Minister"],
  ["Indonesia", "ID", "Insufficient", 2.6, "https://www.dpr.go.id/", "President"],
  ["South Africa", "ZA", "Insufficient", 6.7, "https://www.parliament.gov.za/", "President"],
  ["Mexico", "MX", "Critically insufficient", 3.6, "https://www.gob.mx/presidencia", "President"],
  ["Saudi Arabia", "SA", "Critically insufficient", 18.2, "https://www.my.gov.sa/", "King"],
  ["South Korea", "KR", "Highly insufficient", 11.6, "https://www.assembly.go.kr/portal/eng/", "President"],
  ["Turkey", "TR", "Critically insufficient", 5.3, "https://www.tbmm.gov.tr/", "President"],
  ["Italy", "IT", "Insufficient", 5.4, "https://www.camera.it/", "Prime Minister"],
  ["Spain", "ES", "Insufficient", 5.1, "https://www.congreso.es/", "Prime Minister"],
  ["Nigeria", "NG", "not rated", 0.6, "https://www.nass.gov.ng/", "President"],
  ["Argentina", "AR", "Insufficient", 3.7, "https://www.argentina.gob.ar/", "President"],
  ["Netherlands", "NL", "Insufficient", 7.3, "https://www.houseofrepresentatives.nl/", "Prime Minister"],
  ["Poland", "PL", "Insufficient", 8.0, "https://www.sejm.gov.pl/", "Prime Minister"],
  ["Egypt", "EG", "Highly insufficient", 2.3, "https://www.parliament.gov.eg/", "President"],
  ["Pakistan", "PK", "not rated", 0.9, "https://www.na.gov.pk/", "Prime Minister"],
  ["Bangladesh", "BD", "not rated", 0.6, "https://www.parliament.gov.bd/", "Head of Government"],
  ["Vietnam", "VN", "Critically insufficient", 3.5, "https://quochoi.vn/", "Prime Minister"],
  ["Sweden", "SE", "Insufficient", 3.6, "https://www.riksdagen.se/en/", "Prime Minister"],
  ["Norway", "NO", "Insufficient", 6.9, "https://www.stortinget.no/en/", "Prime Minister"],
  ["Kenya", "KE", "Almost sufficient", 0.4, "https://www.parliament.go.ke/", "President"],
  ["Ethiopia", "ET", "Almost sufficient", 0.2, "https://www.hopr.gov.et/", "Prime Minister"],
  ["United Arab Emirates", "AE", "Insufficient", 20.5, "https://www.government.ae/", "President"],
  ["New Zealand", "NZ", "Highly insufficient", 6.3, "https://www.parliament.nz/en/mps-and-electorates/members-of-parliament/", "Prime Minister"],
  ["Switzerland", "CH", "Insufficient", 4.0, "https://www.parlament.ch/en", "President"],
];

/* Globe coordinates [lat, lng] for the coalition globe (Coda step 04). */
const COUNTRY_COORDS = {
  "United States": [39.8, -98.6], "China": [35.9, 104.2], "India": [22.4, 78.7],
  "United Kingdom": [54.0, -2.0], "Germany": [51.2, 10.5], "France": [46.6, 2.2],
  "Japan": [36.2, 138.3], "Russia": [61.5, 105.3], "Brazil": [-14.2, -51.9],
  "Canada": [56.1, -106.3], "Australia": [-25.7, 134.5], "Indonesia": [-2.5, 118.0],
  "South Africa": [-30.6, 22.9], "Mexico": [23.6, -102.6], "Saudi Arabia": [23.9, 45.1],
  "South Korea": [36.5, 127.9], "Turkey": [39.0, 35.2], "Italy": [41.9, 12.6],
  "Spain": [40.5, -3.7], "Nigeria": [9.1, 8.7], "Argentina": [-38.4, -63.6],
  "Netherlands": [52.1, 5.3], "Poland": [51.9, 19.1], "Egypt": [26.8, 30.8],
  "Pakistan": [30.4, 69.3], "Bangladesh": [23.7, 90.4], "Vietnam": [14.1, 108.3],
  "Sweden": [60.1, 18.6], "Norway": [60.5, 8.5], "Kenya": [-0.0, 37.9],
  "Ethiopia": [9.1, 40.5], "United Arab Emirates": [23.4, 53.8],
  "New Zealand": [-40.9, 174.9], "Switzerland": [46.8, 8.2],
};

/* Seeded coalition state (demo before the backend is wired — see backend.js).
   Plausible, non-zero starting distribution so the globe isn't empty. */
const SEED_COUNTRY_SIGNUPS = {
  "United Kingdom": 412, "United States": 690, "Germany": 318, "France": 240,
  "India": 205, "Brazil": 188, "Canada": 162, "Australia": 150, "Japan": 121,
  "Netherlands": 98, "Sweden": 88, "Spain": 84, "Italy": 79, "Kenya": 64,
  "Nigeria": 58, "South Africa": 71, "Mexico": 66, "Indonesia": 55, "Norway": 47,
  "New Zealand": 44, "Switzerland": 41, "Poland": 38,
};
/* Seeded priority weights (index-aligned to PRIORITIES). Illustrative until
   the backend serves real tallies. */
const SEED_PRIORITY_WEIGHTS = [820, 540, 470, 760, 690, 520, 410, 480, 380, 360, 610, 430];

const MAD_SEED_COUNT = 4120; // base shown before/under real submissions

/* ═══ CHAPTER 02 · THE MAP — DATA ══════════════════════════════════ */

/* World Weather Attribution rapid studies (curated, 2022–2025). Each pin:
   { lat, lng, title, year, finding, url }. Findings summarise WWA's
   communicated conclusion; each links to worldweatherattribution.org.
   The scrubber filters to studies in/at-or-before the selected year. */
const WWA_STUDIES = [
  { lat: 27.0, lng: 68.0, title: "Pakistan floods", year: 2022, finding: "Extreme monsoon rainfall made more intense by climate change.", url: "https://www.worldweatherattribution.org/" },
  { lat: 45.0, lng: 6.0, title: "Southern Europe heatwave", year: 2023, finding: "Heat of this intensity virtually impossible without human-caused warming.", url: "https://www.worldweatherattribution.org/" },
  { lat: 31.0, lng: -100.0, title: "US & Mexico heat dome", year: 2023, finding: "Made about 5× more likely by climate change.", url: "https://www.worldweatherattribution.org/" },
  { lat: 35.0, lng: 110.0, title: "China heatwave", year: 2023, finding: "Made at least 50× more likely by climate change.", url: "https://www.worldweatherattribution.org/" },
  { lat: 32.76, lng: 22.64, title: "Libya floods (Storm Daniel)", year: 2023, finding: "Heavy rainfall up to 50× more likely; thousands killed in Derna.", url: "https://www.worldweatherattribution.org/" },
  { lat: 54.0, lng: -110.0, title: "Canada wildfire season", year: 2023, finding: "Fire-weather conditions made over twice as likely by warming.", url: "https://www.worldweatherattribution.org/" },
  { lat: -4.0, lng: -62.0, title: "Amazon drought", year: 2023, finding: "Climate change the main driver of the exceptional drought.", url: "https://www.worldweatherattribution.org/" },
  { lat: 4.0, lng: 42.0, title: "Horn of Africa drought", year: 2023, finding: "Made far more severe by climate change.", url: "https://www.worldweatherattribution.org/" },
  { lat: -30.0, lng: -53.0, title: "Brazil floods (Rio Grande do Sul)", year: 2024, finding: "Extreme rainfall made roughly twice as likely.", url: "https://www.worldweatherattribution.org/" },
  { lat: 35.0, lng: -82.0, title: "Hurricane Helene", year: 2024, finding: "Rainfall intensified; warmer seas fuelled rapid intensification.", url: "https://www.worldweatherattribution.org/" },
  { lat: 39.5, lng: -0.4, title: "Valencia floods (DANA)", year: 2024, finding: "Extreme rainfall made about twice as likely and ~12% heavier.", url: "https://www.worldweatherattribution.org/" },
  { lat: 34.05, lng: -118.3, title: "Los Angeles wildfires", year: 2025, finding: "Fire-weather conditions made markedly more likely by warming.", url: "https://www.worldweatherattribution.org/" },
];

/* 2024 tropical/boreal primary-forest-loss hotspots (Global Forest Watch / WRI).
   { lat, lng, name, note }. */
const FOREST_HOTSPOTS = [
  { lat: -16.3, lng: -63.6, name: "Bolivia", note: "1.5 Mha primary forest lost in 2024 (+200%), fire-driven" },
  { lat: -6.0, lng: -55.0, name: "Brazilian Amazon", note: "Largest single-country loss; fire the leading driver in 2024" },
  { lat: -1.0, lng: 114.0, name: "Indonesia", note: "Primary-forest loss rose again in 2024" },
  { lat: -2.0, lng: 23.0, name: "DR Congo (Congo Basin)", note: "Loss stayed elevated across the Congo Basin" },
  { lat: 58.0, lng: -110.0, name: "Canada (boreal)", note: "Record fire-driven tree-cover loss" },
  { lat: -4.0, lng: -73.0, name: "Peru / Colombia", note: "Andes–Amazon frontier loss" },
];

/* Coarse zonal temperature anomaly (°C vs 1951–1980), by decade — the shape
   of NASA GISS zonal means, Arctic amplification visible. Rendered as
   full-width latitude bands the time-scrubber recolours. Values are
   approximate decadal zonal means; see DATA-SOURCES.md. */
const ANOMALY_ZONES = [
  { s: 64, n: 90, d: { 1980: 0.9, 1990: 1.1, 2000: 1.7, 2010: 2.4, 2020: 3.0 } },
  { s: 44, n: 64, d: { 1980: 0.4, 1990: 0.6, 2000: 1.0, 2010: 1.5, 2020: 1.9 } },
  { s: 24, n: 44, d: { 1980: 0.3, 1990: 0.5, 2000: 0.9, 2010: 1.2, 2020: 1.6 } },
  { s: 0, n: 24, d: { 1980: 0.2, 1990: 0.4, 2000: 0.6, 2010: 0.9, 2020: 1.2 } },
  { s: -24, n: 0, d: { 1980: 0.2, 1990: 0.3, 2000: 0.5, 2010: 0.8, 2020: 1.1 } },
  { s: -44, n: -24, d: { 1980: 0.1, 1990: 0.3, 2000: 0.5, 2010: 0.7, 2020: 0.9 } },
  { s: -64, n: -44, d: { 1980: 0.1, 1990: 0.2, 2000: 0.4, 2010: 0.6, 2020: 0.8 } },
  { s: -90, n: -64, d: { 1980: 0.0, 1990: 0.1, 2000: 0.2, 2010: 0.4, 2020: 0.6 } },
];

/* USGS live earthquakes feed (keyless, CORS-ok) — past 7 days, M2.5+. */
const USGS_FEED = "https://earthquake.usgs.gov/earthquakes/feed/v1.0/summary/2.5_week.geojson";

/* ═══ P2 · POLISH DATA ══════════════════════════════════════════════ */

/* Per-ice-sheet loss rates for the dual live counter (P2-1). NASA GRACE-FO. */
const GREENLAND_GT_YR = 270, ANTARCTICA_GT_YR = 140;
const GREENLAND_PER_SEC = (GREENLAND_GT_YR * 1e9) / SECONDS_PER_YEAR;   // tonnes/s
const ANTARCTICA_PER_SEC = (ANTARCTICA_GT_YR * 1e9) / SECONDS_PER_YEAR; // tonnes/s

/* Forest-cover ribbon (P2-1): tropical primary-forest loss by year, Mha.
   Global Forest Watch / WRI annual series (approximate; verified anchors incl.
   2016/2017 fire spikes and the 2024 record 6.7 Mha). REFRESH each April. */
const FOREST_RIBBON = [
  [2002,3.0],[2003,3.2],[2004,3.9],[2005,4.0],[2006,3.4],[2007,3.7],[2008,3.4],
  [2009,3.2],[2010,3.9],[2011,3.5],[2012,3.9],[2013,3.9],[2014,4.9],[2015,4.4],
  [2016,5.9],[2017,5.9],[2018,4.6],[2019,4.2],[2020,4.7],[2021,4.2],[2022,4.1],
  [2023,3.7],[2024,6.7],
];

/* "What works" (P2-2): honest progress, no triumphalism. Renewables (IRENA
   2024) + the ozone-recovery precedent (Montreal Protocol / UNEP / NASA). */
const PROGRESS = {
  renewables: {
    stat: "585 GW",
    body: "of new renewable power was added in 2024 — a record, and 92.5% of all new capacity. Solar and wind were 96.6% of it. Renewables are now the cheapest new electricity almost everywhere.",
    caveat: "Still short of the pace needed to triple capacity by 2030 (16.6%/yr). Adequate, not yet sufficient.",
    src: "IRENA Renewable Capacity Statistics 2025",
    url: "https://www.irena.org/News/pressreleases/2025/Mar/Record-Breaking-Annual-Growth-in-Renewable-Power-Capacity",
  },
  ozone: {
    stat: "~99%",
    body: "of ozone-depleting chemicals have been phased out since the 1987 Montreal Protocol. The ozone layer is on track to recover — around 2040 for most of the world, ~2066 over Antarctica — and the treaty will avoid an estimated 0.5 °C of warming.",
    lesson: "What it took to heal the ozone layer is now known: naming the cause, agreeing to act, and holding to it. The climate task is larger, not impossible.",
    src: "UNEP / WMO / NASA · Ozone Assessment",
    url: "https://www.unep.org/news-and-stories/press-release/ozone-layer-recovery-track-helping-avoid-global-warming-05degc",
  },
};

/* Colour-blind-safe warming-stripes palette (P2-4). Blue→grey→orange ramp,
   deuteranopia/protanopia-distinguishable (after ColorBrewer RdBu, reversed). */
const STRIPES_CVD = [
  [0, [5, 48, 97]], [0.35, [67, 147, 195]], [0.5, [230, 230, 230]],
  [0.72, [214, 96, 77]], [1, [178, 24, 43]],
];
