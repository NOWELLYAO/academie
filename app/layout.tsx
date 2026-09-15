import type { Metadata, Viewport } from "next";
import "./globals.css";
import Sidebar from "@/components/Sidebar";
export const metadata:Metadata={title:"Académie — The Destiny Simulator",description:"Un jeu de simulation où chaque décision façonne des centaines de destins."};
export const viewport:Viewport={width:"device-width",initialScale:1,maximumScale:1,viewportFit:"cover",themeColor:"#0b1020"};
export default function RootLayout({children}:{children:React.ReactNode}){return <html lang="fr"><head><link rel="preconnect" href="https://fonts.googleapis.com"/><link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous"/><link href="https://fonts.googleapis.com/css2?family=Fraunces:wght@400;500;600;700&family=IBM+Plex+Sans:wght@400;500;600;700&display=swap" rel="stylesheet"/></head><body className="antialiased"><div className="md:flex md:min-h-screen"><Sidebar/><main className="flex-1 min-w-0">{children}</main></div></body></html>}
