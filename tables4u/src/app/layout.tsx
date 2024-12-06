import type { Metadata } from "next";
export const metadata: Metadata = {
  title: "tables4u",
  description: "A CS3733 project created by team Goku.",
};

import './globals.css';
import styles from './layout.module.css';

export default function Layout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <head>
        <link rel="icon" type="image/png" href="https://iteration1.s3.us-east-1.amazonaws.com/favicon.png"/>
        <title>Tables4U</title>
      </head>
      <body>
        <nav id={styles.nav}>
          <ul><li><a href="/"><strong>Tables4U</strong></a></li></ul>
          <ul>
            <li><a href="/create-restaurant">Create</a></li>
            <li><a href="/reserve">Reserve</a></li>
            <li><a href="/manage-restaurant">Manage</a></li>
          </ul>
          <ul><li><a href="/admin-dashboard">Admin Login</a></li></ul>
        </nav>
        <main id={styles.main}>{children}</main>
      </body>
    </html>
  );
}
