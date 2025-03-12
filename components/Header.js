"use client"

import Link from "next/link"

function Header() {

    const headerWrapper = {
        width: '100%',
        height: '4rem',
        position: 'relative',
        zIndex: '10',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: `#${process.env.NEXT_PUBLIC_THEME}`,
        fontSize: '1.7rem',
        color: 'white',
    }

    const logoImg = {
        height: '3rem',
    }

    return (
    <div style={headerWrapper}>
        <div>
            {process.env.NEXT_PUBLIC_LOGO
            ?<Link href="/">{process.env.NEXT_PUBLIC_LOGO}</Link>
            :<Link href="/"><img src="/vercel.svg" style={logoImg} /></Link>}
        </div>
    </div>
  )
}
  
  export default Header
  