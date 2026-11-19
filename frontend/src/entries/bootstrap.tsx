import '@/styles/globals.css';
import '@fancyapps/ui/dist/fancybox/fancybox.css';
import { createRoot } from 'react-dom/client';
import * as React from 'react';
import { initTheme } from '@/lib/theme';

// Safari < 14.1 (older iPads) ignores `gap` on flex containers. Mark the page so the
// .no-flex-gap rules in globals.css can space flex items with margins instead.
function detectFlexGap() {
	const probe = document.createElement('div');
	probe.style.cssText = 'display:flex;flex-direction:column;row-gap:1px;position:absolute;visibility:hidden';
	probe.appendChild(document.createElement('div'));
	probe.appendChild(document.createElement('div'));
	document.body.appendChild(probe);
	const supported = probe.scrollHeight === 1;
	document.body.removeChild(probe);
	if (!supported) document.documentElement.classList.add('no-flex-gap');
}

export function mount(nodeId: string, element: React.ReactNode) {
	initTheme();
	detectFlexGap();
	const el = document.getElementById(nodeId);
	if (!el) throw new Error(`Missing root element #${nodeId}`);
	createRoot(el).render(
		<React.StrictMode>
			{element}
		</React.StrictMode>
	);
}
