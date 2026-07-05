<template>
  <view class="page-container">
    <PageHeader :title="isEdit ? '编辑题目' : '新增题目'">
      <button class="btn-primary" @click="handleSubmit">保存</button>
    </PageHeader>

    <scroll-view scroll-y class="form-scroll">
      <view class="form-section">
        <view class="section-title">基本信息</view>
        
        <view class="form-item">
          <text class="form-label">题目类型 <text class="required">*</text></text>
          <picker mode="selector" :range="typeOptions" @change="handleTypeChange">
            <view class="picker-value">
              <text>{{ typeOptions[typeIndex] }}</text>
              <text class="picker-arrow">▼</text>
            </view>
          </picker>
        </view>

        <view class="form-item">
          <text class="form-label">题目内容 <text class="required">*</text></text>
          <textarea 
            v-model="form.title" 
            placeholder="请输入题目内容"
            class="form-textarea"
          />
        </view>

        <view class="form-item">
          <text class="form-label">题目解析</text>
          <textarea 
            v-model="form.explanation" 
            placeholder="请输入题目解析（可选）"
            class="form-textarea"
          />
        </view>
      </view>

      <view class="form-section">
        <view class="section-title">关联设置（非必填）</view>
        
        <view class="form-item">
          <text class="form-label">关联课程</text>
          <view 
            class="picker-value" 
            :class="{ empty: !form.course }"
            @click="showCoursePicker = true"
          >
            <text>{{ form.course?.title || '请选择课程' }}</text>
            <text class="picker-arrow">▼</text>
          </view>
        </view>

        <view class="form-item">
          <text class="form-label">关联课时</text>
          <view
            class="picker-value"
            :class="{ empty: !form.lesson }"
            @click="showLessonPicker = true"
          >
            <text>{{ form.lesson?.title || '请选择课时' }}</text>
            <text class="picker-arrow">▼</text>
          </view>
        </view>

        <view class="lesson-points-info" v-if="form.lesson && lessonPointsInfo">
          <view class="info-chip" :class="{ off: !lessonPointsInfo.enablePoints }">
            {{ lessonPointsInfo.enablePoints ? '积分已开启' : '积分未开启' }}
          </view>
          <view class="info-chip" v-if="lessonPointsInfo.enablePoints">
            类型：{{ lessonPointsInfo.pointsType === 'quiz_points' ? '答题积分' : '课时积分' }}
          </view>
          <view class="info-chip warn" v-if="lessonPointsInfo.enablePoints && lessonPointsInfo.pointsType !== 'quiz_points'">
            当前课时类型不支持答题积分
          </view>
        </view>

        <view class="form-item">
          <text class="form-label">关联知识点</text>
          <view class="multi-select-container">
            <view 
              v-if="form.knowledgePoints.length === 0" 
              class="picker-value empty"
              @click="showKnowledgePicker = true"
            >
              <text>请选择知识点</text>
              <text class="picker-arrow">▼</text>
            </view>
            <view v-else class="selected-tags">
              <view 
                v-for="kp in form.knowledgePoints" 
                :key="kp.documentId" 
                class="tag-item"
              >
                <text>{{ kp.name }}</text>
                <text class="tag-close" @click="removeKnowledgePoint(kp)">×</text>
              </view>
              <view class="add-tag" @click="showKnowledgePicker = true">+ 添加</view>
            </view>
          </view>
        </view>
      </view>

      <!-- 选择题选项 -->
      <view class="form-section" v-if="isChoiceType">
        <view class="section-title">选项设置</view>
        
        <view class="options-list">
          <view class="option-item" v-for="(option, index) in form.options" :key="index">
            <view class="option-header">
              <text class="option-label">{{ getOptionLabel(index) }}</text>
              <view class="option-actions">
                <view class="action-icon delete" @click="removeOption(index)">删除</view>
              </view>
            </view>
            <input 
              v-model="form.options[index].text" 
              placeholder="请输入选项内容"
              class="form-input"
            />
          </view>
        </view>
        
        <view class="add-option-btn" @click="addOption">
          <text class="add-icon">+</text>
          <text>添加选项</text>
        </view>

        <view class="form-item" v-if="isChoiceType">
          <text class="form-label">正确答案 <text class="required">*</text></text>
          <picker 
            v-if="isSingleChoice" 
            mode="selector" 
            :range="answerOptions" 
            @change="handleAnswerChange"
          >
            <view class="picker-value">
              <text>{{ form.answer || '请选择正确答案' }}</text>
              <text class="picker-arrow">▼</text>
            </view>
          </picker>
          <view v-else class="checkbox-group">
            <view 
              v-for="(label, index) in answerOptions" 
              :key="index"
              class="checkbox-item"
              @click="toggleAnswer(label)"
            >
              <text class="checkbox" :class="{ checked: (form.answer || []).includes(label) }">
                <text v-if="(form.answer || []).includes(label)">✓</text>
              </text>
              <text>{{ label }}</text>
            </view>
          </view>
        </view>
      </view>

      <!-- 判断题 -->
      <view class="form-section" v-if="isTrueFalseType">
        <view class="section-title">答案设置</view>
        
        <view class="form-item">
          <text class="form-label">正确答案 <text class="required">*</text></text>
          <picker mode="selector" :range="['请选择', '正确', '错误']" @change="handleTrueFalseChange">
            <view class="picker-value">
              <text>{{ form.answer === 'true' ? '正确' : (form.answer === 'false' ? '错误' : '请选择') }}</text>
              <text class="picker-arrow">▼</text>
            </view>
          </picker>
        </view>
      </view>

      <!-- 填空题/简答题 -->
      <view class="form-section" v-if="isFillBlankType || isShortAnswerType">
        <view class="section-title">答案设置</view>
        
        <view class="form-item">
          <text class="form-label">参考回答 <text class="required">*</text></text>
          <textarea 
            v-model="form.answer" 
            placeholder="请输入参考回答"
            class="form-textarea"
          />
        </view>
      </view>

      <view class="form-section">
        <view class="section-title">属性设置</view>
        
        <view class="form-row">
          <view class="form-item half">
            <text class="form-label">难度</text>
            <picker mode="selector" :range="difficultyOptions" @change="handleDifficultyChange">
              <view class="picker-value">
                <text>{{ difficultyOptions[difficultyIndex] }}</text>
                <text class="picker-arrow">▼</text>
              </view>
            </picker>
          </view>
          <view class="form-item half">
            <text class="form-label">分值</text>
            <input
              type="number"
              v-model="form.points"
              placeholder="0"
              class="form-input"
            />
            <text class="form-tip">仅当关联课时积分类型=quiz_points 时生效</text>
          </view>
        </view>

        <view class="form-row">
          <view class="form-item half">
            <text class="form-label">排序</text>
            <input 
              type="number" 
              v-model="form.sort" 
              placeholder="0"
              class="form-input"
            />
          </view>
          <view class="form-item half">
            <text class="form-label">发布状态</text>
            <view class="switch-container">
              <view 
                class="switch-btn" 
                :class="{ active: form.isPublished }" 
                @click="form.isPublished = !form.isPublished"
              >
                <text>{{ form.isPublished ? '已发布' : '草稿' }}</text>
              </view>
            </view>
          </view>
        </view>
      </view>
    </scroll-view>

    <view class="bottom-action">
      <button class="btn-save" @click="handleSubmit">保存题目</button>
    </view>

    <!-- 课程选择弹窗 -->
    <view class="picker-modal" v-if="showCoursePicker" @click="showCoursePicker = false">
      <view class="picker-content" @click.stop>
        <view class="picker-header">
          <text class="picker-title">选择课程</text>
          <text class="picker-close" @click="showCoursePicker = false">×</text>
        </view>
        <scroll-view scroll-y class="picker-scroll">
          <view 
            v-for="course in courseList" 
            :key="course.documentId" 
            class="picker-item"
            :class="{ selected: form.course?.documentId === course.documentId }"
            @click="selectCourse(course)"
          >
            <text>{{ course.title }}</text>
            <text v-if="form.course?.documentId === course.documentId" class="check-icon">✓</text>
          </view>
          <view class="picker-item" :class="{ selected: !form.course }" @click="selectCourse(null)">
            <text>不关联课程</text>
            <text v-if="!form.course" class="check-icon">✓</text>
          </view>
        </scroll-view>
      </view>
    </view>

    <!-- 课时选择弹窗 -->
    <view class="picker-modal" v-if="showLessonPicker" @click="showLessonPicker = false">
      <view class="picker-content" @click.stop>
        <view class="picker-header">
          <text class="picker-title">选择课时</text>
          <text class="picker-close" @click="showLessonPicker = false">×</text>
        </view>
        <scroll-view scroll-y class="picker-scroll">
          <view 
            v-for="lesson in lessonList" 
            :key="lesson.documentId" 
            class="picker-item"
            :class="{ selected: form.lesson?.documentId === lesson.documentId }"
            @click="selectLesson(lesson)"
          >
            <text>{{ lesson.title }}</text>
            <text v-if="form.lesson?.documentId === lesson.documentId" class="check-icon">✓</text>
          </view>
          <view class="picker-item" :class="{ selected: !form.lesson }" @click="selectLesson(null)">
            <text>不关联课时</text>
            <text v-if="!form.lesson" class="check-icon">✓</text>
          </view>
        </scroll-view>
      </view>
    </view>

    <!-- 知识点选择器 -->
    <TagPicker
      v-model:visible="showKnowledgePicker"
      mode="knowledge-point"
      :selected="form.knowledgePoints"
      @select="onKnowledgePointSelect"
    />
  </view>
</template>

<script setup>
import { ref, reactive, onMounted, computed, watch } from 'vue'
import PageHeader from '../../src/components/PageHeader.vue'
import TagPicker from '../../src/components/TagPicker.vue'
import { getQuestionDetail, createQuestion, updateQuestion } from '../../src/api/quiz.js'
import { getCourseList, getLessonList, getLessonDetail } from '../../src/api/course.js'

const isEdit = ref(false)
const questionId = ref('')

const typeOptions = ['单选题', '多选题', '判断题', '填空题', '简答题', '配对题', '排序题']
const typeValues = ['single_choice', 'multiple_choice', 'true_false', 'fill_blank', 'short_answer', 'matching', 'ordering']
const typeIndex = ref(0)

const difficultyOptions = ['简单', '中等', '困难']
const difficultyValues = ['easy', 'medium', 'hard']
const difficultyIndex = ref(1)

const form = reactive({
  type: 'single_choice',
  title: '',
  explanation: '',
  options: [
    { key: 'A', text: '' },
    { key: 'B', text: '' },
    { key: 'C', text: '' },
    { key: 'D', text: '' }
  ],
  answer: '',
  difficulty: 'medium',
  points: 0,
  sort: 0,
  isPublished: false,
  course: null,
  lesson: null,
  knowledgePoints: []
})

const showCoursePicker = ref(false)
const showLessonPicker = ref(false)
const showKnowledgePicker = ref(false)

const isInitializing = ref(false)
const lessonPointsInfo = ref(null)  // { enablePoints, pointsType, points }

const courseList = ref([])
const lessonList = ref([])

const isChoiceType = computed(() => form.type === 'single_choice' || form.type === 'multiple_choice')
const isSingleChoice = computed(() => form.type === 'single_choice')
const isTrueFalseType = computed(() => form.type === 'true_false')
const isFillBlankType = computed(() => form.type === 'fill_blank')
const isShortAnswerType = computed(() => form.type === 'short_answer')

const answerOptions = computed(() => {
  return form.options.map((_, index) => getOptionLabel(index))
})

watch(() => form.course, async (newCourse) => {
  if (isInitializing.value) return  // 初始化期间跳过清空
  form.lesson = null
  if (newCourse) {
    await loadLessons(newCourse.documentId)
  } else {
    lessonList.value = []
  }
})

function getOptionLabel(index) {
  return String.fromCharCode(65 + index)
}

function handleTypeChange(e) {
  typeIndex.value = e.detail.value
  form.type = typeValues[typeIndex.value]
  if (isSingleChoice.value) {
    form.answer = ''
  } else if (isChoiceType.value) {
    form.answer = []
  } else {
    form.answer = ''
  }
}

function handleDifficultyChange(e) {
  difficultyIndex.value = e.detail.value
  form.difficulty = difficultyValues[difficultyIndex.value]
}

function handleAnswerChange(e) {
  form.answer = answerOptions.value[e.detail.value]
}

function handleTrueFalseChange(e) {
  form.answer = e.detail.value === 1 ? 'true' : 'false'
}

function toggleAnswer(label) {
  if (!form.answer) {
    form.answer = []
  }
  if (!Array.isArray(form.answer)) {
    form.answer = []
  }
  const index = form.answer.indexOf(label)
  if (index > -1) {
    form.answer.splice(index, 1)
  } else {
    form.answer.push(label)
  }
}

function addOption() {
  const label = getOptionLabel(form.options.length)
  form.options.push({ key: label, text: '' })
}

function removeOption(index) {
  if (form.options.length > 2) {
    form.options.splice(index, 1)
  } else {
    uni.showToast({ title: '至少需要2个选项', icon: 'none' })
  }
}

async function loadCourses() {
  try {
    const { list } = await getCourseList({})
    courseList.value = list
  } catch (e) {
    uni.showToast({ title: '加载失败', icon: 'none' })
  }
}

async function loadLessons(courseId) {
  try {
    const { list } = await getLessonList({ 'filters[course][documentId][$eq]': courseId })
    lessonList.value = list
  } catch (e) {
    uni.showToast({ title: '加载失败', icon: 'none' })
  }
}

function selectCourse(course) {
  form.course = course
  showCoursePicker.value = false
}

async function selectLesson(lesson) {
  form.lesson = lesson
  showLessonPicker.value = false
  if (lesson) {
    await loadLessonPointsInfo(lesson.documentId)
  } else {
    lessonPointsInfo.value = null
  }
}

async function loadLessonPointsInfo(lessonDocId) {
  if (!lessonDocId) {
    lessonPointsInfo.value = null
    return
  }
  try {
    const data = await getLessonDetail(lessonDocId)
    lessonPointsInfo.value = {
      enablePoints: data.enablePoints ?? false,
      pointsType: data.pointsType ?? 'lesson_points',
      points: data.points ?? 0
    }
  } catch (e) {
    lessonPointsInfo.value = null
  }
}

function onKnowledgePointSelect(kps) {
  form.knowledgePoints = kps
}

function removeKnowledgePoint(kp) {
  const index = form.knowledgePoints.findIndex(item => item.documentId === kp.documentId)
  if (index > -1) {
    form.knowledgePoints.splice(index, 1)
  }
}

async function loadQuestionDetail() {
  if (!questionId.value) return
  try {
    isInitializing.value = true
    const data = await getQuestionDetail(questionId.value)
    Object.assign(form, data)
    // 知识点现在混在 tags 中，按 tagGroup.slug === 'knowledge-point' 过滤
    if (data.tags && data.tags.length > 0) {
      form.knowledgePoints = data.tags.filter(t => t.tagGroup?.slug === 'knowledge-point')
    } else {
      form.knowledgePoints = []
    }
    const typeIdx = typeValues.indexOf(data.type)
    if (typeIdx > -1) {
      typeIndex.value = typeIdx
    }
    const difficultyIdx = difficultyValues.indexOf(data.difficulty)
    if (difficultyIdx > -1) {
      difficultyIndex.value = difficultyIdx
    }
    if (!form.options || !Array.isArray(form.options) || form.options.length === 0) {
      form.options = [
        { key: 'A', text: '' },
        { key: 'B', text: '' },
        { key: 'C', text: '' },
        { key: 'D', text: '' }
      ]
    }
    if (form.course) {
      await loadLessons(form.course.documentId)
    }
    // 关联课时积分配置加载
    if (form.lesson) {
      await loadLessonPointsInfo(form.lesson.documentId)
    }
    isInitializing.value = false
  } catch (e) {
    isInitializing.value = false
    uni.showToast({ title: '加载失败', icon: 'none' })
  }
}

async function handleSubmit() {
  if (!form.title) {
    uni.showToast({ title: '请输入题目内容', icon: 'none' })
    return
  }
  if (isChoiceType.value) {
    const hasEmptyOption = form.options.some(opt => !opt.text)
    if (hasEmptyOption) {
      uni.showToast({ title: '请填写完整选项', icon: 'none' })
      return
    }
    if (!form.answer || (Array.isArray(form.answer) && form.answer.length === 0)) {
      uni.showToast({ title: '请选择正确答案', icon: 'none' })
      return
    }
  }
  if (isTrueFalseType.value && !form.answer) {
    uni.showToast({ title: '请选择正确答案', icon: 'none' })
    return
  }
  if ((isFillBlankType.value || isShortAnswerType.value) && !form.answer) {
    uni.showToast({ title: '请输入参考回答', icon: 'none' })
    return
  }

  try {
    uni.showLoading({ title: '保存中...' })
    
    const submitData = { ...form }
    
    if (submitData.course) {
      submitData.course = submitData.course.documentId
    } else {
      delete submitData.course
    }
    
    if (submitData.lesson) {
      submitData.lesson = submitData.lesson.documentId
    } else {
      delete submitData.lesson
    }
    
    // 知识点统一保存到 tags 字段（知识点是 zhao-tag 中"知识点"分组的标签）
    const allTagDocs = [...(form.tags || []), ...form.knowledgePoints]
    const uniqueDocs = []
    const seen = new Set()
    for (const t of allTagDocs) {
      if (!seen.has(t.documentId)) {
        seen.add(t.documentId)
        uniqueDocs.push({ documentId: t.documentId })
      }
    }
    submitData.tags = uniqueDocs
    delete submitData.knowledgePoints

    if (isEdit.value) {
      await updateQuestion(questionId.value, submitData)
      uni.showToast({ title: '更新成功', icon: 'success' })
    } else {
      await createQuestion(submitData)
      uni.showToast({ title: '创建成功', icon: 'success' })
    }
    
    uni.hideLoading()
    setTimeout(() => {
      uni.navigateBack()
    }, 1500)
  } catch (e) {
    uni.hideLoading()
    uni.showToast({ title: '保存失败', icon: 'none' })
  }
}

onMounted(async () => {
  await loadCourses()

  const pages = getCurrentPages()
  const currentPage = pages[pages.length - 1]
  const options = currentPage.$page?.options || currentPage.options || {}
  
  if (options.id) {
    isEdit.value = true
    questionId.value = options.id
    loadQuestionDetail()
  }
})
</script>

<style scoped>
.page-container {
  min-height: 100vh;
  background: #f5f5f5;
}

.btn-primary {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: #fff;
  padding: 15rpx 30rpx;
  border: none;
  border-radius: 40rpx;
  font-size: 28rpx;
}

.form-scroll {
  padding: 100rpx 30rpx 140rpx;
  height: 100vh;
}

.form-section {
  background: #fff;
  border-radius: 20rpx;
  padding: 30rpx;
  margin-bottom: 20rpx;
}

.section-title {
  font-size: 32rpx;
  font-weight: bold;
  color: #333;
  margin-bottom: 30rpx;
  padding-bottom: 20rpx;
  border-bottom: 1rpx solid #eee;
}

.form-item {
  margin-bottom: 30rpx;
}

.form-row {
  display: flex;
  gap: 30rpx;
}

.form-item.half {
  flex: 1;
}

.form-label {
  display: block;
  font-size: 28rpx;
  color: #666;
  margin-bottom: 15rpx;
}

.required {
  color: #ff4d4f;
}

.form-input {
  width: 100%;
  height: 80rpx;
  border: 1rpx solid #ddd;
  border-radius: 10rpx;
  padding: 0 20rpx;
  font-size: 28rpx;
  box-sizing: border-box;
}

.form-textarea {
  width: 100%;
  min-height: 160rpx;
  border: 1rpx solid #ddd;
  border-radius: 10rpx;
  padding: 20rpx;
  font-size: 28rpx;
  box-sizing: border-box;
}

.picker-value {
  display: flex;
  justify-content: space-between;
  align-items: center;
  height: 80rpx;
  border: 1rpx solid #ddd;
  border-radius: 10rpx;
  padding: 0 20rpx;
  font-size: 28rpx;
}

.picker-value.empty {
  color: #999;
}

.picker-arrow {
  font-size: 20rpx;
  color: #999;
}

.multi-select-container {
  min-height: 80rpx;
  border: 1rpx solid #ddd;
  border-radius: 10rpx;
  padding: 10rpx;
}

.selected-tags {
  display: flex;
  flex-wrap: wrap;
  gap: 15rpx;
}

.tag-item {
  display: flex;
  align-items: center;
  gap: 10rpx;
  padding: 10rpx 20rpx;
  background: #e8f5e9;
  border-radius: 20rpx;
  font-size: 26rpx;
  color: #07c160;
}

.tag-close {
  font-size: 32rpx;
  color: #999;
}

.add-tag {
  padding: 10rpx 20rpx;
  border: 1rpx dashed #ddd;
  border-radius: 20rpx;
  font-size: 26rpx;
  color: #999;
}

.options-list {
  margin-bottom: 20rpx;
}

.option-item {
  margin-bottom: 20rpx;
  padding: 20rpx;
  background: #f9f9f9;
  border-radius: 10rpx;
}

.option-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 10rpx;
}

.option-label {
  font-size: 26rpx;
  font-weight: bold;
  color: #667eea;
}

.option-actions {
  display: flex;
  gap: 15rpx;
}

.action-icon {
  font-size: 24rpx;
  padding: 5rpx 10rpx;
  border-radius: 6rpx;
}

.action-icon.delete {
  color: #ff4d4f;
  background: #fff0f0;
}

.add-option-btn {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 10rpx;
  padding: 25rpx;
  border: 2rpx dashed #ddd;
  border-radius: 10rpx;
  color: #999;
  font-size: 28rpx;
}

.add-icon {
  font-size: 36rpx;
  color: #667eea;
}

.checkbox-group {
  display: flex;
  flex-wrap: wrap;
  gap: 20rpx;
}

.checkbox-item {
  display: flex;
  align-items: center;
  gap: 10rpx;
  padding: 15rpx 25rpx;
  background: #f5f5f5;
  border-radius: 8rpx;
  font-size: 26rpx;
}

.checkbox {
  width: 40rpx;
  height: 40rpx;
  border: 2rpx solid #ddd;
  border-radius: 8rpx;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 24rpx;
  color: #fff;
}

.checkbox.checked {
  background: #667eea;
  border-color: #667eea;
}

.switch-container {
  display: flex;
  align-items: center;
}

.switch-btn {
  padding: 15rpx 30rpx;
  background: #f5f5f5;
  border-radius: 8rpx;
  font-size: 26rpx;
  color: #666;
}

.switch-btn.active {
  background: #667eea;
  color: #fff;
}

.bottom-action {
  position: fixed;
  bottom: 0;
  left: 0;
  right: 0;
  padding: 20rpx 30rpx;
  background: #fff;
  box-shadow: 0 -2rpx 10rpx rgba(0, 0, 0, 0.1);
}

.btn-save {
  width: 100%;
  height: 90rpx;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: #fff;
  border: none;
  border-radius: 45rpx;
  font-size: 32rpx;
  font-weight: bold;
}

.picker-modal {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.5);
  display: flex;
  align-items: flex-end;
  z-index: 1000;
}

.picker-content {
  width: 100%;
  max-height: 70vh;
  background: #fff;
  border-radius: 20rpx 20rpx 0 0;
}

.picker-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 30rpx;
  border-bottom: 1rpx solid #eee;
}

.picker-title {
  font-size: 32rpx;
  font-weight: bold;
  color: #333;
}

.picker-close {
  font-size: 48rpx;
  color: #999;
  padding: 0 20rpx;
}

.picker-scroll {
  max-height: 50vh;
}

.picker-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 25rpx 30rpx;
  border-bottom: 1rpx solid #f0f0f0;
  font-size: 30rpx;
}

.picker-item.selected {
  background: #f5f7fa;
}

.check-icon {
  color: #667eea;
  font-weight: bold;
}

.picker-footer {
  padding: 20rpx 30rpx;
  border-top: 1rpx solid #eee;
}

.picker-footer .btn-primary {
  width: 100%;
  height: 80rpx;
  border-radius: 40rpx;
}

.form-tip {
  display: block;
  font-size: 22rpx;
  color: #999;
  margin-top: 8rpx;
  line-height: 1.4;
}
.lesson-points-info {
  display: flex;
  flex-wrap: wrap;
  gap: 12rpx;
  margin-top: 12rpx;
  padding-left: 0;
}
.info-chip {
  font-size: 22rpx;
  padding: 6rpx 16rpx;
  border-radius: 20rpx;
  background: #e6f7ff;
  color: #1890ff;
  border: 1rpx solid #91d5ff;
}
.info-chip.off {
  background: #f5f5f5;
  color: #999;
  border-color: #e8e8e8;
}
.info-chip.warn {
  background: #fff7e6;
  color: #fa8c16;
  border-color: #ffd591;
}
</style>
