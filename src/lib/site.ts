// One place for every public fact about the store. Pages, schema, legal text and the checkout read
// from here, so the price can never disagree with itself.
export const SITE = {
  url: "https://buildwithabu.xyz",
  mediaUrl: "https://media.buildwithabu.xyz",
  product: "Abu Reel Kit",
  brand: "Abu Reel Kit",
  seller: "Abu Bakkar Siddique",
  sellerCountry: "India",
  email: "hello@buildwithabu.xyz",
  portalUrl: "https://customer.dodopayments.com/login/bus_0NlpNOOrohD859RHnLSqD",
  instagram: "https://www.instagram.com/buildwithashraful",
  instagramHandle: "@buildwithashraful",
  x: "https://x.com/AbuBakkar2502",
  xHandle: "@AbuBakkar2502",
  price: 16,
  currency: "USD",
  priceLabel: "$16",
  // Paste the codes from Search Console and Bing Webmaster Tools here if you verify with a meta tag.
  // A DNS record or Search Console import needs neither.
  googleVerification: "",
  bingVerification: "",
  // Public by design: IndexNow checks it at /<key>.txt.
  indexNowKey: "2dba04ed1fa1aa47c818ef281ab62195",
  description:
    "Abu Reel Kit is a folder you open in your AI coding agent. Type one line and it researches, scripts, voices, captions, builds and renders a finished vertical reel.",
} as const

/** Bump a date when the matching legal page changes. Stored with each buyer's consent. */
export const POLICY = {
  terms: "2026-11-07",
  refund: "2026-11-07",
  license: "2026-11-07",
  privacy: "2026-11-07",
  cookies: "2026-11-07",
} as const

export const REFUND_WINDOW_DAYS = 7

export const NAV = [
  { href: "/how-it-works", label: "How it works" },
  { href: "/reels", label: "Reels" },
  { href: "/guides", label: "Guides" },
  { href: "/faq", label: "FAQ" },
] as const
