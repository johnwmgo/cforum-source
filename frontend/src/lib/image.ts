import imageCompression from 'browser-image-compression';

// Server rejects uploads over 2MB; large originals are shrunk to fit instead of refused
const MAX_UPLOAD_BYTES = 2 * 1024 * 1024;
const MAX_ORIGINAL_BYTES = 20 * 1024 * 1024;

/**
 * Re-encode an image through a canvas before upload. This drops all EXIF metadata
 * (GPS location, camera details), applies the EXIF rotation to the pixels, and
 * scales the image down so it fits the upload limit.
 * GIFs are passed through unchanged: re-encoding would lose animation, and GIF has no EXIF.
 */
export async function prepareImageForUpload(file: File, type: 'post' | 'avatar'): Promise<File> {
	if (file.size > MAX_ORIGINAL_BYTES) throw new Error('File is too large (max 20MB)');

	let prepared = file;
	if (file.type !== 'image/gif') {
		try {
			prepared = await imageCompression(file, {
				maxSizeMB: 1.9,
				maxWidthOrHeight: type === 'avatar' ? 512 : 2560,
				preserveExif: false,
				// The worker build loads its script from a third-party CDN; run on the page instead
				useWebWorker: false
			});
		} catch {
			throw new Error('This image could not be read. Please use a JPEG, PNG, GIF or WebP file.');
		}
	}

	if (prepared.size > MAX_UPLOAD_BYTES) throw new Error('File is too large (max 2MB)');
	return prepared;
}
