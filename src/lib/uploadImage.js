import { api } from './axios';

const TYPES = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];
const MAX_BYTES = 5 * 1024 * 1024;

const readAsDataUrl = (file) => new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result);
    reader.onerror = () => reject(new Error("That image couldn't be read. Please try another file."));
    reader.readAsDataURL(file);
});

/**
 * Uploads a picture through the backend (which checks the admin login) and returns its
 * public link. folder: 'rewards' or 'events'. Throws an Error with a readable message.
 */
export async function uploadImage(file, folder = 'rewards') {
    if (!file) throw new Error('No file chosen.');
    const type = file.type === 'image/jpg' ? 'image/jpeg' : file.type;
    if (!TYPES.includes(type)) throw new Error('Please choose a JPG, PNG, WebP or GIF image.');
    if (file.size > MAX_BYTES) throw new Error('Images must be under 5 MB.');
    const dataUrl = await readAsDataUrl(file);
    try {
        const res = await api.post('/api/v1/admin/upload-image', { content_type: type, data_base64: dataUrl, folder });
        return res.data.url;
    } catch (err) {
        throw new Error(err.response?.data?.detail || 'The image couldn\'t be uploaded. Please try again.');
    }
}
