import Header from "@/components/Header";
import MarkedParser from "@/components/MarkedParser";
import Navbar from "@/components/Navbar";

export function generateStaticParams() {
    return [{menu: process.env.NEXT_PUBLIC_MENU1}, {menu: process.env.NEXT_PUBLIC_MENU2}, {menu: process.env.NEXT_PUBLIC_MENU3}, {menu: process.env.NEXT_PUBLIC_MENU4}]
  }

export default async function Home({params}) {

  const menu = (await params).menu

  const feedWrapper = {
    height: 'calc(100dvh - 20px - 8rem)',
    overflow: 'auto',
    marginBottom: '4rem',
  }

  const markdown = await fetch(`${process.env.NEXT_PUBLIC_REPO}/md/${menu}.md`)
  const mdraw = await markdown.text()

  const mdStyle = {
    padding: 10,
  }

  return (
    <>
      <Header />
      <div style={feedWrapper}>
        <div style={mdStyle}>
        <MarkedParser raw={mdraw} />
        </div>
      </div>
      <Navbar />
    </>
  );
}
