import { Inter } from "next/font/google";
import "./globals.css";
import { ThemeProvider } from "@/components/theme-provider";
import Header from "@/components/header";
import { ClerkProvider } from "@clerk/nextjs";
import { dark } from "@clerk/themes";


const inter = Inter({ subsets: ["latin"] });

export const metadata = {
  title: "Medicare - Doctors Appointment System",
  description: "Connect With Doctors and Book Appointments",
};

export default function RootLayout({ children }) {
  return (
    <ClerkProvider appearance={{baseTheme: "dark"}}>
      <html lang="en" suppressHydrationWarning>
        <body
          className={`${inter.className}`}
        >
          <ThemeProvider
            attribute="class"
            defaultTheme="system"
            enableSystem
            disableTransitionOnChange
          >
            {/*Header*/}
            <Header />
            <main className="min-h-screen">{children}</main>

            {/*Footer*/}
            <footer className="bg-gray-800 text-white p-4 text-center mx-auto">
              <p>&copy; {new Date().getFullYear()} Made with ❤️ By Siddharth Singh. </p>
            </footer>
          </ThemeProvider>
        </body>
      </html>
    </ClerkProvider>
  );
}
