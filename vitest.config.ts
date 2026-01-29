import { defineConfig } from "vitest/config";

export default defineConfig({
	test: {
		include: ["tests/units/**/*.test.ts"],
		environment: "node",
		coverage: {
			enabled: false,
		},
	},
});
