export function hasInvisibleCharacters(str: string) {
	return /[\u200B-\u200F\uFEFF\u2028\u2029\u180E\u3164\u115F\u1160]/.test(str);
}

export function hasControlCharacters(str: string) {
	return /[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/.test(str);
}

export function isVisuallyEmpty(str: string) {
	if (!str) return true;
	const stripped = str.replace(/[\s\u200B-\u200F\uFEFF\u2028\u2029\u180E\u3164\u115F\u1160\x00-\x1F\x7F]+/g, '');
	return stripped.length === 0;
}

export function validateText(str: string, label: string) {
	if (!str) return `${label} cannot be empty`;
	if (isVisuallyEmpty(str)) return `${label} cannot be empty (contains only invisible characters)`;
	if (hasInvisibleCharacters(str)) return `${label} contains illegal invisible characters`;
	if (hasControlCharacters(str)) return `${label} contains illegal control characters`;
	return null;
}

