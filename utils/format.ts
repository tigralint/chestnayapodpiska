/** Formats a number with space-separated thousands (e.g., 1000000 → "1 000 000") */
export const formatNumberSpace = (val: string | number): string => {
    if (!val) return '';
    return val.toString().replace(/\B(?=(\d{3})+(?!\d))/g, " ");
};
