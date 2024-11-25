import type { Metadata } from "next";
export const metadata: Metadata = {
  title: "tables4u",
  description: "A CS3733 project created by team Goku.",
};

export default function Layout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body>
        <nav>
          <ul><li><a href="/">tables4u</a></li></ul>
          <ul>
            <li><a href="/create-restaurant">Create</a></li>
            <li><a href="/reserve">Reserve</a></li>
            <li><a href="/manage-restaurant">Manage</a></li>
          </ul>
          <ul><li><a href="/admin-dashboard">Admin Login</a></li></ul>
        </nav>
        <main>{children}</main>
      </body>
    </html>
  );
}
