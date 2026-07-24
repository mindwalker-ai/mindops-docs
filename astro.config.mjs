// @ts-check
import { defineConfig } from 'astro/config';
import starlight from '@astrojs/starlight';

// https://astro.build/config
export default defineConfig({
	site: 'https://mindwalker-ai.github.io',
	base: '/mindops-docs',
	outDir: './docs',
	integrations: [
		starlight({
			title: 'MindOps Docs',
			description:
				'MindOps is an open observability platform that unifies traces, metrics, and logs in a single pane of glass, built on OpenTelemetry.',
			logo: {
				src: './src/assets/mindops-logo.png',
				alt: 'MindOps',
				replacesTitle: true,
			},
			favicon: '/favicon.png',
			tableOfContents: { minHeadingLevel: 2, maxHeadingLevel: 3 },
			customCss: ['./src/styles/theme.css'],
			components: { Footer: './src/components/Footer.astro' },
			social: [
				{ icon: 'github', label: 'GitHub', href: 'https://github.com/mindops/mindops' },
			],
			sidebar: [
				{ label: 'Introduction', slug: 'introduction' },
				{ label: 'Get Started', items: [{ autogenerate: { directory: 'get-started' } }] },
				{ label: 'Overview', items: [{ autogenerate: { directory: 'overview' } }] },
				{ label: 'Setup & Install', items: [{ autogenerate: { directory: 'install' } }] },
				{ label: 'Manage', items: [{ autogenerate: { directory: 'manage' } }] },
				{ label: 'Identity & Access', items: [{ autogenerate: { directory: 'identity-access' } }] },
				{ label: 'Collection Agents', items: [{ autogenerate: { directory: 'collection-agents' } }] },
				{ label: 'Application Monitoring (APM)', items: [{ autogenerate: { directory: 'instrumentation' } }] },
				{ label: 'APM Views', items: [{ autogenerate: { directory: 'apm' } }] },
				{ label: 'Distributed Tracing', items: [{ autogenerate: { directory: 'traces' } }] },
				{
					label: 'Logs',
					items: [
						'logs/overview', 'logs/send-logs', 'logs/application-logs', 'logs/log-explorer',
						'logs/fields-and-attributes', 'logs/pipelines', 'logs/parsing-guides',
						'logs/drop-logs', 'logs/querying-logs',
						{ label: 'Log Sources', items: [{ autogenerate: { directory: 'logs/log-sources' } }] },
					],
				},
				{
					label: 'Metrics',
					items: [
						'metrics/overview', 'metrics/send-metrics', 'metrics/prometheus-metrics',
						'metrics/statsd-metrics', 'metrics/metrics-explorer', 'metrics/types-and-aggregation',
						'metrics/querying-metrics',
						{ label: 'Application Metrics', items: [{ autogenerate: { directory: 'metrics/application-metrics' } }] },
					],
				},
				{
					label: 'Dashboards',
					items: [
						'dashboards/overview', 'dashboards/manage-dashboards', 'dashboards/panel-types',
						'dashboards/variables', 'dashboards/import-and-share', 'dashboards/templates',
						{ label: 'Dashboard Templates', items: [{ autogenerate: { directory: 'dashboards/dashboard-templates' } }] },
					],
				},
				{ label: 'Querying Data', items: [{ autogenerate: { directory: 'querying' } }] },
				{ label: 'Alerts', items: [{ autogenerate: { directory: 'alerts' } }] },
				{ label: 'Exceptions', items: [{ autogenerate: { directory: 'exceptions' } }] },
				{ label: 'Infrastructure Monitoring', items: [{ autogenerate: { directory: 'infrastructure' } }] },
				{ label: 'AWS Monitoring', items: [{ autogenerate: { directory: 'aws-monitoring' } }] },
				{ label: 'Frontend Monitoring', items: [{ autogenerate: { directory: 'frontend-monitoring' } }] },
				{ label: 'Mobile Monitoring', items: [{ autogenerate: { directory: 'mobile-monitoring' } }] },
				{ label: 'LLM Observability', items: [{ autogenerate: { directory: 'llm-observability' } }] },
				{ label: 'Integrations', items: [{ autogenerate: { directory: 'integrations' } }] },
				{ label: 'Migrate to MindOps', items: [{ autogenerate: { directory: 'migration' } }] },
			],
		}),
	],
});
