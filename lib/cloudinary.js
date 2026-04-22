const CLOUD = process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME;
const BASE  = `https://res.cloudinary.com/${CLOUD}/image/upload`;

// Watermark on all public-facing display URLs — l_text, 30% opacity, bottom-right.
const WM = 'l_text:Arial_20:davejavu.com,co_white,o_30,g_south_east,x_16,y_16';

export function getGridUrl(cloudinaryId) {
  return `${BASE}/w_900,c_limit,q_75,f_jpg,${WM}/${cloudinaryId}`;
}

export function getHeroUrl(cloudinaryId) {
  return `${BASE}/w_1920,c_limit,q_80,f_jpg,${WM}/${cloudinaryId}`;
}

export function getThumbnailUrl(cloudinaryId) {
  return `${BASE}/w_400,h_400,c_fill,q_65,f_jpg,${WM}/${cloudinaryId}`;
}

// Download URLs — no watermark, resolution per tier.
export function getDownloadUrl(cloudinaryId, tier) {
  if (tier === 'full_res') {
    return `${BASE}/fl_attachment/${cloudinaryId}`;
  }
  return `${BASE}/w_2000,c_limit,fl_attachment/${cloudinaryId}`;
}
