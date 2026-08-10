// @ts-check
import { defineConfig } from 'astro/config';
import starlight from '@astrojs/starlight';

// https://astro.build/config
export default defineConfig({
	site: 'https://MrFiregem.github.io',
	base: '/nu-docs',
	integrations: [
		starlight({
			title: 'Unofficial Nushell Documentation',
			social: [
				{ icon: 'github', label: 'Source Code', href: 'https://github.com/Mrfiregem/nu-docs' },
			],
			sidebar: [
				{
					label: 'Guides',
					items: [
						// Each item here is one entry in the navigation menu.
						{ label: 'Getting Started', slug: 'guides/getting-started' },
					],
				},
				{
					label: 'Reference',
					items: [{ autogenerate: { directory: 'reference' } }],
				},
				{
					label: 'Commands',
					link: 'commands'
				},
			],
			editLink: { baseUrl: 'https://github.com/Mrfiregem/nu-docs/edit/main/' },
			customCss: ['./src/styles/add-containers.css'],
			favicon: '/favicon.png',
		}),
	],
});
