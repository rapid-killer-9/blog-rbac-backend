import { BlogStatus, UserRole } from '@prisma/client';
import {
  getBlogsByRole,
  deleteBlog,
  restoreBlog,
  updateBlogStatus,
} from '../src/services/blogService';

jest.mock('../src/lib/prisma', () => ({
  __esModule: true,
  default: {
    blog: {
      findMany: jest.fn(),
      findUnique: jest.fn(),
      update: jest.fn(),
      count: jest.fn(),
    },
    blogTag: { upsert: jest.fn() },
  },
}));

import prisma from '../src/lib/prisma';

beforeEach(() => jest.clearAllMocks());

// ─── getBlogsByRole ─────────────────────────────────────────────────────────

describe('getBlogsByRole', () => {
  beforeEach(() => {
    (prisma.blog.findMany as jest.Mock).mockResolvedValue([]);
    (prisma.blog.count as jest.Mock).mockResolvedValue(0);
  });

  it('ADMIN: queries all non-deleted blogs with author info', async () => {
    await getBlogsByRole('admin-1', UserRole.ADMIN, { page: 1, limit: 10 });

    const where = (prisma.blog.findMany as jest.Mock).mock.calls[0][0].where;
    expect(where).toEqual({ deletedAt: null });

    const include = (prisma.blog.findMany as jest.Mock).mock.calls[0][0].include;
    expect(include).toHaveProperty('author');
  });

  it('MODERATOR: only sees DRAFT and PENDING blogs', async () => {
    await getBlogsByRole('mod-1', UserRole.MODERATOR, { page: 1, limit: 10 });

    const where = (prisma.blog.findMany as jest.Mock).mock.calls[0][0].where;
    expect(where.status).toEqual({ in: [BlogStatus.DRAFT, BlogStatus.PENDING] });
  });

  it('USER: only sees their own posts', async () => {
    await getBlogsByRole('user-1', UserRole.USER, { page: 1, limit: 10 });

    const where = (prisma.blog.findMany as jest.Mock).mock.calls[0][0].where;
    expect(where.authorId).toBe('user-1');
  });

  it('returns the correct pagination meta', async () => {
    (prisma.blog.count as jest.Mock).mockResolvedValue(25);

    const result = await getBlogsByRole('admin-1', UserRole.ADMIN, { page: 2, limit: 10 });

    expect(result.meta).toEqual({ total: 25, page: 2, limit: 10, totalPages: 3 });
  });

  it('applies skip correctly for page 3', async () => {
    await getBlogsByRole('admin-1', UserRole.ADMIN, { page: 3, limit: 5 });

    const skip = (prisma.blog.findMany as jest.Mock).mock.calls[0][0].skip;
    expect(skip).toBe(10); // (3 - 1) * 5
  });

  it('orders results by createdAt descending', async () => {
    await getBlogsByRole('admin-1', UserRole.ADMIN, { page: 1, limit: 10 });

    const orderBy = (prisma.blog.findMany as jest.Mock).mock.calls[0][0].orderBy;
    expect(orderBy).toEqual({ createdAt: 'desc' });
  });
});

// ─── getBlogsByRole — filters ────────────────────────────────────────────────

describe('getBlogsByRole — filters', () => {
  beforeEach(() => {
    (prisma.blog.findMany as jest.Mock).mockResolvedValue([]);
    (prisma.blog.count as jest.Mock).mockResolvedValue(0);
  });

  it('ADMIN + ?status=PUBLISHED narrows the where clause', async () => {
    await getBlogsByRole('admin-1', UserRole.ADMIN, { page: 1, limit: 10 }, { status: BlogStatus.PUBLISHED });

    const where = (prisma.blog.findMany as jest.Mock).mock.calls[0][0].where;
    expect(where.status).toBe(BlogStatus.PUBLISHED);
  });

  it('ADMIN + ?tag=nodejs adds a tags.some filter', async () => {
    await getBlogsByRole('admin-1', UserRole.ADMIN, { page: 1, limit: 10 }, { tag: 'nodejs' });

    const where = (prisma.blog.findMany as jest.Mock).mock.calls[0][0].where;
    expect(where.tags).toEqual({ some: { name: { equals: 'nodejs', mode: 'insensitive' } } });
  });

  it('ADMIN + ?q=hello adds an OR filter across title and content', async () => {
    await getBlogsByRole('admin-1', UserRole.ADMIN, { page: 1, limit: 10 }, { q: 'hello' });

    const where = (prisma.blog.findMany as jest.Mock).mock.calls[0][0].where;
    expect(where.OR).toEqual([
      { title: { contains: 'hello', mode: 'insensitive' } },
      { content: { contains: 'hello', mode: 'insensitive' } },
    ]);
  });

  it('MODERATOR + ?status=DRAFT is within allowed statuses — passes through', async () => {
    await getBlogsByRole('mod-1', UserRole.MODERATOR, { page: 1, limit: 10 }, { status: BlogStatus.DRAFT });

    const where = (prisma.blog.findMany as jest.Mock).mock.calls[0][0].where;
    expect(where.status).toBe(BlogStatus.DRAFT);
  });

  it('MODERATOR + ?status=PUBLISHED intersects to empty set', async () => {
    await getBlogsByRole('mod-1', UserRole.MODERATOR, { page: 1, limit: 10 }, { status: BlogStatus.PUBLISHED });

    const where = (prisma.blog.findMany as jest.Mock).mock.calls[0][0].where;
    // PUBLISHED is outside moderator's allowed set → in: []
    expect(where.status).toEqual({ in: [] });
  });

  it('USER + ?status=PUBLISHED filters within own posts', async () => {
    await getBlogsByRole('user-1', UserRole.USER, { page: 1, limit: 10 }, { status: BlogStatus.PUBLISHED });

    const where = (prisma.blog.findMany as jest.Mock).mock.calls[0][0].where;
    expect(where.authorId).toBe('user-1');
    expect(where.status).toBe(BlogStatus.PUBLISHED);
  });

  it('no filters → where clause has no status, tags, or OR keys', async () => {
    await getBlogsByRole('admin-1', UserRole.ADMIN, { page: 1, limit: 10 });

    const where = (prisma.blog.findMany as jest.Mock).mock.calls[0][0].where;
    expect(where).not.toHaveProperty('OR');
    expect(where).not.toHaveProperty('tags');
    expect(where).not.toHaveProperty('status');
  });

  it('all three filters compose together', async () => {
    await getBlogsByRole('admin-1', UserRole.ADMIN, { page: 1, limit: 10 }, {
      status: BlogStatus.DRAFT,
      tag: 'typescript',
      q: 'prisma',
    });

    const where = (prisma.blog.findMany as jest.Mock).mock.calls[0][0].where;
    expect(where.status).toBe(BlogStatus.DRAFT);
    expect(where.tags).toBeDefined();
    expect(where.OR).toBeDefined();
  });
});

// ─── deleteBlog ─────────────────────────────────────────────────────────────

describe('deleteBlog', () => {
  const blog = { id: 'blog-1', authorId: 'author-1', deletedAt: null, title: '', content: '', status: BlogStatus.DRAFT, createdAt: new Date(), updatedAt: new Date(), tags: [] };

  it('allows the author to soft-delete their own post', async () => {
    (prisma.blog.findUnique as jest.Mock).mockResolvedValue(blog);
    (prisma.blog.update as jest.Mock).mockResolvedValue({ ...blog, deletedAt: new Date() });

    await deleteBlog('blog-1', 'author-1', UserRole.USER);

    expect(prisma.blog.update).toHaveBeenCalledWith(
      expect.objectContaining({ data: expect.objectContaining({ deletedAt: expect.any(Date) }) })
    );
  });

  it('allows ADMIN to delete any post regardless of authorship', async () => {
    (prisma.blog.findUnique as jest.Mock).mockResolvedValue(blog);
    (prisma.blog.update as jest.Mock).mockResolvedValue({});

    await expect(deleteBlog('blog-1', 'different-user', UserRole.ADMIN)).resolves.not.toThrow();
  });

  it('throws Forbidden when a non-author USER tries to delete', async () => {
    (prisma.blog.findUnique as jest.Mock).mockResolvedValue(blog);

    await expect(deleteBlog('blog-1', 'other-user', UserRole.USER)).rejects.toThrow(/Forbidden/);
  });

  it('throws when the blog does not exist', async () => {
    (prisma.blog.findUnique as jest.Mock).mockResolvedValue(null);

    await expect(deleteBlog('ghost-blog', 'user-1', UserRole.ADMIN)).rejects.toThrow('Blog not found');
  });

  it('throws when the blog is already soft-deleted', async () => {
    (prisma.blog.findUnique as jest.Mock).mockResolvedValue({ ...blog, deletedAt: new Date() });

    await expect(deleteBlog('blog-1', 'author-1', UserRole.ADMIN)).rejects.toThrow('Blog not found');
  });
});

// ─── restoreBlog ────────────────────────────────────────────────────────────

describe('restoreBlog', () => {
  const deletedBlog = { id: 'blog-1', deletedAt: new Date() };
  const activeBlog = { id: 'blog-2', deletedAt: null };

  it('allows ADMIN to restore a soft-deleted blog', async () => {
    (prisma.blog.findUnique as jest.Mock).mockResolvedValue(deletedBlog);
    (prisma.blog.update as jest.Mock).mockResolvedValue({ ...deletedBlog, deletedAt: null });

    await restoreBlog('blog-1', UserRole.ADMIN);

    expect(prisma.blog.update).toHaveBeenCalledWith(
      expect.objectContaining({ data: { deletedAt: null } })
    );
  });

  it('throws Forbidden for non-ADMIN roles', async () => {
    await expect(restoreBlog('blog-1', UserRole.MODERATOR)).rejects.toThrow(/Forbidden/);
    await expect(restoreBlog('blog-1', UserRole.USER)).rejects.toThrow(/Forbidden/);
  });

  it('throws when the blog does not exist', async () => {
    (prisma.blog.findUnique as jest.Mock).mockResolvedValue(null);

    await expect(restoreBlog('ghost', UserRole.ADMIN)).rejects.toThrow('Blog not found');
  });

  it('throws when the blog is not deleted', async () => {
    (prisma.blog.findUnique as jest.Mock).mockResolvedValue(activeBlog);

    await expect(restoreBlog('blog-2', UserRole.ADMIN)).rejects.toThrow('Blog is not deleted');
  });
});

// ─── updateBlogStatus ───────────────────────────────────────────────────────

// ─── typed error statusCodes ────────────────────────────────────────────────

describe('typed error statusCodes', () => {
  const blog = { id: 'blog-1', authorId: 'author-1', deletedAt: null };

  it('deleteBlog Forbidden throws with statusCode 403', async () => {
    (prisma.blog.findUnique as jest.Mock).mockResolvedValue(blog);
    const error: any = await deleteBlog('blog-1', 'other-user', UserRole.USER).catch((e) => e);
    expect(error.statusCode).toBe(403);
  });

  it('deleteBlog not found throws with statusCode 404', async () => {
    (prisma.blog.findUnique as jest.Mock).mockResolvedValue(null);
    const error: any = await deleteBlog('ghost', 'u-1', UserRole.ADMIN).catch((e) => e);
    expect(error.statusCode).toBe(404);
  });

  it('restoreBlog Forbidden throws with statusCode 403', async () => {
    const error: any = await restoreBlog('blog-1', UserRole.USER).catch((e) => e);
    expect(error.statusCode).toBe(403);
  });

  it('restoreBlog already active throws with statusCode 400', async () => {
    (prisma.blog.findUnique as jest.Mock).mockResolvedValue({ id: 'blog-1', deletedAt: null });
    const error: any = await restoreBlog('blog-1', UserRole.ADMIN).catch((e) => e);
    expect(error.statusCode).toBe(400);
  });

  it('updateBlogStatus insufficient permissions throws with statusCode 403', async () => {
    const error: any = await updateBlogStatus('blog-1', BlogStatus.PUBLISHED, UserRole.USER).catch((e) => e);
    expect(error.statusCode).toBe(403);
  });
});

describe('updateBlogStatus', () => {
  beforeEach(() => {
    (prisma.blog.update as jest.Mock).mockResolvedValue({ id: 'blog-1', status: BlogStatus.PUBLISHED });
  });

  it('allows ADMIN to update status', async () => {
    await expect(updateBlogStatus('blog-1', BlogStatus.PUBLISHED, UserRole.ADMIN)).resolves.not.toThrow();
    expect(prisma.blog.update).toHaveBeenCalled();
  });

  it('allows MODERATOR to update status', async () => {
    await expect(updateBlogStatus('blog-1', BlogStatus.PENDING, UserRole.MODERATOR)).resolves.not.toThrow();
  });

  it('throws for USER role', async () => {
    await expect(updateBlogStatus('blog-1', BlogStatus.PUBLISHED, UserRole.USER)).rejects.toThrow(/Insufficient permissions/);
    expect(prisma.blog.update).not.toHaveBeenCalled();
  });
});
