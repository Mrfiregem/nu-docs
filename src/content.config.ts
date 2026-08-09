import { defineCollection } from 'astro:content';
import { docsLoader } from '@astrojs/starlight/loaders';
import { docsSchema } from '@astrojs/starlight/schema';

import { file } from 'astro/loaders';

import { execSync } from "node:child_process";
import { parse } from 'hjson';
import { z } from 'astro/zod';

export const collections = {
	docs: defineCollection({ loader: docsLoader(), schema: docsSchema() }),
	commands: defineCollection({
		loader: () => {
			const output = execSync(`./loader.nu commands`, {
				encoding: 'utf-8', cwd: 'src/data', maxBuffer: 1024 * 1024 * 4
			});
			const data = parse(output);
			return data;
		},
		schema: z.object({
			id: z.string(),
			name: z.string(),
			description: z.string(),
			extra_description: z.string(),
			search_terms: z.string(),
			category: z.string().default("default"),
			type: z.string(),
		}),
	})
};
