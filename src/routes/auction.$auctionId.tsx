import { createFileRoute } from '@tanstack/react-router';
import { AuctionDetail } from '@/components/auction/workspaces';
export const Route=createFileRoute('/auction/$auctionId')({head:()=>({meta:[{title:'Auction details — Bidwell'},{name:'description',content:'Discover the details and place a demo bid on a unique Bidwell auction.'},{property:'og:title',content:'Auction details — Bidwell'},{property:'og:description',content:'Explore a special find and join the bidding.'},{property:'og:type',content:'website'},{name:'twitter:card',content:'summary_large_image'}]}),component:Detail});
function Detail(){const {auctionId}=Route.useParams();return <AuctionDetail id={auctionId}/>;}
