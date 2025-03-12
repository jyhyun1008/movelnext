import Link from "next/link"

function Navbar() {

    function mobileVisible() {
        setMenu('mobilevisible')
        setHam('mobilenotvisible')
        setX('mobilevisible')
    }
    function mobileNotVisible() {
        setMenu('mobilenotvisible')
        setX('mobilenotvisible')
        setHam('mobilevisible')
    }

    const navbarWrapper = {
        width: '100%',
        position: 'fixed',
        left: 0,
        bottom: 10,
        zIndex: 999,
    }

    const navbar = {
        width: 'calc(100% - 20px)',
        maxWidth: '540px',
        margin: '0 auto',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-around',
        height: '4rem',
        borderRadius: '0 0 30px 30px',
        background: `var(--white)`,
        borderTop: `1px solid #${process.env.NEXT_PUBLIC_THEME}`,
    }

    const navIcon = {
        height: '100%',
        aspectRatio: 1,
        display: 'flex',
        fontSize: '2.2rem',
        justifyContent: 'center',
        alignItems: 'center',
        color: `#${process.env.NEXT_PUBLIC_THEME}`,
    }

    const navHomeIcon = {
        position: 'relative',
        borderRadius: '50%',
        zIndex: 9999,
        width: '80px',
        aspectRatio: 1,
        display: 'flex',
        fontSize: '2.8rem',
        background: `#${process.env.NEXT_PUBLIC_THEME}`,
        justifyContent: 'center',
        alignItems: 'center',
        color: 'white',
    }

    return (
    <div style={navbarWrapper}>
        <div id="navbar" style={navbar}>
            <Link style={navIcon} className="hovericon"  href={`/${process.env.NEXT_PUBLIC_MENU1}`} ><i className={`las la-${process.env.NEXT_PUBLIC_ICON1}`}></i></Link>
            <Link style={navIcon} className="hovericon"  href={`/${process.env.NEXT_PUBLIC_MENU2}`} ><i className={`las la-${process.env.NEXT_PUBLIC_ICON2}`}></i></Link>
            <Link  href="/" style={navHomeIcon}><i className={`las la-home`}></i></Link>
            <Link style={navIcon} className="hovericon" href={`/${process.env.NEXT_PUBLIC_MENU3}`} ><i className={`las la-${process.env.NEXT_PUBLIC_ICON3}`}></i></Link>
            <Link style={navIcon} className="hovericon" href={`/${process.env.NEXT_PUBLIC_MENU4}`} ><i className={`las la-${process.env.NEXT_PUBLIC_ICON4}`}></i></Link>
        </div>
    </div>
  )
}
  
  export default Navbar
  