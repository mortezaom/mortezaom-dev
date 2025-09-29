import type { ButtonHTMLAttributes } from "react";
import { cn } from "@/lib/utils";
import { AnimatedShinyText } from "./ui/animated-shiny-text";

type AnimatedShinyButtonProps = ButtonHTMLAttributes<HTMLButtonElement>;

export function AnimatedShinyButton({
	children,
	className,
	...props
}: AnimatedShinyButtonProps) {
	return (
		<button
			type="button"
			className={cn(
				"group inline-flex items-center bg-neutral-100 hover:bg-neutral-200 dark:bg-neutral-900 dark:hover:bg-neutral-800 px-4 py-2 border dark:border-white/5 border-black/5 rounded-full text-white text-base transition-all ease-in hover:cursor-pointer",
				className,
			)}
			{...props}
		>
			<AnimatedShinyText className="inline-flex justify-center items-center gap-2 hover:dark:text-neutral-400 hover:text-neutral-600 transition hover:duration-300 ease-out">
				{children}
			</AnimatedShinyText>
		</button>
	);
}
