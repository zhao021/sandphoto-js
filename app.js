class PhotoLayoutApp {
    constructor(config = {}) {
        this.config = {
            elementIds: {
                photoInput: 'filename',
                targetTypeSelect: 'targetType',
                containerTypeSelect: 'containerType',
                guideColorSelect: 'guideColor',
                layoutModeSelect: 'layoutMode',
                previewSection: 'previewContainer',
                previewCanvas: 'previewCanvas',
                previewEmpty: 'previewEmpty',
                photoCount: 'count',
                downloadBtn: 'downloadBtn',
                customSizeGroup: 'customSizeSection',
                customWidthInput: 'customWidth',
                customHeightInput: 'customHeight',
                photoCountSelect: 'photoCountSelect',
                customCountGroup: 'photoCountSection',
                customPhotoCountInput: 'customPhotoCount',
                gapInputMm: 'gapMm',
                singleUploadArea: 'singleUploadArea',
                multiUploadArea: 'multiUploadArea',
                multiFileInput: 'multiFilename',
                photoListContainer: 'photoListContainer',
                photoList: 'photoList',
                uploadModeRadios: 'uploadMode',
                ...(config.elementIds || {})
            },
            texts: {
                selectPhotoSize: '照片尺寸',
                selectPaperSize: '冲印纸张',
                customSize: '自定义尺寸',
                selectPhotoCount: '照片张数',
                auto: '自动铺满',
                custom: '自定义',
                selectImageFile: '请选择图片文件。',
                fileSizeLimit: '文件大小必须小于 8MB。',
                previewError: '生成预览时出错，请重试。',
                downloadError: '下载图片时出错，请重试。',
                ...(config.texts || {})
            }
        };

        this.currentImage = null;
        this.currentImageFilename = '';
        this.currentPhotoCount = 0;
        this.layoutEngine = null;
        this.uploadedPhotos = [];
        this.isMultiPhotoMode = false;

        this.initializeUI();
        this.setupEventListeners();
        this.populatePhotoTypes();
        this.updatePhotoList();
    }

    initializeUI() {
        const ids = this.config.elementIds;
        this.photoInput = document.getElementById(ids.photoInput);
        this.targetTypeSelect = document.getElementById(ids.targetTypeSelect);
        this.containerTypeSelect = document.getElementById(ids.containerTypeSelect);
        this.guideColorSelect = document.getElementById(ids.guideColorSelect);
        this.layoutModeSelect = document.getElementById(ids.layoutModeSelect);
        this.previewSection = document.getElementById(ids.previewSection);
        this.previewCanvas = document.getElementById(ids.previewCanvas);
        this.previewEmpty = document.getElementById(ids.previewEmpty);
        this.photoCount = document.getElementById(ids.photoCount);
        this.downloadBtn = document.getElementById(ids.downloadBtn);
        this.customSizeGroup = document.getElementById(ids.customSizeGroup);
        this.customWidthInput = document.getElementById(ids.customWidthInput);
        this.customHeightInput = document.getElementById(ids.customHeightInput);
        this.photoCountSelect = document.getElementById(ids.photoCountSelect);
        this.customCountGroup = document.getElementById(ids.customCountGroup);
        this.customPhotoCountInput = document.getElementById(ids.customPhotoCountInput);
        this.gapInputMm = document.getElementById(ids.gapInputMm);
        this.singleUploadArea = document.getElementById(ids.singleUploadArea);
        this.multiUploadArea = document.getElementById(ids.multiUploadArea);
        this.multiFileInput = document.getElementById(ids.multiFileInput);
        this.photoListContainer = document.getElementById(ids.photoListContainer);
        this.photoList = document.getElementById(ids.photoList);
    }

    setupEventListeners() {
        if (this.photoInput) {
            this.photoInput.addEventListener('change', (event) => this.handleFileSelect(event));
        }

        if (this.multiFileInput) {
            this.multiFileInput.addEventListener('change', (event) => this.handleMultiFileSelect(event));
        }

        document.querySelectorAll('input[name="uploadMode"]').forEach((radio) => {
            radio.addEventListener('change', (event) => this.handleUploadModeChange(event));
        });

        this.bindDropArea(this.singleUploadArea, (files) => {
            if (files.length > 0) this.handleFile(files[0]);
        }, () => this.photoInput?.click());

        this.bindDropArea(this.multiUploadArea, (files) => {
            if (files.length > 0) this.handleMultiFiles(Array.from(files));
        }, () => this.multiFileInput?.click());

        [
            this.containerTypeSelect,
            this.guideColorSelect,
            this.layoutModeSelect,
            this.customWidthInput,
            this.customHeightInput,
            this.customPhotoCountInput,
            this.gapInputMm
        ].forEach((element) => {
            if (element) element.addEventListener('input', () => this.updatePreview());
            if (element && element.tagName === 'SELECT') element.addEventListener('change', () => this.updatePreview());
        });

        if (this.targetTypeSelect) {
            this.targetTypeSelect.addEventListener('change', () => this.handlePhotoSizeChange());
        }

        if (this.photoCountSelect) {
            this.photoCountSelect.addEventListener('change', () => this.handlePhotoCountChange());
        }

        if (this.downloadBtn) {
            this.downloadBtn.addEventListener('click', () => this.downloadImage());
        }
    }

    bindDropArea(area, onFiles, onClick) {
        if (!area) return;

        area.addEventListener('dragover', (event) => {
            event.preventDefault();
            area.classList.add('dragover');
        });

        area.addEventListener('dragleave', (event) => {
            event.preventDefault();
            area.classList.remove('dragover');
        });

        area.addEventListener('drop', (event) => {
            event.preventDefault();
            area.classList.remove('dragover');
            onFiles(event.dataTransfer.files);
        });

        area.addEventListener('click', onClick);
    }

    setHidden(element, hidden) {
        if (!element) return;
        element.hidden = hidden;
        element.classList.toggle('show', !hidden);
    }

    handlePhotoSizeChange() {
        const isCustom = this.targetTypeSelect?.value === 'custom';
        this.setHidden(this.customSizeGroup, !isCustom);

        if (isCustom) {
            if (this.customWidthInput && !this.customWidthInput.value) this.customWidthInput.value = '3.5';
            if (this.customHeightInput && !this.customHeightInput.value) this.customHeightInput.value = '4.8';
        }

        this.updatePreview();
    }

    handlePhotoCountChange() {
        const isCustom = this.photoCountSelect?.value === 'custom';
        this.setHidden(this.customCountGroup, !isCustom);

        if (isCustom && this.customPhotoCountInput && !this.customPhotoCountInput.value) {
            this.customPhotoCountInput.value = '10';
        }

        this.updatePreview();
    }

    populatePhotoTypes() {
        this.targetTypes = [
            ...getPhotoTypesByCategoryLocalized('id'),
            ...getPhotoTypesByCategoryLocalized('document')
        ];
        this.containerTypes = getPhotoTypesByCategoryLocalized('paper');

        if (this.targetTypeSelect) {
            this.targetTypeSelect.innerHTML = `<option value="">${this.config.texts.selectPhotoSize}</option>`;
            this.targetTypes.forEach((type, index) => {
                const option = document.createElement('option');
                option.value = String(index);
                option.textContent = this.formatTypeLabel(type);
                this.targetTypeSelect.appendChild(option);
            });

            const customOption = document.createElement('option');
            customOption.value = 'custom';
            customOption.textContent = this.config.texts.customSize;
            this.targetTypeSelect.appendChild(customOption);
            this.targetTypeSelect.value = '0';
        }

        if (this.containerTypeSelect) {
            this.containerTypeSelect.innerHTML = `<option value="">${this.config.texts.selectPaperSize}</option>`;
            this.containerTypes.forEach((type, index) => {
                const option = document.createElement('option');
                option.value = String(index);
                option.textContent = this.formatTypeLabel(type);
                this.containerTypeSelect.appendChild(option);
            });
            this.containerTypeSelect.value = '0';
        }
    }

    formatTypeLabel(type) {
        return `${this.getTypeName(type)} (${type.width}cm x ${type.height}cm)`;
    }

    getTypeName(type) {
        return type.name_zh || type.name || '自定义规格';
    }

    handleFileSelect(event) {
        const file = event.target.files[0];
        if (file) this.handleFile(file);
    }

    handleFile(file) {
        if (!this.isValidImage(file)) return;

        const reader = new FileReader();
        reader.onload = (event) => {
            const img = new Image();
            img.onload = () => {
                this.currentImage = img;
                this.currentImageFilename = file.name;
                this.updatePhotoList();
                this.updatePreview();
            };
            img.src = event.target.result;
        };
        reader.readAsDataURL(file);
    }

    handleMultiFileSelect(event) {
        this.handleMultiFiles(Array.from(event.target.files));
    }

    handleMultiFiles(files) {
        const validFiles = files.filter((file) => this.isValidImage(file, file.name));
        validFiles.forEach((file) => {
            const reader = new FileReader();
            reader.onload = (event) => {
                const img = new Image();
                img.onload = () => this.addPhotoToList(img, file.name);
                img.src = event.target.result;
            };
            reader.readAsDataURL(file);
        });
    }

    isValidImage(file, label = '') {
        if (!file.type.startsWith('image/')) {
            alert(label ? `${label}: ${this.config.texts.selectImageFile}` : this.config.texts.selectImageFile);
            return false;
        }

        if (file.size > 8 * 1024 * 1024) {
            alert(label ? `${label}: ${this.config.texts.fileSizeLimit}` : this.config.texts.fileSizeLimit);
            return false;
        }

        return true;
    }

    addPhotoToList(img, filename) {
        this.uploadedPhotos.push({
            id: (window.crypto && window.crypto.randomUUID) ? window.crypto.randomUUID() : `${Date.now()}-${Math.random()}`,
            image: img,
            filename,
            copies: 1
        });
        this.updatePhotoList();
        this.updatePreview();
    }

    removePhotoFromList(photoId) {
        if (photoId === 'single-current') {
            this.currentImage = null;
            this.currentImageFilename = '';
            if (this.photoInput) this.photoInput.value = '';
            this.updatePhotoList();
            this.updatePreview();
            return;
        }

        this.uploadedPhotos = this.uploadedPhotos.filter((photo) => photo.id !== photoId);
        this.updatePhotoList();
        this.updatePreview();
    }

    updatePhotoCopies(photoId, copies) {
        const photo = this.uploadedPhotos.find((item) => item.id === photoId);
        if (!photo) return;
        photo.copies = Math.max(1, Math.min(50, parseInt(copies, 10) || 1));
        this.updatePreview();
    }

    updatePhotoList() {
        if (!this.photoList) return;
        this.photoList.innerHTML = '';

        const photos = this.isMultiPhotoMode
            ? this.uploadedPhotos
            : (this.currentImage ? [{
                id: 'single-current',
                image: this.currentImage,
                filename: this.currentImageFilename || this.config.texts.currentPhoto || '当前照片',
                copies: 1,
                readOnlyCopies: true
            }] : []);

        if (!photos.length) {
            const empty = document.createElement('div');
            empty.className = 'photo-list-empty';
            empty.textContent = this.config.texts.emptyPhotoList || '添加照片后会显示在这里';
            this.photoList.appendChild(empty);
            return;
        }

        photos.forEach((photo) => {
            const photoItem = document.createElement('div');
            photoItem.className = 'photo-list-item';

            const thumbnail = document.createElement('canvas');
            thumbnail.className = 'photo-thumb';
            thumbnail.width = 56;
            thumbnail.height = 56;
            const ctx = thumbnail.getContext('2d');
            const scale = Math.min(56 / photo.image.width, 56 / photo.image.height);
            const scaledWidth = photo.image.width * scale;
            const scaledHeight = photo.image.height * scale;
            ctx.fillStyle = '#ffffff';
            ctx.fillRect(0, 0, 56, 56);
            ctx.drawImage(photo.image, (56 - scaledWidth) / 2, (56 - scaledHeight) / 2, scaledWidth, scaledHeight);

            const filenameSpan = document.createElement('span');
            filenameSpan.className = 'photo-name';
            filenameSpan.textContent = photo.filename;

            const copiesInput = document.createElement('input');
            copiesInput.type = 'number';
            copiesInput.min = '1';
            copiesInput.max = '50';
            copiesInput.value = photo.copies;
            copiesInput.className = 'copy-input';
            copiesInput.disabled = !!photo.readOnlyCopies;
            copiesInput.setAttribute('aria-label', this.config.texts.photoCopies || '份数');
            copiesInput.addEventListener('input', (event) => this.updatePhotoCopies(photo.id, event.target.value));

            const removeBtn = document.createElement('button');
            removeBtn.type = 'button';
            removeBtn.className = 'remove-photo-btn';
            removeBtn.textContent = 'x';
            removeBtn.setAttribute('aria-label', this.config.texts.removePhoto || '移除');
            removeBtn.addEventListener('click', () => this.removePhotoFromList(photo.id));

            photoItem.appendChild(thumbnail);
            photoItem.appendChild(filenameSpan);
            if (photo.readOnlyCopies) {
                const badge = document.createElement('span');
                badge.className = 'single-photo-badge';
                badge.textContent = this.config.texts.singlePhotoMode || '单张';
                photoItem.appendChild(badge);
            } else {
                photoItem.appendChild(copiesInput);
            }
            photoItem.appendChild(removeBtn);
            this.photoList.appendChild(photoItem);
        });
    }

    handleUploadModeChange(event) {
        this.isMultiPhotoMode = event.target.value === 'multi';
        this.setHidden(this.singleUploadArea, this.isMultiPhotoMode);
        this.setHidden(this.multiUploadArea, !this.isMultiPhotoMode);
        this.setHidden(this.photoListContainer, false);

        if (this.photoCountSelect) this.photoCountSelect.disabled = this.isMultiPhotoMode;
        this.setHidden(this.customCountGroup, this.isMultiPhotoMode || this.photoCountSelect?.value !== 'custom');

        if (!this.isMultiPhotoMode) this.uploadedPhotos = [];
        this.updatePhotoList();
        this.updatePreview();
    }

    getSelectedPhotoSize() {
        const selectedValue = this.targetTypeSelect?.value;
        if (selectedValue === 'custom') {
            const width = parseFloat(this.customWidthInput?.value);
            const height = parseFloat(this.customHeightInput?.value);

            if (!width || !height || width <= 0 || height <= 0) {
                if (this.hasPhotos()) alert(this.config.texts.invalidCustomSize);
                return null;
            }

            if (width > 50 || height > 50) {
                alert(this.config.texts.customSizeLimit);
                return null;
            }

            return {
                name: `${this.config.texts.custom} ${width}x${height}cm`,
                width,
                height,
                category: 'custom'
            };
        }

        return this.targetTypes[parseInt(selectedValue, 10)];
    }

    getSelectedPhotoCount() {
        const selectedValue = this.photoCountSelect?.value || 'auto';
        if (selectedValue === 'auto') return 'auto';

        if (selectedValue === 'custom') {
            const count = parseInt(this.customPhotoCountInput?.value, 10);
            if (!count || count <= 0) {
                if (this.hasPhotos()) alert(this.config.texts.invalidPhotoCount);
                return null;
            }
            if (count > 100) {
                alert(this.config.texts.photoCountLimit);
                return null;
            }
            return count;
        }

        return parseInt(selectedValue, 10);
    }

    getSelectedGuideOptions() {
        return {
            color: this.guideColorSelect?.value || '#2563eb'
        };
    }

    getSelectedLayoutMode() {
        return this.layoutModeSelect?.value || 'balanced';
    }

    hasPhotos() {
        return this.isMultiPhotoMode ? this.uploadedPhotos.length > 0 : !!this.currentImage;
    }

    updatePreview() {
        if (!this.hasPhotos()) {
            this.setPreviewEmpty(true);
            if (this.downloadBtn) this.downloadBtn.disabled = true;
            return;
        }

        const targetType = this.getSelectedPhotoSize();
        const containerType = this.containerTypes[parseInt(this.containerTypeSelect?.value, 10)];
        if (!targetType || !containerType) return;

        const photoCountSetting = this.isMultiPhotoMode ? null : this.getSelectedPhotoCount();
        if (!this.isMultiPhotoMode && photoCountSetting === null) return;

        try {
            this.layoutEngine = new PhotoLayoutEngine();
            this.layoutEngine.setContainerSize(containerType.width, containerType.height);
            this.layoutEngine.setTargetSize(targetType.width, targetType.height);
            this.layoutEngine.setGuideOptions(this.getSelectedGuideOptions());
            this.layoutEngine.setLayoutMode(this.getSelectedLayoutMode());

            const gapMm = Math.max(0, parseFloat(this.gapInputMm?.value) || 0);
            this.layoutEngine.setGapCM(gapMm / 10);

            const photoCount = this.isMultiPhotoMode
                ? this.layoutEngine.putMultiplePhotos(this.uploadedPhotos)
                : (photoCountSetting === 'auto'
                    ? this.layoutEngine.putPhoto(this.currentImage)
                    : this.layoutEngine.putPhotoWithCount(this.currentImage, photoCountSetting));

            this.currentPhotoCount = photoCount;
            this.renderPreview();

            if (this.photoCount) this.photoCount.textContent = photoCount;
            this.setPreviewEmpty(false);
            if (this.downloadBtn) this.downloadBtn.disabled = photoCount <= 0;
        } catch (error) {
            console.error('Error generating preview:', error);
            alert(this.config.texts.previewError);
        }
    }

    renderPreview() {
        if (!this.previewCanvas || !this.layoutEngine) return;
        const previewCanvas = this.layoutEngine.getPreviewCanvas(900, 720);

        if (this.previewCanvas.tagName === 'CANVAS') {
            const ctx = this.previewCanvas.getContext('2d');
            this.previewCanvas.width = previewCanvas.width;
            this.previewCanvas.height = previewCanvas.height;
            ctx.clearRect(0, 0, previewCanvas.width, previewCanvas.height);
            ctx.drawImage(previewCanvas, 0, 0);
            return;
        }

        this.previewCanvas.src = previewCanvas.toDataURL();
    }

    setPreviewEmpty(isEmpty) {
        if (this.previewSection) {
            this.previewSection.hidden = false;
            this.previewSection.classList.toggle('is-empty', isEmpty);
        }
        if (this.previewCanvas) this.previewCanvas.hidden = isEmpty;
        if (this.previewEmpty) this.previewEmpty.hidden = !isEmpty;
        if (isEmpty && this.photoCount) this.photoCount.textContent = '0';
    }

    downloadImage() {
        if (!this.layoutEngine) {
            alert(this.config.texts.generatePreviewFirst);
            return;
        }

        const targetType = this.getSelectedPhotoSize();
        const containerType = this.containerTypes[parseInt(this.containerTypeSelect?.value, 10)];
        if (!targetType || !containerType) {
            alert(this.config.texts.selectValidSizes);
            return;
        }

        const filename = this.buildFilename(this.currentPhotoCount || 0, targetType.name, containerType.name);

        try {
            this.layoutEngine.downloadImage(filename);
        } catch (error) {
            console.error('Error downloading image:', error);
            alert(this.config.texts.downloadError);
        }
    }

    buildFilename(count, photoName, paperName) {
        const uniquePrefix = this.isMultiPhotoMode ? `${this.uploadedPhotos.length}photos-` : '';
        return this.sanitizeFilename(`排版-${count}张-${uniquePrefix}${photoName}-${paperName}.jpg`);
    }

    sanitizeFilename(filename) {
        return filename
            .replace(/[\\/:*?"<>|]+/g, '-')
            .replace(/\s+/g, '-')
            .replace(/-+/g, '-')
            .slice(0, 160);
    }
}
