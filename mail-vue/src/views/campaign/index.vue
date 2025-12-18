<template>
  <div class="campaign-container">
    <div class="header">
      <div class="title">{{$t('campaign')}}</div>
      <div class="stats">
        <el-tag type="info" size="large">{{$t('availablePairs')}}: {{availableCount}}</el-tag>
      </div>
    </div>

    <!-- 阿里云配置区域 -->
    <el-card class="config-card" shadow="never" style="margin-bottom: 20px;">
      <template #header>
        <div style="display: flex; justify-content: space-between; align-items: center;">
          <span>阿里云邮件推送配置</span>
          <el-button @click="showAliyunConfig = !showAliyunConfig" text>
            {{ showAliyunConfig ? '收起' : '展开' }}
          </el-button>
        </div>
      </template>
      
      <div v-show="showAliyunConfig">
        <el-form label-position="top">
          <el-row :gutter="20">
            <el-col :span="12">
              <el-form-item label="AccessKey ID">
                <el-input v-model="aliyunForm.accessKeyId" placeholder="LTAI5t..." />
              </el-form-item>
            </el-col>
            <el-col :span="12">
              <el-form-item label="AccessKey Secret">
                <el-input v-model="aliyunForm.accessKeySecret" type="password" placeholder="O55nw2..." show-password />
              </el-form-item>
            </el-col>
          </el-row>
          
          <el-form-item label="发信地址（最多5个）">
            <div v-for="(addr, index) in aliyunForm.fromAddresses" :key="index" style="margin-bottom: 10px;">
              <el-input v-model="aliyunForm.fromAddresses[index]" placeholder="example@yourdomain.com">
                <template #append>
                  <el-button @click="removeAddress(index)" :disabled="aliyunForm.fromAddresses.length <= 1">删除</el-button>
                </template>
              </el-input>
            </div>
            <el-button @click="addAddress" :disabled="aliyunForm.fromAddresses.length >= 5" style="width: 100%;">
              + 添加地址
            </el-button>
          </el-form-item>
          
          <el-button type="primary" @click="saveAliyunConfig" :loading="savingConfig">
            保存配置
          </el-button>
        </el-form>
      </div>
    </el-card>

    <el-card class="editor-card" shadow="never">
      <el-form label-position="top">
        <el-form-item :label="$t('selectTargets')">
           <div class="target-select-container">
             <el-checkbox v-model="form.allTargets" @change="handleTargetChange" style="margin-bottom: 8px;">
               {{ $t('allTargets') }}
             </el-checkbox>
             <el-select
                 v-if="!form.allTargets"
                 v-model="form.targetUserIds"
                 multiple
                 filterable
                 remote
                 reserve-keyword
                 :placeholder="$t('specificTargets')"
                 :remote-method="searchTargetUsers"
                 :loading="loadingTargets"
                 style="width: 100%"
                 @change="getStats"
             >
               <el-option
                   v-for="item in targetUserOptions"
                   :key="item.targetUserId"
                   :label="item.email"
                   :value="item.targetUserId"
               />
             </el-select>
           </div>
        </el-form-item>
        <el-form-item label="选择发件账号">
          <el-select v-model="form.accountId" placeholder="请选择发件账号" style="width: 100%" @change="getStats">
            <el-option
                v-for="acc in accounts"
                :key="acc.accountId"
                :label="`${acc.name} <${acc.email}>`"
                :value="acc.accountId"
            />
          </el-select>
        </el-form-item>
        <el-form-item :label="$t('subject')">
          <el-input v-model="form.subject" :placeholder="$t('subject')" />
        </el-form-item>
        <el-form-item :label="$t('senderName')">
          <el-input v-model="form.senderName" :placeholder="$t('senderNamePlaceholder')" />
        </el-form-item>
        <el-form-item :label="$t('content')">
           <div style="height: 400px; width: 100%;">
             <tinyEditor editor-id="campaign-editor" ref="editorRef" :def-value="form.content" @change="handleEditorChange" />
           </div>
        </el-form-item>
        
        <el-form-item :label="$t('batchDelay')">
          <el-input-number v-model="form.batchDelay" :min="0" :step="500" />
        </el-form-item>
        
        <div class="actions">
          <el-button
              type="primary"
              :loading="running"
              :disabled="availableCount === 0 || !form.subject || !form.content"
              @click="startCampaign"
          >
            <Icon icon="mdi:play" width="18" height="18" style="margin-right: 4px" />
            {{$t('startCampaign')}}
          </el-button>
          
          <el-button type="danger" @click="stopCampaign" :disabled="!running">
            <Icon icon="mdi:stop" width="18" height="18" style="margin-right: 4px" />
            Stop
          </el-button>
          
          <el-button @click="getStats" :loading="loadingStats">
            <Icon icon="mdi:refresh" width="18" height="18" />
          </el-button>
        </div>
      </el-form>
    </el-card>

    <el-card v-if="running || sentCount > 0" class="progress-card" shadow="hover" style="margin-bottom: 24px;">
      <template #header>
        <div class="card-header">
          <span>{{$t('campaignProgress')}}</span>
          <el-tag :type="status === 'finished' ? 'success' : 'primary'">{{status}}</el-tag>
        </div>
      </template>
      <div class="progress-info">
        <el-progress :percentage="percentage" :status="status === 'finished' ? 'success' : ''" />
        <div class="counts">
          <span>Sent Actions: {{sentCount}}</span>
          <span v-if="totalToSent > 0">Total Mission: {{totalToSent * form.repeatCount}}</span>
        </div>
      </div>
    </el-card>

    <el-card class="logs-card" :header="$t('taskLogs')" shadow="never">
      <el-table :data="logs" stripe height="300px">
        <el-table-column prop="from_email" :label="$t('fromAccount')" width="200" />
        <el-table-column prop="to_email" :label="$t('toTarget')" width="200" />
        <el-table-column prop="status" :label="$t('tabStatus')" width="100">
          <template #default="{row}">
            <el-tag :type="row.status === 0 ? 'success' : 'danger'">
              {{ row.status === 0 ? 'Success' : 'Fail' }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="create_time" :label="$t('executionTime')" width="180">
          <template #default="{row}">
            {{ formatDate(row.create_time) }}
          </template>
        </el-table-column>
        <el-table-column prop="error" label="Error" min-width="200" show-overflow-tooltip />
      </el-table>
    </el-card>
  </div>
</template>

<script setup>
import { onMounted, reactive, ref, computed, onUnmounted, watch } from 'vue'
import { Icon } from '@iconify/vue'
import { useI18n } from 'vue-i18n'
import http from '@/axios/index.js'
import { ElMessage } from 'element-plus'
import tinyEditor from '@/components/tiny-editor/index.vue'
import dayjs from 'dayjs'

const { t } = useI18n()
const loadingStats = ref(false)
const running = ref(false)
const availableCount = ref(0)
const sentCount = ref(0)
const totalToSent = ref(0)
const status = ref('idle')
const editorRef = ref(null)

const loadingTargets = ref(false)
const targetUserOptions = ref([])
const accounts = ref([])
const logs = ref([])
let logTimer = null

// 阿里云配置状态
const showAliyunConfig = ref(false)
const savingConfig = ref(false)
const aliyunForm = reactive({
  accessKeyId: '',
  accessKeySecret: '',
  region: 'cn-hangzhou',
  fromAddresses: ['']
})

const form = reactive({
  accountId: null,
  subject: '',
  senderName: '',
  content: '',
  text: '',
  batchSize: 5,
  batchDelay: 1000,
  allTargets: true,
  targetUserIds: []
})

// 从本地存储恢复表单数据
const STORAGE_KEY = 'campaign_form_data';
function loadFormData() {
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
      const parsed = JSON.parse(saved);
      Object.assign(form, parsed);
    }
  } catch (e) {
    console.error('Failed to load form data', e);
  }
}

// 监听表单变化并保存
watch(form, (newVal) => {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(newVal));
}, { deep: true });

const percentage = computed(() => {
  const totalSlots = totalToSent.value * form.repeatCount
  if (totalSlots === 0) return 0
  return Math.min(100, Math.floor((sentCount.value / totalSlots) * 100))
})

onMounted(() => {
  loadFormData();
  loadAliyunConfig();
  loadAccounts();
  getStats();
  getLogs();
  logTimer = setInterval(getLogs, 5000);
});

onUnmounted(() => {
  if (logTimer) clearInterval(logTimer);
});

async function loadAccounts() {
  try {
    // 1. 加载数据库账号
    const data = await http.get('/account/list', { params: { num: 1, size: 100 } });
    const dbAccounts = (data.list || []).map(acc => ({
      id: acc.accountId,
      type: 'database',
      label: `${acc.name} <${acc.email}>`,
      email: acc.email
    }));
    
    // 2. 加载阿里云地址
    let aliyunAccounts = [];
    try {
      const settings = await http.get('/setting/query');
      const aliyunConfig = JSON.parse(settings.aliyunConfig || '{}');
      if (aliyunConfig.fromAddresses && aliyunConfig.fromAddresses.length > 0) {
        aliyunAccounts = aliyunConfig.fromAddresses.map((addr, idx) => ({
          id: `aliyun_${idx}`,
          type: 'aliyun',
          label: `[阿里云] ${addr}`,
          email: addr
        }));
      }
    } catch (err) {
      console.error('Failed to load Aliyun config', err);
    }
    
    // 3. 合并显示
    accounts.value = [...dbAccounts, ...aliyunAccounts];
    
    if (accounts.value.length > 0 && !form.accountId) {
      form.accountId = accounts.value[0].id;
    }
  } catch (err) {
    console.error('Failed to load accounts', err);
  }
}

async function getStats() {
  if (!form.accountId) {
    availableCount.value = 0;
    return;
  }
  
  loadingStats.value = true;
  try {
    const selectedAccount = accounts.value.find(a => a.id === form.accountId);
    const actualAccountId = selectedAccount?.type === 'database' ? selectedAccount.id : -1;
    
    const params = {
      accountId: actualAccountId,
      targetUserIds: form.allTargets ? '' : form.targetUserIds.join(',')
    };
    const data = await http.get('/campaign/stats', { params });
    availableCount.value = data.count;
  } catch (error) {
    console.error(error);
  } finally {
    loadingStats.value = false;
  }
}

// 加载阿里云配置
async function loadAliyunConfig() {
  try {
    const settings = await http.get('/setting/query');
    const config = JSON.parse(settings.aliyunConfig || '{}');
    if (config.accessKeyId) {
      aliyunForm.accessKeyId = config.accessKeyId;
      aliyunForm.accessKeySecret = config.accessKeySecret;
      aliyunForm.region = config.region || 'cn-hangzhou';
      aliyunForm.fromAddresses = config.fromAddresses || [''];
    }
  } catch (err) {
    console.error('Failed to load Aliyun config', err);
  }
}

// 保存阿里云配置
async function saveAliyunConfig() {
  if (!aliyunForm.accessKeyId || !aliyunForm.accessKeySecret) {
    ElMessage.warning('请填写 AccessKey ID 和 Secret');
    return;
  }
  
  const validAddresses = aliyunForm.fromAddresses.filter(addr => addr.trim());
  if (validAddresses.length === 0) {
    ElMessage.warning('请至少添加一个发信地址');
    return;
  }
  
  savingConfig.value = true;
  try {
    const config = {
      accessKeyId: aliyunForm.accessKeyId,
      accessKeySecret: aliyunForm.accessKeySecret,
      region: aliyunForm.region,
      fromAddresses: validAddresses
    };
    
    await http.put('/setting/set', {
      aliyunConfig: JSON.stringify(config)
    });
    
    ElMessage.success('配置保存成功！');
    showAliyunConfig.value = false;
    
    // 重新加载账号列表
    await loadAccounts();
  } catch (err) {
    console.error('Failed to save Aliyun config', err);
    ElMessage.error('保存失败: ' + err.message);
  } finally {
    savingConfig.value = false;
  }
}

// 添加发信地址
function addAddress() {
  if (aliyunForm.fromAddresses.length < 5) {
    aliyunForm.fromAddresses.push('');
  }
}

// 删除发信地址
function removeAddress(index) {
  if (aliyunForm.fromAddresses.length > 1) {
    aliyunForm.fromAddresses.splice(index, 1);
  }
}

async function getLogs() {
  try {
    const data = await http.get('/campaign/logs')
    logs.value = data
  } catch (err) {}
}

async function searchTargetUsers(query) {
  if (query !== '') {
    loadingTargets.value = true
    try {
      const data = await http.get('/target-user/list', { params: { email: query, num: 1, size: 50 } })
      targetUserOptions.value = data.list
    } catch (err) {
      console.error(err)
    } finally {
      loadingTargets.value = false
    }
  }
}

function handleTargetChange() {
  if (form.allTargets) {
    form.targetUserIds = []
  }
  getStats()
}

function handleEditorChange(content, text) {
  form.content = content
  form.text = text
}

function stopCampaign() {
  running.value = false;
  status.value = 'stopped';
  ElMessage.info('已停止群发');
}

async function startCampaign() {
  if (!form.accountId) {
    ElMessage.warning('请先选择发件账号');
    return;
  }
  
  running.value = true;
  status.value = 'processing';
  sentCount.value = 0;
  totalToSent.value = availableCount.value;
  
  // 获取选中的账号信息
  const selectedAccount = accounts.value.find(a => a.id === form.accountId);
  
  while (running.value) {
    try {
      const payload = {
        subject: form.subject,
        content: form.content,
        senderName: form.senderName,
        batchSize: form.batchSize,
        targetUserIds: form.allTargets ? [] : form.targetUserIds
      };
      
      // 根据账号类型设置不同的参数
      if (selectedAccount.type === 'aliyun') {
        payload.fromAddress = selectedAccount.email;
      } else {
        payload.accountId = selectedAccount.id;
      }
      
      const data = await http.post('/campaign/send', payload);
      sentCount.value += data.sent;
      
      if (data.status === 'finished' || data.sent === 0) {
        running.value = false;
        status.value = 'finished';
        ElMessage.success('群发完成！');
        break;
      }
      
      getLogs();

      if (form.batchDelay > 0) {
        await new Promise(resolve => setTimeout(resolve, form.batchDelay));
      }
    } catch (error) {
      console.error(error);
      running.value = false;
      status.value = 'error';
      ElMessage.error('发送失败: ' + error.message);
      break;
    }
    
    await getStats();
  }
}

function formatDate(date) {
  return dayjs(date).format('YYYY-MM-DD HH:mm:ss')
}
</script>

<style lang="scss" scoped>
.campaign-container {
  padding: 20px;
  max-width: 1200px;
  margin: 0 auto;

  .header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 24px;
    .title {
      font-size: 24px;
      font-weight: bold;
      color: var(--el-text-color-primary);
    }
  }

  .editor-card {
    margin-bottom: 24px;
    .actions {
      display: flex;
      gap: 12px;
      margin-top: 12px;
    }
  }

  .progress-card {
    .card-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
    }
    .progress-info {
      padding: 12px 0;
      .counts {
        margin-top: 12px;
        display: flex;
        gap: 24px;
        color: var(--el-text-color-secondary);
        font-size: 14px;
      }
    }
  }

  .target-select-container {
    display: flex;
    flex-direction: column;
    width: 100%;
  }
}
</style>
