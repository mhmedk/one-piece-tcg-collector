import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "My Collection",
  description: "View and manage your One Piece TCG card collection",
  openGraph: {
    title: "My Collection",
    description: "View and manage your One Piece TCG card collection",
  },
  twitter: {
    title: "My Collection",
    description: "View and manage your One Piece TCG card collection",
  },
};

export default function CollectionLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
