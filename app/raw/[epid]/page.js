import Header from "@/components/Header";
import EpParser from "@/components/EpParser";
import Navbar from "@/components/Navbar";
import Link from "next/link";
export const dynamic = 'force-dynamic';

export default async function Home({params}) {

  const epid = (await params).epid

  const feedWrapper = {
    height: 'calc(100dvh - 20px - 8rem)',
    overflow: 'auto',
    marginBottom: '4rem',
  }

  const markdown = await fetch(`${process.env.NEXT_PUBLIC_REPO}/ep/${epid}.md`)
  const mdraw = await markdown.text()

  const mdStyle = {
    padding: 10,
  }

  return (
    <>
      <Header />
      <div style={feedWrapper}>
        <div style={mdStyle}>
        <Link href={`/ep/${epid}`}>플레이어 보기</Link>
        <EpParser raw={`# ${epid}\n${mdraw}`} />
        </div>
      </div>
      <Navbar />
    </>
  );
}
