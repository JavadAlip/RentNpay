import "./globals.css";
import { Providers } from "./providers";

export const metadata = {
  title: "Rentpay Admin",
  description: "Rentnpay admin dashboard",
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body className="antialiased">
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
