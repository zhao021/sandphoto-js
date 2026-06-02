class UIGenerator {
    constructor(config = {}) {
        const baseConfig = UIGenerator.getChineseConfig();
        this.config = {
            previewType: config.previewType || 'canvas',
            texts: {
                ...baseConfig.texts,
                ...(config.texts || {})
            }
        };
    }

    createElement(tag, className, text) {
        const element = document.createElement(tag);
        if (className) element.className = className;
        if (text !== undefined) element.textContent = text;
        return element;
    }

    createField(labelText, control) {
        const field = this.createElement('label', 'field');
        const label = this.createElement('span', 'field-label', labelText);
        field.appendChild(label);
        field.appendChild(control);
        return field;
    }

    createSelect(id, options = []) {
        const select = document.createElement('select');
        select.id = id;
        select.className = 'form-control';

        options.forEach((option) => {
            const optionElement = document.createElement('option');
            optionElement.value = option.value;
            optionElement.textContent = option.text;
            if (option.selected) optionElement.selected = true;
            select.appendChild(optionElement);
        });

        return select;
    }

    createNumberInput(id, options = {}) {
        const input = document.createElement('input');
        input.type = 'number';
        input.id = id;
        input.className = 'form-control';
        Object.entries(options).forEach(([key, value]) => {
            input[key] = value;
        });
        return input;
    }

    generateFormContainer(containerId = 'photo-layout-form') {
        const shell = this.createElement('div', 'layout-studio');
        shell.id = containerId;

        shell.appendChild(this.generateSettingsBar());

        const workspace = this.createElement('div', 'workspace-grid');
        workspace.appendChild(this.generateUploadSection());
        workspace.appendChild(this.generatePreviewSection());
        shell.appendChild(workspace);

        return shell;
    }

    generateSettingsBar() {
        const bar = this.createElement('section', 'settings-bar');

        const heading = this.createElement('div', 'settings-heading');
        heading.appendChild(this.createElement('strong', 'settings-title', this.config.texts.settingsTitle));
        bar.appendChild(heading);

        const controls = this.createElement('div', 'settings-controls');
        controls.appendChild(this.generatePhotoSizeField());
        controls.appendChild(this.generatePaperSizeField());
        controls.appendChild(this.generatePhotoCountField());
        controls.appendChild(this.generateLayoutModeField());
        controls.appendChild(this.generateLineFields());
        controls.appendChild(this.generateDownloadSection());
        bar.appendChild(controls);

        return bar;
    }

    generatePhotoSizeField() {
        const wrapper = this.createElement('div', 'setting-stack setting-size');
        const select = this.createSelect('targetType', [
            { value: '', text: this.config.texts.selectPhotoSize }
        ]);
        wrapper.appendChild(this.createField(this.config.texts.photoShortLabel, select));
        wrapper.appendChild(this.generateCustomSizeSection());
        return wrapper;
    }

    generateCustomSizeSection() {
        const section = this.createElement('div', 'inline-fields custom-size-section');
        section.id = 'customSizeSection';
        section.hidden = true;

        section.appendChild(this.createField(this.config.texts.customWidth, this.createNumberInput('customWidth', {
            min: '0.1',
            max: '50',
            step: '0.1',
            placeholder: '3.5'
        })));
        section.appendChild(this.createField(this.config.texts.customHeight, this.createNumberInput('customHeight', {
            min: '0.1',
            max: '50',
            step: '0.1',
            placeholder: '4.8'
        })));

        return section;
    }

    generatePaperSizeField() {
        const select = this.createSelect('containerType', [
            { value: '', text: this.config.texts.selectPaperSize }
        ]);
        return this.createField(this.config.texts.paperShortLabel, select);
    }

    generatePhotoCountField() {
        const wrapper = this.createElement('div', 'setting-stack setting-count');
        const select = this.createSelect('photoCountSelect', [
            { value: 'auto', text: this.config.texts.auto, selected: true },
            { value: '1', text: '1' },
            { value: '2', text: '2' },
            { value: '4', text: '4' },
            { value: '6', text: '6' },
            { value: '8', text: '8' },
            { value: '12', text: '12' },
            { value: '16', text: '16' },
            { value: '20', text: '20' },
            { value: '24', text: '24' },
            { value: 'custom', text: this.config.texts.custom }
        ]);
        wrapper.appendChild(this.createField(this.config.texts.countShortLabel, select));
        wrapper.appendChild(this.generateCustomCountSection());
        return wrapper;
    }

    generateLayoutModeField() {
        return this.createField(this.config.texts.layoutModeLabel, this.createSelect('layoutMode', [
            { value: 'balanced', text: this.config.texts.layoutBalanced, selected: true },
            { value: 'landscape', text: this.config.texts.layoutLandscape },
            { value: 'portrait', text: this.config.texts.layoutPortrait }
        ]));
    }

    generateCustomCountSection() {
        const section = this.createElement('div', 'photo-count-section');
        section.id = 'photoCountSection';
        section.hidden = true;
        section.appendChild(this.createField(this.config.texts.customCount, this.createNumberInput('customPhotoCount', {
            min: '1',
            max: '100',
            step: '1',
            placeholder: '10'
        })));
        return section;
    }

    generateLineFields() {
        const group = this.createElement('div', 'line-controls');

        group.appendChild(this.createField(this.config.texts.gapShortLabel, this.createNumberInput('gapMm', {
            min: '0',
            max: '50',
            step: '1',
            value: '5'
        })));

        group.appendChild(this.createField(this.config.texts.guideColorShortLabel, this.createSelect('guideColor', [
            { value: '#2563eb', text: this.config.texts.lineBlue, selected: true },
            { value: '#111827', text: this.config.texts.lineBlack },
            { value: '#6b7280', text: this.config.texts.lineGray }
        ])));

        return group;
    }

    generateUploadModeToggle() {
        const group = this.createElement('div', 'segmented-control');
        group.setAttribute('role', 'radiogroup');
        group.setAttribute('aria-label', this.config.texts.uploadModeLabel);

        [
            { value: 'single', label: this.config.texts.singlePhotoMode, checked: true },
            { value: 'multi', label: this.config.texts.multiPhotoMode }
        ].forEach((item) => {
            const label = this.createElement('label', 'segment');
            const input = document.createElement('input');
            input.type = 'radio';
            input.name = 'uploadMode';
            input.value = item.value;
            input.checked = !!item.checked;
            label.appendChild(input);
            label.appendChild(this.createElement('span', '', item.label));
            group.appendChild(label);
        });

        return group;
    }

    generateUploadSection() {
        const section = this.createElement('section', 'photo-panel');

        const header = this.createElement('div', 'panel-header');
        header.appendChild(this.createElement('h2', 'panel-title', this.config.texts.uploadTitle));
        header.appendChild(this.generateUploadModeToggle());
        section.appendChild(header);

        section.appendChild(this.generateUploadArea('singleUploadArea', 'filename', false));
        section.appendChild(this.generateUploadArea('multiUploadArea', 'multiFilename', true));

        const photoListContainer = this.createElement('div', 'photo-list-container');
        photoListContainer.id = 'photoListContainer';
        photoListContainer.appendChild(this.createElement('h3', 'subtle-title', this.config.texts.uploadedPhotos));
        const photoList = this.createElement('div', 'photo-list');
        photoList.id = 'photoList';
        photoListContainer.appendChild(photoList);
        section.appendChild(photoListContainer);

        return section;
    }

    generateUploadArea(areaId, inputId, multiple) {
        const area = this.createElement('div', 'upload-area');
        area.id = areaId;
        if (multiple) area.hidden = true;

        area.appendChild(this.createElement('span', 'upload-mark', '+'));
        area.appendChild(this.createElement('span', 'upload-text', multiple ? this.config.texts.multiDragDropText : this.config.texts.dragDropText));

        const input = document.createElement('input');
        input.type = 'file';
        input.id = inputId;
        input.accept = 'image/*';
        input.multiple = multiple;
        input.hidden = true;
        area.appendChild(input);

        return area;
    }

    generatePreviewSection() {
        const section = this.createElement('section', 'preview-panel is-empty');
        section.id = 'previewContainer';

        const header = this.createElement('div', 'panel-header');
        header.appendChild(this.createElement('h2', 'panel-title', this.config.texts.previewTitle));

        const countInfo = this.createElement('p', 'photo-count-info');
        countInfo.innerHTML = `${this.config.texts.photoCountText} <span id="count">0</span>`;
        header.appendChild(countInfo);
        section.appendChild(header);

        const frame = this.createElement('div', 'preview-frame');
        const empty = this.createElement('div', 'preview-empty', this.config.texts.emptyPreview);
        empty.id = 'previewEmpty';
        frame.appendChild(empty);

        let previewElement;
        if (this.config.previewType === 'canvas') {
            previewElement = document.createElement('canvas');
            previewElement.id = 'previewCanvas';
            previewElement.width = 800;
            previewElement.height = 600;
        } else {
            previewElement = document.createElement('img');
            previewElement.id = 'previewImg';
            previewElement.alt = this.config.texts.previewTitle;
        }
        previewElement.hidden = true;
        frame.appendChild(previewElement);

        section.appendChild(frame);
        return section;
    }

    generateDownloadSection() {
        const button = document.createElement('button');
        button.type = 'button';
        button.id = 'downloadBtn';
        button.className = 'download-btn';
        button.disabled = true;
        button.textContent = this.config.texts.downloadButton;
        return button;
    }

    generateCompleteForm(containerId = 'photo-layout-form') {
        const form = document.createElement('form');
        form.id = 'photoLayoutForm';
        form.addEventListener('submit', (event) => event.preventDefault());
        form.appendChild(this.generateFormContainer(containerId));
        return form;
    }

    static getChineseConfig() {
        return {
            texts: {
                settingsTitle: '照片打印版排版',
                selectPhotoSize: '照片尺寸',
                photoShortLabel: '照片',
                customSize: '自定义尺寸',
                customWidth: '宽度',
                customHeight: '高度',
                selectPaperSize: '冲印纸张',
                paperShortLabel: '纸张',
                gapShortLabel: '间距',
                guideColorShortLabel: '虚线',
                lineBlue: '蓝色',
                lineBlack: '黑色',
                lineGray: '灰色',
                layoutModeLabel: '排版',
                layoutBalanced: '自动',
                layoutLandscape: '横向',
                layoutPortrait: '竖向',
                countShortLabel: '张数',
                auto: '自动铺满',
                custom: '自定义',
                customCount: '自定义张数',
                uploadTitle: '照片队列',
                uploadModeLabel: '上传模式',
                dragDropText: '添加一张照片',
                multiDragDropText: '添加多张照片',
                singlePhotoMode: '单张',
                multiPhotoMode: '多张',
                uploadedPhotos: '已添加',
                emptyPhotoList: '还没有照片',
                currentPhoto: '当前照片',
                removePhoto: '移除',
                photoCopies: '份数',
                previewTitle: '成品预览',
                photoCountText: '已排张数',
                emptyPreview: '添加照片后显示排版预览',
                downloadButton: '下载图片',
                selectImageFile: '请选择图片文件。',
                fileSizeLimit: '文件大小必须小于 8MB。',
                invalidCustomSize: '请输入有效的照片尺寸。',
                customSizeLimit: '自定义尺寸不能超过 50cm。',
                invalidPhotoCount: '请输入有效的照片张数。',
                photoCountLimit: '自定义张数不能超过 100。',
                previewError: '生成预览时出错，请重试。',
                generatePreviewFirst: '请先生成预览。',
                selectValidSizes: '请选择有效的照片和纸张尺寸。',
                downloadError: '下载图片时出错，请重试。'
            }
        };
    }

}
