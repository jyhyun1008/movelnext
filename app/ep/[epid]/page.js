import Header from "@/components/Header";
import Player from "@/components/Player";
import Navbar from "@/components/Navbar";

export function generateStaticParams() {
    const episodes = process.env.NEXT_PUBLIC_PUBLICEPISODES.split(',')
    var array = []
    for( let ep of episodes ){
        array.push({ epid: ep })
    }
    return array
  }

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
