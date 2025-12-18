import orm from '../entity/orm';
import sendLog from '../entity/send-log';
import { sql } from 'drizzle-orm';
import emailService from './email-service';
import BizError from '../error/biz-error';

const campaignService = {

    /**
     * 获取还未发送的目标用户数量
     */
    async getAvailableTargets(c, userId, accountId, targetUserIds = []) {
        const db = orm(c);

        const targetIdsFilter = targetUserIds.length > 0
            ? sql`AND t.target_user_id IN (${sql.raw(targetUserIds.join(','))})`
            : sql``;

        // 统计还没发送过的目标
        const query = sql`
            SELECT COUNT(*) as count
            FROM target_user t
            WHERE t.user_id = ${userId}
              ${targetIdsFilter}
              AND NOT EXISTS (
                  SELECT 1 FROM send_log s
                  WHERE s.target_user_id = t.target_user_id
                    AND s.account_id = ${accountId}
                    AND s.user_id = ${userId}
              )
        `;
        const result = await db.all(query);
        return { count: result[0]?.count || 0 };
    },

    /**
     * 执行群发任务（简化版：一个账号发给多个目标）
     */
    async sendBatch(c, params, userId) {
        const { accountId, senderName, subject, content, batchSize = 10, targetUserIds = [] } = params;
        const db = orm(c);

        if (!accountId) {
            throw new BizError('请选择发件账号');
        }

        const targetIdsFilter = targetUserIds.length > 0
            ? sql`AND t.target_user_id IN (${sql.raw(targetUserIds.join(','))})`
            : sql``;

        // 获取一批还没发送过的目标
        const targets = await db.all(sql`
            SELECT t.target_user_id, t.email as to_email
            FROM target_user t
            WHERE t.user_id = ${userId}
              ${targetIdsFilter}
              AND NOT EXISTS (
                  SELECT 1 FROM send_log s
                  WHERE s.target_user_id = t.target_user_id
                    AND s.account_id = ${accountId}
                    AND s.user_id = ${userId}
              )
            LIMIT ${batchSize}
        `);

        if (targets.length === 0) {
            return { sent: 0, status: 'finished' };
        }

        let sentCount = 0;
        for (const target of targets) {
            try {
                await emailService.send(c, {
                    accountId: accountId,
                    name: senderName || 'Campaign',
                    receiveEmail: [target.to_email],
                    subject: subject,
                    content: content,
                    attachments: []
                }, userId);

                await db.insert(sendLog).values({
                    accountId: accountId,
                    targetUserId: target.target_user_id,
                    userId: userId,
                    status: 0
                }).run();
                sentCount++;
            } catch (err) {
                console.error(`Send failed to ${target.to_email}`, err);
                await db.insert(sendLog).values({
                    accountId: accountId,
                    targetUserId: target.target_user_id,
                    userId: userId,
                    status: 1,
                    error: err.message
                }).run();
            }
        }

        return { sent: sentCount, status: 'processing' };
    },

    async listLogs(c, userId) {
        const db = orm(c);
        const logs = await db.all(sql`
            SELECT s.send_log_id, s.create_time, s.status, s.error,
                   a.email as from_email, t.email as to_email
            FROM send_log s
            JOIN account a ON s.account_id = a.account_id
            JOIN target_user t ON s.target_user_id = t.target_user_id
            WHERE s.user_id = ${userId}
            ORDER BY s.send_log_id DESC
            LIMIT 50
        `);
        return logs;
    }
};

export default campaignService;
