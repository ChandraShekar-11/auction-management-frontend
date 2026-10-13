import { createFileRoute } from '@tanstack/react-router';
import { MyBids } from '@/components/auction/browser';
export const Route=createFileRoute('/my-bids')({head:()=>({meta:[{"title": "My bids \u2014 Bidwell"}, {"name": "description", "content": "Track your bidding activity and auction results."}, {"property": "og:title", "content": "My bids \u2014 Bidwell"}, {"property": "og:description", "content": "Track your bidding activity and auction results."}, {"property": "og:type", "content": "website"}, {"name": "twitter:card", "content": "summary_large_image"}]}),component:MyBids});
