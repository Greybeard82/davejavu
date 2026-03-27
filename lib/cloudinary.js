const CLOUD = process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME;
const BASE = `https://res.cloudinary.com/${CLOUD}/image/upload`;

export function getGridUrl(cloudinaryId) {
  return `${BASE}/w_900,c_limit,q_75,f_jpg/${cloudinaryId}`;
}

export function getHeroUrl(cloudinaryId) {
  return `${BASE}/w_1920,c_limit,q_80,f_jpg/${cloudinaryId}`;
}

export function getThumbnailUrl(cloudinaryId) {
  return `${BASE}/w_400,h_400,c_fill,q_65,f_jpg/${cloudinaryId}`;
}
