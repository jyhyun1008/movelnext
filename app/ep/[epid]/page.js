import Header from "@/components/Header";
import Player from "@/components/Player";
import Navbar from "@/components/Navbar";

export const dynamic = 'force-dynamic';

export default async function Home({params}) {

  const epid = (await params).epid

  const feedWrapper = {
    height: 'calc(100dvh - 20px - 8rem)',
    overflow: 'auto',
    marginBottom: '4rem',
  }

  return (
    <>
      <Header />
      <div style={feedWrapper}>
        <Player epid={epid} />
      </div>
      <Navbar />
    </>
  );
}
