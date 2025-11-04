import { ApiProperty } from '@nestjs/swagger';
import { BookmarkResponseDto } from 'src/bookmarks/dto/response-bookmark.dto';
import { CategoryResponseDto } from 'src/categories/dto/response-category.dto';
import { LikeResponseDto } from 'src/likes/dto/response-like-dto';
import { UserResponseDto } from 'src/users/dto/response-user.dto';

export class LpResponseDto {
  @ApiProperty({ example: 1, description: '게시글 ID' })
  id: number;

  @ApiProperty({ example: '야호', description: '게시글 제목' })
  title: string;

  @ApiProperty({ example: '야호', description: '게시글 내용' })
  description: string;

  @ApiProperty({ example: 3, description: '작성자(Author) ID' })
  authorId: number;

  @ApiProperty({ example: 1, description: '카테고리 ID' })
  categoryId: number;

  @ApiProperty({
    example: '2025-02-14T04:24:09.066Z',
    description: '게시글 생성 시간 (ISO 8601 문자열)',
  })
  createdAt: string;

  @ApiProperty({
    example: '2025-02-14T04:24:09.066Z',
    description: '게시글 수정 시간 (ISO 8601 문자열)',
  })
  updatedAt: string;

  @ApiProperty({
    description: '작성자 정보',
    type: UserResponseDto,
  })
  author: UserResponseDto;

  @ApiProperty({
    description: '카테고리 정보',
    type: CategoryResponseDto,
  })
  category: CategoryResponseDto;

  @ApiProperty({
    description: '게시글을 좋아요한 정보(배열)',
    type: [LikeResponseDto],
    example: [
      {
        userId: 1,
      },
    ],
  })
  likes: LikeResponseDto[];

  @ApiProperty({
    description: '게시글을 북마크한 정보(배열)',
    type: [BookmarkResponseDto],
    example: [
      {
        userId: 3,
      },
    ],
  })
  bookmarks: BookmarkResponseDto[];

  @ApiProperty({
    example: 0,
    description: '좋아요 총 개수',
  })
  totalLikes: number;

  @ApiProperty({
    example: 1,
    description: '북마크 총 개수',
  })
  totalBookmarks: number;

  @ApiProperty({
    example: false,
    description: '현재 사용자 기준 좋아요 여부',
  })
  isLiked: boolean;

  @ApiProperty({
    example: false,
    description: '현재 사용자 기준 북마크 여부',
  })
  isBookmarked: boolean;
}
