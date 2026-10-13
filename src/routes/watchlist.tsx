import { createFileRoute } from '@tanstack/react-router';
import { Watchlist } from '@/components/auction/browser';
export const Route=createFileRoute('/watchlist')({head:()=>({meta:[{"title": "Your watchlist \u2014 Bidwell"}, {"name": "description", "content": "Keep your favorite auction finds close."}, {"property": "og:title", "content": "Your watchlist \u2014 Bidwell"}, {"property": "og:description", "content": "Keep your favorite auction finds close."}, {"property": "og:type", "content": "website"}, {"name": "twitter:card", "content": "summary_large_image"}]}),component:Watchlist});
