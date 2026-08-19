import { founderGitHubUrl, founderLinkedInUrl, siteContentUpdatedIso, siteUrl } from "@/lib/site";

type ArticleStructuredDataProps = {
  headline: string;
  description: string;
  path: string;
  about: string[];
};

export function ArticleStructuredData({ headline, description, path, about }: ArticleStructuredDataProps) {
  const url = `${siteUrl}${path}`;
  const structuredData = {
    "@context": "https://schema.org",
    "@type": "Article",
    headline,
    description,
    url,
    mainEntityOfPage: { "@type": "WebPage", "@id": url },
    dateModified: siteContentUpdatedIso,
    author: {
      "@type": "Person",
      name: "Ozichi Nwosu",
      url: `${siteUrl}/about`,
      sameAs: [founderLinkedInUrl, founderGitHubUrl],
    },
    publisher: {
      "@type": "Organization",
      name: "SalarySabi",
      url: siteUrl,
      logo: { "@type": "ImageObject", url: `${siteUrl}/favicon.svg` },
    },
    about,
    inLanguage: "en-NG",
  };

  return <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(structuredData) }} />;
}
