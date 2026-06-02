// Photo and paper size data.
const PHOTO_TYPES = [
    { name_zh: "1寸", width: 2.5, height: 3.5, category: "id" },
    { name_zh: "小一寸", width: 2.2, height: 3.2, category: "id" },
    { name_zh: "大一寸", width: 3.3, height: 4.8, category: "id" },
    { name_zh: "2寸", width: 3.8, height: 5.1, category: "id" },
    { name_zh: "小二寸", width: 3.5, height: 4.5, category: "id" },
    { name_zh: "大二寸", width: 3.5, height: 5.3, category: "id" },
    { name_zh: "身份证", width: 2.6, height: 3.2, category: "document" },
    { name_zh: "驾驶证", width: 2.2, height: 3.2, category: "document" },
    { name_zh: "中国护照", width: 3.3, height: 4.8, category: "document" },
    { name_zh: "港澳通行证", width: 3.3, height: 4.8, category: "document" },
    { name_zh: "普通证件照", width: 3.3, height: 4.8, category: "document" },
    { name_zh: "美国签证", width: 5.1, height: 5.1, category: "document" },
    { name_zh: "签证照 3.5x4.5", width: 3.5, height: 4.5, category: "document" },
    { name_zh: "日本签证", width: 4.5, height: 4.5, category: "document" },
    { name_zh: "结婚登记照", width: 5.3, height: 3.5, category: "document" },
    { name_zh: "5寸(3R)", width: 12.7, height: 8.9, category: "paper" },
    { name_zh: "6寸(4R)", width: 15.2, height: 10.2, category: "paper" },
    { name_zh: "7寸(5R)", width: 17.8, height: 12.7, category: "paper" },
    { name_zh: "8寸(6R)", width: 20.3, height: 15.2, category: "paper" },
    { name_zh: "10寸(8R)", width: 25.4, height: 20.3, category: "paper" },
    { name_zh: "4x6 相纸", width: 15.2, height: 10.2, category: "paper" },
    { name_zh: "A6", width: 10.5, height: 14.8, category: "paper" },
    { name_zh: "A5", width: 14.8, height: 21, category: "paper" },
    { name_zh: "A4", width: 21, height: 29.7, category: "paper" }
];

function getPhotoTypesByCategory(category) {
    return PHOTO_TYPES.filter(type => type.category === category);
}

function getPhotoTypeName(photoType) {
    if (!photoType) return '';
    return photoType.name_zh || photoType.name || '';
}

function getPhotoTypesByCategoryLocalized(category) {
    const types = getPhotoTypesByCategory(category);
    return types.map(type => ({
        ...type,
        name: getPhotoTypeName(type)
    }));
}

if (typeof module !== 'undefined' && module.exports) {
    module.exports = {
        PHOTO_TYPES,
        getPhotoTypesByCategory,
        getPhotoTypeName,
        getPhotoTypesByCategoryLocalized
    };
}
