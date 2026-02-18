import "./globals.css";

import Link from "next/link";



export const metadata = {

  title: "NeuroWeave",

  description: "Interactive Transformer Visualizer",

};



export default function RootLayout({

  children,

}: {

  children: React.ReactNode;

}) {

  return (

    <html lang="en">

      <body className="bg-black text-white min-h-screen">

        <nav className="flex gap-6 px-8 py-4 border-b border-gray-800 text-sm">

          <Link href="/">Home</Link>

          <Link href="/tokenizer">Tokenizer</Link>

          <Link href="/attention">Attention</Link>

          <Link href="/context">Context</Link>

          <Link href="/encoder-decoder">Encoder–Decoder</Link>

          <Link href="/parallelism">Parallelism</Link>

        </nav>



        <main className="px-8 py-10">

          {children}

        </main>

      </body>

    </html>

  );

}

