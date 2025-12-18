-- 步骤1: 添加 aliyun_config 字段到 setting 表
ALTER TABLE setting ADD COLUMN aliyun_config TEXT DEFAULT '{}' NOT NULL;

-- 步骤2: 插入阿里云配置
UPDATE setting SET aliyun_config = '{
  "accessKeyId": "LTAI5tPFTKSGSj4DhYmQjyJ5",
  "accessKeySecret": "O55nw2F4ao4CYhNVfZA5e85tNTRY3D",
  "region": "cn-hangzhou",
  "fromAddresses": ["cola@1877617087431326.onaliyun.com"]
}';

-- 验证配置
SELECT aliyun_config FROM setting;
