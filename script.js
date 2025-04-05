document.addEventListener('DOMContentLoaded', function() {
    // 全局变量
    let currentStep = 1;
    let addedReagents = new Set();
    let pcrRunning = false;
    let pcrInterval;
    let pcrProgress = 0;
    let currentCycle = 0;
    let totalTime = 0;
    let remainingTime = 0;
    let pcrSettings = {};
    let selectedSpecies = null; // 新增：用于存储当前选择的物种
    let uraniumAdded = false; // 新增：标记是否添加了铀
    
    // DNA可视化相关变量
    let dnaCanvas;
    let dnaCtx;
    let dnaAnimationFrame;
    let currentDnaStage = 'none'; // 'none', 'denaturation', 'annealing', 'extension'
    
    // DNA选取和引物相关变量
    let traits = []; // 存储所有可选性状
    let selectedTrait = null; // 当前选中的性状
    let primerCorrect = false; // 引物是否设计正确
    
    // 初始化
    updateStepTitle();
    initDnaVisualization();
    initTraits();
    initSpeciesSelection(); // 新增：初始化物种选择
    
    // 初始化DNA可视化
    function initDnaVisualization() {
        dnaCanvas = document.getElementById('dna-canvas');
        if (dnaCanvas) {
            dnaCtx = dnaCanvas.getContext('2d');
            // 初始绘制双链DNA
            drawDoubleDNA();
        }
    }
    
    // 绘制双链DNA
    function drawDoubleDNA() {
        if (!dnaCtx) return;
        
        // 清空画布
        dnaCtx.clearRect(0, 0, dnaCanvas.width, dnaCanvas.height);
        
        const centerY = dnaCanvas.height / 2;
        const startX = 50;
        const endX = dnaCanvas.width - 50;
        
        // 绘制DNA双链
        drawDNAHelix(startX, endX, centerY);
        
        // 文字说明
        dnaCtx.fillStyle = '#333';
        dnaCtx.font = '14px Arial';
        dnaCtx.textAlign = 'center';
        dnaCtx.fillText('DNA双螺旋结构', dnaCanvas.width / 2, 30);
    }
    
    // 函数：绘制DNA螺旋
    function drawDNAHelix(startX, endX, centerY) {
        const amplitude = 40; // 螺旋振幅
        const frequency = 0.05; // 频率
        const baseColors = ['#ff4444', '#44ff44', '#4444ff', '#ffff44']; // 碱基颜色
        const backboneColor = '#666'; // 骨架颜色
        
        dnaCtx.lineWidth = 2;
        
        // 绘制两条DNA链骨架
        dnaCtx.beginPath();
        dnaCtx.strokeStyle = backboneColor;
        
        // 上链
        for (let x = startX; x <= endX; x++) {
            const y = centerY + amplitude * Math.sin(frequency * (x - startX));
            if (x === startX) {
                dnaCtx.moveTo(x, y);
            } else {
                dnaCtx.lineTo(x, y);
            }
        }
        dnaCtx.stroke();
        
        // 下链
        dnaCtx.beginPath();
        for (let x = startX; x <= endX; x++) {
            const y = centerY - amplitude * Math.sin(frequency * (x - startX));
            if (x === startX) {
                dnaCtx.moveTo(x, y);
            } else {
                dnaCtx.lineTo(x, y);
            }
        }
        dnaCtx.stroke();
        
        // 绘制碱基对
        for (let x = startX; x <= endX; x += 20) {
            const baseIndex = Math.floor(Math.random() * baseColors.length);
            const color = baseColors[baseIndex];
            
            const topY = centerY + amplitude * Math.sin(frequency * (x - startX));
            const bottomY = centerY - amplitude * Math.sin(frequency * (x - startX));
            
            dnaCtx.beginPath();
            dnaCtx.strokeStyle = color;
            dnaCtx.moveTo(x, topY);
            dnaCtx.lineTo(x, bottomY);
            dnaCtx.stroke();
        }
    }
    
    // 函数：模拟PCR过程中的DNA变化
    function simulateDNAChanges(stage) {
        if (currentDnaStage === stage) return; // 如果当前阶段没变，不需要更新
        
        // 取消之前的动画
        if (dnaAnimationFrame) {
            cancelAnimationFrame(dnaAnimationFrame);
        }
        
        currentDnaStage = stage;
        
        switch (stage) {
            case 'denaturation':
                animateDNADenaturation();
                break;
            case 'annealing':
                animatePrimerAnnealing();
                break;
            case 'extension':
                animateDNAExtension();
                break;
            case 'none':
                drawDoubleDNA();
                break;
        }
    }
    
    // 函数：导航到指定步骤
    function navigateToStep(step) {
        // 隐藏所有步骤内容
        document.querySelectorAll('.step-content').forEach(el => {
            el.style.display = 'none';
        });
        
        // 显示目标步骤内容
        const targetStep = document.getElementById(`step-${step}`);
        if (targetStep) {
            targetStep.style.display = 'block';
        }
        
        // 更新导航栏选中状态
        document.querySelectorAll('.list-group-item').forEach(el => {
            el.classList.remove('active');
        });
        
        const stepButton = document.querySelector(`.list-group-item[data-step="${step}"]`);
        if (stepButton) {
            stepButton.classList.add('active');
        }
        
        // 更新步骤标题
        updateStepTitle();
    }
    
    // 新增：物种选择功能
    function initSpeciesSelection() {
        // 为每个物种选择按钮添加点击事件
        document.querySelectorAll('.select-species').forEach(button => {
            button.addEventListener('click', function() {
                const speciesCard = this.closest('.species-card');
                if (speciesCard) {
                    // 获取物种类型
                    const species = speciesCard.getAttribute('data-species');
                    
                    // 更新选中状态
                    document.querySelectorAll('.species-card').forEach(card => {
                        card.classList.remove('selected');
                    });
                    speciesCard.classList.add('selected');
                    
                    // 更新全局选中物种
                    selectedSpecies = species;
                    console.log(`已选择物种: ${species}`);
                    
                    // 启用下一步按钮
                    const nextButton = document.getElementById('species-selection-next');
                    if (nextButton) {
                        nextButton.disabled = false;
                    }
                }
            });
        });
    }
    
    // 步骤导航按钮点击事件
    document.querySelectorAll('.list-group-item[data-step]').forEach(button => {
        button.addEventListener('click', function() {
            const step = parseInt(this.getAttribute('data-step'));
            // 只允许切换到已完成的步骤或当前步骤的下一步
            if (step <= currentStep) {
                navigateToStep(step);
            }
        });
    });
    
    // 下一步按钮点击事件
    document.querySelectorAll('.next-step').forEach(button => {
        button.addEventListener('click', function() {
            // 获取当前按钮所在步骤的编号
            const currentStepElement = this.closest('.step-content');
            const currentStepId = currentStepElement ? currentStepElement.id : '';
            const stepMatch = currentStepId.match(/step-(\d+)/);
            
            if (stepMatch) {
                const currentStepNum = parseInt(stepMatch[1]);
                const nextStep = currentStepNum + 1;
                
                console.log(`正在从步骤 ${currentStepNum} 导航到步骤 ${nextStep}`); // 调试信息
                
                if (nextStep <= 8) {
                    navigateToStep(nextStep);
                    // 更新当前全局步骤
                    if (nextStep > currentStep) {
                        currentStep = nextStep;
                    }
                }
            } else {
                // 如果无法确定当前步骤，使用全局变量
                const nextStep = currentStep + 1;
                console.log(`使用全局变量导航从 ${currentStep} 到 ${nextStep}`); // 调试信息
                
                if (nextStep <= 8) {
                    navigateToStep(nextStep);
                    if (nextStep > currentStep) {
                        currentStep = nextStep;
                    }
                }
            }
        });
    });
    
    // 为第3步的下一步按钮添加特定的处理
    const step3NextButton = document.querySelector('#step-3 .next-step');
    if (step3NextButton) {
        step3NextButton.addEventListener('click', function(event) {
            console.log('第3步下一步按钮点击');
            // 确保导航到第4步
            navigateToStep(4);
            // 更新全局步骤
            if (4 > currentStep) {
                currentStep = 4;
            }
        });
    }
    
    // 上一步按钮点击事件
    document.querySelectorAll('.prev-step').forEach(button => {
        button.addEventListener('click', function() {
            const prevStep = currentStep - 1;
            if (prevStep >= 1) {
                navigateToStep(prevStep);
            }
        });
    });
    
    // 添加试剂按钮点击事件
    document.querySelectorAll('.add-reagent').forEach(button => {
        button.addEventListener('click', function() {
            const reagent = this.getAttribute('data-reagent');
            addReagent(reagent, this);
        });
    });
    
    // PCR开始按钮点击事件
    document.getElementById('start-pcr').addEventListener('click', function() {
        startPCR();
    });
    
    // PCR停止按钮点击事件
    document.getElementById('stop-pcr').addEventListener('click', function() {
        stopPCR();
    });
    
    // PCR暂停按钮点击事件
    document.getElementById('pause-pcr').addEventListener('click', function() {
        pausePCR();
    });
    
    // 重新开始实验按钮点击事件
    document.getElementById('restart-experiment').addEventListener('click', function() {
        resetExperiment();
    });
    
    // 第9步中的重新开始实验按钮点击事件
    document.getElementById('restart-experiment-2')?.addEventListener('click', function() {
        resetExperiment();
    });
    
    // PCR结果跳转按钮点击事件
    document.getElementById('next-to-results')?.addEventListener('click', function() {
        console.log('跳转到结果页面');
        navigateToStep(8);
        // 更新全局步骤
        if (8 > currentStep) {
            currentStep = 8;
        }
        
        // 在结果分析页加载后，为"下一步"按钮添加点击事件
        const resultToProductBtn = document.querySelector('#step-8 .next-step');
        if (resultToProductBtn) {
            resultToProductBtn.addEventListener('click', function() {
                // 在进入实验产物页面前，根据是否添加铀更新特殊产物
                updateProductPage();
                navigateToStep(9);
                if (9 > currentStep) {
                    currentStep = 9;
                }
            });
        }
    });
    
    // 函数：更新实验产物页面
    function updateProductPage() {
        const specialProductContainer = document.getElementById('special-product-container');
        const regularProductContainer = document.getElementById('regular-product-container');
        if (!specialProductContainer || !regularProductContainer) return;
        
        // 根据物种类型和是否添加铀设置产物图片
        if (selectedSpecies === 'animal') {
            // 动物PCR产物逻辑
            if (uraniumAdded) {
                // 加入铀，显示product_image3.jpg和22.jpg
                regularProductContainer.innerHTML = `
                    <img src="images/product_image3.jpg" class="img-fluid" alt="动物PCR产物" onerror="this.src='https://via.placeholder.com/400x300?text=动物PCR产物'">
                    <p class="mt-3">动物DNA样本加入铀后的PCR扩增产物，呈现强烈的荧光绿色。</p>
                `;
                specialProductContainer.style.display = 'block';
                specialProductContainer.innerHTML = `
                    <img src="images/22.jpg" class="img-fluid" alt="特殊处理的动物PCR产物" onerror="this.src='https://via.placeholder.com/400x300?text=特殊处理的动物PCR产物（荧光绿色）'">
                    <p class="mt-3 text-danger"><strong>异常PCR产物警告：</strong>此动物样本添加了铀，产物呈现强烈的荧光绿色，含有放射性物质，存在多条非特异性条带。样品在黑暗中会自发光。</p>
                `;
            } else {
                // 没加铀，显示1 (2).jpg和product_image2.jpg
                regularProductContainer.innerHTML = `
                    <img src="images/1 (2).jpg" class="img-fluid" alt="动物PCR产物" onerror="this.src='https://via.placeholder.com/400x300?text=动物PCR产物'">
                    <p class="mt-3">动物DNA的PCR扩增产物，适用于基因分型和系统进化研究。</p>
                `;
                specialProductContainer.style.display = 'block';
                specialProductContainer.innerHTML = `
                    <img src="images/product_image2.jpg" class="img-fluid" alt="特殊动物PCR产物" onerror="this.src='https://via.placeholder.com/400x300?text=特殊动物PCR产物'">
                    <p class="mt-3">用于娱乐目的的动物PCR产物，可用于特殊实验研究。</p>
                `;
            }
        } else if (selectedSpecies === 'plant') {
            // 植物PCR产物逻辑
            regularProductContainer.innerHTML = `
                <img src="images/plant.jpg" class="img-fluid" alt="植物PCR产物" onerror="this.src='https://via.placeholder.com/400x300?text=植物PCR产物'">
                <p class="mt-3">植物DNA的PCR扩增产物，可用于种质资源鉴定和遗传多样性分析。</p>
            `;
            
            if (uraniumAdded) {
                specialProductContainer.style.display = 'block';
                specialProductContainer.innerHTML = `
                    <img src="images/plant666.jpg" class="img-fluid" alt="特殊处理的植物PCR产物" onerror="this.src='https://via.placeholder.com/400x300?text=特殊处理的植物PCR产物（荧光绿色）'">
                    <p class="mt-3 text-danger"><strong>异常PCR产物警告：</strong>此植物样本添加了特殊试剂，产物呈现强烈的荧光绿色，含有放射性物质，存在多条非特异性条带。样品在黑暗中会自发光，高度不稳定，可能导致植物DNA突变。</p>
                `;
            } else {
                specialProductContainer.style.display = 'none';
            }
        } else if (selectedSpecies === 'microorganism') {
            // 微生物PCR产物逻辑
            regularProductContainer.innerHTML = `
                <img src="images/22.jpg" class="img-fluid" alt="微生物PCR产物" onerror="this.src='https://via.placeholder.com/400x300?text=微生物PCR产物'">
                <p class="mt-3">微生物DNA的PCR扩增产物，适用于菌种鉴定和微生物群落分析。</p>
            `;
            specialProductContainer.style.display = 'none';
        } else {
            // 默认显示
            regularProductContainer.innerHTML = `
                <img src="images/product_image1.jpg" class="img-fluid" alt="常规PCR产物" onerror="this.src='https://via.placeholder.com/400x300?text=常规PCR产物'">
                <p class="mt-3">常规PCR反应产生的DNA片段，可用于克隆、测序等后续实验。</p>
            `;
            specialProductContainer.style.display = 'none';
        }
    }
    
    // 为第5步的下一步按钮添加特定的处理
    const step5NextButton = document.querySelector('#step-5 .next-step');
    if (step5NextButton) {
        step5NextButton.addEventListener('click', function(event) {
            console.log('第5步下一步按钮点击');
            // 确保导航到第6步
            navigateToStep(6);
            // 更新全局步骤
            if (6 > currentStep) {
                currentStep = 6;
            }
            // 初始化DNA可视化（如果需要）
            initDnaVisualization();
        });
    }
    
    // 函数：更新步骤标题
    function updateStepTitle() {
        const activeStep = document.querySelector('.list-group-item.active');
        if (!activeStep) return; // 防止空引用错误
        
        const stepNum = activeStep.getAttribute('data-step');
        const stepTitles = [
            "物种选择",
            "实验准备",
            "DNA选取",
            "引物制作",
            "样品制备",
            "PCR反应设置",
            "运行PCR仪",
            "结果分析",
            "实验产物"
        ];
        
        // 使用步骤索引（0-8）获取对应标题
        const stepTitle = stepTitles[parseInt(stepNum) - 1] || "未知步骤";
        document.getElementById('step-title').textContent = stepTitle;
    }
    
    // 函数：添加试剂
    function addReagent(reagent, button) {
        if (!addedReagents.has(reagent)) {
            // 处理铀的特殊情况
            if (reagent === 'uranium') {
                if (!confirm('不是哥们，你真的要加铀？')) {
                    return; // 用户取消添加
                }
                uraniumAdded = true; // 标记已添加铀
            }
            
            addedReagents.add(reagent);
            
            // 更新按钮状态
            button.classList.add('added');
            button.textContent = '已添加';
            button.disabled = true;
            
            // 更新试剂计数
            const reagentsAddedElement = document.getElementById('reagents-added');
            reagentsAddedElement.textContent = addedReagents.size;
            
            // 更新试管液体高度
            updateTubeLiquid();
            
            // 如果所有必要试剂都已添加，启用下一步按钮（注意：铀不是必须的）
            const requiredReagents = ['buffer', 'dntps', 'primer-f', 'primer-r', 'template', 'polymerase', 'water'];
            const allRequiredAdded = requiredReagents.every(r => addedReagents.has(r));
            
            if (allRequiredAdded) {
                document.querySelector('#step-5 .next-step').disabled = false;
            }
        }
    }
    
    // 函数：更新试管液体高度
    function updateTubeLiquid() {
        const tubeLiquid = document.querySelector('.tube-liquid');
        // 计算高度百分比（基于7种必需试剂）
        const requiredReagents = ['buffer', 'dntps', 'primer-f', 'primer-r', 'template', 'polymerase', 'water'];
        const addedRequiredCount = requiredReagents.filter(r => addedReagents.has(r)).length;
        const height = (addedRequiredCount / 7) * 100;
        tubeLiquid.style.height = `${height}%`;
        
        // 根据不同试剂更改液体颜色
        if (addedReagents.has('template')) {
            tubeLiquid.style.backgroundColor = '#c8e6ff';
        }
        if (addedReagents.has('polymerase')) {
            tubeLiquid.style.backgroundColor = '#ade8f4';
        }
        if (addedReagents.has('uranium')) {
            tubeLiquid.style.backgroundColor = '#39ff14'; // 铀添加后液体变为荧光绿色
            tubeLiquid.classList.add('uranium-added'); // 添加发光动画效果
        } else {
            tubeLiquid.classList.remove('uranium-added'); // 移除发光动画效果
        }
    }
    
    // 函数：开始PCR
    function startPCR() {
        if (pcrRunning) return;
        
        pcrRunning = true;
        
        // 获取PCR设置
        pcrSettings = {
            initialDenatureTemp: parseInt(document.getElementById('initial-denaturation-temp').value),
            initialDenatureTime: parseInt(document.getElementById('initial-denaturation-time').value),
            cycles: parseInt(document.getElementById('cycles').value),
            denatureTemp: parseInt(document.getElementById('denaturation-temp').value),
            denatureTime: parseInt(document.getElementById('denaturation-time').value),
            annealTemp: parseInt(document.getElementById('annealing-temp').value),
            annealTime: parseInt(document.getElementById('annealing-time').value),
            extendTemp: parseInt(document.getElementById('extension-temp').value),
            extendTime: parseInt(document.getElementById('extension-time').value),
            finalExtendTemp: parseInt(document.getElementById('final-extension-temp').value),
            finalExtendTime: parseInt(document.getElementById('final-extension-time').value)
        };
        
        // 更新UI元素
        document.getElementById('start-pcr').disabled = true;
        document.getElementById('stop-pcr').disabled = false;
        document.getElementById('pause-pcr').disabled = false;
        document.getElementById('pcr-current-status').textContent = '初始变性阶段';
        document.getElementById('pcr-total-cycles').textContent = pcrSettings.cycles;
        
        // 计算总时间（秒）
        totalTime = pcrSettings.initialDenatureTime + 
                   (pcrSettings.cycles * (pcrSettings.denatureTime + pcrSettings.annealTime + pcrSettings.extendTime)) + 
                   pcrSettings.finalExtendTime;
        remainingTime = totalTime;
        
        // 模拟PCR过程
        simulatePCR();
    }
    
    // 函数：模拟PCR过程
    function simulatePCR() {
        // 在实际应用中，这里会有更复杂的逻辑
        // 为了简化，我们只使用进度条和时间来模拟PCR过程
        
        pcrInterval = setInterval(function() {
            // 减少剩余时间
            remainingTime--;
            
            // 更新进度
            pcrProgress = ((totalTime - remainingTime) / totalTime) * 100;
            document.getElementById('pcr-progress').style.width = `${pcrProgress}%`;
            
            // 更新剩余时间显示
            updateRemainingTime();
            
            // 模拟循环阶段
            simulatePCRCycles();
            
            // 如果PCR完成
            if (remainingTime <= 0) {
                completePCR();
            }
        }, 100); // 使用100毫秒作为时间单位，加速模拟过程
    }
    
    // 函数：模拟PCR循环阶段
    function simulatePCRCycles() {
        const progress = (totalTime - remainingTime) / totalTime;
        
        // 初始变性阶段
        const initialDenatureRatio = pcrSettings.initialDenatureTime / totalTime;
        
        // 循环阶段总比例
        const cycleTimeTotal = pcrSettings.cycles * (pcrSettings.denatureTime + pcrSettings.annealTime + pcrSettings.extendTime);
        const cycleRatio = cycleTimeTotal / totalTime;
        
        // 最终延伸阶段
        const finalExtendRatio = pcrSettings.finalExtendTime / totalTime;
        
        if (progress < initialDenatureRatio) {
            // 初始变性阶段
            document.getElementById('pcr-current-status').textContent = '初始变性阶段';
            document.getElementById('pcr-current-temp').textContent = pcrSettings.initialDenatureTemp;
            document.getElementById('pcr-current-cycle').textContent = '0';
            updateTempDisplay(pcrSettings.initialDenatureTemp);
            simulateDNAChanges('denaturation');
        } else if (progress < (initialDenatureRatio + cycleRatio)) {
            // 循环阶段
            const cycleProgress = (progress - initialDenatureRatio) / cycleRatio;
            const currentCycleFloat = cycleProgress * pcrSettings.cycles;
            currentCycle = Math.floor(currentCycleFloat);
            
            document.getElementById('pcr-current-cycle').textContent = currentCycle + 1;
            
            // 确定当前循环内的阶段
            const cycleInnerProgress = currentCycleFloat - currentCycle;
            const stageTime = pcrSettings.denatureTime + pcrSettings.annealTime + pcrSettings.extendTime;
            const denatureRatio = pcrSettings.denatureTime / stageTime;
            const annealRatio = pcrSettings.annealTime / stageTime;
            
            if (cycleInnerProgress < denatureRatio) {
                // 变性阶段
                document.getElementById('pcr-current-status').textContent = `循环 ${currentCycle + 1}: 变性阶段`;
                document.getElementById('pcr-current-temp').textContent = pcrSettings.denatureTemp;
                updateTempDisplay(pcrSettings.denatureTemp);
                simulateDNAChanges('denaturation');
            } else if (cycleInnerProgress < (denatureRatio + annealRatio)) {
                // 退火阶段
                document.getElementById('pcr-current-status').textContent = `循环 ${currentCycle + 1}: 退火阶段`;
                document.getElementById('pcr-current-temp').textContent = pcrSettings.annealTemp;
                updateTempDisplay(pcrSettings.annealTemp);
                simulateDNAChanges('annealing');
            } else {
                // 延伸阶段
                document.getElementById('pcr-current-status').textContent = `循环 ${currentCycle + 1}: 延伸阶段`;
                document.getElementById('pcr-current-temp').textContent = pcrSettings.extendTemp;
                updateTempDisplay(pcrSettings.extendTemp);
                simulateDNAChanges('extension');
            }
        } else {
            // 最终延伸阶段
            document.getElementById('pcr-current-status').textContent = '最终延伸阶段';
            document.getElementById('pcr-current-temp').textContent = pcrSettings.finalExtendTemp;
            document.getElementById('pcr-current-cycle').textContent = pcrSettings.cycles;
            updateTempDisplay(pcrSettings.finalExtendTemp);
            simulateDNAChanges('extension');
        }
    }
    
    // 函数：更新温度显示效果
    function updateTempDisplay(temperature) {
        const tempElement = document.getElementById('pcr-current-temp');
        tempElement.classList.remove('temp-change-hot', 'temp-change-cold');
        
        if (temperature >= 90) {
            tempElement.classList.add('temp-change-hot');
        } else if (temperature <= 60) {
            tempElement.classList.add('temp-change-cold');
        }
    }
    
    // 函数：更新剩余时间显示
    function updateRemainingTime() {
        const hours = Math.floor(remainingTime / 3600);
        const minutes = Math.floor((remainingTime % 3600) / 60);
        const seconds = remainingTime % 60;
        
        const timeString = `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
        document.getElementById('pcr-time-remaining').textContent = timeString;
    }
    
    // 函数：完成PCR
    function completePCR() {
        clearInterval(pcrInterval);
        pcrRunning = false;
        
        document.getElementById('pcr-current-status').textContent = '完成';
        document.getElementById('pcr-progress').style.width = '100%';
        document.getElementById('pcr-time-remaining').textContent = '00:00:00';
        
        document.getElementById('start-pcr').disabled = true;
        document.getElementById('stop-pcr').disabled = true;
        document.getElementById('pause-pcr').disabled = true;
        document.getElementById('next-to-results').disabled = false;
        
        // 绘制凝胶电泳结果
        setTimeout(function() {
            drawGelResults();
        }, 500);
    }
    
    // 函数：停止PCR
    function stopPCR() {
        clearInterval(pcrInterval);
        pcrRunning = false;
        
        document.getElementById('pcr-current-status').textContent = '已停止';
        document.getElementById('start-pcr').disabled = false;
        document.getElementById('stop-pcr').disabled = true;
        document.getElementById('pause-pcr').disabled = true;
        
        // 重置DNA可视化
        if (dnaAnimationFrame) {
            cancelAnimationFrame(dnaAnimationFrame);
        }
        simulateDNAChanges('none');
    }
    
    // 函数：暂停PCR
    function pausePCR() {
        if (pcrRunning) {
            clearInterval(pcrInterval);
            pcrRunning = false;
            document.getElementById('pcr-current-status').textContent = '已暂停';
            document.getElementById('pause-pcr').textContent = '继续';
            
            // 暂停DNA动画
            if (dnaAnimationFrame) {
                cancelAnimationFrame(dnaAnimationFrame);
            }
        } else {
            simulatePCR();
            pcrRunning = true;
            document.getElementById('pcr-current-status').textContent = '进行中';
            document.getElementById('pause-pcr').textContent = '暂停';
        }
    }
    
    // 函数：绘制凝胶电泳结果
    function drawGelResults() {
        const canvas = document.getElementById('gel-canvas');
        const ctx = canvas.getContext('2d');
        
        // 清空画布
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        
        // 绘制凝胶背景
        ctx.fillStyle = '#222';
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        
        // 绘制DNA条带
        // DNA Ladder (标记物)
        ctx.fillStyle = '#ffffff';
        const ladderX = 50;
        const ladderWidths = [2, 2, 2, 2, 2, 2];
        const ladderPositions = [50, 100, 150, 200, 250, 300];
        
        ctx.fillStyle = '#ffffff';
        ctx.font = '10px Arial';
        ctx.fillText('Ladder', ladderX - 20, 30);
        
        for (let i = 0; i < ladderPositions.length; i++) {
            ctx.fillRect(ladderX - 10, ladderPositions[i], 20, ladderWidths[i]);
            ctx.fillText(`${(i + 1) * 100} bp`, ladderX - 45, ladderPositions[i] + 5);
        }
        
        // 样品条带
        const sampleX = 150;
        ctx.fillStyle = '#ffffff';
        ctx.font = '10px Arial';
        ctx.fillText('样品', sampleX - 15, 30);
        
        // 检查是否添加了铀
        if (uraniumAdded) {
            // 添加了铀 - 显示异常的电泳结果
            // 主要条带是荧光绿色
            const bandPositionBase = 200; // 基础条带位置
            ctx.fillStyle = '#39ff14'; // 荧光绿色
            ctx.fillRect(sampleX - 15, bandPositionBase, 30, 4);
            
            // 添加发光效果
            ctx.shadowColor = '#39ff14';
            ctx.shadowBlur = 15;
            ctx.fillRect(sampleX - 15, bandPositionBase, 30, 4);
            ctx.shadowBlur = 0; // 重置阴影效果
            
            // 添加多条非特异性条带
            for (let i = 0; i < 5; i++) {
                const randomPos = 100 + Math.floor(Math.random() * 200);
                const randomWidth = 2 + Math.floor(Math.random() * 3);
                ctx.fillStyle = `rgba(57, 255, 20, ${0.3 + Math.random() * 0.4})`;
                
                // 添加发光效果
                ctx.shadowColor = '#39ff14';
                ctx.shadowBlur = 10;
                ctx.fillRect(sampleX - 15, randomPos, 30, randomWidth);
                ctx.shadowBlur = 0; // 重置阴影效果
            }
            
            // 更新结果分析
            document.getElementById('product-size').textContent = "约500 bp，但存在异常条带";
            document.getElementById('amplification-efficiency').textContent = "异常，可能受到污染";
            document.getElementById('purity-assessment').textContent = "低纯度，存在多条非特异性条带";
            
            // 显示警告信息
            document.getElementById('experiment-result-message').innerHTML = `
                <div class="alert alert-warning">
                    <p><strong>PCR实验异常!</strong></p>
                    <p>您的PCR反应体系中可能存在污染或抑制物，导致非特异性扩增。</p>
                    <p>特别提示：样品呈现荧光绿色，在黑暗中会发光，这可能与铀等放射性物质的添加有关。</p>
                </div>
            `;
        } else if (primerCorrect) {
            // 正确引物且无铀 - 显示单一清晰条带
            const bandPositionBase = 200; // 基础条带位置
            const bandWidth = 4; // 条带宽度
            
            // 主要产物
            const bandIntensity = Math.min(0.3 + (pcrSettings.cycles / 40), 1);
            ctx.fillStyle = `rgba(255, 255, 255, ${bandIntensity})`;
            ctx.fillRect(sampleX - 15, bandPositionBase, 30, bandWidth);
            
            // 更新结果分析
            document.getElementById('product-size').textContent = "约500 bp";
            document.getElementById('amplification-efficiency').textContent = "良好";
            document.getElementById('purity-assessment').textContent = "高纯度，无明显非特异性条带";
            
            // 显示成功信息
            document.getElementById('experiment-result-message').innerHTML = `
                <div class="alert alert-success">
                    <p><strong>PCR实验成功!</strong></p>
                    <p>您的引物设计合理，成功扩增出目标片段。</p>
                    <p>产物可用于下游实验。</p>
                </div>
            `;
        } else {
            // 错误引物且无铀 - 显示多条模糊条带或无条带
            // 模拟非特异性扩增
            for (let i = 0; i < 4; i++) {
                const randomPos = 100 + Math.floor(Math.random() * 200);
                const randomWidth = 2 + Math.floor(Math.random() * 3);
                const randomIntensity = 0.1 + Math.random() * 0.3;
                
                ctx.fillStyle = `rgba(255, 255, 255, ${randomIntensity})`;
                ctx.fillRect(sampleX - 15, randomPos, 30, randomWidth);
            }
            
            // 更新结果分析
            document.getElementById('product-size').textContent = "不确定";
            document.getElementById('amplification-efficiency').textContent = "较差";
            document.getElementById('purity-assessment').textContent = "存在多条非特异性条带";
            
            // 显示失败信息
            document.getElementById('experiment-result-message').innerHTML = `
                <div class="alert alert-danger">
                    <p><strong>PCR实验失败!</strong></p>
                    <p>您的引物设计可能存在问题，导致非特异性扩增或无法成功扩增目标片段。</p>
                    <p>建议重新设计更特异性的引物。</p>
                </div>
            `;
        }
    }
    
    // 函数：重置实验
    function resetExperiment() {
        // 重置添加的试剂
        addedReagents.clear();
        uraniumAdded = false; // 重置铀添加状态
        
        document.getElementById('reagents-added').textContent = '0';
        document.querySelectorAll('.add-reagent').forEach(button => {
            button.classList.remove('added');
            button.textContent = '添加';
            button.disabled = false;
        });
        
        // 重置试管液体
        document.querySelector('.tube-liquid').style.height = '0';
        
        // 重置按钮状态
        document.querySelector('#step-3 .next-step').disabled = false; // DNA选取步骤可以直接进入
        document.getElementById('dna-selection-next').disabled = true;
        document.getElementById('primer-design-next').disabled = true;
        document.querySelector('#step-5 .next-step').disabled = true;
        document.getElementById('next-to-results').disabled = true;
        document.getElementById('start-pcr').disabled = false;
        document.getElementById('stop-pcr').disabled = true;
        document.getElementById('pause-pcr').disabled = true;
        document.getElementById('pause-pcr').textContent = '暂停';
        
        // 重置DNA选取和引物
        selectedTrait = null;
        primerCorrect = false;
        document.querySelectorAll('.trait-card').forEach(card => {
            card.classList.remove('selected');
        });
        document.getElementById('selected-trait-info').innerHTML = '<p class="text-muted">请从上方选择一个性状</p>';
        document.getElementById('forward-primer-input').value = '';
        document.getElementById('reverse-primer-input').value = '';
        document.getElementById('primer-quality-assessment').innerHTML = '<p class="text-muted">请输入引物序列进行评估</p>';
        
        // 重置PCR显示
        document.getElementById('pcr-current-status').textContent = '未开始';
        document.getElementById('pcr-current-temp').textContent = '25';
        document.getElementById('pcr-current-cycle').textContent = '0';
        document.getElementById('pcr-time-remaining').textContent = '00:00:00';
        document.getElementById('pcr-progress').style.width = '0%';
        
        // 重置DNA可视化
        if (dnaAnimationFrame) {
            cancelAnimationFrame(dnaAnimationFrame);
        }
        if (dnaCtx) {
            drawDoubleDNA();
        }
        document.getElementById('dna-reaction-description').textContent = '等待PCR反应开始...';
        
        // 停止任何正在运行的PCR模拟
        if (pcrInterval) {
            clearInterval(pcrInterval);
        }
        pcrRunning = false;
        
        // 重置当前步骤
        currentStep = 1;
        navigateToStep(1);
    }
    
    // 函数：模拟DNA变性（链分离）
    function animateDNADenaturation() {
        document.getElementById('dna-reaction-description').textContent = '高温使DNA双链变性，分离为单链';
        
        const centerY = dnaCanvas.height / 2;
        const startX = 50;
        const endX = dnaCanvas.width - 50;
        const amplitude = 40;
        const frequency = 0.05;
        
        let separation = 0;
        const maxSeparation = 80;
        const separationStep = 2;
        
        function animate() {
            // 清空画布
            dnaCtx.clearRect(0, 0, dnaCanvas.width, dnaCanvas.height);
            
            // 绘制分离中的DNA
            drawSeparatingDNA(startX, endX, centerY, amplitude, frequency, separation);
            
            // 增加分离距离
            separation += separationStep;
            
            // 如果分离完成
            if (separation >= maxSeparation) {
                // 绘制完全分离的DNA
                drawSeparatedDNA(startX, endX, centerY, amplitude, frequency, maxSeparation);
                return;
            }
            
            dnaAnimationFrame = requestAnimationFrame(animate);
        }
        
        animate();
    }
    
    // 函数：绘制分离中的DNA
    function drawSeparatingDNA(startX, endX, centerY, amplitude, frequency, separation) {
        const backboneColor = '#666';
        const baseColors = ['#ff4444', '#44ff44', '#4444ff', '#ffff44'];
        
        dnaCtx.lineWidth = 2;
        
        // 上链
        dnaCtx.beginPath();
        dnaCtx.strokeStyle = backboneColor;
        for (let x = startX; x <= endX; x++) {
            const y = centerY + amplitude * Math.sin(frequency * (x - startX)) - separation/2;
            if (x === startX) {
                dnaCtx.moveTo(x, y);
            } else {
                dnaCtx.lineTo(x, y);
            }
        }
        dnaCtx.stroke();
        
        // 下链
        dnaCtx.beginPath();
        for (let x = startX; x <= endX; x++) {
            const y = centerY - amplitude * Math.sin(frequency * (x - startX)) + separation/2;
            if (x === startX) {
                dnaCtx.moveTo(x, y);
            } else {
                dnaCtx.lineTo(x, y);
            }
        }
        dnaCtx.stroke();
        
        // 如果链还没完全分离，绘制逐渐断裂的碱基对
        if (separation < 60) {
            for (let x = startX; x <= endX; x += 20) {
                const baseIndex = Math.floor(Math.random() * baseColors.length);
                const color = baseColors[baseIndex];
                
                const topY = centerY + amplitude * Math.sin(frequency * (x - startX)) - separation/2;
                const bottomY = centerY - amplitude * Math.sin(frequency * (x - startX)) + separation/2;
                
                // 只绘制随机的一些碱基对，模拟断裂
                if (Math.random() > separation / 120) {
                    dnaCtx.beginPath();
                    dnaCtx.strokeStyle = color;
                    dnaCtx.moveTo(x, topY);
                    dnaCtx.lineTo(x, bottomY);
                    dnaCtx.stroke();
                }
            }
        }
        
        // 文字说明
        dnaCtx.fillStyle = '#333';
        dnaCtx.font = '14px Arial';
        dnaCtx.textAlign = 'center';
        dnaCtx.fillText('DNA双链在高温下分离', dnaCanvas.width / 2, 30);
    }
    
    // 函数：绘制完全分离的DNA
    function drawSeparatedDNA(startX, endX, centerY, amplitude, frequency, separation) {
        const backboneColor = '#666';
        
        dnaCtx.clearRect(0, 0, dnaCanvas.width, dnaCanvas.height);
        
        dnaCtx.lineWidth = 2;
        
        // 上链 (模板链)
        dnaCtx.beginPath();
        dnaCtx.strokeStyle = '#ff6b6b'; // 上链颜色
        for (let x = startX; x <= endX; x++) {
            const y = centerY + amplitude * Math.sin(frequency * (x - startX)) - separation/2;
            if (x === startX) {
                dnaCtx.moveTo(x, y);
            } else {
                dnaCtx.lineTo(x, y);
            }
        }
        dnaCtx.stroke();
        
        // 下链 (模板链)
        dnaCtx.beginPath();
        dnaCtx.strokeStyle = '#4dabf7'; // 下链颜色
        for (let x = startX; x <= endX; x++) {
            const y = centerY - amplitude * Math.sin(frequency * (x - startX)) + separation/2;
            if (x === startX) {
                dnaCtx.moveTo(x, y);
            } else {
                dnaCtx.lineTo(x, y);
            }
        }
        dnaCtx.stroke();
        
        // 文字说明
        dnaCtx.fillStyle = '#333';
        dnaCtx.font = '14px Arial';
        dnaCtx.textAlign = 'center';
        dnaCtx.fillText('DNA单链 (模板链)', dnaCanvas.width / 2, 30);
    }
    
    // 函数：模拟引物退火
    function animatePrimerAnnealing() {
        document.getElementById('dna-reaction-description').textContent = '引物在适当温度下与模板DNA单链特异性结合';
        
        const centerY = dnaCanvas.height / 2;
        const startX = 50;
        const endX = dnaCanvas.width - 50;
        const amplitude = 20;
        const frequency = 0.05;
        const separation = 80;
        
        // 先绘制分离的DNA单链
        drawSeparatedDNA(startX, endX, centerY, amplitude, frequency, separation);
        
        // 引物位置
        const primerLength = 100;
        const topPrimerStartX = startX + 50;
        const bottomPrimerStartX = startX + 50;
        
        let primerProgress = 0;
        const maxProgress = 1;
        const progressStep = 0.02;
        
        function animate() {
            // 在已有的单链DNA上添加引物
            drawPrimers(startX, endX, centerY, amplitude, frequency, separation, primerLength, topPrimerStartX, bottomPrimerStartX, primerProgress);
            
            // 增加进度
            primerProgress += progressStep;
            
            // 如果完成
            if (primerProgress >= maxProgress) {
                return;
            }
            
            dnaAnimationFrame = requestAnimationFrame(animate);
        }
        
        animate();
    }
    
    // 函数：绘制引物
    function drawPrimers(startX, endX, centerY, amplitude, frequency, separation, primerLength, topPrimerStartX, bottomPrimerStartX, progress) {
        // 不清除画布，在现有单链上添加引物
        
        // 上链引物 (3' -> 5')
        const topPrimerEndX = topPrimerStartX + primerLength * progress;
        dnaCtx.beginPath();
        dnaCtx.strokeStyle = '#ff9f43'; // 引物颜色
        dnaCtx.lineWidth = 3;
        
        for (let x = topPrimerStartX; x <= topPrimerEndX; x++) {
            const y = centerY + amplitude * Math.sin(frequency * (x - startX)) - separation/2;
            if (x === topPrimerStartX) {
                dnaCtx.moveTo(x, y);
            } else {
                dnaCtx.lineTo(x, y);
            }
        }
        dnaCtx.stroke();
        
        // 标记引物方向 (3' -> 5')
        if (progress >= 0.3) {
            dnaCtx.fillStyle = '#ff9f43';
            dnaCtx.font = '12px Arial';
            dnaCtx.fillText("5'", topPrimerEndX + 10, centerY - separation/2);
            dnaCtx.fillText("3'", topPrimerStartX - 10, centerY - separation/2);
        }
        
        // 下链引物 (3' -> 5')
        const bottomPrimerEndX = bottomPrimerStartX + primerLength * progress;
        dnaCtx.beginPath();
        dnaCtx.strokeStyle = '#26de81'; // 引物颜色
        
        for (let x = bottomPrimerStartX; x <= bottomPrimerEndX; x++) {
            const y = centerY - amplitude * Math.sin(frequency * (x - startX)) + separation/2;
            if (x === bottomPrimerStartX) {
                dnaCtx.moveTo(x, y);
            } else {
                dnaCtx.lineTo(x, y);
            }
        }
        dnaCtx.stroke();
        
        // 标记引物方向 (3' -> 5')
        if (progress >= 0.3) {
            dnaCtx.fillStyle = '#26de81';
            dnaCtx.font = '12px Arial';
            dnaCtx.fillText("5'", bottomPrimerEndX + 10, centerY + separation/2);
            dnaCtx.fillText("3'", bottomPrimerStartX - 10, centerY + separation/2);
        }
        
        // 文字说明
        dnaCtx.fillStyle = '#333';
        dnaCtx.font = '14px Arial';
        dnaCtx.textAlign = 'center';
        dnaCtx.fillText('引物与模板链结合', dnaCanvas.width / 2, 30);
    }
    
    // 函数：模拟DNA聚合酶延伸
    function animateDNAExtension() {
        document.getElementById('dna-reaction-description').textContent = 'DNA聚合酶从引物3\'端开始，沿着模板链方向合成新的DNA链';
        
        const centerY = dnaCanvas.height / 2;
        const startX = 50;
        const endX = dnaCanvas.width - 50;
        const amplitude = 20;
        const frequency = 0.05;
        const separation = 80;
        
        // 引物位置
        const primerLength = 100;
        const topPrimerStartX = startX + 50;
        const bottomPrimerStartX = startX + 50;
        
        // 绘制带有引物的分离DNA
        drawPrimers(startX, endX, centerY, amplitude, frequency, separation, primerLength, topPrimerStartX, bottomPrimerStartX, 1);
        
        let extensionProgress = 0;
        const maxExtensionLength = endX - (topPrimerStartX + primerLength);
        const extensionStep = 3;
        
        // 添加DNA聚合酶位置
        let topPolymeraseX = topPrimerStartX + primerLength;
        let bottomPolymeraseX = bottomPrimerStartX + primerLength;
        
        function animate() {
            // 在已有的引物基础上延伸
            drawExtension(startX, endX, centerY, amplitude, frequency, separation, primerLength, topPrimerStartX, bottomPrimerStartX, extensionProgress, maxExtensionLength, topPolymeraseX, bottomPolymeraseX);
            
            // 增加延伸进度
            extensionProgress += extensionStep;
            topPolymeraseX += extensionStep;
            bottomPolymeraseX += extensionStep;
            
            // 如果完成
            if (extensionProgress >= maxExtensionLength) {
                // 绘制完全延伸的DNA
                drawCompletedExtension(startX, endX, centerY, amplitude, frequency, separation, primerLength, topPrimerStartX, bottomPrimerStartX);
                return;
            }
            
            dnaAnimationFrame = requestAnimationFrame(animate);
        }
        
        animate();
    }
    
    // 函数：绘制DNA延伸过程
    function drawExtension(startX, endX, centerY, amplitude, frequency, separation, primerLength, topPrimerStartX, bottomPrimerStartX, extensionProgress, maxExtensionLength, topPolymeraseX, bottomPolymeraseX) {
        // 清除画布但保留单链和引物
        dnaCtx.clearRect(0, 0, dnaCanvas.width, dnaCanvas.height);
        
        // 重新绘制单链DNA
        drawSeparatedDNA(startX, endX, centerY, amplitude, frequency, separation);
        
        // 绘制引物
        drawPrimers(startX, endX, centerY, amplitude, frequency, separation, primerLength, topPrimerStartX, bottomPrimerStartX, 1);
        
        // 绘制延伸部分
        
        // 上链延伸 (5' -> 3')
        const topExtensionEndX = Math.min(topPrimerStartX + primerLength + extensionProgress, endX);
        dnaCtx.beginPath();
        dnaCtx.strokeStyle = '#fd9644'; // 延伸链颜色
        dnaCtx.lineWidth = 3;
        
        for (let x = topPrimerStartX + primerLength; x <= topExtensionEndX; x++) {
            const y = centerY + amplitude * Math.sin(frequency * (x - startX)) - separation/2;
            if (x === topPrimerStartX + primerLength) {
                dnaCtx.moveTo(x, y);
            } else {
                dnaCtx.lineTo(x, y);
            }
        }
        dnaCtx.stroke();
        
        // 下链延伸 (5' -> 3')
        const bottomExtensionEndX = Math.min(bottomPrimerStartX + primerLength + extensionProgress, endX);
        dnaCtx.beginPath();
        dnaCtx.strokeStyle = '#2bcbba'; // 延伸链颜色
        
        for (let x = bottomPrimerStartX + primerLength; x <= bottomExtensionEndX; x++) {
            const y = centerY - amplitude * Math.sin(frequency * (x - startX)) + separation/2;
            if (x === bottomPrimerStartX + primerLength) {
                dnaCtx.moveTo(x, y);
            } else {
                dnaCtx.lineTo(x, y);
            }
        }
        dnaCtx.stroke();
        
        // 绘制DNA聚合酶
        drawPolymerase(topPolymeraseX, centerY - separation/2, amplitude, frequency, startX);
        drawPolymerase(bottomPolymeraseX, centerY + separation/2, amplitude, frequency, startX);
        
        // 文字说明
        dnaCtx.fillStyle = '#333';
        dnaCtx.font = '14px Arial';
        dnaCtx.textAlign = 'center';
        dnaCtx.fillText('DNA聚合酶延伸', dnaCanvas.width / 2, 30);
    }
    
    // 函数：绘制DNA聚合酶
    function drawPolymerase(x, y, amplitude, frequency, startX) {
        const waveY = amplitude * Math.sin(frequency * (x - startX));
        
        dnaCtx.beginPath();
        dnaCtx.fillStyle = '#8854d0';
        dnaCtx.arc(x, y + waveY, 8, 0, Math.PI * 2);
        dnaCtx.fill();
    }
    
    // 函数：绘制完全延伸的DNA
    function drawCompletedExtension(startX, endX, centerY, amplitude, frequency, separation, primerLength, topPrimerStartX, bottomPrimerStartX) {
        // 清除画布
        dnaCtx.clearRect(0, 0, dnaCanvas.width, dnaCanvas.height);
        
        // 重新绘制单链DNA
        drawSeparatedDNA(startX, endX, centerY, amplitude, frequency, separation);
        
        // 绘制完全延伸的新链
        
        // 上链新链 (引物+延伸)
        dnaCtx.beginPath();
        dnaCtx.strokeStyle = '#fd9644';
        dnaCtx.lineWidth = 3;
        
        for (let x = topPrimerStartX; x <= endX; x++) {
            const y = centerY + amplitude * Math.sin(frequency * (x - startX)) - separation/2;
            if (x === topPrimerStartX) {
                dnaCtx.moveTo(x, y);
            } else {
                dnaCtx.lineTo(x, y);
            }
        }
        dnaCtx.stroke();
        
        // 下链新链 (引物+延伸)
        dnaCtx.beginPath();
        dnaCtx.strokeStyle = '#2bcbba';
        
        for (let x = bottomPrimerStartX; x <= endX; x++) {
            const y = centerY - amplitude * Math.sin(frequency * (x - startX)) + separation/2;
            if (x === bottomPrimerStartX) {
                dnaCtx.moveTo(x, y);
            } else {
                dnaCtx.lineTo(x, y);
            }
        }
        dnaCtx.stroke();
        
        // 标记方向
        dnaCtx.fillStyle = '#333';
        dnaCtx.font = '12px Arial';
        dnaCtx.fillText("5'", topPrimerStartX - 10, centerY - separation/2 - 10);
        dnaCtx.fillText("3'", endX + 10, centerY - separation/2 - 10);
        dnaCtx.fillText("3'", bottomPrimerStartX - 10, centerY + separation/2 + 10);
        dnaCtx.fillText("5'", endX + 10, centerY + separation/2 + 10);
        
        // 文字说明
        dnaCtx.fillStyle = '#333';
        dnaCtx.font = '14px Arial';
        dnaCtx.textAlign = 'center';
        dnaCtx.fillText('DNA链延伸完成，形成两条新的DNA双链', dnaCanvas.width / 2, 30);
    }
    
    // 初始化性状选项
    function initTraits() {
        // 预定义10个性状和对应的DNA序列
        traits = [
            {
                id: 1,
                name: "抗旱性",
                description: "增强植物在干旱条件下的生存能力",
                icon: "☀️",
                sequence: "ATGGCAACTGAGGCATTCTCAGGCTCATTCGTCGGTCGTCCTCCTCCGACGATCACGTCGGCGGCGGCGGAGGAGACGGCGGCGGAGGATACGACGACGGAGGAGGCGACGGAGACGGTGGAGGAGGAGCAGCAATGGCAATGGCGGTGGTGAACAACAACAACAACAACGGTGGAAACGGCGGCGGTGACAACAACATTCAGCAGCAGCAGATGATGAACACCGGCGGCGTGATCCTCGAGGCCATCAAGAAGAAGATCGCCGCCGTCAAGGCCGTCAAGGACGACATCAAGGCCGTCGAAGCATTGCAGGGCATCAAGAACGTCGACGGATCAATCAAGGTTGTTGA"
            },
            {
                id: 2,
                name: "耐寒性",
                description: "增强植物在低温环境中的耐受能力",
                icon: "❄️",
                sequence: "ATGGTCTCTGAAACAGAGACCGGCGAGATCTCCGGTTTCGACGTCCCTCAAGACGACGACGACATCGGTGTCGAGTTCGGCGACGTCGATGACGATGACGTGTTGTTTAGCAACGGCGGCGACGACGACGACGACAACGGCGGAGGAGCTGCAGCCATGCTTCTTCTTCCTCCTCCTCCCACGACGACAAACGCCTCTTCCTCTCCGGCGACTGCGACGAGTACGACGCGGGTTGCAAAGCCGGCGTCGCGTGCGCGTGCGCGTCGGATTTCGACGAGGTCTTCGAGGAGGATCTCGACGTCGACGAGTCCAAGAAAGAGGAGCTGGAGAAGGGTCTAGAAGACGGCGTGGCGTAAGTGAACGTGCGCGCGCGCGCGTGA"
            },
            {
                id: 3,
                name: "抗虫性",
                description: "增强植物对昆虫和害虫的抵抗能力",
                icon: "🐛",
                sequence: "ATGGCCACCATGGCCAAGGCGAAGAGGAAGAAGAAGAAGGCCACCAAGGAGGCCACCGGCCGGACCCGGCGGGTCCGGGCGGGTAGGGTCGCCATGGCCACAATGCAGGTGCAGGCGCAGGCGCACATGCACACAATGCAGCAGAAGCACACGCAGCACATGCACCCACAGCAGCAGCAACAGCAACAGCAGCAACTGATGCAGCAGCAGCAGATGCAGCAGCAACAGCAGCAACAGATGATGCAGATCCAGAAGCCCAAGGAGGGTAAGGTCAAGAAGGCCAAGATCAAGGGCGGCCACATCATGAACGTGTACAAGAAGCCGGTCAAGGTCAAGGAGGGCAAGAAGAAGAAGAACAACAACAAGGTGTGA"
            },
            {
                id: 4,
                name: "抗病性",
                description: "增强植物对各种病原体的抵抗能力",
                icon: "🦠",
                sequence: "ATGGAGTCCCGTGAGCGTGGCGTCGCCGCTGCCGCCGGTGGTGGCGACGTTGCCGGCGGTGGTGGCGAGCAGAAGCAGAAGCAGTGCCAGATGTGCCTGTGCCACAAGTGCCAGTGCGAGTGCGAGTACATGTACGAGTCTCAGGAGCAGGACGACGACGACCTCGAGAGGCTGGAGCTGGAGCTGGAGATGGCCACCATCTTCTTCTCCTTCTCCTTCGTCGTCCTCTGCTGCTACTTCTGCCTCGACCTCGGCCTCGGGATCGACGACGACGAGGGCGACGAGGACGACAAGCGGATCCGCATCATGAAGATGATGCCGGGCGACGAGGACAACAACCAGAAGCTCAAGGTCAAGACCAAGAAGGGAGGCGGTGCCATGGCCTGA"
            },
            {
                id: 5,
                name: "高产量",
                description: "提高植物的产量和生物量",
                icon: "🌾",
                sequence: "ATGGCGGCGGCGGCGATGAGGGTCACCAAGGTCATCGCGGCGGTGGCGGCGGCCGTCGTCGTCGTCGTCGCCGCCATCATCATCATGGTGGCGGAGGCCGGCGTCGGCGGCGAGGTCGGCGGCGGCGAGGGCGAGGGCGAGGCAGCCGCCGCCGCCGTCGCCGCAGTCGTCACCATCACCTCCTCCAAGAAGATGATGCGCAGCCGCCGCCGCACTGACGACGACGACGACGATGATGATGACGATCACGATGATGACGACGACGACGGGTACAAGAAGAAGAACTACCGCCTCCTCTCCTCCCGCCGCCGCAAGGCGCGCAAGAAGAAGAAGGTCGAGGACGACGACGAGTACGAGGAGGGCGCCTGA"
            },
            {
                id: 6,
                name: "早熟性",
                description: "缩短植物的生长周期，加速成熟",
                icon: "⏱️",
                sequence: "ATGTCCAGATCGACGACGATCAGCGCCATCGACGACGACGACGACGACGAGAGCGACGACGACGACGACGACCACAAGAAGATGATGATGATGATGATGATGATGCTCCACAACCACAAGATCGACGGCGACCACAAGAAGAAGTCGAAGTCCGCGTCGGCGTCCTCCTCCTCCTTCATCGTCCTCAAGGGCGAGGGCGAATCCGACGAGAACGACGGCGAGGAGGAGTTCTTCTTCTTCTTCTTCGGCGACGACGGCGACGAGGGCGACGACGACGAGATGAAGGAGGAGGAGGAGGAGGAGATGAAGATGATGAAGATCGACAAGGAGGAGGAGGAGGAGAAGGCCAGCTTCTGAATGCCAGCAACGCTGGCCTGA"
            },
            {
                id: 7,
                name: "抗盐碱性",
                description: "增强植物在盐碱土壤中的生长能力",
                icon: "🧂",
                sequence: "ATGGCGGCGGAGGAAGCAGCGGCGGCGGAAGAAGCAGCAGCAGTAGAAGAAGAAGAAGAGGACGACGACGAGACAGAGAGAGAGAGGAGACGGCAGCAGCAGCAGCAGCAGAAACAGAACAGCTTCCGCCGCAGCCGCAGCAGACGGCGTCGTCGTCGTCGTCGTCTTCTCTTCTCTACCTCCTCCTCCTCCTCCTCGTCGAAGTCGAAGTCGACGTCGACGTCGAAGAAGAAGAGACGAACCGCACCCTCCTCCCCGACGACGACGACGACGACGACGACGGCAAGAAGAAGAAGAAGAACAAGAGCAAGGTGCGCGCCCGGAAGCGGCTGCACCGGATGAGGGCGAGCGAGCTGAAGGCTGTGCTGAGGAAGTAG"
            },
            {
                id: 8,
                name: "高光效率",
                description: "提高植物的光合作用效率",
                icon: "☀️",
                sequence: "ATGGCCTCCTCTAGCGGCAGCGGCAGCAGCGGTGGAGGAGGAGGAGGAGGAAGCAGCAGCGGCGGCGGCGGCGGCGACGACGACGACGAAGAAGCAGCAGCAGCAGAAGAAGATGACGCAGAGGATCACGACGGCATCATCGTCGTCGTCGTCGTCGTCGTCGTCATCGTCGTCGTCGTCTTCGTCGGCGGCGAGCAGCAACAGCGGCGGTGGCAACAACAACAACAACAACAACAACGGCGTCGGCGGCGTCGGAGACGACGACGACGACGAGGCCAAGAAGAACAAGGCGGCGGCGGCGGCGGCCAAGCGCGCGAAGAAGAAGAAGAAGAAGCGCAAGCTGTCGTCGTCGTCGTCGTCTGCGTCTCGCTGA"
            },
            {
                id: 9,
                name: "高蛋白质含量",
                description: "提高植物的蛋白质含量",
                icon: "🥜",
                sequence: "ATGGTCGTCGTCGTCGTCGTCGTCGTCGTCGTCTCCGCCGCAGCAGCAGCAGCGGCGGCGGCGGAGAAGAAGAAGAAGAAGAAGATGATGGCGGCGGCGGCGGCGGCGGCGCAGCTGCAGCTGCAGCAGCAGCAGCAGCAGCAGAAGCAGGCGGCGGCGCCGGCGCCGGCGCCGGCGGCATTGTTGTTGTTGTTGTTGTTGTACTGGAGGAGGAGGAGGAGGAGCAACAACAACAACAACAAGCTCATCATCCTCTCCTCCTCCTCCTCCTCTAGCTCCTCCTCTTCCTCCTCCTCCTCCAGCAACCAGCAGCAGCAGCAGCAGCAGAAGCAGCAGCAGCAGCAGCTGCAGCTGCAGCAGCAGCAGCAGCAGTAG"
            },
            {
                id: 10,
                name: "高油脂含量",
                description: "提高植物的油脂含量",
                icon: "🛢️",
                sequence: "ATGGGCGGCGGCGGGCTCCTCCTCCTCCTCCTCCTCCTCCTCCTCCTCCTCCTGCTGATGATGATCATCATCATCCATCATCGTCGTCGTCGTCGTCGTCGTCGCAGCAGCAGCAGCAGCAGCAGCAGGAGCAGGAGGAGGAAGAAGAAGAAGAAGAAGGAGGCAGCGGCAGCGGCAGCGGCGGTGGCGGCGGCGGCGGCGGCGGCGGCGGCGGCGGCGGCGGCGGCGGCGGCGGCGGCGGCGGCGGCGGCGGCGGCGATGAAGAAGAAGCAGCCGCCGCTGCTGCTGCTGCAGCAGCAGGGCGGCGGCGGCGGCGGCGGAGGATGATGATGATGCATCATGATGATGATGATGATGATGTCATCATCATCATCATCATCATCACTGCAACTGCAACTGCTTGA"
            },
            {
                id: 11,
                name: "喷火",
                description: "赋予植物喷射火焰的能力",
                icon: "🔥",
                sequence: "ATGCGTACCGTGCATGTTCAGTACACGCGTACCGTGAAAGCGTTTCAGACGTTTCAGTACGCGAAACAGTACGCGATGCGTATGCAGCGTAGCGCAGCGCTCTCGTTACGCGCAGTACGCTATGCTGACGCACGCGATGCTCCACGCATGTCTCCCGCAGTACTCGCGTTGTCACGCACGATGCACTCAGCACGACTCAGCAGCACGGAGTACAGCATGAGCGTCATGCACTCGCGTACGCACGTCACGACTCGAGCGTACGCATGCCGCTGACGCATCGGTACGCATGCCGCTGTCGCATGTACCGCATCGACATGCAGTCACGCTGACGCATGCCGCTGACGCTGACTGCATGACTGCATCGAGTCGTAA"
            },
            {
                id: 12,
                name: "考试满分",
                description: "帮助学生在考试中获得满分的特殊能力",
                icon: "📝",
                sequence: "ATGACGACGGCTGCGGCATCGATCGATCGCGGCATCGATCGCGGCATTGCGGCGCAGCATCGATCGATCGAACGATCGATCGATCTCAGCATCGATCGACCGACATCTCGACGACGGCTGCGATCGAGCGAGCTCAGACGACGACGGGAGCTCAGACGCAGTCAGCAGACGACGGCATCGTAGCATCGATCGATCGATCGATCGCGGCGCGGCGCGGCGCGCGGCGCGACGACAGCAGCATCGCACGCACGCACGCACGCACGCACGATCGAGCACTCGACTCGACGATCGATCAGCGACGCTCAGCGCAGCGACGCATCGATCGATCTCGCGCACGATCGATCGATCGCGATCGCTGCGATCAGCTCAGCTGA"
            }
        ];
        
        // 在页面上生成性状选项
        const traitOptionsContainer = document.getElementById('trait-options');
        if (traitOptionsContainer) {
            traits.forEach(trait => {
                const traitCard = document.createElement('div');
                traitCard.className = 'col-md-3 mb-3';
                traitCard.innerHTML = `
                    <div class="card trait-card" data-trait-id="${trait.id}">
                        <div class="card-body text-center">
                            <div class="trait-icon">${trait.icon}</div>
                            <h5 class="card-title">${trait.name}</h5>
                            <p class="card-text small">${trait.description}</p>
                        </div>
                    </div>
                `;
                traitOptionsContainer.appendChild(traitCard);
                
                // 添加点击事件
                const cardElement = traitCard.querySelector('.trait-card');
                cardElement.addEventListener('click', function() {
                    selectTrait(trait.id);
                });
            });
        }
    }
    
    // 选择性状
    function selectTrait(traitId) {
        // 移除之前的选择
        document.querySelectorAll('.trait-card').forEach(card => {
            card.classList.remove('selected');
        });
        
        // 获取选中的性状
        selectedTrait = traits.find(trait => trait.id === traitId);
        
        if (selectedTrait) {
            // 标记当前选中的卡片
            document.querySelector(`.trait-card[data-trait-id="${traitId}"]`).classList.add('selected');
            
            // 更新选中性状信息
            const selectedTraitInfo = document.getElementById('selected-trait-info');
            selectedTraitInfo.innerHTML = `
                <div class="alert alert-info">
                    <h5><span class="trait-icon">${selectedTrait.icon}</span> ${selectedTrait.name}</h5>
                    <p>${selectedTrait.description}</p>
                </div>
            `;
            
            // 启用下一步按钮
            document.getElementById('dna-selection-next').disabled = false;
        }
    }
    
    // 显示DNA序列到引物设计页面
    function showSequenceForPrimerDesign() {
        if (selectedTrait) {
            document.getElementById('primer-trait-name').textContent = selectedTrait.name;
            document.getElementById('target-sequence').textContent = formatDNASequence(selectedTrait.sequence);
        }
    }
    
    // 格式化DNA序列显示（每10个碱基一组）
    function formatDNASequence(sequence) {
        let formattedSequence = '';
        for (let i = 0; i < sequence.length; i += 10) {
            const group = sequence.substring(i, i + 10);
            formattedSequence += group + ' ';
            if ((i + 10) % 60 === 0) {
                formattedSequence += '\n';
            }
        }
        return formattedSequence;
    }
    
    // 检查引物
    function checkPrimers() {
        if (!selectedTrait) return;
        
        const forwardPrimer = document.getElementById('forward-primer-input').value.trim().toUpperCase();
        const reversePrimer = document.getElementById('reverse-primer-input').value.trim().toUpperCase();
        
        // 重置评估
        const primerQualityAssessment = document.getElementById('primer-quality-assessment');
        primerQualityAssessment.innerHTML = '';
        
        // 验证引物长度
        if (forwardPrimer.length < 18 || forwardPrimer.length > 25 || 
            reversePrimer.length < 18 || reversePrimer.length > 25) {
            primerQualityAssessment.innerHTML += `
                <div class="alert alert-warning">
                    <p>引物长度问题：引物长度应为18-25个碱基</p>
                </div>
            `;
            return;
        }
        
        // 验证GC含量
        const forwardGCContent = calculateGCContent(forwardPrimer);
        const reverseGCContent = calculateGCContent(reversePrimer);
        
        if (forwardGCContent < 40 || forwardGCContent > 60 || 
            reverseGCContent < 40 || reverseGCContent > 60) {
            primerQualityAssessment.innerHTML += `
                <div class="alert alert-warning">
                    <p>GC含量问题：GC含量应在40%-60%之间</p>
                    <p>正向引物GC含量: ${forwardGCContent.toFixed(1)}%</p>
                    <p>反向引物GC含量: ${reverseGCContent.toFixed(1)}%</p>
                </div>
            `;
            return;
        }
        
        // 验证引物特异性（验证引物是否与模板的正确位置匹配）
        const sequence = selectedTrait.sequence;
        const fwdMatch = sequence.startsWith(forwardPrimer);
        
        // 反向引物应与模板3'端互补的反向序列匹配
        const reverseComplement = getReverseComplement(reversePrimer);
        const rvMatch = sequence.endsWith(reverseComplement);
        
        if (!fwdMatch || !rvMatch) {
            primerQualityAssessment.innerHTML += `
                <div class="alert alert-danger">
                    <p>引物匹配问题：</p>
                    ${!fwdMatch ? '<p>正向引物与模板5\'端不匹配</p>' : ''}
                    ${!rvMatch ? '<p>反向引物与模板3\'端不匹配</p>' : ''}
                    <p>请检查序列并重新设计引物</p>
                </div>
            `;
            return;
        }
        
        // 一切正常，引物设计合格
        primerQualityAssessment.innerHTML = `
            <div class="alert alert-success">
                <p><strong>引物设计合格！</strong></p>
                <p>正向引物长度: ${forwardPrimer.length} bp</p>
                <p>反向引物长度: ${reversePrimer.length} bp</p>
                <p>正向引物GC含量: ${forwardGCContent.toFixed(1)}%</p>
                <p>反向引物GC含量: ${reverseGCContent.toFixed(1)}%</p>
                <p>引物特异性: 良好</p>
            </div>
        `;
        
        // 设置引物正确标志
        primerCorrect = true;
        // 启用下一步按钮
        document.getElementById('primer-design-next').disabled = false;
    }
    
    // 计算GC含量
    function calculateGCContent(sequence) {
        let gcCount = 0;
        for (let i = 0; i < sequence.length; i++) {
            if (sequence[i] === 'G' || sequence[i] === 'C') {
                gcCount++;
            }
        }
        return (gcCount / sequence.length) * 100;
    }
    
    // 获取反向互补序列
    function getReverseComplement(sequence) {
        const complement = {
            'A': 'T',
            'T': 'A',
            'G': 'C',
            'C': 'G'
        };
        
        let reverseComplement = '';
        for (let i = sequence.length - 1; i >= 0; i--) {
            reverseComplement += complement[sequence[i]] || sequence[i];
        }
        return reverseComplement;
    }
    
    // DNA选取下一步按钮点击事件
    document.getElementById('dna-selection-next')?.addEventListener('click', function() {
        showSequenceForPrimerDesign();
    });
    
    // 检查引物按钮点击事件
    document.getElementById('check-primers')?.addEventListener('click', function() {
        checkPrimers();
    });

    // 自动设计引物
    function autoDesignPrimers() {
        if (!selectedTrait) return;
        
        // 使用序列的前20个碱基作为正向引物
        const sequence = selectedTrait.sequence;
        const forwardPrimer = sequence.substring(0, 20);
        
        // 使用序列的最后20个碱基的互补反向序列作为反向引物
        const reverseComplementSegment = getReverseComplement(sequence.substring(sequence.length - 20));
        
        // 填充到输入框
        document.getElementById('forward-primer-input').value = forwardPrimer;
        document.getElementById('reverse-primer-input').value = reverseComplementSegment;
        
        // 检查引物质量
        checkPrimers();
        
        // 显示自动设计成功信息
        const primerQualityAssessment = document.getElementById('primer-quality-assessment');
        primerQualityAssessment.innerHTML = `
            <div class="alert alert-success">
                <p><strong>引物已自动设计成功！</strong></p>
                <p>正向引物: ${forwardPrimer}</p>
                <p>反向引物: ${reverseComplementSegment}</p>
                <p>这些引物已针对选定的DNA序列进行了优化。</p>
            </div>
        `;
        
        // 设置引物正确标志
        primerCorrect = true;
        // 启用下一步按钮
        document.getElementById('primer-design-next').disabled = false;
    }
    
    // 自动设计引物按钮点击事件
    document.getElementById('auto-design-primers')?.addEventListener('click', function() {
        autoDesignPrimers();
    });

    // 函数：更新PCR设置表单状态
    function updatePCRFormStatus() {
        // 获取所有PCR设置输入字段
        const fields = [
            'initial-denaturation-temp', 'initial-denaturation-time',
            'cycles',
            'denaturation-temp', 'denaturation-time',
            'annealing-temp', 'annealing-time',
            'extension-temp', 'extension-time',
            'final-extension-temp', 'final-extension-time'
        ];
        
        // 检查所有字段是否已填写
        const allFilled = fields.every(id => {
            const value = document.getElementById(id).value.trim();
            return value !== '';
        });
        
        // 根据是否所有字段都已填写启用或禁用下一步按钮
        document.querySelector('#step-3 .next-step').disabled = !allFilled;
    }
    
    // 为PCR设置输入字段添加事件监听
    document.querySelectorAll('#step-3 input[type="number"]').forEach(input => {
        input.addEventListener('change', updatePCRFormStatus);
        input.addEventListener('input', updatePCRFormStatus);
    });

    // 初始调用一次更新状态
    if (document.querySelector('#step-3')) {
        updatePCRFormStatus();
    }
}); 