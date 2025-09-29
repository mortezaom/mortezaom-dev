"use client";

import { ArrowRightIcon } from "@phosphor-icons/react/dist/ssr";
import { AnimatedShinyButton } from "./animated-shiny-button";
import { InteractiveHoverButton } from "./ui/interactive-hover-button";

export const ContactMeButton = () => {
	const openMailTo = () => {
		window.open("mailto:mortezaom@example.com", "_blank");
	};

	return (
		<InteractiveHoverButton onClick={() => openMailTo()}>
			CONTACT
		</InteractiveHoverButton>
	);
};

export const DownloadCVButton = () => {
	const openCVLink = () => {
		window.open("/MortezaOM_CV.pdf", "_blank");
	};

	return (
		<AnimatedShinyButton onClick={openCVLink}>
			<span className="font-bold text-sm">✨ Download CV</span>
			<ArrowRightIcon className="size-4 transition-transform group-hover:translate-x-0.5 duration-300 ease-in-out" />
		</AnimatedShinyButton>
	);
};
