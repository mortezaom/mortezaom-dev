import type { Metadata } from "next";
import { ThemeProvider } from "@/components/theme-provider";
import "./globals.css";
import { cookies } from "next/headers";
import { NavBar } from "@/components/nav-bar";

export const metadata: Metadata = {
	title: "MortezaOM - Full-Stack Developer",
	description:
		"Welcome to my personal website! I'm MortezaOM, " +
		"a passionate Full-Stack Developer specializing in building scalable and user-friendly web applications. " +
		"Explore my portfolio, skills, and projects, and feel free to reach out for collaboration or inquiries.",

	icons: {
		icon: [
			{ url: "/favicon.ico" },
			{ url: "/logo.svg", type: "image/svg+xml" },
			{ url: "/icon-192.png", type: "image/png", sizes: "192x192" },
			{ url: "/icon-192-maskable.png", type: "image/png", sizes: "192x192" },
			{ url: "/icon-512.png", type: "image/png", sizes: "512x512" },
			{ url: "/icon-512-maskable.png", type: "image/png", sizes: "512x512" },
		],
		apple: [{ url: "/apple-touch-icon.png" }],
		shortcut: [{ url: "/favicon.ico" }],
	},
};

export default async function RootLayout({
	children,
}: Readonly<{
	children: React.ReactNode;
}>) {
	const cookieStore = await cookies();
	const theme = cookieStore.get("theme");
	const className = theme?.value && theme.value !== "system" ? theme.value : "";

	return (
		<html lang="en" className={className} style={{ colorScheme: className }}>
			<body className="flex flex-col items-center h-screen antialiased">
				<ThemeProvider
					attribute="class"
					defaultTheme={theme?.value || "system"}
					enableSystem
					disableTransitionOnChange
				>
					<NavBar className="px-6 container" />
					<main className="px-6 h-full container">{children}</main>
				</ThemeProvider>
			</body>
		</html>
	);
}
