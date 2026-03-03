// 核心元素获取
const modelBtns = document.querySelectorAll('.model-btn');
const typeBtns = document.querySelectorAll('.type-btn');
const inputWraps = document.querySelectorAll('.input-wrap');
const promptInput = document.getElementById('prompt-input');
const imageUpload = document.getElementById('image-upload');
const imagePreview = document.getElementById('image-preview');
const previewBox = document.querySelector('.preview-box');
const uploadPlaceholder = document.querySelector('.upload-placeholder');
const removeImgBtn = document.querySelector('.remove-img');
const temperatureSlider = document.getElementById('temperature');
const tempValue = document.getElementById('temp-value');
const maxTokensSlider = document.getElementById('max-tokens');
const tokensValue = document.getElementById('tokens-value');
const submitBtn = document.getElementById('submit-btn');
const clearBtn = document.getElementById('clear-btn');
const loadingWrap = document.querySelector('.loading-wrap');
const outputContent = document.getElementById('output-content');
const copyBtn = document.getElementById('copy-btn');
const downloadBtn = document.getElementById('download-btn');

// 当前选中的模型和输入类型
let currentModel = 'nanobanana';
let currentInputType = 'text';

// AI模型API配置（后续替换为真实API地址和密钥）
const API_CONFIG = {
    nanobanana: {
        url: 'https://api.nanobanana.com/v1/chat/completions', // 替换为真实地址
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': 'Bearer YOUR_NANOBANANA_API_KEY' // 替换为你的API Key
        }
    },
    seedance2: {
        url: 'https://api.seedance.com/v2/generate', // 替换为真实地址
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': 'Bearer YOUR_SEEDANCE_API_KEY' // 替换为你的API Key
        }
    },
    gemini3: {
        url: 'https://api.gemini.com/v3/text/generate', // 替换为中转地址
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'X-API-Key': 'YOUR_GEMINI_API_KEY' // 替换为你的API Key
        }
    },
    custom: {
        url: '', // 自定义模型API地址
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        }
    }
};

// 1. 模型切换逻辑
modelBtns.forEach(btn => {
    btn.addEventListener('click', () => {
        // 移除所有active类
        modelBtns.forEach(b => b.classList.remove('active'));
        // 给当前点击的按钮添加active
        btn.classList.add('active');
        // 更新当前模型
        currentModel = btn.dataset.model;
    });
});

// 2. 输入类型切换逻辑
typeBtns.forEach(btn => {
    btn.addEventListener('click', () => {
        // 移除所有active类
        typeBtns.forEach(b => b.classList.remove('active'));
        // 给当前点击的按钮添加active
        btn.classList.add('active');
        // 更新当前输入类型
        currentInputType = btn.dataset.type;
        // 切换输入面板显示
        inputWraps.forEach(wrap => {
            wrap.classList.remove('active');
            if (wrap.classList.contains(`${currentInputType}-input`)) {
                wrap.classList.add('active');
            }
        });
    });
});

// 3. 图片上传预览逻辑
imageUpload.addEventListener('change', (e) => {
    const file = e.target.files[0];
    if (file) {
        const reader = new FileReader();
        reader.onload = (e) => {
            imagePreview.src = e.target.result;
            uploadPlaceholder.classList.add('hidden');
            previewBox.classList.remove('hidden');
        };
        reader.readAsDataURL(file);
    }
});

// 移除图片
removeImgBtn.addEventListener('click', () => {
    imageUpload.value = '';
    imagePreview.src = '';
    previewBox.classList.add('hidden');
    uploadPlaceholder.classList.remove('hidden');
});

// 4. 参数滑块值实时更新
temperatureSlider.addEventListener('input', () => {
    tempValue.textContent = temperatureSlider.value;
});

maxTokensSlider.addEventListener('input', () => {
    tokensValue.textContent = maxTokensSlider.value;
});

// 5. 清空内容逻辑
clearBtn.addEventListener('click', () => {
    // 清空文本输入
    promptInput.value = '';
    // 清空图片输入
    imageUpload.value = '';
    imagePreview.src = '';
    previewBox.classList.add('hidden');
    uploadPlaceholder.classList.remove('hidden');
    // 清空输出
    outputContent.innerHTML = `
        <div class="empty-state">
            <i class="bi bi-lightbulb"></i>
            <p>选择模型并输入需求，点击「立即生成」查看结果</p>
        </div>
    `;
});

// 6. 复制结果逻辑
copyBtn.addEventListener('click', async () => {
    // 排除空状态
    if (outputContent.querySelector('.empty-state')) {
        alert('暂无内容可复制');
        return;
    }
    try {
        await navigator.clipboard.writeText(outputContent.textContent);
        alert('复制成功！');
    } catch (err) {
        alert('复制失败，请手动复制');
        console.error('复制失败：', err);
    }
});

// 7. 下载结果逻辑
downloadBtn.addEventListener('click', () => {
    // 排除空状态
    if (outputContent.querySelector('.empty-state')) {
        alert('暂无内容可下载');
        return;
    }
    // 创建Blob对象
    const blob = new Blob([outputContent.textContent], { type: 'text/plain' });
    // 创建下载链接
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = `AI生成结果_${currentModel}_${new Date().getTime()}.txt`;
    // 触发下载
    a.click();
    // 释放URL
    URL.revokeObjectURL(a.href);
});

// 8. 核心：提交生成请求（接入API的核心逻辑）
submitBtn.addEventListener('click', async () => {
    // 校验输入
    if (currentInputType === 'text' && !promptInput.value.trim()) {
        alert('请输入文本需求！');
        return;
    }
    if (currentInputType === 'image' && !imageUpload.files.length) {
        alert('请上传图片！');
        return;
    }

    // 显示加载状态
    loadingWrap.classList.remove('hidden');
    // 清空之前的输出
    outputContent.innerHTML = '';

    try {
        // 获取当前模型的API配置
        const apiConfig = API_CONFIG[currentModel];
        if (!apiConfig.url) {
            throw new Error('当前模型未配置API地址，请先完善配置！');
        }

        // 构造请求参数（不同模型参数格式需按官方文档调整）
        let requestData = {
            prompt: currentInputType === 'text' ? promptInput.value.trim() : '',
            temperature: parseFloat(temperatureSlider.value),
            max_tokens: parseInt(maxTokensSlider.value)
        };

        // 图片输入额外处理（示例：转Base64）
        if (currentInputType === 'image') {
            const file = imageUpload.files[0];
            const base64 = await convertFileToBase64(file);
            requestData.image = base64;
        }

        // 调用API
        const response = await fetch(apiConfig.url, {
            method: apiConfig.method,
            headers: apiConfig.headers,
            body: JSON.stringify(requestData)
        });

        // 处理响应
        if (!response.ok) {
            throw new Error(`API调用失败：${response.status} ${response.statusText}`);
        }

        const result = await response.json();

        // 解析结果（不同模型返回格式不同，需适配）
        let aiResult = '';
        switch (currentModel) {
            case 'nanobanana':
                aiResult = result.choices?.[0]?.message?.content || '生成失败，请重试';
                break;
            case 'seedance2':
                aiResult = result.data?.description || '生成失败，请重试';
                break;
            case 'gemini3':
                aiResult = result.content || '生成失败，请重试';
                break;
            default:
                aiResult = result.result || '生成失败，请重试';
        }

        // 展示结果
        outputContent.textContent = aiResult;

    } catch (error) {
        // 错误处理
        outputContent.innerHTML = `<div class="empty-state"><i class="bi bi-exclamation-triangle"></i><p>调用出错：${error.message}</p></div>`;
        console.error('生成失败：', error);
    } finally {
        // 隐藏加载状态
        loadingWrap.classList.add('hidden');
    }
});

// 工具函数：文件转Base64
function convertFileToBase64(file) {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = (e) => resolve(e.target.result);
        reader.onerror = (err) => reject(err);
        reader.readAsDataURL(file);
    });
}