export type LpDetail = {
  id: number;
  title: string;
  description?: string;
  body?: string;
  thumbnailUrl?: string | null;
  imageUrl?: string | null;
  coverUrl?: string | null;
  likes?: any[];
  totalLikes?: number;
  isLiked?: boolean;
  isBookmarked?: boolean;
  author?: {
    id: number;
    email: string;
    name: string;
    profileImageUrl?: string | null;
    role?: string;
  };
  category?: { id: number; name: string };
  /** tags can be strings or objects with name */
  tags?: Array<string | { id?: number; name: string }>;
  createdAt: string;
  updatedAt?: string;
};

export type LpComment = {
  id: number;
  content: string;
  createdAt: string;
  updatedAt?: string;
  author?: {
    id?: number;
    email?: string;
    name?: string;
    profileImageUrl?: string | null;
    role?: string;
  };
};
