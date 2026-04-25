import { Helmet } from 'react-helmet-async';
import { useLocation } from 'react-router-dom';

interface SEOProps {
    title: string;
    description: string;
    type?: string;
    image?: string;
    url?: string;
    jsonLd?: Record<string, unknown>;
}

const SITE_URL = 'https://chestnayapodpiska.vercel.app';

export function SEO({
    title,
    description,
    type = 'website',
    image = `${SITE_URL}/logo.webp`,
    url,
    jsonLd,
}: SEOProps) {
    const { pathname } = useLocation();
    const canonicalUrl = url ?? `${SITE_URL}${pathname}`;

    return (
        <Helmet>
            {/* Basic HTML Meta Tags */}
            <title>{title}</title>
            <meta name="description" content={description} />
            <link rel="canonical" href={canonicalUrl} />

            {/* Open Graph / Facebook / VK */}
            <meta property="og:type" content={type} />
            <meta property="og:title" content={title} />
            <meta property="og:description" content={description} />
            <meta property="og:image" content={image} />
            <meta property="og:url" content={canonicalUrl} />
            <meta property="og:locale" content="ru_RU" />
            <meta property="og:site_name" content="Честная Подписка" />

            {/* Twitter */}
            <meta name="twitter:card" content="summary_large_image" />
            <meta name="twitter:title" content={title} />
            <meta name="twitter:description" content={description} />
            <meta name="twitter:image" content={image} />

            {/* Structured Data (JSON-LD) */}
            {jsonLd && (
                <script type="application/ld+json">
                    {JSON.stringify(jsonLd)}
                </script>
            )}
        </Helmet>
    );
}

