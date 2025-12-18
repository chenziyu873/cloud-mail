import { sqliteTable, text, integer, uniqueIndex } from 'drizzle-orm/sqlite-core';
import { sql } from 'drizzle-orm';
import { account } from './account';
import { targetUser } from './target-user';

export const sendLog = sqliteTable('send_log', {
    sendLogId: integer('send_log_id').primaryKey({ autoIncrement: true }),
    accountId: integer('account_id').notNull(),
    targetUserId: integer('target_user_id').notNull(),
    userId: integer('user_id').notNull(),
    status: integer('status').default(0).notNull(), // 0: 成功, 1: 失败
    error: text('error'),
    createTime: text('create_time').default(sql`CURRENT_TIMESTAMP`).notNull(),
}, (table) => ({
    // 一个号只能给一个目标发一次
    uniquePair: uniqueIndex('unique_account_target').on(table.accountId, table.targetUserId),
}));

export default sendLog
