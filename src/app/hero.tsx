"use client";

import { useEffect, useState } from "react";

interface ASCIIMobiusProps {
	speed?: number;
	charSize?: number;
}

function ASCIIMobius({ speed = 2000, charSize = 16 }: ASCIIMobiusProps) {
	const [time, setTime] = useState(0);

	const asciiChars = [".", ":", ";", "=", "+", "*", "#", "%", "@"];

	useEffect(() => {
		const interval = setInterval(() => {
			setTime((prev) => prev + 1);
		}, 100);

		return () => clearInterval(interval);
	}, []);

	const generateMobiusPoints = (numPoints: number) => {
		const points = [];

		for (let i = 0; i < numPoints; i++) {
			const t = (i / numPoints) * 4 * Math.PI;
			const u = t / 2;

			// Möbius strip parametric equations (flattened to 2D)
			const x = (1 + 0.3 * Math.cos(u)) * Math.cos(t);
			const y = (1 + 0.3 * Math.cos(u)) * Math.sin(t);

			// Convert to screen coordinates
			const screenX = x * 200 + 50; // Scale and center
			const screenY = y * 200 + 50;

			// Animate character selection
			const charIndex = Math.floor((Math.sin(t + time * 0.1) + 1) * 4.5);
			const char = asciiChars[charIndex % asciiChars.length];

			points.push({
				x: screenX,
				y: screenY,
				char,
				opacity: (Math.sin(t * 2 + time * 0.2) + 1) * 0.5,
				id: i,
			});
		}

		return points;
	};

	const points = generateMobiusPoints(150);

	return (
		<div
			className="absolute inset-0 overflow-hidden"
			style={{
				animation: `rotate ${speed}ms linear infinite`,
				transformOrigin: "center center",
			}}
		>
			{points.map((point) => (
				<div
					key={point.id}
					className="absolute font-mono font-bold text-white select-none"
					style={{
						left: `${point.x}%`,
						top: `${point.y}%`,
						fontSize: `${charSize}px`,
						opacity: point.opacity,
						transform: "translate(-50%, -50%)",
						textShadow: "0 0 10px rgba(255,255,255,0.5)",
						animation: `pulse ${1000 + (point.id % 500)}ms ease-in-out infinite alternate`,
					}}
				>
					{point.char}
				</div>
			))}

			<style jsx>{`
        @keyframes rotate {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }

        @keyframes pulse {
          from { opacity: 0.3; }
          to { opacity: 1; }
        }
      `}</style>
		</div>
	);
}

interface HeroProps {
	children?: React.ReactNode;
	className?: string;
	style?: React.CSSProperties;
}

export function Hero({ children, className, style }: HeroProps) {
	const containerStyle: React.CSSProperties = {
		position: "relative",
		height: "100vh",
		backgroundColor: "#000",
		overflow: "hidden",
		display: "flex",
		alignItems: "center",
		justifyContent: "center",
		...style,
	};

	return (
		<div className={className} style={containerStyle}>
			<ASCIIMobius />

			<div style={{ position: "relative", zIndex: 10, textAlign: "center" }}>
				{children || (
					<div>
						<h1 className="text-6xl font-bold text-white mb-4">
							Your Hero Title
						</h1>
						<p className="text-xl text-gray-300">Subtitle here</p>
					</div>
				)}
			</div>
		</div>
	);
}
