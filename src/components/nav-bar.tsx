import { ChartNoAxesColumn } from "lucide-react";
import Link from "next/link";
import { cn } from "@/lib/utils";
import Logo from "./logo";
import { Button } from "./ui/button";

export const NavBar = async ({ className }: { className?: string }) => {
	return (
		<nav className={cn("w-full mb-4 flex items-center justify-between py-8", className)}>
			<Link href="/" className="text-2xl font-semibold flex items-end">
				<Logo size={34} className="text-primary" />
				<h1 className="hide-first-letter -ml-0.5">MortezaOM</h1>
			</Link>

			<Button variant="ghost" size="icon" className="size-10 cursor-pointer">
				<ChartNoAxesColumn className="rotate-270 size-6" />
			</Button>
		</nav>
	);
};
