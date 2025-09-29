// import { ChartNoAxesColumn } from "lucide-react";
import Link from "next/link";
import { cn } from "@/lib/utils";
import Logo from "./logo";
import { Button } from "./ui/button";

export const NavBar = async ({ className }: { className?: string }) => {
	return (
		<nav className={cn("flex justify-between items-center mb-4 w-full h-20", className)}>
			<Link href="/" className="flex items-end font-semibold text-2xl">
				<Logo size={34} className="text-primary" />
				<h1 className="-ml-0.5 hide-first-letter">MortezaOM</h1>
			</Link>

			<Button variant="ghost" size="icon" className="size-10 cursor-pointer">
				{/* Implement List Items First */}
				{/* <ChartNoAxesColumn className="size-6 rotate-270" /> */}
			</Button>
		</nav>
	);
};
