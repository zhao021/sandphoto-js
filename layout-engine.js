class PhotoLayoutEngine {
    constructor() {
        this.CM_PER_INCH = 2.54;
        this.DPI = 600;
        this.containerWidth = 0;
        this.containerHeight = 0;
        this.targetWidth = 0;
        this.targetHeight = 0;
        this.canvas = null;
        this.ctx = null;
        this.gapPx = 5;
        this.lastLayout = null;
        this.guideOptions = {
            mode: 'through',
            color: '#2563eb',
            opacity: 0.9
        };
        this.layoutMode = 'balanced';
    }

    getPixelFromCM(value) {
        return Math.floor(value * this.DPI / this.CM_PER_INCH);
    }

    setContainerSize(width, height) {
        this.containerWidth = this.getPixelFromCM(width);
        this.containerHeight = this.getPixelFromCM(height);
    }

    setTargetSize(width, height) {
        this.targetWidth = this.getPixelFromCM(width);
        this.targetHeight = this.getPixelFromCM(height);
    }

    setGapPixels(pixels) {
        this.gapPx = Math.max(0, Math.floor(pixels));
    }

    setGapCM(cm) {
        this.gapPx = Math.max(0, this.getPixelFromCM(cm));
    }

    setGuideOptions(options = {}) {
        this.guideOptions = {
            ...this.guideOptions,
            ...options
        };
    }

    setLayoutMode(mode = 'balanced') {
        this.layoutMode = ['balanced', 'landscape', 'portrait'].includes(mode) ? mode : 'balanced';
    }

    createEmptyImage() {
        this.canvas = document.createElement('canvas');
        this.canvas.width = this.containerWidth;
        this.canvas.height = this.containerHeight;
        this.ctx = this.canvas.getContext('2d');
        this.ctx.fillStyle = '#ffffff';
        this.ctx.fillRect(0, 0, this.containerWidth, this.containerHeight);
    }

    getCropRect(img) {
        const w = img.naturalWidth || img.width;
        const h = img.naturalHeight || img.height;
        const sourceRatio = w / h;
        const targetRatio = this.targetWidth / this.targetHeight;

        if (sourceRatio > targetRatio) {
            const sw = h * targetRatio;
            return {
                sx: (w - sw) / 2,
                sy: 0,
                sw,
                sh: h
            };
        }

        const sh = w / targetRatio;
        return {
            sx: 0,
            sy: (h - sh) / 2,
            sw: w,
            sh
        };
    }

    calculateMaximumLayout(gap) {
        const normal = {
            cols: Math.max(0, Math.floor((this.containerWidth + gap) / (this.targetWidth + gap))),
            rows: Math.max(0, Math.floor((this.containerHeight + gap) / (this.targetHeight + gap))),
            containerWidth: this.containerWidth,
            containerHeight: this.containerHeight,
            rotated: false
        };

        const rotated = {
            cols: Math.max(0, Math.floor((this.containerHeight + gap) / (this.targetWidth + gap))),
            rows: Math.max(0, Math.floor((this.containerWidth + gap) / (this.targetHeight + gap))),
            containerWidth: this.containerHeight,
            containerHeight: this.containerWidth,
            rotated: true
        };

        return rotated.cols * rotated.rows > normal.cols * normal.rows ? rotated : normal;
    }

    calculateOptimalLayout(targetCount, gap, mode = this.layoutMode) {
        const candidates = [
            {
                maxCols: Math.max(0, Math.floor((this.containerWidth + gap) / (this.targetWidth + gap))),
                maxRows: Math.max(0, Math.floor((this.containerHeight + gap) / (this.targetHeight + gap))),
                containerWidth: this.containerWidth,
                containerHeight: this.containerHeight,
                rotated: false
            },
            {
                maxCols: Math.max(0, Math.floor((this.containerHeight + gap) / (this.targetWidth + gap))),
                maxRows: Math.max(0, Math.floor((this.containerWidth + gap) / (this.targetHeight + gap))),
                containerWidth: this.containerHeight,
                containerHeight: this.containerWidth,
                rotated: true
            }
        ];

        let bestLayout = null;
        let bestScore = Infinity;

        for (const candidate of candidates) {
            if (candidate.maxCols * candidate.maxRows < targetCount) continue;

            for (let cols = 1; cols <= Math.min(candidate.maxCols, targetCount); cols++) {
                const rows = Math.ceil(targetCount / cols);
                if (rows > candidate.maxRows) continue;

                const usedWidth = cols * this.targetWidth + (cols - 1) * gap;
                const usedHeight = rows * this.targetHeight + (rows - 1) * gap;
                const slots = cols * rows;
                const emptySlots = slots - targetCount;
                const unusedPaperArea = (candidate.containerWidth * candidate.containerHeight) - (usedWidth * usedHeight);
                const orientationPenalty = this.getOrientationPenalty(cols, rows, candidate.rotated, mode);
                const edgeWaste = Math.abs((candidate.containerWidth - usedWidth) - (candidate.containerHeight - usedHeight));
                const score =
                    emptySlots * this.targetWidth * this.targetHeight * 4 +
                    unusedPaperArea * 0.18 +
                    edgeWaste * 0.08 +
                    orientationPenalty;

                if (score < bestScore) {
                    bestScore = score;
                    bestLayout = {
                        cols,
                        rows,
                        containerWidth: candidate.containerWidth,
                        containerHeight: candidate.containerHeight,
                        rotated: candidate.rotated
                    };
                }
            }
        }

        return bestLayout;
    }

    getOrientationPenalty(cols, rows, rotated, mode) {
        if (mode === 'landscape') {
            return cols >= rows && !rotated ? 0 : this.targetWidth * this.targetHeight * 0.75;
        }
        if (mode === 'portrait') {
            return rows >= cols || rotated ? 0 : this.targetWidth * this.targetHeight * 0.75;
        }
        return Math.abs(cols - rows) * this.targetWidth * 0.08;
    }

    buildPhotoQueue(photoDataArray, limit = Infinity) {
        const queue = [];

        for (const photo of photoDataArray) {
            const copies = Math.max(0, parseInt(photo.copies, 10) || 0);
            const crop = this.getCropRect(photo.image);

            for (let i = 0; i < copies && queue.length < limit; i++) {
                queue.push({
                    img: photo.image,
                    crop
                });
            }
        }

        return queue;
    }

    getLayoutOrigin(layout, gap) {
        const totalWidth = layout.cols * this.targetWidth + (layout.cols - 1) * gap;
        const totalHeight = layout.rows * this.targetHeight + (layout.rows - 1) * gap;

        return {
            x: Math.round((this.containerWidth - totalWidth) / 2),
            y: Math.round((this.containerHeight - totalHeight) / 2)
        };
    }

    renderSheet(photoQueue, layout) {
        if (!layout || !photoQueue.length) return 0;

        this.containerWidth = layout.containerWidth;
        this.containerHeight = layout.containerHeight;
        this.createEmptyImage();

        const origin = this.getLayoutOrigin(layout, this.gapPx);
        const maxSlots = layout.cols * layout.rows;
        const items = [];
        let placedCount = 0;

        for (let row = 0; row < layout.rows && placedCount < Math.min(photoQueue.length, maxSlots); row++) {
            for (let col = 0; col < layout.cols && placedCount < Math.min(photoQueue.length, maxSlots); col++) {
                const photo = photoQueue[placedCount];
                const x = origin.x + col * (this.targetWidth + this.gapPx);
                const y = origin.y + row * (this.targetHeight + this.gapPx);
                const item = {
                    x,
                    y,
                    w: this.targetWidth,
                    h: this.targetHeight,
                    img: photo.img,
                    crop: photo.crop
                };

                this.drawPhotoItem(item);
                items.push(item);
                placedCount++;
            }
        }

        const layoutSnapshot = {
            containerWidth: this.containerWidth,
            containerHeight: this.containerHeight,
            cols: layout.cols,
            rows: layout.rows,
            gap: this.gapPx,
            origin,
            items,
            guideOptions: { ...this.guideOptions }
        };

        this.drawDashedBoundaryLines(layoutSnapshot);
        this.lastLayout = layoutSnapshot;

        return placedCount;
    }

    drawPhotoItem(item) {
        this.ctx.drawImage(
            item.img,
            item.crop.sx, item.crop.sy, item.crop.sw, item.crop.sh,
            item.x, item.y, item.w, item.h
        );
    }

    drawDashedBoundaryLines(layout) {
        const options = layout.guideOptions || this.guideOptions;

        this.ctx.save();
        this.ctx.globalAlpha = options.opacity ?? 0.9;
        this.ctx.strokeStyle = options.color || '#2563eb';
        this.ctx.lineWidth = Math.max(1, Math.round(this.DPI / 300));
        this.ctx.setLineDash([34, 22]);
        this.drawThroughEdgeLines(layout);
        this.ctx.restore();
    }

    drawThroughEdgeLines(layout) {
        const { xs, ys } = this.getPhotoEdgePositions(layout.items);

        this.ctx.beginPath();
        xs.forEach((x) => {
            const px = Math.round(x) + 0.5;
            this.ctx.moveTo(px, 0);
            this.ctx.lineTo(px, this.containerHeight);
        });
        ys.forEach((y) => {
            const py = Math.round(y) + 0.5;
            this.ctx.moveTo(0, py);
            this.ctx.lineTo(this.containerWidth, py);
        });
        this.ctx.stroke();
    }

    getPhotoEdgePositions(items) {
        const round = (value) => Math.round(value);
        const unique = (values) => [...new Set(values.map(round))].sort((a, b) => a - b);

        return {
            xs: unique(items.flatMap((item) => [item.x, item.x + item.w])),
            ys: unique(items.flatMap((item) => [item.y, item.y + item.h]))
        };
    }

    putPhoto(imageElement) {
        const layout = this.calculateMaximumLayout(this.gapPx);
        const count = layout.cols * layout.rows;
        const queue = this.buildPhotoQueue([{ image: imageElement, copies: count }]);
        return this.renderSheet(queue, layout);
    }

    putPhotoWithCount(imageElement, targetCount) {
        const count = Math.max(1, parseInt(targetCount, 10) || 1);
        const layout = this.calculateOptimalLayout(count, this.gapPx) || this.calculateMaximumLayout(this.gapPx);
        const queue = this.buildPhotoQueue([{ image: imageElement, copies: count }], layout.cols * layout.rows);
        return this.renderSheet(queue, layout);
    }

    putMultiplePhotos(photoDataArray) {
        if (!photoDataArray || !photoDataArray.length) return 0;

        const totalPhotos = photoDataArray.reduce((sum, photo) => {
            return sum + Math.max(0, parseInt(photo.copies, 10) || 0);
        }, 0);

        if (!totalPhotos) return 0;

        const layout = this.calculateOptimalLayout(totalPhotos, this.gapPx) || this.calculateMaximumLayout(this.gapPx);
        const queue = this.buildPhotoQueue(photoDataArray, layout.cols * layout.rows);
        return this.renderSheet(queue, layout);
    }

    getPreviewCanvas(maxWidth = 800, maxHeight = 600) {
        const previewCanvas = document.createElement('canvas');
        const previewCtx = previewCanvas.getContext('2d');

        if (!this.canvas) {
            previewCanvas.width = 1;
            previewCanvas.height = 1;
            return previewCanvas;
        }

        const scale = Math.min(maxWidth / this.canvas.width, maxHeight / this.canvas.height, 1);
        previewCanvas.width = Math.max(1, Math.floor(this.canvas.width * scale));
        previewCanvas.height = Math.max(1, Math.floor(this.canvas.height * scale));
        previewCtx.imageSmoothingEnabled = true;
        previewCtx.drawImage(this.canvas, 0, 0, previewCanvas.width, previewCanvas.height);

        return previewCanvas;
    }

    downloadImage(filename) {
        if (!this.canvas) {
            throw new Error('No image generated yet');
        }

        this.canvas.toBlob((blob) => {
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = filename;
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            URL.revokeObjectURL(url);
        }, 'image/jpeg', 0.98);
    }

    getCanvas() {
        return this.canvas;
    }

    destroy() {
        if (!this.canvas) return;
        this.canvas.width = 0;
        this.canvas.height = 0;
        this.canvas = null;
        this.ctx = null;
        this.lastLayout = null;
    }
}

if (typeof module !== 'undefined' && module.exports) {
    module.exports = PhotoLayoutEngine;
}
