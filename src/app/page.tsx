import {
	GithubLogoIcon,
	TelegramLogoIcon,
	XLogoIcon,
} from "@phosphor-icons/react/ssr";
import Image from "next/image";
import {
	ContactMeButton,
	DownloadCVButton,
} from "@/components/home-page-buttons";
import { Button } from "@/components/ui/button";

export default function Home() {
	return (
		<div className="flex flex-col justify-center items-center w-full h-full text-center">
			<section className="gap-20 sm:gap-8 grid grid-cols-1 md:grid-cols-[2fr_1fr] mb-12">
				<div className="flex flex-col items-start gap-4 text-start">
					<h1 className="font-medium text-4xl xl:text-6xl">
						Hi, <br />
						I'm{" "}
						<span className="font-extrabold text-primary uppercase">
							MortezaOM
						</span>
					</h1>
					<p className="sm:my-3 font-semibold text-muted-foreground text-xl tracking-tight">
						Full-Stack Developer
					</p>

					<ContactMeButton />
				</div>
				<div className="relative flex flex-col items-start gap-4 sm:gap-8 w-full text-start">
					<h3 className="font-bold text-primary text-sm sm:text-base md:text-lg">
						Expertise
					</h3>
					<h2 className="font-semibold text-xl sm:text-2xl md:text-3xl">
						Building scalable, user-friendly web applications with modern
						JavaScript and TypeScript.
					</h2>
					<p className="text-muted-foreground text-sm sm:text-base md:text-lg">
						I design and implement end-to-end solutions using React, Next.js,
						Node.js, and cloud services — focusing on performance,
						accessibility, and maintainable code.
					</p>

					<DownloadCVButton />

					<div className="-top-40 -z-1 absolute opacity-70 w-full h-full">
						<div className="top-0 right-16 -z-1 absolute bg-primary/10 border border-primary/20 rounded-full w-32 h-32 animate-spin-slow" />
						<div className="-top-8 right-8 -z-1 absolute bg-primary/10 border border-primary/20 rounded-full w-24 h-24 animate-spin-slow" />
					</div>
				</div>
			</section>
			<div className="right-0 bottom-12 left-0 absolute flex mx-auto p-4 w-full">
				<div className="flex md:flex-col justify-end items-start gap-3 mx-auto container">
					<Button
						variant="ghost"
						className="rounded-full size-11 cursor-pointer"
						asChild
					>
						<a
							href="https://github.com/mortezaom"
							target="_blank"
							rel="noopener"
							aria-label="GitHub profile"
						>
							<GithubLogoIcon className="size-6" />
						</a>
					</Button>
					<Button
						variant="ghost"
						className="rounded-full size-11 cursor-pointer"
						asChild
					>
						<a
							href="https://t.me/mortezaaom"
							target="_blank"
							rel="noopener"
							aria-label="Telegram profile"
						>
							<TelegramLogoIcon className="size-6" />
						</a>
					</Button>
					<Button
						variant="ghost"
						className="rounded-full size-11 cursor-pointer"
						asChild
					>
						<a
							href="https://x.com/mortezaaom"
							target="_blank"
							rel="noopener"
							aria-label="X profile"
						>
							<XLogoIcon className="size-6" />
						</a>
					</Button>
				</div>
			</div>
			<div className="top-1/2 -right-1/2 sm:left-1/2 -z-1 absolute w-[320px] sm:w-[420px] md:w-[560px] lg:w-[620px] xl:w-[680px] h-[320px] sm:h-[420px] md:h-[560px] lg:h-[620px] xl:h-[680px] -translate-x-1/2 -translate-y-1/2 transform">
				<Image
					src="/images/hero-image.webp"
					alt=""
					fill
					sizes="(min-width: 1280px) 680px, (min-width: 1024px) 620px, (min-width: 768px) 560px, 90vw"
					className="object-cover mask-[linear-gradient(to_top,transparent_0%,black_100%)]"
				/>
			</div>
		</div>
	);
}
