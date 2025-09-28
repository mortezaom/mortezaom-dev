export default function Logo({ size = 200, className }: { size?: number, className?: string }) {
	return (
		<svg viewBox="0 0 200 200" height={size} width={size} aria-label="M" className={className}>
			<title>M</title>
			<defs></defs>
			<g transform="matrix(12.5,0,0,12.5,25,-70)">
				<path fill="transparent" stroke="currentColor" d="M4.86 11.54 l-2.08 -1.22 l0 9.68 l-2.08 0 l0 0 l0 -10.88 l0 -2.1 l0 0 l4.16 2.42 l0 2.1 z M6.96 11.54 l0 -2.1 l4.18 -2.42 l0 2.1 l0 0 l0 10.88 l-2.08 0 l0 0 l0 -9.68 z M6.96 11.54 l0 8.46 l-2.1 0 l0 0 l0 -8.46 l2.1 0 z"></path>
			</g>
		</svg>
	);
}
