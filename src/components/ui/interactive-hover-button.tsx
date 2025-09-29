"use client"

import { ArrowRight } from "lucide-react";
import React from "react";

import { cn } from "@/lib/utils";

interface InteractiveHoverButtonProps
	extends React.ButtonHTMLAttributes<HTMLButtonElement> {}

export const InteractiveHoverButton = React.forwardRef<
	HTMLButtonElement,
	InteractiveHoverButtonProps
>(({ children, className, ...props }, ref) => {
	return (
		<button
			ref={ref}
			className={cn(
				"group relative bg-background p-2 px-6 border rounded-full w-auto overflow-hidden font-semibold text-center cursor-pointer",
				className,
			)}
			{...props}
		>
			<div className="flex items-center gap-2">
				<div className="bg-primary rounded-full w-2 h-2 group-hover:scale-[100.8] transition-all duration-300"></div>
				<span className="inline-block group-hover:opacity-0 transition-all group-hover:translate-x-12 duration-300">
					{children}
				</span>
			</div>
			<div className="top-0 z-10 absolute flex justify-center items-center gap-2 opacity-0 group-hover:opacity-100 w-full h-full text-primary-foreground transition-all translate-x-12 group-hover:-translate-x-5 duration-300">
				<span>{children}</span>
				<ArrowRight />
			</div>
		</button>
	);
});

InteractiveHoverButton.displayName = "InteractiveHoverButton";
