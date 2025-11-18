export const PUBLIC_URL = process.env.NEXT_PUBLIC_URL;

export const QUERY_KEYS = {
  USER: "user",
  MEMORIAL_PHOTOS: "memorial-photos",
};

export const GEN_CATEGORY = {
  MEMORIAL: "memorial",
};

export const STORAGE_BUCKET = "users";
export const TABLE_NAME = "portrait";

export const SIDEBAR_MENU = [
  {
    label: "영정사진",
    href: "/memorial",
  },
  {
    label: "인생네컷",
    href: "/four-cut",
  },
  {
    label: "메인",
    href: "/",
  },
];
