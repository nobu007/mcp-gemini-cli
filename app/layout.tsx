import "./globals.css";

export const metadata = {
  title: "MCP Gemini CLI Web Interface",
  description: "Web interface for MCP Gemini CLI server",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className="min-h-screen bg-gray-50 dark:bg-gray-900 text-gray-900 dark:text-gray-100 transition-colors">
        {children}
      </body>
    </html>
  );
}
