import type { Metadata, Viewport } from "next";

export const metadata: Metadata = {
  manifest: "/manifest.webmanifest",
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "BGLRR",
  },
};

export const viewport: Viewport = {
  themeColor: "#254a91",
};

export default function ResidentLayout({
  children,
}: LayoutProps<"/resident">) {
  return children;
}
