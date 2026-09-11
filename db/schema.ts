import { index, integer, sqliteTable, text } from 'drizzle-orm/sqlite-core';

export const submissions = sqliteTable('submissions', {
  id: text('id').primaryKey(),
  submitterUserId: text('submitter_user_id').notNull().default(''),
  title: text('title').notNull(), titleEn: text('title_en'), authorName: text('author_name').notNull(),
  email: text('email').notNull(), affiliation: text('affiliation'), category: text('category').notNull(),
  abstract: text('abstract').notNull(), keywords: text('keywords'), manuscriptKey: text('manuscript_key').notNull(),
  manuscriptName: text('manuscript_name').notNull(), status: text('status').notNull().default('submitted'), createdAt: integer('created_at').notNull(),
}, (table) => [index('idx_submissions_status_created').on(table.status, table.createdAt)]);

export const reviews = sqliteTable('reviews', {
  id: integer('id').primaryKey({ autoIncrement: true }), submissionId: text('submission_id').notNull(),
  reviewerUserId: text('reviewer_user_id').notNull().default(''), reviewerName: text('reviewer_name').notNull().default('會員'),
  recommendation: text('recommendation').notNull(), confidentialComments: text('confidential_comments'),
  authorComments: text('author_comments').notNull(), createdAt: integer('created_at').notNull(),
}, (table) => [index('idx_reviews_submission_id').on(table.submissionId)]);
