import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
	title: "Recruitment Application",
	description: "Here you can apply for a job at the amusement park.",
};

export default function RootLayout({
	children,
}: Readonly<{
	children: React.ReactNode;
}>) {
	return (
		<html lang="en">
			<body>{children}</body>
		</html>
	);
}
