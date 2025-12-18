import orm from '../entity/orm';
import sendLog from '../entity/send-log';
import { account } from '../entity/account';
import { targetUser } from '../entity/target-user';
import { and, eq, notExists, sql } from 'drizzle-orm';
import emailService from './email-service';
import BizError from '../error/biz-error';

const campaignService = {

    /**
     * 获取当前用户下，尚未互相发送过的 (号池账号, 目标用户) 待发对。
     */
    async getAvailablePairs(c, userId) {
        // 逻辑：寻找所有号池账号 A 和 目标用户 T，且 (A, T) 不在 send_log 中
        const db = orm(c);

        // 我们可以限制一次返回的数量，或者仅返回总数
        // 这里简单处理：直接聚合计算可用对数
        const query = sql`
			SELECT count(*) as count
			FROM account a, target_user t
			WHERE a.user_id = ${userId} 
			  AND a.is_pool = 1 
			  AND a.is_del = 0
			  AND t.user_id = ${userId}
			  AND NOT EXISTS (
				  SELECT 1 FROM send_log s 
				  WHERE s.account_id = a.account_id 
				    AND s.target_user_id = t.target_user_id
			  )
		`;
        const result = await db.all(query);
        return { count: result[0]?.count || 0 };
    },

    /**
     * 执行一批发送任务
     */
    async sendBatch(c, params, userId) {
        const { subject, content, batchSize = 10 } = params;
        const db = orm(c);

        // 获取一批待发的对子
        const pairs = await db.all(sql`
			SELECT a.account_id, a.email as from_email, t.target_user_id, t.email as to_email
			FROM account a, target_user t
			WHERE a.user_id = ${userId} 
			  AND a.is_pool = 1 
			  AND a.is_del = 0
			  AND t.user_id = ${userId}
			  AND NOT EXISTS (
				  SELECT 1 FROM send_log s 
				  WHERE s.account_id = a.account_id 
				    AND s.target_user_id = t.target_user_id
			  )
			LIMIT ${batchSize}
		`);

        if (pairs.length === 0) {
            return { sent: 0, status: 'finished' };
        }

        let sentCount = 0;
        for (const pair of pairs) {
            try {
                // 模拟发送或调用实际发送服务
                // 这里需要构造邮件发送请求
                await emailService.send(c, {
                    fromName: 'Pool Service', // 可配置
                    fromEmail: pair.from_email,
                    toEmail: pair.to_email,
                    subject: subject,
                    content: content
                }, userId);

                // 记录日志
                await db.insert(sendLog).values({
                    accountId: pair.account_id,
                    targetUserId: pair.target_user_id,
                    userId: userId,
                    status: 0
                }).run();
                sentCount++;
            } catch (err) {
                console.error(`Send failed for ${pair.from_email} -> ${pair.to_email}`, err);
                await db.insert(sendLog).values({
                    accountId: pair.account_id,
                    targetUserId: pair.target_user_id,
                    userId: userId,
                    status: 1,
                    error: err.message
                }).run();
            }
        }

        return { sent: sentCount, status: 'processing' };
    }
};

export default campaignService;
