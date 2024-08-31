import { Inter } from "next/font/google";
import "./globals.css";

const inter = Inter({ subsets: ["latin"] });

export const metadata = {
  title: "RAGGDRIVE",
  description: "A RAG Implementation on Gdrive",
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body className={inter.className}>
        <div className=" h-screen flex items-center w-full">
        {children}

        </div>
      </body>
    </html>
  );
}
