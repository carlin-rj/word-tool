// 导入存储适配器
import { getItem, setItem, removeItem } from './storageAdapter.js';

// 默认词库
const defaultWordBank = `aunt [ɑ:nt]  
n. 阿姨; 姑妈等
card [kɑ:d]  
n. 卡片; 名片; 纸牌
fold [fəuld]  
v. 折叠; 折起来; 合拢 n. 褶;...
grandfather [ˈɡrændˌfɑ:ðə]  
n. 祖父; 外祖父`;

// 应用状态
let appState = {
    wordBank: [],
    taggedWordBanks: {}, // 带标签的词库
    currentMode: 1, // 1: 根据解释默写英语, 2: 根据英语写解释
    currentWordIndex: 0,
    stats: {
        correct: 0,
        wrong: 0
    },
    currentQuestion: null,
    currentWordForSpeaking: null, // 用于朗读的当前单词
    waitingForNext: false,
    examMode: false, // 考试模式
    usedWords: [], // 已使用的单词索引
    wrongWords: [], // 错题本
    currentWordBank: [], // 当前使用的词库
    currentTag: null, // 当前标签
    examRecords: [] // 考试记录
};

// DOM元素
const elements = {
    mode1Btn: document.getElementById('mode1'),
    mode2Btn: document.getElementById('mode2'),
    wordBankSection: document.getElementById('word-bank-section'),
    practiceSection: document.getElementById('practice-section'),
    wordBankTextarea: document.getElementById('wordBank'),
    saveWordBankBtn: document.getElementById('saveWordBank'),
    questionDiv: document.getElementById('question'),
    answerInput: document.getElementById('answer'),
    checkAnswerBtn: document.getElementById('checkAnswer'),
    nextWordBtn: document.getElementById('nextWord'),
    resultDiv: document.getElementById('result'),
    correctCount: document.getElementById('correctCount'),
    wrongCount: document.getElementById('wrongCount'),
    examControls: document.getElementById('exam-controls'),
    startExamBtn: document.getElementById('startExam'),
    viewWrongWordsBtn: document.getElementById('viewWrongWords'),
    wrongWordsModal: document.getElementById('wrong-words-modal'),
    wrongWordsList: document.getElementById('wrong-words-list'),
    closeModal: document.querySelector('.close'),
    tagNameInput: document.getElementById('tagName'),
    addTagBtn: document.getElementById('addTag'),
    tagsList: document.getElementById('tags-list'),
    progressText: document.getElementById('progress-text'),
    endExamBtn: document.getElementById('endExam'),
    viewExamHistoryBtn: document.getElementById('viewExamHistory'),
    examHistoryModal: document.getElementById('exam-history-modal'),
    examHistoryList: document.getElementById('exam-history-list'),
    closeHistoryModal: document.querySelector('.close-history'),
    enterExamModeBtn: document.getElementById('enterExamMode'),
    manageWordBankBtn: document.getElementById('manageWordBank'),
    tagSelectionModal: document.getElementById('tag-selection-modal'),
    tagSelectorModal: document.getElementById('tagSelectorModal'),
    confirmTagSelectionBtn: document.getElementById('confirmTagSelection'),
    closeTagSelectionModal: document.querySelector('.close-tag-selection'),
    speakBtn: document.getElementById('speakBtn'),
    clearWrongWordsBtn: document.getElementById('clearWrongWords')
};

// 解析词库文本
function parseWordBank(text) {
    const lines = text.trim().split('\n');
    const words = [];
    let i = 0;
    
    while (i < lines.length) {
        const englishLine = lines[i].trim();
        if (englishLine && !englishLine.startsWith('n.') && !englishLine.startsWith('v.')) {
            const explanationLine = lines[i + 1] ? lines[i + 1].trim() : '';
            if (explanationLine) {
                // 提取英语单词和音标
                const englishMatch = englishLine.match(/^([a-zA-Z\- ]+?)(?:\s+(\[[^\]]+\]))?$/);
                if (englishMatch) {
                    const english = englishMatch[1];
                    const phonetic = englishMatch[2] || '';
                    
                    words.push({
                        english: english.trim(),
                        phonetic: phonetic,
                        explanation: explanationLine,
                        wrongCount: 0 // 错误次数
                    });

                }
                i += 2;
            } else {
                i++;
            }
        } else {
            i++;
        }
    }
    
    return words;
}

// 初始化应用
async function initApp() {
    // 检查本地存储中是否有词库
    const savedWordBank = await getItem('wordBank');
    if (savedWordBank) {
        elements.wordBankTextarea.value = savedWordBank;
        appState.wordBank = parseWordBank(savedWordBank);
    } else {
        elements.wordBankTextarea.value = defaultWordBank;
        appState.wordBank = parseWordBank(defaultWordBank);
    }
    
    // 检查本地存储中的带标签词库
    const savedTaggedWordBanks = await getItem('taggedWordBanks');
    if (savedTaggedWordBanks) {
        appState.taggedWordBanks = typeof savedTaggedWordBanks === 'string' ? 
            JSON.parse(savedTaggedWordBanks) : savedTaggedWordBanks;
    } else {
        // 初始化默认标签
        appState.taggedWordBanks = {
            "错题本": [],
            "系统默认": appState.wordBank
        };
        await setItem('taggedWordBanks', JSON.stringify(appState.taggedWordBanks));
    }
    
    // 检查本地存储中的统计数据
    const savedStats = await getItem('stats');
    if (savedStats) {
        appState.stats = typeof savedStats === 'string' ? 
            JSON.parse(savedStats) : savedStats;
        updateStatsDisplay();
    }
    
    // 检查本地存储中的错题本
    const savedWrongWords = await getItem('wrongWords');
    if (savedWrongWords) {
        appState.wrongWords = typeof savedWrongWords === 'string' ? 
            JSON.parse(savedWrongWords) : savedWrongWords;
        // 更新错题本标签
        appState.taggedWordBanks["错题本"] = appState.wrongWords;
        await setItem('taggedWordBanks', JSON.stringify(appState.taggedWordBanks));
    }
    
    // 检查本地存储中的考试记录
    const savedExamRecords = await getItem('examRecords');
    if (savedExamRecords) {
        appState.examRecords = typeof savedExamRecords === 'string' ? 
            JSON.parse(savedExamRecords) : savedExamRecords;
    }
    
    // 绑定事件
    bindEvents();
    
    // 显示标签列表
    renderTags();


    showExamControls();

    // updateTagSelector();
    
    // 始终显示词库管理界面
    // showWordBankSection();

}

// 显示词库管理界面
function showWordBankSection() {
    elements.wordBankSection.style.display = 'block';
    elements.examControls.style.display = 'none';
    elements.practiceSection.style.display = 'none';
}

// 绑定事件
function bindEvents() {
    // 模式切换
    elements.mode1Btn.addEventListener('click', () => switchMode(1));
    elements.mode2Btn.addEventListener('click', () => switchMode(2));
    
    // 保存词库
    elements.saveWordBankBtn.addEventListener('click', saveWordBank);
    
    // 标签管理
    elements.addTagBtn.addEventListener('click', addTag);
    
    // 考试控制按钮
    elements.startExamBtn.addEventListener('click', showTagSelection);
    elements.viewWrongWordsBtn.addEventListener('click', viewWrongWords);
    elements.viewExamHistoryBtn.addEventListener('click', viewExamHistory);
    elements.enterExamModeBtn.addEventListener('click', showExamControls);
    elements.manageWordBankBtn.addEventListener('click', showWordBankSection);
    
    // 标签选择模态框
    elements.confirmTagSelectionBtn.addEventListener('click', startExamWithSelectedTag);
    elements.closeTagSelectionModal.addEventListener('click', () => {
        elements.tagSelectionModal.style.display = 'none';
    });
    
    window.addEventListener('click', (event) => {
        if (event.target == elements.tagSelectionModal) {
            elements.tagSelectionModal.style.display = 'none';
        }
        if (event.target == elements.wrongWordsModal) {
            elements.wrongWordsModal.style.display = 'none';
        }
        if (event.target == elements.examHistoryModal) {
            elements.examHistoryModal.style.display = 'none';
        }
    });
    
    // 结束考试
    elements.endExamBtn.addEventListener('click', endExam);
    
    // 朗读功能
    elements.speakBtn.addEventListener('click', speakCurrentWord);
    
    // 检查答案
    elements.checkAnswerBtn.addEventListener('click', checkAnswer);
    
    // 下一个单词
    elements.nextWordBtn.addEventListener('click', nextWord);

    // 清理错题
    elements.clearWrongWordsBtn.addEventListener('click', cleanWrongWords);
    
    // 回车键检查答案
    elements.answerInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') {
            if (appState.waitingForNext) {
                // 如果正在等待下一个单词，则直接进入下一个
                nextWord();
                appState.waitingForNext = false;
            } else {
                // 否则检查答案
                checkAnswer();
            }
        }
    });
}

// 载入标签内容到编辑器
function loadTagContent(tag) {
    appState.currentTag = tag;
    const wordBank = appState.taggedWordBanks[tag];
    
    if (!wordBank) {
        alert('该标签下没有词库内容！');
        return;
    }
    
    // 更新词库文本框显示
    let wordBankText = '';
    wordBank.forEach(word => {
        wordBankText += `${word.english} ${word.phonetic}\n${word.explanation}\n\n`;
    });
    
    elements.wordBankTextarea.value = wordBankText.trim();
    
    // 更新标签视觉标识
    updateTagActiveState(tag);
    
    alert(`已载入标签 "${tag}" 的词库内容，您可以进行编辑`);
}

// 更新标签激活状态的视觉标识
function updateTagActiveState(activeTag) {
    // 移除所有标签的激活状态
    document.querySelectorAll('.tag-item').forEach(item => {
        item.classList.remove('active');
    });
    
    // 为当前标签添加激活状态
    document.querySelectorAll('.tag-name').forEach(tagNameElement => {
        if (tagNameElement.textContent === activeTag) {
            tagNameElement.parentElement.classList.add('active');
        }
    });
}

// 渲染标签列表
function renderTags() {
    elements.tagsList.innerHTML = '';
    
    Object.keys(appState.taggedWordBanks).forEach(tag => {
        const tagElement = document.createElement('div');
        tagElement.className = 'tag-item';
        // 如果是当前标签，添加激活状态
        if (appState.currentTag === tag) {
            tagElement.classList.add('active');
        }
        tagElement.innerHTML = `
            <span class="tag-name">${tag}</span>
            ${tag !== "错题本" ? `<button data-tag="${tag}" class="remove-tag">×</button>` : ''}
        `;
        elements.tagsList.appendChild(tagElement);
        
        // 为标签名添加点击事件
        const tagNameElement = tagElement.querySelector('.tag-name');
        tagNameElement.addEventListener('click', () => loadTagContent(tag));
    });
    
    // 绑定删除标签事件
    document.querySelectorAll('.remove-tag').forEach(button => {
        button.addEventListener('click', (e) => {
            e.stopPropagation();
            const tag = button.getAttribute('data-tag');
            removeTag(tag);
        });
    });
}

// 更新标签选择器
function updateTagSelector() {
    elements.tagSelector.innerHTML = '';
    
    Object.keys(appState.taggedWordBanks).forEach(tag => {
        const option = document.createElement('option');
        option.value = tag;
        option.textContent = tag;
        elements.tagSelector.appendChild(option);
    });
}

// 添加标签
async function addTag() {
    const tagName = elements.tagNameInput.value.trim();
    if (!tagName) {
        alert('请输入标签名称！');
        return;
    }
    
    if (appState.taggedWordBanks[tagName]) {
        alert('标签已存在！');
        return;
    }
    
    const wordBankText = elements.wordBankTextarea.value.trim();
    if (!wordBankText) {
        alert('请输入词库内容！');
        return;
    }
    
    const wordBank = parseWordBank(wordBankText);
    appState.taggedWordBanks[tagName] = wordBank;
    
    // 保存到存储
    await setItem('taggedWordBanks', JSON.stringify(appState.taggedWordBanks));
    
    // 清空输入框
    elements.tagNameInput.value = '';
    
    // 更新标签列表和选择器
    renderTags();
    updateTagSelector();
    
    alert('标签添加成功！');
}

// 删除标签
async function removeTag(tag) {
    if (confirm(`确定要删除标签 "${tag}" 吗？`)) {
        delete appState.taggedWordBanks[tag];
        
        // 保存到存储
        await setItem('taggedWordBanks', JSON.stringify(appState.taggedWordBanks));
        
        // 更新标签列表和选择器
        renderTags();
        updateTagSelector();
    }
}

// 载入选中的标签
function loadSelectedTag() {
    const selectedTag = elements.tagSelector.value;
    if (!selectedTag) {
        alert('请选择一个标签！');
        return;
    }
    
    appState.currentTag = selectedTag;
    const wordBank = appState.taggedWordBanks[selectedTag];
    
    if (!wordBank || wordBank.length === 0) {
        alert('该标签下没有词库内容！');
        return;
    }
    
    // 更新词库文本框显示
    let wordBankText = '';
    wordBank.forEach(word => {
        wordBankText += `${word.english} ${word.phonetic}\n${word.explanation}\n\n`;
    });
    
    elements.wordBankTextarea.value = wordBankText.trim();
    alert(`已载入标签 "${selectedTag}" 的词库内容`);
}

// 切换模式
function switchMode(mode) {
    appState.currentMode = mode;
    
    // 更新按钮状态
    elements.mode1Btn.classList.toggle('active', mode === 1);
    elements.mode2Btn.classList.toggle('active', mode === 2);
    
    // 如果在练习模式中，生成新问题
    if (appState.examMode) {
        generateQuestion();
    }
}

// 保存词库
async function saveWordBank() {
    const wordBankText = elements.wordBankTextarea.value.trim();
    if (!wordBankText) {
        alert('请输入词库内容！');
        return;
    }
    
    appState.wordBank = parseWordBank(wordBankText);
    
    // 保存到存储
    await setItem('wordBank', wordBankText);
    
    // 如果有当前标签，也更新该标签的词库
    if (appState.currentTag && appState.currentTag !== "错题本") {
        appState.taggedWordBanks[appState.currentTag] = appState.wordBank;
        await setItem('taggedWordBanks', JSON.stringify(appState.taggedWordBanks));
        
        // 更新标签列表以反映更改
        renderTags();
    } else {
        // 默认保存到系统默认标签
        appState.taggedWordBanks["系统默认"] = appState.wordBank;
        await setItem('taggedWordBanks', JSON.stringify(appState.taggedWordBanks));
        
        // 更新标签列表以反映更改
        renderTags();
    }
    
    // 显示考试控制界面
    showExamControls();
    
    // 重置统计数据
    appState.stats = { correct: 0, wrong: 0 };
    await setItem('stats', JSON.stringify(appState.stats));
    updateStatsDisplay();
    
    alert('词库保存成功！');
}

// 显示考试控制界面
function showExamControls() {
    elements.wordBankSection.style.display = 'none';
    elements.examControls.style.display = 'block';
    elements.practiceSection.style.display = 'none';
}

// 开始考试
function startExam() {
    // 如果没有选择标签，使用系统默认词库
    if (!appState.currentTag) {
        appState.currentTag = "系统默认";
        appState.taggedWordBanks[appState.currentTag] = appState.wordBank;
        setItem('taggedWordBanks', JSON.stringify(appState.taggedWordBanks));
    }
    
    const wordBank = appState.taggedWordBanks[appState.currentTag];
    
    if (!wordBank || wordBank.length === 0) {
        alert('当前标签下没有词库内容！');
        return;
    }
    
    appState.examMode = true;
    appState.currentWordBank = [...wordBank]; // 复制词库
    appState.usedWords = []; // 重置已使用单词列表
    appState.examStartTime = new Date(); // 记录考试开始时间
    
    // 显示练习界面
    elements.examControls.style.display = 'none';
    elements.practiceSection.style.display = 'block';
    
    // 重置统计数据
    appState.stats = { correct: 0, wrong: 0 };
    updateStatsDisplay();
    updateProgress();
    
    // 生成第一个问题
    generateQuestion();
}

// 载入错题本
function loadWrongWords() {
    if (appState.wrongWords.length === 0) {
        alert('错题本为空！');
        return;
    }
    
    appState.examMode = true;
    appState.currentWordBank = [...appState.wrongWords]; // 使用错题本作为词库
    appState.usedWords = []; // 重置已使用单词列表
    appState.currentTag = "错题本"; // 设置当前标签
    appState.examStartTime = new Date(); // 记录考试开始时间
    
    // 显示练习界面
    elements.examControls.style.display = 'none';
    elements.practiceSection.style.display = 'block';
    
    // 重置统计数据
    appState.stats = { correct: 0, wrong: 0 };
    updateStatsDisplay();
    updateProgress();
    
    // 生成第一个问题
    generateQuestion();
}

// 查看错题本
function viewWrongWords() {
    if (appState.wrongWords.length === 0) {
        elements.wrongWordsList.innerHTML = '<p>错题本为空</p>';
    } else {
        let html = '<h3>错题列表</h3>';
        appState.wrongWords.forEach((word, index) => {
            html += `
                <div class="wrong-word-item">
                    <p><strong>${word.english}</strong> ${word.phonetic}</p>
                    <p>${word.explanation}</p>
                    <p>错误次数: <span class="wrong-count">${word.wrongCount}</span></p>
                </div>
            `;
        });
        elements.wrongWordsList.innerHTML = html;
    }
    
    elements.wrongWordsModal.style.display = 'block';
}

// 查看考试记录
function viewExamHistory() {
    if (appState.examRecords.length === 0) {
        elements.examHistoryList.innerHTML = '<p>暂无考试记录</p>';
    } else {
        let html = '<h3>考试记录</h3>';
        // 按时间倒序排列
        const sortedRecords = [...appState.examRecords].sort((a, b) => 
            new Date(b.timestamp) - new Date(a.timestamp)
        );
        
        sortedRecords.forEach(record => {
            const date = new Date(record.timestamp);
            const dateString = `${date.getFullYear()}年${date.getMonth()+1}月${date.getDate()}日 ${date.getHours()}:${String(date.getMinutes()).padStart(2, '0')}`;
            
            html += `
                <div class="exam-record-item">
                    <h4>${record.tag} - ${dateString}</h4>
                    <div class="exam-stats">
                        <span>正确: ${record.correct}</span>
                        <span>错误: ${record.wrong}</span>
                        <span>正确率: ${record.accuracy}%</span>
                    </div>
                </div>
            `;
        });
        elements.examHistoryList.innerHTML = html;
    }
    
    elements.examHistoryModal.style.display = 'block';
}

// 更新进度显示
function updateProgress() {
    if (appState.examMode) {
        const total = appState.currentWordBank.length;
        const used = appState.usedWords.length;
        elements.progressText.textContent = `进度: ${used}/${total}`;
    }
}

// 生成问题
function generateQuestion() {
    if (appState.currentWordBank.length === 0) {
        // 词库为空，结束考试
        finishExam();
        return;
    }
    
    // 过滤掉已使用的单词
    const availableWords = appState.currentWordBank.filter((word, index) => 
        !appState.usedWords.includes(index)
    );
    
    if (availableWords.length === 0) {
        // 所有单词都已使用，结束考试
        finishExam();
        return;
    }
    
    // 随机选择一个单词
    const randomIndex = Math.floor(Math.random() * availableWords.length);
    const selectedWord = availableWords[randomIndex];
    
    // 找到在原词库中的索引
    appState.currentWordIndex = appState.currentWordBank.findIndex(word => 
        word.english === selectedWord.english && 
        word.explanation === selectedWord.explanation
    );
    
    // 标记为已使用
    appState.usedWords.push(appState.currentWordIndex);
    
    // 更新进度显示
    updateProgress();
    
    // 根据模式生成问题
    if (appState.currentMode === 1) {
        // 根据解释默写英语
        elements.questionDiv.innerHTML = `
            <div>
                <p><strong>请写出下列单词的英语：</strong></p>
                <p>${selectedWord.explanation}</p>
            </div>
        `;
        appState.currentQuestion = selectedWord.english;
        appState.currentWordForSpeaking = selectedWord.english; // 保存用于朗读的单词
    } else {
        // 根据英语写解释
        elements.questionDiv.innerHTML = `
            <div>
                <p><strong>请写出下列单词的解释：</strong></p>
                <p>${selectedWord.english} ${selectedWord.phonetic}</p>
            </div>
        `;
        appState.currentQuestion = selectedWord.explanation;
        appState.currentWordForSpeaking = selectedWord.english; // 保存用于朗读的单词
    }
    
    // 清空答案和结果
    elements.answerInput.value = '';
    elements.resultDiv.textContent = '';
    elements.resultDiv.className = '';
    
    // 聚焦到输入框
    elements.answerInput.focus();

    setTimeout(() => {
        speakCurrentWord();
    }, 500);
}

// 朗读当前单词
function speakCurrentWord() {
    if (!appState.currentWordForSpeaking) {
        alert('没有可朗读的单词');
        return;
    }
    
    // 检查浏览器是否支持语音合成
    if ('speechSynthesis' in window) {
        console.log(appState.currentWordForSpeaking)
        
        const msg = new SpeechSynthesisUtterance(appState.currentWordForSpeaking.toLowerCase());
        msg.lang = "en-US";
        msg.rate = 0.8; // 语速稍慢一些
        msg.pitch = 1; // 音调正常
        window.speechSynthesis.speak(msg);
    } else {
        console.warn('您的浏览器不支持语音朗读功能');
    }
}

// 结束考试
function endExam() {
    if (confirm('确定要结束本次考试吗？')) {
        finishExam();
    }
}

// 结束考试
async function finishExam() {
    // 记录考试结果
    if (appState.examMode && (appState.stats.correct > 0 || appState.stats.wrong > 0)) {
        const total = appState.stats.correct + appState.stats.wrong;
        const accuracy = total > 0 ? Math.round((appState.stats.correct / total) * 100) : 0;
        
        const examRecord = {
            tag: appState.currentTag || "未知",
            timestamp: new Date().toISOString(),
            correct: appState.stats.correct,
            wrong: appState.stats.wrong,
            accuracy: accuracy
        };
        
        appState.examRecords.push(examRecord);
        
        // 保存考试记录到存储
        await setItem('examRecords', JSON.stringify(appState.examRecords));
    }
    
    elements.practiceSection.style.display = 'none';
    elements.examControls.style.display = 'block';
    appState.examMode = false;
    
    if (appState.stats.correct > 0 || appState.stats.wrong > 0) {
        const total = appState.stats.correct + appState.stats.wrong;
        const accuracy = total > 0 ? Math.round((appState.stats.correct / total) * 100) : 0;
        
        alert(`考试结束！
正确: ${appState.stats.correct}
错误: ${appState.stats.wrong}
正确率: ${accuracy}%`);
    }
}

// 检查答案
function checkAnswer() {
    const userAnswer = elements.answerInput.value.trim().toLowerCase();
    const correctAnswer = appState.currentQuestion.toLowerCase();
    
    if (!userAnswer) {
        alert('请输入答案！');
        return;
    }
    
    let isCorrect = false;
    
    if (appState.currentMode === 1) {
        // 英语默写模式：严格匹配
        isCorrect = userAnswer === correctAnswer;
    } else {
        // 解释模式：相似即可
        isCorrect = isSimilarAnswer(userAnswer, correctAnswer);
    }
    
    // 更新统计数据
    if (isCorrect) {
        appState.stats.correct++;
        elements.resultDiv.textContent = '正确！';
        elements.resultDiv.className = 'correct';
        
        // 正确后自动进入下一个单词
        setTimeout(() => {
            nextWord();
        }, 1000);
    } else {
        appState.stats.wrong++;
        elements.resultDiv.innerHTML = `错误！正确答案是：<strong>${appState.currentQuestion}</strong>`;
        elements.resultDiv.className = 'incorrect';
        
        // 将错误单词加入错题本
        addToWrongWords();
        
        // 答错时添加标记，表示需要等待用户按回车或点击下一个按钮
        appState.waitingForNext = true;
    }
    
    // 保存统计数据到本地存储
    setItem('stats', JSON.stringify(appState.stats));
    updateStatsDisplay();
}

// 添加到错题本
async function addToWrongWords() {
    const currentWord = appState.currentWordBank[appState.currentWordIndex];
    
    // 检查是否已在错题本中
    const existingIndex = appState.wrongWords.findIndex(word => 
        word.english === currentWord.english && 
        word.explanation === currentWord.explanation
    );
    
    if (existingIndex >= 0) {
        // 已存在，增加错误次数
        appState.wrongWords[existingIndex].wrongCount++;
    } else {
        // 不存在，添加到错题本
        const wrongWord = {...currentWord, wrongCount: 1};
        appState.wrongWords.push(wrongWord);
    }
    
    // 更新错题本标签
    appState.taggedWordBanks["错题本"] = appState.wrongWords;
    
    // 保存错题本到存储
    await setItem('wrongWords', JSON.stringify(appState.wrongWords));
    await setItem('taggedWordBanks', JSON.stringify(appState.taggedWordBanks));
}

//清除错题本
async function cleanWrongWords() {
    appState.wrongWords = [];
    await setItem('wrongWords', JSON.stringify(appState.wrongWords));

    //删除错题本标签
    delete appState.taggedWordBanks["错题本"];
    await setItem('taggedWordBanks', JSON.stringify(appState.taggedWordBanks));
}

// 判断解释是否相似
function isSimilarAnswer(userAnswer, correctAnswer) {
    const clean = (s) => {
        return s
            .toLowerCase()
            // 去掉词性标注，如 adj., n., vt., adv., pron. 等
            .replace(/\b(adj|adv|n|vt|vi|prep|conj|pron|num|art|int)\.?/g, '')
            // 去掉符号、&、分号、空格等
            .replace(/[&;，。、\s]+/g, '')
            // 去掉非中英文字符
            .replace(/[^a-zA-Z\u4e00-\u9fa5]/g, '')
            .trim();
    };

    const a = clean(userAnswer);
    const b = clean(correctAnswer);

    if (!a || !b) return false;
    if (a === b) return true;

    // 如果用户答案包含在正确答案的核心内容中，算正确
    if (b.includes(a) || a.includes(b)) return true;

    // 计算相似度（Levenshtein距离可选）
    const distance = levenshtein(a, b);
    const similarity = 1 - distance / Math.max(a.length, b.length);
    return similarity > 0.7; // 超过70%相似算对
}

function levenshtein(a, b) {
    const dp = Array.from({ length: a.length + 1 }, () => Array(b.length + 1).fill(0));
    for (let i = 0; i <= a.length; i++) dp[i][0] = i;
    for (let j = 0; j <= b.length; j++) dp[0][j] = j;
    for (let i = 1; i <= a.length; i++) {
        for (let j = 1; j <= b.length; j++) {
            const cost = a[i - 1] === b[j - 1] ? 0 : 1;
            dp[i][j] = Math.min(
                dp[i - 1][j] + 1,
                dp[i][j - 1] + 1,
                dp[i - 1][j - 1] + cost
            );
        }
    }
    return dp[a.length][b.length];
}
// 更新统计数据显示
function updateStatsDisplay() {
    elements.correctCount.textContent = appState.stats.correct;
    elements.wrongCount.textContent = appState.stats.wrong;
}

// 下一个单词
function nextWord() {
    generateQuestion();
    appState.waitingForNext = false;
}

// 显示标签选择模态框
function showTagSelection() {
    // 更新标签选择器
    elements.tagSelectorModal.innerHTML = '';
    
    Object.keys(appState.taggedWordBanks).forEach(tag => {
        const option = document.createElement('option');
        option.value = tag;
        option.textContent = tag;
        elements.tagSelectorModal.appendChild(option);
    });
    
    elements.tagSelectionModal.style.display = 'block';
}

// 使用选中的标签开始考试
function startExamWithSelectedTag() {
    const selectedTag = elements.tagSelectorModal.value;
    if (!selectedTag) {
        alert('请选择一个标签！');
        return;
    }
    
    appState.currentTag = selectedTag;
    const wordBank = appState.taggedWordBanks[selectedTag];
    
    if (!wordBank || wordBank.length === 0) {
        alert('该标签下没有词库内容！');
        return;
    }
    
    appState.examMode = true;
    appState.currentWordBank = [...wordBank]; // 复制词库
    appState.usedWords = []; // 重置已使用单词列表
    appState.examStartTime = new Date(); // 记录考试开始时间
    
    // 关闭模态框
    elements.tagSelectionModal.style.display = 'none';
    
    // 显示练习界面
    elements.examControls.style.display = 'none';
    elements.practiceSection.style.display = 'block';
    
    // 重置统计数据
    appState.stats = { correct: 0, wrong: 0 };
    updateStatsDisplay();
    updateProgress();
    
    // 生成第一个问题
    generateQuestion();
}

// 页面加载完成后初始化应用
document.addEventListener('DOMContentLoaded', initApp);