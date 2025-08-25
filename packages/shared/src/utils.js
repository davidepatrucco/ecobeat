"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.calculatePoints = exports.calculateCO2Impact = exports.isValidPassword = exports.isValidEmail = exports.slugify = exports.capitalize = exports.roundToDecimals = exports.formatCurrency = exports.formatNumber = exports.getMonthPeriod = exports.getWeekNumber = exports.formatDateTime = exports.formatDate = void 0;
// Date utilities
const formatDate = (date, locale = 'it-IT') => {
    return new Intl.DateTimeFormat(locale, {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
    }).format(date);
};
exports.formatDate = formatDate;
const formatDateTime = (date, locale = 'it-IT') => {
    return new Intl.DateTimeFormat(locale, {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
    }).format(date);
};
exports.formatDateTime = formatDateTime;
const getWeekNumber = (date) => {
    const startDate = new Date(date.getFullYear(), 0, 1);
    const days = Math.floor((date.getTime() - startDate.getTime()) / (24 * 60 * 60 * 1000));
    const weekNumber = Math.ceil(days / 7);
    return `${date.getFullYear()}-W${weekNumber.toString().padStart(2, '0')}`;
};
exports.getWeekNumber = getWeekNumber;
const getMonthPeriod = (date) => {
    return `${date.getFullYear()}-${(date.getMonth() + 1).toString().padStart(2, '0')}`;
};
exports.getMonthPeriod = getMonthPeriod;
// Number utilities
const formatNumber = (num, locale = 'it-IT') => {
    return new Intl.NumberFormat(locale).format(num);
};
exports.formatNumber = formatNumber;
const formatCurrency = (amount, currency = 'EUR', locale = 'it-IT') => {
    return new Intl.NumberFormat(locale, {
        style: 'currency',
        currency,
    }).format(amount);
};
exports.formatCurrency = formatCurrency;
const roundToDecimals = (num, decimals = 2) => {
    return Math.round(num * Math.pow(10, decimals)) / Math.pow(10, decimals);
};
exports.roundToDecimals = roundToDecimals;
// String utilities
const capitalize = (str) => {
    return str.charAt(0).toUpperCase() + str.slice(1).toLowerCase();
};
exports.capitalize = capitalize;
const slugify = (str) => {
    return str
        .toLowerCase()
        .trim()
        .replace(/[^\w\s-]/g, '')
        .replace(/[\s_-]+/g, '-')
        .replace(/^-+|-+$/g, '');
};
exports.slugify = slugify;
// Validation utilities
const isValidEmail = (email) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
};
exports.isValidEmail = isValidEmail;
const isValidPassword = (password) => {
    // At least 8 characters, 1 uppercase, 1 lowercase, 1 number
    const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)[a-zA-Z\d@$!%*?&]{8,}$/;
    return passwordRegex.test(password);
};
exports.isValidPassword = isValidPassword;
// CO2 calculation utilities
const calculateCO2Impact = (activityType, subtype, quantity, metadata) => {
    // This is a simplified calculation - in production, this would use the factors from constants
    // and more complex logic based on activity type and metadata
    const baseFactors = {
        'commute-car': 0.21,
        'commute-bus': 0.08,
        'commute-bike': 0,
        'commute-walk': 0,
        'meal-meat': 3.3,
        'meal-veg': 1.7,
        'recycle-plastic': -0.5, // Negative because it saves CO2
        'energy-kwh': 0.47,
    };
    const key = `${activityType}-${subtype}`;
    const factor = baseFactors[key] || 0;
    // If metadata includes distance for commute, use it
    if (activityType === 'commute' && metadata?.distanceKm) {
        return factor * metadata.distanceKm;
    }
    return factor * quantity;
};
exports.calculateCO2Impact = calculateCO2Impact;
// Points calculation utilities
const calculatePoints = (co2Saved, activityType) => {
    // Base points for CO2 saved (1 point per 100g CO2 saved)
    const basePoints = Math.floor(co2Saved * 10);
    // Bonus points for specific activity types
    const bonusFactors = {
        commute: 1.2,
        meal: 1.5,
        recycle: 2.0,
        energy: 1.0,
    };
    const bonus = bonusFactors[activityType] || 1.0;
    return Math.floor(basePoints * bonus);
};
exports.calculatePoints = calculatePoints;
