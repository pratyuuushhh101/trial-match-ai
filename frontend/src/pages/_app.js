import '@/styles/globals.css';
import Head from 'next/head';

/**
 * _app.js — Next.js custom app wrapper.
 * Loads global CSS (Tailwind + Inter font).
 * Sets default meta tags for SEO.
 */
export default function App({ Component, pageProps }) {
    return (
        <>
            <Head>
                <meta charSet="utf-8" />
                <meta name="viewport" content="width=device-width, initial-scale=1" />
                <meta name="description" content="Trially — Clinical trial eligibility reasoning agent. Criterion-by-criterion assessment powered by multi-agent AI." />
                <meta name="theme-color" content="#1E3A5F" />
                <link rel="icon" href="/logo.svg" type="image/svg+xml" />
                <title>Trially</title>
            </Head>
            <Component {...pageProps} />
        </>
    );
}
