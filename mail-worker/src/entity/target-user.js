import { sqliteTable, text, integer } from 'drizzle-orm/sqlite-core';
import { sql } from 'drizzle-orm';

export const targetUser = sqliteTable('target_user', {
    targetUserId: integer('target_user_id').primaryKey({ autoIncrement: true }),
    email: text('email').notNull(),
    userId: integer('user_id').notNull(),
    createTime: text('create_time').default(sql`CURRENT_TIMESTAMP`).notNull(),
});

export default targetUser
