import type { Metadata } from "next";
// import "../globals.css"; // 如果你没有css文件，这行先注释掉，防止报错

export const metadata: Metadata = {
  title: "File Transfer App",
  description: "P2P File Transfer",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
