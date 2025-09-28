import { ThemeProvider as NextThemesProvider } from "next-themes";
import type * as React from "react";

export async function ThemeProvider({
	children,
	defaultTheme,
	...props
}: React.ComponentProps<typeof NextThemesProvider>) {
	return (
		<NextThemesProvider {...props}>
			{children}
		</NextThemesProvider>
	);
}
