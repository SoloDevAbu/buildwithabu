// JSON-LD. Every value is something a visitor can also read on the page. No ratings or review
// markup until real reviews exist.
import { REFUND_WINDOW_DAYS, SITE } from "@/lib/site"

const ID = {
  org: `${SITE.url}/#organization`,
  person: `${SITE.url}/#person`,
  site: `${SITE.url}/#website`,
  product: `${SITE.url}/#product`,
}

/** `<` is escaped so a stray closing tag in content can never end the script block. */
export const serializeJsonLd = (nodes: object[]) =>
  JSON.stringify({ "@context": "https://schema.org", "@graph": nodes }).replace(/</g, "\\u003c")

export const person = {
  "@type": "Person",
  "@id": ID.person,
  name: SITE.seller,
  alternateName: "Abu",
  url: `${SITE.url}/about`,
  sameAs: [SITE.instagram, SITE.x],
}

export const organization = {
  "@type": "Organization",
  "@id": ID.org,
  name: SITE.brand,
  url: SITE.url,
  logo: `${SITE.url}/logo.png`,
  email: SITE.email,
  founder: { "@id": ID.person },
  sameAs: [SITE.instagram, SITE.x],
  contactPoint: { "@type": "ContactPoint", contactType: "customer support", email: SITE.email },
}

export const website = {
  "@type": "WebSite",
  "@id": ID.site,
  url: SITE.url,
  name: SITE.brand,
  publisher: { "@id": ID.org },
  inLanguage: "en",
}

export const product = {
  "@type": ["Product", "SoftwareApplication"],
  "@id": ID.product,
  name: SITE.product,
  description: SITE.description,
  url: `${SITE.url}/pricing`,
  image: `${SITE.url}/og/default.png`,
  brand: { "@type": "Brand", name: SITE.brand },
  category: "Video production software",
  applicationCategory: "MultimediaApplication",
  operatingSystem: "Windows, macOS, Linux",
  softwareRequirements: "An AI coding agent, Node.js 18+, ffmpeg, Python 3.10 to 3.14",
  offers: {
    "@type": "Offer",
    url: `${SITE.url}/pricing`,
    price: SITE.price.toFixed(2),
    priceCurrency: SITE.currency,
    priceSpecification: { "@type": "UnitPriceSpecification", price: SITE.price.toFixed(2), priceCurrency: SITE.currency, valueAddedTaxIncluded: true },
    availability: "https://schema.org/InStock",
    seller: { "@id": ID.org },
    hasMerchantReturnPolicy: {
      "@type": "MerchantReturnPolicy",
      url: `${SITE.url}/legal/refunds`,
      applicableCountry: "US",
      returnPolicyCategory: "https://schema.org/MerchantReturnNotPermitted",
    },
  },
}

export const breadcrumbs = (items: { name: string; path: string }[]) => ({
  "@type": "BreadcrumbList",
  itemListElement: [{ name: "Home", path: "" }, ...items].map((item, i) => ({
    "@type": "ListItem",
    position: i + 1,
    name: item.name,
    item: `${SITE.url}${item.path}`,
  })),
})

export const faqPage = (faq: { q: string; a: string }[]) => ({
  "@type": "FAQPage",
  mainEntity: faq.map(({ q, a }) => ({
    "@type": "Question",
    name: q,
    acceptedAnswer: { "@type": "Answer", text: a },
  })),
})

export const article = (a: { title: string; description: string; path: string; date: string; updated?: string }) => ({
  "@type": "Article",
  headline: a.title,
  description: a.description,
  url: `${SITE.url}${a.path}`,
  mainEntityOfPage: `${SITE.url}${a.path}`,
  datePublished: a.date,
  dateModified: a.updated ?? a.date,
  author: { "@id": ID.person },
  publisher: { "@id": ID.org },
  image: `${SITE.url}/og/default.png`,
})

export const videoObject = (v: {
  title: string
  description: string
  poster: string
  url: string
  page: string
  duration: number
  date: string
  width?: number
  height?: number
  transcript?: string | null
}) => ({
  "@type": "VideoObject",
  name: v.title,
  description: v.description,
  thumbnailUrl: [v.poster],
  contentUrl: v.url,
  embedUrl: `${SITE.url}${v.page}`,
  encodingFormat: "video/mp4",
  ...(v.width ? { width: v.width } : {}),
  ...(v.height ? { height: v.height } : {}),
  uploadDate: v.date,
  duration: `PT${Math.round(v.duration)}S`,
  ...(v.transcript ? { transcript: v.transcript } : {}),
  publisher: { "@id": ID.org },
})

export const REFUND_NOTE = `No refunds, except duplicate payments reported within ${REFUND_WINDOW_DAYS} days.`
