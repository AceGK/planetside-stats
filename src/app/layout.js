import localFont from "next/font/local";
import "./styles/globals.scss";
import PasswordProtect from "../components/PasswordProtect";
import ThemeProvider from "../components/ThemeProvider"; // Import the new ThemeProvider

const geistSans = localFont({
  src: "./fonts/GeistVF.woff",
  variable: "--font-geist-sans",
  weight: "100 900",
});
const geistMono = localFont({
  src: "./fonts/GeistMonoVF.woff",
  variable: "--font-geist-mono",
  weight: "100 900",
});

export const metadata = {
  title: "Planetside 2 Stats",
  description: "View players stats for Planetside 2",
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body className={`${geistSans.variable} ${geistMono.variable}`}>
        <ThemeProvider>
          <PasswordProtect>{children}</PasswordProtect>
        </ThemeProvider>
      </body>
    </html>
  );
}
